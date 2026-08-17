import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  links,
  heroVariant,
  showLockedCard,
  loopSteps,
  worlds,
  signalRows
} from './data/content.mjs';
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

// Static assets (CSS, client JS, future key art).
app.use(express.static(path.join(__dirname, 'public')));

// Home — the landing page.
app.get('/', (req, res) => {
  res.render('index', {
    links,
    heroVariant,
    showLockedCard,
    loopSteps,
    worlds,
    signalRows
  });
});

// Privacy policy — linked from the footer, and the URL the Meta store listing
// and Data Use Checkup point at.
app.get('/privacy', (req, res) => {
  res.render('privacy', {
    links,
    pageTitle: 'Privacy — Buried Worlds',
    pageDescription:
      'How Buried Worlds handles your data: no accounts, no ads, and no analytics ' +
      'in the game. Your progress stays on your headset.'
  });
});

app.get('/terms', (req, res) => {
  res.render('terms', {
    links,
    pageTitle: 'Terms of Service — Buried Worlds',
    pageDescription:
      'The terms covering the Buried Worlds game and website: licensing, ' +
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
