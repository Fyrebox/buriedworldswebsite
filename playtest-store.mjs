// PostgreSQL persistence for paid-playtest applications.
//
// This is the first table on the site that holds contact details, so it is kept
// deliberately small: what a person typed, what status their application is at,
// and the three timestamps the study reports on. No IP address, no cookie, no
// user agent, nothing derived. Everything here is something the applicant
// knowingly wrote into the form.

import crypto from 'node:crypto';

import pg from 'pg';

import { captureMethods, headsets, statuses, study, vrFrequencies } from './data/playtest.mjs';

const { Pool } = pg;

const HEADSET_IDS = new Set(headsets.map((headset) => headset.id));
const FREQUENCY_IDS = new Set(vrFrequencies.map((frequency) => frequency.id));
const CAPTURE_IDS = new Set(captureMethods.map((method) => method.id));
const STATUS_IDS = new Set(statuses.map((status) => status.id));

export const LIMITS = {
  email: 254,
  horizonUsername: 64,
  recentGames: 200,
  country: 60,
  notes: 1000,
  adminNote: 2000
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
    over18: requireTick(input.over18, 'over18', 'You must be 18 or over to take part'),
    canFinish: requireTick(
      input.canFinish,
      'canFinish',
      `Please confirm you can finish within ${study.deadlineHours} hours of getting access`
    ),
    acceptedTerms: requireTick(
      input.acceptedTerms,
      'acceptedTerms',
      'Please confirm you have read the payment conditions and the privacy note'
    ),
    termsVersion: study.termsVersion
  };
}

function iso(value) {
  return value instanceof Date ? value.toISOString() : value;
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS playtest_applications (
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

    CREATE UNIQUE INDEX IF NOT EXISTS playtest_applications_email_lower
      ON playtest_applications (LOWER(email));
    CREATE UNIQUE INDEX IF NOT EXISTS playtest_applications_reference
      ON playtest_applications (reference);
    CREATE INDEX IF NOT EXISTS playtest_applications_created
      ON playtest_applications (created_at DESC);
  `);

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
             recent_games, country, played_before, notes, terms_version)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `, [
          reference, application.email, application.horizonUsername, application.headset,
          application.vrFrequency, application.captureMethod, application.recentGames,
          application.country, application.playedBefore, application.notes,
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
    const result = await pool.query('DELETE FROM playtest_applications WHERE id = $1', [id]);
    return result.rowCount > 0;
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
    summarise,
    close() { return pool.end(); }
  };
}
