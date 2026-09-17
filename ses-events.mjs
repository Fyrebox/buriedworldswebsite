// Delivery events for the email the site sends, pushed by Amazon SNS.
//
// SES writes each email's fate — accepted by the recipient's server, bounced,
// marked as spam, a tracked link clicked — to an SNS topic, and SNS POSTs each
// one here. Every message is checked before it is believed: the topic must be
// the one we configured, and the signature must verify against Amazon's
// certificate, fetched from an amazonaws.com host and nowhere else. A forged
// POST therefore cannot mark an invitation as delivered, or as bounced.
//
// Only SES message ids the site itself recorded when sending are ever matched;
// an event for anything else is acknowledged and dropped. Opens are recorded
// too, and labelled unreliable wherever they are shown: Apple Mail loads the
// pixel for every message whether or not anyone reads it.

import crypto from 'node:crypto';

import express from 'express';

const SIGNING_FIELDS = {
  Notification: ['Message', 'MessageId', 'Subject', 'Timestamp', 'TopicArn', 'Type'],
  SubscriptionConfirmation: ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'],
  UnsubscribeConfirmation: ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type']
};

/** The string SNS signed: "Name\nValue\n" for each present field, in this order. */
export function canonicalString(message) {
  const fields = SIGNING_FIELDS[message.Type];
  if (!fields) return null;
  let out = '';
  for (const field of fields) {
    if (message[field] === undefined || message[field] === null) continue;
    out += `${field}\n${message[field]}\n`;
  }
  return out;
}

/** Amazon's signing certificates live only here. Anything else is refused unread. */
export function isAmazonCertUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && /^sns\.[a-z0-9-]+\.amazonaws\.com$/.test(url.hostname) && url.pathname.endsWith('.pem');
  } catch {
    return false;
  }
}

export function verifySignature(message, certificatePem) {
  const canonical = canonicalString(message);
  if (!canonical || !message.Signature) return false;
  const algorithm = message.SignatureVersion === '2' ? 'RSA-SHA256' : 'RSA-SHA1';
  try {
    return crypto.verify(algorithm, Buffer.from(canonical, 'utf8'), certificatePem, Buffer.from(message.Signature, 'base64'));
  } catch {
    return false;
  }
}

/**
 * Reduce one SES event to what the dashboard shows. Returns null for event
 * types the site does not record.
 */
export function summariseSesEvent(event) {
  const messageId = event?.mail?.messageId;
  const type = event?.eventType;
  if (!messageId || !type) return null;
  const at = (
    event.delivery?.timestamp ?? event.bounce?.timestamp ?? event.complaint?.timestamp
    ?? event.click?.timestamp ?? event.reject?.timestamp ?? event.mail?.timestamp ?? new Date().toISOString()
  );
  switch (type) {
    case 'Send': return { messageId, kind: 'send', at, detail: '' };
    case 'Delivery': return { messageId, kind: 'delivery', at, detail: '' };
    case 'Bounce': return {
      messageId, kind: 'bounce', at,
      detail: [event.bounce?.bounceType, event.bounce?.bounceSubType, event.bounce?.bouncedRecipients?.[0]?.diagnosticCode]
        .filter(Boolean).join(' · ').slice(0, 300)
    };
    case 'Complaint': return { messageId, kind: 'complaint', at, detail: String(event.complaint?.complaintFeedbackType ?? '').slice(0, 100) };
    case 'Click': return { messageId, kind: 'click', at, detail: String(event.click?.link ?? '').slice(0, 300) };
    case 'Open': return { messageId, kind: 'open', at: event.open?.timestamp ?? at, detail: String(event.open?.userAgent ?? '').slice(0, 120) };
    case 'Reject': return { messageId, kind: 'reject', at, detail: String(event.reject?.reason ?? '').slice(0, 300) };
    case 'RenderingFailure': return { messageId, kind: 'reject', at, detail: String(event.failure?.errorMessage ?? 'rendering failure').slice(0, 300) };
    default: return null;
  }
}

/**
 * @param {object} options
 * @param {string} options.topicArn        The only topic whose messages are accepted.
 * @param {(messageId: string, event: object) => Promise<boolean>} options.onEvent
 * @param {(url: string) => Promise<string>} [options.fetchCertificate]  Injected in tests.
 * @param {(url: string) => Promise<void>} [options.confirmSubscription] Injected in tests.
 */
export function createSesEventsRouter({
  topicArn = '',
  onEvent,
  fetchCertificate = defaultFetchCertificate,
  confirmSubscription = defaultConfirmSubscription,
  onError = (error) => console.error('[ses-events]', error)
}) {
  if (typeof onEvent !== 'function') throw new Error('createSesEventsRouter requires onEvent');
  const router = express.Router();
  const certificates = new Map();

  async function certificateFor(url) {
    if (!isAmazonCertUrl(url)) return null;
    if (!certificates.has(url)) certificates.set(url, await fetchCertificate(url));
    return certificates.get(url);
  }

  // SNS posts JSON with Content-Type text/plain, so parse the raw body ourselves.
  router.post('/api/ses-events', express.text({ type: '*/*', limit: '256kb' }), async (req, res) => {
    // Unconfigured: acknowledge nothing, so SNS retries never pile up and no
    // one can subscribe the endpoint to a topic of their own.
    if (!topicArn) return res.status(404).json({ ok: false });

    let message;
    try {
      message = JSON.parse(typeof req.body === 'string' ? req.body : '');
    } catch {
      return res.status(400).json({ ok: false, error: 'not JSON' });
    }
    if (!message || typeof message !== 'object') return res.status(400).json({ ok: false, error: 'not an SNS message' });
    if (message.TopicArn !== topicArn) return res.status(403).json({ ok: false, error: 'wrong topic' });

    let certificate;
    try {
      certificate = await certificateFor(message.SigningCertURL);
    } catch (error) {
      onError(error);
      return res.status(503).json({ ok: false, error: 'certificate unavailable' });
    }
    if (!certificate || !verifySignature(message, certificate)) {
      return res.status(403).json({ ok: false, error: 'bad signature' });
    }

    if (message.Type === 'SubscriptionConfirmation') {
      try {
        await confirmSubscription(message.SubscribeURL);
      } catch (error) {
        onError(error);
        return res.status(503).json({ ok: false, error: 'could not confirm' });
      }
      return res.json({ ok: true, confirmed: true });
    }

    if (message.Type !== 'Notification') return res.json({ ok: true, ignored: message.Type });

    let event;
    try {
      event = JSON.parse(message.Message);
    } catch {
      return res.json({ ok: true, ignored: 'unparseable' });
    }
    const summary = summariseSesEvent(event);
    if (!summary) return res.json({ ok: true, ignored: event?.eventType ?? 'unknown' });
    try {
      const matched = await onEvent(summary.messageId, summary);
      return res.json({ ok: true, matched: Boolean(matched) });
    } catch (error) {
      onError(error);
      // 500 makes SNS retry, which is what we want for a database hiccup.
      return res.status(500).json({ ok: false });
    }
  });

  return router;
}

async function defaultFetchCertificate(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`certificate fetch failed: ${response.status}`);
  return response.text();
}

async function defaultConfirmSubscription(url) {
  const target = new URL(url);
  if (target.protocol !== 'https:' || !/^sns\.[a-z0-9-]+\.amazonaws\.com$/.test(target.hostname)) {
    throw new Error('SubscribeURL is not an SNS endpoint');
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`subscription confirmation failed: ${response.status}`);
}
