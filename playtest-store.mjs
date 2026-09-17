// PostgreSQL persistence for paid-playtest applications.
//
// This is the first table on the site that holds contact details, so it is kept
// deliberately small: what a person typed, what status their application is at,
// and the three timestamps the study reports on. No IP address, no cookie, no
// user agent, nothing derived. Everything here is something the applicant
// knowingly wrote into the form.

import crypto from 'node:crypto';

import pg from 'pg';

import { ageGroups, captureMethods, headsets, questionnaire, statuses, study, submittableStatuses, vrFrequencies } from './data/playtest.mjs';

const { Pool } = pg;

const HEADSET_IDS = new Set(headsets.map((headset) => headset.id));
const FREQUENCY_IDS = new Set(vrFrequencies.map((frequency) => frequency.id));
const CAPTURE_IDS = new Set(captureMethods.map((method) => method.id));
const AGE_IDS = new Set(ageGroups.map((group) => group.id));
const STATUS_IDS = new Set(statuses.map((status) => status.id));
const PROGRESS_IDS = new Set(questionnaire.progressOptions.map((option) => option.id));
const SUBMITTABLE = new Set(submittableStatuses);

export const LIMITS = {
  email: 254,
  horizonUsername: 64,
  recentGames: 200,
  country: 60,
  notes: 1000,
  adminNote: 2000,
  answer: 2000,
  paypalAccount: 254,
  evidenceUrl: 2048,
  evidenceNote: 500,
  minutesMax: 600
};

export class ApplicationValidationError extends Error {
  constructor(message, field = '') {
    super(message);
    this.name = 'ApplicationValidationError';
    this.field = field;
  }
}

function cleanText(value, field, label, maxLength, { required = true } = {}) {
  const clean = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (required && !clean) throw new ApplicationValidationError(`${label} is required`, field);
  if (clean.length > maxLength) {
    throw new ApplicationValidationError(`${label} must be at most ${maxLength} characters`, field);
  }
  return clean;
}

// Deliberately loose. The address is checked properly by sending mail to it —
// the release-channel invitation is the real test, and a regex that rejects a
// valid unusual address costs a tester their place for nothing.
function normaliseEmail(value) {
  const email = cleanText(value, 'email', 'Email address', LIMITS.email).toLowerCase();
  if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email)) {
    throw new ApplicationValidationError('That does not look like an email address', 'email');
  }
  return email;
}

// Meta Horizon usernames are letters, numbers, periods and underscores. A
// leading @ is stripped rather than rejected: people type their handle the way
// they see it written.
function normaliseUsername(value) {
  const raw = cleanText(value, 'horizonUsername', 'Meta Horizon username', LIMITS.horizonUsername + 1)
    .replace(/^@/, '');
  if (raw.length < 2) {
    throw new ApplicationValidationError('Meta Horizon username is required', 'horizonUsername');
  }
  if (!/^[A-Za-z0-9._]{2,64}$/.test(raw)) {
    throw new ApplicationValidationError(
      'A Meta Horizon username is letters, numbers, periods and underscores only',
      'horizonUsername'
    );
  }
  return raw;
}

function pickOption(value, allowed, field, label) {
  const id = String(value ?? '').trim();
  if (!allowed.has(id)) throw new ApplicationValidationError(`${label} is required`, field);
  return id;
}

// An HTML checkbox sends its value only when ticked, so anything present and not
// obviously negative is a tick. The three consent boxes are required, and a form
// that arrives without one is a form that was not filled in on the page.
function isTicked(value) {
  if (value === undefined || value === null) return false;
  const text = String(value).trim().toLowerCase();
  return text !== '' && text !== 'false' && text !== '0' && text !== 'off' && text !== 'no';
}

function requireTick(value, field, label) {
  if (!isTicked(value)) throw new ApplicationValidationError(label, field);
  return true;
}

/** Short, unambiguous, and safe to quote in an email or read aloud on Discord. */
export function makeReference(randomBytes = crypto.randomBytes) {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // no 0/O/1/I
  const bytes = randomBytes(6);
  let code = '';
  for (const byte of bytes) code += alphabet[byte % alphabet.length];
  return `BW-${code}`;
}

/**
 * Validate one submitted application. Throws ApplicationValidationError with the
 * offending field name, so the form can be re-rendered with the answers intact
 * and the message next to the right box.
 */
export function normaliseApplication(input = {}) {
  return {
    email: normaliseEmail(input.email),
    horizonUsername: normaliseUsername(input.horizonUsername),
    headset: pickOption(input.headset, HEADSET_IDS, 'headset', 'Headset'),
    vrFrequency: pickOption(input.vrFrequency, FREQUENCY_IDS, 'vrFrequency', 'How often you play VR'),
    captureMethod: pickOption(input.captureMethod, CAPTURE_IDS, 'captureMethod', 'How you can send evidence'),
    recentGames: cleanText(input.recentGames, 'recentGames', 'Two VR games you played recently', LIMITS.recentGames),
    country: cleanText(input.country, 'country', 'Country', LIMITS.country),
    playedBefore: isTicked(input.playedBefore),
    notes: cleanText(input.notes, 'notes', 'Anything else', LIMITS.notes, { required: false }),
    ageGroup: pickOption(input.ageGroup, AGE_IDS, 'ageGroup', 'Your age'),
    paypalOk: requireTick(
      input.paypalOk,
      'paypalOk',
      `Please confirm there is a ${study.payoutMethod} account the payment can go to`
    ),
    canFinish: requireTick(
      input.canFinish,
      'canFinish',
      `Please confirm you can finish within ${study.deadlineLabel} of getting access`
    ),
    acceptedTerms: requireTick(
      input.acceptedTerms,
      'acceptedTerms',
      'Please confirm you have read the payment conditions and the privacy note'
    ),
    termsVersion: study.termsVersion
  };
}

// A PayPal account is an email address or a PayPal.Me name. Either is accepted
// as typed; the payment is made by a person reading the dashboard, not by code,
// so the check only needs to rule out the obviously empty or absurd.
function normalisePaypal(value) {
  const raw = cleanText(value, 'paypalAccount', 'PayPal account', LIMITS.paypalAccount);
  const looksLikeEmail = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(raw);
  const looksLikeHandle = /^(?:https?:\/\/)?(?:www\.)?paypal\.me\/[A-Za-z0-9._-]{2,}$/i.test(raw) || /^@?[A-Za-z0-9._-]{3,}$/.test(raw);
  if (!looksLikeEmail && !looksLikeHandle) {
    throw new ApplicationValidationError('Enter the email address of your PayPal account, or your PayPal.Me name', 'paypalAccount');
  }
  return raw;
}

function normaliseHttpsUrl(value, field, label, { required = true } = {}) {
  const raw = cleanText(value, field, label, LIMITS.evidenceUrl, { required });
  if (!raw) return '';
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new ApplicationValidationError('That link does not look complete — it should start with https://', field);
  }
  if (url.protocol !== 'https:') {
    throw new ApplicationValidationError('The link needs to start with https://', field);
  }
  return url.toString();
}

/**
 * Validate one questionnaire submission. Every question needs an answer — a
 * short one is fine, an empty one is a form that was not filled in — and the
 * evidence link is required because it is the one thing that shows the
 * session happened.
 */
export function normaliseSubmission(input = {}) {
  const answers = {};
  for (const question of questionnaire.questions) {
    answers[question.id] = cleanText(input[`answer_${question.id}`], `answer_${question.id}`, 'This answer', LIMITS.answer);
  }
  const minutes = Number.parseInt(String(input.minutesPlayed ?? '').trim(), 10);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > LIMITS.minutesMax) {
    throw new ApplicationValidationError('Roughly how many minutes you played, as a number', 'minutesPlayed');
  }
  return {
    answers,
    headsetPlayed: pickOption(input.headsetPlayed, HEADSET_IDS, 'headsetPlayed', 'The headset you played on'),
    minutesPlayed: minutes,
    progressReturned: pickOption(input.progressReturned, PROGRESS_IDS, 'progressReturned', 'Whether your progress came back'),
    evidenceUrl: normaliseHttpsUrl(input.evidenceUrl, 'evidenceUrl', 'A link to your marketplace screenshot'),
    clipUrl: normaliseHttpsUrl(input.clipUrl, 'clipUrl', 'A link to your clip', { required: false }),
    evidenceNote: cleanText(input.evidenceNote, 'evidenceNote', 'Note about your screenshot', LIMITS.evidenceNote, { required: false }),
    paypalAccount: normalisePaypal(input.paypalAccount),
    ownAnswers: requireTick(input.ownAnswers, 'ownAnswers', 'Please confirm these are your own answers from your own session')
  };
}

export function canSubmit(application) {
  return Boolean(application) && SUBMITTABLE.has(application.status);
}

function iso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function rowToSubmission(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    applicationId: Number(row.application_id),
    answers: typeof row.answers === 'string' ? JSON.parse(row.answers) : (row.answers ?? {}),
    headsetPlayed: row.headset_played,
    minutesPlayed: Number(row.minutes_played),
    progressReturned: row.progress_returned,
    evidenceUrl: row.evidence_url,
    clipUrl: row.clip_url ?? '',
    evidenceNote: row.evidence_note,
    paypalAccount: row.paypal_account,
    submissionCount: Number(row.submission_count),
    submittedAt: iso(row.submitted_at),
    updatedAt: iso(row.updated_at)
  };
}

function rowToEmail(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    applicationId: row.application_id === null ? null : Number(row.application_id),
    kind: row.kind,
    recipient: row.recipient,
    messageId: row.message_id,
    sentAt: iso(row.sent_at),
    deliveredAt: iso(row.delivered_at),
    bouncedAt: iso(row.bounced_at),
    bounceDetail: row.bounce_detail,
    complainedAt: iso(row.complained_at),
    rejectedAt: iso(row.rejected_at),
    rejectDetail: row.reject_detail,
    firstClickAt: iso(row.first_click_at),
    clickCount: Number(row.click_count),
    firstOpenAt: iso(row.first_open_at),
    openCount: Number(row.open_count ?? 0),
    lastEventAt: iso(row.last_event_at)
  };
}

function rowToApplication(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    reference: row.reference,
    email: row.email,
    horizonUsername: row.horizon_username,
    headset: row.headset,
    vrFrequency: row.vr_frequency,
    captureMethod: row.capture_method,
    recentGames: row.recent_games,
    country: row.country,
    playedBefore: Boolean(row.played_before),
    ageGroup: row.age_group,
    notes: row.notes,
    status: row.status,
    adminNote: row.admin_note,
    termsVersion: row.terms_version,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    invitedAt: iso(row.invited_at),
    joinedAt: iso(row.joined_at),
    paidAt: iso(row.paid_at)
  };
}

export async function createPlaytestStore({ databaseUrl, pool: suppliedPool }) {
  if (!suppliedPool && !databaseUrl) {
    throw new Error('DATABASE_URL is required for playtest applications');
  }

  const pool = suppliedPool ?? new Pool({
    connectionString: databaseUrl,
    max: Number.parseInt(process.env.PG_POOL_MAX ?? '10', 10),
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    options: '-c timezone=UTC'
  });

  // Created only when absent, and otherwise migrated. Postgres would accept
  // CREATE TABLE IF NOT EXISTS on an existing table, but pg-mem — which the
  // tests run against — does not, and the migration path below is the one
  // worth testing: it is what the live database runs after every change here.
  const exists = await pool.query(`
    SELECT 1 FROM information_schema.tables WHERE table_name = 'playtest_applications'
  `);
  if (exists.rows.length === 0) await pool.query(`
    CREATE TABLE playtest_applications (
      id BIGSERIAL PRIMARY KEY,
      reference TEXT NOT NULL,
      email TEXT NOT NULL,
      horizon_username TEXT NOT NULL,
      headset TEXT NOT NULL,
      vr_frequency TEXT NOT NULL,
      capture_method TEXT NOT NULL,
      recent_games TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT '',
      played_before BOOLEAN NOT NULL DEFAULT FALSE,
      age_group TEXT NOT NULL DEFAULT 'adult',
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      admin_note TEXT NOT NULL DEFAULT '',
      terms_version TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      invited_at TIMESTAMPTZ,
      joined_at TIMESTAMPTZ,
      paid_at TIMESTAMPTZ
    );

    CREATE UNIQUE INDEX playtest_applications_email_lower
      ON playtest_applications (LOWER(email));
    CREATE UNIQUE INDEX playtest_applications_reference
      ON playtest_applications (reference);
    CREATE INDEX playtest_applications_created
      ON playtest_applications (created_at DESC);
  `);

  // Columns added after the table first shipped. Each is applied only when the
  // catalogue says it is missing, so a database from before the change gains
  // it once and a fresh one is never altered. age_group: every earlier row is
  // an adult, because that is what the form required at the time. A fresh
  // table already has every column, so this loop is a no-op for it.
  const added = [
    ['playtest_applications', 'age_group', `TEXT NOT NULL DEFAULT 'adult'`]
  ];
  async function migrate(rows) {
    for (const [table, column, definition] of rows) {
      const present = await pool.query(`
        SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2
      `, [table, column]);
      if (present.rows.length === 0) {
        await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      }
    }
  }
  await migrate(added);

  // One submission per application, created when the tester submits and
  // replaced if they correct it. Answers are JSON keyed by question id. Held
  // separately from the application so the PayPal account — the one payment
  // detail the site stores — lives in exactly one column of one table.
  const submissionsExist = await pool.query(`
    SELECT 1 FROM information_schema.tables WHERE table_name = 'playtest_submissions'
  `);
  if (submissionsExist.rows.length === 0) await pool.query(`
    CREATE TABLE playtest_submissions (
      id BIGSERIAL PRIMARY KEY,
      application_id BIGINT NOT NULL REFERENCES playtest_applications(id),
      answers TEXT NOT NULL DEFAULT '{}',
      headset_played TEXT NOT NULL,
      minutes_played INTEGER NOT NULL,
      progress_returned TEXT NOT NULL,
      evidence_url TEXT NOT NULL,
      clip_url TEXT NOT NULL DEFAULT '',
      evidence_note TEXT NOT NULL DEFAULT '',
      paypal_account TEXT NOT NULL,
      submission_count INTEGER NOT NULL DEFAULT 1,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX playtest_submissions_application
      ON playtest_submissions (application_id);
  `);
  // The clip became optional after the table first shipped; the required
  // evidence is now the marketplace screenshot in evidence_url.
  await migrate([['playtest_submissions', 'clip_url', `TEXT NOT NULL DEFAULT ''`]]);

  // Redeemable store keys from the Meta developer dashboard, pasted in by the
  // developer and handed out one per invited applicant. A key with assigned_at
  // set is spent for good: it was emailed, so it cannot be offered again even
  // if the application it went to is later deleted.
  const keysExist = await pool.query(`
    SELECT 1 FROM information_schema.tables WHERE table_name = 'playtest_keys'
  `);
  if (keysExist.rows.length === 0) await pool.query(`
    CREATE TABLE playtest_keys (
      id BIGSERIAL PRIMARY KEY,
      key TEXT NOT NULL,
      application_id BIGINT REFERENCES playtest_applications(id),
      added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      assigned_at TIMESTAMPTZ
    );
    CREATE UNIQUE INDEX playtest_keys_key ON playtest_keys (key);
  `);

  // Every email the study sends to an applicant, with what SES reported back
  // about it. One row per message; the columns are the first time each thing
  // happened. Nothing here is the email's text — that is regenerated from the
  // terms — only its fate.
  const emailsExist = await pool.query(`
    SELECT 1 FROM information_schema.tables WHERE table_name = 'playtest_emails'
  `);
  if (emailsExist.rows.length === 0) await pool.query(`
    CREATE TABLE playtest_emails (
      id BIGSERIAL PRIMARY KEY,
      application_id BIGINT REFERENCES playtest_applications(id),
      kind TEXT NOT NULL,
      recipient TEXT NOT NULL,
      message_id TEXT NOT NULL,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      delivered_at TIMESTAMPTZ,
      bounced_at TIMESTAMPTZ,
      bounce_detail TEXT NOT NULL DEFAULT '',
      complained_at TIMESTAMPTZ,
      rejected_at TIMESTAMPTZ,
      reject_detail TEXT NOT NULL DEFAULT '',
      first_click_at TIMESTAMPTZ,
      click_count INTEGER NOT NULL DEFAULT 0,
      first_open_at TIMESTAMPTZ,
      open_count INTEGER NOT NULL DEFAULT 0,
      last_event_at TIMESTAMPTZ
    );
    CREATE UNIQUE INDEX playtest_emails_message ON playtest_emails (message_id);
    CREATE INDEX playtest_emails_application ON playtest_emails (application_id);
  `);
  // Opens were added after the table first shipped. Unreliable by nature —
  // Apple Mail pre-loads the pixel — and the dashboard says so beside them.
  await migrate([['playtest_emails', 'first_open_at', 'TIMESTAMPTZ'], ['playtest_emails', 'open_count', 'INTEGER NOT NULL DEFAULT 0']]);

  async function getByReference(reference) {
    const result = await pool.query(
      'SELECT * FROM playtest_applications WHERE reference = $1',
      [String(reference ?? '').toUpperCase()]
    );
    return rowToApplication(result.rows[0]);
  }

  async function getById(id) {
    const result = await pool.query('SELECT * FROM playtest_applications WHERE id = $1', [id]);
    return rowToApplication(result.rows[0]);
  }

  /**
   * Store one application.
   *
   * A second application from the same address is not an error to shout about:
   * it is nearly always somebody who pressed the button twice or forgot they had
   * applied. They get their original reference back and `duplicate: true`, and
   * the stored row is left exactly as it was — a re-application must never
   * overwrite a screening decision already made against it.
   */
  async function createApplication(input) {
    const application = normaliseApplication(input);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const reference = makeReference();
      try {
        const result = await pool.query(`
          INSERT INTO playtest_applications
            (reference, email, horizon_username, headset, vr_frequency, capture_method,
             recent_games, country, played_before, age_group, notes, terms_version)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *
        `, [
          reference, application.email, application.horizonUsername, application.headset,
          application.vrFrequency, application.captureMethod, application.recentGames,
          application.country, application.playedBefore, application.ageGroup, application.notes,
          application.termsVersion
        ]);
        return { application: rowToApplication(result.rows[0]), duplicate: false };
      } catch (error) {
        if (error.code !== '23505') throw error;
        const existing = await pool.query(
          'SELECT * FROM playtest_applications WHERE LOWER(email) = LOWER($1)',
          [application.email]
        );
        if (existing.rows[0]) {
          return { application: rowToApplication(existing.rows[0]), duplicate: true };
        }
        // The clash was on the reference, not the email. Draw another and retry.
      }
    }
    throw new Error('could not allocate a playtest reference');
  }

  /**
   * Move an application to a new status.
   *
   * The three funnel timestamps are stamped the first time their status is
   * reached and never moved afterwards, so walking an application backwards to
   * correct a mistake cannot rewrite the date an invitation actually went out.
   */
  async function setStatus(id, status, adminNote = null) {
    if (!STATUS_IDS.has(status)) {
      throw new ApplicationValidationError('Unknown status', 'status');
    }
    const result = await pool.query(`
      UPDATE playtest_applications SET
        status = $1,
        admin_note = COALESCE($2, admin_note),
        invited_at = CASE WHEN $1 = 'invited' AND invited_at IS NULL THEN NOW() ELSE invited_at END,
        joined_at = CASE WHEN $1 = 'joined' AND joined_at IS NULL THEN NOW() ELSE joined_at END,
        paid_at = CASE WHEN $1 = 'paid' AND paid_at IS NULL THEN NOW() ELSE paid_at END,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [status, adminNote === null ? null : String(adminNote).slice(0, LIMITS.adminNote), id]);
    return rowToApplication(result.rows[0]);
  }

  async function deleteApplication(id) {
    // The submission holds the payment detail; it goes first, and always. A
    // key that went to this applicant stays on record as spent, unlinked. The
    // email records carry the address, so they go too.
    await pool.query('DELETE FROM playtest_submissions WHERE application_id = $1', [id]);
    await pool.query('DELETE FROM playtest_emails WHERE application_id = $1', [id]);
    await pool.query('UPDATE playtest_keys SET application_id = NULL WHERE application_id = $1', [id]);
    const result = await pool.query('DELETE FROM playtest_applications WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  /**
   * The application a tester is trying to submit for, or null. Both halves
   * must match: the reference is a six-character code somebody might share,
   * and the email is the one thing only its owner is likely to know.
   */
  async function findForSubmission(reference, email) {
    const application = await getByReference(String(reference ?? '').trim());
    if (!application) return null;
    const given = String(email ?? '').trim().toLowerCase();
    if (!given || given !== application.email.toLowerCase()) return null;
    return application;
  }

  async function getSubmission(applicationId) {
    const result = await pool.query(
      'SELECT * FROM playtest_submissions WHERE application_id = $1',
      [applicationId]
    );
    return rowToSubmission(result.rows[0]);
  }

  /**
   * Store or replace the tester's submission and move the application to
   * Submitted. The first submission date is kept across corrections — it is
   * the date the payment clock started — and a Paid application is closed.
   */
  async function saveSubmission(applicationId, input) {
    const application = await getById(applicationId);
    if (!canSubmit(application)) {
      throw new ApplicationValidationError('This application is not open for a submission', 'status');
    }
    const submission = normaliseSubmission(input);
    const existing = await getSubmission(applicationId);
    const values = [
      JSON.stringify(submission.answers), submission.headsetPlayed, submission.minutesPlayed,
      submission.progressReturned, submission.evidenceUrl, submission.clipUrl, submission.evidenceNote, submission.paypalAccount
    ];
    let saved;
    if (existing) {
      saved = await pool.query(`
        UPDATE playtest_submissions SET
          answers = $1, headset_played = $2, minutes_played = $3, progress_returned = $4,
          evidence_url = $5, clip_url = $6, evidence_note = $7, paypal_account = $8,
          submission_count = submission_count + 1, updated_at = NOW()
        WHERE application_id = $9
        RETURNING *
      `, [...values, applicationId]);
    } else {
      saved = await pool.query(`
        INSERT INTO playtest_submissions
          (answers, headset_played, minutes_played, progress_returned, evidence_url, clip_url, evidence_note, paypal_account, application_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [...values, applicationId]);
    }
    const updated = application.status === 'submitted' ? application : await setStatus(applicationId, 'submitted');
    return { submission: rowToSubmission(saved.rows[0]), application: updated, corrected: Boolean(existing) };
  }

  /**
   * Add keys pasted from the Meta dashboard, one per line. Anything that is
   * not a plausible key is skipped, and so is a key already on file — pasting
   * the same list twice is harmless.
   */
  async function addKeys(text) {
    const candidates = [...new Set(
      String(text ?? '').split(/[\s,;]+/).map((entry) => entry.trim().toUpperCase()).filter((entry) => /^[A-Z0-9-]{12,64}$/.test(entry))
    )];
    let added = 0;
    for (const key of candidates) {
      const existing = await pool.query('SELECT 1 FROM playtest_keys WHERE key = $1', [key]);
      if (existing.rows.length) continue;
      await pool.query('INSERT INTO playtest_keys (key) VALUES ($1)', [key]);
      added += 1;
    }
    return { added, skipped: candidates.length - added };
  }

  async function keySummary() {
    const result = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        SUM(CASE WHEN assigned_at IS NULL THEN 1 ELSE 0 END)::int AS unused
      FROM playtest_keys
    `);
    const row = result.rows[0] ?? {};
    return { total: Number(row.total ?? 0), unused: Number(row.unused ?? 0) };
  }

  async function keyFor(applicationId) {
    const result = await pool.query(
      'SELECT key, assigned_at FROM playtest_keys WHERE application_id = $1',
      [applicationId]
    );
    return result.rows[0] ? { key: result.rows[0].key, assignedAt: iso(result.rows[0].assigned_at) } : null;
  }

  /**
   * The key for an application: the one it already has, or the oldest unused
   * one, now marked spent. Null only when there are none left — in which case
   * nothing has changed, and the caller must not invite.
   */
  async function assignKey(applicationId) {
    const held = await keyFor(applicationId);
    if (held) return held;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const next = await client.query(`
        SELECT id, key FROM playtest_keys WHERE assigned_at IS NULL ORDER BY added_at ASC, id ASC LIMIT 1
      `);
      if (!next.rows[0]) {
        await client.query('ROLLBACK');
        return null;
      }
      const result = await client.query(`
        UPDATE playtest_keys SET application_id = $1, assigned_at = NOW() WHERE id = $2 RETURNING key, assigned_at
      `, [applicationId, next.rows[0].id]);
      await client.query('COMMIT');
      return { key: result.rows[0].key, assignedAt: iso(result.rows[0].assigned_at) };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /** Note that an email went out, so its events can be matched when they arrive. */
  async function recordEmail({ applicationId = null, kind, recipient, messageId }) {
    if (!messageId) return null;
    const result = await pool.query(`
      INSERT INTO playtest_emails (application_id, kind, recipient, message_id)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [applicationId, kind, recipient, messageId]);
    return rowToEmail(result.rows[0]);
  }

  /**
   * Apply one SES event. Each timestamp column records the first time its
   * event happened; clicks are counted. Returns false for a message id the
   * site never sent, which is how the endpoint knows to ignore it.
   */
  async function recordEmailEvent(messageId, { kind, at, detail = '' }) {
    const columns = {
      delivery: 'delivered_at = COALESCE(delivered_at, $2)',
      bounce: 'bounced_at = COALESCE(bounced_at, $2), bounce_detail = CASE WHEN bounce_detail = \'\' THEN $3 ELSE bounce_detail END',
      complaint: 'complained_at = COALESCE(complained_at, $2)',
      reject: 'rejected_at = COALESCE(rejected_at, $2), reject_detail = CASE WHEN reject_detail = \'\' THEN $3 ELSE reject_detail END',
      click: 'first_click_at = COALESCE(first_click_at, $2), click_count = click_count + 1',
      open: 'first_open_at = COALESCE(first_open_at, $2), open_count = open_count + 1',
      send: 'sent_at = sent_at'
    };
    const assignment = columns[kind];
    if (!assignment) return false;
    const params = assignment.includes('$3') ? [messageId, at, String(detail ?? '')] : [messageId, at];
    const result = await pool.query(`
      UPDATE playtest_emails SET ${assignment}, last_event_at = $2 WHERE message_id = $1
    `, params);
    return result.rowCount > 0;
  }

  async function emailsFor(applicationId) {
    const result = await pool.query(
      'SELECT * FROM playtest_emails WHERE application_id = $1 ORDER BY sent_at ASC, id ASC',
      [applicationId]
    );
    return result.rows.map(rowToEmail);
  }

  /** Every email ever sent to an applicant, newest first, with who it went to. */
  async function listEmails() {
    const result = await pool.query(`
      SELECT e.*, a.reference, a.status AS application_status
      FROM playtest_emails e LEFT JOIN playtest_applications a ON a.id = e.application_id
      ORDER BY e.sent_at DESC, e.id DESC
    `);
    return result.rows.map((row) => ({ ...rowToEmail(row), reference: row.reference ?? '', applicationStatus: row.application_status ?? '' }));
  }

  /** Application ids with any bounced, rejected or complained email — for the list page. */
  async function troubledApplicationIds() {
    const result = await pool.query(`
      SELECT DISTINCT application_id FROM playtest_emails
      WHERE application_id IS NOT NULL AND (bounced_at IS NOT NULL OR rejected_at IS NOT NULL OR complained_at IS NOT NULL)
    `);
    return new Set(result.rows.map((row) => Number(row.application_id)));
  }

  async function listSubmissions() {
    const result = await pool.query(`
      SELECT s.*, a.reference, a.email, a.status
      FROM playtest_submissions s JOIN playtest_applications a ON a.id = s.application_id
      ORDER BY s.submitted_at DESC
    `);
    return result.rows.map((row) => ({ ...rowToSubmission(row), reference: row.reference, email: row.email, status: row.status }));
  }

  async function listApplications() {
    const result = await pool.query(
      'SELECT * FROM playtest_applications ORDER BY created_at DESC, id DESC'
    );
    return result.rows.map(rowToApplication);
  }

  /** Counts for the dashboard, and the device spread the study recruits against. */
  async function summarise() {
    const applications = await listApplications();
    const byStatus = Object.fromEntries(statuses.map((status) => [status.id, 0]));
    const byHeadset = Object.fromEntries(headsets.map((headset) => [headset.id, 0]));
    for (const application of applications) {
      byStatus[application.status] = (byStatus[application.status] ?? 0) + 1;
      byHeadset[application.headset] = (byHeadset[application.headset] ?? 0) + 1;
    }
    return { total: applications.length, byStatus, byHeadset };
  }

  return {
    createApplication,
    getById,
    getByReference,
    listApplications,
    setStatus,
    deleteApplication,
    findForSubmission,
    addKeys,
    keySummary,
    keyFor,
    assignKey,
    getSubmission,
    saveSubmission,
    recordEmail,
    recordEmailEvent,
    emailsFor,
    listEmails,
    troubledApplicationIds,
    listSubmissions,
    summarise,
    close() { return pool.end(); }
  };
}
