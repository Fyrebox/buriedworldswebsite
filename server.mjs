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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT ?? 3000;

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
      'How Buried Worlds handles your data: no accounts, no analytics, no tracking. ' +
      'Your progress stays on your headset.'
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

// Vanity redirect — /discord is the short link to hand out anywhere. Kept as a
// 302 so the destination invite can be swapped without clients caching the old one.
app.get('/discord', (req, res) => {
  res.redirect(302, links.discord);
});

app.listen(PORT, () => {
  console.log(`Buried Worlds site running at http://localhost:${PORT}`);
});
