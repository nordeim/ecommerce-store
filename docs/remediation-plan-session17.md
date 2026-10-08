# Remediation Plan — Session 17 Review (Round-17 CWV Standing Performance Gate)

**Date:** 2026-10-08
**Repo:** `nordeim/ecommerce-store` (branch `main`, baseline `2d09d1c` — the
session-16 ship `715b8ff` plus the remotely-added `docs/session_31.md`
narrative)
**Author:** Review/build agent (Super Z)
**Scope:** Live differential audit (round 17) of the LUXE Store clone against
the reference (`fuzzy-lumina-style-hub.base44.app`). Sixteen prior rounds
closed the catalog, cart, checkout, auth, account, PDP, admin,
computed-geometry, mobile-geometry, social-metadata, interaction-engine,
typography/keyboard, axe-a11y/security-header, CWV/admin-filter,
delivery-layer/CSP, standing-axe-gate, and mobile/admin-gate gaps (266-test
gate). Round 17 targets: (a) the standing user priorities — mobile navigation
(17th verification, Tailwind v4 watch) and reference drift on pinned
surfaces; (b) the standing drift watches (8-route pixel sweep, full-route
console + link census, typeahead, carousel); (c) **the round's primary new
surface — the MULTI-ROUTE Core Web Vitals differential** (round-13 measured
home only; this round extends LCP/CLS/LCP-element to the three top-traffic
routes on BOTH sites, authenticated) and the finding it drives: **round-13's
one-time CWV audit has no standing regression gate**. The `skills/` folder is
excluded from code checking, testing and compilation per the operating
contract.

**Method:** Baseline gate (266/266 green, exactly the documented session-16
ship state) → agent-browser sessions (`ref` = production reference logged in
as the operator account, `clone` = production standalone server on :3000,
ONE host — localhost — for the whole clone lifecycle per the session-14
lesson; states saved before device emulation) + the session-15 paired pixel
sweep + full-route census scripts re-run + the round's new
`scripts/cwv-diff-session17.mjs` (PerformanceObserver LCP/CLS/FCP + LCP
element identity, registered pre-paint via addInitScript, authenticated
contexts both sites). Every conclusion carries live-measured evidence from
both sites.

---

## 1. Baseline verification (state at audit start)

| Gate | Result |
|---|---|
| `bun run lint` | 0 errors, 0 warnings |
| `bun run typecheck` | clean |
| `bun run test` (Vitest) | 100/100 passed |
| `bun run build` (the repo wrapper — never raw `next build`) | exit 0, 23 routes, zero deprecation warnings |
| `bun run test:e2e` (Playwright) | 166/166 passed (266 total) |
| DB contract | `db/custom.db` at repo root; hard-link convergence live at the env-shadowed sandbox path (inode 172348, both paths); canonical state |
| Docs | AGENTS/CLAUDE/README/PAD v1.16/SKILL v1.16.0 all current through session-16 (266-test gate, ADR-024, 26 lessons) |
| Env | `.env` `DATABASE_URL="file:../db/custom.db"`; byte-identical to `.env.example`; session-16 deliverables verified in code (the 3-describe a11y spec + `axe-core@4.14.0` pin + the persisted axe-diff/calibrate/census/sweep/capture scripts) |
| Stale servers | the leftover :3000 standalone server from the prior session found via the /proc/net/tcp socket-inode walk and killed BEFORE the first rebuild (the L25 lesson, applied proactively) |

## 2. Audit results

### Verified at parity this round (no action required)

- **Mobile navigation menu (17th standing verification):** iPhone 14 on both
  sites (agent-browser device emulation, 390×844, DPR 3): the Sheet panel
  class string matches token-for-token (modulo attribute order), pad 24px,
  bg `rgb(251, 250, 249)`, w-72 (288px), nav `flex flex-col gap-4 mt-8`
  (gap 16px, margin-top 32px), all 5 links identical (text + hrefs incl.
  the category deep-links) at 239×44, 18px/500, `display:block`. **No
  Tailwind v4 regression (17th consecutive verification).** Functional
  check: clicking "Electronics" navigates to `/shop?category=electronics`
  and the sheet auto-closes.
- **Pixel diffs @1024 (standing drift re-check, 8 routes):** home 0.34 /
  shop 0.38 / PDP 0.68 / cart 0.34 / wishlist 0.34 / checkout 0.35 /
  account 0.34 / login 0.28 — ALL at the documented baseline band,
  byte-identical to the session-15/16 numbers. No drift on any pinned
  surface.
- **Full-route production-readiness census (re-run):** 22 manifest routes —
  ZERO console errors/warnings/pageerrors (demo-user + admin contexts);
  link integrity 19/19 internal targets 200/3xx.
- **Typeahead drift watch:** typing "headphones" into the reference's
  search (fetch + XHR instrumented) fires ZERO search network requests —
  the clone's `/api/search` remains the registered superset.
- **Carousel cadence watch:** with the pointer off the hero, both sites
  flip slides at the same ~5.0s cadence (reference interval 4968ms; clone
  intervals 4962/4968ms — identical within measurement resolution; the
  dot probe re-queries the DOM each poll because the reference's DOM-swap
  carousel replaces the dot elements).
- **The round's primary new surface — the MULTI-ROUTE CWV differential
  (authenticated, Desktop 1280×720, both sites, PerformanceObserver
  registered pre-paint):**

  | Route | Clone LCP | Ref LCP | LCP element (both sites) | Clone CLS | Ref CLS |
  |---|---|---|---|---|---|
  | home | 248ms | 1008ms | IMG hero, the byte-identical CDN asset | 0.0010 | 0.0061 |
  | shop | 460ms | 1132ms | IMG 288×288 product card | 0.0006 | 0.0000 |
  | pdp | 252ms | 968ms | IMG 584×584 product image | 0.0011 | 0.0000 |

  The SSR superset holds on every route: the clone paints 2–4.5× faster
  than the reference with the byte-identical LCP elements, and the clone's
  CLS is ≤ 0.0011 everywhere (better than or equal to the reference's
  0.0000–0.0061). **Zero parity defects.**

  **Methodological finding (recorded):** the reference AUTH-GATES every
  route for anonymous visitors — a fresh anonymous context renders the
  login screen client-side ON the requested URL (measured: home returned
  the "Welcome back" H1 as the LCP element with a 401 in the console). The
  CWV differential therefore measures authenticated state on both sites
  (the same conditions as the pixel sweep). Round-13's reference-side
  hero-image LCP (1576ms) reproduces only under authentication — the
  round-13 measurement ran in authenticated agent-browser sessions, which
  is why it saw the hero image.

### Findings

**No parity defects.** Every pinned surface verified at parity this round;
the reference shows no drift; the census found zero production-readiness
gaps. The round's finding is the coverage gap round-13 itself left open:

#### F1 — PERF-GATE-1 · the Core Web Vitals have no standing regression gate

Round-13 quantified the performance superset once (home only). This round
extended the measurement to the three top-traffic routes and re-confirmed
it — but the differential remains a MANUAL audit script that no CI gate
runs. The defect classes it would catch ship silently today:

1. **LCP-element regressions** — the hero image failing to eager-load
   (a stray `loading="lazy"`, a broken CDN pin, an accidental
   `opacity-0` wrapper) silently changes the LCP element to text; nothing
   fails, the pixel sweep still diffs 0.34% (the late-arriving image
   eventually paints).
2. **CLS regressions** — an unsized media container or a late-loading
   banner pushes layout after first paint (the classic
   reserved-space defect class — the PDP's `aspect-square` container and
   the hero's `h-[50vh]` wrapper are the two load-bearing reservations);
   the computed-style specs measure the SETTLED state and cannot see it.
3. **Paint-blocking regressions** — a bundle/CSS regression that delays
   first paint (LCP blows past any human-noticeable threshold).

The a11y story repeats: session-12's manual axe differential became
A11Y-GATE-1/2 (ADR-023/024) precisely because one-time audits rot. The CWV
differential is the same pattern with the same fix.

**Fix design (validated against the codebase):**

1. **New spec `tests/e2e/performance.spec.ts`** (a new spec file, not an
   extension — the a11y gate grows in place because it is ONE contract on
   ONE tool's output; the performance gate is a different contract family
   with its own mechanics; the repo's spec-per-concern layout [smoke,
   storefront-parity, accessibility, …] is the precedent):
   - **Mechanics:** a `collectCwv(page)` helper — `page.addInitScript`
     registers the PerformanceObservers (LCP + CLS, `buffered: true`)
     BEFORE first paint (the same registration the differential used —
     the timing is load-bearing: post-load registration misses buffered
     entries); per LCP entry, capture `startTime`, `size`, the element
     tag, and the element's bounding geometry AT ENTRY TIME (the
     reference's DOM-swap carousel replaces elements — geometry captured
     in the observer callback survives re-renders); `page.goto(route,
     networkidle)` → `document.fonts.ready` → short settle → read.
   - **Routes:** home `/`, shop `/shop`, PDP `/product/wireless-headphones`
     (the three top-traffic surfaces measured in the differential). The
     project's storageState applies (the demo user — the surfaces render
     authed chrome, matching the a11y gate's conditions).
   - **Pins (budget form — a QUALITY gate, like the admin axe census; the
     reference's slower numbers are not a parity target):**
     (a) **LCP budget:** each route's final LCP ≤ 2500ms (measured
     248–460ms live; the headroom absorbs CDN variance while catching
     paint-blocking regressions at 5–10× the measured value);
     (b) **CLS budget:** each route's CLS ≤ 0.03 (measured
     0.0006–0.0011 live; round-13's long-window 0.0213 stays inside —
     the budget catches the unsized-media class at 0.1+);
     (c) **LCP-element identity:** the largest LCP entry is an IMG on
     every route; on home its paint size is at the calibrated hero-image
     floor (the byte-identical LCP-element contract from rounds 13/17).
2. **E2E-condition calibration before pinning** (the session-15/16
   discipline — pins come from E2E conditions, not the dev DB):
   `scripts/cwv-calibrate-session17.mjs` boots the standalone server on
   :3100 against the e2e DB (after `prisma/e2e-reset.ts` restores the
   canonical state), signs the demo user in once, and measures the three
   routes under the exact E2E conditions (Desktop Chrome 1280×720 +
   storageState semantics). The budgets in the spec are the calibrated
   numbers with documented headroom.
3. **Efficacy proof (two mutation checks, one per pin family):**
   - **LCP-element mutation:** add `loading="lazy"` to the hero
     `<img src={slide.image}>` (`src/components/store/hero-carousel.tsx`)
     → the hero no longer eager-loads → the home LCP-element identity pin
     FAILS (no hero-sized IMG entry; the LCP falls to text) → revert →
     GREEN.
   - **CLS mutation:** remove the PDP image container's `aspect-square`
     reservation and the img's `h-full` (`src/app/(storefront)/product/
     [slug]/page.tsx`) → the unsized image collapses the container, then
     shifts layout on image load → the PDP CLS pin FAILS → revert →
     GREEN.

**Deliberately out of scope (recorded):** mobile-viewport CWV pins (the
mobile a11y extension took its own round — ADR-024; the mobile CWV
extension is the nominated follow-up, it needs its own calibration pass
and a mobile-sized element-identity floor); reference-side CWV pinning
(the reference is a live third-party SPA whose numbers move with their
deploys — the gate is a quality budget, not a parity pin); INP
(interaction-to-paint needs a scripted interaction protocol — the
load-time pair LCP+CLS is the deterministic subset; INP is a future
candidate); an email provider / Stripe (external credentials that don't
exist for a self-hosted clone); the remaining auth screens' axe coverage
at mobile (the login anon pattern covers the family's anatomy — a
next-round candidate).

## 3. TDD plan

**RED (`tests/e2e/performance.spec.ts`):**

1. Write the spec with the zero-tolerance form of the budgets (LCP ≤ 0ms,
   CLS = 0, element identity exact) and run it under E2E conditions: all
   three tests must fail for the RIGHT reason — the measured LCP value
   present at the expected magnitude (e.g. `expect(lcp).toBeLessThanOrEqual(0)`
   fails with the actual ~250–500ms value; the failure documents the
   baseline as a DELIBERATE quality contract before the budget lands).
2. Verify each failure message carries the measured numbers (the audit's
   discipline: the RED is the evidence the assertions bite).

**GREEN:** the calibrated budgets (≤2500ms LCP, ≤0.03 CLS, IMG identity +
hero floor) + the settled spec (no app code changes — the gate is
test-level, rendering-neutral by construction).

**Efficacy (mutations, run once during the round):** the two mutations
above — the LCP-element mutation must fail ONLY the home test (the element
identity pin; the LCP budget may stay green since text paints fast — that
is the point of the identity pin); the CLS mutation must fail the PDP test
at an order of magnitude above the budget. Revert both, re-run GREEN.

**Gate:** the full suite (`lint && typecheck && test && build && test:e2e`)
— the new spec adds 3 E2E tests (166 → 169; total 266 → 269; none
removed). **Two consecutive full E2E runs** for determinism (the L25
stale-server discipline applies: kill the :3100 calibration server before
the suite runs).

**Live verification:** the pixel sweep re-run (rendering-neutral proof) +
the 17th mobile-nav screenshot compared by md5 against the 13th–16th
(rendering continuity across the gate addition).

## 4. Sign-off criteria

- [x] Baseline gate green at audit start (266/266, exactly the documented ship state)
- [x] Round-17 audit complete: mobile nav 17th verification; 8-route pixel drift re-check; full-route census re-run; typeahead + carousel watches; the multi-route CWV differential (3 routes, both sites, authenticated)
- [x] Zero parity defects confirmed (the SSR performance superset holds on every route: 2–4.5× faster LCP on the byte-identical elements, CLS ≤ 0.0011)
- [x] E2E-condition calibration run (3 routes) — the budgets in the spec are the calibrated numbers with documented headroom
- [x] RED → GREEN: the spec landed with calibrated budgets, failed-first documented
- [x] Mutation efficacy checks: the lazy-hero mutation fails the home LCP-element identity pin; the unsized-PDP-image mutation fails the PDP CLS pin; both reverted, GREEN
- [x] Full gate green: lint 0/0 · typecheck clean · 100/100 unit · build 23 routes · E2E green incl. the 3 new gate tests — two consecutive full runs for determinism
- [x] Live re-verification: pixel sweep at the identical baseline numbers; the 17th mobile-nav screenshot byte-identical (md5) to the 13th–16th
- [x] Screenshots captured under `docs/screenshots/` (96–100) + VLM-verified
- [x] Docs updated: AGENTS.md, CLAUDE.md, README.md, PAD v1.17 (ADR-025), SKILL v1.17.0, session log (session_32), worklog
- [x] `.env.example` verified current (no new env plumbing — the gate is test-level)
- [x] Committed on `main` and pushed via the SSH wrapper (final step — checked off in the session log after the push lands)
