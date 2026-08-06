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
nothing from web visitors: community and launch news run through Discord, and every
call to action is a link out to Discord or Reddit. It does host one API route —
`/api/feedback`, which the VR build posts player feedback to (see below).

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
  terms.pug             /terms — same treatment
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
| `/terms` | Terms of service, linked from the footer |
| `/discord` | 302 vanity redirect to the Discord invite |
| `POST /api/feedback` | In-game feedback intake from the VR build |
| `GET /api/feedback` | Read the feedback log back (token-gated) |

## Feedback intake

The VR build's settings menu has a **Send Feedback** panel: a 1–5 rating plus tapped
multiple-choice answers, with a build/device context block attached automatically. It
posts JSON to `POST /api/feedback` (`feedback.mjs`).

Submissions append to `data/feedback/YYYY-MM.jsonl` (gitignored). The client's IP is
used for rate limiting **in memory only** and is never written to disk or forwarded —
the only identifier stored is the game's own random install id, which maps to no
account, person or device serial. See `/privacy` § *Feedback you send us*.

Configure with environment variables — all optional, all off by default:

| Variable | Effect |
|---|---|
| `FEEDBACK_DIR` | Where the JSONL logs go (default `./data/feedback`) |
| `FEEDBACK_APP_KEY` | If set, submissions must carry a matching `X-App-Key` header |
| `FEEDBACK_ADMIN_TOKEN` | If set, enables `GET /api/feedback`; unset ⇒ that route 404s |
| `FEEDBACK_DISCORD_WEBHOOK` | If set, each submission is echoed to that Discord webhook |
| `TRUST_PROXY` | Set when running behind a reverse proxy, so rate limiting sees the real IP |

Read the last 50 submissions:

```bash
curl -H "Authorization: Bearer $FEEDBACK_ADMIN_TOKEN" https://<host>/api/feedback
```

Limits: 32 KB bodies, 5 submissions per install id per hour, 60 per IP per hour, notes
capped at 2000 characters. Rejected submissions stay queued on the headset and retry
later, so a deploy or an outage loses nothing.

**Deployment note:** the JSONL log lives on the filesystem, so on a host with an
ephemeral disk (Render, Heroku, Fly without a volume) it is wiped on redeploy. Either
attach a persistent volume and point `FEEDBACK_DIR` at it, or rely on
`FEEDBACK_DISCORD_WEBHOOK` as the durable copy.

```bash
npm test        # node's built-in runner — validation, rate limiting, storage, auth
```

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
