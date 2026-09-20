// Guards for the things a Lighthouse accessibility audit fails on, so they
// cannot creep back in a redesign. The contrast checks read the real tokens
// from the stylesheet rather than copies of them — the point is to catch a
// palette tweak, and a test with its own hex values would not.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';

import { links, product, siteUrl, trailer, worlds, loopSteps, signalRows } from './data/content.mjs';
import { createDestinationsRouter } from './destinations.mjs';
import { createGuidesRouter } from './guides.mjs';
import { notFoundHandler } from './errors.mjs';
import { study } from './data/playtest.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(root, 'public', 'css', 'styles.css'), 'utf8');

/** The :root custom properties, as { name: '#RRGGBB' }. */
function tokens() {
  const block = /:root\s*\{([\s\S]*?)\n\}/.exec(css)[1];
  const out = {};
  for (const [, name, value] of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) out[name] = value;
  return out;
}

// WCAG 2.x relative luminance and contrast ratio.
function luminance(hex) {
  const channel = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = hex.slice(1).match(/../g).map((h) => channel(parseInt(h, 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

async function startServer(locals = {}) {
  const app = express();
  app.set('view engine', 'pug');
  app.set('views', path.join(root, 'views'));
  Object.assign(app.locals, { siteUrl, product, links, trailer }, locals);
  app.get('/', (req, res) => res.render('index', {
    heroVariant: 'poster', showLockedCard: true, loopSteps, worlds, signalRows, pagePath: '/',
    playtestOpen: req.query.closed === undefined, study
  }));
  app.get('/press', (req, res) => res.render('press', {
    pagePath: '/press', kitFile: 'kit.zip', kitSize: '1 MB', pressContact: 'press@example.com',
    descriptions: { oneLine: '', short: '', full: [] }, expeditions: [], loop: [], screenshots: [], art: []
  }));
  app.use(createDestinationsRouter({ siteUrl, product }));
  app.use(createGuidesRouter({ siteUrl, product }));
  app.use(notFoundHandler);
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    stop: () => new Promise((resolve) => server.close(resolve))
  };
}

// ---- Colour ------------------------------------------------------------

test('every text/background pair the site uses clears WCAG AA in every state', () => {
  const t = tokens();
  // [label, text, background, minimum]. 4.5 is small text; 3 is large (≥24px, or ≥18.66px bold).
  const pairs = [
    ['primary button, rest', t.parchment, t['bronze-link'], 4.5],
    ['primary button, hover', t.paper, t.bronze, 4.5],
    ['live badge', t.parchment, t['bronze-link'], 4.5],
    ['footer Discord button', t.parchment, t['bronze-link'], 4.5],
    ['secondary button', t['bronze-link'], t.paper, 4.5],
    ['gold button, rest', t['bw-bg'], t['bw-gold'], 4.5],
    ['gold button, hover', t['bw-bg'], t['bw-gold-bright'], 4.5],
    ['body text on paper', t.ink, t.paper, 4.5],
    ['soft text on paper', t['ink-soft'], t.paper, 4.5],
    ['soft text on parchment', t['ink-soft'], t.parchment, 4.5],
    ['small bronze labels on parchment', t['bronze-link'], t.parchment, 4.5],
    ['small bronze labels on paper', t['bronze-link'], t.paper, 4.5],
    ['large bronze numerals on parchment', t.bronze, t.parchment, 3],
    ['footer muted copy', t['bw-muted'], t['bw-bg'], 4.5],
    ['footer links', '#C89A62', t['bw-bg'], 4.5],
    ['dark band text', t['bw-text'], t['bw-bg'], 4.5]
  ];
  for (const [label, text, background, minimum] of pairs) {
    assert.ok(text && background, `${label}: token missing`);
    const ratio = contrast(text, background);
    assert.ok(ratio >= minimum, `${label}: ${ratio.toFixed(2)}:1, needs ${minimum}:1`);
  }
});

test('no rule fills a pale-text control with the brand bronze', () => {
  // The three that Lighthouse flagged. --bronze is 4.35:1 under parchment;
  // --bronze-link is 5.50:1. A future redesign that reaches for the brand
  // colour here reintroduces the failure.
  for (const selector of ['.btn--primary', '.badge--live', '.footer__cta']) {
    const rule = new RegExp(`${selector.replace('.', '\\.')}\\s*\\{[^}]*\\}`).exec(css)?.[0];
    assert.ok(rule, `${selector} rule not found`);
    assert.ok(rule.includes('var(--bronze-link)'), `${selector} must fill with --bronze-link`);
    assert.ok(!/background:\s*var\(--bronze\)/.test(rule), `${selector} fills with --bronze`);
  }
});

test('small bronze text never uses the brand bronze directly', () => {
  // Every `color: var(--bronze)` left in the stylesheet must be decorative or
  // large: ornaments, markers, separators, hover states, the 2rem loop numerals.
  const allowed = /^(a:hover|\.ornament|\.loop-card__num|\.legal__home:hover|\.hero__meta-dot|\.ea-card__list li::marker|\.press-loop li::marker|\.destination__crumbs a:hover|\.destination__crumb-sep|\.destination__beats li::marker|\.destination__sibling:hover|\.guide__links a:hover|\.blog-body li::marker)/;
  const lines = css.split('\n');
  let selector = '';
  for (const line of lines) {
    if (/^\s*[.a-zA-Z*:@\[][^{]*\{/.test(line)) selector = line.trim().split('{')[0].trim();
    if (!line.includes('color: var(--bronze);') || line.includes('accent-color')) continue;
    assert.ok(allowed.test(selector), `${selector} sets small text to --bronze (4.35:1 on parchment); use --bronze-link`);
  }
});

// ---- Structure ---------------------------------------------------------

test('every public page has a main landmark the skip link can reach', async () => {
  const server = await startServer();
  try {
    for (const route of ['/', '/press', '/destinations/ballarat', '/faq', '/about']) {
      const html = await (await fetch(`${server.url}${route}`)).text();
      assert.equal((html.match(/<main\b/g) || []).length, 1, `${route}: exactly one <main>`);
      assert.match(html, /<main\b[^>]*\bid="content"/, `${route}: main#content`);
      assert.ok(html.includes('<a class="skip" href="#content">Skip to content</a>'), `${route}: skip link`);
      assert.ok(html.indexOf('class="skip"') < html.indexOf('<main'), `${route}: skip link precedes main`);
    }
  } finally {
    await server.stop();
  }
});

test('the paid playtest is announced across the top of the homepage while it is open, and vanishes when closed', async () => {
  const server = await startServer();
  try {
    const open = await (await fetch(`${server.url}/`)).text();
    const strip = /<div class="playtest-strip"[\s\S]*?<\/div><\/div>/.exec(open)?.[0];
    assert.ok(strip, 'the strip renders');
    assert.ok(open.indexOf('playtest-strip') < open.indexOf('<header class="hero"'), 'above the hero');
    assert.ok(strip.includes(study.fee) && !/\bplaces\b/.test(strip), 'no fixed number of places');
    assert.ok(strip.includes('<a class="playtest-strip__link" href="/playtest">Become a playtester'));
    assert.ok(open.includes('<a class="ea-card__link" href="/playtest">Become a playtester</a>'), 'and the Early Access card points at it too');

    const closed = await (await fetch(`${server.url}/?closed=1`)).text();
    assert.ok(!closed.includes('playtest-strip'));
    assert.ok(!closed.includes('href="/playtest"'), 'no route to a closed form');
    assert.ok(closed.includes('<a class="ea-card__link" href="https://discord.gg/'), 'the card falls back to the Discord');
  } finally {
    await server.stop();
  }
});

test('the Meta pixel is on the public pages when configured, and on no error page', async () => {
  const server = await startServer();
  try {
    const off = await (await fetch(`${server.url}/`)).text();
    assert.ok(!off.includes('fbevents.js'), 'nothing without an id');
  } finally {
    await server.stop();
  }
  const withPixel = await startServer({ metaPixelId: '2470525756801203' });
  try {
    for (const route of ['/', '/destinations/ballarat', '/faq']) {
      const html = await (await fetch(`${withPixel.url}${route}`)).text();
      assert.ok(html.includes("fbq('init', '2470525756801203')"), route);
    }
    const verify = await startServer({ metaDomainVerification: 'abc123XYZ' });
    try {
      const home = await (await fetch(`${verify.url}/`)).text();
      assert.ok(home.includes('<meta name="facebook-domain-verification" content="abc123XYZ">'));
    } finally {
      await verify.stop();
    }
    const missing = await (await fetch(`${withPixel.url}/no-such-page`)).text();
    assert.ok(!missing.includes('fbevents.js'), 'error pages carry no pixel');
  } finally {
    await withPixel.stop();
  }
});

test('the hero offers the store and the Discord, in that order', async () => {
  const server = await startServer();
  try {
    const html = await (await fetch(`${server.url}/`)).text();
    const hero = /<header class="hero"[\s\S]*?<\/header>/.exec(html)[0];
    const store = hero.indexOf('Get it on Meta Quest');
    const discord = hero.indexOf('Join the Discord');
    assert.ok(store > 0 && discord > store, 'store first, Discord second');
    assert.ok(hero.includes(`href="${links.discord}"`), 'the Discord button links to the invite');
    assert.ok(!hero.includes('See how it plays'));
  } finally {
    await server.stop();
  }
});

test('the homepage keeps the hero as a header, with the sections inside main', async () => {
  const server = await startServer();
  try {
    const html = await (await fetch(`${server.url}/`)).text();
    const header = html.indexOf('<header class="hero"');
    const main = html.search(/<main\b[^>]*\bid="content"/);
    const footer = html.indexOf('<footer class="footer"');
    assert.ok(header > 0 && header < main && main < footer, 'header, then main, then footer');
    for (const id of ['vr', 'destinations', 'early-access', 'reddit', 'community']) {
      const at = html.indexOf(`id="${id}"`);
      assert.ok(at > main && at < footer, `#${id} is inside main`);
    }
  } finally {
    await server.stop();
  }
});

test('destination cards expose their name and subtitle, not a label that hides them', async () => {
  const server = await startServer();
  try {
    const html = await (await fetch(`${server.url}/`)).text();
    const cards = html.match(/<a class="dest-card dest-card--link"[^>]*>/g) ?? [];
    assert.equal(cards.length, worlds.length);
    for (const card of cards) assert.ok(!card.includes('aria-label'), card);
    // The photo beside the name is decorative, so it must not be read twice.
    assert.equal((html.match(/class="dest-card__photo" src="[^"]*" alt=""/g) || []).length, worlds.length);
  } finally {
    await server.stop();
  }
});

test('the share grid emoji are hidden from screen readers', async () => {
  const server = await startServer();
  try {
    const html = await (await fetch(`${server.url}/`)).text();
    assert.ok(html.includes('<span class="share__grid" aria-hidden="true">'));
  } finally {
    await server.stop();
  }
});

test('footer legal links are underlined, and buttons have a visible focus ring', () => {
  const legal = /\.footer__legal\s*\{[^}]*\}/.exec(css)[0];
  assert.ok(legal.includes('text-decoration: underline'));
  assert.ok(/\.btn:focus-visible/.test(css));
  assert.ok(/\.footer__link:focus-visible/.test(css));
  assert.ok(/\.ea-card__link:focus-visible/.test(css));
  assert.ok(/@media \(prefers-reduced-motion: reduce\)/.test(css));
  assert.ok(/\.skip:focus\s*\{/.test(css));
});
