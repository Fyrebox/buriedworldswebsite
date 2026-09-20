import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import { newDb } from 'pg-mem';

import {
  checklist, checklistPasses, countWords, createBlogStore, normalisePost, PostValidationError,
  previewToken, previewTokenValid, readingMinutes, renderMarkdown, slugify
} from './blog-store.mjs';
import { createBlogRouter, heroUrl, postJsonLd, renderFeed, renderSitemap, sitemapEntries } from './blog.mjs';
import { links, product, siteUrl, trailer } from './data/content.mjs';
import { notFoundHandler } from './errors.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const SECRET = 'a-preview-secret-that-is-longer-than-32-characters';

const LONG_BODY = `## Where the gold was

${'The river at Ballarat gives up its gold slowly, a flake at a time, to anyone patient enough to swirl the pan level and let the gravel go. '.repeat(14)}

## What the machine does

${'A puddling machine breaks clay that will not wash, dragging harrows through a flooded trench until the gold drops out of it. '.repeat(14)}

Read more about [Ballarat](/destinations/ballarat) and the [detector](/vr-metal-detecting-game).`;

function postInput(overrides = {}) {
  return {
    title: 'How the puddling machine at Ballarat works',
    slug: '',
    description: 'A colonial puddling machine sits idle in the Ballarat diggings. Here is what it did in 1855, what it does in the game, and why restoring it matters.',
    bodyMarkdown: LONG_BODY,
    heroKey: 'blog/puddling-hero.webp',
    heroAlt: 'The restored puddling machine at Ballarat, its harrow mid-turn in the flooded trench.',
    heroWidth: 1600,
    heroHeight: 900,
    ...overrides
  };
}

function memoryPool() {
  return new (newDb({ autoCreateForeignKeyIndices: true }).adapters.createPg()).Pool();
}

async function startServer() {
  const store = await createBlogStore({ pool: memoryPool() });
  const app = express();
  app.set('view engine', 'pug'); app.set('views', path.join(root, 'views'));
  Object.assign(app.locals, { siteUrl, product, links, trailer });
  app.use(createBlogRouter({ store, siteUrl, product, author: 'Bellare Studios', previewSecret: SECRET }));
  app.use(notFoundHandler);
  const server = await new Promise((resolve) => { const l = app.listen(0, '127.0.0.1', () => resolve(l)); });
  return { store, url: `http://127.0.0.1:${server.address().port}`, stop: async () => { await new Promise((r) => server.close(r)); await store.close(); } };
}

// ---- Rendering and validation -----------------------------------------

test('Markdown renders, and dangerous markup is stripped', () => {
  const html = renderMarkdown('## Heading\n\nA [link](https://example.com) and **bold**.\n\n<script>alert(1)</script>');
  assert.ok(html.includes('<h2>Heading</h2>'));
  assert.ok(html.includes('<strong>bold</strong>'));
  assert.ok(!html.includes('<script'), 'script tags are removed');
  // An external link is given rel/target; a site link is left bare.
  assert.match(renderMarkdown('[x](https://evil.example)'), /rel="noopener noreferrer" target="_blank"/);
  assert.doesNotMatch(renderMarkdown('[x](/blog)'), /target=/);
  // A body h1 is demoted so it cannot compete with the post title.
  assert.ok(renderMarkdown('# Big').includes('<h2>Big</h2>'));
  // javascript: URLs do not survive.
  assert.doesNotMatch(renderMarkdown('[x](javascript:alert(1))'), /javascript:/);
});

test('word count and reading time come from the rendered text', () => {
  assert.equal(countWords('<p>one two three</p>'), 3);
  assert.equal(countWords('<p>Nothing but <strong>markup</strong> words here now</p>'), 6);
  assert.equal(readingMinutes(0), 1);
  assert.equal(readingMinutes(660), 3);
});

test('slugs are made safe and from the title when blank', () => {
  assert.equal(slugify("How Ballarat's puddling machine works"), 'how-ballarats-puddling-machine-works');
  assert.equal(slugify('  Café — déjà vu!  '), 'cafe-deja-vu');
  assert.equal(normalisePost(postInput()).slug, 'how-the-puddling-machine-at-ballarat-works');
  assert.equal(normalisePost(postInput({ slug: 'Custom Slug' })).slug, 'custom-slug');
});

test('a post is normalised, and a title is required', () => {
  const post = normalisePost(postInput());
  assert.ok(post.bodyHtml.includes('<h2>'));
  assert.ok(post.wordCount > 600);
  assert.throws(() => normalisePost(postInput({ title: '' })), (e) => e instanceof PostValidationError && e.field === 'title');
});

// ---- The checklist and the publish gate --------------------------------

test('the checklist passes a complete post and names each thing a thin one lacks', () => {
  assert.ok(checklistPasses(normalisePost(postInput())));

  const thin = normalisePost(postInput({ bodyMarkdown: '## One heading\n\nToo short.', description: 'x', heroKey: '', heroAlt: '' }));
  const failing = Object.fromEntries(checklist(thin).map((i) => [i.id, i.ok]));
  assert.equal(failing.words, false);
  assert.equal(failing.headings, false);
  assert.equal(failing.description, false);
  assert.equal(failing.hero, false);
  assert.equal(failing.alt, false);
  assert.equal(failing.links, false);
  assert.equal(checklistPasses(thin), false);

  // A title over 65 characters fails on its own.
  const longTitle = normalisePost(postInput({ title: 'x'.repeat(66) }));
  assert.equal(checklist(longTitle).find((i) => i.id === 'title').ok, false);
});

test('publishing is refused until the checklist passes, and keeps the first date', async () => {
  const store = await createBlogStore({ pool: memoryPool() });
  try {
    const draft = await store.createPost(postInput({ bodyMarkdown: '## Short\n\nnope' }));
    await assert.rejects(() => store.publish(draft.id), (e) => e instanceof PostValidationError && e.field === 'checklist');
    assert.equal((await store.getById(draft.id)).status, 'draft');

    const ready = await store.updatePost(draft.id, postInput());
    const published = await store.publish(ready.id);
    assert.equal(published.status, 'published');
    assert.ok(published.publishedAt);

    const unpublished = await store.unpublish(ready.id);
    assert.equal(unpublished.status, 'draft');
    const republished = await store.publish(ready.id);
    assert.equal(republished.publishedAt, published.publishedAt, 'the first publish date is kept');
  } finally {
    await store.close();
  }
});

test('slugs are unique', async () => {
  const store = await createBlogStore({ pool: memoryPool() });
  try {
    await store.createPost(postInput());
    await assert.rejects(() => store.createPost(postInput()), (e) => e instanceof PostValidationError && e.field === 'slug');
  } finally {
    await store.close();
  }
});

// ---- Public pages ------------------------------------------------------

test('a draft is invisible publicly and readable only with a valid preview token', async () => {
  const server = await startServer();
  try {
    const draft = await server.store.createPost(postInput());
    const missing = await fetch(`${server.url}/blog/${draft.slug}`);
    await missing.text();
    assert.equal(missing.status, 404, 'a draft 404s without a token');

    const token = previewToken(SECRET, draft.id);
    const preview = await fetch(`${server.url}/blog/${draft.slug}?preview=${token}`);
    const html = await preview.text();
    assert.equal(preview.status, 200);
    assert.ok(html.includes('Preview of a draft') && html.includes('noindex'));

    const forged = await fetch(`${server.url}/blog/${draft.slug}?preview=${previewToken('wrong-secret-wrong-secret-wrong!!', draft.id)}`);
    await forged.text();
    assert.equal(forged.status, 404, 'a token signed with the wrong secret does not open it');
    assert.equal(server.store ? previewTokenValid(SECRET, draft.id, token) : true, true);
  } finally {
    await server.stop();
  }
});

test('a published post carries its head, hero, body and BlogPosting data; the index lists it', async () => {
  const server = await startServer();
  try {
    const draft = await server.store.createPost(postInput());
    await server.store.publish(draft.id);

    const post = await (await fetch(`${server.url}/blog/${draft.slug}`)).text();
    assert.ok(post.includes(`<title>${postInput().title}</title>`));
    assert.ok(post.includes(`<link rel="canonical" href="${siteUrl}/blog/${draft.slug}">`));
    assert.ok(post.includes('property="og:type" content="article"'));
    assert.ok(post.includes(`<meta property="og:image" content="${siteUrl}/media/blog/puddling-hero.webp">`));
    assert.ok(post.includes('property="og:image:width" content="1600"'));
    const ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(post)[1]);
    const blogPosting = ld['@graph'].find((n) => n['@type'] === 'BlogPosting');
    assert.ok(blogPosting.wordCount > 600 && blogPosting.headline === postInput().title);
    assert.equal(blogPosting.author.name, 'Bellare Studios');
    assert.ok(post.includes('/destinations/ballarat'), 'a related destination is linked');

    const index = await (await fetch(`${server.url}/blog`)).text();
    assert.ok(index.includes(postInput().title) && index.includes(`/blog/${draft.slug}`));
    assert.ok(index.includes('min read'));
  } finally {
    await server.stop();
  }
});

test('the sitemap and feed list published posts only', async () => {
  const server = await startServer();
  try {
    const published = await server.store.createPost(postInput());
    await server.store.publish(published.id);
    const draft = await server.store.createPost(postInput({ title: 'A draft', description: 'x'.repeat(130), bodyMarkdown: LONG_BODY }));

    const sitemap = await (await fetch(`${server.url}/sitemap.xml`)).text();
    assert.ok(sitemap.includes(`${siteUrl}/blog/${published.slug}`));
    assert.ok(!sitemap.includes(`/blog/${draft.slug}`), 'the draft is not in the sitemap');
    assert.ok(sitemap.includes(`${siteUrl}/destinations/ballarat`), 'and the fixed pages are still there');

    const feed = await (await fetch(`${server.url}/blog/feed.xml`)).text();
    assert.equal((await fetch(`${server.url}/blog/feed.xml`)).headers.get('content-type'), 'application/rss+xml; charset=utf-8');
    assert.ok(feed.includes(`<link>${siteUrl}/blog/${published.slug}</link>`));
    assert.ok(!feed.includes('A draft'));
  } finally {
    await server.stop();
  }
});

test('heroUrl treats a key as /media and a path as itself', () => {
  assert.equal(heroUrl('blog/x.webp'), '/media/blog/x.webp');
  assert.equal(heroUrl('/images/hero.jpg'), '/images/hero.jpg');
  assert.equal(heroUrl(''), '');
});
