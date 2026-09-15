import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';

import { assetVersion, cacheControlFor, createStaticMiddleware, stylesheetPath } from './assets.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));

async function serve(publicDir) {
  const app = express();
  app.use(createStaticMiddleware(publicDir));
  app.get('/press', (req, res) => res.send('press page'));
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    stop: () => new Promise((resolve) => server.close(resolve))
  };
}

test('assets are immutable for a year, except the files that change in place', () => {
  assert.equal(cacheControlFor('/public/css/styles.css'), 'public, max-age=31536000, immutable');
  assert.equal(cacheControlFor('/public/video/hero-loop-detector.mp4'), 'public, max-age=31536000, immutable');
  assert.equal(cacheControlFor('/public/images/hero-poster.jpg'), 'public, max-age=31536000, immutable');
  for (const file of ['/public/sitemap.xml', '/public/robots.txt', '/public/press/buried-worlds-press-kit.zip']) {
    assert.equal(cacheControlFor(file), 'public, max-age=3600', file);
  }
});

test('the served headers match, and the directory redirect stays off', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-assets-'));
  fs.mkdirSync(path.join(dir, 'css'));
  fs.mkdirSync(path.join(dir, 'press'));
  fs.writeFileSync(path.join(dir, 'css', 'styles.css'), 'body{}');
  fs.writeFileSync(path.join(dir, 'sitemap.xml'), '<urlset/>');
  fs.writeFileSync(path.join(dir, 'press', 'kit.zip'), 'zip');
  const server = await serve(dir);
  try {
    const css = await fetch(`${server.url}/css/styles.css?v=abc123`);
    assert.equal(css.status, 200);
    assert.equal(css.headers.get('cache-control'), 'public, max-age=31536000, immutable');

    const sitemap = await fetch(`${server.url}/sitemap.xml`);
    assert.equal(sitemap.headers.get('cache-control'), 'public, max-age=3600');

    const zip = await fetch(`${server.url}/press/kit.zip`);
    assert.equal(zip.headers.get('cache-control'), 'public, max-age=3600');

    // /press is a route AND a directory; static must not answer it with a 301.
    const press = await fetch(`${server.url}/press`, { redirect: 'manual' });
    assert.equal(press.status, 200);
    assert.equal(await press.text(), 'press page');
  } finally {
    await server.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the stylesheet version follows its bytes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-version-'));
  const file = path.join(dir, 'a.css');
  fs.writeFileSync(file, 'body{color:red}');
  const first = assetVersion(file);
  assert.match(first, /^[0-9a-f]{10}$/);
  assert.equal(assetVersion(file), first, 'stable for the same bytes');
  fs.writeFileSync(file, 'body{color:blue}');
  assert.notEqual(assetVersion(file), first, 'changes when the file does');
  fs.rmSync(dir, { recursive: true, force: true });

  // And the real one resolves.
  assert.match(assetVersion(stylesheetPath(path.join(root, 'public'))), /^[0-9a-f]{10}$/);
});

test('every page links the stylesheet with its version when one is set, and without one otherwise', async () => {
  const app = express();
  app.set('view engine', 'pug');
  app.set('views', path.join(root, 'views'));
  Object.assign(app.locals, {
    siteUrl: 'https://www.buriedworlds.com', product: { name: 'Buried Worlds VR' }, links: {}, trailer: {}
  });
  app.get('/versioned', (req, res) => res.render('privacy', { pagePath: '/privacy', assetVersion: 'deadbeef00' }));
  app.get('/plain', (req, res) => res.render('privacy', { pagePath: '/privacy' }));
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  try {
    const url = `http://127.0.0.1:${server.address().port}`;
    const versioned = await (await fetch(`${url}/versioned`)).text();
    assert.ok(versioned.includes('href="/css/styles.css?v=deadbeef00"'));
    const plain = await (await fetch(`${url}/plain`)).text();
    assert.ok(plain.includes('href="/css/styles.css"'));
    assert.ok(!plain.includes('?v=undefined'));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
