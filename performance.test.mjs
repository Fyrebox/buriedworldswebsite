// Guards for the page-weight decisions: self-hosted fonts, a hero loop that
// phones never download, a poster that is preloaded and a tag script that is
// not on the critical path. Each is a thing that a well-meant edit could undo
// without anything visibly breaking.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';

import { links, product, siteUrl, trailer, worlds, loopSteps, signalRows } from './data/content.mjs';
import { createGuidesRouter } from './guides.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, 'public');
const css = fs.readFileSync(path.join(publicDir, 'css', 'styles.css'), 'utf8');
const layout = fs.readFileSync(path.join(root, 'views', 'layout.pug'), 'utf8');

async function startServer() {
  const app = express();
  app.set('view engine', 'pug');
  app.set('views', path.join(root, 'views'));
  Object.assign(app.locals, { siteUrl, product, links, trailer });
  app.get('/', (req, res) => res.render('index', {
    heroVariant: 'poster', showLockedCard: true, loopSteps, worlds, signalRows, pagePath: '/',
    preloadImage: trailer.poster
  }));
  app.use(createGuidesRouter({ siteUrl, product }));
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    stop: () => new Promise((resolve) => server.close(resolve))
  };
}

// ---- Fonts -------------------------------------------------------------

test('every @font-face file exists, is WOFF2, and ships with its licence', () => {
  const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(faces.length >= 4, 'four faces: Oswald, Cormorant ×2, Inter');
  for (const face of faces) {
    const src = /url\('([^']+)'\)/.exec(face)[1];
    const file = path.join(publicDir, src);
    assert.ok(fs.existsSync(file), `${src} missing`);
    const magic = fs.readFileSync(file).subarray(0, 4).toString('latin1');
    assert.equal(magic, 'wOF2', `${src} is not WOFF2`);
    assert.ok(face.includes('font-display: swap'), `${src}: font-display swap`);
    assert.ok(/font-weight:\s*\d+\s+\d+/.test(face), `${src}: a variable weight range`);
  }
  for (const family of ['oswald', 'cormorantgaramond', 'inter']) {
    const licence = path.join(publicDir, 'fonts', `OFL-${family}.txt`);
    assert.ok(fs.existsSync(licence), `OFL-${family}.txt`);
    assert.ok(fs.readFileSync(licence, 'utf8').includes('SIL OPEN FONT LICENSE'), family);
  }
  const families = new Set(faces.map((face) => /font-family:\s*'([^']+)'/.exec(face)[1]));
  assert.deepEqual([...families].sort(), ['Cormorant Garamond', 'Inter', 'Oswald']);
});

test('nothing on any page reaches for Google Fonts', async () => {
  assert.ok(!layout.includes('fonts.googleapis.com'), 'layout');
  assert.ok(!layout.includes('fonts.gstatic.com'), 'layout preconnect');
  const server = await startServer();
  try {
    for (const route of ['/', '/faq']) {
      const html = await (await fetch(`${server.url}${route}`)).text();
      assert.ok(!html.includes('fonts.googleapis'), route);
      assert.ok(html.includes('rel="preload" as="font" type="font/woff2" href="/fonts/oswald-latin.woff2" crossorigin="anonymous"'), `${route}: Oswald preloaded`);
      assert.ok(html.includes('href="/fonts/inter-latin.woff2"'), `${route}: Inter preloaded`);
    }
  } finally {
    await server.stop();
  }
});

// ---- Hero --------------------------------------------------------------

test('the hero poster is a WebP that exists, and only the homepage preloads it', async () => {
  assert.match(trailer.poster, /\.webp$/);
  const file = path.join(publicDir, trailer.poster);
  assert.ok(fs.existsSync(file));
  assert.ok(fs.statSync(file).size < 120_000, 'poster stays under 120 KB');
  assert.ok(!fs.existsSync(path.join(publicDir, 'images', 'hero-poster.jpg')), 'the old JPEG is gone, not replaced in place');

  const server = await startServer();
  try {
    const home = await (await fetch(`${server.url}/`)).text();
    assert.ok(home.includes(`<link rel="preload" as="image" href="${trailer.poster}" fetchpriority="high">`));
    const faq = await (await fetch(`${server.url}/faq`)).text();
    assert.ok(!faq.includes('rel="preload" as="image"'), 'other pages do not preload the hero poster');
  } finally {
    await server.stop();
  }
});

test('the hero loop is never a bare <source src>, so phones do not download it', async () => {
  const server = await startServer();
  try {
    const html = await (await fetch(`${server.url}/`)).text();
    const video = /<video class="keyart__video"[\s\S]*?<\/video>/.exec(html)?.[0];
    assert.ok(video, 'hero video present');
    assert.ok(video.includes(`data-src="${trailer.loop}"`), 'source carries data-src');
    assert.ok(!/<source[^>]*\ssrc=/.test(video), 'no eager src');
    assert.ok(video.includes(`poster="${trailer.poster}"`));
    // The script that attaches it gates on width and on reduced motion.
    assert.ok(html.includes("matchMedia('(min-width: 720px)')"));
    assert.ok(html.includes("matchMedia('(prefers-reduced-motion: reduce)')"));
    assert.ok(html.includes('source.src = source.dataset.src'));
  } finally {
    await server.stop();
  }
});

// ---- Analytics ---------------------------------------------------------

test('gtag is loaded off the critical path, with events queued until it arrives', async () => {
  assert.ok(!/script\(async src="https:\/\/www\.googletagmanager\.com/.test(layout), 'no blocking script tag in the layout');
  const server = await startServer();
  try {
    const html = await (await fetch(`${server.url}/`)).text();
    assert.ok(!html.includes('<script async src="https://www.googletagmanager.com'), 'not a head script');
    assert.ok(html.includes("s.src = 'https://www.googletagmanager.com/gtag/js?id=G-PVF7WKPPFD'"), 'loaded by script instead');
    assert.ok(html.includes('requestIdleCallback(load, { timeout: 3000 })'));
    assert.ok(html.includes("['pointerdown', 'keydown', 'scroll', 'touchstart']"));
    // The stub that queues calls precedes the loader.
    assert.ok(html.indexOf('function gtag(){dataLayer.push(arguments);}') < html.indexOf("s.src = 'https://www.googletagmanager.com"));
  } finally {
    await server.stop();
  }
});

// ---- Privacy policy stays true -----------------------------------------

test('the privacy policy no longer names Google Fonts, and still names Analytics', () => {
  const privacy = fs.readFileSync(path.join(root, 'views', 'privacy.pug'), 'utf8');
  assert.ok(!privacy.includes('Google Fonts'));
  assert.ok(privacy.includes('served from this site'));
  assert.ok(privacy.includes('Google Analytics'));
});
