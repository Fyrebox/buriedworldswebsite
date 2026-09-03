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
import { createFeedbackRouter } from './feedback.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT ?? 3000;

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
    uploadDate: product.releaseDate,
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

// Static assets (CSS, client JS, future key art).
// redirect:false because public/press/ is a directory AND /press is a route.
// Left on, static answers /press with a 301 to /press/ before the route is ever
// reached, and the press kit page becomes unreachable. Files beneath it still
// serve normally; only the directory redirect is given up, which nothing wants.
app.use(express.static(path.join(__dirname, 'public'), { redirect: false }));

// Home — the landing page.
app.get('/', (req, res) => {
  res.render('index', {
    heroVariant,
    showLockedCard,
    loopSteps,
    worlds,
    signalRows,
    pagePath: '/',
    jsonLd: gameJsonLd
  });
});

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

// Vanity redirect — /discord is the short link to hand out anywhere. Kept as a
// 302 so the destination invite can be swapped without clients caching the old one.
app.get('/discord', (req, res) => {
  res.redirect(302, links.discord);
});

app.listen(PORT, () => {
  console.log(`Buried Worlds site running at http://localhost:${PORT}`);
});
