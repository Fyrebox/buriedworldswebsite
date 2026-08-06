// In-game feedback intake for Buried Worlds VR.
//
// The headset posts a small JSON submission — a 1-5 rating, tapped multiple-choice
// answers, and a build/device context block — to POST /api/feedback. Submissions are
// appended to a month-per-file JSONL log under data/feedback/ and, if a Discord webhook
// is configured, echoed into the community server so they are actually read.
//
// Deliberate omissions, so the privacy policy stays true:
//   - No cookies, no sessions, no accounts.
//   - The client's IP is used for rate limiting in memory only, and is NEVER written
//     to disk or forwarded to Discord.
//   - The only identifier stored is the game's own random install id, which is
//     generated on the headset and maps to no account, person or device serial.

import express from 'express';
import { appendFile, mkdir, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

/** Payload contract version. The game sends `schema`; a mismatch is rejected outright. */
export const SCHEMA_VERSION = 1;

/** Bodies above this are refused before parsing — the real payload is ~1 KB. */
export const MAX_BODY_BYTES = 32 * 1024;

const LIMITS = {
  installId: 64,
  questionId: 64,
  optionId: 64,
  answers: 20,
  optionsPerAnswer: 20,
  note: 2000,
  contextKeys: 40,
  contextKeyLength: 40,
  contextValueLength: 200
};

/** Thrown by normaliseSubmission; carries the 400 reason sent back to the game. */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

function requireString(value, field, maxLength, { optional = false } = {}) {
  if (value === undefined || value === null) {
    if (optional) return '';
    throw new ValidationError(`${field} is required`);
  }
  if (typeof value !== 'string') throw new ValidationError(`${field} must be a string`);
  const trimmed = value.trim();
  if (!optional && trimmed.length === 0) throw new ValidationError(`${field} is required`);
  if (trimmed.length > maxLength) {
    throw new ValidationError(`${field} must be at most ${maxLength} characters`);
  }
  return trimmed;
}

/**
 * Context is free-form by design — the game grows new diagnostic fields without the
 * server needing a release. It is therefore capped hard: scalar leaves only, bounded
 * key count, bounded key and value length. Anything else is dropped rather than
 * rejected, so an older server never blocks a newer build's feedback.
 */
function normaliseContext(context) {
  if (context === undefined || context === null) return {};
  if (typeof context !== 'object' || Array.isArray(context)) {
    throw new ValidationError('context must be an object');
  }

  const clean = {};
  let kept = 0;
  for (const [key, value] of Object.entries(context)) {
    if (kept >= LIMITS.contextKeys) break;
    if (key.length > LIMITS.contextKeyLength) continue;

    if (typeof value === 'string') {
      clean[key] = value.slice(0, LIMITS.contextValueLength);
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      clean[key] = value;
    } else if (typeof value === 'boolean') {
      clean[key] = value;
    } else {
      continue; // objects, arrays, null, NaN: not a diagnostic we know how to store
    }
    kept += 1;
  }
  return clean;
}

function normaliseAnswers(answers) {
  if (answers === undefined || answers === null) return [];
  if (!Array.isArray(answers)) throw new ValidationError('answers must be an array');
  if (answers.length > LIMITS.answers) {
    throw new ValidationError(`answers must hold at most ${LIMITS.answers} entries`);
  }

  return answers.map((answer, index) => {
    if (typeof answer !== 'object' || answer === null || Array.isArray(answer)) {
      throw new ValidationError(`answers[${index}] must be an object`);
    }

    const questionId = requireString(
      answer.questionId,
      `answers[${index}].questionId`,
      LIMITS.questionId
    );

    const rawOptions = answer.optionIds ?? [];
    if (!Array.isArray(rawOptions)) {
      throw new ValidationError(`answers[${index}].optionIds must be an array`);
    }
    if (rawOptions.length > LIMITS.optionsPerAnswer) {
      throw new ValidationError(
        `answers[${index}].optionIds must hold at most ${LIMITS.optionsPerAnswer} entries`
      );
    }

    const optionIds = rawOptions.map((option, optionIndex) =>
      requireString(option, `answers[${index}].optionIds[${optionIndex}]`, LIMITS.optionId)
    );

    return { questionId, optionIds };
  });
}

/**
 * Validate and clean one submission. Returns the record to store; throws
 * ValidationError with a player-invisible reason the game logs but never displays.
 */
export function normaliseSubmission(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new ValidationError('body must be a JSON object');
  }

  if (body.schema !== SCHEMA_VERSION) {
    throw new ValidationError(`schema must be ${SCHEMA_VERSION}`);
  }

  const rating = body.rating ?? 0;
  if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
    throw new ValidationError('rating must be an integer between 0 and 5');
  }

  const questionnaireVersion = body.questionnaireVersion ?? 0;
  if (!Number.isInteger(questionnaireVersion) || questionnaireVersion < 0) {
    throw new ValidationError('questionnaireVersion must be a non-negative integer');
  }

  const answers = normaliseAnswers(body.answers);
  const note = requireString(body.note, 'note', LIMITS.note, { optional: true });

  // A submission with nothing in it is a UI bug or a probe, not feedback.
  if (rating === 0 && answers.length === 0 && note.length === 0) {
    throw new ValidationError('submission is empty');
  }

  return {
    schema: SCHEMA_VERSION,
    installId: requireString(body.installId, 'installId', LIMITS.installId),
    questionnaireVersion,
    rating,
    answers,
    note,
    context: normaliseContext(body.context)
  };
}

/**
 * Fixed-window counter, per key, held in memory. Deliberately not a dependency and
 * deliberately not persisted: a restart forgiving someone's quota is the harmless
 * failure here, and the point is to blunt a script, not to meter honest players.
 */
export function createRateLimiter({ max, windowMs, now = () => Date.now() }) {
  const windows = new Map();

  return {
    take(key) {
      const currentTime = now();
      const entry = windows.get(key);

      if (entry === undefined || currentTime >= entry.resetAt) {
        windows.set(key, { count: 1, resetAt: currentTime + windowMs });
        // Opportunistic sweep so an unbounded key space (many install ids) cannot grow
        // the map forever; expired entries are dropped whenever a new window opens.
        if (windows.size > 5000) {
          for (const [existingKey, existingEntry] of windows) {
            if (currentTime >= existingEntry.resetAt) windows.delete(existingKey);
          }
        }
        return true;
      }

      if (entry.count >= max) return false;
      entry.count += 1;
      return true;
    },

    get size() {
      return windows.size;
    }
  };
}

function monthlyLogName(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}.jsonl`;
}

/** Post a compact summary to Discord. Never blocks or fails the player's submission. */
async function notifyDiscord(webhookUrl, record) {
  const stars = record.rating > 0 ? `${'★'.repeat(record.rating)}${'☆'.repeat(5 - record.rating)}` : 'no rating';
  const answerLines = record.answers
    .filter((answer) => answer.optionIds.length > 0)
    .map((answer) => `**${answer.questionId}**: ${answer.optionIds.join(', ')}`);

  const context = record.context ?? {};
  const contextLine = [context.appVersion, context.scene, context.deviceModel]
    .filter(Boolean)
    .join(' · ');

  const lines = [`**Buried Worlds feedback** — ${stars}`, ...answerLines];
  if (record.note) lines.push(`> ${record.note.slice(0, 900)}`);
  if (contextLine) lines.push(`_${contextLine}_`);

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ content: lines.join('\n').slice(0, 1900) })
  });
}

/**
 * Build the feedback router.
 *
 * @param {object} options
 * @param {string} options.dataDir        Directory the JSONL logs are written to.
 * @param {string} [options.appKey]       Required X-App-Key value. Unset ⇒ no key checked.
 * @param {string} [options.adminToken]   Bearer token for GET. Unset ⇒ GET returns 404.
 * @param {string} [options.discordWebhook] Optional webhook for arrival notifications.
 * @param {() => number} [options.now]    Clock injection point for the tests.
 */
export function createFeedbackRouter({
  dataDir,
  appKey = '',
  adminToken = '',
  discordWebhook = '',
  now = () => Date.now(),
  onError = (error) => console.error('[feedback]', error)
} = {}) {
  if (!dataDir) throw new Error('createFeedbackRouter requires a dataDir');

  const router = express.Router();

  // Two windows: one that stops a single headset flooding, one that stops a single
  // source flooding across fabricated install ids.
  const perInstall = createRateLimiter({ max: 5, windowMs: 60 * 60 * 1000, now });
  const perAddress = createRateLimiter({ max: 60, windowMs: 60 * 60 * 1000, now });

  router.post('/', express.json({ limit: MAX_BODY_BYTES }), async (req, res) => {
    if (appKey && req.get('x-app-key') !== appKey) {
      return res.status(401).json({ ok: false, error: 'bad app key' });
    }

    let record;
    try {
      record = normaliseSubmission(req.body);
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ ok: false, error: error.message });
      }
      throw error;
    }

    // The address check runs first so a flood of fabricated install ids cannot each
    // burn a fresh per-install window.
    if (!perAddress.take(req.ip ?? 'unknown') || !perInstall.take(record.installId)) {
      return res.status(429).json({ ok: false, error: 'too many submissions' });
    }

    const receivedAt = new Date(now());
    const stored = { receivedAt: receivedAt.toISOString(), ...record };

    try {
      await mkdir(dataDir, { recursive: true });
      await appendFile(
        path.join(dataDir, monthlyLogName(receivedAt)),
        `${JSON.stringify(stored)}\n`,
        'utf8'
      );
    } catch (error) {
      onError(error);
      // The game keeps the submission queued on the headset and retries later, so a
      // 5xx here loses nothing.
      return res.status(503).json({ ok: false, error: 'could not store submission' });
    }

    if (discordWebhook) {
      // Fire and forget: a Discord outage must not turn into a failed submission.
      notifyDiscord(discordWebhook, stored).catch(onError);
    }

    return res.status(202).json({ ok: true });
  });

  // Read the log back. Token-gated, and absent entirely when no token is configured.
  router.get('/', async (req, res) => {
    if (!adminToken) return res.status(404).json({ ok: false, error: 'not found' });
    if (req.get('authorization') !== `Bearer ${adminToken}`) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const limit = Math.min(Math.max(Number.parseInt(req.query.limit ?? '50', 10) || 50, 1), 500);

    let files;
    try {
      files = (await readdir(dataDir)).filter((name) => name.endsWith('.jsonl')).sort().reverse();
    } catch {
      return res.json({ ok: true, count: 0, entries: [] });
    }

    const entries = [];
    for (const file of files) {
      const contents = await readFile(path.join(dataDir, file), 'utf8');
      const lines = contents.split('\n').filter(Boolean).reverse();
      for (const line of lines) {
        try {
          entries.push(JSON.parse(line));
        } catch {
          // A truncated final line (killed mid-append) is skipped, not fatal.
        }
        if (entries.length >= limit) break;
      }
      if (entries.length >= limit) break;
    }

    return res.json({ ok: true, count: entries.length, entries });
  });

  // Body-parser failures (malformed JSON, oversized body) arrive here. Without this
  // they render Express's HTML error page, which the game cannot read.
  router.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error?.type === 'entity.too.large') {
      return res.status(413).json({ ok: false, error: 'submission too large' });
    }
    if (error?.type === 'entity.parse.failed' || error instanceof SyntaxError) {
      return res.status(400).json({ ok: false, error: 'malformed JSON' });
    }
    onError(error);
    return res.status(500).json({ ok: false, error: 'server error' });
  });

  return router;
}
