import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import { newDb } from 'pg-mem';

import {
  ApplicationValidationError,
  createPlaytestStore,
  makeReference,
  normaliseApplication
} from './playtest-store.mjs';
import { applicationNotice, createPlaytestRouter, normaliseSubmission } from './playtest.mjs';
import { createMailer } from './mailer.mjs';
import { makeSession } from './admin-session.mjs';
import { study } from './data/playtest.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const ADMIN_PASSWORD = 'correct horse battery staple';
const SESSION_SECRET = 'a-test-session-secret-that-is-longer-than-32-characters';

function createMemoryPool() {
  const memory = newDb({ autoCreateForeignKeyIndices: true });
  const adapter = memory.adapters.createPg();
  return new adapter.Pool();
}

function applicationInput(overrides = {}) {
  return {
    email: 'Tester@Example.com',
    horizonUsername: 'WarriorMama365',
    headset: 'quest-3',
    vrFrequency: 'monthly',
    captureMethod: 'recording',
    recentGames: 'Walkabout Mini Golf, Red Matter 2',
    country: 'Canada',
    notes: '',
    ageGroup: 'adult',
    paypalOk: 'yes',
    canFinish: 'yes',
    acceptedTerms: 'yes',
    ...overrides
  };
}

async function startServer(options = {}) {
  const store = await createPlaytestStore({ pool: createMemoryPool() });
  const app = express();
  app.set('view engine', 'pug');
  app.set('views', path.join(root, 'views'));
  app.locals.siteUrl = 'https://www.buriedworlds.com';
  app.locals.product = { name: 'Buried Worlds VR' };
  app.locals.links = { discord: 'https://discord.gg/example' };
  app.locals.trailer = {};
  const { locals = {}, ...routerOptions } = options;
  Object.assign(app.locals, locals);
  app.use(createPlaytestRouter({
    store,
    adminPassword: ADMIN_PASSWORD,
    sessionSecret: SESSION_SECRET,
    onError: () => {},
    ...routerOptions
  }));
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  return {
    store,
    url: `http://127.0.0.1:${server.address().port}`,
    stop: async () => {
      await new Promise((resolve) => server.close(resolve));
      await store.close();
    }
  };
}

function adminCookie(now = Date.now()) {
  const expiresAt = now + 60 * 60 * 1000;
  return `bw_admin=${makeSession(SESSION_SECRET, expiresAt)}`;
}

async function apply(url, fields = applicationInput(), extra = {}) {
  return fetch(`${url}/playtest`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...fields, ...extra }),
    redirect: 'manual'
  });
}

// ---- Validation --------------------------------------------------------

test('an application is normalised, and the answers that gate it are required', () => {
  const application = normaliseApplication(applicationInput({ horizonUsername: '@WarriorMama365' }));
  assert.equal(application.email, 'tester@example.com', 'the address is lowercased for matching');
  assert.equal(application.horizonUsername, 'WarriorMama365', 'a typed-in @ is stripped, not rejected');
  assert.equal(application.playedBefore, false);
  assert.equal(application.termsVersion, study.termsVersion, 'the deal on screen is stored with the row');

  for (const field of ['paypalOk', 'canFinish', 'acceptedTerms']) {
    assert.throws(
      () => normaliseApplication(applicationInput({ [field]: '' })),
      (error) => error instanceof ApplicationValidationError && error.field === field,
      `${field} must be ticked`
    );
  }
});

test('validation rejects bad values and names the field that failed', () => {
  const cases = [
    ['email', { email: 'not-an-address' }],
    ['email', { email: '' }],
    ['horizonUsername', { horizonUsername: 'has spaces' }],
    ['headset', { headset: 'valve-index' }],
    ['vrFrequency', { vrFrequency: 'sometimes' }],
    ['captureMethod', { captureMethod: 'telepathy' }],
    ['recentGames', { recentGames: '' }],
    ['country', { country: '' }],
    ['ageGroup', { ageGroup: '' }],
    ['ageGroup', { ageGroup: 'child' }]
  ];
  for (const [field, overrides] of cases) {
    assert.throws(
      () => normaliseApplication(applicationInput(overrides)),
      (error) => error instanceof ApplicationValidationError && error.field === field,
      `${field}: ${JSON.stringify(overrides)}`
    );
  }
});

test('a 13-to-17 applicant is accepted, recorded, and flagged for the developer', async () => {
  const minor = normaliseApplication(applicationInput({ ageGroup: 'minor' }));
  assert.equal(minor.ageGroup, 'minor');

  const sent = [];
  const server = await startServer({
    siteUrl: 'https://www.buriedworlds.com',
    notify: { to: 'owner@example.com', sendQuietly: async (message) => { sent.push(message); } }
  });
  try {
    const response = await apply(server.url, applicationInput({ ageGroup: 'minor' }));
    assert.equal(response.status, 201);
    await response.text();
    const [stored] = await server.store.listApplications();
    assert.equal(stored.ageGroup, 'minor');
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.ok(sent[0].text.includes('Age:        13–17, with a guardian'));

    const cookie = adminCookie();
    const list = await (await fetch(`${server.url}/admin/playtest`, { headers: { cookie } })).text();
    assert.ok(list.includes('Under 18 · guardian'));
    const detail = await (await fetch(`${server.url}/admin/playtest/${stored.id}`, { headers: { cookie } })).text();
    assert.ok(detail.includes('a parent or guardian agreed and receives the payment'));
    const csv = await (await fetch(`${server.url}/admin/playtest/export.csv`, { headers: { cookie } })).text();
    assert.ok(csv.split('\n')[0].includes('age_group'));
    assert.ok(csv.includes('"minor"'));
  } finally {
    await server.stop();
  }
});

test('an over-long free-text answer is refused rather than silently truncated', () => {
  assert.throws(
    () => normaliseApplication(applicationInput({ notes: 'x'.repeat(1001) })),
    ApplicationValidationError
  );
  assert.doesNotThrow(() => normaliseApplication(applicationInput({ notes: 'x'.repeat(1000) })));
});

test('references avoid characters that are misread when quoted back', () => {
  const reference = makeReference();
  assert.match(reference, /^BW-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
});

// ---- Storage -----------------------------------------------------------

test('a second application from one address returns the original, unchanged', async () => {
  const store = await createPlaytestStore({ pool: createMemoryPool() });
  try {
    const first = await store.createApplication(applicationInput());
    assert.equal(first.duplicate, false);

    await store.setStatus(first.application.id, 'joined');

    const again = await store.createApplication(applicationInput({
      email: 'TESTER@example.com',
      headset: 'quest-2'
    }));
    assert.equal(again.duplicate, true);
    assert.equal(again.application.reference, first.application.reference);
    assert.equal(again.application.status, 'joined', 'a re-application cannot undo a screening decision');
    assert.equal(again.application.headset, 'quest-3', 'nor overwrite what was originally said');

    const summary = await store.summarise();
    assert.equal(summary.total, 1);
  } finally {
    await store.close();
  }
});

test('a table from before the age question gains the column, with earlier rows as adults', async () => {
  const pool = createMemoryPool();
  // The table as it shipped on 9 September, one row in it.
  await pool.query(`
    CREATE TABLE playtest_applications (
      id BIGSERIAL PRIMARY KEY, reference TEXT NOT NULL, email TEXT NOT NULL,
      horizon_username TEXT NOT NULL, headset TEXT NOT NULL, vr_frequency TEXT NOT NULL,
      capture_method TEXT NOT NULL, recent_games TEXT NOT NULL DEFAULT '', country TEXT NOT NULL DEFAULT '',
      played_before BOOLEAN NOT NULL DEFAULT FALSE, notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new', admin_note TEXT NOT NULL DEFAULT '', terms_version TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      invited_at TIMESTAMPTZ, joined_at TIMESTAMPTZ, paid_at TIMESTAMPTZ
    )`);
  await pool.query(`INSERT INTO playtest_applications (reference, email, horizon_username, headset, vr_frequency, capture_method)
    VALUES ('BW-OLD001', 'old@example.com', 'Old', 'quest-2', 'monthly', 'recording')`);

  const store = await createPlaytestStore({ pool });
  try {
    const [old] = await store.listApplications();
    assert.equal(old.reference, 'BW-OLD001');
    assert.equal(old.ageGroup, 'adult', 'the form required 18+ at the time, so earlier rows are adults');
    const { application } = await store.createApplication(applicationInput({ ageGroup: 'minor' }));
    assert.equal(application.ageGroup, 'minor', 'and new rows use the column');
  } finally {
    await store.close();
  }
});

test('funnel timestamps are stamped once and survive a status being walked back', async () => {
  const store = await createPlaytestStore({ pool: createMemoryPool() });
  try {
    const { application } = await store.createApplication(applicationInput());
    assert.equal(application.invitedAt, null);

    const invited = await store.setStatus(application.id, 'invited');
    assert.ok(invited.invitedAt, 'inviting stamps the date');

    const joined = await store.setStatus(application.id, 'joined');
    assert.equal(joined.invitedAt, invited.invitedAt, 'moving on does not clear it');

    const backToInvited = await store.setStatus(application.id, 'invited');
    assert.equal(
      backToInvited.invitedAt,
      invited.invitedAt,
      'correcting a mistake must not rewrite when the invitation actually went out'
    );

    await assert.rejects(
      () => store.setStatus(application.id, 'promoted'),
      ApplicationValidationError
    );
  } finally {
    await store.close();
  }
});

test('a private note is kept when a status changes without one', async () => {
  const store = await createPlaytestStore({ pool: createMemoryPool() });
  try {
    const { application } = await store.createApplication(applicationInput());
    await store.setStatus(application.id, 'waitlist', 'Second Quest 3 — hold for wave two.');
    const moved = await store.setStatus(application.id, 'invited', null);
    assert.equal(moved.adminNote, 'Second Quest 3 — hold for wave two.');
  } finally {
    await store.close();
  }
});

// ---- The public page ---------------------------------------------------

test('the page states the fee and carries neither analytics nor an index invitation', async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.url}/playtest`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.match(html, /noindex,nofollow/, 'the page asks not to be indexed');
    assert.ok(html.includes(study.fee), 'the fee is on the page');
    assert.ok(!html.includes('googletagmanager'), 'the study page runs no analytics');
    assert.ok(html.includes('name="acceptedTerms"'), 'the consent boxes are present');
    assert.ok(html.includes('name="ageGroup"') && html.includes('name="paypalOk"'), 'age and PayPal are asked');
    assert.ok(!html.includes('name="over18"'), 'the old 18+ box is gone');
  } finally {
    await server.stop();
  }
});

test('a complete application is stored and answered with its reference', async () => {
  const server = await startServer();
  try {
    const response = await apply(server.url);
    const html = await response.text();
    assert.equal(response.status, 201);

    const [stored] = await server.store.listApplications();
    assert.equal(stored.email, 'tester@example.com');
    assert.equal(stored.status, 'new');
    assert.ok(html.includes(stored.reference), 'the applicant is shown their reference');
    assert.equal(
      response.headers.get('location'),
      null,
      'the reference is rendered, never redirected into a URL'
    );
  } finally {
    await server.stop();
  }
});

test('a rejected application comes back filled in, with the message on the right field', async () => {
  const server = await startServer();
  try {
    const response = await apply(server.url, applicationInput({
      email: 'not-an-address',
      notes: 'Left-handed and seated only'
    }));
    const html = await response.text();
    assert.equal(response.status, 400);
    assert.ok(html.includes('does not look like an email address'));
    assert.ok(html.includes('Left-handed and seated only'), 'the other answers are not thrown away');
    assert.ok(html.includes('playtest-field--error'), 'the failing field is marked');
    assert.equal((await server.store.listApplications()).length, 0);
  } finally {
    await server.stop();
  }
});

test('the honeypot is answered like a success and stores nothing', async () => {
  const server = await startServer();
  try {
    const response = await apply(server.url, applicationInput(), { website: 'https://spam.example' });
    assert.equal(response.status, 202);
    assert.equal((await server.store.listApplications()).length, 0);
  } finally {
    await server.stop();
  }
});

test('a closed round shows the form to nobody and accepts nothing', async () => {
  const server = await startServer({ applicationsOpen: false });
  try {
    const page = await fetch(`${server.url}/playtest`);
    const html = await page.text();
    assert.ok(html.includes('closed'));
    assert.ok(!html.includes('name="acceptedTerms"'), 'the form is not rendered at all');

    const response = await apply(server.url);
    assert.equal(response.status, 403);
    assert.equal((await server.store.listApplications()).length, 0);
  } finally {
    await server.stop();
  }
});

test('a form token that is missing, forged or answered instantly is refused', async () => {
  let clock = 1_000_000_000_000;
  const server = await startServer({
    formSecret: 'a-playtest-form-secret-longer-than-32-characters',
    now: () => clock
  });
  try {
    const page = await fetch(`${server.url}/playtest`);
    const html = await page.text();
    const token = /name="formToken" value="([^"]+)"/.exec(html)?.[1];
    assert.ok(token, 'the page issues a token');

    const instant = await apply(server.url, applicationInput(), { formToken: token });
    assert.equal(instant.status, 400, 'nobody reads the conditions in under three seconds');

    const forged = await apply(server.url, applicationInput(), { formToken: `${clock}.wrong` });
    assert.equal(forged.status, 400);

    const missing = await apply(server.url);
    assert.equal(missing.status, 400);

    clock += 30_000;
    const accepted = await apply(server.url, applicationInput(), { formToken: token });
    assert.equal(accepted.status, 201);

    clock += 13 * 60 * 60 * 1000;
    const stale = await apply(server.url, applicationInput({ email: 'other@example.com' }), {
      formToken: token
    });
    assert.equal(stale.status, 400, 'a tab left open overnight is asked to send again');
    const html2 = await stale.text();
    assert.ok(html2.includes('open too long'));
  } finally {
    await server.stop();
  }
});

test('one connection cannot bury the study in applications', async () => {
  const server = await startServer();
  try {
    let lastStatus = 0;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await apply(server.url, applicationInput({
        email: `tester${attempt}@example.com`
      }));
      lastStatus = response.status;
      await response.text();
    }
    assert.equal(lastStatus, 429);
    assert.equal((await server.store.listApplications()).length, 8);
  } finally {
    await server.stop();
  }
});

// ---- Questionnaire -----------------------------------------------------

const FORM_SECRET = 'a-playtest-form-secret-longer-than-32-characters!!';

function submissionInput(overrides = {}) {
  const answers = Object.fromEntries(
    ['first-goal', 'confusion', 'detect-dig', 'best-moment', 'wanted-to-stop', 'discomfort', 'play-again']
      .map((id) => [`answer_${id}`, `My answer about ${id}.`])
  );
  return {
    ...answers,
    headsetPlayed: 'quest-3',
    minutesPlayed: '24',
    progressReturned: 'yes',
    evidenceUrl: 'https://drive.google.com/example-screenshot',
    clipUrl: '',
    evidenceNote: '',
    paypalAccount: 'tester-paypal@example.com',
    ownAnswers: 'yes',
    ...overrides
  };
}

async function post(url, path, fields) {
  return fetch(`${url}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields),
    redirect: 'manual'
  });
}

function tokenFrom(html) {
  return /name="submissionToken" value="([^"]+)"/.exec(html)?.[1] ?? '';
}

/** An applicant who has been invited, ready to submit. */
async function invitedApplicant(server, overrides = {}) {
  const { application } = await server.store.createApplication(applicationInput(overrides));
  return server.store.setStatus(application.id, 'invited');
}

test('the questionnaire page shows the brief and questions, and no email address', async () => {
  const server = await startServer({ formSecret: FORM_SECRET });
  try {
    const response = await fetch(`${server.url}/playtest/questionnaire`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
    const { questionnaire } = await import('./data/playtest.mjs');
    for (const question of questionnaire.questions) assert.ok(html.includes(question.text.replace(/'/g, '&#39;')), question.id);
    assert.ok(!html.includes('mailto:'), 'no address on the page');
    assert.ok(!html.includes('@bellare.com.au') && !html.includes('@buriedworlds.com'));
    assert.ok(html.includes('name="reference"') && html.includes('name="email"'), 'the lookup form');
    assert.ok(!html.includes('name="paypalAccount"'), 'the submission form is not shown before a match');
  } finally {
    await server.stop();
  }
});

test('the lookup gives one answer to a wrong reference, a wrong email, and a stranger', async () => {
  const server = await startServer({ formSecret: FORM_SECRET });
  try {
    const stored = await invitedApplicant(server);
    const attempts = [
      { reference: 'BW-NOPE00', email: 'tester@example.com' },
      { reference: stored.reference, email: 'someone-else@example.com' },
      { reference: '', email: '' }
    ];
    let expected = null;
    for (const fields of attempts) {
      const response = await post(server.url, '/playtest/questionnaire/find', fields);
      const html = await response.text();
      assert.equal(response.status, 404, JSON.stringify(fields));
      const message = /<p class="admin-alert" role="alert">([^<]*)<\/p>/.exec(html)?.[1];
      assert.ok(message && message.includes('couldn'), 'a generic message');
      expected ??= message;
      assert.equal(message, expected, 'identical for every failure');
      assert.ok(!html.includes('name="paypalAccount"'));
    }
    // The right pair opens the form, prefilled with the headset they applied on.
    const ok = await post(server.url, '/playtest/questionnaire/find', { reference: stored.reference.toLowerCase(), email: 'TESTER@example.com' });
    const html = await ok.text();
    assert.equal(ok.status, 200);
    assert.ok(html.includes('name="paypalAccount"'));
    assert.ok(tokenFrom(html));
    assert.ok(html.includes('value="quest-3" checked'));
  } finally {
    await server.stop();
  }
});

test('only an application that was offered a place can submit', async () => {
  const server = await startServer({ formSecret: FORM_SECRET });
  try {
    const { application: stored } = await server.store.createApplication(applicationInput());
    const expectations = [
      ['new', 403, 'hasn'], ['waitlist', 403, 'hasn'], ['declined', 403, 'hasn'],
      ['invited', 200, 'paypalAccount'], ['joined', 200, 'paypalAccount'], ['testing', 200, 'paypalAccount'],
      ['paid', 403, 'closed']
    ];
    for (const [status, code, marker] of expectations) {
      await server.store.setStatus(stored.id, status);
      const response = await post(server.url, '/playtest/questionnaire/find', { reference: stored.reference, email: 'tester@example.com' });
      const html = await response.text();
      assert.equal(response.status, code, status);
      assert.ok(html.includes(marker), `${status}: ${marker}`);
    }
  } finally {
    await server.stop();
  }
});

test('a submission is stored, flips the status, tells both people, and never puts the PayPal account in the note', async () => {
  const sent = [];
  const server = await startServer({
    formSecret: FORM_SECRET, siteUrl: 'https://www.buriedworlds.com',
    notify: { to: 'owner@example.com', sendQuietly: async (message) => { sent.push(message); } }
  });
  try {
    const stored = await invitedApplicant(server);
    sent.length = 0;
    const found = await (await post(server.url, '/playtest/questionnaire/find', { reference: stored.reference, email: 'tester@example.com' })).text();
    const token = tokenFrom(found);

    const response = await post(server.url, '/playtest/questionnaire', { submissionToken: token, ...submissionInput() });
    const html = await response.text();
    assert.equal(response.status, 201);
    assert.ok(html.includes('Submission received'));

    const application = await server.store.getById(stored.id);
    assert.equal(application.status, 'submitted');
    const submission = await server.store.getSubmission(stored.id);
    assert.equal(submission.paypalAccount, 'tester-paypal@example.com');
    assert.equal(submission.minutesPlayed, 24);
    assert.equal(submission.answers['first-goal'], 'My answer about first-goal.');
    assert.equal(submission.submissionCount, 1);

    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(sent.length, 2, 'one to the developer, one to the tester');
    const toOwner = sent.find((message) => message.to === 'owner@example.com');
    const toTester = sent.find((message) => message.to === 'tester@example.com');
    assert.ok(toOwner && toTester);
    assert.ok(toOwner.subject.includes(stored.reference) && toOwner.text.includes(`/admin/playtest/${stored.id}`));
    for (const secret of ['tester-paypal@example.com', 'My answer about', 'drive.google.com', 'tester@example.com']) {
      assert.ok(!toOwner.text.includes(secret) && !toOwner.subject.includes(secret), `developer note must not carry ${secret}`);
    }
    assert.ok(toTester.text.includes('48 hours') && toTester.text.includes(stored.reference));
    assert.ok(!toTester.text.includes('tester-paypal@example.com'), 'the receipt does not echo the PayPal account');
  } finally {
    await server.stop();
  }
});

test('a correction replaces the answers, keeps the first date, counts versions, and is closed once paid', async () => {
  const server = await startServer({ formSecret: FORM_SECRET });
  try {
    const stored = await invitedApplicant(server);
    const first = await server.store.saveSubmission(stored.id, submissionInput());
    assert.equal(first.corrected, false);

    const again = await (await post(server.url, '/playtest/questionnaire/find', { reference: stored.reference, email: 'tester@example.com' })).text();
    assert.ok(again.includes('replaces those answers'), 'the form says it is a correction');
    assert.ok(again.includes('tester-paypal@example.com'), 'and starts filled in');
    const token = tokenFrom(again);
    const response = await post(server.url, '/playtest/questionnaire', { submissionToken: token, ...submissionInput({ minutesPlayed: '31', paypalAccount: 'corrected@example.com' }) });
    assert.equal(response.status, 200);
    assert.ok((await response.text()).includes('Update received'));

    const submission = await server.store.getSubmission(stored.id);
    assert.equal(submission.minutesPlayed, 31);
    assert.equal(submission.paypalAccount, 'corrected@example.com');
    assert.equal(submission.submissionCount, 2);
    assert.equal(submission.submittedAt, first.submission.submittedAt, 'the payment clock does not restart');

    await server.store.setStatus(stored.id, 'paid');
    const closed = await post(server.url, '/playtest/questionnaire', { submissionToken: token, ...submissionInput() });
    assert.equal(closed.status, 403);
    await closed.text();
  } finally {
    await server.stop();
  }
});

test('a forged, expired or missing token cannot submit, and validation names the field', async () => {
  let clock = 1_700_000_000_000;
  const server = await startServer({ formSecret: FORM_SECRET, now: () => clock });
  try {
    const stored = await invitedApplicant(server);
    for (const token of ['', `${stored.id}.${clock + 1000}.forged`, 'nonsense']) {
      const response = await post(server.url, '/playtest/questionnaire', { submissionToken: token, ...submissionInput() });
      assert.equal(response.status, 403, token || '(empty)');
      await response.text();
    }
    const found = await (await post(server.url, '/playtest/questionnaire/find', { reference: stored.reference, email: 'tester@example.com' })).text();
    const token = tokenFrom(found);

    const bad = await post(server.url, '/playtest/questionnaire', { submissionToken: token, ...submissionInput({ evidenceUrl: 'http://not-secure.example', 'answer_confusion': '' }) });
    const html = await bad.text();
    assert.equal(bad.status, 400);
    assert.ok(html.includes('playtest-field--error'));
    assert.ok(html.includes('My answer about first-goal.'), 'other answers survive a rejection');
    assert.equal(await server.store.getSubmission(stored.id), null);

    clock += 25 * 60 * 60 * 1000;
    const expired = await post(server.url, '/playtest/questionnaire', { submissionToken: token, ...submissionInput() });
    assert.equal(expired.status, 403);
    await expired.text();
  } finally {
    await server.stop();
  }
});

test('submission validation', () => {
  assert.doesNotThrow(() => normaliseSubmission(submissionInput()));
  assert.doesNotThrow(() => normaliseSubmission(submissionInput({ paypalAccount: 'paypal.me/CyrilG' })));
  assert.doesNotThrow(() => normaliseSubmission(submissionInput({ paypalAccount: 'https://www.paypal.me/CyrilG' })));
  assert.equal(normaliseSubmission(submissionInput()).clipUrl, '', 'the clip is optional');
  assert.equal(normaliseSubmission(submissionInput({ clipUrl: 'https://youtu.be/x' })).clipUrl, 'https://youtu.be/x');
  const cases = [
    ['paypalAccount', { paypalAccount: '' }], ['paypalAccount', { paypalAccount: '!!' }],
    ['evidenceUrl', { evidenceUrl: 'not a link' }], ['evidenceUrl', { evidenceUrl: 'http://insecure.example/x' }],
    ['clipUrl', { clipUrl: 'http://insecure.example/clip' }],
    ['minutesPlayed', { minutesPlayed: 'twenty' }], ['minutesPlayed', { minutesPlayed: '0' }], ['minutesPlayed', { minutesPlayed: '9999' }],
    ['headsetPlayed', { headsetPlayed: 'index' }], ['progressReturned', { progressReturned: 'maybe' }],
    ['answer_play-again', { 'answer_play-again': '   ' }], ['answer_confusion', { answer_confusion: 'x'.repeat(2001) }],
    ['ownAnswers', { ownAnswers: '' }]
  ];
  for (const [field, overrides] of cases) {
    assert.throws(() => normaliseSubmission(submissionInput(overrides)),
      (error) => error instanceof ApplicationValidationError && error.field === field, `${field}: ${JSON.stringify(overrides)}`);
  }
});

test('the dashboard shows the submission and the PayPal account, exports it, and deletes it with the application', async () => {
  const server = await startServer({ formSecret: FORM_SECRET });
  try {
    const stored = await invitedApplicant(server);
    await server.store.saveSubmission(stored.id, submissionInput());
    const cookie = adminCookie();

    const list = await (await fetch(`${server.url}/admin/playtest`, { headers: { cookie } })).text();
    assert.ok(!list.includes('tester-paypal@example.com'), 'the PayPal account is not on the list page');
    assert.ok(list.includes('href="/admin/playtest/submissions.csv"'));

    const detail = await (await fetch(`${server.url}/admin/playtest/${stored.id}`, { headers: { cookie } })).text();
    assert.ok(detail.includes('tester-paypal@example.com'), 'but is on the detail page');
    assert.ok(detail.includes('My answer about first-goal.'));
    assert.ok(detail.includes('href="https://drive.google.com/example-screenshot"'));

    const csv = await (await fetch(`${server.url}/admin/playtest/submissions.csv`, { headers: { cookie } })).text();
    assert.ok(csv.startsWith('reference,email,status,submitted_at'));
    assert.ok(csv.includes('answer_first-goal') && csv.includes('"tester-paypal@example.com"'));

    const csrf = /name="_csrf" value="([^"]+)"/.exec(detail)?.[1];
    const del = await fetch(`${server.url}/admin/playtest/${stored.id}/delete`, {
      method: 'POST', headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ _csrf: csrf }), redirect: 'manual'
    });
    assert.equal(del.status, 303);
    assert.equal(await server.store.getSubmission(stored.id), null, 'the submission — and its PayPal account — goes with the application');
    assert.equal((await server.store.listSubmissions()).length, 0);
  } finally {
    await server.stop();
  }
});

test('a submissions table from before the optional clip gains the column', async () => {
  const pool = createMemoryPool();
  // Both tables as they first shipped: applications with age_group, submissions without clip_url.
  await pool.query(`CREATE TABLE playtest_applications (
    id BIGSERIAL PRIMARY KEY, reference TEXT NOT NULL, email TEXT NOT NULL, horizon_username TEXT NOT NULL,
    headset TEXT NOT NULL, vr_frequency TEXT NOT NULL, capture_method TEXT NOT NULL, recent_games TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '', played_before BOOLEAN NOT NULL DEFAULT FALSE, age_group TEXT NOT NULL DEFAULT 'adult',
    notes TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'new', admin_note TEXT NOT NULL DEFAULT '',
    terms_version TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    invited_at TIMESTAMPTZ, joined_at TIMESTAMPTZ, paid_at TIMESTAMPTZ)`);
  await pool.query(`CREATE TABLE playtest_submissions (
    id BIGSERIAL PRIMARY KEY, application_id BIGINT NOT NULL REFERENCES playtest_applications(id),
    answers TEXT NOT NULL DEFAULT '{}', headset_played TEXT NOT NULL, minutes_played INTEGER NOT NULL,
    progress_returned TEXT NOT NULL, evidence_url TEXT NOT NULL, evidence_note TEXT NOT NULL DEFAULT '',
    paypal_account TEXT NOT NULL, submission_count INTEGER NOT NULL DEFAULT 1,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await pool.query(`CREATE UNIQUE INDEX playtest_submissions_application ON playtest_submissions (application_id)`);
  const store = await createPlaytestStore({ pool });
  const { application } = await store.createApplication(applicationInput());
  await store.setStatus(application.id, 'invited');
  await pool.query(`INSERT INTO playtest_submissions (application_id, headset_played, minutes_played, progress_returned, evidence_url, paypal_account)
    VALUES ($1, 'quest-2', 20, 'yes', 'https://example.com/old', 'old@example.com')`, [application.id]);
  const old = await store.getSubmission(application.id);
  assert.equal(old.clipUrl, '', 'earlier rows have no clip');
  const saved = await store.saveSubmission(application.id, submissionInput({ clipUrl: 'https://youtu.be/new' }));
  assert.equal(saved.submission.clipUrl, 'https://youtu.be/new');
  await store.close();
});

test('a database from before submissions gains the table on startup', async () => {
  const pool = createMemoryPool();
  await pool.query(`CREATE TABLE playtest_applications (
    id BIGSERIAL PRIMARY KEY, reference TEXT NOT NULL, email TEXT NOT NULL, horizon_username TEXT NOT NULL,
    headset TEXT NOT NULL, vr_frequency TEXT NOT NULL, capture_method TEXT NOT NULL, recent_games TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '', played_before BOOLEAN NOT NULL DEFAULT FALSE, age_group TEXT NOT NULL DEFAULT 'adult',
    notes TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'new', admin_note TEXT NOT NULL DEFAULT '',
    terms_version TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    invited_at TIMESTAMPTZ, joined_at TIMESTAMPTZ, paid_at TIMESTAMPTZ)`);
  const store = await createPlaytestStore({ pool });
  try {
    const { application } = await store.createApplication(applicationInput());
    await store.setStatus(application.id, 'joined');
    const saved = await store.saveSubmission(application.id, submissionInput());
    assert.equal(saved.application.status, 'submitted');
  } finally {
    await store.close();
  }
});

// ---- Keys and status emails --------------------------------------------

async function adminPost(server, cookie, path, fields) {
  return fetch(`${server.url}${path}`, {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields),
    redirect: 'manual'
  });
}

async function csrfFor(server, cookie, id) {
  const html = await (await fetch(`${server.url}/admin/playtest/${id}`, { headers: { cookie } })).text();
  return /name="_csrf" value="([^"]+)"/.exec(html)[1];
}

test('keys pasted from the dashboard are parsed, deduplicated, and counted', async () => {
  const store = await createPlaytestStore({ pool: createMemoryPool() });
  try {
    const first = await store.addKeys('ABCDE-FGHIJ-KLMNO-PQRST-UVWXY\nabcde-fghij-klmno-pqrst-uvwxz\n\nnot a key\nABCDE-FGHIJ-KLMNO-PQRST-UVWXY');
    assert.deepEqual(first, { added: 2, skipped: 0 }, 'two keys, the duplicate line collapsed before counting');
    const again = await store.addKeys('ABCDE-FGHIJ-KLMNO-PQRST-UVWXY, 11111-22222-33333-44444-55555');
    assert.deepEqual(again, { added: 1, skipped: 1 });
    assert.deepEqual(await store.keySummary(), { total: 3, unused: 3 });
  } finally {
    await store.close();
  }
});

test('Invited takes the next key, emails it, and never hands the same application a second one', async () => {
  const sent = [];
  const server = await startServer({
    siteUrl: 'https://www.buriedworlds.com',
    notify: { to: 'owner@example.com', sendQuietly: async (message) => { sent.push(message); } }
  });
  try {
    await server.store.addKeys('KEY01-AAAAA-AAAAA-AAAAA-AAAAA\nKEY02-BBBBB-BBBBB-BBBBB-BBBBB');
    const { application } = await server.store.createApplication(applicationInput());
    const cookie = adminCookie();
    const csrf = await csrfFor(server, cookie, application.id);

    const invite = await adminPost(server, cookie, `/admin/playtest/${application.id}/status`, { status: 'invited', adminNote: '', _csrf: csrf });
    assert.equal(invite.status, 303);
    assert.ok(invite.headers.get('location').endsWith('?saved=1&sent=invited'));
    assert.equal((await server.store.getById(application.id)).status, 'invited');
    assert.deepEqual(await server.store.keySummary(), { total: 2, unused: 1 });
    const held = await server.store.keyFor(application.id);
    assert.equal(held.key, 'KEY01-AAAAA-AAAAA-AAAAA-AAAAA', 'the oldest unused key');

    await new Promise((resolve) => setTimeout(resolve, 20));
    const email = sent.find((message) => message.to === 'tester@example.com');
    assert.ok(email, 'the applicant is emailed');
    assert.ok(email.subject.includes(application.reference) && email.subject.includes("you're in"));
    assert.ok(email.text.includes('KEY01-AAAAA-AAAAA-AAAAA-AAAAA'), 'with the key');
    assert.ok(email.text.includes('https://www.buriedworlds.com/playtest/questionnaire'), 'and the brief');
    assert.ok(email.text.includes('a week from this email'));

    // Saving a note without changing status sends nothing and spends nothing.
    sent.length = 0;
    await adminPost(server, cookie, `/admin/playtest/${application.id}/status`, { status: 'invited', adminNote: 'Quest 3 slot.', _csrf: csrf });
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(sent.length, 0);
    assert.deepEqual(await server.store.keySummary(), { total: 2, unused: 1 });

    // Walking back to New and inviting again reuses the key already held.
    await adminPost(server, cookie, `/admin/playtest/${application.id}/status`, { status: 'new', adminNote: '', _csrf: csrf });
    await adminPost(server, cookie, `/admin/playtest/${application.id}/status`, { status: 'invited', adminNote: '', _csrf: csrf });
    assert.equal((await server.store.keyFor(application.id)).key, 'KEY01-AAAAA-AAAAA-AAAAA-AAAAA');
    assert.deepEqual(await server.store.keySummary(), { total: 2, unused: 1 });

    // The detail page shows the key and the previews.
    const detail = await (await fetch(`${server.url}/admin/playtest/${application.id}`, { headers: { cookie } })).text();
    assert.ok(detail.includes('KEY01-AAAAA-AAAAA-AAAAA-AAAAA'));
    assert.ok(detail.includes('not selected') && detail.includes('payment sent'), 'email previews');
  } finally {
    await server.stop();
  }
});

test('with no keys left, Invited is refused and the status does not change', async () => {
  const sent = [];
  const server = await startServer({ notify: { to: 'owner@example.com', sendQuietly: async (message) => { sent.push(message); } } });
  try {
    const { application } = await server.store.createApplication(applicationInput());
    const cookie = adminCookie();
    const csrf = await csrfFor(server, cookie, application.id);
    const invite = await adminPost(server, cookie, `/admin/playtest/${application.id}/status`, { status: 'invited', adminNote: '', _csrf: csrf });
    assert.equal(invite.status, 303);
    assert.ok(invite.headers.get('location').endsWith('?problem=no-keys'));
    assert.equal((await server.store.getById(application.id)).status, 'new');
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(sent.length, 0, 'no "you\u2019re in" without a key');
    const detail = await (await fetch(`${server.url}/admin/playtest/${application.id}?problem=no-keys`, { headers: { cookie } })).text();
    assert.ok(detail.includes('no unused keys'));
  } finally {
    await server.stop();
  }
});

test('Declined and Paid email the applicant; Waitlist and Testing do not', async () => {
  const sent = [];
  const server = await startServer({ notify: { to: 'owner@example.com', sendQuietly: async (message) => { sent.push(message); } } });
  try {
    const { application } = await server.store.createApplication(applicationInput());
    const cookie = adminCookie();
    const csrf = await csrfFor(server, cookie, application.id);
    for (const [status, expectMail, marker] of [['waitlist', false], ['testing', false], ['declined', true, 'not selected'], ['paid', true, 'payment sent']]) {
      sent.length = 0;
      await adminPost(server, cookie, `/admin/playtest/${application.id}/status`, { status, adminNote: '', _csrf: csrf });
      await new Promise((resolve) => setTimeout(resolve, 20));
      assert.equal(sent.length, expectMail ? 1 : 0, status);
      if (expectMail) {
        assert.equal(sent[0].to, 'tester@example.com');
        assert.ok(sent[0].subject.includes(marker), status);
        assert.ok(!sent[0].text.includes('paypal'), 'no payment detail echoed');
      }
    }
  } finally {
    await server.stop();
  }
});

test('deleting an invited application keeps its key on record as spent', async () => {
  const server = await startServer();
  try {
    await server.store.addKeys('KEY01-AAAAA-AAAAA-AAAAA-AAAAA');
    const { application } = await server.store.createApplication(applicationInput());
    await server.store.assignKey(application.id);
    await server.store.deleteApplication(application.id);
    assert.deepEqual(await server.store.keySummary(), { total: 1, unused: 0 }, 'an emailed key is never offered again');
  } finally {
    await server.stop();
  }
});

test('the keys form needs the admin token, and the list page shows the count', async () => {
  const server = await startServer();
  try {
    const cookie = adminCookie();
    const forged = await adminPost(server, cookie, '/admin/playtest/keys', { keys: 'KEY01-AAAAA-AAAAA-AAAAA-AAAAA', _csrf: 'nope' });
    assert.equal(forged.status, 403);
    const list = await (await fetch(`${server.url}/admin/playtest`, { headers: { cookie } })).text();
    const csrf = /name="_csrf" value="([^"]+)"/.exec(list)[1];
    const ok = await adminPost(server, cookie, '/admin/playtest/keys', { keys: 'KEY01-AAAAA-AAAAA-AAAAA-AAAAA\nKEY02-BBBBB-BBBBB-BBBBB-BBBBB', _csrf: csrf });
    assert.equal(ok.status, 303);
    const after = await (await fetch(`${server.url}${ok.headers.get('location')}`, { headers: { cookie } })).text();
    assert.ok(after.includes('2 keys added'));
    assert.ok(after.includes('<strong>2</strong>'), 'unused count');
  } finally {
    await server.stop();
  }
});

test('the recruitment post is generated from the live terms and shown on the dashboard', async () => {
  const { recruitmentPost } = await import('./data/playtest.mjs');
  const post = recruitmentPost({ siteUrl: 'https://www.buriedworlds.com' });
  assert.ok(post.title.includes(study.fee) && post.title.includes(`${study.minAge}+`));
  for (const fact of [study.fee, study.minLoot, study.deadlineLabel, 'https://www.buriedworlds.com/playtest', 'Discord', 'parent or guardian', `${study.paymentWindowHours} hours`]) {
    assert.ok(post.body.includes(fact), fact);
  }
  assert.ok(!post.body.includes('72 hours') && !post.body.includes('18+'));
  const server = await startServer();
  try {
    const html = await (await fetch(`${server.url}/admin/playtest`, { headers: { cookie: adminCookie() } })).text();
    assert.ok(html.includes('The recruitment post'));
    assert.ok(html.includes(post.title.replace(/—/g, '—')));
  } finally {
    await server.stop();
  }
});

test('emails to applicants are recorded with their SES message id, events land on them, and the page shows the timeline', async () => {
  let counter = 0;
  const server = await startServer({
    siteUrl: 'https://www.buriedworlds.com',
    notify: { to: 'owner@example.com', sendQuietly: async () => ({ MessageId: `ses-${++counter}` }) }
  });
  try {
    await server.store.addKeys('KEY01-AAAAA-AAAAA-AAAAA-AAAAA');
    const { application } = await server.store.createApplication(applicationInput());
    const cookie = adminCookie();
    const csrf = await csrfFor(server, cookie, application.id);
    await adminPost(server, cookie, `/admin/playtest/${application.id}/status`, { status: 'invited', adminNote: '', _csrf: csrf });
    await new Promise((resolve) => setTimeout(resolve, 30));

    const [invitation] = await server.store.emailsFor(application.id);
    assert.ok(invitation, 'the invitation was recorded');
    assert.equal(invitation.kind, 'invited');
    assert.equal(invitation.recipient, 'tester@example.com');
    assert.match(invitation.messageId, /^ses-\d+$/);
    assert.equal(invitation.deliveredAt, null);

    assert.equal(await server.store.recordEmailEvent('never-sent', { kind: 'delivery', at: '2026-09-16T01:00:00.000Z' }), false);
    assert.equal(await server.store.recordEmailEvent(invitation.messageId, { kind: 'delivery', at: '2026-09-16T01:00:00.000Z' }), true);
    await server.store.recordEmailEvent(invitation.messageId, { kind: 'click', at: '2026-09-16T01:30:00.000Z', detail: 'https://www.buriedworlds.com/playtest/questionnaire' });
    await server.store.recordEmailEvent(invitation.messageId, { kind: 'click', at: '2026-09-16T01:31:00.000Z' });
    await server.store.recordEmailEvent(invitation.messageId, { kind: 'delivery', at: '2026-09-16T09:00:00.000Z' });

    const [after] = await server.store.emailsFor(application.id);
    assert.equal(after.deliveredAt, '2026-09-16T01:00:00.000Z', 'the first delivery time is kept');
    assert.equal(after.firstClickAt, '2026-09-16T01:30:00.000Z');
    assert.equal(after.clickCount, 2);

    const detail = await (await fetch(`${server.url}/admin/playtest/${application.id}`, { headers: { cookie } })).text();
    assert.ok(detail.includes('Emails sent to them'));
    assert.ok(detail.includes('Invitation'));
    assert.ok(detail.includes('2026-09-16 01:00'));
    assert.ok(detail.includes('×2'));

    // A bounce shows on the list page.
    await server.store.recordEmailEvent(invitation.messageId, { kind: 'bounce', at: '2026-09-16T02:00:00.000Z', detail: 'Permanent · General' });
    const list = await (await fetch(`${server.url}/admin/playtest`, { headers: { cookie } })).text();
    assert.ok(list.includes('Email bounced'));

    // And the records go with the application.
    await server.store.deleteApplication(application.id);
    assert.deepEqual(await server.store.emailsFor(application.id), []);
  } finally {
    await server.stop();
  }
});

test('the SES mailer sends under the configuration set with a text and an HTML part', async () => {
  const commands = [];
  const mailer = createMailer({
    sesRegion: 'us-west-2', mailFrom: 'cyril@bellare.com.au', configurationSet: 'buriedworlds',
    sesClient: { send: async (command) => { commands.push(command.input); return { MessageId: 'x' }; } }
  });
  await mailer.send({ to: 'a@example.com', subject: 'S', text: 'Body https://example.com/x' });
  assert.equal(commands[0].ConfigurationSetName, 'buriedworlds');
  assert.equal(commands[0].Content.Simple.Body.Text.Data, 'Body https://example.com/x');
  assert.ok(commands[0].Content.Simple.Body.Html.Data.includes('<a href="https://example.com/x">'));
});

// ---- Meta pixel --------------------------------------------------------

test('the pixel renders on the study pages, fires Lead once per new application, and never sees a form field', async () => {
  const server = await startServer();
  try {
    // Off entirely without an id.
    const bare = await (await fetch(`${server.url}/playtest`)).text();
    assert.ok(!bare.includes('fbevents.js') && !bare.includes('fbq('));

    // With an id: PageView on the form page, Lead on a fresh application.
    const pixel = await startServer({ locals: { metaPixelId: '2470525756801203' } });
    try {
      const form = await (await fetch(`${pixel.url}/playtest`)).text();
      assert.ok(form.includes("fbq('init', '2470525756801203')") && form.includes("fbq('track', 'PageView')"));
      assert.ok(form.includes('facebook.com/tr?id=2470525756801203&amp;ev=PageView&amp;noscript=1'), 'noscript fallback');
      assert.ok(!form.includes("'Lead'"), 'no Lead before applying');

      const first = await (await apply(pixel.url)).text();
      assert.ok(first.includes("fbq('track', 'Lead'"), 'Lead on the confirmation');
      for (const secret of ['tester@example.com', 'WarriorMama365', 'Canada']) {
        assert.ok(!first.slice(first.indexOf("fbq('track', 'Lead'")).includes(secret), `Lead carries no ${secret}`);
      }

      const again = await (await apply(pixel.url)).text();
      assert.ok(again.includes('already applied') && !again.includes("'Lead'"), 'a duplicate is not a second conversion');

      const bot = await (await apply(pixel.url, applicationInput({ email: 'bot@example.com' }), { website: 'spam' })).text();
      assert.ok(!bot.includes("'Lead'"), 'the honeypot does not convert');

      const admin = await (await fetch(`${pixel.url}/admin/playtest`, { headers: { cookie: adminCookie() } })).text();
      assert.ok(!admin.includes('fbevents.js'), 'never in the admin area');
    } finally {
      await pixel.stop();
    }
  } finally {
    await server.stop();
  }
});

// ---- Notification ------------------------------------------------------

test('the developer is told once per new application, and never given the applicant\u2019s details', async () => {
  const sent = [];
  const server = await startServer({
    siteUrl: 'https://www.buriedworlds.com',
    notify: { to: 'owner@example.com', sendQuietly: async (message) => { sent.push(message); } }
  });
  try {
    await (await apply(server.url)).text();
    const [stored] = await server.store.listApplications();
    // sendQuietly is fire-and-forget; give the microtask a tick.
    await new Promise((resolve) => setTimeout(resolve, 20));

    assert.equal(sent.length, 1);
    const [message] = sent;
    assert.equal(message.to, 'owner@example.com');
    assert.ok(message.subject.includes(stored.reference));
    assert.ok(message.subject.includes('Meta Quest 3'));
    assert.ok(message.text.includes(`https://www.buriedworlds.com/admin/playtest/${stored.id}`));
    for (const secret of ['tester@example.com', 'WarriorMama365', 'Canada', 'Walkabout']) {
      assert.ok(!message.text.includes(secret), `notification must not carry: ${secret}`);
      assert.ok(!message.subject.includes(secret), `subject must not carry: ${secret}`);
    }

    // A second application from the same address returns the original and says nothing.
    await (await apply(server.url, applicationInput({ headset: 'quest-2' }))).text();
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(sent.length, 1, 'duplicates do not notify');
  } finally {
    await server.stop();
  }
});

test('a mail server that is down never fails the applicant', async () => {
  const errors = [];
  const server = await startServer({
    siteUrl: 'https://www.buriedworlds.com',
    notify: { to: 'owner@example.com', sendQuietly: () => Promise.reject(new Error('SMTP refused')) },
    onError: (error) => errors.push(error)
  });
  try {
    const response = await apply(server.url);
    const html = await response.text();
    assert.equal(response.status, 201, 'the application is accepted');
    assert.equal((await server.store.listApplications()).length, 1, 'and stored');
    assert.ok(html.includes('Application received'));
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(errors.length, 1, 'the failure is reported, not swallowed');
  } finally {
    await server.stop();
  }
});

test('with no notifier configured, applications are simply stored', async () => {
  const server = await startServer({ notify: null });
  try {
    const response = await apply(server.url);
    await response.text();
    assert.equal(response.status, 201);
  } finally {
    await server.stop();
  }
});

test('the notice reads as a note to a person, with the reference and a link and nothing private', () => {
  const notice = applicationNotice({
    id: 7, reference: 'BW-ABC234', headset: 'quest-2', vrFrequency: 'rarely', captureMethod: 'screenshots',
    playedBefore: true, email: 'x@y.z', horizonUsername: 'Handle', country: 'France', notes: 'private'
  }, { siteUrl: 'https://example.test' });
  assert.equal(notice.subject, 'New playtest application BW-ABC234 — Meta Quest 2');
  assert.ok(notice.text.includes('screenshots and notes'));
  assert.ok(notice.text.includes('has played before'));
  assert.ok(notice.text.includes('https://example.test/admin/playtest/7'));
  for (const secret of ['x@y.z', 'Handle', 'France', 'private']) assert.ok(!notice.text.includes(secret), secret);
});

test('the mailer is off with nothing configured, and SMTP takes its From from the URL\u2019s user', () => {
  assert.equal(createMailer({}), null);
  assert.equal(createMailer({ smtpUrl: '', sesRegion: '' }), null);
  const mailer = createMailer({ smtpUrl: 'smtps://cyril%40bellare.com.au:app-password@smtp.gmail.com:465' });
  assert.equal(mailer.transport, 'smtp');
  assert.equal(mailer.from, 'cyril@bellare.com.au');
  mailer.close();
  const explicit = createMailer({ smtpUrl: 'smtp://user:pw@mail.example.com:587', smtpFrom: 'notes@example.com' });
  assert.equal(explicit.from, 'notes@example.com');
  explicit.close();
  assert.throws(() => createMailer({ smtpUrl: 'smtp://mail.example.com:587' }), /SMTP_FROM is required/);
});

test('SES sends a plain-text message from the verified identity, and wins over SMTP when both are set', async () => {
  assert.throws(() => createMailer({ sesRegion: 'ap-southeast-2' }), /MAIL_FROM is required/);

  const commands = [];
  const client = { send: async (command) => { commands.push(command.input); return { MessageId: 'test-id' }; } };
  const mailer = createMailer({
    sesRegion: 'ap-southeast-2', mailFrom: 'cyril@bellare.com.au', sesClient: client,
    smtpUrl: 'smtps://ignored:ignored@smtp.example.com:465'
  });
  assert.equal(mailer.transport, 'ses');
  const result = await mailer.send({ to: 'cyril@bellare.com.au', subject: 'Hello', text: 'Body' });
  assert.equal(result.MessageId, 'test-id');
  assert.equal(commands.length, 1);
  assert.equal(commands[0].FromEmailAddress, 'cyril@bellare.com.au');
  assert.deepEqual(commands[0].Destination, { ToAddresses: ['cyril@bellare.com.au'] });
  assert.equal(commands[0].ConfigurationSetName, undefined, 'no set unless configured');
  assert.deepEqual(commands[0].Content.Simple.Subject, { Data: 'Hello', Charset: 'UTF-8' });
  assert.deepEqual(commands[0].Content.Simple.Body.Text, { Data: 'Body', Charset: 'UTF-8' });
  assert.ok(commands[0].Content.Simple.Body.Html.Data.includes('<p>Body</p>'));

  // sendQuietly swallows a refusal and reports it.
  const errors = [];
  const failing = createMailer({
    sesRegion: 'ap-southeast-2', mailFrom: 'cyril@bellare.com.au',
    sesClient: { send: async () => { throw new Error('MessageRejected'); } },
    onError: (error) => errors.push(error)
  });
  await failing.sendQuietly({ to: 'x@example.com', subject: 's', text: 't' });
  assert.equal(errors.length, 1);
});

// ---- The dashboard -----------------------------------------------------

test('the dashboard is unreachable without the admin session', async () => {
  const server = await startServer();
  try {
    const anonymous = await fetch(`${server.url}/admin/playtest`, { redirect: 'manual' });
    assert.equal(anonymous.status, 303);
    assert.equal(anonymous.headers.get('location'), '/admin/login');

    const signedIn = await fetch(`${server.url}/admin/playtest`, {
      headers: { cookie: adminCookie() }
    });
    assert.equal(signedIn.status, 200);
    assert.equal(signedIn.headers.get('cache-control'), 'no-store');
  } finally {
    await server.stop();
  }
});

test('with no admin password configured the dashboard does not exist', async () => {
  const server = await startServer({ adminPassword: '', sessionSecret: '' });
  try {
    const response = await fetch(`${server.url}/admin/playtest`, {
      headers: { cookie: adminCookie() },
      redirect: 'manual'
    });
    assert.equal(response.status, 404);
  } finally {
    await server.stop();
  }
});

test('the dashboard lists applications and exports them, and a write needs its token', async () => {
  const server = await startServer();
  try {
    await (await apply(server.url)).text();
    const [stored] = await server.store.listApplications();

    const list = await fetch(`${server.url}/admin/playtest`, { headers: { cookie: adminCookie() } });
    const html = await list.text();
    assert.ok(html.includes(stored.reference));
    assert.ok(html.includes('tester@example.com'));

    const forged = await fetch(`${server.url}/admin/playtest/${stored.id}/status`, {
      method: 'POST',
      headers: { cookie: adminCookie(), 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ status: 'paid', _csrf: 'nope' }),
      redirect: 'manual'
    });
    assert.equal(forged.status, 403, 'a cookie alone cannot move an application to paid');
    assert.equal((await server.store.getById(stored.id)).status, 'new');

    const csv = await fetch(`${server.url}/admin/playtest/export.csv`, {
      headers: { cookie: adminCookie() }
    });
    const body = await csv.text();
    assert.match(csv.headers.get('content-type'), /text\/csv/);
    assert.ok(body.startsWith('reference,created_at,status,email'));
    assert.ok(body.includes(stored.reference));
  } finally {
    await server.stop();
  }
});

test('an application can be opened and walked through the study', async () => {
  const server = await startServer();
  try {
    await (await apply(server.url)).text();
    const [stored] = await server.store.listApplications();
    await server.store.addKeys('KEY01-AAAAA-AAAAA-AAAAA-AAAAA'); // Invited needs one
    const cookie = adminCookie();

    const detail = await fetch(`${server.url}/admin/playtest/${stored.id}`, { headers: { cookie } });
    const html = await detail.text();
    assert.equal(detail.status, 200);
    assert.ok(html.includes('WarriorMama365'));
    assert.ok(html.includes('account enumeration'), 'the page says why there is no lookup');

    const csrf = /name="_csrf" value="([^"]+)"/.exec(html)?.[1];
    assert.ok(csrf, 'the detail page issues a CSRF token');

    const saved = await fetch(`${server.url}/admin/playtest/${stored.id}/status`, {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ status: 'invited', adminNote: 'Quest 3 slot two.', _csrf: csrf }),
      redirect: 'manual'
    });
    assert.equal(saved.status, 303);

    const updated = await server.store.getById(stored.id);
    assert.equal(updated.status, 'invited');
    assert.equal(updated.adminNote, 'Quest 3 slot two.');
    assert.ok(updated.invitedAt);

    const missing = await fetch(`${server.url}/admin/playtest/9999`, { headers: { cookie } });
    await missing.text();
    assert.equal(missing.status, 404);
  } finally {
    await server.stop();
  }
});

test('deleting an application erases it', async () => {
  const server = await startServer();
  try {
    await (await apply(server.url)).text();
    const [stored] = await server.store.listApplications();
    const cookie = adminCookie();

    const detail = await fetch(`${server.url}/admin/playtest/${stored.id}`, { headers: { cookie } });
    const csrf = /name="_csrf" value="([^"]+)"/.exec(await detail.text())?.[1];

    const response = await fetch(`${server.url}/admin/playtest/${stored.id}/delete`, {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ _csrf: csrf }),
      redirect: 'manual'
    });
    assert.equal(response.status, 303);
    assert.equal((await server.store.listApplications()).length, 0);
  } finally {
    await server.stop();
  }
});

test('export.csv is not mistaken for an application id', async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.url}/admin/playtest/export.csv`, {
      headers: { cookie: adminCookie() }
    });
    await response.text();
    assert.equal(response.status, 200);
  } finally {
    await server.stop();
  }
});
