// First-party campaign links and their private admin dashboard.
//
// Public links use /go/:slug. A click is written to PostgreSQL before a temporary
// redirect sends the visitor on. We deliberately keep the record coarse: no IP
// address, full user agent, cookie or fingerprint reaches the database.

import crypto from 'node:crypto';

import express from 'express';
import { LinkValidationError } from './tracking-store.mjs';

export { createTrackingStore, LinkValidationError, normaliseLink } from './tracking-store.mjs';

const SESSION_COOKIE = 'bw_admin';
const SESSION_AGE_SECONDS = 8 * 60 * 60;
const MAX_FORM_BYTES = 16 * 1024;

export function buildDestination(link) {
  const destination = new URL(link.destinationUrl);
  const fields = [
    ['utm_source', link.utmSource],
    ['utm_medium', link.utmMedium],
    ['utm_campaign', link.utmCampaign],
    ['utm_content', link.utmContent]
  ];
  for (const [key, value] of fields) {
    if (value) destination.searchParams.set(key, value);
  }
  return destination.toString();
}

function referrerHost(value) {
  if (!value) return '';
  try {
    return new URL(value).hostname.toLowerCase().slice(0, 253);
  } catch {
    return '';
  }
}

function classifyRequest(req) {
  const userAgent = String(req.get('user-agent') ?? '');
  const purpose = `${req.get('purpose') ?? ''} ${req.get('sec-purpose') ?? ''}`;
  const isBot = /bot|crawler|spider|preview|slurp|facebookexternalhit|discordbot|slackbot|twitterbot|whatsapp/i.test(userAgent)
    || /prefetch|prerender/i.test(purpose);

  let deviceCategory = 'desktop';
  if (!userAgent) deviceCategory = 'unknown';
  else if (/oculusbrowser|quest/i.test(userAgent)) deviceCategory = 'headset';
  else if (/ipad|tablet|kindle/i.test(userAgent)) deviceCategory = 'tablet';
  else if (/mobile|iphone|android/i.test(userAgent)) deviceCategory = 'mobile';

  return { isBot, deviceCategory };
}

function parseCookies(header = '') {
  const cookies = {};
  for (const part of header.split(';')) {
    const at = part.indexOf('=');
    if (at < 0) continue;
    cookies[part.slice(0, at).trim()] = decodeURIComponent(part.slice(at + 1).trim());
  }
  return cookies;
}

function signature(secret, value) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function makeSession(secret, expiresAt) {
  const value = String(expiresAt);
  return `${value}.${signature(secret, `session:${value}`)}`;
}

function readSession(req, secret, now) {
  const value = parseCookies(req.get('cookie'))[SESSION_COOKIE];
  if (!value) return null;
  const [expiresRaw, receivedSignature] = value.split('.');
  const expiresAt = Number(expiresRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now()) return null;
  if (!safeEqual(receivedSignature, signature(secret, `session:${expiresRaw}`))) return null;
  return expiresAt;
}

function csrfToken(secret, expiresAt) {
  return signature(secret, `csrf:${expiresAt}`);
}

function csvValue(value) {
  const string = String(value ?? '');
  return `"${string.replaceAll('"', '""')}"`;
}

function formValues(body = {}) {
  return {
    name: body.name ?? '',
    slug: body.slug ?? '',
    destinationUrl: body.destinationUrl ?? '',
    utmSource: body.utmSource ?? '',
    utmMedium: body.utmMedium ?? '',
    utmCampaign: body.utmCampaign ?? '',
    utmContent: body.utmContent ?? ''
  };
}

export function createTrackingRouter({
  store,
  siteUrl,
  adminPassword = '',
  sessionSecret = '',
  now = () => Date.now(),
  onError = (error) => console.error('[tracking]', error)
}) {
  if (!store || !siteUrl) throw new Error('createTrackingRouter requires store and siteUrl');
  const router = express.Router();
  const adminEnabled = Boolean(adminPassword && sessionSecret.length >= 32);
  const loginAttempts = new Map();

  // Express normally answers HEAD through a matching GET route. Declare it
  // explicitly so uptime monitors and link checkers never become human clicks.
  router.head('/go/:slug', async (req, res) => {
    const link = await store.getBySlug(String(req.params.slug).toLowerCase());
    res.set('Cache-Control', 'no-store');
    res.set('X-Robots-Tag', 'noindex, nofollow');
    if (!link) return res.sendStatus(404);
    if (!link.active) return res.sendStatus(410);
    return res.redirect(302, buildDestination(link));
  });

  router.get('/go/:slug', async (req, res) => {
    const link = await store.getBySlug(String(req.params.slug).toLowerCase());
    res.set('Cache-Control', 'no-store');
    res.set('X-Robots-Tag', 'noindex, nofollow');
    if (!link) {
      return res.status(404).render('redirect-unavailable', {
        pageTitle: 'Link not found — Buried Worlds VR',
        pagePath: req.path,
        noIndex: true,
        disableAnalytics: true,
        reason: 'That expedition link does not exist.'
      });
    }
    if (!link.active) {
      return res.status(410).render('redirect-unavailable', {
        pageTitle: 'Link unavailable — Buried Worlds VR',
        pagePath: req.path,
        noIndex: true,
        disableAnalytics: true,
        reason: 'That expedition link is no longer active.'
      });
    }

    const destinationUrl = buildDestination(link);
    const classification = classifyRequest(req);
    try {
      await store.recordClick(link, {
        clickedAt: new Date(now()).toISOString(),
        destinationUrl,
        referrerHost: referrerHost(req.get('referer')),
        deviceCategory: classification.deviceCategory,
        isBot: classification.isBot,
        // Placement is public input, so overlong noise is truncated rather
        // than allowed to interrupt the visitor's redirect.
        placement: String(req.query.placement ?? '').trim().slice(0, 64).toLowerCase()
      });
    } catch (error) {
      // The campaign link's primary job is to reach the destination. Analytics
      // failure must never strand a visitor on the way to the store.
      onError(error);
    }
    return res.redirect(302, destinationUrl);
  });

  router.use('/admin', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Robots-Tag', 'noindex, nofollow');
    if (!adminEnabled) return res.status(404).send('Not found');
    next();
  });
  router.use('/admin', express.urlencoded({ extended: false, limit: MAX_FORM_BYTES }));

  router.get('/admin/login', (req, res) => {
    if (readSession(req, sessionSecret, now)) return res.redirect('/admin/links');
    return res.render('admin-login', {
      pageTitle: 'Admin sign in — Buried Worlds VR',
      pagePath: '/admin/login',
      noIndex: true,
      disableAnalytics: true,
      error: ''
    });
  });

  router.post('/admin/login', (req, res) => {
    const key = req.ip ?? 'unknown';
    const currentTime = now();
    const existing = loginAttempts.get(key);
    const attempt = !existing || currentTime >= existing.resetAt
      ? { count: 0, resetAt: currentTime + 15 * 60 * 1000 }
      : existing;
    attempt.count += 1;
    loginAttempts.set(key, attempt);
    if (attempt.count > 10) {
      return res.status(429).render('admin-login', {
        pageTitle: 'Admin sign in — Buried Worlds VR',
        pagePath: '/admin/login',
        noIndex: true,
        disableAnalytics: true,
        error: 'Too many attempts. Try again later.'
      });
    }

    const suppliedPassword = signature(sessionSecret, String(req.body.password ?? ''));
    const expectedPassword = signature(sessionSecret, adminPassword);
    if (!safeEqual(suppliedPassword, expectedPassword)) {
      return res.status(401).render('admin-login', {
        pageTitle: 'Admin sign in — Buried Worlds VR',
        pagePath: '/admin/login',
        noIndex: true,
        disableAnalytics: true,
        error: 'The password was not recognised.'
      });
    }

    loginAttempts.delete(key);
    const expiresAt = currentTime + SESSION_AGE_SECONDS * 1000;
    const localHost = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
    const secure = req.secure || !localHost ? '; Secure' : '';
    res.set('Set-Cookie', `${SESSION_COOKIE}=${makeSession(sessionSecret, expiresAt)}; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=${SESSION_AGE_SECONDS}${secure}`);
    return res.redirect(303, '/admin/links');
  });

  router.use('/admin', (req, res, next) => {
    if (req.path === '/login') return next();
    const expiresAt = readSession(req, sessionSecret, now);
    if (!expiresAt) return res.redirect(303, '/admin/login');
    req.adminExpiresAt = expiresAt;
    res.locals.csrf = csrfToken(sessionSecret, expiresAt);
    next();
  });

  function requireCsrf(req, res, next) {
    const expected = csrfToken(sessionSecret, req.adminExpiresAt);
    if (!safeEqual(req.body._csrf ?? '', expected)) return res.status(403).send('Invalid form token');
    next();
  }

  router.post('/admin/logout', requireCsrf, (req, res) => {
    res.set('Set-Cookie', `${SESSION_COOKIE}=; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=0`);
    return res.redirect(303, '/admin/login');
  });

  router.get('/admin', (req, res) => res.redirect('/admin/links'));

  router.get('/admin/links', async (req, res) => {
    const links = await store.listLinks();
    const totals = links.reduce((summary, link) => ({
      humanClicks: summary.humanClicks + link.humanClicks,
      clicks7d: summary.clicks7d + link.clicks7d,
      clicks30d: summary.clicks30d + link.clicks30d,
      botClicks: summary.botClicks + link.botClicks
    }), { humanClicks: 0, clicks7d: 0, clicks30d: 0, botClicks: 0 });
    return res.render('admin-links', {
      pageTitle: 'Campaign links — Buried Worlds VR',
      pagePath: '/admin/links',
      noIndex: true,
      disableAnalytics: true,
      links,
      totals,
      siteUrl
    });
  });

  router.get('/admin/links/new', (req, res) => res.render('admin-link-form', {
    pageTitle: 'New campaign link — Buried Worlds VR',
    pagePath: '/admin/links/new',
    noIndex: true,
    disableAnalytics: true,
    heading: 'New campaign link',
    submitLabel: 'Create link',
    action: '/admin/links',
    link: formValues(),
    error: ''
  }));

  router.post('/admin/links', requireCsrf, async (req, res) => {
    try {
      const link = await store.createLink(formValues(req.body));
      return res.redirect(303, `/admin/links/${link.id}`);
    } catch (error) {
      if (!(error instanceof LinkValidationError)) throw error;
      return res.status(400).render('admin-link-form', {
        pageTitle: 'New campaign link — Buried Worlds VR',
        pagePath: '/admin/links/new',
        noIndex: true,
        disableAnalytics: true,
        heading: 'New campaign link',
        submitLabel: 'Create link',
        action: '/admin/links',
        link: formValues(req.body),
        error: error.message
      });
    }
  });

  router.get('/admin/links/:id/edit', async (req, res) => {
    const link = await store.getById(Number(req.params.id));
    if (!link) return res.status(404).send('Not found');
    return res.render('admin-link-form', {
      pageTitle: `Edit ${link.name} — Buried Worlds VR`,
      pagePath: req.path,
      noIndex: true,
      disableAnalytics: true,
      heading: `Edit ${link.name}`,
      submitLabel: 'Save changes',
      action: `/admin/links/${link.id}`,
      link,
      error: ''
    });
  });

  router.post('/admin/links/:id', requireCsrf, async (req, res) => {
    const id = Number(req.params.id);
    try {
      const link = await store.updateLink(id, formValues(req.body));
      return res.redirect(303, `/admin/links/${link.id}`);
    } catch (error) {
      if (!(error instanceof LinkValidationError)) throw error;
      return res.status(400).render('admin-link-form', {
        pageTitle: 'Edit campaign link — Buried Worlds VR',
        pagePath: req.path,
        noIndex: true,
        disableAnalytics: true,
        heading: 'Edit campaign link',
        submitLabel: 'Save changes',
        action: `/admin/links/${id}`,
        link: { id, ...formValues(req.body) },
        error: error.message
      });
    }
  });

  router.post('/admin/links/:id/toggle', requireCsrf, async (req, res) => {
    const link = await store.getById(Number(req.params.id));
    if (!link) return res.status(404).send('Not found');
    await store.setActive(link.id, !link.active);
    return res.redirect(303, `/admin/links/${link.id}`);
  });

  router.get('/admin/links/:id/export.csv', async (req, res) => {
    const link = await store.getById(Number(req.params.id));
    if (!link) return res.status(404).send('Not found');
    const columns = [
      'clicked_at', 'destination_url', 'referrer_host', 'device_category', 'is_bot',
      'placement', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'
    ];
    const rows = await store.exportClicks(link.id);
    const csv = [columns.join(','), ...rows.map((row) => columns.map((column) => csvValue(row[column])).join(','))].join('\n');
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="${link.slug}-clicks.csv"`);
    return res.send(`${csv}\n`);
  });

  router.get('/admin/links/:id', async (req, res) => {
    const requestedDays = Number.parseInt(req.query.days ?? '30', 10);
    const days = [7, 30, 90, 365].includes(requestedDays) ? requestedDays : 30;
    const stats = await store.getLinkStats(Number(req.params.id), days);
    if (!stats) return res.status(404).send('Not found');
    return res.render('admin-link-detail', {
      pageTitle: `${stats.link.name} analytics — Buried Worlds VR`,
      pagePath: req.path,
      noIndex: true,
      disableAnalytics: true,
      stats,
      siteUrl,
      maxDaily: Math.max(1, ...stats.daily.map((entry) => entry.clicks))
    });
  });

  router.use('/admin', (error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error?.type === 'entity.too.large') return res.status(413).send('Form is too large');
    onError(error);
    return res.status(500).send('Admin error');
  });

  return router;
}
