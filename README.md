# Buried Worlds — Marketing Landing Page

A single-page marketing site for **Buried Worlds**, built from the design handoff in
`design_handoff/`. Promotes the upcoming **Buried Worlds VR** (Meta Quest, "coming soon")
and the live **Buried Worlds on Reddit** daily deduction game (primary CTA).

Vintage-expedition-brochure aesthetic: parchment, near-black ink, antique bronze, muted sage.

## Stack

- **Node.js** (ES modules, `"type": "module"`)
- **Express 5** — server + routing
- **Pug** — server-rendered views (mixins per section)

No client-side JavaScript, no forms, no cookies, no analytics. The site collects
nothing: community and launch news run through Discord, and every call to action
is a link out to Discord or Reddit.

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
  layout.pug            HTML shell, Google Fonts (optional pageTitle/pageDescription)
  index.pug             Composes the five sections
  privacy.pug           /privacy — long-form policy on parchment
  partials/
    hero.pug            Hero (poster default; split + banner reference variants)
    reddit.pug          "Play now on Reddit" dark olive band + detector card
    vr.pug              "The Prospector's Day" 5-step core loop
    destinations.pug    World cards (+ optional locked "more worlds coming" card)
    footer.pug          Wordmark, Discord CTA, link columns
public/css/styles.css   Token-based stylesheet (values transcribed from the handoff)
```

## Routes

| Path | What it does |
|---|---|
| `/` | The landing page |
| `/privacy` | Privacy policy, linked from the footer |
| `/discord` | 302 vanity redirect to the Discord invite |

## Design fidelity

Colors, typography, spacing, radii, and hover states are transcribed from
`design_handoff/DESIGN_SYSTEM.md` and `Buried Worlds Landing.dc.html`. Imagery is
placeholder (striped sage blocks / terrain gradients) pending real key art and terrain
screenshots — aspect ratios and radii are kept so real assets drop straight in.

## Configuration notes (TBD in the handoff)

Edit `data/content.mjs` → `links`:

- `redditGame` — the Reddit daily-dig post (Reddit-section CTA)
- `metaQuestStore` — Meta Quest store listing (**still a placeholder `#`**)
- `subreddit` — r/BuriedWorlds
- `discord` — the invite the footer, community section and `/discord` all use

`heroVariant` (`'poster' | 'split' | 'banner'`) and `showLockedCard` are also set there.

Destinations live in the `worlds` array. Kimberley is withheld from the current
release — it is left out of that array rather than deleted, and its images and
gradient are kept, so restoring it is a matter of putting the entry back and
updating the "five real places" copy in `destinations.pug` and the `loopSteps`
travel line.
