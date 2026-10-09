# Session 51 — Round 26: Reference-Drift Remediation (Hero + Header) + Payments Date-Range Filter (HERO-DRIFT-1 + HEADER-DRIFT-1 + PAY-OPS-3, ADR-034)

**Date:** 2026-10-09 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `3ca0168` · **Deliverable commit:** (this round's `feat: session-26 …`)
**Plan:** `docs/remediation-plan-session26.md` · **ADR-034** (PAD v1.26) · **SKILL v1.26.0**

## 0. The round's mandate

The user's standing round instruction (the professional Stripe integration
verification, the full audit/parity workflow with the mobile-nav +
Tailwind v4 watches, the `.env`/db-root contract, the vitest + playwright
suites, the TDD remediation plan, the screenshots, the `.env.example`,
the docs, and the main-only push). The session-49 suggested-next-steps
named the payments-surface date-range filter as the natural round-26
superset candidate (PAY-OPS-3) — plus, discovered by this round's own
audit, a **live reference-site drift family** the standing gates could
not see (HERO-DRIFT-1 + HEADER-DRIFT-1).

## 1. Baseline verification (state at audit start)

- Workspace NOT reset — `git pull` fast-forwarded `6c8d682..3ca0168`
  (only `docs/session_50.md`, the user's session-log narrative). `.env`
  carries the repo contract `DATABASE_URL="file:../db/custom.db"`; the
  env-shadowing trap live as documented (the sandbox injects
  `DATABASE_URL` into the SHELL); the session-21 hard-link convergence
  INTACT (inode 395370 at BOTH `db/custom.db` paths, verified).
- Baseline gate: lint 0/0 · tsc clean · 198/198 unit+integration (14
  files) · build exit 0 (25 routes) · **the full E2E baseline re-run
  218/218 (7.9m)** — the documented session-25 ship state verified
  pre-change.
- Skills mapped from `skills/skills-catalog.md`:
  **e-commerce-nextjs16-monorepo** (the round's primary — its
  media/CDN lesson family re-read; the reference-drift class is exactly
  what its "re-measure, don't guess" discipline addresses), plus the
  standing set (agent-browser, tdd, clone-app-pat-pro). The session-25
  commit re-audited file-by-file (the payments page, the seam, the
  filter island, the webhook write path, the fixtures) — all hold.
- The 26th mobile-nav verification ran FIRST (the standing protocol,
  Playwright form, both sites authenticated, iPhone 14): token-exact
  parity on every check — panel 288px / bg rgb(251,250,249), nav flex
  gap-4 mt-8, 5 links 239×44 at 18px/500 with identical hrefs; the
  Electronics deep-link + auto-close passed.
- The standing watches + census: typeahead (the reference fires ZERO
  search requests), carousel cadence ~5000ms, the SEO layer (17-URL
  sitemap, robots, JSON-LD, offers.price 299.99 USD), and the console
  census (24 routes + 7 admin surfaces incl. payments ×4 variants) —
  all CLEAN.

## 2. Audit results

### 2.1 THE PRIMARY FINDING — the reference site drifted (HERO-DRIFT-1 + HEADER-DRIFT-1)

The round's pixel sweep (the standing 8-route drift watch) measured
**home 62.07% / 57.19%** on two consecutive runs — far out of the
documented 0.28–0.68% baseline band (all 7 other routes in-band).
Diff-band localization isolated rows 53–67 (the header nav row) and
109–607 (the hero region). Live A/B measurement on the reference
(agent-browser + Playwright, authenticated) found THREE reference-side
changes, every one confirmed by direct DOM measurement:

**(a) HERO-DRIFT-1a — the slide-3 image changed.** The reference's
"Home & Comfort" slide now serves `19ea6418a_generated_c69d9eaa.png`
(200, 1.8 MB PNG, verified fetchable); the clone pinned the old
`54a27de93_generated_4ebfd375.png` (now a PRODUCT image on the
reference — the headphones card's). Slides 1 ("Spring Collection
2026", `7cfe01108…`) and 2 ("Tech Essentials", `f0ae76854…`) are
unchanged. This is the pixel-sweep out-of-band root cause.

**(b) HERO-DRIFT-1b — the slide-2/3 CTA hrefs are now plain `/shop`.**
All three reference CTAs ("Shop Now" / "Explore" / "Browse") link to
`/shop` today (measured twice per slide via async polling evals). The
clone linked slides 2/3 to `/shop?category=electronics` and
`/shop?category=home-living` — the session-1 measurements. A
functional divergence on a parity surface (clicking "Explore" lands
the reference shopper on the unfiltered shop; the clone's on the
electronics-filtered shop).

**(c) HEADER-DRIFT-1 — the header icon cluster tightened + the mobile
row re-structured.** The reference's icon cluster
(`search/heart/bag/user`) is `flex items-center gap-1` (156px wide at
desktop) where the clone used `gap-2` (168px) — the 12px difference
shifts the `justify-between` nav row 6px right at 1024 (ref nav x=270
vs clone 264; the arithmetic: row 976 − children 660 = 316, half 158
→ nav at 270 exactly; the clone's 168 cluster → half 152 → 264). At
mobile (390px) the reference's row carries THREE children — the menu
button (16–52), the bare logo link (91–179), the icon cluster
(218–374) — while the clone wrapped (menu + logo) in a `gap-4` group
(16–156) and ended its cluster at 206–374: the logo sat 23px left of
the reference's on every mobile page.

**The test-coverage gap (the systemic finding):** NO E2E spec pinned
the hero slide images, the CTA hrefs, or the header row geometry — the
13-round pixel-sweep band held while the reference silently changed
its hero image and CTA targets. The standing gates (computed styles,
catalog order, money, a11y censuses, CWV/INP budgets) are all
content-agnostic on exactly these seams. The manual sweep caught what
the gate could not; this round converts the sweep's findings into
standing pins (§3.4).

### 2.2 The payments surface's remaining observability gap (PAY-OPS-3)

The session-49 "suggested next steps" named the payments-surface
date-range filter as the natural round-26 superset candidate: an
operator triaging refund-needed payments asks "which events arrived
in THIS window?" — the surface offered family + intent/id filters but
no time narrowing. The `StripeEvent.receivedAt` column is already
indexed by the list ordering and the four canonical fixtures carry
staggered dates (2026-02-20/21/22/23), so the filter is demonstrable
with the seeded set and needs NO schema change.

### 2.3 Verified-healthy (no action)

The session-25 payment-ops seams (the refund-needed family, the
amount column, the intent helper) — hold. The webhook H4d/L9 contract
— holds. The 26th mobile-nav token parity — holds (the drawer panel
is unaffected by the header-row fix; re-verified post-fix). The
vitest + playwright suites (198/218 green pre-change). The `.env` /
`.env.example` / db-path contracts — current (no new env plumbing
this round). The SEO/a11y/CWV/INP standing gates — all green in the
baseline re-run.

## 3. The TDD execution trail

1. **RED (parity pins)** — the hero-content contract + the two
   header-geometry contracts written first
   (`tests/e2e/storefront-parity.spec.ts`); verified RED against the
   drifted code for the RIGHT reasons (the stale hash
   `54a27de93…` received; the cluster at column-gap 8px; the
   wrapped mobile row).
2. **RED (unit)** — `admin-payments.test.ts` extended with the
   date-range contracts (+10: the from/to parse — valid pair kept,
   invalid strings dropped, from>to dropped, array params,
   from-only, to-only; the where composition — both bounds at UTC
   day boundaries, open-ended ranges, family+dates, the refund-
   needed+q+dates triple AND, q+dates): 10 failures verified.
3. **RED (E2E payments)** — the four date-range tests (the deep-link
   pair, the from-only bound, the family+date combined shape, the
   merged-params push — strengthened with the succeeded-family
   discriminator: `ORD-2026-003` is a succeeded-family member
   excluded by the date bound, so the combined test cannot pass
   pre-fix).
4. **GREEN (in the plan's order)** — §3.1 the hero fixes
   (`HERO_SLIDES`: slide-3 image + all CTAs `/shop`) → §3.2 the
   header fixes (the unwrapped mobile row + `gap-1` cluster) → §3.3
   the seam (the composable-AND refactor + `parseDateBound` + the
   `receivedAt` clause) → the island (two URL-controlled date
   inputs + the canonical param order) → the page wiring. 208/208
   unit+integration (+10); the targeted specs: payments 14/14,
   storefront-parity 33/33.
5. **Two GREEN-phase corrections (both caught by the tests
   themselves):** (a) the merged-params URL order — a Select change
   on a date-filtered URL appended `family` LAST (the island's props
   are the PRE-navigation state) producing the unstable deep-link
   `?from=…&family=…`; fixed with the CANONICAL param re-emission
   (family, q, from, to — deterministic pushed URLs, pinned by the
   merged-params test's regex). (b) the mobile header pin's locator
   — `getByRole("navigation")` is invisible at 390 (display:none);
   located via the banner's LUXE logo link instead (the locator
   lesson, documented in AGENTS.md).
6. **Mutation efficacy ×3 (each reverted, verified byte-exact against
   the pre-mutation backups):** (1) **M1** the slide-3 image reverted
   → the hero-content pin FAILS (the stale hash); (2) **M2** the
   cluster gap reverted to `gap-2` → the desktop geometry pin FAILS
   (column-gap 8px); (3) **M3** the `receivedAt` clause dropped from
   the where → ALL FOUR date-range E2E tests FAIL (the unfiltered
   rows render).
7. **Full gate** — lint 0/0 · tsc clean · 208/208 unit+integration ·
   build exit 0 (25 routes) · **225/225 E2E, two consecutive full
   runs on the FINAL code** (7.7m + 7.8m).

## 4. The live A/B verification (round 26, post-fix)

- **The pixel sweep (the drift's proof-of-fix):** ALL 8 ROUTES AT THE
  BASELINE BAND — **home 0% (6 px)** (was 62.07% out-of-band), shop
  0.05%, pdp 0.34%, cart 0.01%, wishlist 0%, checkout 0.01%, account
  0%, login 0.28%.
- **The mobile-nav token parity re-verified post-header-unwrap** (the
  header fix touches the mobile row): all 10 checks PASS — panel
  288px / bg rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at
  18px/500 with identical hrefs; the functional deep-link +
  auto-close passed. The drawer is unaffected by the row restructure.
- **The standing watches:** typeahead — the reference fires ZERO
  search requests; the carousel cadence stable at ~5000ms; the SEO
  layer re-verified (17-URL sitemap, robots, JSON-LD,
  offers.price 299.99 USD).
- **The console census:** 24 routes + 7 admin surfaces (the payments
  route ×4 variants) — ZERO console errors/pageerrors.
- **Screenshots 141–145** (the hero parity proof — the sweep output +
  the live slide-3; the payments date-range live ×2 — the deep-link
  pair + the family+date combined shape; the unit gate; the E2E
  gate): **VLM 5/5 PASS** (142 re-verified with the corrected
  newest-first row-order description — the first FAIL was my
  description's error, not the screenshot's; the transient SDK
  reverted; package.json + bun.lock restored).

## 5. The deliverable

**HERO-DRIFT-1 + HEADER-DRIFT-1 (ADR-034) + PAY-OPS-3** — the
reference-drift remediated, the drift class converted into standing
gate failures, and the payments surface's time-window triage:

- The slide-3 hero image re-pinned to the reference's regenerated
  media (`19ea6418a_generated_c69d9eaa.png`) + all three CTA hrefs at
  plain `/shop` (the live reference truth, twice-measured per slide).
- The header row restructured to the reference's: the menu Button +
  the Logo as DIRECT row children (the mobile three-child
  justify-between distribution — logo x=91, cluster x=218 at 390) +
  the icon cluster at `gap-1` (156px — the nav row lands at the
  reference's x=270 arithmetic at every desktop viewport).
- **The standing content pins** (the coverage-gap fix): the
  hero-content contract (3 img srcs by hash tail + 3 CTA hrefs, read
  via DOM traversal) + the header-geometry contracts (column-gap 4px
  + cluster 156 + nav x=270 at 1024; the three-child distribution at
  390) — the reference's next silent media/link/geometry drift is a
  gate failure.
- **PAY-OPS-3**: `?from=`/`?to=` deep-linkable date filtering on the
  payments surface — strict YYYY-MM-DD validation (bad deep-links
  render the unfiltered list, never an error), the UTC-day-boundary
  `receivedAt` clause (gte from's midnight, lt the midnight after
  to), the composable-AND where refactor (every pre-session-26 shape
  byte-identical), and two URL-controlled date inputs pushing merged
  params in the canonical order.

**Gate at ship:** lint 0/0 · tsc clean · 208/208 unit+integration
(+10) · build exit 0 (25 routes) · 225/225 E2E (+7) = **433 total** —
two consecutive full runs on the FINAL code.

## 6. Suggested next steps

- Provide Stripe test-mode keys (`sk_test`/`pk_test` + a webhook
  endpoint) to exercise the full Payment Element flow live — the
  integration gates already cover the webhook contract, and the
  payments surface will show real events (with amounts, refund-needed
  triage, honest charge-family intent ids, and now the date-window
  narrowing).
- Wire an email provider to activate the verification/reset delivery
  (the console.info seams are ready).
- The next parity audit should re-run the hero-content + header
  geometry pins against the LIVE reference periodically (the pins
  hold the current truth; a legitimate reference regeneration is a
  RED that requires a conscious re-measure round — the correct
  friction).
