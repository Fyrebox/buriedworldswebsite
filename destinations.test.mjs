import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';

import { createDestinationsRouter, destinations } from './destinations.mjs';
import { links, product, siteUrl, trailer, worlds } from './data/content.mjs';
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
  app.use(createDestinationsRouter({ siteUrl, product }));
  app.get('/', (req, res) => res.render('index', {
    heroVariant: 'poster', showLockedCard: true, loopSteps: [], worlds, signalRows: [], pagePath: '/'
  }));
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

/** Words in the page's own copy — the <main> only, tags stripped. */
function bodyWordCount(html) {
  const main = /<main[\s\S]*?<\/main>/.exec(html)?.[0] ?? '';
  return main.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')
    .split(/\s+/).filter((word) => /[A-Za-z]/.test(word)).length;
}

// ---- Data integrity ----------------------------------------------------

test('every homepage card has a page, and every page has a card', () => {
  const cardSlugs = worlds.map((world) => world.slug).sort();
  const pageSlugs = destinations.map((destination) => destination.slug).sort();
  assert.deepEqual(cardSlugs, pageSlugs);
  assert.equal(new Set(pageSlugs).size, pageSlugs.length, 'slugs are unique');
});

test('kimberley has no page — it was removed from the project', () => {
  assert.ok(!destinations.some((destination) => destination.slug === 'kimberley'));
  for (const destination of destinations) {
    const text = JSON.stringify(destination).toLowerCase();
    assert.ok(!text.includes('kimberley'), `${destination.slug} must not mention Kimberley`);
  }
});

test('every destination image referenced actually exists on disk', () => {
  for (const destination of destinations) {
    for (const image of [destination.hero, destination.video?.poster].filter(Boolean)) {
      const file = path.join(root, 'public', image.src);
      assert.ok(fs.existsSync(file), `${destination.slug}: ${image.src} is missing`);
      assert.ok(image.alt.length > 10, `${destination.slug}: ${image.src} needs alt text`);
    }
  }
});

test('titles and descriptions are unique and sized for a search result', () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const destination of destinations) {
    assert.ok(destination.title.length <= 65, `${destination.slug}: title ${destination.title.length} chars`);
    assert.ok(destination.description.length >= 120 && destination.description.length <= 160,
      `${destination.slug}: description ${destination.description.length} chars`);
    assert.ok(destination.title.includes(destination.name));
    assert.ok(destination.description.includes(destination.name));
    titles.add(destination.title);
    descriptions.add(destination.description);
  }
  assert.equal(titles.size, destinations.length);
  assert.equal(descriptions.size, destinations.length);
});

// ---- Rendering ---------------------------------------------------------

test('each destination page renders with its own head, breadcrumb and enough copy to index', async () => {
  const server = await startServer();
  try {
    for (const destination of destinations) {
      const response = await fetch(`${server.url}/destinations/${destination.slug}`);
      const html = await response.text();
      assert.equal(response.status, 200, destination.slug);

      assert.ok(html.includes(`<title>${destination.title}</title>`), `${destination.slug}: title`);
      assert.equal(meta(html, 'name', 'description'), destination.description);
      assert.ok(html.includes(`<link rel="canonical" href="${siteUrl}/destinations/${destination.slug}">`));
      assert.ok(!html.includes('noindex'), `${destination.slug} must be indexable`);
      assert.ok(html.includes(`<h1 class="h1">${destination.name}</h1>`), `${destination.slug}: h1`);

      const words = bodyWordCount(html);
      assert.ok(words >= 350, `${destination.slug}: ${words} words is thin`);

      const data = jsonLd(html);
      const crumbs = data['@graph'].find((node) => node['@type'] === 'BreadcrumbList');
      assert.equal(crumbs.itemListElement[2].name, destination.name);
      assert.equal(crumbs.itemListElement[2].item, `${siteUrl}/destinations/${destination.slug}`);

      assert.ok(html.includes('placement=destination-' + destination.slug), 'store CTA carries its placement');
    }
  } finally {
    await server.stop();
  }
});

test('share images are the page’s own screenshot where one is big enough', async () => {
  const server = await startServer();
  try {
    const ballarat = await (await fetch(`${server.url}/destinations/ballarat`)).text();
    assert.equal(meta(ballarat, 'property', 'og:image'), `${siteUrl}/press/screenshots/01-ballarat-detector.jpg`);
    assert.equal(meta(ballarat, 'property', 'og:image:width'), '1920');
    assert.equal(meta(ballarat, 'property', 'og:image:height'), '1080');
    assert.ok(meta(ballarat, 'property', 'og:image:alt').includes('Ballarat'));

    // Hoxne has only the 384 px card image, so it keeps the site cover.
    const hoxne = await (await fetch(`${server.url}/destinations/hoxne`)).text();
    assert.equal(meta(hoxne, 'property', 'og:image'), `${siteUrl}/images/og-cover.jpg`);
    assert.equal(meta(hoxne, 'property', 'og:image:width'), '1200');
  } finally {
    await server.stop();
  }
});

test('previous and next link the destinations in unlock order', async () => {
  const server = await startServer();
  try {
    const first = await (await fetch(`${server.url}/destinations/ballarat`)).text();
    assert.ok(first.includes('href="/destinations/coloma"'));
    assert.ok(!first.includes('Previous'));

    const middle = await (await fetch(`${server.url}/destinations/carcassonne`)).text();
    assert.ok(middle.includes('href="/destinations/coloma"'));
    assert.ok(middle.includes('href="/destinations/hoxne"'));

    const last = await (await fetch(`${server.url}/destinations/bolonia`)).text();
    assert.ok(last.includes('href="/destinations/hoxne"'));
    assert.ok(!last.includes('Next →'));
  } finally {
    await server.stop();
  }
});

test('the Ballarat page carries the teaser as a click-to-load facade with video structured data', async () => {
  const server = await startServer();
  try {
    const html = await (await fetch(`${server.url}/destinations/ballarat`)).text();
    assert.ok(html.includes('data-yt-id="3dv1H7-Trgs"'));
    assert.ok(html.includes('href="https://www.youtube.com/watch?v=3dv1H7-Trgs"'), 'works without JavaScript');
    assert.ok(!html.includes('<iframe'), 'no player until play is pressed');
    assert.ok(!html.includes('i.ytimg.com'), 'poster is our own screenshot, not YouTube’s thumbnail');
    assert.ok(html.includes('youtube-nocookie.com/embed/3dv1H7-Trgs'));

    const video = jsonLd(html)['@graph'].find((node) => node['@type'] === 'VideoObject');
    assert.ok(video, 'VideoObject present');
    assert.equal(video.uploadDate, '2026-09-06T16:55:22-07:00');
    assert.equal(video.duration, 'PT1M41S');
    assert.equal(video.thumbnailUrl, `${siteUrl}/press/screenshots/02-ballarat-panning.jpg`);

    const coloma = await (await fetch(`${server.url}/destinations/coloma`)).text();
    assert.ok(!coloma.includes('yt-facade'), 'only Ballarat has the video');
    assert.ok(!jsonLd(coloma)['@graph'].some((node) => node['@type'] === 'VideoObject'));
  } finally {
    await server.stop();
  }
});

test('unknown destinations 404, and /destinations goes home', async () => {
  const server = await startServer();
  try {
    const missing = await fetch(`${server.url}/destinations/kimberley`);
    await missing.text();
    assert.equal(missing.status, 404);

    const index = await fetch(`${server.url}/destinations`, { redirect: 'manual' });
    assert.equal(index.status, 301);
    assert.equal(index.headers.get('location'), '/#destinations');

    const upper = await fetch(`${server.url}/destinations/BALLARAT`);
    await upper.text();
    assert.equal(upper.status, 200, 'slug lookup is case-insensitive');
  } finally {
    await server.stop();
  }
});

test('the homepage cards link to their pages', async () => {
  const server = await startServer();
  try {
    const html = await (await fetch(`${server.url}/`)).text();
    for (const world of worlds) {
      assert.ok(html.includes(`href="/destinations/${world.slug}"`), world.slug);
    }
    assert.ok(html.includes('id="destinations"'), 'the section is an anchor target');
  } finally {
    await server.stop();
  }
});

// ---- Sitemap -----------------------------------------------------------

test('the sitemap lists every destination page', () => {
  const sitemap = fs.readFileSync(path.join(root, 'public', 'sitemap.xml'), 'utf8');
  for (const destination of destinations) {
    assert.ok(sitemap.includes(`<loc>${siteUrl}/destinations/${destination.slug}</loc>`), destination.slug);
  }
  assert.ok(!sitemap.includes('kimberley'));
});
