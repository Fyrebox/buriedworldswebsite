// The blog editor, under /admin/blog. Behind the same sign-in as the rest of
// the admin area. Writes go through the store's validation and the publish gate
// so nothing reaches the public routes that those routes could not render.
//
// Draft generation and image generation are handled by an injected `studio`
// (blog-studio.mjs); absent, the AI buttons are hidden and everything else —
// writing, publishing, previewing by hand — works unchanged.

import express from 'express';

import { checklist, countWords, LIMITS, PostValidationError, previewToken, readingMinutes, renderMarkdown } from './blog-store.mjs';
import { csrfToken, readSession, safeEqual } from './admin-session.mjs';

const MAX_BODY_BYTES = 512 * 1024;

function formValues(body = {}) {
  return {
    title: String(body.title ?? '').slice(0, LIMITS.title),
    slug: String(body.slug ?? '').slice(0, LIMITS.slug),
    description: String(body.description ?? '').slice(0, LIMITS.description),
    bodyMarkdown: String(body.bodyMarkdown ?? '').slice(0, LIMITS.body),
    heroKey: String(body.heroKey ?? '').slice(0, 500),
    heroAlt: String(body.heroAlt ?? '').slice(0, LIMITS.heroAlt),
    heroWidth: String(body.heroWidth ?? ''),
    heroHeight: String(body.heroHeight ?? ''),
    heroPrompt: String(body.heroPrompt ?? '').slice(0, 2000),
    brief: String(body.brief ?? '').slice(0, LIMITS.brief)
  };
}

export function createBlogAdminRouter({
  store, siteUrl, adminPassword = '', sessionSecret = '', previewSecret = '',
  studio = null, now = () => Date.now(), onError = (error) => console.error('[blog-admin]', error)
}) {
  if (!store) throw new Error('createBlogAdminRouter requires a store');
  const router = express.Router();
  const enabled = Boolean(adminPassword && sessionSecret.length >= 32);

  router.use('/admin/blog', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Robots-Tag', 'noindex, nofollow');
    if (!enabled) return res.status(404).send('Not found');
    const expiresAt = readSession(req, sessionSecret, now);
    if (!expiresAt) return res.redirect(303, '/admin/login');
    req.adminExpiresAt = expiresAt;
    res.locals.csrf = csrfToken(sessionSecret, expiresAt);
    next();
  });
  router.use('/admin/blog', express.urlencoded({ extended: false, limit: MAX_BODY_BYTES }));

  function requireCsrf(req, res, next) {
    if (!safeEqual(req.body._csrf ?? '', csrfToken(sessionSecret, req.adminExpiresAt))) return res.status(403).send('Invalid form token');
    next();
  }

  router.get('/admin/blog', async (req, res) => {
    const posts = await store.listAll();
    return res.render('admin-blog', {
      pageTitle: 'Blog — Buried Worlds VR', pagePath: '/admin/blog', noIndex: true, disableAnalytics: true,
      posts: posts.map((p) => ({ ...p, minutes: readingMinutes(p.wordCount) })),
      canGenerate: Boolean(studio),
      notice: { created: 'Draft created.', saved: 'Saved.', published: 'Published.', unpublished: 'Moved back to draft.', deleted: 'Deleted.' }[req.query.done] ?? ''
    });
  });

  // A new post starts as a blank draft the editor then fills — by hand or with
  // the generator. Created immediately so the editor always has an id to save,
  // preview and generate against.
  router.post('/admin/blog', requireCsrf, async (req, res) => {
    try {
      const post = await store.createPost({
        title: req.body.title?.trim() || `Untitled draft ${new Date(now()).toISOString().slice(0, 10)}`,
        slug: '', description: '', bodyMarkdown: req.body.brief ? '' : '_Start writing, or generate a draft._',
        brief: req.body.brief ?? ''
      });
      if (studio && req.body.generate) studio.generateDraft(post.id).catch(onError);
      return res.redirect(303, `/admin/blog/${post.id}`);
    } catch (error) {
      if (error instanceof PostValidationError) return res.status(400).send(error.message);
      throw error;
    }
  });

  function renderEditor(res, post, { status = 200, values, error = '', errorField = '' } = {}) {
    const merged = values ?? {
      title: post.title, slug: post.slug, description: post.description, bodyMarkdown: post.bodyMarkdown,
      heroKey: post.heroKey, heroAlt: post.heroAlt, heroWidth: String(post.heroWidth || ''),
      heroHeight: String(post.heroHeight || ''), heroPrompt: post.heroPrompt, brief: post.brief
    };
    return res.status(status).render('admin-blog-edit', {
      pageTitle: `Editing ${post.title} — Buried Worlds VR`, pagePath: `/admin/blog/${post.id}`, noIndex: true, disableAnalytics: true,
      post, values: merged, checklist: checklist(checklistShape(merged)),
      heroUrlValue: post.heroKey ? (post.heroKey.startsWith('/') ? post.heroKey : `/media/${post.heroKey}`) : '',
      previewUrl: `${siteUrl}/blog/${post.slug}?preview=${previewToken(previewSecret, post.id, now())}`,
      canGenerate: Boolean(studio), error, errorField
    });
  }

  router.get('/admin/blog/:id', async (req, res, next) => {
    const post = await store.getById(Number(req.params.id));
    if (!post) return next();
    return renderEditor(res, post);
  });

  router.post('/admin/blog/:id', requireCsrf, async (req, res, next) => {
    const post = await store.getById(Number(req.params.id));
    if (!post) return next();
    const values = formValues(req.body);
    try {
      const saved = await store.updatePost(post.id, values);
      if (req.body.action === 'publish') {
        await store.publish(saved.id);
        return res.redirect(303, '/admin/blog?done=published');
      }
      return res.redirect(303, `/admin/blog/${saved.id}?saved=1`);
    } catch (error) {
      if (error instanceof PostValidationError) return renderEditor(res, post, { status: 400, values, error: error.message, errorField: error.field });
      throw error;
    }
  });

  router.post('/admin/blog/:id/unpublish', requireCsrf, async (req, res, next) => {
    const post = await store.getById(Number(req.params.id));
    if (!post) return next();
    await store.unpublish(post.id);
    return res.redirect(303, `/admin/blog/${post.id}?saved=1`);
  });

  router.post('/admin/blog/:id/delete', requireCsrf, async (req, res, next) => {
    const post = await store.getById(Number(req.params.id));
    if (!post) return next();
    await store.deletePost(post.id);
    return res.redirect(303, '/admin/blog?done=deleted');
  });

  if (studio) {
    router.post('/admin/blog/:id/generate', requireCsrf, async (req, res, next) => {
      const post = await store.getById(Number(req.params.id));
      if (!post) return next();
      studio.generateDraft(post.id, req.body.brief ?? post.brief).catch(onError);
      return res.redirect(303, `/admin/blog/${post.id}?generating=1`);
    });
    router.post('/admin/blog/:id/image', requireCsrf, async (req, res, next) => {
      const post = await store.getById(Number(req.params.id));
      if (!post) return next();
      studio.generateImage(post.id, req.body.heroPrompt ?? post.heroPrompt).catch(onError);
      return res.redirect(303, `/admin/blog/${post.id}?generating=image`);
    });
  }

  return router;
}

// The fields the checklist reads, rendered exactly as the store would render
// them, so the editor shows the same red/green that publish will decide on.
function checklistShape(values) {
  const bodyHtml = renderMarkdown(values.bodyMarkdown);
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    bodyHtml,
    wordCount: countWords(bodyHtml),
    heroKey: values.heroKey,
    heroAlt: values.heroAlt
  };
}
