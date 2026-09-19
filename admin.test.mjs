import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import { DataType, newDb } from 'pg-mem';

import { createAdminRouter } from './admin.mjs';
import { createTrackingRouter, createTrackingStore } from './tracking.mjs';
import { createPlaytestRouter, createPlaytestStore } from './playtest.mjs';
import { makeSession } from './admin-session.mjs';
import { links, product, siteUrl, trailer } from './data/content.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const ADMIN_PASSWORD = 'correct horse battery staple';
const SESSION_SECRET = 'a-test-session-secret-that-is-longer-than-32-characters';

function memoryPool() {
  const memory = newDb({ autoCreateForeignKeyIndices: true });
  memory.public.registerFunction({ name: 'to_char', args: [DataType.timestamptz, DataType.text], returns: DataType.text, implementation: (v, f) => f === 'YYYY-MM-DD' ? new Date(v).toISOString().slice(0, 10) : new Date(v).toISOString() });
  return new (memory.adapters.createPg()).Pool();
}

async function startServer() {
  const trackingStore = await createTrackingStore({ pool: memoryPool(), seedLinks: [{ name: 'Store', slug: 'meta-quest', destinationUrl: 'https://example.com/store' }] });
  const playtestStore = await createPlaytestStore({ pool: memoryPool() });
  const app = express();
  app.set('view engine', 'pug'); app.set('views', path.join(root, 'views'));
  Object.assign(app.locals, { siteUrl, product, links, trailer });
  app.get('/', (req, res) => res.render('privacy', { pagePath: '/privacy' }));
  app.use(createAdminRouter({ trackingStore, playtestStore, adminPassword: ADMIN_PASSWORD, sessionSecret: SESSION_SECRET }));
  app.use(createPlaytestRouter({ store: playtestStore, adminPassword: ADMIN_PASSWORD, sessionSecret: SESSION_SECRET, onError: () => {} }));
  app.use(createTrackingRouter({ store: trackingStore, siteUrl, adminPassword: ADMIN_PASSWORD, sessionSecret: SESSION_SECRET }));
  const server = await new Promise((resolve) => { const l = app.listen(0, '127.0.0.1', () => resolve(l)); });
  return {
    trackingStore, playtestStore, url: `http://127.0.0.1:${server.address().port}`,
    stop: async () => { await new Promise((r) => server.close(r)); await trackingStore.close(); await playtestStore.close(); }
  };
}

const cookie = () => `bw_admin=${makeSession(SESSION_SECRET, Date.now() + 3600_000)}`;

test('the footer links to the admin area from every page', async () => {
  const server = await startServer();
  try {
    const html = await (await fetch(`${server.url}/`)).text();
    assert.ok(html.includes('<a class="footer__legal" href="/admin" rel="nofollow">Admin</a>'));
  } finally { await server.stop(); }
});

test('signing in lands on the home page, which shows both sections and what needs attention', async () => {
  const server = await startServer();
  try {
    const loginPage = await (await fetch(`${server.url}/admin/login`)).text();
    assert.ok(loginPage.includes('<h1>Admin</h1>'), 'the login page says only that it is the admin area');
    assert.ok(!loginPage.includes('Campaign links') && !loginPage.includes('short links'), 'and nothing about what is behind it');

    const anonymous = await fetch(`${server.url}/admin`, { redirect: 'manual' });
    assert.equal(anonymous.status, 303);
    assert.equal(anonymous.headers.get('location'), '/admin/login');

    const login = await fetch(`${server.url}/admin/login`, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ password: ADMIN_PASSWORD }), redirect: 'manual'
    });
    assert.equal(login.status, 303);
    assert.equal(login.headers.get('location'), '/admin', 'the password lands on the home page, not the links list');

    const { application } = await server.playtestStore.createApplication({
      email: 'a@example.com', horizonUsername: 'Ab', headset: 'quest-2', vrFrequency: 'rarely', captureMethod: 'recording',
      recentGames: 'x', country: 'y', ageGroup: 'adult', paypalOk: 'yes', canFinish: 'yes', acceptedTerms: 'yes'
    });
    const home = await (await fetch(`${server.url}/admin`, { headers: { cookie: cookie() } })).text();
    assert.ok(home.includes('<h1>Admin</h1>'));
    assert.ok(home.includes('Playtest') && home.includes('Campaign links'));
    assert.ok(home.includes('href="/admin/playtest"') && home.includes('href="/admin/links"') && home.includes('href="/admin/playtest/emails"'));
    assert.ok(home.includes('new application to read'), 'the unread application is called out');
    assert.ok(home.includes('no unused keys'), 'and the empty key box');
    assert.ok(home.includes('Active links'));

    await server.playtestStore.addKeys('KEY01-AAAAA-AAAAA-AAAAA-AAAAA');
    await server.playtestStore.setStatus(application.id, 'submitted');
    const later = await (await fetch(`${server.url}/admin`, { headers: { cookie: cookie() } })).text();
    assert.ok(later.includes('submission awaiting payment'));
    assert.ok(!later.includes('no unused keys'));
  } finally { await server.stop(); }
});

test('the emails page lists every email with delivered, opened and clicked, and opens are labelled unreliable', async () => {
  const server = await startServer();
  try {
    const { application } = await server.playtestStore.createApplication({
      email: 'a@example.com', horizonUsername: 'Ab', headset: 'quest-2', vrFrequency: 'rarely', captureMethod: 'recording',
      recentGames: 'x', country: 'y', ageGroup: 'adult', paypalOk: 'yes', canFinish: 'yes', acceptedTerms: 'yes'
    });
    await server.playtestStore.recordEmail({ applicationId: application.id, kind: 'invited', recipient: 'a@example.com', messageId: 'm-1' });
    await server.playtestStore.recordEmailEvent('m-1', { kind: 'delivery', at: '2026-09-17T01:00:00.000Z' });
    await server.playtestStore.recordEmailEvent('m-1', { kind: 'open', at: '2026-09-17T01:05:00.000Z', detail: 'Mozilla/5.0' });
    await server.playtestStore.recordEmailEvent('m-1', { kind: 'open', at: '2026-09-17T01:06:00.000Z' });
    await server.playtestStore.recordEmailEvent('m-1', { kind: 'click', at: '2026-09-17T01:07:00.000Z' });

    const [mail] = await server.playtestStore.emailsFor(application.id);
    assert.equal(mail.firstOpenAt, '2026-09-17T01:05:00.000Z');
    assert.equal(mail.openCount, 2);

    const page = await (await fetch(`${server.url}/admin/playtest/emails`, { headers: { cookie: cookie() } })).text();
    assert.ok(page.includes('<h1>Playtest emails</h1>'));
    assert.ok(page.includes(application.reference) && page.includes('a@example.com'));
    assert.ok(page.includes('2026-09-17 01:00') && page.includes('2026-09-17 01:05 ×2') && page.includes('2026-09-17 01:07'));
    assert.ok(page.includes('Unreliable'), 'opens carry the caveat');

    const detail = await (await fetch(`${server.url}/admin/playtest/${application.id}`, { headers: { cookie: cookie() } })).text();
    assert.ok(detail.includes('<th>Opened</th>') && detail.includes('2026-09-17 01:05 ×2'));

    const all = await server.playtestStore.listEmails();
    assert.equal(all.length, 1);
    assert.equal(all[0].reference, application.reference);
  } finally { await server.stop(); }
});
