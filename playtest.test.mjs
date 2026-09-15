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
import { applicationNotice, createPlaytestRouter } from './playtest.mjs';
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
  app.use(createPlaytestRouter({
    store,
    adminPassword: ADMIN_PASSWORD,
    sessionSecret: SESSION_SECRET,
    onError: () => {},
    ...options
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

test('the questionnaire page states every question, the address, and the reference instruction', async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.url}/playtest/questionnaire`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.ok(!html.includes('googletagmanager'), 'no analytics on study pages');
    const { questionnaire } = await import('./data/playtest.mjs');
    assert.equal(questionnaire.questions.length, 7);
    for (const question of questionnaire.questions) {
      assert.ok(html.includes(question.replace(/'/g, '&#39;').replace(/"/g, '&quot;')), question);
    }
    assert.ok(html.includes('mailto:playtest@bellare.com.au'));
    assert.ok(html.includes('BW-code'));
    assert.ok(html.includes(`${study.deadlineHours} hours`));

    const applied = await (await apply(server.url)).text();
    assert.ok(applied.includes('href="/playtest/questionnaire"'), 'the confirmation page links to it');
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
  assert.deepEqual(commands[0], {
    FromEmailAddress: 'cyril@bellare.com.au',
    Destination: { ToAddresses: ['cyril@bellare.com.au'] },
    Content: { Simple: { Subject: { Data: 'Hello', Charset: 'UTF-8' }, Body: { Text: { Data: 'Body', Charset: 'UTF-8' } } } }
  });

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
