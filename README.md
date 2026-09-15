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

No mailing list and no accounts — community and launch news run through Discord,
and every call to action on the landing page is a link out to Discord or Reddit.
Three things qualify that: Google Analytics (GA4, property `G-PVF7WKPPFD`, loaded
in `views/layout.pug`) counts visits and sets cookies, `/api/feedback` receives
player feedback from the VR build, and `/playtest` takes applications for the
paid playtest study (both below).

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
data/destinations.mjs   The five destination pages — copy, facts, images, the Ballarat teaser
data/pages.mjs          The eight guide pages — sections, FAQ entries, the updates log
views/
  layout.pug            HTML shell, Google Fonts (optional pageTitle/pageDescription)
  index.pug             Composes the five sections
  destination.pug       /destinations/:slug — one world, its expedition, its real history
  guide.pug             The guide pages — sections, FAQ, updates, from data/pages.mjs
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
| `/destinations/:slug` | One page per destination — ballarat, coloma, carcassonne, hoxne, bolonia |
| `/vr-metal-detecting-game`, `/gold-panning-vr`, `/seated-vr`, `/hoxne-hoard` | Guide pages, each built to own one generic search |
| `/how-to-play`, `/faq`, `/about`, `/updates` | Guide pages — structure, trust, and the changelog |
| `/press` | Press kit — fact sheet, descriptions, screenshots, art, trailer |
| `/privacy` | Privacy policy, linked from the footer |
| `/terms` | Terms of service, linked from the footer |
| `/discord` | 302 vanity redirect to the Discord invite |
| `/playtest` | Paid playtest recruitment page and application form |
| `/go/:slug` | Track a campaign click and 302 to its current destination |
| `/admin/links` | Private campaign-link dashboard |
| `/admin/playtest` | Private playtest application dashboard |
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

## Playtest recruitment

`/playtest` is the page a paid-playtest recruitment post links to: US$10 for 25
minutes, five places, with the fee, the payment conditions and the privacy note
all stated in full before the first form field. `data/playtest.mjs` holds every
one of those numbers and promises — **change them there, nowhere else**, and bump
`termsVersion` when the deal changes, because the version on screen when somebody
applied is stored on their row and is the deal they are owed.

Applications go to a `playtest_applications` table (`playtest-store.mjs`), created
at startup like the campaign tables. It is the only place on the site holding
contact details, so it holds nothing that was not typed into the form: no IP
address, no cookie, no user agent, nothing derived.

### Keys and the three emails

Selection is two clicks per tester. Generate store keys in the Meta developer dashboard
(Distribution → Keys → Generate) and paste them into the box on `/admin/playtest`.
Then, on an application:

- **Invited** takes the oldest unused key, records which key went to whom, and emails
  the applicant: the key, how to redeem it in the Meta Horizon app, the brief link, and
  their 72 hours. With no keys left it refuses and changes nothing — a "you're in" with
  no key in it would be worse than silence.
- **Declined** emails "not this round". **Paid** emails "payment sent".
- Everything else only records. Saving a note without changing status sends nothing;
  walking an application back and re-inviting reuses the key it already holds.

The exact text of all three is shown on the detail page before you click. An emailed key
is spent for good — deleting the application unlinks it but keeps it counted, so it can
never be offered twice. Keys unlock the **store build**; if a later wave needs an
unreleased fix, that is a release-channel invite from the Meta dashboard again.

### Verifying a tester really has a Quest

There is no way to look up a Meta account from an email address or a username.
Meta publishes no account-lookup or profile-existence API, Horizon profiles have
no public web URL to check (meta.com refuses scripted requests outright — every
URL shape returns HTTP 400 to a plain client), and probing the sign-in or
password-reset flow to see whether an address is registered is account
enumeration: against Meta's terms, deliberately uninformative, and it would mean
feeding an applicant's address into Meta's auth systems without their consent.

**Redemption is the check instead.** The Keys page in the Meta developer dashboard
shows each key as redeemed or not. A redeemed key is dashboard-visible proof that a
working Meta Horizon account now holds the game — it proves access *now*, which is
what a playtest actually needs. The dashboard status `joined` (labelled *Key redeemed*;
the id predates the keys) records it. The Horizon username collected on the form is a
cheap pre-filter, not proof; it is stable enough to rely on across a study because Meta
allows a username change only once every six months.

Statuses run `new → waitlist → invited → joined → testing → submitted → paid`,
plus `declined`. The `invited`, `joined` and `paid` dates are stamped the first
time each status is reached and never moved again, so walking an application
backwards to fix a mistake cannot rewrite when an invitation actually went out.

### Running a round

| Variable | Effect |
|---|---|
| `PLAYTEST_OPEN` | `false` closes the public form between waves; anything else leaves it open |
| `PLAYTEST_FORM_SECRET` | ≥32 chars, signs the form's timestamp. Falls back to `ADMIN_SESSION_SECRET`; blank on both skips that check |
| `PLAYTEST_NOTIFY_TO` | Email a note here when an application arrives. Needs a way out (below) too; otherwise nothing is sent |
| `SES_REGION`, `MAIL_FROM` | Send through Amazon SES (preferred). `MAIL_FROM` must be a verified identity in that region; the SDK reads `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` from the environment |
| `SMTP_URL`, `SMTP_FROM` | Or any SMTP server, e.g. `smtps://user%40domain:APP_PASSWORD@smtp.gmail.com:465` for Workspace. `SMTP_FROM` defaults to the URL's user |

SES is preferred because the IAM key can be scoped to `ses:SendEmail` on one identity and
revoked without touching anything else. The SES sandbox is not an obstacle: it restricts
*recipients* to verified addresses, and a note to yourself has the same address at both
ends. The SDK is imported lazily, so an SMTP deployment never loads it.

**The notification carries no applicant data** (`applicationNotice` in `playtest.mjs`):
reference, headset, VR frequency, evidence method, played-before, and a link to the
dashboard row. The page promises applicants that Meta is the only third party their
details go to, and an email transits Google — so the note says that someone applied and
where to look, and the dashboard has the rest. It is sent once, on the first application
from an address, fire-and-forget: a refused connection is logged and the applicant still
sees their reference. With no `SMTP_URL`, the site behaves exactly as before — the
dashboard is the only place applications appear.

`ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` gate `/admin/playtest` through the
same sign-in as the campaign dashboard — one password, one cookie, one login page
(`admin-session.mjs`). Export applications as CSV from the dashboard.

The public page is `noindex` and loads **no analytics**: it is a temporary
surface holding contact details, and belongs in neither search results nor public
visitor reporting. Count arrivals with a `/go/` campaign link pointed at
`/playtest` instead — same number, first-party, no identity stored.

Spam handling is three cheap layers, deliberately none of them a CAPTCHA: an
off-screen honeypot field (answered with the ordinary thank-you page, so a
scraper is never taught it was spotted), a signed timestamp rejecting a form
posted in under three seconds or after twelve hours, and eight applications per
hour per address. A second application from an address already on file returns
the original reference and changes nothing — it is nearly always a double-click,
and a re-application must never overwrite a screening decision.

### Submitting a session

Testers submit on `/playtest/questionnaire`: seven answers, headset and minutes, whether
progress returned, a link to a short clip or screenshots, and the PayPal account the
US$10 goes to. Nothing is emailed by the tester and no address is published.

The form appears only after a **reference and its email** are matched — the reference is
six characters somebody might paste in a chat; the email is the thing only its owner
knows. Every failure gets the same message, so nobody can learn which references exist
by trying, and lookups are limited to 20 an hour per address. A match issues a signed
token good for 24 hours, and the submission carries that rather than a session.

Only applications at **Invited, Joined, Testing or Submitted** can submit — nothing
before a key was sent, nothing after Paid. Submitting moves the status to Submitted on
its own, so the 48-hour payment window starts from a timestamp nobody had to set. A
tester asked for a correction resubmits with the same pair; the answers are replaced,
the first date is kept, and `submission_count` goes up.

Two emails go out through SES: a note to the developer (reference, headset, minutes,
whether progress returned, dashboard link — **no answers, no PayPal, no address**) and a
receipt to the tester. The PayPal account is shown only on the dashboard detail page and
the submissions CSV, and is deleted with the application.

Evidence is a **link**, not an upload: an unlisted YouTube video or a Drive/Dropbox share.
The page explains how to get a clip off a Quest via the Meta Horizon app. Direct upload
to R2 is the phase-two option if links prove to be where testers stall.

**`/privacy` § *The paid playtest* covers all of this** and commits to specific
retention: unsuccessful applications deleted 30 days after the round closes,
recordings and contact details 90 days after final payment. The dashboard's
delete button is what keeps those promises — a retention promise that needs a
database console to honour is one that quietly does not get honoured.

## Static assets

Everything under `public/` is served with `Cache-Control: public, max-age=31536000,
immutable` (`assets.mjs`). Before this, `express.static` sent no lifetime and Cloudflare
applied its four-hour default, so every returning visitor re-fetched the 647 KB hero
loop. A year-long cache is safe on one condition, and it is a convention rather than a
mechanism:

**A changed asset gets a changed URL.**

- The stylesheet handles this itself: the layout links `/css/styles.css?v=<hash>`, where
  the hash is computed from the file's bytes at startup. Edit the CSS, deploy, and the
  URL changes; deploy without touching it, and the cache stands.
- Images, video and fonts do not. **Replace one under the same filename and anyone who
  has visited before is served the old bytes for a year.** New poster: `hero-poster-2.webp`,
  then point `data/content.mjs` at it. Never overwrite `hero-poster.webp` in place.
- The exceptions are the files that change in place by design and are fetched by robots
  rather than browsers: `sitemap.xml`, `robots.txt` and the press kit zip get an hour.

Cloudflare respects the origin's `Cache-Control` as long as the zone's Browser Cache TTL
is left at *Respect Existing Headers* (the default). If a static asset ever comes back
with `max-age=14400`, that setting has been changed.

## Fonts and third-party scripts

The three typefaces are self-hosted from `public/fonts/` — the same variable WOFF2
files Google Fonts serves, latin subset, one file per family and style, 147 KB in all,
under the SIL Open Font License (`OFL-*.txt` beside them). Self-hosting removed a
~800 ms render-blocking round trip on mobile and took Google Fonts out of the privacy
policy. Oswald and Inter are preloaded from the layout; the serif loads with the CSS.

`gtag.js` is fetched on idle or first interaction rather than as a blocking `<head>`
script. The inline stub queues `gtag()` calls made before it arrives, so `store_click`
and `trailer_open` events from an early click still land; the pageview is simply
reported a second or two later. A visitor who leaves in under two seconds without
touching anything is no longer counted — accepted, since such a visit tells us nothing.

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
| `hero-loop-detector.mp4` | The detector sweep — the game's core verb. **Shipped**, on screens ≥ 720 px only | 630 KB |
| `hero-loop-well.mp4` | Magnet fishing a well under Carcassonne | 710 KB |
| `hero-loop-ruins.mp4` | The camera crossing the ruins at Bolonia | 640 KB |
| `buried-worlds-trailer-720p.mp4` | The full trailer, click-to-play | 14 MB |

Swap the hero's mood by pointing `trailer.loop` in `data/content.mjs` at a different
one. The 1080p master stays out of this repo — it is what press and YouTube should get.

Three things keep the page light despite all that: the hero loop's `<source>` carries
`data-src` and is attached by `trailer.pug` only on screens 720 px and wider without a
reduced-motion preference, so phones download the 97 KB WebP poster and nothing else;
the full trailer is `preload="none"`; and the modal's poster lives in `data-poster` and
is promoted to `poster` on first open.
A `poster` named in the markup is fetched **eagerly even under `preload="none"`**, which
billed every visitor 166 KB for an image most never saw. Measured page weight on first
load is ~1 MB, and the 14 MB file is not among it.

**Note:** `public/video/` puts 16 MB of binaries in git. Fine at this size; if more
trailers arrive, move them to object storage rather than growing the repo.

## Destination pages

Each homepage card links to `/destinations/:slug`. The copy lives in
`data/destinations.mjs`, written from `~/Documents/VRVault/BuriedWorlds/Destination
Gameplay.md`, which is the source of record for unlock thresholds, buried-item counts
and reward values — change a number there first. `destinations.mjs` decides what a
crawler is told: a unique title and description per page, the page's own screenshot as
its share image, a BreadcrumbList, and on Ballarat a VideoObject for the teaser.

A test enforces that every card in `worlds` has a page and every page has a card,
that titles fit a search result (≤ 65 chars) and descriptions a snippet (120–160),
that every referenced image exists, that each page renders at least 350 words of its
own copy, and that Kimberley — built, withheld, and removed from the project in
August 2026 — appears nowhere.

**The Ballarat teaser** is a click-to-load facade, not an embed. Opening the page loads
nothing from YouTube: the poster is our own screenshot, and the play control is a plain
link to the watch page that JavaScript upgrades into a `youtube-nocookie.com` player
in place. `/privacy` § *This website* describes it. Keep it that way — a normal
YouTube iframe sets cookies on page load, which the policy would then have to cover.

**Hoxne has no full-size screenshot** (the trailer cut has no Hoxne footage), so its
page shows the 384 px card image over the terrain gradient and keeps the site cover
as its share image. Drop a 1920×1080 capture into `public/press/screenshots/`,
point `hero.src` at it and remove `hero.gradient`, and both fix themselves.

## Guide pages

The homepage is a brand page, and the brand loses every search to a television
series of the same name (`buried worlds` autocompletes to *Buried Worlds with Don
Wildman*). So `data/pages.mjs` holds eight pages each built to own one generic query
the homepage never can — the query is the H1 and the page answers it — and to link out
to the destinations so ranking power flows through the site rather than pooling on `/`.

| Page | Owns |
|---|---|
| `/vr-metal-detecting-game` | "vr metal detecting game", "metal detecting simulator" |
| `/gold-panning-vr` | "gold panning vr", "gold mining vr" |
| `/seated-vr` | "vr games sitting down", "quest 3 cozy games" |
| `/hoxne-hoard` | "hoxne hoard hammer", "hoxne hoard worth" — verified against the British Museum record |
| `/how-to-play`, `/faq`, `/about`, `/updates` | Structure and trust: a hub, long-tail questions, who is behind the site, a dated changelog |

`guides.mjs` mounts them and decides what a crawler is told: BreadcrumbList, a WebPage
/ FAQPage / AboutPage node, the page's own screenshot as share image. The same tests as
the destinations apply — title ≤ 65, description 120–160, ≥ 350 words, every image on
disk, every internal link resolving, nothing about Kimberley — plus FAQPage carrying
every question, and the updates log dated newest-first with the release recorded.

**Every fact on these pages is sourced** — the gameplay document, the store listing,
`product`, and for the hoard the British Museum record via Wikipedia. Where a claim
could not be sourced it was cut rather than kept (Quest 2 "tested", "no sudden loud
sounds" — there is dynamite). Keep it that way: these pages are the ones a
detectorist or an archaeologist will read closely.

**`/updates` is only worth having if it is kept.** Add an entry to `updates` in
`data/pages.mjs` when a build actually ships, newest first, with a real date. A
changelog whose last entry is the launch reads as an abandoned game.

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

**Static serving runs with `redirect: false`** (see `assets.mjs`). `public/press/` is a
directory and `/press` is a route; with the default on, static answers `/press` with a
301 to `/press/` before the route is reached and the page is unreachable.

**Gap:** there is no Hoxne screenshot, because the final trailer cut contains no
Hoxne footage — the shot list planned it and it did not survive. Hoxne is the
strongest press hook there is (the lost hammer, the British Museum, the archaeology
angle), so it wants a fresh capture via MQDH.

Destinations live in the `worlds` array. Kimberley is withheld from the current
release — it is left out of that array rather than deleted, and its images and
gradient are kept, so restoring it is a matter of putting the entry back and
updating the "five real places" copy in `destinations.pug` and the `loopSteps`
travel line.
