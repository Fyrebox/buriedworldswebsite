// The admin home page: where the password lands you, and where both halves of
// the private area — campaign links and the playtest — are one click away
// with the numbers that say whether anything needs doing.
//
// Reads both stores and writes nothing. The session it checks is the one the
// campaign dashboard's /admin/login issues (admin-session.mjs).

import express from 'express';

import { csrfToken, readSession } from './admin-session.mjs';

export function createAdminRouter({
  trackingStore,
  playtestStore,
  blogStore = null,
  adminPassword = '',
  sessionSecret = '',
  now = () => Date.now()
}) {
  if (!trackingStore || !playtestStore) throw new Error('createAdminRouter requires both stores');
  const router = express.Router();
  const enabled = Boolean(adminPassword && sessionSecret.length >= 32);

  router.get('/admin', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Robots-Tag', 'noindex, nofollow');
    if (!enabled) return res.status(404).send('Not found');
    const expiresAt = readSession(req, sessionSecret, now);
    if (!expiresAt) return res.redirect(303, '/admin/login');
    res.locals.csrf = csrfToken(sessionSecret, expiresAt);

    const [links, summary, keys, troubled, blogPosts] = await Promise.all([
      trackingStore.listLinks(),
      playtestStore.summarise(),
      playtestStore.keySummary(),
      playtestStore.troubledApplicationIds(),
      blogStore ? blogStore.listAll() : Promise.resolve([])
    ]);
    const blog = {
      published: blogPosts.filter((p) => p.status === 'published').length,
      drafts: blogPosts.filter((p) => p.status !== 'published').length
    };
    const clicks7d = links.reduce((total, link) => total + link.clicks7d, 0);
    const active = links.filter((link) => link.active).length;
    const attention = [];
    if (summary.byStatus.new) attention.push({ count: summary.byStatus.new, label: 'new application' + (summary.byStatus.new === 1 ? '' : 's') + ' to read', href: '/admin/playtest' });
    if (summary.byStatus.submitted) attention.push({ count: summary.byStatus.submitted, label: 'submission' + (summary.byStatus.submitted === 1 ? '' : 's') + ' awaiting payment', href: '/admin/playtest' });
    if (troubled.size) attention.push({ count: troubled.size, label: 'applicant' + (troubled.size === 1 ? '' : 's') + ' with a bounced email', href: '/admin/playtest/emails' });
    if (keys.unused === 0) attention.push({ count: 0, label: 'no unused keys — Invited will refuse until some are pasted', href: '/admin/playtest#keys' });

    return res.render('admin-home', {
      pageTitle: 'Admin — Buried Worlds VR',
      pagePath: '/admin',
      noIndex: true,
      disableAnalytics: true,
      links: { total: links.length, active, clicks7d },
      playtest: { summary, keys },
      blog,
      attention
    });
  });

  return router;
}
