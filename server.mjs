import 'dotenv/config';

import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  links,
  siteUrl,
  product,
  trailer,
  heroVariant,
  showLockedCard,
  loopSteps,
  worlds,
  signalRows
} from './data/content.mjs';
import {
  pressContact,
  descriptions,
  expeditions,
  loop,
  screenshots,
  art
} from './data/press.mjs';
import { assetVersion, createStaticMiddleware, stylesheetPath } from './assets.mjs';
import { study } from './data/playtest.mjs';
import { createDestinationsRouter } from './destinations.mjs';
import { createGuidesRouter } from './guides.mjs';
import { createFeedbackRouter } from './feedback.mjs';
import { createErrorHandler, notFoundHandler } from './errors.mjs';
import { createTrackingRouter, createTrackingStore } from './tracking.mjs';
import { createAdminRouter } from './admin.mjs';
import { createMailer } from './mailer.mjs';
import { createSesEventsRouter } from './ses-events.mjs';
import { createPlaytestRouter, createPlaytestStore } from './playtest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT ?? 3000;
app.disable('x-powered-by');

// Behind a reverse proxy (most hosts), req.ip is the proxy unless this is set — and
// the feedback rate limiter keys on it. Left off by default so a direct-to-node
// deployment cannot be fooled by a spoofed X-Forwarded-For.
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
}

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Shared by every view: the layout builds canonical urls and share cards from
// these, and the legal pages are rendered through the same layout as the
// landing page. Locals rather than per-route arguments so a new page cannot
// ship with no share card by forgetting to pass them.
app.locals.siteUrl = siteUrl;
app.locals.product = product;
app.locals.links = links;
app.locals.trailer = trailer;
// Meta Pixel id, or nothing. See views/layout.pug for where it renders.
app.locals.metaPixelId = (process.env.META_PIXEL_ID ?? '').replace(/\D/g, '');
app.locals.metaDomainVerification = (process.env.META_DOMAIN_VERIFICATION ?? '').replace(/[^A-Za-z0-9]/g, '');

// Campaign links are stored independently of the templates so their destination
// can change without a deploy. PostgreSQL tables and indexes are created at
// startup; Railway supplies DATABASE_URL from the attached Postgres service.
const trackingAllowedHosts = (process.env.TRACKING_ALLOWED_HOSTS ?? '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);
const trackingStore = await createTrackingStore({
  databaseUrl: process.env.DATABASE_URL ?? '',
  allowedHosts: trackingAllowedHosts,
  seedLinks: [{
    name: 'Meta Quest store',
    slug: 'meta-quest',
    destinationUrl: links.metaQuestStore,
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmContent: ''
  }]
});

// Paid playtest applications. Shares the database and the admin sign-in with
// campaign tracking, but keeps its own table: this is the only place on the site
// holding contact details, and folding it into anonymous click records would
// make both harder to reason about and to delete.
const playtestStore = await createPlaytestStore({
  databaseUrl: process.env.DATABASE_URL ?? ''
});

// Structured data for the landing page. Search and social crawlers read price,
// platform and publisher from here rather than inferring them from the copy.
const gameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: product.name,
  alternateName: product.storeListingName,
  url: siteUrl,
  image: `${siteUrl}/images/og-cover.jpg`,
  description:
    "A VR treasure-hunting game. Sweep a metal detector, dig, pan river gravel " +
    "and travel five real sites where real treasure was found.",
  applicationCategory: 'Game',
  operatingSystem: 'Meta Horizon OS',
  gamePlatform: product.devicesList,
  genre: product.genres,
  playMode: 'SinglePlayer',
  inLanguage: ['en', 'fr'],
  datePublished: product.releaseDate,
  softwareVersion: product.version,
  contentRating: `IARC ${product.ageRating}`,
  author: { '@type': 'Organization', name: product.developer },
  publisher: { '@type': 'Organization', name: product.publisher },
  offers: {
    '@type': 'Offer',
    price: product.priceAmount,
    priceCurrency: product.priceCurrency,
    availability: 'https://schema.org/InStock',
    url: links.metaQuestStore
  },
  trailer: {
    '@type': 'VideoObject',
    name: 'Buried Worlds VR — launch trailer',
    description:
      'Two minutes of the loop: sweeping the detector, digging, panning the ' +
      'river, and the five destinations the expedition travels between.',
    thumbnailUrl: `${siteUrl}${trailer.fullPoster}`,
    contentUrl: `${siteUrl}${trailer.full}`,
    // Search Console flags a bare date here as "missing a timezone". The game
    // shipped from Australia, so the trailer went up at midnight AEST.
    uploadDate: `${product.releaseDate}T00:00:00+10:00`,
    duration: 'PT1M59S'
  }
};

// Canonical host. The apex answers every page with a 200 of its own rather than
// pointing at www, so the two hostnames compete as separate sites in search.
// One permanent redirect gives the site a single address.
//
// Matched against the exact apex and nothing else on purpose: Railway's
// healthcheck, the *.railway.app domain and localhost all have to keep
// answering normally, and a blanket "not www" test would redirect them and
// break the deploy.
//
// /api is exempt because a headset already posting feedback to the apex would
// be handed a redirect on a POST, and clients are not reliable about replaying
// the body on a 301 — the request would be silently lost.
app.use((req, res, next) => {
  if (req.hostname === 'buriedworlds.com' && !req.path.startsWith('/api/')) {
    return res.redirect(301, `https://www.buriedworlds.com${req.originalUrl}`);
  }
  next();
});

// Static assets, cached for a year and marked immutable (assets.mjs). The
// stylesheet's URL carries a hash of its contents so a CSS deploy still
// reaches returning visitors; every other asset is content-addressed by
// filename, which README § Static assets explains.
const publicDir = path.join(__dirname, 'public');
app.locals.assetVersion = assetVersion(stylesheetPath(publicDir));
app.use(createStaticMiddleware(publicDir));

// Recruitment is open unless PLAYTEST_OPEN says otherwise — the same rule the
// playtest router applies, so the strip on the homepage and the form behind it
// can never disagree.
const playtestOpen = (process.env.PLAYTEST_OPEN ?? 'true').toLowerCase() !== 'false';

// Home — the landing page.
app.get('/', (req, res) => {
  res.render('index', {
    heroVariant,
    showLockedCard,
    loopSteps,
    worlds,
    signalRows,
    playtestOpen,
    study,
    pagePath: '/',
    // The hero poster is the largest paint on the homepage.
    preloadImage: trailer.poster,
    jsonLd: gameJsonLd
  });
});

// One page per destination, linked from the homepage cards (destinations.mjs).
app.use(createDestinationsRouter({ siteUrl, product }));

// The guide pages — each built to own one generic search the brand page never
// can, and to send its visitors on to the destinations (guides.mjs).
app.use(createGuidesRouter({ siteUrl, product }));

// Privacy policy — linked from the footer, and the URL the Meta store listing
// and Data Use Checkup point at.
app.get('/privacy', (req, res) => {
  res.render('privacy', {
    pagePath: '/privacy',
    pageTitle: 'Privacy — Buried Worlds VR',
    pageDescription:
      'How Buried Worlds VR handles your data: no accounts, no ads, and no analytics ' +
      'in the game. Your progress stays on your headset.'
  });
});

// Press kit. The download's size is read off disk rather than written into the
// copy, so re-zipping a new set of screenshots cannot leave the page quoting a
// figure that stopped being true.
const kitFile = 'buried-worlds-press-kit.zip';

function kitSize() {
  try {
    const bytes = fs.statSync(path.join(__dirname, 'public', 'press', kitFile)).size;
    return `${Math.round(bytes / 1024 / 1024)} MB`;
  } catch {
    return 'zip';
  }
}

app.get('/press', (req, res) => {
  res.render('press', {
    pagePath: '/press',
    pageTitle: 'Press kit — Buried Worlds VR',
    pageDescription:
      'Screenshots, key art, the trailer, fact sheet and descriptions for '
      + 'Buried Worlds VR, a VR treasure-hunting game on Meta Quest. Free to use '
      + 'in coverage.',
    kitFile,
    kitSize: kitSize(),
    pressContact,
    descriptions,
    expeditions,
    loop,
    screenshots,
    art
  });
});

app.get('/terms', (req, res) => {
  res.render('terms', {
    pagePath: '/terms',
    pageTitle: 'Terms of Service — Buried Worlds VR',
    pageDescription:
      'The terms covering the Buried Worlds VR game and website: licensing, ' +
      'a game still in development, your saves, and fair use.'
  });
});

// In-game feedback from the VR build. POST is open to the headset (optionally gated
// by FEEDBACK_APP_KEY); GET reads the log back and needs FEEDBACK_ADMIN_TOKEN.
app.use(
  '/api/feedback',
  createFeedbackRouter({
    dataDir: process.env.FEEDBACK_DIR ?? path.join(__dirname, 'data', 'feedback'),
    appKey: process.env.FEEDBACK_APP_KEY ?? '',
    adminToken: process.env.FEEDBACK_ADMIN_TOKEN ?? '',
    discordWebhook: process.env.FEEDBACK_DISCORD_WEBHOOK ?? ''
  })
);

// The paid playtest study: /playtest and its dashboard. Mounted before the
// tracking router so /admin/playtest is owned outright by this router and its
// own session guard, rather than falling through the campaign dashboard's.
// A note to the developer when an application arrives. PLAYTEST_NOTIFY_TO
// names the recipient; SES_REGION + MAIL_FROM (with AWS keys in the
// environment) or SMTP_URL names the way out. Anything missing, and the
// dashboard is the only place applications show up — which is how the site
// ran before this existed.
const playtestMailer = createMailer({
  sesRegion: process.env.SES_REGION ?? '',
  mailFrom: process.env.MAIL_FROM ?? '',
  // Sending under a configuration set is what makes SES report each email's
  // fate to the SNS topic below. Unset, mail still goes; nothing comes back.
  configurationSet: process.env.SES_CONFIGURATION_SET ?? '',
  smtpUrl: process.env.SMTP_URL ?? '',
  smtpFrom: process.env.SMTP_FROM ?? ''
});
const playtestNotify = playtestMailer && process.env.PLAYTEST_NOTIFY_TO
  ? { to: process.env.PLAYTEST_NOTIFY_TO, sendQuietly: (message) => playtestMailer.sendQuietly(message) }
  : null;

// The admin home page, where the password lands you. Mounted before the two
// dashboards it links to, so /admin is its own page rather than a redirect.
app.use(createAdminRouter({
  trackingStore,
  playtestStore,
  adminPassword: process.env.ADMIN_PASSWORD ?? '',
  sessionSecret: process.env.ADMIN_SESSION_SECRET ?? ''
}));

app.use(createPlaytestRouter({
  store: playtestStore,
  siteUrl,
  notify: playtestNotify,
  trackingConfigured: Boolean(process.env.SES_CONFIGURATION_SET && process.env.SES_EVENTS_TOPIC_ARN),
  // Recruitment opens and closes between waves. Anything but an explicit
  // "false" leaves the form open, so a missing variable never silently turns
  // away applicants a live recruitment post is still sending here.
  applicationsOpen: playtestOpen,
  formSecret: process.env.PLAYTEST_FORM_SECRET ?? process.env.ADMIN_SESSION_SECRET ?? '',
  adminPassword: process.env.ADMIN_PASSWORD ?? '',
  sessionSecret: process.env.ADMIN_SESSION_SECRET ?? ''
}));

// Delivery events for the study's email, pushed here by SNS. Signature-checked
// against Amazon's certificate and matched only to message ids the site sent.
app.use(createSesEventsRouter({
  topicArn: process.env.SES_EVENTS_TOPIC_ARN ?? '',
  onEvent: (messageId, event) => playtestStore.recordEmailEvent(messageId, event)
}));

// First-party campaign redirects and the private management dashboard. This is
// mounted before the hand-written vanity redirects so /go/:slug always owns its
// namespace and can safely grow without colliding with a marketing page.
app.use(createTrackingRouter({
  store: trackingStore,
  siteUrl,
  adminPassword: process.env.ADMIN_PASSWORD ?? '',
  sessionSecret: process.env.ADMIN_SESSION_SECRET ?? ''
}));

// Vanity redirect — /discord is the short link to hand out anywhere. Kept as a
// 302 so the destination invite can be swapped without clients caching the old one.
app.get('/discord', (req, res) => {
  res.redirect(302, links.discord);
});

// These must stay last: the first handles any path no feature claimed, and the
// four-argument handler catches failures passed through by Express 5 async routes.
app.use(notFoundHandler);
app.use(createErrorHandler());

const server = app.listen(PORT, () => {
  console.log(`Buried Worlds site running at http://localhost:${PORT}`);
});

// Railway replaces a deployment by sending the old container SIGTERM. Without
// a handler Node dies by the signal, its parent reports a failure, and Railway
// emails that the deployment "crashed" — about the one that was meant to stop.
// So: finish in-flight requests, close the database pools, exit 0. If anything
// hangs, ten seconds is long enough; after that, exit anyway rather than let
// the platform kill the process and call it a crash after all.
let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down`);
  const deadline = setTimeout(() => process.exit(0), 10_000);
  deadline.unref();
  server.close(async () => {
    try {
      await Promise.allSettled([trackingStore.close(), playtestStore.close()]);
    } finally {
      process.exit(0);
    }
  });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
