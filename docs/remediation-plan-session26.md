# Remediation Plan — Session 26 (Round 26): Reference-Drift Remediation (Hero + Header) + Payments Date-Range Filter

**Date:** 2026-10-09 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `3ca0168` (the session-25 ship `246852a` + the sign-off `6c8d682` + the session-49/50 logs)
**Status at audit start:** 416-test gate (198 unit+integration + 218 E2E), PAD v1.25, SKILL v1.25.0 — lint 0/0 · tsc clean · 198/198 unit+integration · build exit 0 (25 routes) · **the full E2E baseline re-run 218/218 (7.9m)** verified on the pulled workspace.

## 0. The round's mandate

The user's standing round instruction (the professional Stripe integration
verification, the full audit/parity workflow with the mobile-nav +
Tailwind v4 watches, the `.env`/db-root contract, the vitest + playwright
suites, the TDD remediation plan, the screenshots, the `.env.example`,
the docs, and the main-only push). The session-49/50 documented
round-26 candidates: the payments-surface date-range filter (PAY-OPS-3,
the superset item) — plus, discovered by this round's audit, a
**live reference-site drift family** the standing gates could not see.

## 1. Baseline verification (state at audit start)

- Workspace NOT reset — `git pull` fast-forwarded `6c8d682..3ca0168`
  (only `docs/session_50.md`, the user's session-log narrative). `.env`
  carries the repo contract `DATABASE_URL="file:../db/custom.db"`; the
  env-shadowing trap live as documented; the session-21 hard-link
  convergence INTACT (inode 395370 at BOTH `db/custom.db` paths).
- Baseline gate: lint 0/0 · tsc clean · 198/198 unit+integration (14
  files) · build exit 0 (25 routes) · **the full E2E baseline re-run
  218/218 (7.9m)** — the documented session-25 ship state verified
  pre-change.
- Skills mapped from `skills/skills-catalog.md`:
  **e-commerce-nextjs16-monorepo** (the round's primary — its
  media/CDN lesson family re-read; the reference-drift class is what
  its "re-measure, don't guess" discipline addresses), plus the
  standing set (agent-browser, tdd, clone-app-pat-pro). The session-25
  commit re-audited file-by-file (the payments page, the seam, the
  filter island, the webhook write path, the fixtures) — all hold.
- The 26th mobile-nav verification ran FIRST (the standing protocol,
  Playwright form, both sites authenticated, iPhone 14): TOKEN-EXACT
  PARITY on every check — panel 288px / bg rgb(251,250,249), nav flex
  gap-4 mt-8, 5 links 239×44 at 18px/500 with identical hrefs; the
  Electronics deep-link + auto-close passed.
- The standing watches + census: typeahead (the reference fires ZERO
  search requests), carousel cadence ~5000ms, the SEO layer
  (17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD), and the
  console census (24 routes + 7 admin surfaces incl. payments ×4
  variants) — all CLEAN.

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
"Home & Comfort" slide now serves
`19ea6418a_generated_c69d9eaa.png` (200, 1.8 MB PNG, verified
fetchable); the clone pins the old
`54a27de93_generated_4ebfd375.png` (now a PRODUCT image on the
reference — the headphones card's). Slides 1 ("Spring Collection
2026", `7cfe01108…`) and 2 ("Tech Essentials", `f0ae76854…`) are
unchanged. This is the pixel-sweep out-of-band root cause.

**(b) HERO-DRIFT-1b — the slide-2/3 CTA hrefs are now plain `/shop`.**
All three reference CTAs ("Shop Now" / "Explore" / "Browse") link to
`/shop` today (measured twice per slide via async polling evals). The
clone links slides 2/3 to `/shop?category=electronics` and
`/shop?category=home-living` — the session-1 measurements. A
functional divergence on a parity surface (clicking "Explore" lands
the reference shopper on the unfiltered shop; the clone's on the
electronics-filtered shop).

**(c) HEADER-DRIFT-1 — the header icon cluster tightened + the mobile
row re-structured.** The reference's icon cluster
(`search/heart/bag/user`) is `flex items-center gap-1` (156px wide at
desktop) where the clone uses `gap-2` (168px) — the 12px difference
shifts the `justify-between` nav row 6px right at 1024 (ref nav x=270
vs clone 264; the arithmetic: row 976 − children 660 = 316, half 158
→ nav at 270 exactly; the clone's 168 cluster → half 152 → 264). At
mobile (390px) the reference's row carries THREE children — the menu
button (16–52), the bare logo link (91–179), the icon cluster
(218–374) — while the clone wraps (menu + logo) in a `gap-4` group
(16–156) and ends its cluster at 206–374: the logo sits 23px left of
the reference's on every mobile page.

**The test-coverage gap (the systemic finding):** NO E2E spec pins the
hero slide images, the CTA hrefs, or the header row geometry — the
13-round pixel-sweep band held while the reference silently changed
its hero image and CTA targets. The standing gates (computed styles,
catalog order, money, a11y censuses, CWV/INP budgets) are all
content-agnostic on exactly these seams. The manual sweep caught what
the gate could not; this round converts the sweep's findings into
standing pins (§3.4).

### 2.2 The payments surface's remaining observability gap (PAY-OPS-3, the documented candidate)

The session-49 "suggested next steps" named the payments-surface
date-range filter as the natural round-26 superset candidate: an
operator triaging refund-needed payments asks "which events arrived
in THIS window?" — the surface offers family + intent/id filters but
no time narrowing. The `StripeEvent.receivedAt` column is already
indexed by the list ordering and the four canonical fixtures carry
staggered dates (2026-02-20/21/22/23), so the filter is demonstrable
with the seeded set and needs NO schema change.

### 2.3 Verified-healthy (no action)

The session-25 payment-ops seams (the refund-needed family, the
amount column, the intent helper) — hold. The webhook H4d/L9 contract
— holds. The 26th mobile-nav token parity — holds (the drawer panel
is unaffected by the header-row fix). The vitest + playwright suites
(198/218 green pre-change). The `.env` / `.env.example` / db-path
contracts — current (no new env plumbing this round). The SEO/a11y/
CWV/INP standing gates — all green in the baseline re-run.

## 3. Fix design (validated against the codebase)

### 3.1 HERO-DRIFT-1 (`src/app/(storefront)/page.tsx`)

- Slide 3 image →
  `https://media.base44.com/images/public/69d296f5d1237b9a1afec899/19ea6418a_generated_c69d9eaa.png`.
- Slide 2 href → `/shop`; slide 3 href → `/shop` (all three CTAs
  plain `/shop` — the live reference truth; the promo/title/subtitle/
  cta TEXT for every slide re-measured live and unchanged).
- The mobile-nav drawer links (the category hrefs) are a DIFFERENT
  surface — token-verified identical in the 26th A/B; untouched.

### 3.2 HEADER-DRIFT-1 (`src/components/store/header.tsx`)

- Unwrap the mobile `(menu + logo)` `gap-4` group: the menu Button
  and the Logo become DIRECT children of the
  `flex items-center justify-between h-16` row (the reference's
  structure — its hidden-at-lg menu button is a row sibling; at
  desktop `display:none` removes it from flex layout, so the desktop
  row is unchanged: logo 88 + nav + cluster).
- The icon cluster `gap-2` → `gap-1` (4px between the four 36px
  buttons — cluster 156px; the nav row lands at the reference's
  justify-between arithmetic at every viewport).
- The hover underline/nav-link classes are untouched (computed-style
  parity surfaces).

### 3.3 PAY-OPS-3 — the payments date-range filter (`src/lib/admin-payments.ts` + the page + the island)

- `parseAdminPaymentFilters` gains `from` / `to` (raw strings):
  validated as `YYYY-MM-DD` (a strict regex + Date round-trip); a
  bound that fails validation falls through to `undefined` (the
  family pattern — bad deep-links render the unfiltered list, never
  an error). `from > to` (as dates) drops the pair.
- `buildAdminPaymentWhere` composes the date clause
  `{ receivedAt: { gte: fromStart, lt: toEnd } }` where `fromStart` =
  the UTC day boundary of `from` (`Date.parse(from + "T00:00:00.000Z")`)
  and `toEnd` = the day AFTER `to` (exclusive) — `to`'s whole day is
  in range. Either bound may stand alone (from-only → gte; to-only →
  lt). The clause ANDs with the family + q branches (the nested-AND
  composition already proven by the refund-needed family).
- The page passes the parsed filters straight through (no extra
  query — the fixtures carry the dates; the count line + `take: 100`
  bound stay honest: the same where feeds `count`).
- The island (`admin-payment-filters.tsx`) gains two
  `<Input type="date">` fields ("From" / "To", aria-labelled) in the
  filter bar; changes push MERGED params (`?from=&to=` preserved with
  family/q) via the established `router.push` pattern; the Clear
  button resets everything (it already pushes the bare path).
- Zero parity risk (admin-only surface).

### 3.4 The standing content pins (the coverage-gap fix, `tests/e2e/storefront-parity.spec.ts`)

- **The hero content contract:** the 3 slide img srcs pinned to the
  hash tails (`7cfe01108…`, `f0ae76854…`, `19ea6418a…`) + the 3 CTA
  hrefs pinned to `/shop` (the clone renders all 3 slides in the DOM
  — crossfade — so the pins read directly; slide 1's "Shop Now" pin
  already exists in the CTA-geometry test and stays).
- **The header geometry contract:** at 1024×768 — the icon cluster's
  computed `column-gap: 4px` + the nav row's link-1 x-position 270
  (the justify-between arithmetic's observable); at 390×664 — the
  logo x=91 + the cluster x=218 (the three-child row's distribution).
  These convert the pixel sweep's manual catches into gate failures.

### 3.5 The tests

**Unit** (`src/lib/admin-payments.test.ts`, ~+9): the from/to parse
(valid pair kept, invalid strings dropped, from>to dropped, array
params, from-only, to-only); the where composition (both bounds →
gte/lt at UTC day boundaries, from-only → gte alone, family+dates
AND shape, family+q+dates triple AND shape, refund-needed+dates).

**E2E** (`tests/e2e/admin.spec.ts`, +3): the date-range deep-link
(`?from=2026-02-22&to=2026-02-23` → only the 22nd/23rd fixtures + the
count "2 payment events"); the from-only deep-link (from=2026-02-22
→ 2 events); the combined family+date filter (refund-needed +
from=2026-02-22 → only the n fixture + count 1).

**E2E parity pins** (`tests/e2e/storefront-parity.spec.ts`, +2): the
hero content contract + the header geometry contract (§3.4) — RED
first against the current code (the drift IS the red).

### 3.6 The docs

AGENTS.md (the HERO-DRIFT-1/HEADER-DRIFT-1 contracts + the content
pins + PAY-OPS-3), CLAUDE.md (the session-26 contract + counts),
README.md (the hero/header rows + the payments row + counts + the
26th verification), PAD v1.26 (ADR-034: the reference-drift
remediation + the content-pin lesson; the revision row + matrix),
`ecommerce-store_SKILL.md` v1.26.0 (L36 + the ADR-034 index entry),
`docs/session_51.md`, the worklog, this plan's sign-offs after the
push.

## 4. TDD plan

1. **RED (parity pins)** — write the hero content + header geometry
   tests first; verify they fail against the current code for the
   RIGHT reasons (the stale image/href/gap/structure).
2. **RED (unit)** — extend `admin-payments.test.ts` with the
   date-range contracts (the seam lacks from/to → the parse tests
   fail; the where tests fail).
3. **RED (E2E payments)** — the three date-range tests (the page
   ignores from/to today → unfiltered rows render).
4. **GREEN** — §3.1 (the hero fixes → the content pin green) → §3.2
   (the header fixes → the geometry pin green) → §3.3 (the seam →
   the island → the page wiring) in that order. Full unit +
   integration green; the targeted admin + parity specs green.
5. **Mutation efficacy (×3, each reverted, verified against
   pre-mutation backups):**
   - **M1 (the slide-3 image reverted)** → the hero content pin
     FAILS (the stale hash).
   - **M2 (the cluster gap reverted to gap-2)** → the header
     geometry pin FAILS (column-gap 8px).
   - **M3 (the receivedAt clause dropped from the where)** → the
     date-range E2E tests FAIL (unfiltered rows).
6. **Full gate** — `bun run lint && bun run typecheck && bun run test
   && bun run build && bun run test:e2e` — two consecutive full E2E
   runs on the FINAL code (kill servers by PORT only — the L25
   mirror lesson).
7. **Live re-verification** — the :3000 production server on the
   final build: the pixel sweep (home back IN the 0.28–0.68% band —
   the drift's proof-of-fix), the fresh mobile-nav token check (the
   header unwrap touches the mobile row), the standing watches, the
   full-route console census.
8. **Screenshots 141-145** — the hero parity proof (the sweep output
   + the live slide-3), the payments date-range filter live ×2, the
   unit gate, the E2E gate. VLM-verified.
9. **Docs** — §3.6; `.env.example` verified current (no new env
   plumbing this round).

## 5. Sign-off criteria

- [x] Baseline gate green at audit start (lint 0/0 · tsc clean ·
      198/198 unit+integration · build exit 0 · the full E2E baseline
      re-run 218/218 pre-change)
- [x] HERO-DRIFT-1 fixed: the slide-3 image + the three `/shop` CTA
      hrefs; the hero content pin standing
- [x] HEADER-DRIFT-1 fixed: the unwrapped mobile row + the gap-1
      cluster; the header geometry pin standing (desktop + mobile)
- [x] PAY-OPS-3 shipped: `?from=/to=` deep-linkable date filtering on
      the payments surface with honest count lines; unit + E2E pinned
- [x] The pixel sweep back IN-BAND on all 8 routes (home 0% — 6 px)
- [x] Mutation efficacy ×3 (the image revert, the gap revert, the
      clause drop), each reverted
- [x] RED → GREEN documented for every new test
- [x] Full gate green ×2 consecutive full E2E runs on the FINAL code;
      total test count grows 416 → 433 (no test removed or weakened)
- [x] Live re-verification: the mobile-nav token parity re-verified
      post-fix; the watches + census clean
- [x] Screenshots 141-145 under `docs/screenshots/` + VLM-verified (5/5)
- [x] Docs updated (AGENTS/CLAUDE/README/PAD v1.26/SKILL v1.26.0/
      session_51/worklog); `.env.example` verified current
- [x] Committed on `main` + pushed via the SSH wrapper (remote
      verified; the operator key shredded)
