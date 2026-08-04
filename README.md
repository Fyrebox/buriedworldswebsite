# Buried Worlds — Marketing Landing Page

A single-page marketing site for **Buried Worlds**, built from the design handoff in
`design_handoff/`. Promotes the upcoming **Buried Worlds VR** (Meta Quest, "coming soon")
and the live **Buried Worlds on Reddit** daily deduction game (primary CTA).

Vintage-expedition-brochure aesthetic: parchment, near-black ink, antique bronze, muted sage.

## Stack

- **Node.js** (ES modules, `"type": "module"`)
- **Express 5** — server + routing
- **Pug** — server-rendered views (mixins per section)
- **htmx** — progressive enhancement for the newsletter form (button swaps to "Noted ✓" without a full page reload; still works without JS via a normal POST + redirect)

## Run

```bash
npm install
npm start        # http://localhost:3000
npm run dev      # same, with --watch auto-restart
```

Set `PORT` to override the default (`PORT=4000 npm start`).

## Structure

```
server.mjs              Express 5 app: routes + view config
data/content.mjs        All page copy + per-world gradients (single source of truth)
views/
  layout.pug            HTML shell, Google Fonts, htmx
  index.pug             Composes the five sections
  partials/
    hero.pug            Hero (poster default; split + banner reference variants)
    reddit.pug          "Play now on Reddit" dark olive band + detector card
    vr.pug              "The Prospector's Day" 5-step core loop
    destinations.pug    Six world cards + locked "more worlds coming" card
    footer.pug          Wordmark, newsletter form, link columns
    notifyButton.pug    Newsletter button mixin (initial / done / error states)
    notifyResponse.pug  Standalone htmx response wrapper
public/css/styles.css   Token-based stylesheet (values transcribed from the handoff)
```

## Design fidelity

Colors, typography, spacing, radii, and hover states are transcribed from
`design_handoff/DESIGN_SYSTEM.md` and `Buried Worlds Landing.dc.html`. Imagery is
placeholder (striped sage blocks / terrain gradients) pending real key art and terrain
screenshots — aspect ratios and radii are kept so real assets drop straight in.

## Configuration notes (TBD in the handoff)

Edit `data/content.mjs` → `links`:

- `redditGame` — the Reddit daily-dig URL (hero + Reddit-section CTA)
- `metaQuestStore` — Meta Quest store listing
- `subreddit` — r/BuriedWorlds

`heroVariant` (`'poster' | 'split' | 'banner'`) and `showLockedCard` are also set there.

The `POST /notify` handler validates the email and returns the confirmation button, but does
**not** yet persist it — wire it to the mailing-list backend where the `// TODO` marks in
`server.mjs`.
