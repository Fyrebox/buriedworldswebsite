// Static asset serving and cache lifetimes.
//
// express.static sends no max-age by default, so Cloudflare applied its own
// four-hour default to everything under /public and every returning visitor
// re-fetched the hero video. Assets are now marked immutable for a year, on
// one condition that makes that safe: a changed asset gets a changed URL.
//
//   - The stylesheet is referenced as /css/styles.css?v=<hash of its bytes>,
//     computed once at startup. A deploy that touches the CSS changes the URL;
//     one that does not leaves the year-long cache alone.
//   - Images and video are content-addressed by convention: a replacement
//     gets a new filename (hero-poster-2.webp, not hero-poster.jpg again).
//     README § Static assets says so; a same-name replacement would be
//     served stale for a year to anyone who has visited before.
//   - The exceptions are the files that change in place by design and are
//     fetched by robots rather than browsers: sitemap.xml, robots.txt, and
//     the press kit zip, which is rebuilt under the same name. Those get an
//     hour.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import express from 'express';

const YEAR_SECONDS = 365 * 24 * 60 * 60;
const HOUR_SECONDS = 60 * 60;

/** Files that are replaced in place and must not be held for a year. */
export const SHORT_LIVED = /\.(xml|txt|zip)$/i;

export function cacheControlFor(filePath) {
  return SHORT_LIVED.test(filePath)
    ? `public, max-age=${HOUR_SECONDS}`
    : `public, max-age=${YEAR_SECONDS}, immutable`;
}

/**
 * The stylesheet's cache-busting version: the first ten hex characters of a
 * SHA-256 over its bytes. Read once, at startup — the file does not change
 * between deploys, and a deploy restarts the process.
 */
export function assetVersion(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').slice(0, 10);
}

export function createStaticMiddleware(publicDir) {
  return express.static(publicDir, {
    // public/press/ is a directory AND /press is a route: with the directory
    // redirect on, static would answer /press with a 301 to /press/ before the
    // route was reached and the press kit page would be unreachable.
    redirect: false,
    maxAge: YEAR_SECONDS * 1000,
    immutable: true,
    // serve-static asks for headers before it applies its own Cache-Control
    // and leaves an existing one alone, so this is where the exceptions go.
    setHeaders(res, filePath) {
      if (SHORT_LIVED.test(filePath)) res.set('Cache-Control', cacheControlFor(filePath));
    }
  });
}

export function stylesheetPath(publicDir) {
  return path.join(publicDir, 'css', 'styles.css');
}
