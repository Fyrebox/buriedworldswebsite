import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import { DataType, newDb } from 'pg-mem';

import {
  buildDestination,
  createTrackingRouter,
  createTrackingStore,
  LinkValidationError,
  normaliseLink
} from './tracking.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));

function createMemoryPool() {
  const memory = newDb({ autoCreateForeignKeyIndices: true });
  memory.public.registerFunction({
    name: 'to_char',
    args: [DataType.timestamptz, DataType.text],
    returns: DataType.text,
    implementation(value, format) {
      const timestamp = new Date(value).toISOString();
      return format === 'YYYY-MM-DD' ? timestamp.slice(0, 10) : timestamp;
    }
  });
  const adapter = memory.adapters.createPg();
  return new adapter.Pool();
}

function linkInput(overrides = {}) {
  return {
    name: 'Reddit launch',
    slug: 'reddit-launch',
    destinationUrl: 'https://example.com/game?existing=yes',
    utmSource: 'Reddit',
    utmMedium: 'Social',
    utmCampaign: 'Quest-Launch',
    utmContent: 'Trailer',
    ...overrides
  };
}

async function startServer(options = {}) {
  const pool = createMemoryPool();
  const store = await createTrackingStore({
    pool,
    seedLinks: [linkInput()],
    ...options.storeOptions
  });
  const app = express();
  app.set('view engine', 'pug');
  app.set('views', path.join(root, 'views'));
  app.locals.siteUrl = 'https://www.buriedworlds.com';
  app.locals.product = { name: 'Buried Worlds VR' };
  app.locals.links = {};
  app.locals.trailer = {};
  app.use(createTrackingRouter({
    store,
    siteUrl: 'https://www.buriedworlds.com',
    adminPassword: 'correct horse battery staple',
    sessionSecret: 'a-test-session-secret-that-is-longer-than-32-characters',
    ...options.routerOptions
  }));
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  return {
    store,
    url: `http://127.0.0.1:${server.address().port}`,
    stop: async () => {
      await new Promise((resolve) => server.close(resolve));
      await store.close();
    }
  };
}

test('link validation normalises campaign values and rejects unsafe destinations', () => {
  const link = normaliseLink(linkInput());
  assert.equal(link.slug, 'reddit-launch');
  assert.equal(link.utmSource, 'reddit');
  assert.equal(link.utmCampaign, 'quest-launch');
  assert.throws(
    () => normaliseLink(linkInput({ destinationUrl: 'javascript:alert(1)' })),
    LinkValidationError
  );
  assert.throws(
    () => normaliseLink(linkInput({ destinationUrl: 'https://evil.example/' }), new Set(['example.com'])),
    LinkValidationError
  );
});

test('buildDestination preserves query parameters and adds UTMs', () => {
  const destination = new URL(buildDestination(normaliseLink(linkInput())));
  assert.equal(destination.searchParams.get('existing'), 'yes');
  assert.equal(destination.searchParams.get('utm_source'), 'reddit');
  assert.equal(destination.searchParams.get('utm_medium'), 'social');
  assert.equal(destination.searchParams.get('utm_campaign'), 'quest-launch');
  assert.equal(destination.searchParams.get('utm_content'), 'trailer');
});

test('campaign store creates, edits, pauses and keeps historic clicks', async () => {
  const store = await createTrackingStore({ pool: createMemoryPool() });
  try {
    const created = await store.createLink(linkInput());
    await store.recordClick(created, {
      clickedAt: new Date().toISOString(),
      destinationUrl: buildDestination(created),
      referrerHost: 'reddit.com',
      deviceCategory: 'mobile',
      isBot: false,
      placement: 'launch-post'
    });
    const updated = await store.updateLink(created.id, linkInput({
      name: 'Changed name',
      slug: 'this-must-not-replace-the-printed-link',
      destinationUrl: 'https://example.com/new'
    }));
    assert.equal(updated.name, 'Changed name');
    assert.equal(updated.slug, 'reddit-launch');
    assert.equal(await store.getBySlug('this-must-not-replace-the-printed-link'), null);
    assert.equal((await store.listLinks())[0].humanClicks, 1);
    assert.equal((await store.getLinkStats(created.id, 30)).referrers[0].label, 'reddit.com');
    assert.equal(await store.setActive(created.id, false), true);
    assert.equal((await store.getBySlug(created.slug)).active, false);
  } finally {
    await store.close();
  }
});

test('reset clicks clears recent records and archived totals without deleting the link', async () => {
  const pool = createMemoryPool();
  const store = await createTrackingStore({ pool });
  try {
    const created = await store.createLink(linkInput());
    await store.recordClick(created, {
      clickedAt: new Date().toISOString(),
      destinationUrl: buildDestination(created),
      referrerHost: '',
      deviceCategory: 'mobile',
      isBot: false,
      placement: 'qr'
    });
    await pool.query(`
      INSERT INTO campaign_click_totals
        (link_id, human_clicks, bot_clicks, archived_through)
      VALUES ($1, 5, 2, NOW())
    `, [created.id]);

    const before = (await store.listLinks())[0];
    assert.equal(before.humanClicks, 6);
    assert.equal(before.botClicks, 2);
    assert.equal(await store.resetClicks(created.id), true);

    const after = (await store.listLinks())[0];
    assert.equal(after.humanClicks, 0);
    assert.equal(after.botClicks, 0);
    assert.deepEqual(await store.exportClicks(created.id), []);
    assert.equal((await pool.query(
      'SELECT COUNT(*) AS count FROM campaign_click_totals WHERE link_id = $1',
      [created.id]
    )).rows[0].count, 0);
    assert.equal((await store.getById(created.id)).slug, 'reddit-launch');
  } finally {
    await store.close();
  }
});

test('public campaign route records a human click then redirects with UTMs', async () => {
  const app = await startServer();
  try {
    const response = await fetch(`${app.url}/go/reddit-launch?placement=hero`, {
      redirect: 'manual',
      headers: { referer: 'https://www.reddit.com/r/buriedworlds/', 'user-agent': 'Mozilla/5.0 Mobile' }
    });
    assert.equal(response.status, 302);
    assert.match(response.headers.get('location'), /utm_source=reddit/);
    const storedLink = await app.store.getBySlug('reddit-launch');
    const stats = await app.store.getLinkStats(storedLink.id, 30);
    assert.equal(stats.humanClicks, 1);
    assert.deepEqual(stats.devices, [{ label: 'mobile', clicks: 1 }]);
    assert.deepEqual(stats.placements, [{ label: 'hero', clicks: 1 }]);
  } finally {
    await app.stop();
  }
});

test('bots are separated and HEAD requests do not count', async () => {
  const app = await startServer();
  try {
    await fetch(`${app.url}/go/reddit-launch`, {
      redirect: 'manual',
      headers: { 'user-agent': 'Discordbot/2.0' }
    });
    const storedLink = await app.store.getBySlug('reddit-launch');
    const afterBot = await app.store.getLinkStats(storedLink.id, 30);
    assert.equal(afterBot.humanClicks, 0);
    assert.equal(afterBot.botClicks, 1);
    await fetch(`${app.url}/go/reddit-launch`, { method: 'HEAD', redirect: 'manual' });
    const stats = await app.store.getLinkStats(storedLink.id, 30);
    assert.equal(stats.humanClicks, 0);
    assert.equal(stats.botClicks, 1);
  } finally {
    await app.stop();
  }
});

test('missing and paused links fail closed without redirecting', async () => {
  const app = await startServer();
  try {
    assert.equal((await fetch(`${app.url}/go/missing`, { redirect: 'manual' })).status, 404);
    const link = await app.store.getBySlug('reddit-launch');
    await app.store.setActive(link.id, false);
    assert.equal((await fetch(`${app.url}/go/reddit-launch`, { redirect: 'manual' })).status, 410);
  } finally {
    await app.stop();
  }
});

test('admin is private, signs in and renders the dashboard without GA', async () => {
  const app = await startServer();
  try {
    const guarded = await fetch(`${app.url}/admin/links`, { redirect: 'manual' });
    assert.equal(guarded.status, 303);
    assert.equal(guarded.headers.get('location'), '/admin/login');

    const bad = await fetch(`${app.url}/admin/login`, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ password: 'wrong' })
    });
    assert.equal(bad.status, 401);

    const login = await fetch(`${app.url}/admin/login`, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ password: 'correct horse battery staple' })
    });
    assert.equal(login.status, 303);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const dashboard = await fetch(`${app.url}/admin/links`, { headers: { cookie } });
    assert.equal(dashboard.status, 200);
    const html = await dashboard.text();
    assert.match(html, /Campaign links/);
    assert.doesNotMatch(html, /googletagmanager/);

    const seededLink = await app.store.getBySlug('reddit-launch');
    const detail = await fetch(`${app.url}/admin/links/${seededLink.id}`, { headers: { cookie } });
    const detailHtml = await detail.text();
    assert.equal(detail.status, 200);
    assert.match(detailHtml, /Flyer QR code/);
    assert.match(detailHtml, /placement=qr/);

    const editForm = await fetch(`${app.url}/admin/links/${seededLink.id}/edit`, {
      headers: { cookie }
    });
    const editHtml = await editForm.text();
    assert.equal(editForm.status, 200);
    assert.match(editHtml, /Locked after creation so printed QR codes always keep working/);
    assert.doesNotMatch(editHtml, /type="text" name="slug"/);

    const guardedQr = await fetch(`${app.url}/admin/links/${seededLink.id}/qr.svg`, {
      redirect: 'manual'
    });
    assert.equal(guardedQr.status, 303);

    const svg = await fetch(`${app.url}/admin/links/${seededLink.id}/qr.svg?download=1`, {
      headers: { cookie }
    });
    assert.equal(svg.status, 200);
    assert.match(svg.headers.get('content-type'), /^image\/svg\+xml/);
    assert.equal(
      svg.headers.get('content-disposition'),
      'attachment; filename="buried-worlds-reddit-launch-qr.svg"'
    );
    assert.match(await svg.text(), /^<svg/);

    const png = await fetch(`${app.url}/admin/links/${seededLink.id}/qr.png?download=1`, {
      headers: { cookie }
    });
    assert.equal(png.status, 200);
    assert.match(png.headers.get('content-type'), /^image\/png/);
    const pngBytes = new Uint8Array(await png.arrayBuffer());
    assert.deepEqual([...pngBytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);

    const csrf = html.match(/name="_csrf" value="([^"]+)"/)[1];
    await app.store.recordClick(seededLink, {
      clickedAt: new Date().toISOString(),
      destinationUrl: buildDestination(seededLink),
      referrerHost: '',
      deviceCategory: 'mobile',
      isBot: false,
      placement: 'qr'
    });
    const reset = await fetch(`${app.url}/admin/links/${seededLink.id}/reset-clicks`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        cookie,
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ _csrf: csrf })
    });
    assert.equal(reset.status, 303);
    assert.equal(reset.headers.get('location'), `/admin/links/${seededLink.id}?reset=1`);
    assert.equal((await app.store.getLinkStats(seededLink.id, 30)).humanClicks, 0);
    assert.ok(await app.store.getById(seededLink.id));
    const resetPage = await fetch(`${app.url}${reset.headers.get('location')}`, {
      headers: { cookie }
    });
    assert.match(await resetPage.text(), /Click history reset/);

    const edited = await fetch(`${app.url}/admin/links/${seededLink.id}`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        cookie,
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        _csrf: csrf,
        name: 'Printed flyer',
        slug: 'tampered-short-name',
        destinationUrl: 'https://example.com/updated'
      })
    });
    assert.equal(edited.status, 303);
    assert.equal((await app.store.getById(seededLink.id)).slug, 'reddit-launch');
    assert.equal(await app.store.getBySlug('tampered-short-name'), null);

    const created = await fetch(`${app.url}/admin/links`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        cookie,
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        _csrf: csrf,
        name: 'Newsletter',
        slug: 'newsletter-launch',
        destinationUrl: 'https://example.com/newsletter',
        utmSource: 'newsletter',
        utmMedium: 'email',
        utmCampaign: 'launch'
      })
    });
    assert.equal(created.status, 303);
    assert.equal((await app.store.getBySlug('newsletter-launch')).name, 'Newsletter');

    const rejected = await fetch(`${app.url}/admin/links`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        cookie,
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ _csrf: 'wrong' })
    });
    assert.equal(rejected.status, 403);
  } finally {
    await app.stop();
  }
});

test('admin routes disappear when secrets are not configured', async () => {
  const app = await startServer({
    routerOptions: { adminPassword: '', sessionSecret: '' }
  });
  try {
    assert.equal((await fetch(`${app.url}/admin/login`)).status, 404);
  } finally {
    await app.stop();
  }
});
