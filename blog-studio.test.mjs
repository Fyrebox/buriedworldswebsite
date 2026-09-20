import test from 'node:test';
import assert from 'node:assert/strict';

import { newDb } from 'pg-mem';

import { createBlogStore } from './blog-store.mjs';
import { createStudio, createOpenAiClient, parseDraft } from './blog-studio.mjs';

function memoryPool() {
  return new (newDb({ autoCreateForeignKeyIndices: true }).adapters.createPg()).Pool();
}

const GOOD_BODY = `## The rush\n\n${'Ballarat drew the world to a creek in Victoria and never quite let go of the story. '.repeat(12)}\n\n## In the game\n\n${'You restore the puddling machine and the trench turns again. '.repeat(12)}\n\nSee [Ballarat](/destinations/ballarat).`;

function goodDraftJson(overrides = {}) {
  return JSON.stringify({
    title: 'The real Ballarat gold rush', description: 'x'.repeat(140), slug: 'the-real-ballarat-gold-rush',
    bodyMarkdown: GOOD_BODY, imagePrompt: 'A painted expedition-brochure view of the Ballarat diggings at dawn.',
    imageAlt: 'The Ballarat diggings at dawn, trenches cut into red earth under gums.', ...overrides
  });
}

test('parseDraft tolerates code fences and prose around the JSON', () => {
  assert.equal(parseDraft('```json\n{"title":"T","bodyMarkdown":"B"}\n```').title, 'T');
  assert.equal(parseDraft('Here you go:\n{"title":"T","bodyMarkdown":"B"} — enjoy').bodyMarkdown, 'B');
  assert.throws(() => parseDraft('no json here'));
  assert.throws(() => parseDraft('{"title":"only title"}'), /title or body/);
});

test('generating a draft fills the post from the model and clears the running flag', async () => {
  const store = await createBlogStore({ pool: memoryPool() });
  try {
    const post = await store.createPost({ title: 'Untitled draft 2026-09-20', slug: '', bodyMarkdown: '', brief: 'the ballarat rush' });
    let seenPrompt = '';
    const openai = { generateText: async ({ system, prompt }) => { seenPrompt = system + prompt; return goodDraftJson(); } };
    const studio = createStudio({ store, openai, media: null, textModel: 'gpt-5.6-luna', imageModel: 'img' });

    await studio.generateDraft(post.id, 'the ballarat rush');
    const after = await store.getById(post.id);
    assert.equal(after.title, 'The real Ballarat gold rush');
    assert.equal(after.slug, 'the-real-ballarat-gold-rush', 'an untitled draft takes the generated slug');
    assert.ok(after.bodyHtml.includes('<h2>'));
    assert.ok(after.wordCount > 200);
    assert.equal(after.heroPrompt.length > 0, true);
    assert.equal(after.generation, 'idle');
    assert.equal(after.generationError, '');
    // The model was told the house rules and the facts.
    assert.ok(seenPrompt.includes('Kimberley') && seenPrompt.includes('Australian'));
    assert.ok(seenPrompt.includes('/destinations/ballarat'));
  } finally {
    await store.close();
  }
});

test('a generated draft is never published — the human still has to', async () => {
  const store = await createBlogStore({ pool: memoryPool() });
  try {
    const post = await store.createPost({ title: 'Untitled draft', slug: '', bodyMarkdown: '', brief: 'x' });
    const openai = { generateText: async () => goodDraftJson() };
    await createStudio({ store, openai, textModel: 't', imageModel: 'i' }).generateDraft(post.id, 'x');
    assert.equal((await store.getById(post.id)).status, 'draft');
  } finally {
    await store.close();
  }
});

test('regenerating keeps a real slug so a live URL does not move', async () => {
  const store = await createBlogStore({ pool: memoryPool() });
  try {
    const post = await store.createPost({ title: 'Set title', slug: 'chosen-slug', bodyMarkdown: '## x\n\nbody', brief: '' });
    const openai = { generateText: async () => goodDraftJson({ slug: 'a-different-slug' }) };
    await createStudio({ store, openai, textModel: 't', imageModel: 'i' }).generateDraft(post.id, 'x');
    assert.equal((await store.getById(post.id)).slug, 'chosen-slug');
  } finally {
    await store.close();
  }
});

test('a model failure is recorded on the post, not thrown at the caller', async () => {
  const store = await createBlogStore({ pool: memoryPool() });
  try {
    const post = await store.createPost({ title: 'Untitled draft', slug: '', bodyMarkdown: '', brief: 'x' });
    const openai = { generateText: async () => { throw new Error('model timed out'); } };
    await createStudio({ store, openai, textModel: 't', imageModel: 'i', onError: () => {} }).generateDraft(post.id, 'x');
    const after = await store.getById(post.id);
    assert.equal(after.generation, 'idle');
    assert.equal(after.generationError, 'model timed out');
  } finally {
    await store.close();
  }
});

test('generating an image stores it through media and puts the key on the post', async () => {
  const store = await createBlogStore({ pool: memoryPool() });
  try {
    const post = await store.createPost({ title: 'A post', slug: 'a-post', bodyMarkdown: '## x\n\nbody', heroPrompt: 'a painted trench', brief: '' });
    let gotBuffer = null;
    const openai = { generateImage: async ({ prompt, size }) => { assert.ok(prompt && size); return Buffer.from('fake-png'); } };
    const media = { putHero: async (buf) => { gotBuffer = buf; return { key: 'blog/abc123.webp', width: 1600, height: 900 }; } };
    await createStudio({ store, openai, media, textModel: 't', imageModel: 'i' }).generateImage(post.id, 'a painted trench');
    const after = await store.getById(post.id);
    assert.equal(after.heroKey, 'blog/abc123.webp');
    assert.equal(after.heroWidth, 1600);
    assert.equal(gotBuffer.toString(), 'fake-png');
  } finally {
    await store.close();
  }
});

test('an image request with no prompt, or no media configured, is refused softly', async () => {
  const store = await createBlogStore({ pool: memoryPool() });
  try {
    const post = await store.createPost({ title: 'A post', slug: 'a-post', bodyMarkdown: '## x\n\nbody', heroPrompt: '', brief: '' });
    const openai = { generateImage: async () => Buffer.from('x') };
    await createStudio({ store, openai, media: { putHero: async () => ({ key: 'k', width: 1, height: 1 }) }, textModel: 't', imageModel: 'i' }).generateImage(post.id, '');
    assert.match((await store.getById(post.id)).generationError, /no image prompt/);

    await createStudio({ store, openai, media: null, textModel: 't', imageModel: 'i' }).generateImage(post.id, 'a prompt');
    assert.match((await store.getById(post.id)).generationError, /not configured/);
  } finally {
    await store.close();
  }
});

// ---- The OpenAI client over a stub fetch -------------------------------

test('the OpenAI client reads the Responses and Images shapes, and reports errors', async () => {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url, body: JSON.parse(opts.body) });
    if (url.endsWith('/responses')) return { ok: true, json: async () => ({ output_text: 'hello' }) };
    if (url.endsWith('/images/generations')) return { ok: true, json: async () => ({ data: [{ b64_json: Buffer.from('png').toString('base64') }] }) };
    return { ok: false, status: 500, json: async () => ({ error: { message: 'nope' } }) };
  };
  const client = createOpenAiClient({ apiKey: 'sk-test', fetchImpl });
  assert.equal(await client.generateText({ model: 'gpt-5.6-luna', system: 's', prompt: 'p' }), 'hello');
  assert.equal(calls[0].body.model, 'gpt-5.6-luna');
  const img = await client.generateImage({ model: 'gpt-image-2.5', prompt: 'p', size: '1536x1024' });
  assert.equal(img.toString(), 'png');

  // output_text absent → walk the output array.
  const walk = createOpenAiClient({ apiKey: 'k', fetchImpl: async () => ({ ok: true, json: async () => ({ output: [{ content: [{ text: 'walked' }] }] }) }) });
  assert.equal(await walk.generateText({ model: 'm', system: 's', prompt: 'p' }), 'walked');

  const failing = createOpenAiClient({ apiKey: 'k', fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({ error: { message: 'rate limited' } }) }) });
  await assert.rejects(() => failing.generateText({ model: 'm', system: 's', prompt: 'p' }), /429.*rate limited/);

  assert.equal(createOpenAiClient({ apiKey: '' }), null, 'no key, no client');
});
