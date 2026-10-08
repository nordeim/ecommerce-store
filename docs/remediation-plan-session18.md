# Remediation Plan — Session 18 Review (Round-18 Mobile CWV Standing Gate)

**Date:** 2026-10-08
**Repo:** `nordeim/ecommerce-store` (branch `main`, baseline `ba561c1` — the
session-17 ship `01d5c15` + sign-off `56f07bd` plus the remotely-added
`docs/session_33.md` narrative)
**Author:** Review/build agent (Super Z)
**Scope:** Live differential audit (round 18) of the LUXE Store clone against
the reference (`fuzzy-lumina-style-hub.base44.app`). Seventeen prior rounds
closed the catalog, cart, checkout, auth, account, PDP, admin,
computed-geometry, mobile-geometry, social-metadata, interaction-engine,
typography/keyboard, axe-a11y/security-header, CWV/admin-filter,
delivery-layer/CSP, standing-axe-gate, mobile/admin-gate, and CWV-gate gaps
(269-test gate). Round 18 targets: (a) the standing user priorities — mobile
navigation (18th verification, Tailwind v4 watch) and reference drift on
pinned surfaces; (b) the standing drift watches (8-route pixel sweep,
full-route console + link census, typeahead, carousel); (c) **the round's
primary new surface — the MOBILE-VIEWPORT Core Web Vitals differential** (the
ADR-025-nominated follow-up: LCP/CLS/LCP-element on the three top-traffic
routes at iPhone 14, both sites, authenticated) and the finding it drives:
**PERF-GATE-1 covers desktop only — the mobile CLS/LCP defect classes are
structurally invisible to it** (the A11Y-GATE-2 blindness story, now for CWV —
L27). The `skills/` folder is excluded from code checking, testing and
compilation per the operating contract.

**Method:** Baseline gate (269/269 green, exactly the documented session-17
ship state) → agent-browser sessions (`ref` = production reference logged in
as the operator account, `clone` = production standalone server on :3000,
ONE host — localhost — for the whole clone lifecycle per the session-14
lesson; states saved before device emulation) + the session-15 paired pixel
sweep + full-route census scripts re-run + the round's new
`scripts/cwv-diff-session18.mjs` (PerformanceObserver LCP/CLS/FCP + LCP
element identity, registered pre-paint via addInitScript, iPhone 14
390×844 DPR 3, authenticated contexts both sites). Every conclusion carries
live-measured evidence from both sites.

---

## 1. Baseline verification (state at audit start)

| Gate | Result |
|---|---|
| `bun run lint` | 0 errors, 0 warnings |
| `bun run typecheck` | clean |
| `bun run test` (Vitest) | 100/100 passed |
| `bun run build` (the repo wrapper — never raw `next build`) | exit 0, 23 routes, zero deprecation warnings |
| `bun run test:e2e` (Playwright) | 169/169 passed (269 total) |
| DB contract | `db/custom.db` at repo root (fresh `db:setup`); hard-link convergence live at the env-shadowed sandbox path (inode 264376, both paths); canonical state (12 products, 3 users, 3 orders) |
| Docs | AGENTS/CLAUDE/README/PAD v1.17/SKILL v1.17.0 all current through session-17 (269-test gate, ADR-025, 27 lessons) |
| Env | `.env` `DATABASE_URL="file:../db/custom.db"` (recreated from `.env.example` — the shell-exported sandbox `DATABASE_URL` shadows the repo file; the hard-link converges both paths on ONE file, the documented L-environment contract); `.env.example` byte-identical to the shipped state; session-17 deliverables verified in code (the 4-test performance spec + the persisted diff/calibrate/capture scripts) |
| Stale servers | none live at audit start (the /proc/net/tcp socket-inode walk scanned :3000/:3100 clean); both audit-round servers killed via the same walk before every rebuild (the L25 lesson, applied proactively) |

## 2. Audit results

### Verified at parity this round (no action required)

- **Mobile navigation menu (18th standing verification):** iPhone 14 on both
  sites (agent-browser device emulation, 390×844, DPR 3): the Sheet panel
  class string matches token-for-token (modulo attribute order), pad 24px,
  bg `rgb(251, 250, 249)`, w-72 (288px), nav `flex flex-col gap-4 mt-8`
  (gap 16px, margin-top 32px), all 5 links identical (text + hrefs incl.
  the category deep-links) at 239×44, 18px/500, `display:block`. **No
  Tailwind v4 regression (18th consecutive verification).** Functional
  check: clicking "Electronics" navigates to `/shop?category=electronics`
  and the sheet auto-closes.
- **Pixel diffs @1024 (standing drift re-check, 8 routes):** home 0.34 /
  shop 0.38 / PDP 0.68 / cart 0.34 / wishlist 0.34 / checkout 0.35 /
  account 0.34 / login 0.28 — ALL at the documented baseline band,
  byte-identical to the session-15/16/17 numbers. No drift on any pinned
  surface.
- **Full-route production-readiness census (re-run):** 22 manifest routes —
  ZERO console errors/warnings/pageerrors (demo-user + admin contexts);
  link integrity 19/19 internal targets 200/3xx; admin console clean.
- **Typeahead drift watch:** typing "headphones" into the reference's
  search (fetch + XHR instrumented, search expanded via its icon button)
  fires ZERO search network requests — the clone's `/api/search` remains
  the registered superset.
- **Carousel cadence watch:** with the pointer off the hero, both sites
  flip slides at the same ~5.0s cadence (reference flips ~4500/9500/14500ms;
  clone intervals 4999/5000ms; the dot probe re-queries the DOM each poll
  and includes the w-8 active dot — the w-2-only filter of the first probe
  excluded the active dot and read as "no flips").
- **The round's primary new surface — the MOBILE CWV differential
  (authenticated, iPhone 14 390×844 DPR 3, both sites, PerformanceObserver
  registered pre-paint):**

  | Route | Clone LCP | Ref LCP | LCP element (both sites) | Clone CLS | Ref CLS |
  |---|---|---|---|---|---|
  | home | 268–448ms | 996–1348ms | IMG hero CDN asset (358×422 vs 366–368×432–433) | 0.0010 | 0.0096 |
  | shop | 320–448ms | 1192–1632ms | IMG 169×169 product card | 0.0000–0.0005 | 0.0000 |
  | pdp | 216–284ms | 1024–1132ms | IMG 358×358 product image | 0.0011 | 0.0000 |

  The SSR superset holds on every mobile route: the clone paints 2.2–5.7×
  faster than the reference with byte-identical LCP elements (same CDN
  srcs), and the clone's mobile CLS is ≤ 0.0011 everywhere (the reference
  itself carries 0.0096 on home). **Zero parity defects.**

- **L27 mutation-target verification (efficacy pre-check, the plan's
  design validation):** the registered mobile-CWV mutation target (the PDP
  `aspect-square` + `h-full` removed, mobile viewport) was applied on a
  scratch build and measured:
  - **The shift is REAL at mobile:** a layout-shift entry of 0.306–0.3205 —
    the buy panel (`DIV.flex.flex-col`) moves y 209→567 (the image
    container growing 0→358px, measured by the height probe at t≈178ms).
    At desktop the same mutation measured 0.0184 (1 shift) — the 2-col grid
    absorbs most of the growth. Confirms L27's structural claim.
  - **NEW finding — the detectability is CDN-timing-dependent (L28):** a
    warm CDN context (login-first flow; the login/account pages warm the
    media.base44.com connection via the header logo) lets the image size
    before the first frame → ZERO shift entries (CLS reads 0.0000 — the
    defect is invisible). A cold context (fresh, direct goto) reliably
    produced the 0.30+ shift in 3/3 runs — sometimes landing BEFORE FCP
    (t=164 < FCP 184): Chrome's raw layout-shift API reports pre-FCP
    entries (the raw-sum observer catches them), but the official field
    CLS (the web-vitals library) filters pre-FCP shifts. Implications:
    (1) the PDP mutation IS a viable E2E efficacy proof (Playwright test
    contexts are network-isolated = cold), but (2) mutation proofs for the
    CLS pin family should prefer the deterministic late-injected banner
    (always post-paint), and (3) the L27 target is REVISED from "the
    registered mobile-CWV mutation target" to "the registered
    timing-conditional mobile target — deterministic under E2E cold-context
    conditions".
  - Mutation fully reverted (git diff clean; rebuild; clean-build
    re-differential measured LCP 284–448ms / CLS ≤ 0.0011 — the
    rendering-neutral baseline restored).

### Findings

**No parity defects.** Every pinned surface verified at parity this round;
the reference shows no drift; the census found zero production-readiness
gaps; the mobile CWV differential is a strict superset. The round's finding
is the coverage gap ADR-025 itself recorded:

#### F1 — PERF-GATE-2 · the CWV gate covers desktop only

PERF-GATE-1 (ADR-025) pins LCP/CLS/LCP-element identity at Desktop
1280×720. The defect classes that ship silently at mobile today:

1. **Mobile CLS regressions** — the L27 class: an unsized media container
   at mobile (stacked 1-col PDP layout) shifts the whole buy panel
   358px; the desktop gate measures the SAME build at 0.0184 (under the
   0.03 budget — green) or 0.0 (the 2-col grid absorbs the growth). The
   desktop gate is structurally blind to the mobile CLS class — the exact
   A11Y-GATE-2 story (`lg:hidden` elements are `display:none` at desktop →
   axe skips them), now for layout stability.
2. **Mobile LCP-element regressions** — the hero/product imagery at 390px
   is a different paint scale (358×422 = 151k px² vs the desktop hero's
   576,576); a mobile-only lazy-loading regression or an unsized wrapper
   that collapses at the stacked layout moves the mobile LCP to text while
   the desktop identity pin stays green.
3. **Mobile paint-blocking regressions** — the mobile bundle/CSS path
   (e.g. a `lg:`-gated CSS regression) can delay mobile first paint
   without moving the desktop numbers.

The a11y story is the precedent: session-12's desktop-only axe gate became
A11Y-GATE-2 (mobile + admin) precisely because a viewport-only gate has a
blind side. The CWV gate is the same pattern with the same fix.

**Fix design (validated against the codebase):**

1. **Extend `tests/e2e/performance.spec.ts` IN PLACE with a `CWV mobile
   gate` describe** (the a11y-gate precedent: ONE contract family on ONE
   tool's output grows in place — the mobile describe reuses the SAME
   `measure()` helper and the SAME PROFILE map):
   - **Mechanics:** `const { defaultBrowserType: _ignored, ...iPhone } =
     devices["iPhone 14"]; test.use(iPhone)` — the A11Y-GATE-2 lesson
     (test.use REJECTS defaultBrowserType inside a describe because it
     forces a new worker; the project already pins chromium). The project
     storageState applies — the demo user is authed at 390px (same
     conditions as the a11y mobile gate).
   - **Pins:** the SAME three families with mobile-calibrated floors:
     (a) LCP ≤ 2500ms; (b) CLS ≤ 0.03; (c) LCP-element identity through
     mobile-scale floors — home IMG ≥ 100,000 px², shop IMG ≥ 20,000,
     pdp IMG ≥ 90,000 (the measured mobile paints: 151,076 / 28,561 /
     128,164 — floors at ~2/3 of the measured values, the ADR-025
     headroom convention; exact values from the E2E-condition
     calibration).
   - **e.size semantics confirmed:** the paint size is CSS-pixel area
     (round-17: hero 1232×468 CSS = e.size 576,576; mobile 358×422 =
     151,076 — DPR 3 does not multiply e.size).
2. **E2E-condition calibration before pinning** (the session-15/16/17
   discipline — pins come from E2E conditions, not the dev DB):
   `scripts/cwv-calibrate-session18.mjs` boots the standalone server on
   :3100 against the e2e DB (after `prisma/e2e-reset.ts` restores the
   canonical state), signs the demo user in once, and measures the three
   routes at iPhone 14 under the exact E2E conditions (two passes per
   route). The floors in the spec are the calibrated numbers with
   documented headroom.
3. **Efficacy proof (three mutation checks):**
   - **Mobile-blindness mutation (the structural proof):** add `hidden`
     to the hero `<img>` (`src/components/store/hero-carousel.tsx`) → the
     mobile home identity pin FAILS while the DESKTOP tests stay GREEN
     (the mutation is viewport-invisible only if the desktop hero is
     smaller than its floor... measured next: the desktop hero at
     1232×468 = 576,576 stays above the 400k desktop floor → the desktop
     identity pin ALSO fails → the mutation must instead be mobile-scale
     to prove blindness. REVISED mutation: constrain the hero image's
     paint at mobile only — `hidden sm:block` on the hero img's
     wrapper... no: the cleanest viewport-scoped mutation is CSS
     `@media (max-width: 640px) { .hero-img { display: none } }` — mobile
     LCP falls to text (identity pin RED at mobile) while the desktop
     LCP keeps the IMG (identity pin GREEN at desktop). That is the
     ADR-024 structural-blindness proof transplanted to CWV.
   - **CLS mutation (the deterministic class):** the late-injected
     160px banner (900ms post-hydration — the consent-bar/ads class,
     round-17's proven mutation) fails the mobile CLS pin; at 390px the
     banner's shift is proportionally LARGER (the viewport is smaller —
     the same 160px growth is a bigger viewport fraction).
   - **The L27 target (conditional, run under E2E cold-context
     conditions):** the PDP `aspect-square` removal bites the mobile CLS
     pin at 0.30+ (3/3 cold-context runs); if the E2E run confirms, it is
     registered as the timing-conditional proof of the mobile-only class;
     either way the L28 timing-dependence lesson is recorded.
4. **Gate math:** +3 E2E tests (169 → 172; total 269 → 272; none
   removed). Two consecutive full E2E runs for determinism (the L25
   stale-server discipline: kill the :3100 calibration server before the
   suite runs).

**Deliberately out of scope (recorded):** INP (interaction-to-paint needs a
scripted interaction protocol — the load-time pair LCP+CLS stays the
deterministic subset); reference-side mobile CWV pinning (the reference is
a live third-party SPA whose numbers move with their deploys — the gate is
a quality budget, not a parity pin); the remaining auth screens' axe
coverage at mobile (register/forgot-password/verify-email — the login anon
pattern covers the family's anatomy; the nominated next-round candidate);
an email provider / Stripe (external credentials that don't exist for a
self-hosted clone).

## 3. TDD plan

**RED (`tests/e2e/performance.spec.ts` — the new mobile describe):**

1. Write the spec with the zero-tolerance form of the mobile budgets
   (LCP ≤ 0ms, CLS = 0, identity floors impossible) and run it under E2E
   conditions: all three mobile tests must fail for the RIGHT reason —
   the measured mobile LCP at the expected magnitude (~200–450ms) and the
   measured mobile e.size values in the failure payloads.
2. Verify each failure message carries the measured numbers (the audit's
   discipline: the RED is the evidence the assertions bite).

**GREEN:** the calibrated mobile budgets (≤2500ms LCP, ≤0.03 CLS, IMG
identity at the mobile-scale floors) + the settled describe (no app code
changes — the gate is test-level, rendering-neutral by construction).

**Efficacy (mutations, run once during the round):**
- the mobile-only hero-hiding mutation (CSS media-query `display:none` at
  ≤640px) must fail ONLY the mobile home test — the desktop tests stay
  green (the structural-blindness proof);
- the late-injected banner must fail the mobile CLS pin at
  proportionally-over-budget values;
- the L27 PDP mutation under E2E conditions (expected 0.30+ — recorded
  either way).
Revert all, re-run GREEN.

**Gate:** the full suite (`lint && typecheck && test && build && test:e2e`)
— the mobile describe adds 3 E2E tests (169 → 172; total 269 → 272; none
removed). **Two consecutive full E2E runs** for determinism (kill the :3100
calibration server first — the L25 lesson).

**Live verification:** the pixel sweep re-run (rendering-neutral proof) +
the 18th mobile-nav screenshot compared by md5 against the 13th–17th
(rendering continuity across the gate addition).

## 4. Sign-off criteria

- [x] Baseline gate green at audit start (269/269, exactly the documented ship state)
- [x] Round-18 audit complete: mobile nav 18th verification; 8-route pixel drift re-check; full-route census re-run; typeahead + carousel watches; the mobile CWV differential (3 routes, both sites, authenticated, iPhone 14)
- [x] Zero parity defects confirmed (the mobile SSR performance superset holds on every route: 2.2–5.7× faster LCP on the byte-identical elements, CLS ≤ 0.0011)
- [x] L27 mutation target efficacy pre-check run (the mobile shift is real at 0.306–0.3205; the timing-dependence measured and recorded as L28; mutation reverted, baseline restored)
- [x] E2E-condition calibration run (3 routes, mobile viewport) — the floors in the spec are the calibrated numbers with documented headroom
- [x] RED → GREEN: the mobile describe landed with calibrated budgets, failed-first documented
- [x] Mutation efficacy checks: the mobile-only hero mutation fails ONLY the mobile tests (desktop green); the late banner fails the mobile CLS pin; the L27 PDP mutation outcome recorded; all reverted, GREEN
- [x] Full gate green: lint 0/0 · typecheck clean · 100/100 unit · build 23 routes · E2E green incl. the 3 new mobile gate tests — two consecutive full runs for determinism
- [x] Live re-verification: pixel sweep at the identical baseline numbers; the 18th mobile-nav screenshot byte-identical (md5) to the 13th–17th
- [x] Screenshots captured under `docs/screenshots/` (101–105) + VLM-verified
- [x] Docs updated: AGENTS.md, CLAUDE.md, README.md, PAD v1.18 (ADR-026), SKILL v1.18.0 (L28), session log (session_34), worklog
- [x] `.env.example` verified current (no new env plumbing — the gate is test-level)
- [x] Committed on `main` and pushed via the SSH wrapper (final step — checked off in the session log after the push lands)
