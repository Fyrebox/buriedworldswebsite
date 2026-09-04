# Buried Worlds — Marketing Landing Page

A single-page marketing site for **Buried Worlds**, built from the design handoff in
`design_handoff/`. Sells **Buried Worlds VR**, live in Early Access on the Meta Horizon
Store since 26 August 2026 (primary CTA), and carries the free **Buried Worlds on
Reddit** daily deduction game below it as a companion.

Before launch the Reddit band was the primary call to action and the hero said "coming
soon" — the right shape for a page with nothing to sell, and the wrong one now.

Vintage-expedition-brochure aesthetic: parchment, near-black ink, antique bronze, muted sage.

## Naming

The site says **Buried Worlds VR** everywhere — page titles, the `h1`, the footer
wordmark, the buy bar, the legal pages and the press kit. The bare name collides with
an existing television series in search results, so the longer string is the one being
built up.

Two places deliberately keep the short name, and a find-and-replace will break both:

- **`views/partials/reddit.pug`** — "Buried Worlds on Reddit" is the free browser
  deduction game. It is not VR, and calling it that misleads anyone who clicks.
- **The store title.** Meta lists the game as *Buried Worlds*. `data/content.mjs`
  keeps it as `product.storeListingName`, the press kit fact sheet shows it in its own
  row, and the landing page's structured data carries it as `alternateName` — which is
  the schema.org field for exactly this, so search engines treat the two as one entity
  rather than two different games.

The wordmark artwork in `public/press/art/` and on the share card reads "BURIED
WORLDS" with no "VR", which is why the `og:image:alt` describes it as "the game's
logo" rather than naming it.

## Stack

- **Node.js** (ES modules, `"type": "module"`)
- **Express 5** — server + routing
- **Pug** — server-rendered views (mixins per section)

No forms, no sign-up, no mailing list — community and launch news run through
Discord, and every call to action is a link out to Discord or Reddit. Two things
qualify that: Google Analytics (GA4, property `G-PVF7WKPPFD`, loaded in
`views/layout.pug`) counts visits and sets cookies, and `/api/feedback` receives
player feedback from the VR build (see below).

Both are covered by `/privacy` — **keep that page in step with anything you add
here**, since the policy commits to being updated before a change ships, not after.

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
| `/press` | Press kit — fact sheet, descriptions, screenshots, art, trailer |
| `/privacy` | Privacy policy, linked from the footer |
| `/terms` | Terms of service, linked from the footer |
| `/discord` | 302 vanity redirect to the Discord invite |
| `/go/:slug` | Track a campaign click and 302 to its current destination |
| `/admin/links` | Private campaign-link dashboard |
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

## Campaign links

The private dashboard at `/admin/links` creates first-party short links such as
`/go/meta-quest`. A public visit is written to PostgreSQL and immediately sent to the
current destination with a 302. The record contains the time, referring host, a
coarse device category, placement and campaign fields. It deliberately contains no
IP address, full user agent, cookie or fingerprint. Known bots and link previews are
kept separate from the human total.

Each link's analytics page also provides a print-ready QR code. The SVG download is
preferred for flyers and professional printing; a 2048 px PNG is available for tools
that do not accept SVG. QR codes encode `/go/:slug?placement=qr`, so scans appear in
the placement breakdown without creating a separate campaign system. Short names are
locked after creation because changing one would break every printed copy; destination
URLs and campaign attribution can still be updated at any time.

The analytics page can reset a link's click history. This permanently clears both
recent click records and archived lifetime totals, but does not alter or pause the
short link or its QR code.

Copy `.env.example` to `.env` for local work. The repository already includes a
gitignored `.env` shell with blank secrets. Configure:

| Variable | Effect |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string; on Railway reference the Postgres service variable |
| `ADMIN_PASSWORD` | Password for `/admin/login`; blank disables every admin route |
| `ADMIN_SESSION_SECRET` | At least 32 unpredictable characters used to sign eight-hour admin sessions |
| `TRACKING_ALLOWED_HOSTS` | Optional comma-separated HTTPS destination allowlist |

The tables and indexes are created automatically at startup. On Railway, add a
PostgreSQL database service and set the website service's `DATABASE_URL` to
`${{Postgres.DATABASE_URL}}` (adjust `Postgres` if you gave the service another name).
Keep the database private and enable Railway backups. The website can safely use
multiple replicas because campaign storage is no longer tied to one application disk.

The built-in `meta-quest` record is seeded once from `data/content.mjs`. Website store
buttons use it with a `placement` parameter while structured data retains Meta's direct
URL. Editing the record in Admin therefore changes the buttons without changing search
metadata or requiring a deploy.

## Design fidelity

Colors, typography, spacing, radii, and hover states are transcribed from
`design_handoff/DESIGN_SYSTEM.md` and `Buried Worlds Landing.dc.html`. Imagery is
placeholder (striped sage blocks / terrain gradients) pending real key art and terrain
screenshots — aspect ratios and radii are kept so real assets drop straight in.

## Configuration

Edit `data/content.mjs` → `links`:

- `redditGame` — the Reddit daily-dig post (Reddit-section CTA)
- `metaQuestStore` — the store listing. Kept **locale-free** on purpose: Meta redirects
  each visitor to their own region and currency, so pinning `/en-gb/` or `/en-us/` would
  show everyone else the wrong price
- `subreddit` — r/BuriedWorlds
- `discord` — the invite the footer, community section and `/discord` all use

`data/content.mjs` → `product` holds the store facts — price, devices, release date,
version, languages, rating. They are read off the live product detail page and the
developer dashboard, and they feed the hero, the sticky buy bar, the share card and the
`VideoGame` structured data at once. **Change them here, nowhere else.** `price` carries
its currency because Meta localises the real figure per region.

`heroVariant` (`'poster' | 'split' | 'banner'`) and `showLockedCard` are also set there.
`showLockedCard` is on since launch: Kimberley is finished and held back as the first
post-launch destination, so the locked card states a fact rather than a hope.

## Launch surfaces

| What | Where | Why it matters |
|---|---|---|
| Share card | `views/layout.pug` + `public/images/og-cover.jpg` (1200×630) | Every link posted to Reddit, Discord, X or an email renders from these. Without them the site shares as a bare grey url |
| Structured data | `gameJsonLd` in `server.mjs` | Crawlers read price, platform and publisher from here rather than inferring them from the copy |
| Sticky buy bar | `views/partials/buybar.pug` | Revealed once the hero CTA scrolls away, hidden again when it returns. Hidden by default and shown by script, so with JavaScript off it never appears rather than permanently covering the footer |
| Store click tracking | `data-cta` attributes + the listener at the foot of `views/layout.pug` | The site cannot see installs, so views-into-store-clicks is the only conversion number it has. GA4 sends via `sendBeacon`, which survives the navigation away |
| Early Access statement | `views/partials/earlyaccess.pug` | Meta's own guidance asks for this on the listing; the same reasoning applies to the page that sends people there. Every claim in it is true on launch day — nothing about future pricing, nothing promised on a date |
| `robots.txt`, `sitemap.xml` | `public/` | Served straight off `express.static` |
| Trailer | `views/partials/trailer.pug`, `public/video/` | Self-hosted, not YouTube — a normal YouTube embed sets cookies the policy would have to cover. The hero plays a muted 7s loop (~630 KB); the full 2:00 trailer is 14 MB and only downloads on click |

### Video

Encoded from `~/Documents/BuriedWorldsTrailer/Trailer_v2_30fps.mp4`, all 720p H.264
with `+faststart`:

| File | What | Size |
|---|---|---|
| `hero-loop-detector.mp4` | The detector sweep — the game's core verb. **Shipped** | 630 KB |
| `hero-loop-well.mp4` | Magnet fishing a well under Carcassonne | 710 KB |
| `hero-loop-ruins.mp4` | The camera crossing the ruins at Bolonia | 640 KB |
| `buried-worlds-trailer-720p.mp4` | The full trailer, click-to-play | 14 MB |

Swap the hero's mood by pointing `trailer.loop` in `data/content.mjs` at a different
one. The 1080p master stays out of this repo — it is what press and YouTube should get.

Two things keep the page light despite all that: the full trailer is `preload="none"`,
and the modal's poster lives in `data-poster` and is promoted to `poster` on first open.
A `poster` named in the markup is fetched **eagerly even under `preload="none"`**, which
billed every visitor 166 KB for an image most never saw. Measured page weight on first
load is ~1 MB, and the 14 MB file is not among it.

**Note:** `public/video/` puts 16 MB of binaries in git. Fine at this size; if more
trailers arrive, move them to object storage rather than growing the repo.

## Press kit

Copy lives in `data/press.mjs`, assets in `public/press/`. The page is `/press`.

The historical detail in `data/press.mjs` is checked against the game's design docs
and the store listing rather than recalled — a press kit is the document an outlet
quotes without re-checking, and getting Hoxne wrong in front of the British Museum
ends that conversation on contact. The long description is the store listing's text
word for word, so every outlet quotes the same paragraphs the store page does.

Screenshots are extracted from the 33 Mbps trailer master, not the compressed web
copy, at 1920×1080. **Check any new frame for burned-in trailer captions** — two of
the first eight carried "STAKE A CLAIM. BLAST IT OPEN." and "THE WELLS KEPT
EVERYTHING", which an outlet would have printed as supplied.

Rebuild the download after changing anything under `public/press/`:

```bash
cd public/press && zip -q -r buried-worlds-press-kit.zip screenshots art KIT-README.txt -x ".*" -x "__MACOSX/*"
```

The page reads the zip's size off disk at request time, so it cannot end up quoting
a stale figure.

**`express.static` runs with `redirect: false`.** `public/press/` is a directory and
`/press` is a route; with the default on, static answers `/press` with a 301 to
`/press/` before the route is reached and the page is unreachable.

**Gap:** there is no Hoxne screenshot, because the final trailer cut contains no
Hoxne footage — the shot list planned it and it did not survive. Hoxne is the
strongest press hook there is (the lost hammer, the British Museum, the archaeology
angle), so it wants a fresh capture via MQDH.

Destinations live in the `worlds` array. Kimberley is withheld from the current
release — it is left out of that array rather than deleted, and its images and
gradient are kept, so restoring it is a matter of putting the entry back and
updating the "five real places" copy in `destinations.pug` and the `loopSteps`
travel line.
