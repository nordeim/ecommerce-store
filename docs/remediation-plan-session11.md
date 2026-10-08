# Remediation Plan — Session 11 Review (Round-11 Differential Audit)

**Date:** 2026-10-08
**Repo:** `nordeim/ecommerce-store` (branch `main`, baseline `f9becf4` — the
session-10 ship state `297d018` plus the remotely-added `docs/session_19.md`
log)
**Author:** Review/build agent (Super Z)
**Scope:** Live differential audit (round 11) of the LUXE Store clone against
the reference (`fuzzy-lumina-style-hub.base44.app`). Ten prior rounds closed
the catalog, cart, checkout, auth, account, PDP, admin, computed-geometry,
mobile-geometry, social-metadata and interaction-engine gaps (226-test gate).
Round 11 targets: (a) the standing user priorities — mobile navigation (11th
verification, Tailwind v4 watch) and reference drift on pinned surfaces;
(b) **the unaudited media-preference surfaces** — `prefers-reduced-motion`,
`prefers-color-scheme`, and `print` emulation (never audited; sessions 1–10
pinned screen-media resting states); (c) **accessibility semantics + keyboard
navigation** — landmarks, heading order, alt text, focus order (the a11y tree
was never differentially audited); (d) a full pixel-diff drift re-check at
1024 across the key routes. The `skills/` folder is excluded from code
checking, testing and compilation per the operating contract.

**Method:** Baseline gate (226/226 green, exactly the documented session-10
ship state) → agent-browser sessions (`ref` = production reference logged in
as the operator account, `clone` = production standalone server on :3000
running the current build; dev server avoided per the session-9 OOM lesson;
session state saved to files before device emulation per the session-9
context-reset lesson) + Playwright probes for contexts agent-browser cannot
express (`reducedMotion: "reduce"`, `emulateMedia print/dark`) with DOM /
computed styles as ground truth; hero-slide census, tab-order census, font
machinery census, paired screenshot pixel-diffs at 1024 with row/band
localization + blur separation + VLM overlay review. Every finding carries
live-measured evidence from both sites.

---

## 1. Baseline verification (state at audit start)

| Gate | Result |
|---|---|
| `bun run lint` | 0 errors, 0 warnings |
| `bun run typecheck` | clean |
| `bun run test` (Vitest) | 88/88 passed |
| `bun run build` | exit 0, 23 routes |
| `bun run test:e2e` (Playwright) | 138/138 passed (226 total) |
| DB contract | `db/custom.db` at repo root; hard-link convergence live (inode 303519, both paths); canonical state (12 products / 3 demo orders / 3 users) |
| Docs | AGENTS/CLAUDE/README/PAD v1.10/SKILL v1.10.0 all current through session-10 (226-test gate) |
| Env | `.env` `DATABASE_URL="file:../db/custom.db"` intact; audit server booted with an explicit `AUTH_SECRET` (storageState cookies from the E2E server do not validate against it — a measurement-setup artifact, documented below, not a defect) |

## 2. Audit results

### Verified at parity this round (no action required)

- **Mobile navigation menu (11th standing verification):** iPhone 14 on both
  sites: the Sheet panel class string is byte-identical
  (`fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out …`),
  pad 24px, gap 16px, bg `rgb(251, 250, 249)`, nav `flex flex-col gap-4 mt-8`,
  all 5 links byte-identical (text + hrefs incl. the category deep-links) at
  239×44, 18px/500, `display:block`. **No Tailwind v4 regression (11th
  consecutive).**
- **Carousel rotation (re-measured with a corrected probe):** the clone
  cycles Spring Collection 2026 → Tech Essentials → Home & Comfort on the
  same ~5s cadence as the reference (the slide-container aria-hidden/opacity
  census over 17.5s; earlier "stuck" readings were probe artifacts —
  `querySelector("h1")` always returns the FIRST slide's h1 because all
  slides stay in DOM, and the dot probe matched the prev/next buttons).
- **Hero slide a11y marking:** the clone's inactive slides already carry
  `aria-hidden="true"` + `opacity-0` (the raw-DOM "3 h1" census is an
  artifact — the a11y tree exposes exactly one h1, matching the reference's
  DOM-swap structure; the all-slides-in-DOM divergence is documented since
  session-10). The focusability gap below is the one real defect in this
  area.
- **Print media emulation:** computed body/header/card surfaces identical
  (`shop` probed); the only diff is the alpha-notation trap 6
  (`rgba(251,250,249,0.8)` vs `lab(98.3…/0.8)`) — the documented
  same-paint/different-notation engine divergence, accepted by the parity
  specs.
- **`prefers-color-scheme: dark`:** neither site responds (body bg/h1 colors
  unchanged, no `.dark` class toggle on either) — parity (neither app
  implements dark mode; the clone has zero `dark:` utilities in `src/`).
- **`prefers-reduced-motion`:** both sites animate under `reduce` — the
  clone's toast enter transition (300ms bouncy CSS) still runs, and the
  reference's framer-motion toasts render with no CSS-transition machinery
  (JS-spring driven; no `MotionConfig reducedMotion` opt-in) — neither
  engine honors the preference, so parity holds (registered as considered
  and dismissed with evidence, not as a divergence to fix: adding a
  `motion-reduce` guard would diverge from the reference's behavior).
- **Transition machinery:** `transition-duration` census on shop buttons and
  cards identical (`0s` button chrome, `0.3s` card) under reduce.
- **Search typeahead (reference drift watch):** the reference still fires
  ZERO typeahead requests (header search probed; the ref's header carries no
  button-based search panel); the clone's typeahead fires `/api/search` on
  open + type — the registered superset, working.
- **Content drift re-check:** full inner-text censuses on
  account/shop/PDP/cart are IDENTICAL (the account's Phone field exists on
  both sites — no content drift; an initial 17.6% account pixel diff was the
  storageState/AUTH_SECRET mismatch redirecting to the login gate, an audit
  artifact, re-measured 1.81% after a fresh login).
- **A11y semantics census (home/shop/PDP/login):** landmarks, heading
  order, img alt coverage (0 missing on either site), and lang identical;
  the clone labels every button and input (ref: 21/17/10 unlabeled buttons,
  1–2 unlabeled inputs; clone: 0/0) — the documented aria superset; the
  clone's 4 "unlabeled inputs" on /login are Next server-action hidden
  inputs (`$ACTION_REF_1`, …), not AT-exposed.

### Findings (3 — F3 surfaced during the F2 remediation, each with live-measured evidence from BOTH sites)

#### F1 — A11Y-FOCUS-1 · the hero carousel's invisible slides keep their CTA links in the tab order

The clone renders all 3 hero slides in the DOM (the documented crossfade
structure) with `aria-hidden="true"` + `opacity-0` on the inactive ones.
`aria-hidden` removes the inactive slides from the ACCESSIBILITY TREE but
does NOT remove their descendants from the TAB ORDER — the inactive slides'
"Shop Now"/"Explore"/"Browse" CTA links remain focusable while invisible.

**Live A/B evidence (keyboard Tab census from the hero's active CTA):**

| Site | Tab sequence from the active CTA |
|---|---|
| Reference | CTA "Shop Now" → prev-arrow button → next-arrow button → dots (the ref swaps slides in the DOM — inactive CTAs do not exist) |
| Clone | CTA "Shop Now" → **`a "Explore"` INSIDE an `aria-hidden` slide** → **`a "Browse"` INSIDE an `aria-hidden` slide** → prev/next/dots |

Keyboard users tab onto two invisible links (a WCAG 2.4.3 focus-order defect
and a divergence from the reference's effective tab order). The codebase
sweep found NO other container-level `aria-hidden` with focusable
descendants — every other usage is a decorative-icon pattern (correct).
Blast radius: `src/components/store/hero-carousel.tsx` only (the media-slide
div and the text-block div).

**Fix:** add `inert` to the inactive slide containers (both the media slide
and the text block):

```tsx
aria-hidden={i !== index}
inert={i !== index}
```

`inert` (HTML spec; React 19 renders it as a boolean attribute) removes the
subtree from the tab order AND from the a11y tree; it changes NO computed
visual style — the resting visual, the crossfade, and the active slide are
untouched. The clone's tab order becomes exactly the reference's (CTA →
prev → next → dots). The auto-advance edge case matches too: the reference's
DOM swap removes the focused CTA (focus falls to body) and `inert` on a
focused element blurs it to body — same observable behavior.

#### F2 — FONT-SMOOTH-1 · the clone antialiases text; the reference renders subpixel (trap 12)

The clone applies `-webkit-font-smoothing: antialiased` — the shadcn v4
starter template's body default (inherited by this repo's port at the very
first commit: `@apply … antialiased` in `globals.css` body + the
`antialiased` class on `<body>` in `layout.tsx`). The reference computes
`-webkit-font-smoothing: auto` (its template does not set it): the browser's
default subpixel LCD antialiasing — noticeably darker/heavier text stroke
rendering.

**Live A/B evidence:**

| Probe | Reference | Clone |
|---|---|---|
| `getComputedStyle(body).webkitFontSmoothing` | `auto` | `antialiased` |
| `text-rendering` / `font-kerning` | `auto` / `auto` | `auto` / `auto` |
| Computed fonts (logo/nav/h1/body: family, fs, fw, color) | identical | identical |
| Pixel diffs @1024 (pixelmatch-0.1): shop 1.69 / PDP 3.58 / account 1.27 / home 1.05 / cart 1.45 / login 0.60% | — | all elevated vs the documented 0.27–0.54% baseline |

The diff-band localization (rows >5% per-row diff) + the magenta overlay VLM
review show the differences concentrated **on text glyphs of every route**
(header bands 10–18/54–66 on all routes; the PDP's title/pricing/description/
features/buttons/tabs) with the layout structure identical — and the blur(3)
separation (PDP 6.5% blurred vs 4.8% raw) rules out thin AA fringes: a
systematic stroke-rendering difference. Content censuses are identical and
computed font machinery is identical — the one computed divergence is the
smoothing property itself.

**Fix:** remove `antialiased` from both sites:

- `src/app/globals.css` body base layer: `@apply bg-background
  text-foreground font-sans;` (drop the trailing `antialiased`)
- `src/app/layout.tsx`: `<body className={`${jakarta.variable} font-sans`}>`

No other `antialiased` usage exists in `src/` (grep-pinned). Text metrics
(advance widths, line boxes) are unaffected — font smoothing only changes
rasterization darkness — so no geometry spec can shift.

#### F3 — FONT-FILE-1 · next/font's repackaged woff2 strips the `prep` hinting table (trap 13)

Found during F2's pixel re-diff: after the smoothing fix the text-band diffs
STAYED elevated (headless Chromium renders smoothing-neutral — identical
numbers pre/post fix), so the diff source had to be glyph rasterization
itself. The decisive chain (all live-measured / byte-compared):

1. Both sites declare and load "Plus Jakarta Sans" variable wght 200–800
   (document.fonts), and the reference's actual font file is Google's
   `plusjakartasans/v12/LDIoaomQNQcsA88c7O9yZ4KMCoOg4Ko20yw.woff2`
   (27,348 B) — captured from the browser; the initial "kartasans"
   reading was a 55-char URL-slice artifact.
2. fontTools comparison of the reference's file vs the clone's
   next/font-preloaded copy: `hmtx` advances IDENTICAL (0.00% delta),
   `glyf` outlines IDENTICAL (14/14 sample glyphs), GPOS/GSUB/GDEF/gvar/
   HVAR/MVAR/STAT/post IDENTICAL — but the clone's copy has **no `prep`
   table** (the TrueType hinting pre-program; next/font's subsetting
   pipeline strips it) and a recalculated `checkSumAdjustment`.
3. Canvas metrics on both sites: the same string measured **1009px on the
   reference vs 1013px on the clone** (different effective hinting).
4. The VLM's diff-overlay review: "a halo or outline around the letters and
   words … indicating the font rendering, weight, or spacing has changed" —
   on EVERY text element, with the layout, colors, icons and content
   identical (confirmed by inner-text censuses and computed-style
   censuses).

**Fix:** self-host the reference's EXACT file (downloaded via the browser,
md5 `7660bd9909…`, 27,348 B) and drop the next/font wrapper:

- `public/fonts/plus-jakarta-sans.woff2` (committed; serves at
  `/fonts/plus-jakarta-sans.woff2`, 200/27,348 B verified)
- `globals.css`: a plain `@font-face { font-family: "Plus Jakarta Sans";
  font-style: normal; font-weight: 200 800; font-display: swap; src:
  url("/fonts/plus-jakarta-sans.woff2") format("woff2"); }` and
  `--font-sans: "Plus Jakarta Sans", sans-serif;` (the reference's exact
  computed stack — the next/font "Fallback" metric-adjusted face and the
  ui-sans-serif/system-ui padding are gone)
- `layout.tsx`: the `Plus_Jakarta_Sans` next/font import, the `jakarta`
  const and the `${jakarta.variable}` body interpolation are removed
  (`<body className="font-sans">`)

Verified post-fix: canvas width 1009 (the reference's value), computed
stack `"Plus Jakarta Sans", sans-serif` (identical), exactly ONE loaded
face (no Fallback companion), and **the pixel diffs collapsed to the
session-10 baseline**: home 0.31 / shop 0.34 / PDP 0.60 / account 0.31 /
cart 0.31 / login 0.23% (from 1.62 / 2.50 / 4.81 / 1.81 / 2.46 / 0.90%).
Unicode coverage of the file (229 codepoints) covers every character the
site's text census uses (•, —, », ’, $); both sites share the same
fallback behavior for anything outside it. Layout is untouched — advance
widths are byte-identical, so no reflow can occur. (F2's layout.tsx bullet
referenced `${jakarta.variable}` — superseded by this fix, which removes the
variable entirely.)

## 3. TDD plan

**RED (new failing tests, `tests/e2e/storefront-parity.spec.ts`):**

1. "hero inactive slides are inert — no focusable CTAs in the tab order
   (A11Y-FOCUS-1)": goto `/`, focus the hero's active CTA link (the first
   `a[href]` inside the carousel), press Tab, assert the next focusable is
   the prev-arrow BUTTON (aria-label "Previous slide") — NOT an anchor
   inside an `[aria-hidden="true"]` slide. Pre-fix this fails: focus lands
   on the invisible "Explore" anchor.
2. "text renders with the reference's subpixel smoothing (trap 12,
   FONT-SMOOTH-1)": assert `getComputedStyle(document.body)
   .webkitFontSmoothing === "auto"` on `/`. Pre-fix: `antialiased` — fails.
3. "the body font is the reference's exact woff2 (trap 13, FONT-FILE-1)":
   await `document.fonts.ready`, assert the loaded faces are exactly
   `["Plus Jakarta Sans 200 800"]` (no next/font Fallback companion), the
   computed body stack is exactly `"Plus Jakarta Sans", sans-serif`, the
   canvas measureText of the calibration string is 1009±2px (the
   reference's live-measured value; the next/font build measured 1013),
   and `GET /fonts/plus-jakarta-sans.woff2` serves 27,348 bytes. Pre-fix:
   fails on every assertion (fallback face present, padded stack, 1013,
   404).

**GREEN:**

- T1 (A11Y-FOCUS-1): `inert={i !== index}` on both slide divs in
  `src/components/store/hero-carousel.tsx` (next to the existing
  `aria-hidden={i !== index}`).
- T2 (FONT-SMOOTH-1): drop `antialiased` from the `globals.css` body
  `@apply` and the `layout.tsx` body className.
- T3 (FONT-FILE-1): commit the reference's exact woff2 under
  `public/fonts/`, declare the plain `@font-face` in `globals.css`, point
  `--font-sans` at the reference's exact stack, and remove the next/font
  import/variable from `layout.tsx`.

**Regression safety:** T1 adds an HTML attribute with zero computed-style
effect (the parity spec's hero pins — line-heights, text-block geometry —
are untouched); T2 changes rasterization only (no layout metric moves; the
existing font-family pin `toContain("Plus Jakarta Sans")` is unaffected);
T3 swaps byte-identical-advance fonts (no reflow possible; the font pin and
stack assertions are updated to the tighter contract). None of them touches
a pinned trap from sessions 1–10; the full 226-test gate re-runs green plus
the 3 new tests.

## 4. Sign-off criteria

- [x] Baseline gate green at audit start (226/226, exactly the documented ship state)
- [x] Round-11 audit complete: mobile nav 11th verification byte-exact; media-preference surfaces, a11y semantics, rotation, typeahead drift, content censuses all verified
- [x] Findings live-measured on BOTH sites with root causes traced to the template/engine level
- [x] RED tests written and confirmed failing for the right reasons (focus lands on the invisible anchor; smoothing computes "antialiased"; the font test's every assertion fails pre-swap)
- [x] GREEN: one inert attribute + two class-string removals + the self-hosted reference font file; unit layer unaffected (all fixes are DOM/CSS-level, pinned at the E2E layer)
- [x] Full gate green: lint 0/0 · typecheck clean · 88/88 unit · build 23 routes · 141/141 E2E (229 total)
- [x] Live re-verification against the production server (tab order restored; smoothing computes auto; canvas width 1009 + exact stack + single face; font served 27,348 B)
- [x] Pixel re-diffs of the affected routes back to the sub-threshold session-10 baseline (0.23–0.60%)
- [x] Screenshots captured + VLM-verified under `docs/screenshots/`
- [x] Docs updated: AGENTS.md (traps 12–13), CLAUDE.md, README.md, PAD v1.11, SKILL v1.11.0, session log, worklog
- [x] `.env.example` verified current (no new env plumbing)
- [x] Committed on `main` and pushed via the SSH wrapper
