import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';

import { createGuidesRouter, pages } from './guides.mjs';
import { createDestinationsRouter, destinations } from './destinations.mjs';
import { links, product, siteUrl, trailer } from './data/content.mjs';
import { notFoundHandler } from './errors.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  app.set('view engine', 'pug');
  app.set('views', path.join(root, 'views'));
  app.locals.siteUrl = siteUrl;
  app.locals.product = product;
  app.locals.links = links;
  app.locals.trailer = trailer;
  app.use(createGuidesRouter({ siteUrl, product }));
  app.use(createDestinationsRouter({ siteUrl, product }));
  app.use(notFoundHandler);
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    stop: () => new Promise((resolve) => server.close(resolve))
  };
}

function meta(html, attr, key) {
  const match = new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`).exec(html);
  return match ? match[1] : null;
}

function jsonLd(html) {
  const match = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
  return match ? JSON.parse(match[1]) : null;
}

function bodyWordCount(html) {
  const main = /<main[\s\S]*?<\/main>/.exec(html)?.[0] ?? '';
  return main.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')
    .split(/\s+/).filter((word) => /[A-Za-z]/.test(word)).length;
}

/** Every internal href on a page, so links can be checked against real routes. */
function internalLinks(html) {
  return [...html.matchAll(/href="(\/[^"#?]*)/g)].map((match) => match[1]);
}

const EXPECTED = ['vr-metal-detecting-game', 'gold-panning-vr', 'seated-vr', 'hoxne-hoard', 'how-to-play', 'faq', 'about', 'updates'];

// ---- Data integrity ----------------------------------------------------

test('the eight guide pages exist, with slugs that cannot collide with other routes', () => {
  assert.deepEqual(pages.map((page) => page.slug).sort(), [...EXPECTED].sort());
  const reserved = new Set(['press', 'privacy', 'terms', 'discord', 'playtest', 'admin', 'go', 'api', 'destinations', 'images', 'css', 'video']);
  for (const page of pages) {
    assert.ok(!reserved.has(page.slug), `${page.slug} collides with an existing route`);
    assert.match(page.slug, /^[a-z0-9-]+$/);
  }
});

test('titles and descriptions are unique and sized for a search result', () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const page of pages) {
    assert.ok(page.title.length <= 65, `${page.slug}: title ${page.title.length} chars`);
    assert.ok(page.description.length >= 120 && page.description.length <= 160,
      `${page.slug}: description ${page.description.length} chars`);
    titles.add(page.title);
    descriptions.add(page.description);
  }
  assert.equal(titles.size, pages.length);
  assert.equal(descriptions.size, pages.length);
});

test('every image referenced exists on disk with alt text', () => {
  for (const page of pages) {
    if (!page.hero) continue;
    assert.ok(fs.existsSync(path.join(root, 'public', page.hero.src)), `${page.slug}: ${page.hero.src}`);
    assert.ok(page.hero.alt.length > 10, `${page.slug}: alt text`);
  }
});

test('nothing on the guide pages presents Kimberley as current or upcoming', () => {
  for (const page of pages) {
    assert.ok(!JSON.stringify(page).toLowerCase().includes('kimberley'), page.slug);
  }
});

test('the updates page is dated, newest first, and its entries carry real dates', () => {
  const updates = pages.find((page) => page.slug === 'updates').updates;
  assert.ok(updates.length >= 1);
  for (const entry of updates) assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/);
  const dates = updates.map((entry) => entry.date);
  assert.deepEqual(dates, [...dates].sort().reverse(), 'newest first');
  assert.ok(dates.includes(product.releaseDate), 'the release is recorded');
});

// ---- Rendering ---------------------------------------------------------

test('each guide page renders with its own head, breadcrumb, and enough copy to index', async () => {
  const server = await startServer();
  try {
    for (const page of pages) {
      const response = await fetch(`${server.url}/${page.slug}`);
      const html = await response.text();
      assert.equal(response.status, 200, page.slug);
      assert.ok(html.includes(`<title>${page.title}</title>`), `${page.slug}: title`);
      assert.equal(meta(html, 'name', 'description'), page.description);
      assert.ok(html.includes(`<link rel="canonical" href="${siteUrl}/${page.slug}">`));
      assert.ok(!html.includes('noindex'), `${page.slug} must be indexable`);
      assert.ok(html.includes(`<h1 class="h1 guide__h1">${page.h1.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h1>`), `${page.slug}: h1`);

      const words = bodyWordCount(html);
      assert.ok(words >= 350, `${page.slug}: ${words} words is thin`);

      const data = jsonLd(html);
      const crumbs = data['@graph'].find((node) => node['@type'] === 'BreadcrumbList');
      assert.equal(crumbs.itemListElement[1].item, `${siteUrl}/${page.slug}`);
      const node = data['@graph'].find((entry) => entry['@type'] === page.kind);
      assert.ok(node, `${page.slug}: ${page.kind} node`);
      assert.ok(html.includes(`placement=guide-${page.slug}`), 'store CTA carries its placement');
    }
  } finally {
    await server.stop();
  }
});

test('every internal link on every guide page resolves', async () => {
  const server = await startServer();
  try {
    const known = new Set(['/', '/press', '/privacy', '/terms', '/discord', '/playtest', '/admin',
      ...pages.map((page) => `/${page.slug}`),
      ...destinations.map((destination) => `/destinations/${destination.slug}`)]);
    for (const page of pages) {
      const html = await (await fetch(`${server.url}/${page.slug}`)).text();
      for (const href of internalLinks(html)) {
        if (href.startsWith('/go/') || /\.[a-z0-9]+$/i.test(href)) continue; // campaign links and static assets
        assert.ok(known.has(href), `${page.slug} links to ${href}, which is not a page`);
      }
    }
  } finally {
    await server.stop();
  }
});

test('the FAQ carries every question and answer as FAQPage structured data', async () => {
  const server = await startServer();
  try {
    const page = pages.find((entry) => entry.slug === 'faq');
    const html = await (await fetch(`${server.url}/faq`)).text();
    const node = jsonLd(html)['@graph'].find((entry) => entry['@type'] === 'FAQPage');
    assert.equal(node.mainEntity.length, page.faq.length);
    for (const item of page.faq) {
      assert.ok(html.includes(`<h2 class="guide__q">${item.q.replace(/'/g, '&#39;').replace(/"/g, '&quot;')}</h2>`), item.q);
      const found = node.mainEntity.find((question) => question.name === item.q);
      assert.equal(found.acceptedAnswer.text, item.a);
    }
    assert.ok(page.faq.length >= 12, 'a FAQ this short is not worth a page');
  } finally {
    await server.stop();
  }
});

test('the about page names the organisation in structured data', async () => {
  const server = await startServer();
  try {
    const html = await (await fetch(`${server.url}/about`)).text();
    const node = jsonLd(html)['@graph'].find((entry) => entry['@type'] === 'AboutPage');
    assert.equal(node.mainEntity['@type'], 'Organization');
    assert.equal(node.mainEntity.name, product.publisher);
    assert.equal(node.mainEntity.legalName, product.developer);
    assert.equal(meta(html, 'property', 'og:image'), `${siteUrl}/images/hero.webp`);
  } finally {
    await server.stop();
  }
});

test('the Hoxne Hoard page states the verified numbers and links to the game’s Hoxne', async () => {
  const server = await startServer();
  try {
    const html = await (await fetch(`${server.url}/hoxne-hoard`)).text();
    for (const fact of ['16 November 1992', 'Eric Lawes', 'Peter Whatling', '14,865', '569', '14,212', '£1.75 million', 'Room 49', 'April 1994', '408']) {
      assert.ok(html.includes(fact), `missing: ${fact}`);
    }
    assert.ok(html.includes('href="/destinations/hoxne"'));
    // And the game's Hoxne page links back.
    const game = await (await fetch(`${server.url}/destinations/hoxne`)).text();
    assert.ok(game.includes('href="/hoxne-hoard"'));
  } finally {
    await server.stop();
  }
});

test('the destination pages now link to the guide', async () => {
  const server = await startServer();
  try {
    const html = await (await fetch(`${server.url}/destinations/coloma`)).text();
    assert.ok(html.includes('href="/how-to-play"'));
  } finally {
    await server.stop();
  }
});

// ---- Sitemap and footer ------------------------------------------------

test('the sitemap lists every guide page', () => {
  const sitemap = fs.readFileSync(path.join(root, 'public', 'sitemap.xml'), 'utf8');
  for (const page of pages) {
    assert.ok(sitemap.includes(`<loc>${siteUrl}/${page.slug}</loc>`), page.slug);
  }
});

test('the footer reaches the guide pages from every page', () => {
  const footer = fs.readFileSync(path.join(root, 'views', 'partials', 'footer.pug'), 'utf8');
  for (const slug of ['how-to-play', 'seated-vr', 'faq', 'about', 'updates']) {
    assert.ok(footer.includes(`href="/${slug}"`), slug);
  }
});
