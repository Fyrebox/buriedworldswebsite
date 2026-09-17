import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import express from 'express';

import { canonicalString, createSesEventsRouter, isAmazonCertUrl, summariseSesEvent, verifySignature } from './ses-events.mjs';
import { textToHtml } from './mailer.mjs';

const TOPIC = 'arn:aws:sns:us-west-2:123456789012:buriedworlds-ses-events';
const CERT_URL = 'https://sns.us-west-2.amazonaws.com/SimpleNotificationService-abc123.pem';

// A key pair standing in for Amazon's. The router only ever sees the "certificate"
// through the injected fetcher, so a bare public key serves as the PEM.
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const publicPem = publicKey.export({ type: 'spki', format: 'pem' });

function sign(message, { version = '1', key = privateKey } = {}) {
  const withVersion = { ...message, SignatureVersion: version };
  const signature = crypto.sign(version === '2' ? 'RSA-SHA256' : 'RSA-SHA1', Buffer.from(canonicalString(withVersion), 'utf8'), key).toString('base64');
  return { ...withVersion, Signature: signature, SigningCertURL: CERT_URL };
}

function notification(sesEvent, overrides = {}) {
  return sign({
    Type: 'Notification',
    MessageId: crypto.randomUUID(),
    TopicArn: TOPIC,
    Message: JSON.stringify(sesEvent),
    Timestamp: new Date().toISOString(),
    ...overrides
  });
}

async function startServer(options = {}) {
  const events = [];
  const confirmed = [];
  const app = express();
  app.use(createSesEventsRouter({
    topicArn: TOPIC,
    onEvent: async (messageId, event) => { events.push({ messageId, ...event }); return messageId.startsWith('known-'); },
    fetchCertificate: async (url) => { assert.equal(url, CERT_URL); return publicPem; },
    confirmSubscription: async (url) => { confirmed.push(url); },
    onError: () => {},
    ...options
  }));
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const url = `http://127.0.0.1:${server.address().port}`;
  return {
    events, confirmed,
    post: (body) => fetch(`${url}/api/ses-events`, { method: 'POST', headers: { 'content-type': 'text/plain; charset=UTF-8' }, body: typeof body === 'string' ? body : JSON.stringify(body) }),
    stop: () => new Promise((resolve) => server.close(resolve))
  };
}

test('only Amazon-hosted certificate URLs are ever fetched', () => {
  assert.ok(isAmazonCertUrl('https://sns.us-west-2.amazonaws.com/SimpleNotificationService-x.pem'));
  assert.ok(isAmazonCertUrl('https://sns.ap-southeast-2.amazonaws.com/a.pem'));
  for (const bad of ['http://sns.us-west-2.amazonaws.com/a.pem', 'https://sns.us-west-2.amazonaws.com.evil.com/a.pem', 'https://evil.com/sns.us-west-2.amazonaws.com/a.pem', 'https://sns.us-west-2.amazonaws.com/a.txt', 'not a url']) {
    assert.ok(!isAmazonCertUrl(bad), bad);
  }
});

test('signatures verify for both versions, and fail when anything in the message changes', () => {
  const base = { Type: 'Notification', MessageId: 'm1', TopicArn: TOPIC, Message: '{}', Timestamp: '2026-09-16T00:00:00.000Z' };
  assert.ok(verifySignature(sign(base), publicPem));
  assert.ok(verifySignature(sign(base, { version: '2' }), publicPem));
  const signed = sign(base);
  assert.ok(!verifySignature({ ...signed, Message: '{"eventType":"Delivery"}' }, publicPem), 'a changed body fails');
  assert.ok(!verifySignature({ ...signed, TopicArn: TOPIC + 'x' }, publicPem), 'a changed topic fails');
  const other = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
  assert.ok(!verifySignature(sign(base, { key: other }), publicPem), 'another key fails');
  assert.ok(!verifySignature({ ...signed, Signature: '' }, publicPem));
});

test('a notification is verified, reduced, and matched only to a message the site sent', async () => {
  const server = await startServer();
  try {
    const known = await server.post(notification({ eventType: 'Delivery', mail: { messageId: 'known-1' }, delivery: { timestamp: '2026-09-16T01:02:03.000Z' } }));
    assert.equal(known.status, 200);
    assert.deepEqual(await known.json(), { ok: true, matched: true });
    assert.deepEqual(server.events.at(-1), { messageId: 'known-1', kind: 'delivery', at: '2026-09-16T01:02:03.000Z', detail: '' });

    const stranger = await server.post(notification({ eventType: 'Bounce', mail: { messageId: 'someone-elses' }, bounce: { bounceType: 'Permanent', bounceSubType: 'General', timestamp: '2026-09-16T01:02:03.000Z', bouncedRecipients: [{ diagnosticCode: '550 no such user' }] } }));
    assert.deepEqual(await stranger.json(), { ok: true, matched: false });
    assert.equal(server.events.at(-1).detail, 'Permanent · General · 550 no such user');

    const click = await server.post(notification({ eventType: 'Click', mail: { messageId: 'known-2' }, click: { timestamp: '2026-09-16T02:00:00.000Z', link: 'https://www.buriedworlds.com/playtest/questionnaire' } }));
    assert.equal((await click.json()).matched, true);
    assert.equal(server.events.at(-1).kind, 'click');

    const open = await server.post(notification({ eventType: 'Open', mail: { messageId: 'known-3' }, open: { timestamp: '2026-09-16T02:00:00.000Z', userAgent: 'Mozilla/5.0 (iPhone)' } }));
    assert.equal((await open.json()).matched, true);
    assert.deepEqual(server.events.at(-1), { messageId: 'known-3', kind: 'open', at: '2026-09-16T02:00:00.000Z', detail: 'Mozilla/5.0 (iPhone)' });
  } finally {
    await server.stop();
  }
});

test('the wrong topic, a bad signature, and non-JSON are refused', async () => {
  const server = await startServer();
  try {
    const wrongTopic = await server.post(notification({ eventType: 'Delivery', mail: { messageId: 'known-1' } }, { TopicArn: TOPIC + '-other' }));
    assert.equal(wrongTopic.status, 403);

    const forged = { ...notification({ eventType: 'Delivery', mail: { messageId: 'known-1' } }), Signature: Buffer.from('nope').toString('base64') };
    assert.equal((await server.post(forged)).status, 403);

    const tampered = notification({ eventType: 'Delivery', mail: { messageId: 'known-1' } });
    tampered.Message = JSON.stringify({ eventType: 'Bounce', mail: { messageId: 'known-1' } });
    assert.equal((await server.post(tampered)).status, 403);

    const foreignCert = { ...notification({ eventType: 'Delivery', mail: { messageId: 'known-1' } }), SigningCertURL: 'https://evil.example/cert.pem' };
    assert.equal((await server.post(foreignCert)).status, 403);

    assert.equal((await server.post('not json')).status, 400);
    assert.equal(server.events.length, 0, 'nothing reached the store');
  } finally {
    await server.stop();
  }
});

test('a subscription confirmation is verified and then confirmed', async () => {
  const server = await startServer();
  try {
    const message = sign({
      Type: 'SubscriptionConfirmation', MessageId: 'sub-1', TopicArn: TOPIC, Token: 'tok',
      Message: 'You have chosen to subscribe…', Timestamp: new Date().toISOString(),
      SubscribeURL: 'https://sns.us-west-2.amazonaws.com/?Action=ConfirmSubscription&Token=tok'
    });
    const response = await server.post(message);
    assert.deepEqual(await response.json(), { ok: true, confirmed: true });
    assert.deepEqual(server.confirmed, ['https://sns.us-west-2.amazonaws.com/?Action=ConfirmSubscription&Token=tok']);

    const forged = { ...message, SubscribeURL: 'https://evil.example/steal' };
    assert.equal((await server.post(forged)).status, 403, 'a changed SubscribeURL breaks the signature');
    assert.equal(server.confirmed.length, 1);
  } finally {
    await server.stop();
  }
});

test('with no topic configured the endpoint does not exist', async () => {
  const server = await startServer({ topicArn: '' });
  try {
    assert.equal((await server.post(notification({ eventType: 'Delivery', mail: { messageId: 'known-1' } }))).status, 404);
  } finally {
    await server.stop();
  }
});

test('summarising picks the right timestamp and detail per event type', () => {
  assert.equal(summariseSesEvent({}), null);
  assert.equal(summariseSesEvent({ eventType: 'Delivery' }), null, 'no message id');
  const reject = summariseSesEvent({ eventType: 'Reject', mail: { messageId: 'm', timestamp: '2026-09-16T00:00:00.000Z' }, reject: { reason: 'Bad content' } });
  assert.deepEqual(reject, { messageId: 'm', kind: 'reject', at: '2026-09-16T00:00:00.000Z', detail: 'Bad content' });
  const complaint = summariseSesEvent({ eventType: 'Complaint', mail: { messageId: 'm' }, complaint: { timestamp: 't', complaintFeedbackType: 'abuse' } });
  assert.equal(complaint.detail, 'abuse');
});

test('the HTML part escapes, links, and keeps paragraphs', () => {
  const html = textToHtml('Line one <b>\n\nYour key: KEY-1\nBrief: https://www.buriedworlds.com/playtest/questionnaire.\n\nBye & thanks');
  assert.ok(html.includes('Line one &lt;b&gt;'));
  assert.ok(html.includes('<a href="https://www.buriedworlds.com/playtest/questionnaire">https://www.buriedworlds.com/playtest/questionnaire</a>.'), 'the trailing full stop stays outside the link');
  assert.ok(html.includes('Your key: KEY-1<br>Brief:'));
  assert.ok(html.includes('<p>Bye &amp; thanks</p>'));
  assert.equal((html.match(/<p>/g) || []).length, 3);
});
