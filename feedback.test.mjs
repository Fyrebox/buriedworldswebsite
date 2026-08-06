// Tests for the in-game feedback intake. Run with `npm test` (node's built-in runner,
// no dependencies). The HTTP cases start the router on an ephemeral port and use fetch.

import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  createFeedbackRouter,
  createRateLimiter,
  normaliseSubmission,
  ValidationError,
  SCHEMA_VERSION
} from './feedback.mjs';

function validBody(overrides = {}) {
  return {
    schema: SCHEMA_VERSION,
    installId: 'a1b2c3d4e5f6',
    questionnaireVersion: 1,
    rating: 4,
    answers: [{ questionId: 'enjoyed_most', optionIds: ['digging', 'panning'] }],
    note: '',
    context: { appVersion: '0.9', scene: 'BallaratScene' },
    ...overrides
  };
}

/** Start the router on a random free port; returns the base URL and a stop(). */
async function startServer(options = {}) {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'bw-feedback-'));
  const app = express();
  app.use('/api/feedback', createFeedbackRouter({ dataDir, ...options }));

  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });

  return {
    dataDir,
    url: `http://127.0.0.1:${server.address().port}/api/feedback`,
    stop: () => new Promise((resolve) => server.close(resolve))
  };
}

function post(url, body, headers = {}) {
  return fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
}

test('normaliseSubmission accepts a well-formed submission and trims it', () => {
  const record = normaliseSubmission(validBody({ installId: '  padded-id  ' }));

  assert.equal(record.installId, 'padded-id');
  assert.equal(record.rating, 4);
  assert.deepEqual(record.answers[0].optionIds, ['digging', 'panning']);
});

test('normaliseSubmission rejects the wrong schema version', () => {
  assert.throws(() => normaliseSubmission(validBody({ schema: 99 })), ValidationError);
});

test('normaliseSubmission rejects an out-of-range or fractional rating', () => {
  assert.throws(() => normaliseSubmission(validBody({ rating: 6 })), ValidationError);
  assert.throws(() => normaliseSubmission(validBody({ rating: -1 })), ValidationError);
  assert.throws(() => normaliseSubmission(validBody({ rating: 3.5 })), ValidationError);
});

test('normaliseSubmission rejects a submission with nothing in it', () => {
  assert.throws(
    () => normaliseSubmission(validBody({ rating: 0, answers: [], note: '' })),
    ValidationError
  );
});

test('normaliseSubmission rejects an over-long note but keeps one at the limit', () => {
  assert.throws(() => normaliseSubmission(validBody({ note: 'x'.repeat(2001) })), ValidationError);
  const record = normaliseSubmission(validBody({ note: 'x'.repeat(2000) }));
  assert.equal(record.note.length, 2000);
});

test('normaliseSubmission drops non-scalar context values and caps the rest', () => {
  const record = normaliseSubmission(
    validBody({
      context: {
        appVersion: '1.0',
        nested: { evil: true },
        list: [1, 2, 3],
        nothing: null,
        notANumber: Number.NaN,
        fps: 71.5,
        devBuild: false,
        long: 'y'.repeat(500)
      }
    })
  );

  assert.deepEqual(Object.keys(record.context).sort(), [
    'appVersion',
    'devBuild',
    'fps',
    'long'
  ]);
  assert.equal(record.context.long.length, 200);
  assert.equal(record.context.devBuild, false);
});

test('normaliseSubmission caps the number of answers and options', () => {
  const answers = Array.from({ length: 21 }, (_, index) => ({
    questionId: `q${index}`,
    optionIds: ['a']
  }));
  assert.throws(() => normaliseSubmission(validBody({ answers })), ValidationError);

  const wideAnswer = [{ questionId: 'q', optionIds: Array(21).fill('a') }];
  assert.throws(() => normaliseSubmission(validBody({ answers: wideAnswer })), ValidationError);
});

test('rate limiter allows up to max per window, then refuses until it rolls over', () => {
  let clock = 0;
  const limiter = createRateLimiter({ max: 2, windowMs: 1000, now: () => clock });

  assert.equal(limiter.take('key'), true);
  assert.equal(limiter.take('key'), true);
  assert.equal(limiter.take('key'), false);
  assert.equal(limiter.take('other'), true, 'a different key has its own window');

  clock = 1000;
  assert.equal(limiter.take('key'), true, 'the window has rolled over');
});

test('POST stores a submission as JSONL and never records the IP', async () => {
  const server = await startServer();
  try {
    const response = await post(server.url, validBody({ note: 'the panning is lovely' }));
    assert.equal(response.status, 202);

    const files = await readdir(server.dataDir);
    assert.equal(files.length, 1);
    assert.match(files[0], /^\d{4}-\d{2}\.jsonl$/);

    const contents = await readFile(path.join(server.dataDir, files[0]), 'utf8');
    const lines = contents.split('\n').filter(Boolean);
    assert.equal(lines.length, 1);

    const stored = JSON.parse(lines[0]);
    assert.equal(stored.rating, 4);
    assert.equal(stored.note, 'the panning is lovely');
    assert.ok(stored.receivedAt, 'the server stamps its own receipt time');
    assert.equal(stored.ip, undefined, 'the IP must never reach disk');
    assert.ok(!contents.includes('127.0.0.1'));
  } finally {
    await server.stop();
  }
});

test('POST rejects a bad app key and accepts the right one', async () => {
  const server = await startServer({ appKey: 'shared-secret' });
  try {
    assert.equal((await post(server.url, validBody())).status, 401);
    assert.equal(
      (await post(server.url, validBody(), { 'x-app-key': 'wrong' })).status,
      401
    );
    assert.equal(
      (await post(server.url, validBody(), { 'x-app-key': 'shared-secret' })).status,
      202
    );
  } finally {
    await server.stop();
  }
});

test('POST answers malformed JSON and oversized bodies with JSON, not HTML', async () => {
  const server = await startServer();
  try {
    const malformed = await post(server.url, '{not json');
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json()).error, 'malformed JSON');

    const huge = await post(server.url, validBody({ note: 'x'.repeat(64 * 1024) }));
    assert.equal(huge.status, 413);
    assert.equal((await huge.json()).ok, false);
  } finally {
    await server.stop();
  }
});

test('POST rate limits a single install id after five submissions', async () => {
  const server = await startServer();
  try {
    for (let index = 0; index < 5; index += 1) {
      const response = await post(server.url, validBody({ rating: 3 }));
      assert.equal(response.status, 202, `submission ${index + 1} should be accepted`);
    }

    const blocked = await post(server.url, validBody({ rating: 3 }));
    assert.equal(blocked.status, 429);
  } finally {
    await server.stop();
  }
});

test('GET is hidden without a token, guarded with one, and returns newest first', async () => {
  const hidden = await startServer();
  try {
    assert.equal((await fetch(hidden.url)).status, 404);
  } finally {
    await hidden.stop();
  }

  const server = await startServer({ adminToken: 'let-me-in' });
  try {
    await post(server.url, validBody({ rating: 1, installId: 'first' }));
    await post(server.url, validBody({ rating: 5, installId: 'second' }));

    assert.equal((await fetch(server.url)).status, 401);
    assert.equal(
      (await fetch(server.url, { headers: { authorization: 'Bearer nope' } })).status,
      401
    );

    const response = await fetch(server.url, {
      headers: { authorization: 'Bearer let-me-in' }
    });
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.count, 2);
    assert.equal(body.entries[0].installId, 'second', 'newest first');
    assert.equal(body.entries[1].installId, 'first');
  } finally {
    await server.stop();
  }
});
