// Signed admin session cookies and CSRF tokens.
//
// Lifted out of tracking.mjs once a second private area (the playtest study)
// needed the same sign-in. One password, one cookie, one login page: the
// campaign dashboard owns /admin/login and every other admin router reads the
// session it issues.
//
// Nothing is stored server-side. The cookie is its own expiry plus an HMAC of
// that expiry, so a restart or a second replica keeps honouring a session
// without any shared state, and a forged one fails the signature.

import crypto from 'node:crypto';

export const SESSION_COOKIE = 'bw_admin';
export const SESSION_AGE_SECONDS = 8 * 60 * 60;

export function parseCookies(header = '') {
  const cookies = {};
  for (const part of header.split(';')) {
    const at = part.indexOf('=');
    if (at < 0) continue;
    cookies[part.slice(0, at).trim()] = decodeURIComponent(part.slice(at + 1).trim());
  }
  return cookies;
}

export function signature(secret, value) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

export function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function makeSession(secret, expiresAt) {
  const value = String(expiresAt);
  return `${value}.${signature(secret, `session:${value}`)}`;
}

export function readSession(req, secret, now) {
  const value = parseCookies(req.get('cookie'))[SESSION_COOKIE];
  if (!value) return null;
  const [expiresRaw, receivedSignature] = value.split('.');
  const expiresAt = Number(expiresRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now()) return null;
  if (!safeEqual(receivedSignature, signature(secret, `session:${expiresRaw}`))) return null;
  return expiresAt;
}

export function csrfToken(secret, expiresAt) {
  return signature(secret, `csrf:${expiresAt}`);
}
