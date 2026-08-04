# Buried Worlds — Website Design System

Handoff spec for Claude Design. Every color below is extracted from game source code
(`BuriedWorlds` Unity repo and `buried-worlds` Reddit/Devvit client), so the site reads as the
same brand as the games.

## 1. The brand in one paragraph

Buried Worlds is a stylized gold-prospecting game: metal detectors, pickaxes, gold pans,
historically real dig sites. The visual identity is the VR **Travel scene** — a parchment
travel-poster look: warm cream cards, near-black ink, an antique-bronze accent (deliberately
bronze, not bright gold — the source comment reads "antique bronze (was bright gold)"), muted
sage greens, and thin gold-on-hover outlines. Flat-shaded, low-poly, warm, unhurried. The
website should feel like a vintage expedition brochure, not a neon game landing page.

## 2. Two products, two badges

The site promotes both versions. Never conflate them.

| Product | Status | Platform | CTA |
|---|---|---|---|
| **Buried Worlds VR** | Upcoming | Meta Quest | "Coming soon to Meta Quest" — wishlist / notify-me |
| **Buried Worlds on Reddit** | **Available now** | Reddit (daily deduction game) | "Play today's dig on Reddit" — primary action of the whole site |

The Reddit game is playable today, so it gets the site's primary CTA. The VR game gets the hero
spotlight (it's the flagship) with a clear "coming soon" badge.

- **Available-now badge:** `--green #7EB64A` on dark, or `--bronze #8C6133` outline style on parchment.
- **Coming-soon badge:** `--ink-soft #4C574F` outline, no fill — quiet, factual.

One-line descriptors:
- VR: *"A VR gold-prospecting adventure. Sweep, dig, pan, and travel the world's great gold rushes. Coming soon to Meta Quest."*
- Reddit: *"A daily deduction dig. Six digs, one buried relic, same field for everyone. Play now on Reddit."*

## 3. Core color tokens (Travel scene — canonical brand palette)

Source: `Assets/Scripts/Travel/TravelSceneView.cs`

| Token | Hex | Source value | Use |
|---|---|---|---|
| `--parchment` | `#EDE6D1` | `cardColor (0.93, 0.90, 0.82)` | Card & page background |
| `--ink` | `#1F211F` | `titleColor (0.12, 0.13, 0.12)` | Headings, body text |
| `--ink-soft` | `#4C574F` | `subtitleColor (0.30, 0.34, 0.31)` | Subtitles, secondary text |
| `--bronze` | `#8C6133` | `goldAccentColor (0.55, 0.38, 0.20)` | THE accent: links, dividers, hover outlines, progress fills, small diamond/dash ornaments |
| `--sage` | `#788C7A` | `imagePlaceholderColor (0.47, 0.55, 0.48)` | Image placeholders, muted panels |
| `--track` | `rgba(31,33,31,.18)` | `progressTrackColor` | Progress-bar tracks, subtle rules |
| `--outline-rest` | `rgba(255,255,255,.28)` | `RestOutlineColor` | Resting card outlines on imagery |

Suggested derived tokens (not in source, stay in family):
`--parchment-deep #E2D9BF` (alternating sections), `--paper #F6F2E6` (page base if `--parchment`
is reserved for cards).

## 4. Reddit-game palette (dark section only)

Source: `buried-worlds/src/client/index.html` `:root` and `shared/config.ts`.
Use these **only** inside the "Play now on Reddit" section, presented as a dark olive band —
each product keeps its own feel, and the contrast makes "playable now" pop.

| Token | Hex | Use |
|---|---|---|
| `--bw-bg` | `#11140D` | Section background |
| `--bw-panel` | `#192014` | Panels/cards |
| `--bw-panel-2` | `#202919` | Nested panels |
| `--bw-line` | `#35412B` | Borders |
| `--bw-muted` | `#92998A` | Secondary text |
| `--bw-gold` | `#E3A52B` | Accent, buttons |
| `--bw-gold-bright` | `#FFC940` | Hover / emphasis |
| `--bw-green` | `#7EB64A` | Positive / "available now" |
| Text on dark | `#F1F0E9` | Body text in this section |

Detector signal bands (fun functional accents for explaining the Reddit gameplay —
e.g. a mock result strip): GOLD! `#FFC400` · HOT `#FF3B30` · WARM `#FF9F0A` · COLD `#0A84FF`.
Share-grid emoji: `⬛🟫🟫💎` — usable verbatim as a graphic element.

## 5. World palettes (from terrain height gradients)

Each VR location bakes its terrain from a vertex-color gradient. Use these as per-world card
theming in a "Destinations" gallery (gradient swatch strip, card tint, or illustration palette).
Listed low→high elevation.

**Castlemaine** — Australian gold-rush bush (flagship; default terrain gradient, also used by Hoxne)
`#C2B280` sandy creek bed · `#8C734C` dirt · `#668C45` low grass · `#85A857` hilltop grass

**Coloma** — California '49er gold rush, American River
`#6B4C33` wet river soil · `#9B7653` soil · `#B28F5C` dry sandy dirt · `#CCAD66` sun-bleached grass · `#DEC480` pale golden hilltop

**Carcassonne** — Medieval France, walled hilltop city
`#857854` damp lowland soil · `#6B8C47` meadow green · `#789E4C` pasture · `#94B261` sunlit hilltop grass

**Kimberley** — Western Australian diamond country
`#73381F` dark red earth · `#A6542E` red earth · `#B88C4C` ochre · `#614738` brown ridge

**Hoxne** — Roman-Britain Suffolk farmland (Hoxne Hoard, 1992)
Shares the default green gradient (see Castlemaine) — "reads as English fields" per source.

**Bolonia** — Spanish Atlantic coast beach
`#9E8C6B` seabed/wet sand · `#DECC99` dry beach sand · `#CCBD85` dune sand · `#9E9E61` dry scrub · `#8C8575` rocky ridge

Kimberley is the only warm-red palette — it gives the gallery welcome variety; don't cool it down.

## 6. Typography

Fonts shipped in the VR game (`Assets/Fonts/`):

| Role | Font | Notes |
|---|---|---|
| Display / H1–H2 | **Oswald Bold** | Condensed, poster-like. Travel screen headers are uppercase (e.g. "START IN CASTLEMAINE") — uppercase display headings are on-brand |
| Editorial serif / subheads, pull quotes, destination names | **Cormorant Garamond** (Regular + SemiBold) | The "expedition journal" voice |
| Body / UI | **Inter** (system-ui fallback) | Matches the Reddit client |

Both Oswald and Cormorant Garamond are on Google Fonts. Scale suggestion: H1 clamp(2.5–4.5rem)
Oswald 700 uppercase, letter-spacing +2%; H2 Oswald 700; H3/labels Cormorant SemiBold italic;
body Inter 400 16–18px, line-height 1.6.

## 7. Components

**Destination card** (mirror of the VR travel card — the signature component)
- Parchment `--parchment` fill, corner radius **20px** (source: `cardCornerRadius = 20`); inner image radius **12px** (`imagePlaceholderCornerRadius = 12`).
- Resting outline `rgba(255,255,255,.28)`; on hover, outline switches to `--bronze` (exact VR hover behavior). Add a gentle lift/scale ≤1.02.
- Name banner: destination name in Cormorant SemiBold `--ink`, a 2px `--bronze` dash under it, subtitle in `--ink-soft`, and a small `--bronze` diamond ornament (the VR card draws dash + diamond — keep both).
- Locked-destination variant (for "more worlds coming"): desaturated card (`Lerp(card, gray, 0.22)` ≈ `#D9D3C4`), procedural padlock in `--ink` on `--parchment`, progress bar: track `--track`, fill `--bronze`.

**Buttons**
- Primary (Reddit section): `--bw-gold` fill, `#11140D` text, hover `--bw-gold-bright`.
- Primary (parchment sections): `--bronze` fill, `--parchment` text.
- Secondary: 1px `--bronze` outline, transparent fill.
- Radius 10–12px, Oswald or Inter SemiBold, slight letter-spacing.

**Progress / unlock bar** — track `--track`, fill `--bronze`, rounded ends. Good motif for a
roadmap ("worlds unlocked so far") strip.

**Ornaments** — thin bronze rules, small rotated-square diamonds as section dividers. No drop
shadows heavier than `rgba(0,0,0,.15)`; the VR aesthetic is flat.

## 8. Page structure (suggested)

1. **Hero** — parchment. Oswald uppercase title "BURIED WORLDS", Cormorant tagline, VR key art. Badge: *Coming soon to Meta Quest*. Secondary link jumps to Reddit section.
2. **Play now — Buried Worlds on Reddit** — dark olive band (`--bw-*` tokens). Explain the daily loop (6 digs, detector bands, share grid) with the signal-band colors. Primary CTA: *Play today's dig*.
3. **The VR game** — parchment. Core loop as 5 steps: Detect → Dig → Pan → Stow & sell → Travel. Bronze icon/step numbers.
4. **Destinations gallery** — the six world cards with their gradient palettes (§5), built as the destination-card component. Locked-card variant teases future sites.
5. **Footer** — `--ink` background, `--parchment` text, `--bronze` links. Newsletter/wishlist capture for the VR launch.

## 9. Voice

Warm, wry, historically curious. Real places, real hoards (the Hoxne Hoard came out of a Suffolk
field in November 1992 — the terrain seed is literally 1992; details like that belong in the
copy). Avoid hype-speak; write like an expedition brochure.

## 10. Accessibility notes

- `--ink` on `--parchment`: 13.0:1 — fine everywhere. `--ink-soft`: 6.1:1 — fine.
- `--bronze` on `--parchment`: 4.35:1 — large text/UI only; small body links need underline or a darkened link variant (e.g. `#7A5227`).
- `--bw-gold` on `--bw-bg`: 8.6:1 — fine.
- Don't put `--bw-green` small text on parchment (fails contrast); dark section only.
- Signal-band colors are decorative labels, never the sole carrier of meaning (the game itself follows this rule — readings are delivered visually with bars + labels).
