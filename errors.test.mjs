import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createErrorHandler, notFoundHandler } from './errors.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const logged = [];
  const app = express();
  app.disable('x-powered-by');
  app.set('view engine', 'pug');
  app.set('views', path.join(root, 'views'));
  app.locals.siteUrl = 'https://www.buriedworlds.com';
  app.locals.links = { discord: 'https://discord.example/invite' };

  app.get('/explode', () => {
    throw new Error('sensitive internal message');
  });
  app.get('/api/explode', () => {
    throw new Error('private API failure');
  });
  app.use(notFoundHandler);
  app.use(createErrorHandler({ onError: (error) => logged.push(error) }));

  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  return {
    logged,
    url: `http://127.0.0.1:${server.address().port}`,
    stop: () => new Promise((resolve) => server.close(resolve))
  };
}

test('unknown pages render the branded 404 with the requested path', async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.url}/lost-expedition`);
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
    const html = await response.text();
    assert.match(html, /Nothing buried here/);
    assert.match(html, /\/lost-expedition/);
    assert.match(html, /Return to base camp/);
    assert.match(html, /googletagmanager/);
  } finally {
    await server.stop();
  }
});

test('unexpected failures render a safe branded 500 and are logged', async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.url}/explode`);
    assert.equal(response.status, 500);
    const html = await response.text();
    assert.match(html, /The detector went quiet/);
    assert.match(html, /Try again/);
    assert.doesNotMatch(html, /sensitive internal message/);
    assert.doesNotMatch(html, /googletagmanager/);
    assert.equal(server.logged.length, 1);
    assert.equal(server.logged[0].message, 'sensitive internal message');
  } finally {
    await server.stop();
  }
});

test('API 404s and failures remain machine-readable JSON', async () => {
  const server = await startServer();
  try {
    const missing = await fetch(`${server.url}/api/missing`);
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { ok: false, error: 'not found' });

    const failed = await fetch(`${server.url}/api/explode`);
    assert.equal(failed.status, 500);
    assert.deepEqual(await failed.json(), { ok: false, error: 'server error' });
  } finally {
    await server.stop();
  }
});
