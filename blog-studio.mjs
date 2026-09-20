// The AI studio: turns a brief into a draft, and a prompt into a hero image.
//
// Both run in the background — a full post is a minute of model time, longer
// than a browser or Cloudflare will hold a request — and record their progress
// on the post ('running' → 'idle', or an error string) so the editor can say
// what is happening. Neither ever publishes; a draft is written for the human
// to revise.
//
// The model is told the site's own facts and voice, and hard rules drawn from
// how the rest of the site is written: Australian English, real places real and
// people invented, no Kimberley, no invented statistics, nothing about the game
// that is not in the facts it was given. OpenAI receives only the brief and
// those facts — never anything about a visitor — so the privacy policy is
// unaffected.
//
// The OpenAI and media clients are injected, so the tests drive the whole flow
// without a network. The request/response shapes follow OpenAI's Responses and
// Images APIs; the model ids are configuration.

import { slugify } from './blog-store.mjs';
import { product } from './data/content.mjs';
import { destinations } from './data/destinations.mjs';

function siteFacts() {
  const places = destinations.map((d) => `- ${d.name} (${d.region}): ${d.tagline} Its page is /destinations/${d.slug}.`).join('\n');
  return [
    `${product.name} is a VR treasure-hunting game for ${product.store} (${product.devices}), ${product.status}, ${product.price}, by ${product.publisher}.`,
    `You sweep a metal detector, dig, pan for gold and travel five real places where real treasure was found:`,
    places,
    `Other pages you may link: /vr-metal-detecting-game, /gold-panning-vr, /how-to-play, /faq, /hoxne-hoard.`
  ].join('\n');
}

const SYSTEM = [
  `You write blog posts for the website of ${product.name}. House style: calm, curious, specific, never breathless; British/Australian spelling; short paragraphs; concrete detail over adjectives.`,
  `Hard rules, no exceptions:`,
  `- The places and their history are real; the characters in the game are invented. Never present an in-game character as a real person.`,
  `- Never mention "Kimberley" — it is not in the game.`,
  `- Invent no statistics, dates, prices or quotations. If you are unsure of a fact, leave it out.`,
  `- Say nothing about the game's features beyond the facts provided below.`,
  `- Link to the site's own pages with Markdown links where it is natural; at least one.`,
  `- Body is Markdown: ## for sections (at least two), no H1. 600–1000 words.`,
  ``,
  `Site facts you may rely on:`,
  siteFacts()
].join('\n');

function draftInstruction(brief) {
  return `Write a blog post from this brief:\n\n${brief}\n\n`
    + `Return a single JSON object, and nothing else, with keys: `
    + `"title" (<= 60 characters), "description" (120-160 characters, for the meta description), `
    + `"slug" (lowercase, hyphenated, from the title), "bodyMarkdown" (the post), `
    + `"imagePrompt" (a vivid prompt for an illustration, in the game's painted expedition-brochure style, no text in the image), `
    + `"imageAlt" (concrete alt text for that image).`;
}

/** Pull the JSON object out of a model reply, tolerant of code fences. */
export function parseDraft(text) {
  const raw = String(text ?? '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('the model did not return JSON');
  const parsed = JSON.parse(raw.slice(start, end + 1));
  if (!parsed.title || !parsed.bodyMarkdown) throw new Error('the model omitted a title or body');
  return parsed;
}

export function createStudio({ store, openai, media, textModel, imageModel, onError = (e) => console.error('[blog-studio]', e) }) {
  if (!store || !openai) throw new Error('createStudio requires store and openai');

  async function generateDraft(postId, brief) {
    const post = await store.getById(postId);
    if (!post) return;
    await store.setGeneration(postId, 'running');
    try {
      const text = await openai.generateText({ model: textModel, system: SYSTEM, prompt: draftInstruction(brief || post.brief || post.title) });
      const draft = parseDraft(text);
      const slug = slugify(draft.slug || draft.title);
      // Keep the post's own slug if it already has a real one, so a regenerate
      // does not move a URL that might already be linked.
      const keepSlug = post.slug && !/^untitled-draft/.test(post.slug);
      await store.updatePost(postId, {
        title: draft.title,
        slug: keepSlug ? post.slug : slug,
        description: draft.description ?? '',
        bodyMarkdown: draft.bodyMarkdown,
        heroKey: post.heroKey,
        heroAlt: draft.imageAlt ?? post.heroAlt,
        heroWidth: post.heroWidth,
        heroHeight: post.heroHeight,
        heroPrompt: draft.imagePrompt ?? post.heroPrompt,
        brief: brief || post.brief
      });
      await store.setGeneration(postId, 'idle');
    } catch (error) {
      onError(error);
      await store.setGeneration(postId, 'idle', error.message);
    }
  }

  async function generateImage(postId, prompt) {
    const post = await store.getById(postId);
    if (!post) return;
    const usePrompt = (prompt || post.heroPrompt || '').trim();
    if (!usePrompt) { await store.setGeneration(postId, 'idle', 'no image prompt to work from'); return; }
    if (!media) { await store.setGeneration(postId, 'idle', 'image storage is not configured'); return; }
    await store.setGeneration(postId, 'running');
    try {
      const png = await openai.generateImage({ model: imageModel, prompt: usePrompt, size: '1536x1024' });
      const stored = await media.putHero(png);
      const fresh = await store.getById(postId);
      await store.updatePost(postId, {
        title: fresh.title, slug: fresh.slug, description: fresh.description, bodyMarkdown: fresh.bodyMarkdown,
        heroKey: stored.key, heroAlt: fresh.heroAlt, heroWidth: stored.width, heroHeight: stored.height,
        heroPrompt: usePrompt, brief: fresh.brief
      });
      await store.setGeneration(postId, 'idle');
    } catch (error) {
      onError(error);
      await store.setGeneration(postId, 'idle', error.message);
    }
  }

  return { generateDraft, generateImage };
}

/**
 * A thin OpenAI client over fetch — text via the Responses API, images via the
 * Images API. Kept small and separate so the studio can be tested with a stub
 * and so the exact endpoints live in one place if OpenAI's shapes shift.
 */
export function createOpenAiClient({ apiKey, baseUrl = 'https://api.openai.com/v1', fetchImpl = fetch }) {
  if (!apiKey) return null;
  const headers = { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' };

  async function generateText({ model, system, prompt }) {
    const res = await fetchImpl(`${baseUrl}/responses`, {
      method: 'POST', headers,
      body: JSON.stringify({ model, input: [{ role: 'system', content: system }, { role: 'user', content: prompt }] })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`OpenAI text ${res.status}: ${json.error?.message ?? ''}`.trim());
    // Responses API: prefer output_text; fall back to walking the output array.
    if (typeof json.output_text === 'string' && json.output_text) return json.output_text;
    const parts = (json.output ?? []).flatMap((o) => o.content ?? []).map((c) => c.text).filter(Boolean);
    if (!parts.length) throw new Error('OpenAI returned no text');
    return parts.join('');
  }

  async function generateImage({ model, prompt, size }) {
    const res = await fetchImpl(`${baseUrl}/images/generations`, {
      method: 'POST', headers,
      body: JSON.stringify({ model, prompt, size, n: 1 })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`OpenAI image ${res.status}: ${json.error?.message ?? ''}`.trim());
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error('OpenAI returned no image');
    return Buffer.from(b64, 'base64');
  }

  return { generateText, generateImage };
}
