# Handoff: Buried Worlds — Marketing Landing Page

## Overview
A single-page marketing site for the game **Buried Worlds**, promoting two products: the upcoming **Buried Worlds VR** (Meta Quest, "coming soon") and the already-live **Buried Worlds on Reddit** daily deduction game (the site's primary CTA). The look is a vintage-expedition-brochure aesthetic derived from the game's VR Travel scene: parchment, near-black ink, antique bronze, muted sage.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to ship. Your task is to **recreate this design in the target codebase's environment** (React, Next.js, etc.) using its established patterns. If no environment exists yet, choose an appropriate framework and implement the design there.

`Buried Worlds Landing.dc.html` is the prototype. All styles are inline on elements (search the file for exact values). `DESIGN_SYSTEM.md` is the source-of-truth brand spec — tokens there were extracted from the game's source code; defer to it on any conflict.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, and hover states are final and should be recreated pixel-perfectly. Imagery is placeholder (striped sage blocks with monospace labels) — real key art / terrain screenshots will replace it, keeping the stated aspect ratios and radii.

## Page Structure (top to bottom)

### 1. Hero — parchment (3 variants; "poster" is the default)
The prototype has a `heroVariant` switch: `poster` | `split` | `banner`. Implement **poster** unless told otherwise; the other two are alternate layouts kept for reference.

**Poster variant:**
- Page bg `#F6F2E6`, padding `88px 24px 72px`, centered column, max-width 880px, gap 22px.
- Bronze ornament: two 64×1px lines flanking a 7px square rotated 45° — all `#8C6133`.
- H1 "BURIED WORLDS": Oswald 700, `clamp(3rem,7vw,5.2rem)`, letter-spacing .02em, uppercase, line-height 1.02, color `#1F211F`.
- Tagline: Cormorant Garamond italic, `clamp(1.3rem,2.4vw,1.7rem)`, `#4C574F`. Copy: *"Sweep, dig, pan, and travel the world's great gold rushes. A gold-prospecting adventure in virtual reality."*
- Coming-soon badge: pill, 1px `#4C574F` outline, no fill, text `#4C574F`, 13px/500, letter-spacing .06em, uppercase: "Coming soon to Meta Quest".
- Key-art slot: max-width 760px, aspect 16/8, radius 20px, outline `rgba(255,255,255,.28)`.
- CTAs (row, gap 14px):
  - Primary → `#reddit`: fill `#8C6133`, text `#EDE6D1`, radius 12px, padding 14px 26px, Oswald 600 15px, uppercase, ls .05em. Hover: bg `#7A5227`. Copy: "Play today's dig on Reddit".
  - Secondary → `#vr`: 1px `#8C6133` outline, text `#7A5227`, transparent. Hover: bg `rgba(140,97,51,.08)`. Copy: "About the VR game".

**Split variant (reference):** two-column grid 1fr/1fr, gap 56px, max-width 1120px; copy left, 4/5 portrait key-art right; small ornament + Cormorant italic kicker "An expedition in six worlds".

**Banner variant (reference):** full-bleed key art, min-height 78vh, bottom gradient `rgba(31,33,31,0)→.72`, white-on-dark type (`#F6F2E6`/`#EDE6D1`), gold Reddit CTA (`#E3A52B` fill, `#11140D` text, hover `#FFC940`).

### 2. Play now — Buried Worlds on Reddit (dark olive band, `id="reddit"`)
- Bg `#11140D`, text `#F1F0E9`, padding 88px 24px. Grid 1.1fr / .9fr, gap 56px, max-width 1120px.
- Left column (gap 18px):
  - "Available now" badge: pill, fill `#7EB64A`, text `#11140D`, 12.5px/600 uppercase.
  - H2 "BURIED WORLDS ON REDDIT": Oswald 700, `clamp(2rem,4vw,3rem)`, uppercase.
  - Lede (Cormorant 1.3rem): *"A daily deduction dig. Six digs, one buried relic, same field for everyone."*
  - Body (Inter 16px, `#92998A`, lh 1.6): *"Every day, one relic is buried somewhere in a shared field. Sweep your detector, read the signal, and triangulate the spot in six digs or fewer. Then share your grid and compare routes with everyone else who dug the same field."*
  - Primary CTA "Play today's dig": fill `#E3A52B`, text `#11140D`, radius 12px, padding 14px 26px, Oswald 600 15px uppercase. Hover `#FFC940`. **Link target TBD — wire to the Reddit game URL.**
- Right column — mock "Detector reading" card:
  - Panel `#192014`, border 1px `#35412B`, radius 20px, padding 26px.
  - Header row: "DETECTOR READING" (Oswald 600 14px, ls .08em, `#92998A`) + "dig 4 / 6" (monospace 12px `#92998A`).
  - Four signal rows (grid 76px/1fr, gap 12px): label monospace 12.5px/600 + 10px bar (track `#202919`, radius 5px):
    COLD `#0A84FF` 22% · WARM `#FF9F0A` 48% · HOT `#FF3B30` 74% · GOLD! `#FFC400` 96%.
  - Divider 1px `#35412B`, then "SHARE YOUR ROUTE" label, emoji grid `⬛🟫🟫💎` (22px, ls 3px), caption 13px `#92998A`: "Found it in 4 — same field, different route than yours."

### 3. The VR game — core loop (`id="vr"`)
- Bg `#EDE6D1` (note: darker parchment than page base — alternating-section rhythm), padding 88px 24px.
- Centered header: bronze ornament (48px lines + 6px diamond), H2 "THE PROSPECTOR'S DAY" (Oswald 700 clamp 1.9–2.8rem uppercase), Cormorant italic sub: *"The whole loop, from first signal to the next departure."*
- 5-column grid, gap 20px. Each step card: bg `#F6F2E6`, radius 20px, padding 24px 20px, outline `rgba(255,255,255,.28)`, column gap 12px:
  - Number: Cormorant 600 2rem `#8C6133` ("01"–"05").
  - Name: Oswald 600 17px uppercase ls .04em.
  - Desc: Inter 14px `#4C574F` lh 1.55.
- Steps & copy:
  1. **Detect** — "Sweep the coil low and slow. The signal tells you what's down there before you break ground."
  2. **Dig** — "Pick your spot and put the pickaxe to work. Every hole is a small bet."
  3. **Pan** — "Take the paydirt to water. Swirl, tilt, and watch the colour settle in the riffle."
  4. **Stow & sell** — "Fill the pouch, weigh in at the trader, and turn dust into a bankroll."
  5. **Travel** — "Buy a ticket to the next rush. Six worlds, each seeded by its real history."

### 4. Destinations gallery
- Bg `#F6F2E6`, padding 88px 24px. Same centered header pattern: H2 "DESTINATIONS", sub *"Six real places, six real rushes. Every field seeded by history."*
- 3-column grid, gap 26px. **Destination card** (the signature component — mirrors the VR travel card):
  - Bg `#EDE6D1`, radius 20px, padding 16px 16px 20px, resting outline `rgba(255,255,255,.28)`.
  - Hover: outline → `#8C6133`, scale 1.015, transition .18s ease.
  - Image slot: height 150px, radius 12px, filled with the world's terrain gradient (placeholder until real screenshots).
  - Name: Cormorant 600 1.5rem `#1F211F`; 6px bronze diamond on the right; 44×2px bronze dash under the name; subtitle Inter 13.5px `#4C574F`.
- The six worlds, with gradient stops (160deg, low→high elevation per DESIGN_SYSTEM.md §5):
  - **Castlemaine** — "The Victorian gold rush, Australia. Where the expedition begins." `#85A857 → #668C45 45% → #8C734C 78% → #C2B280`
  - **Coloma** — "California, 1849. The American River strike that started it all." `#DEC480 → #CCAD66 40% → #B28F5C 65% → #9B7653 85% → #6B4C33`
  - **Carcassonne** — "Medieval France. Coin hoards beneath a walled hilltop city." `#94B261 → #789E4C 45% → #6B8C47 75% → #857854`
  - **Kimberley** — "Western Australia's diamond country. Red earth, rare finds." `#614738 → #B88C4C 40% → #A6542E 70% → #73381F`
  - **Hoxne** — "A Suffolk field, 1992. The largest Roman hoard ever found in Britain." (same gradient as Castlemaine — intentional, per spec)
  - **Bolonia** — "Spain's Atlantic coast. Roman ruins in the dunes." `#8C8575 → #9E9E61 35% → #CCBD85 60% → #DECC99 80% → #9E8C6B`
- 7th card — **locked variant** ("More worlds coming", toggleable in the prototype):
  - Desaturated bg `#D9D3C4`; striped placeholder with a CSS-drawn padlock in `#1F211F`; title Cormorant 600 1.5rem `#4C574F`; progress bar: 8px track `rgba(31,33,31,.18)`, fill `#8C6133` at 62%, rounded ends.

### 5. Footer
- Bg `#1F211F`, text `#EDE6D1`, padding 72px 24px 40px. Grid 1.2fr/.8fr, gap 56px.
- Left: wordmark (Oswald 700 1.6rem uppercase), Cormorant italic line *"Be the first to know when the VR expedition departs."*, newsletter row: email input (bg `#F6F2E6`, radius 10px, padding 13px 16px) + "Notify me" button (fill `#8C6133`, text `#EDE6D1`, radius 10px; hover `#A0713C`; on submit label → "Noted ✓").
- Right: two link columns ("Play": Today's dig on Reddit → `#reddit`, The VR game → `#vr`; "Elsewhere": Meta Quest store, r/BuriedWorlds — **both TBD**). Column labels Oswald 600 13px uppercase `#92998A`; links `#C89A62` 14.5px, hover `#E3A52B` + underline.
- Bottom bar: 1px top border `rgba(237,230,209,.16)`, copyright 12.5px `#92998A` ("© 2026 Buried Worlds. Real places, real hoards."), small bronze ornament right.

## Interactions & Behavior
- Nav: hero CTAs and footer links smooth-anchor to `#reddit` / `#vr`.
- Destination-card hover: outline `rgba(255,255,255,.28)` → `#8C6133` + scale(1.015), .18s ease (exact VR hover behavior).
- Button hovers as specified per button above.
- Newsletter: on submit, button label changes to "Noted ✓" (prototype stores locally; production should POST to the mailing-list backend — endpoint TBD).
- No shadows heavier than `rgba(0,0,0,.15)`; the aesthetic is flat.

## State Management
- `email: string` — newsletter input.
- `wishlisted: boolean` — flips button label after submit.
- (Prototype-only) `heroVariant: "poster"|"split"|"banner"` and `showLockedCard: boolean` — design switches, not product features.

## Design Tokens
See `DESIGN_SYSTEM.md` (§3–§5) for the full canonical token tables. Summary used on this page:
- Parchment sections: `--paper #F6F2E6` (page base), `--parchment #EDE6D1` (cards + alternating section), `--ink #1F211F`, `--ink-soft #4C574F`, `--bronze #8C6133` (accent), darkened link bronze `#7A5227`, sage `#788C7A` (placeholders), track `rgba(31,33,31,.18)`, resting outline `rgba(255,255,255,.28)`.
- Reddit dark band only: bg `#11140D`, panel `#192014`, nested `#202919`, line `#35412B`, muted `#92998A`, gold `#E3A52B`, gold-bright `#FFC940`, green `#7EB64A`, text `#F1F0E9`; signal bands GOLD! `#FFC400` / HOT `#FF3B30` / WARM `#FF9F0A` / COLD `#0A84FF`.
- Radii: cards 20px, inner images 12px, buttons 10–12px, pills 999px.
- Type: Oswald (500–700) display/uppercase; Cormorant Garamond (400/600 + italics) editorial; Inter (400–600) body/UI. All on Google Fonts.
- Spacing rhythm: section padding 88px 24px; content max-width 1120px; grids gap 20–56px.

## Assets
- No raster assets in the bundle. All imagery is **placeholder** (striped sage blocks / terrain gradients) awaiting real VR key art and terrain screenshots. Ornaments (bronze rules + rotated-square diamonds) and the padlock are pure CSS — keep them as code, don't rasterize.
- Fonts: Google Fonts (Oswald, Cormorant Garamond, Inter).

## Responsive
The prototype is desktop-first (multi-column grids at 1120px max-width). Collapse to single column below ~900px: hero split stacks, Reddit band stacks (copy above mock card), loop grid 5→2/3→1, destinations 3→2→1, footer stacks. Keep type clamps as-is.

## Files
- `Buried Worlds Landing.dc.html` — the full prototype (markup between `<x-dc>` tags; all styles inline; `style-hover` attributes describe hover states).
- `DESIGN_SYSTEM.md` — canonical brand spec extracted from game source. Defer to it on conflicts.
