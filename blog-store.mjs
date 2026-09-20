// Blog posts: storage, Markdown rendering, and the checklist a post has to
// pass before it can be published.
//
// The Markdown is the source of truth; the HTML beside it is rendered at save
// time, through a sanitiser, so a template never renders anything that was
// not allowed through. Word count is computed from the rendered text, which is
// what a reader and a search engine both see.
//
// Publishing is gated on the checklist rather than advised by it. A post that
// is live is a post a search engine will judge the site by, and "a bit short"
// or "no description" is not a state worth being indexed in.

import crypto from 'node:crypto';

import { marked } from 'marked';
import pg from 'pg';
import sanitizeHtml from 'sanitize-html';

const { Pool } = pg;

export const LIMITS = {
  title: 120,
  description: 200,
  slug: 80,
  body: 200_000,
  heroAlt: 300,
  brief: 4000
};

export const CHECKLIST = {
  titleMax: 65,
  descriptionMin: 120,
  descriptionMax: 160,
  minWords: 600,
  minHeadings: 2
};

export class PostValidationError extends Error {
  constructor(message, field = '') {
    super(message);
    this.name = 'PostValidationError';
    this.field = field;
  }
}

marked.setOptions({ gfm: true, breaks: false });

const ALLOWED = {
  allowedTags: [
    'h2', 'h3', 'h4', 'p', 'a', 'ul', 'ol', 'li', 'blockquote', 'strong', 'em', 'code', 'pre',
    'br', 'hr', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'sup', 'sub', 'del'
  ],
  allowedAttributes: {
    a: ['href', 'title', 'rel', 'target'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
    th: ['align'],
    td: ['align']
  },
  allowedSchemes: ['https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  transformTags: {
    // A level-one heading in the body would compete with the post's title;
    // demote it rather than refuse it.
    h1: 'h2',
    a: (tagName, attribs) => {
      const href = attribs.href ?? '';
      const external = /^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?buriedworlds\.com(\/|$)/i.test(href);
      return {
        tagName,
        attribs: external ? { ...attribs, rel: 'noopener noreferrer', target: '_blank' } : attribs
      };
    },
    img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy' } })
  }
};

/** Markdown in, sanitised HTML out. */
export function renderMarkdown(markdown) {
  return sanitizeHtml(marked.parse(String(markdown ?? '')), ALLOWED).trim();
}

export function plainText(html) {
  return String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

export function countWords(html) {
  const text = plainText(html);
  return text ? text.split(' ').filter((word) => /[A-Za-z0-9]/.test(word)).length : 0;
}

export function readingMinutes(words) {
  return Math.max(1, Math.round(words / 220));
}

/** "How Ballarat's puddling machine works" → "how-ballarats-puddling-machine-works" */
export function slugify(value) {
  return String(value ?? '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, LIMITS.slug)
    .replace(/-+$/g, '');
}

function cleanText(value, field, label, maxLength, { required = false } = {}) {
  const clean = String(value ?? '').replace(/\r\n/g, '\n').trim();
  if (required && !clean) throw new PostValidationError(`${label} is required`, field);
  if (clean.length > maxLength) throw new PostValidationError(`${label} must be at most ${maxLength} characters`, field);
  return clean;
}

/** Validate and shape a post as submitted from the editor. */
export function normalisePost(input = {}) {
  const title = cleanText(input.title, 'title', 'Title', LIMITS.title, { required: true }).replace(/\s+/g, ' ');
  const slug = slugify(input.slug || title);
  if (slug.length < 3) throw new PostValidationError('The slug needs at least three characters', 'slug');
  const bodyMarkdown = cleanText(input.bodyMarkdown, 'bodyMarkdown', 'Body', LIMITS.body);
  const bodyHtml = renderMarkdown(bodyMarkdown);
  return {
    title,
    slug,
    description: cleanText(input.description, 'description', 'Description', LIMITS.description).replace(/\s+/g, ' '),
    bodyMarkdown,
    bodyHtml,
    wordCount: countWords(bodyHtml),
    heroKey: cleanText(input.heroKey, 'heroKey', 'Hero image', 500),
    heroAlt: cleanText(input.heroAlt, 'heroAlt', 'Hero image alt text', LIMITS.heroAlt).replace(/\s+/g, ' '),
    heroWidth: Number.parseInt(input.heroWidth, 10) || 0,
    heroHeight: Number.parseInt(input.heroHeight, 10) || 0,
    heroPrompt: cleanText(input.heroPrompt, 'heroPrompt', 'Image prompt', 2000),
    brief: cleanText(input.brief, 'brief', 'Brief', LIMITS.brief)
  };
}

/**
 * What a post needs before it goes live. Each item is { id, label, ok, detail }.
 * The same list drives the editor's checklist and the publish gate, so the
 * editor can never show green for something publish would refuse.
 */
export function checklist(post) {
  const html = post.bodyHtml ?? '';
  const words = post.wordCount ?? countWords(html);
  const headings = (html.match(/<h2\b/g) ?? []).length;
  const internalLinks = (html.match(/href="(\/|https?:\/\/(www\.)?buriedworlds\.com)/g) ?? []).length;
  const titleLength = (post.title ?? '').length;
  const descriptionLength = (post.description ?? '').length;
  return [
    { id: 'title', label: `Title ${CHECKLIST.titleMax} characters or fewer`, ok: titleLength > 0 && titleLength <= CHECKLIST.titleMax, detail: `${titleLength} characters` },
    { id: 'description', label: `Description ${CHECKLIST.descriptionMin}–${CHECKLIST.descriptionMax} characters`, ok: descriptionLength >= CHECKLIST.descriptionMin && descriptionLength <= CHECKLIST.descriptionMax, detail: `${descriptionLength} characters` },
    { id: 'words', label: `At least ${CHECKLIST.minWords} words`, ok: words >= CHECKLIST.minWords, detail: `${words} words` },
    { id: 'headings', label: `At least ${CHECKLIST.minHeadings} section headings`, ok: headings >= CHECKLIST.minHeadings, detail: `${headings} headings` },
    { id: 'hero', label: 'A hero image', ok: Boolean(post.heroKey), detail: post.heroKey ? 'present' : 'missing' },
    { id: 'alt', label: 'Alt text for the hero image', ok: Boolean(post.heroAlt && post.heroAlt.length > 10), detail: post.heroAlt ? `${post.heroAlt.length} characters` : 'missing' },
    { id: 'links', label: 'At least one link to another page on the site', ok: internalLinks >= 1, detail: `${internalLinks} internal links` }
  ];
}

export function checklistPasses(post) {
  return checklist(post).every((item) => item.ok);
}

function iso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function rowToPost(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    slug: row.slug,
    title: row.title,
    description: row.description,
    bodyMarkdown: row.body_markdown,
    bodyHtml: row.body_html,
    wordCount: Number(row.word_count),
    heroKey: row.hero_key,
    heroAlt: row.hero_alt,
    heroWidth: Number(row.hero_width),
    heroHeight: Number(row.hero_height),
    heroPrompt: row.hero_prompt,
    brief: row.brief,
    status: row.status,
    generation: row.generation,
    generationError: row.generation_error,
    publishedAt: iso(row.published_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

export async function createBlogStore({ databaseUrl, pool: suppliedPool }) {
  if (!suppliedPool && !databaseUrl) throw new Error('DATABASE_URL is required for the blog');
  const pool = suppliedPool ?? new Pool({
    connectionString: databaseUrl,
    max: Number.parseInt(process.env.PG_POOL_MAX ?? '10', 10),
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    options: '-c timezone=UTC'
  });

  const exists = await pool.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_posts'`);
  if (exists.rows.length === 0) await pool.query(`
    CREATE TABLE blog_posts (
      id BIGSERIAL PRIMARY KEY,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      body_markdown TEXT NOT NULL DEFAULT '',
      body_html TEXT NOT NULL DEFAULT '',
      word_count INTEGER NOT NULL DEFAULT 0,
      hero_key TEXT NOT NULL DEFAULT '',
      hero_alt TEXT NOT NULL DEFAULT '',
      hero_width INTEGER NOT NULL DEFAULT 0,
      hero_height INTEGER NOT NULL DEFAULT 0,
      hero_prompt TEXT NOT NULL DEFAULT '',
      brief TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      generation TEXT NOT NULL DEFAULT 'idle',
      generation_error TEXT NOT NULL DEFAULT '',
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX blog_posts_slug ON blog_posts (slug);
    CREATE INDEX blog_posts_published ON blog_posts (status, published_at DESC);
  `);

  const COLUMNS = ['title', 'slug', 'description', 'body_markdown', 'body_html', 'word_count', 'hero_key', 'hero_alt', 'hero_width', 'hero_height', 'hero_prompt', 'brief'];
  const values = (post) => [post.title, post.slug, post.description, post.bodyMarkdown, post.bodyHtml, post.wordCount, post.heroKey, post.heroAlt, post.heroWidth, post.heroHeight, post.heroPrompt, post.brief];

  async function getById(id) {
    const result = await pool.query('SELECT * FROM blog_posts WHERE id = $1', [id]);
    return rowToPost(result.rows[0]);
  }

  async function getBySlug(slug) {
    const result = await pool.query('SELECT * FROM blog_posts WHERE slug = $1', [String(slug ?? '').toLowerCase()]);
    return rowToPost(result.rows[0]);
  }

  async function createPost(input) {
    const post = normalisePost(input);
    try {
      const result = await pool.query(`
        INSERT INTO blog_posts (${COLUMNS.join(', ')})
        VALUES (${COLUMNS.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *
      `, values(post));
      return rowToPost(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') throw new PostValidationError('That slug is already in use', 'slug');
      throw error;
    }
  }

  async function updatePost(id, input) {
    const post = normalisePost(input);
    try {
      const result = await pool.query(`
        UPDATE blog_posts SET ${COLUMNS.map((column, i) => `${column} = $${i + 1}`).join(', ')}, updated_at = NOW()
        WHERE id = $${COLUMNS.length + 1} RETURNING *
      `, [...values(post), id]);
      if (!result.rows[0]) throw new PostValidationError('That post no longer exists');
      return rowToPost(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') throw new PostValidationError('That slug is already in use', 'slug');
      throw error;
    }
  }

  /** Publish, if the checklist passes. The first publish date is kept across re-publishes. */
  async function publish(id) {
    const post = await getById(id);
    if (!post) throw new PostValidationError('That post no longer exists');
    const failing = checklist(post).filter((item) => !item.ok);
    if (failing.length) {
      throw new PostValidationError(`Not published: ${failing.map((item) => item.label.toLowerCase()).join('; ')}`, 'checklist');
    }
    const result = await pool.query(`
      UPDATE blog_posts SET status = 'published', published_at = COALESCE(published_at, NOW()), updated_at = NOW()
      WHERE id = $1 RETURNING *
    `, [id]);
    return rowToPost(result.rows[0]);
  }

  async function unpublish(id) {
    const result = await pool.query(`UPDATE blog_posts SET status = 'draft', updated_at = NOW() WHERE id = $1 RETURNING *`, [id]);
    return rowToPost(result.rows[0]);
  }

  async function deletePost(id) {
    const result = await pool.query('DELETE FROM blog_posts WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  async function setGeneration(id, generation, error = '') {
    await pool.query(`UPDATE blog_posts SET generation = $2, generation_error = $3, updated_at = NOW() WHERE id = $1`, [id, generation, String(error ?? '').slice(0, 500)]);
  }

  async function listPublished({ limit = 12, offset = 0 } = {}) {
    const result = await pool.query(`
      SELECT * FROM blog_posts WHERE status = 'published'
      ORDER BY published_at DESC, id DESC LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return result.rows.map(rowToPost);
  }

  async function countPublished() {
    const result = await pool.query(`SELECT COUNT(*)::int AS n FROM blog_posts WHERE status = 'published'`);
    return Number(result.rows[0].n);
  }

  async function listAll() {
    const result = await pool.query(`SELECT * FROM blog_posts ORDER BY updated_at DESC, id DESC`);
    return result.rows.map(rowToPost);
  }

  return {
    getById, getBySlug, createPost, updatePost, publish, unpublish, deletePost, setGeneration,
    listPublished, countPublished, listAll,
    close() { return pool.end(); }
  };
}

/** A signed, expiring link so a draft can be read before it is published. */
export function previewToken(secret, postId, now = Date.now()) {
  const expiresAt = String(now + 7 * 24 * 60 * 60 * 1000);
  return `${expiresAt}.${crypto.createHmac('sha256', secret).update(`preview:${postId}:${expiresAt}`).digest('base64url')}`;
}

export function previewTokenValid(secret, postId, token, now = Date.now()) {
  const [expiresRaw, received] = String(token ?? '').split('.');
  const expiresAt = Number(expiresRaw);
  if (!secret || !Number.isSafeInteger(expiresAt) || expiresAt <= now || !received) return false;
  const expected = crypto.createHmac('sha256', secret).update(`preview:${postId}:${expiresRaw}`).digest('base64url');
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
