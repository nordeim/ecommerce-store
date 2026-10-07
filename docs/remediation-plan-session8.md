# Remediation Plan — Session 8 Review (Round-8 Differential Audit)

**Date:** 2026-10-08
**Repo:** `nordeim/ecommerce-store` (branch `main`, baseline `272c804`)
**Author:** Review/build agent (Super Z)
**Scope:** Live differential audit (round 8) of the LUXE Store clone against the
reference (`fuzzy-lumina-style-hub.base44.app`). Seven prior rounds closed every
known visual-parity gap and hardened the superset (stock enforcement,
redirect-after-login, admin order detail). Round 8 targets: (a) the standing
user priorities — mobile navigation (7th verification, Tailwind v4 watch) and
reference drift on all pinned surfaces; (b) **computed-geometry drift on
form-field spacing** (a newly-classed Tailwind v4 `space-y-*` engine trap that
v4's own release notes don't call out); (c) long-tail parity polish (PDP star
rating, breadcrumb, feature icons, 404 titles, search-item casing). The
`skills/` folder is excluded from code checking, testing and compilation per
the operating contract.

**Method:** Fresh clone → full verification gate → agent-browser sessions
(`ref` = production reference logged in as the operator account, `clone` =
local dev server on the current commit) with DOM/computed styles as ground
truth, plus paired full-page screenshot pixel-diffs across 15 routes (desktop
1440×900) and iPhone 14 mobile sweeps. Every finding below carries
live-measured evidence from both sites.

---

## 1. Baseline verification (state at audit start)

| Gate | Result |
|---|---|
| `bun run lint` | 0 errors, 0 warnings |
| `bun run typecheck` | clean |
| `bun run test` (Vitest) | 76/76 passed |
| `bun run build` | exit 0, 22 routes |
| `bun run test:e2e` (Playwright) | 118/118 passed (194 total) |
| DB contract | `db/custom.db` at repo root; sandbox-injected `DATABASE_URL=/home/z/my-project/db/custom.db` converged via hard link (inode 303519); canonical state (12 products / 3 demo orders / 3 users) |
| Docs | AGENTS/CLAUDE/README/PAD v1.7/SKILL v1.7.0 all current through session-7 (194-test gate) |

The baseline matches the documented session-7 ship state exactly — the
workspace was a fresh clone with the env-shadowing trap re-converged the
documented way (hard link).

## 2. Audit results

### Verified at parity this round (no action required)

- **Mobile navigation menu (7th re-verification, standing user priority):**
  iPhone 14 viewport on both sites: overlay `[role=dialog]` 288×844 @ (0,0)
  with byte-identical class strings (`fixed z-50 gap-4 bg-background p-6
  shadow-lg transition ease-in-out …`), nav wrapper `flex flex-col gap-4
  mt-8` on both, all 5 links byte-identical (text + hrefs incl. the
  category deep-links). **No Tailwind v4 regression.** Reference
  menu-stays-open quirk re-confirmed; clone navigates AND auto-closes
  (registered superset divergence — measured again live).
- **Home structure:** `main > DIV` wrapper with 8 children in identical
  order (hero, features, divider, Trending, Categories, New Arrivals,
  divider, On Sale); both hairline dividers present.
- **Catalog:** all 12 products byte-identical (slugs, names incl.
  "Wireless Noise-Cancelling Headphones", array order); mobile-home pixel
  diff 0.671% = hero-slide timing + the two feature icons (findings below).
- **Shop:** 12 cards in array order; Selects identical (text + classes +
  chevron icons); UI-driven sort semantics verified — "Newest" via the
  combobox produces reverse-array order on BOTH sites (the earlier
  URL-param divergence is the documented superset: the reference's SPA
  ignores its own `?sort=` deep links).
- **PDP:** identical product image (same CDN URL/rect), breadcrumb content
  ("Home Shop electronics «name»"), price, buy panel, tabs (24px panel gap
  on both), related products.
- **Auth screens:** anatomy identical (header block, tile, inputs,
  "or" divider, error box) apart from the field-spacing drifts filed below.
- **Cart drawer:** identical overlay class + item-row content and totals
  block (verified with a live item on both sites).
- **Account:** tab structure (Profile/Orders/Addresses/Settings), Addresses
  tab content byte-identical (demo fixture), avatar→form gap 24px on both.
- **Wishlist / cart / checkout-empty / standalone 404 body:** pixel diff
  ≤0.22% (sub-threshold font-antialiasing noise); the 404 body (h1 "404",
  slate palette, quoted path, Go Home) is at parity.

### Verified superset (no action required)

- Register→login flows, stock enforcement, admin console, newsletter API —
  all covered by the 118-test E2E suite that passed at baseline.

## 3. Issue inventory

### SPACE-Y-INLINE-1 — Auth forms lose 8px per field (Tailwind v4 trap #8)
- **Severity:** High (visible geometry drift on three auth screens — the
  reference's cards are taller; cascades every element below the fields)
- **Evidence (live, both sites, 2026-10-08):** Tailwind v4 emits
  `:where(.space-y-2 > :not(:last-child)) { margin-block-end: 8px }` —
  margin lands on the NON-LAST child. When that child is an inline
  `<label>` (display: inline, measured on both sites), a vertical margin is
  INERT (inline boxes don't affect block layout), so the label→input gap
  collapses to the natural 3px. v3 emitted `margin-top` on FOLLOWING
  siblings (`.space-y-2 > :not([hidden]) ~ :not([hidden])`), which landed
  on the block-level input wrapper and always worked (reference: gap 11px
  = 3px strut + 8px margin; clone: gap 3px). Register form: reference
  label→input gaps [11,11,11], card height 514px; clone [3,3,3], card
  490px (24px short). Login email field: gap 11 vs 3. The reference's
  label itself is `display: inline` with `margin-bottom: 0` and the
  following `div.relative` carries `margin-top: 8px` — measured computed
  values on both sites.
- **Affected seams (grep-validated, complete):** `login-form.tsx` (email
  field), `register-form.tsx` (email/password/confirm), 
  `forgot-password-form.tsx` (email) — five `div.space-y-2 >
  Label + div.relative` wrappers. NOT affected (validated): verify-email
  (`flex flex-col gap-4`), account/checkout forms (`Label mb-2 block`
  pattern), sheet header/not-found/admin dl/product ul (block children),
  mobile nav (flex `gap-4`, per trap 5).
- **Design decisions:**
  - **Surgical fix** (chosen): keep `space-y-2` on the wrappers (DOM class
    parity with the reference) and add `mt-2` to each input wrapper
    `div.relative`. Computed geometry then equals the reference exactly
    (input wrapper `margin-top: 8px` on both sites); the label's inert
    `margin-block-end` stays computed-but-invisible.
  - Global CSS override of `space-y-*` semantics was evaluated and
    REJECTED: replicating v3 exactly requires the zeroing rule to lose to
    children's own `mb-*` utilities but beat v4's `:where(0,0,0)` rule —
    layer/specificity engineering with live blast radius on the
    `flex flex-col space-y-2` SheetHeader (margins don't collapse between
    flex items — a naive override doubles that gap) and on the account
    avatar row (`mb-6` + `space-y-4` — trap-5 territory). The surgical
    per-seam fix carries zero blast radius outside the touched files.
  - Documented as **trap #8** in the AGENTS.md trap log with the general
    rule (never let `space-y-*` carry the spacing of an inline first
    child; give the following block the `mt-*`).

### ICON-DRIFT-1 — Feature-bar + PDP feature-row icons diverge
- **Severity:** Medium (visible glyph drift on two surfaces)
- **Evidence (live):** reference home feature bar + PDP feature row use
  `lucide-shield` (Secure Payment) and `lucide-rotate-ccw` (30-Day
  Returns); the clone renders `lucide-shield-check` and
  `lucide-refresh-cw` (compared via rendered `class` attributes on both
  sites; the remaining two — truck / headphones — match). Pixel evidence:
  the mobile-home diff localized to the "30-Day Returns" icon area.
- **Fix:** swap imports/usages in `src/components/store/category-card.tsx`
  (feature array) and `src/app/(storefront)/product/[slug]/page.tsx`
  (feature-row icons only — the Description tab's `Check` icons and the
  Shipping tab's literal `✓` are already at parity and stay).

### STAR-RATE-1 — PDP star rating: structure, gap, and fill rule diverge
- **Severity:** Medium (visible: for 4.8 the reference shows 4 amber + 1
  gray star; the clone shows 5 amber; the row is also 2px/row tighter)
- **Evidence (live, multiple products):** reference = a FLAT row of 5
  direct `Star` svgs in `div.flex.items-center.gap-1` — `floor(rating)`
  carry `fill-amber-400 text-amber-400`, the rest `text-border` (measured
  on 4.8, 4.5, 4.6 products: ALWAYS 4 amber + 1 gray — floor, no rounding,
  no half-stars). Clone = `flex items-center gap-0.5` with a
  track+overlay span structure (`relative inline-flex`, gray track +
  absolute amber overlay), rounding up at fraction ≥ 0.75 and rendering
  half-stars in [0.25, 0.75). The rating TEXT ("4.8 (234 reviews)") is
  byte-identical (E2E-pinned); only the star row drifts.
- **Fix:** rewrite `src/components/store/star-rating.tsx` to the flat
  reference form (5 stars, `gap-1`, `floor()` fill, `text-border` rest,
  keep the `aria-label` a11y superset — invisible). `StarHalf` import goes
  away. Validated safe: `StarRating`'s only callsite is the PDP (cards use
  their own single-star+number markup, pinned by the parity spec).

### BREADCRUMB-1 — PDP breadcrumb gap/margin (8px page-wide cascade)
- **Severity:** Medium (the whole PDP below the breadcrumb is offset 8px
  vs the reference — h1 at y193 vs y201, and every band below)
- **Evidence (live):** reference nav `flex items-center gap-2 text-sm
  text-muted-foreground mb-8` (gap 8px, margin-bottom 32px); clone `flex
  items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap`
  (gap 6px, margin-bottom 24px). Parent wrapper, content, and link
  structure are otherwise identical.
- **Fix:** align the clone's breadcrumb classes to `gap-2 mb-8` and drop
  `flex-wrap` (product names are single-line; the reference doesn't wrap).

### SPACE-TABS-1 — Account tab panel sits 8px low (trap-5 variant)
- **Severity:** Medium (8px offset cascades the account profile block)
- **Evidence (live):** the account `Tabs` root carries `space-y-6`; the
  `TabsContent` carries `mt-2`. v4's space-y-6 puts margin-block-end 24px
  on the non-last TabsList AND the panel's own `mt-2` adds 8px → 32px gap
  (panel y261). v3's space-y-6 put margin-top 24px on the panel with
  higher specificity `(0,3,0)` which BEAT the panel's own `mt-2` → 24px
  gap (panel y253). Reference tablist→panel gap 24px; clone 32px.
- **Fix:** remove `mt-2` from the account `TabsContent` (the reference's
  own `mt-2` is dead code there — overridden by its space-y rule). The
  v4-supplied 24px on the TabsList then produces the reference's exact
  24px gap. (PDP tabs validated unaffected: no space-y wrapper, panel
  `mt-6` effective — 24px on both sites.)

### LABEL-BLOCK-1 — Account profile form label geometry (8px row drift)
- **Severity:** Medium (row-2 inputs sit 8px high; labels 4px short)
- **Evidence (live):** reference profile fields are `<div>` (unclassed) >
  INLINE `<label>` (h18 natural line box) + `<input>` with computed
  `margin-top: 6px` → label top 425/h18, input 452 (gap 9), row-2 input
  y534. Clone: `Label className="mb-2 block"` (block, h14) + input mt 0 →
  label 430/h14, input 452 (gap 8), row-2 input y526. The clone's own
  Change-Password form ALREADY uses the reference pattern (plain inline
  Label + `Input className="mt-1.5"` — gaps 9/mt 6px, measured matching
  on both sites); the profile form simply wasn't converted.
- **Fix:** convert the four profile fields (acc-first/acc-last/acc-email/
  acc-phone) to that same in-repo pattern: drop `mb-2 block` from the
  Labels, add `mt-1.5` to the Inputs. Address form (superset-only — the
  reference's Add New is a no-op demo) and checkout form (reference
  checkout permanently empty) keep their current pattern: no reference
  counterpart to match.

### TITLE-404-1 — Unknown-route 404 title diverges
- **Severity:** Low (parity on bad deep links; the body is already pinned)
- **Evidence (live, rule decoded across 12 probe paths):** the reference's
  SPA titles unknown routes with the **last path segment that contains a
  letter**, humanized (split on `-`/`_`, join with space, capitalize each
  word's first char, case otherwise preserved) + " | Lumina":
  `/nonexistent-route-xyz` → "Nonexistent Route Xyz | Lumina";
  `/foo/bar-baz` → "Bar Baz | Lumina"; `/FOO_BAR` → "FOO BAR | Lumina";
  `/a/b/c/d` → "D | Lumina"; `/products/42` → "Products | Lumina" ("42"
  has no letters → falls back to "products"); `/12345` → "Lumina" (no
  letter segments at all). The clone renders "Lumina" for every unknown
  route. This is the SAME rule the reference applies to unknown PDP slugs
  (session-7 TITLE-NF-1, already shipped via `generateMetadata` +
  `humanizeSlug`).
- **Design decisions:**
  - New root catch-all route `src/app/[...notFound]/page.tsx`: renders the
    exact platform-404 UI (extracted into a shared
    `src/components/store/platform-404.tsx` used by both the catch-all and
    the existing `not-found.tsx`) with `generateMetadata` implementing the
    decoded rule. No-letter paths return `title: { absolute: "Lumina" }`
    (the root template would otherwise render "Lumina | Lumina").
  - `humanizeSlug` extended to split on `[-_]` (underscore case measured
    live; PDP slugs never contain underscores — safe, unit-pinned).
  - Route-conflict sweep: every known route (`/`, `/shop`, `/product/[slug]`,
    `/cart`, `/checkout`, `/checkout/success`, `/wishlist`, `/account`,
    `/admin*`, `(auth)` routes, `/api/*`, `robots.txt`, `sitemap.xml`) is
    more specific than the catch-all; `notFound()` is never called
    anywhere in `src/` (grep), so `not-found.tsx` becomes the shared-UI
    insurance layer, unchanged in behavior.

### SEARCH-CASE-1 — Search dropdown item category casing
- **Severity:** Low (single glyph-class drift inside the typeahead)
- **Confidence:** Reasoned (one clean live capture of the reference's open
  dropdown showed `electronics` lowercase; the reference's own category
  badges are capitalized — the ref renders this one surface lowercase)
- **Evidence:** clone `search-bar.tsx` renders the item category with
  `capitalize` (renders "Electronics"); the captured reference dropdown
  item text reads `electronicsWireless Noise-Cancelling Hea`.
- **Fix:** drop `capitalize` and render `s.categoryName.toLowerCase()`.
  E2E-asserted (the search spec's typeahead test gains a casing check).

## 4. Dependency sweeps (validated before writing this plan)

- `StarRating` has exactly ONE callsite (PDP, `size="md"`) — the rewrite
  cannot affect card rating forms (single-star + number, separately pinned
  by `storefront-parity.spec.ts:73`).
- `storefront-parity.spec.ts` pins the CARD star (count 1, fill-amber) —
  no assertion inspects the PDP star row, breadcrumb, or feature-bar icon
  names (grep): all new assertions are additive.
- `catalog-parity.spec.ts` pins rating TEXT and counts — unaffected by the
  star-row rewrite.
- No spec pins the account panel's `mt-2` or the profile labels' `mb-2
  block` (grep `mb-2|mt-2` in specs → only toast ±2px tolerance notes).
- `space-y-reverse` is used nowhere (grep 0) — trap #8 documentation
  needs no reverse-mode caveat beyond a note.
- The `[...notFound]` catch-all adds one route (22 → 23); no collision
  with the `(auth)`/`(storefront)` route groups (groups don't consume
  path segments); `/favicon.ico` and other dotfiles now render the 404
  page instead of Next's default — identical UI to today's behavior.
- `humanizeSlug` is imported only by the PDP page (grep) — extending its
  splitter to `[-_]` changes no existing behavior (slugs are dash-only);
  new unit cases pin the underscore + numeric-start behavior.
- The auth-form `mt-2` additions are invisible to `toHaveCount`-style
  specs; the login/register/forgot form-contract specs assert fields,
  labels, placeholders, and error boxes — none assert wrapper classes.
- PDP pixel shifts from the breadcrumb fix: no spec pins absolute
  y-positions (grep `y193|201|452` in specs → none) — the parity suite
  asserts computed styles and structure, not page coordinates.

## 5. TDD execution plan

| # | Task | Test first (RED) | Implementation (GREEN) |
|---|---|---|---|
| T1 | SPACE-Y-INLINE-1 | `auth.spec.ts`: login email field label→input visual gap = 11px (±1); register all-3-fields gaps 11px (±1) — fails pre-fix at 3px | `mt-2` on the five input-wrapper `div.relative`s |
| T2 | SPACE-TABS-1 + LABEL-BLOCK-1 | account spec additions: tablist→panel gap 24px (±1); profile label computed `display: inline` + input `margin-top: 6px` — fail pre-fix (32px / block / 0px) | drop `mt-2` from TabsContent; drop `mb-2 block` from the four profile Labels + `mt-1.5` on their Inputs |
| T3 | STAR-RATE-1 | parity spec: PDP rating row = exactly 5 `svg.lucide-star` children, wrapper `gap: 4px`, 4 amber + 1 `text-border` for the 4.8 fixture — fails pre-fix (10 svgs, gap 2px, 5 amber) | rewrite `star-rating.tsx` flat/floor form |
| T4 | BREADCRUMB-1 | parity spec: breadcrumb `margin-bottom: 32px`, `column-gap: 8px`, h1 y = breadcrumb y + 76 (the ref cascade) — fails pre-fix (24px/6px) | `gap-2 mb-8`, drop `flex-wrap` |
| T5 | ICON-DRIFT-1 | parity spec: home feature bar renders `lucide-shield` + `lucide-rotate-ccw`; PDP feature row same — fails pre-fix (shield-check/refresh-cw) | swap the two lucide imports/usages in both files |
| T6 | TITLE-404-1 | smoke spec: `/some-unknown-route` title "Some Unknown Route \| Lumina"; `/foo/bar-baz` → "Bar Baz \| Lumina"; `/12345` → "Lumina"; body unchanged — fails pre-fix ("Lumina" everywhere) | `[...notFound]` catch-all + shared `platform-404.tsx` + `humanizeSlug` underscore extension (+ unit tests) |
| T7 | SEARCH-CASE-1 | search spec: typeahead item category text is lowercase — fails pre-fix | drop `capitalize`, lowercase the value |
| T8 | Gate + docs + ship | Full gate; live re-verification (agent-browser geometry re-measure vs the reference values above); screenshots (46-49); AGENTS (trap #8 + contract updates)/CLAUDE/README/PAD v1.8/SKILL updates; plan check-off; session log; worklog; commit + SSH push | — |

## 6. Sign-off criteria — ALL MET

- [x] All RED tests verified failing for the right reasons before fixes
      (unit: notFoundPageTitle missing + underscore split missing, 5
      failing; E2E: auth gaps measured 3px, account panel 32px + label
      display "block" + input margin 0px, star row gap 2px/10 svgs/5
      amber, breadcrumb margin 24px, wrong icon classes, 404 title
      "Lumina", search category capitalized — each error message named
      the drifted value)
- [x] Full gate green: lint 0/0 · tsc clean · 82/82 unit · build exit 0
      (23 routes) · **128/128 E2E = 210 total** (was 194; +6 unit, +10
      E2E, none removed) — run **twice consecutively** (127/127 then
      128/128 after the ACCOUNT-BTN-1 pin was added; final full run
      128/128)
- [x] Live re-verification (`scripts/verify-session8.ts`): **14/14 green**
      — login email gap 11px; register gaps [11,11,11]; account panel
      24px; profile label display inline + input mt 6px + gap 9px; PDP
      stars gap 4px / 5 svgs / 4 amber + 1 gray; breadcrumb mb 32px /
      gap 8px / h1-delta 76; feature icons shield + rotate-ccw with zero
      shield-check/refresh-cw; 404 titles for all four probe shapes; the
      404 body quoting the path; search category "electronics"
- [x] Mobile nav 8th standing verification (in the same script): overlay
      288×844 @ (0,0), `flex flex-col gap-4 mt-8`, 5 links — parity holds
- [x] Pixel-diff improvement (paired 1440×900 screenshots vs the live
      reference): register 2.89%→0.17%, login 1.79%→0.17%, forgot
      1.32%→0.07%, PDP 8.71%→0.48%, PDP-serum 12.17%→0.70%, account
      31.7%→0.23% (after ACCOUNT-BTN-1); remaining bands are the
      hero-slide snapshot timing and sub-threshold font antialiasing
      (cart/checkout/shop-sort diffs are the documented superset
      divergences — the reference's cart/checkout are permanently empty
      and its SPA ignores `?sort=` deep links)
- [x] Screenshots (VLM-verified, 6/6 PASS) under `docs/screenshots/`:
      46 (PDP star row), 47 (register field spacing), 48 (404 humanized
      title), 49 (account profile geometry), 50 (feature bar glyphs),
      51 (mobile nav 8th verification) → 51 total
- [x] Docs updated: AGENTS.md (trap log #8 with the three faces + PDP
      visual/404-title contracts + PDP-related edit), CLAUDE.md (counts,
      session-8 contracts, 23 routes, catch-all in the architecture
      list), README.md (210 tests, enriched feature + testing rows), PAD
      v1.8 (ADR-016 full record, §8.1 table 210, §8.4 checklist 82/128,
      §11 three Resolved rows), SKILL.md (bug row 30, ADR index through
      016, quick-reference rows); `.env.example` re-verified (no new env
      plumbing this round — all four vars still match `process.env`
      usage exactly)
- [x] Commit to main; SSH wrapper push; remote ref verified

## 7. Outcome notes

- **SPACE-Y-INLINE-1 (T1):** `mt-2` added to the five auth input-wrapper
  `div.relative`s (login email; register email/password/confirm;
  forgot-password email). The wrappers keep `space-y-2` (DOM parity);
  the computed geometry now matches the reference exactly (input wrapper
  `margin-top: 8px`; 11px visual label gap; register card back to the
  reference height).
- **SPACE-TABS-1 (T2a):** deeper than planned — the TabsContent BASE
  class (`src/components/ui/tabs.tsx`) carries `mt-6`, so simply
  removing the callsite `mt-2` produced 24(tablist mb)+24(base mt)=48px.
  The account Tabs root therefore drops `space-y-6` entirely: base
  `mt-6` alone supplies the reference's 24px (tablist mb 0 + panel mt
  24 — the reference's exact computed margins), mirroring how the PDP
  tabs already work.
- **LABEL-BLOCK-1 (T2b):** the four profile fields converted to the
  in-repo inline-label pattern (plain `Label` + `Input mt-1.5`) — the
  clone's own Change-Password form already used it; the profile form
  just hadn't been converted in session-3.
- **ACCOUNT-BTN-1 (found during the post-fix pixel diff, not in the
  original plan):** the profile Save button carried `mt-4` while being a
  `gap-4` grid child — 32px below the fields vs the reference's 16px,
  pushing the card and footer 16px low. Dropped the `mt-4`; pinned by a
  new account spec test (the 10th E2E test of the round).
- **STAR-RATE-1 (T3):** `star-rating.tsx` rewritten to the flat floor()
  form — 5 direct `Star` svgs, `gap-1`, `fill-amber-400` for
  i < floor(rating), `text-border` otherwise; the `aria-label` a11y
  superset kept (invisible); `StarHalf` import gone.
- **BREADCRUMB-1 (T4):** `gap-2 mb-8`, `flex-wrap` dropped — the PDP's
  vertical rhythm (h1 at breadcrumb+76) restored; the pixel diff on the
  whole PDP dropped to 0.48%.
- **ICON-DRIFT-1 (T5):** `ShieldCheck→Shield`, `RefreshCw→RotateCcw`
  in `category-card.tsx` + the PDP feature row.
- **TITLE-404-1 (T6):** new `src/app/[...notFound]/page.tsx` (the
  catch-all) + shared `src/components/store/platform-404.tsx` (both
  `not-found.tsx` and the catch-all render it) + `notFoundPageTitle()`
  in `src/lib/format.ts` with `humanizeSlug` extended to `[-_]`
  splitting (unit-pinned: "FOO_BAR"→"FOO BAR", digit-leading words
  untouched). No-letter paths return `title: { absolute: "Lumina" }`.
  Route count 22 → 23.
- **SEARCH-CASE-1 (T7):** `capitalize` dropped; the suggestion category
  renders `toLowerCase()`. The E2E assertion needed `exact: true`
  (Playwright's `getByText` is case-insensitive by default — a test-bug
  fixed during GREEN, not a code bug).
- **Test bugs fixed during GREEN (not code bugs):** the feature-bar
  icon test initially scoped to one card instead of the grid (xpath
  ../../..); the search casing test needed exact matching; the
  TabsContent base `mt-6` discovery above.
- **Live-verification tooling:** `scripts/verify-session8.ts` (14
  checks incl. the 8th mobile-nav verification) +
  `scripts/capture-session8.ts` (screenshots 46-51) added;
  `scripts/vlm-sanity-session8.mjs` kept OUT of the repo's committed
  scripts (runs from a scratch dir with its own z-ai-web-dev-sdk install
  — the dependency stays pruned per session-7 DEPS-1).
