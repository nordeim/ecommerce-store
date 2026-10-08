# Remediation Plan — Session 21 (Round 21): The INP Standing Gate (PERF-GATE-3)

**Date:** 2026-10-09 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `51b6bbb` (the session-20 ship `24b9c75` + the sign-off + the session-log commits)
**Status at audit start:** 296-test gate (104 unit + 192 E2E), PAD v1.20, SKILL v1.20.0 — verified green in ONE run at the fresh clone (lint 0/0 · tsc clean · 104/104 unit · build 23 routes exit 0 · 192/192 E2E).

## 1. Baseline verification (state at audit start)

- Fresh `git clone` (the workspace had been reset); `.env` recreated from `.env.example`; the env-shadowing trap live (the shell exports `DATABASE_URL=file:/home/z/my-project/db/custom.db` which wins over the repo `.env` — the documented sandbox trap) — `bun run db:setup` run with the repo URL inline, then the hard-link convergence restored (inode 174897 at BOTH paths; `tests/db-path.test.ts` contract 15/15 green inside the unit run).
- No stale servers at audit start (the `/proc/net/tcp` walk scanned :3000/:3100 clean).
- All root docs + `docs/session_38.md` + `docs/remediation-plan-session20.md` + `worklog.md` + `docs/session_39.md` reviewed — everything current through session-20 (ADR-028: the `/reset-password` parity route + the SEO standing gate + the JSON-LD layer; L30/L31 lessons).
- Skills mapped from `skills/skills-catalog.md`: agent-browser, tdd, clone-app-pat-pro, code-quality-standards, tailwind-patterns, nextjs-react-expert (the round's standing set). The session-20 commit audited clean (test-level + additive code; the reset-token lib follows the Session sha256 pattern; the JSON-LD data blocks sit outside pinned child lists).

## 2. Audit results

### 2.1 The standing watches (all green — zero drift)

- **The 21st mobile-nav verification** (agent-browser sessions `ref` + `clone`, iPhone 14 390×664, states saved before device emulation, ONE host = localhost for the clone lifecycle): the Sheet panel class string token-identical (w-72 → 288px, p-6 → pad 24px, bg `rgb(251,250,249)`, `h-full` → 664px, the same Radix `data-[state]` transition classes), the nav `flex flex-col gap-4 mt-8`, all 5 links byte-identical (Home/Shop/Electronics/Clothing/Accessories at 239×44, 18px/500, block, the same hrefs incl. the category deep-links, the same colors incl. the active-Home primary orange). Functional check: "Electronics" deep-links to `/shop?category=electronics` and the sheet auto-closes. **No Tailwind v4 regression (21st consecutive verification).**
- **Pixel drift sweep** (`scripts/sweep-session21.mjs`, the persisted session-19 sweep): all 8 routes at the documented baseline band — home 0.34 / shop 0.38 / PDP 0.68 / cart 0.34 / wishlist 0.34 / checkout 0.35 / account 0.34 / login 0.28% — byte-identical to the session-15…20 numbers.
- **Typeahead watch:** the reference fires ZERO search network requests (fetch + XHR instrumented; search expands via its icon button) — the documented baseline.
- **Carousel cadence watch:** both sites flip at the same ~5.0s stable interval (ref 4000/5000ms — the first shorter interval is the probe's mid-cycle entry artifact; clone 4850/5000ms via the active-slide probe).
- **Full-route console census** (`scripts/census-session21.mjs`): 24 routes + 3 admin surfaces — ZERO console errors / pageerrors.
- **SEO layer re-verified** (the user's standing round instruction): the clone's sitemap census 17 URLs (5 curated static + 12 products), the robots rule block (4 private disallows), the JSON-LD nodes on home + PDP — all green in the baseline E2E run (the seo.spec standing gate); the reference's own sitemap unchanged (10 app routes, zero products).

### 2.2 The round's primary new surface — the FIRST INP (Interaction to Next Paint) differential

`scripts/inp-diff-session21.mjs` — the last Core Web Vitals family member (LCP/CLS are pinned by PERF-GATE-1/2; INP was the session-20 nomination: "the deterministic next CWV family — needs a repeatably-driven interaction set like the cart stepper or the search typeahead").

**Method:** a scripted, repeatable 5-interaction protocol on BOTH sites, authenticated, fresh context per surface (buffered event entries are page-scoped):

| # | Surface | Interaction | Reference | Clone |
|---|---|---|---|---|
| 1 | `pdp-atc+heart` | PDP "Add to Cart" + the wishlist heart | client-state mutation | server action + revalidate |
| 2 | `search-typing` | 4 keys "head" into the search (250ms apart) | SPA dropdown | /api/search typeahead |
| 3 | `drawer-stepper` | cart drawer stepper "+" | client state | transactional delta server action |
| 4 | `carousel-next` | hero carousel next button | DOM-swap slide | crossfade slide |

**Two methodological discoveries (built into the script):**

1. **Synthetic `evaluate(() => el.click())` generates ZERO interaction entries** — `interactionId` only attaches to real input events dispatched through the browser input pipeline (CDP `Input.dispatchMouseEvent`). Playwright locator clicks and `keyboard.type` are trusted; `evaluate`-driven DOM `.click()` is not. An INP protocol MUST use trusted clicks — the first script draft measured "0 interactions everywhere" until this was diagnosed.
2. **The default observer threshold hides fast interactions** — `PerformanceObserver.observe({type: "event"})` defaults to `durationThreshold: 16`, under which sub-16ms interactions never surface. The collector uses `durationThreshold: 0` (the web-vitals-library approach) so every interaction lands.

**Universal structural locators** (the reference's icon-only buttons are UNLABELED — the labeled clone buttons are the a11y superset): the header search button = `header button:has(svg.lucide-search)`; the header cart button = `:has(svg.lucide-shopping-bag)`; the PDP heart = the action row `div.flex.items-center.gap-4.mb-4`'s LAST button (both sites: [-][+][ATC][heart] — the heart at 82px); the drawer "+" = `[role="dialog"] div.gap-2 button:has(svg.lucide-plus)`; the carousel next = `button:has(svg.lucide-chevron-right)`. The reference's cart is client state — the drawer flow stays ON ONE page (a full reload resets it; verified live).

**Results (both viewports, both sites, authenticated):**

| Surface | ref desktop | clone desktop | ref iPhone | clone iPhone |
|---|---|---|---|---|
| pdp-atc+heart | 24ms | 16ms | 40ms | 32ms |
| search-typing | 32ms | 40ms | 24ms | 24ms |
| drawer-stepper | 48ms | 48ms | 40ms | 32ms |
| carousel-next | 24ms | 48ms | 16ms | 40ms |

**ZERO parity defects** — both sites are deep in Google's "good" band (≤200ms; the max measured is 48ms). The architecture-level finding: **the clone's server-action mutations paint as fast as the reference's client-state mutations** (React 19 transitions keep the main thread free through the action dispatch — the worst clone surface, the transactional stepper, matches the reference's client-side stepper at 48/48ms desktop). The clone's carousel-next is 48ms vs the ref's 24ms (the 3-slide crossfade paints a larger changed region than the DOM swap) — still 4x inside the good line, a QUALITY note, not a defect.

**The gap: INP has no regression gate.** The PERF-GATE-1/2 standing gates pin LCP/CLS/identity — a main-thread-blocking regression (a long synchronous task in an event handler, layout thrash in a mutation handler, a blocking action dispatch that prevents React from painting the pending state) ships silently today. The defect classes:

- A synchronous busy-wait / long task inside any exercised click handler → INP 400ms+ → users feel it, no gate fails.
- A forced-synchronous-layout pattern (read-write-read-write geometry in a mutation handler) → next paint delayed → INP up.
- A blocking server-action dispatch (a synchronous pre-await task in an action wrapper) → the pending state never paints before the response → INP = full roundtrip.

### 2.3 The E2E-condition calibration (the session-15/16/17/18 discipline)

`scripts/inp-calibrate-session21.mjs` — the protocol against the EXACT gate conditions: the :3100 standalone production server, the e2e DB (pushed + seeded + reset), GUEST contexts (the zero-pollution design — see §3), both viewports, 2 runs each:

| Surface | desktop run1/run2 | iPhone run1/run2 |
|---|---|---|
| pdp-atc+heart | 16 / 24ms | 24 / 24ms |
| search-typing | 32 / 40ms | 24 / 24ms |
| drawer-stepper | 56 / 56ms | 40 / 32ms |
| carousel-next | 48 / 48ms | 40 / 40ms |

Calibrated max: 56ms. **Budget: INP ≤ 200ms per surface** (the ADR-025 convention — budget at the Google "good" line; 3.5-12.5x headroom over the calibration, exactly the LCP gate's headroom philosophy).

## 3. Fix design (validated against the codebase)

**INP-GATE-1 (PERF-GATE-3):** a new `INP interaction gate` describe in `tests/e2e/performance.spec.ts` (the PERF-GATE-1/2 file — the standing CWV home) — 10 tests = 5 surfaces × 2 viewports (one test per surface — ATC, heart, search, stepper, carousel — so a failure names the exact surface):

- **The state-pollution-free design — GUEST contexts:** the spec opts OUT of the project storageState (`test.use({ storageState: { cookies: [], origins: [] } })` — the guest-cart.spec precedent). The guest cart/wishlist live in the context's cookie token and die with the test — ZERO e2e.db pollution, ZERO cross-spec coupling (the cart/wishlist specs assert absolute counts; an authed INP protocol would seed the demo user's cart mid-suite — and `wishlist.spec.ts` sorts AFTER `performance.spec.ts` alphabetically, so its heart-toggle assertions would read the polluted state). The guest UI paths are the identical interaction surfaces (guest-cart.spec proves the cookie-token ATC → drawer → stepper path; guest wishlist hearts work; the reference comparison itself auth-gated nothing about the interaction paint paths).
- **The collector:** `page.addInitScript` with `PerformanceObserver({type: "event", buffered: true, durationThreshold: 0})` collecting `{name, duration, interactionId}` — pre-load registration (the PERF-GATE-1 lesson), zero threshold (the discovery in §2.2).
- **Trusted clicks only:** Playwright locator clicks (`:has()` structural locators — §2.2's universal set); the search surface types via `keyboard.type`. NO `evaluate(() => el.click())` anywhere in the protocol (synthetic clicks generate no interaction entries — the §2.2 discovery).
- **The pins:** per-surface `INP ≤ 200ms` (the good line; 3.5-12.5x headroom over the E2E calibration). A QUALITY gate, not a parity pin (the reference's numbers are not the target — the same distinction as the CWV budgets; the differential documents both sites' magnitudes).
- **Both viewports:** the desktop describe + the `test.use({...devices["iPhone 14"]})` describe with `defaultBrowserType` stripped (the A11Y-GATE-2 in-describe constraint) + the storageState opt-out — the mobile-only interaction defect class (a touch-only handler regression) is invisible at desktop.
- **Mutation targets (dual):** (1) a ~400ms synchronous busy-wait injected at the top of the drawer stepper's `onClick={() => adjustQuantity(item.id, 1)}` (`src/components/store/cart-drawer.tsx` line 70) → the drawer-stepper surface fails at ~400ms while the other four stay green; (2) the same busy-wait in the carousel's next handler `onClick={() => go(index + 1)}` (`src/components/store/hero-carousel.tsx` line 143) → the carousel-next surface fails alone. Both reverted (git-diff clean).

**Why a busy-wait (not a fetch/timeout):** only SYNCHRONOUS main-thread work delays the next paint — an `await setTimeout` yields and paints. A 400ms `while (performance.now() - t0 < 400) {}` loop in the handler is the minimal deterministic reproduction of the long-task defect class the gate exists to catch.

## 4. TDD plan

1. **RED:** write the 10-test gate with the zero-tolerance budget form (`inpMax: 0` — impossible) → every test fails for the RIGHT reason: the failure payload carries the measured per-surface INP (16-56ms, the expected magnitude) + the interaction table.
2. **GREEN:** set the real budgets (200ms/surface) → 10/10 green.
3. **Mutation efficacy (dual, one at a time, rebuild, run, verify the failure REASON, revert):** mutation 1 (stepper busy-wait) fails ONLY drawer-stepper at ~400ms; mutation 2 (carousel busy-wait) fails ONLY carousel-next; all other surfaces green both times; both reverted → 10/10 green again.
4. **Full gate:** `bun run lint && bun run typecheck && bun run test && bun run build && bun run test:e2e` — two consecutive full E2E runs for determinism (the L25 stale-server discipline before each: the /proc walk kills any :3100 owner).
5. **Live re-verification:** the :3000 production server restarted on the current build; the pixel sweep re-run (all 8 routes at baseline — a test-only change is rendering-neutral); the 21st mobile-nav screenshot already captured (md5 continuity vs the 13th-20th from the standing audit).
6. **Screenshots:** 116-120 — the INP differential table (both viewports), the 21st mobile-nav verification, the INP gate live run, the dual mutation efficacy proof, the E2E-condition calibration table. VLM-verified.
7. **Docs:** AGENTS.md (the INP-GATE-1 contract + the L32/L33 lessons), CLAUDE.md (the session-21 contract + counts), README.md (the INP row + the 21st verification), PAD v1.21 (ADR-029 + revision row + the Known-Issues gap/resolution), SKILL v1.21.0 (the lessons + the ADR index), `docs/session_40.md` (the English log), the worklog, this plan's sign-off checked off after the push.

## 5. Sign-off criteria

- [x] Baseline gate green at audit start (296/296, exactly the documented session-20 ship state, one run)
- [x] Round-21 audit complete: mobile nav 21st verification; 8-route pixel drift re-check; typeahead + carousel watches; full-route console census; the SEO layer re-verified (the user's standing instruction); the FIRST INP differential (both sites, both viewports, authenticated)
- [x] The INP architecture finding recorded: the clone's server-action mutations paint as fast as the reference's client-state mutations (16-56ms everywhere, both viewports) — the React 19 transition superset
- [x] The INP standing gate: 10 tests = 5 surfaces × 2 viewports, guest contexts (zero DB pollution), trusted-click protocol, durationThreshold-0 collector, INP ≤ 200ms budgets (the good line, 3.5-12.5x headroom)
- [x] Dual mutation efficacy proven (the stepper busy-wait fails only drawer-stepper; the carousel busy-wait fails only carousel-next; both reverted)
- [x] RED → GREEN for every test, failed-first documented (zero-tolerance form → measured payloads → real budgets)
- [x] Full gate green: lint 0/0 · typecheck clean · unit green · build 23 routes · E2E green incl. the +10 new tests — two consecutive full runs
- [x] Live re-verification: pixel sweep at the identical baseline numbers; the 21st mobile-nav verification captured in the audit
- [x] Screenshots captured under `docs/screenshots/` (116-120) + VLM-verified
- [x] Docs updated: AGENTS.md, CLAUDE.md, README.md, PAD v1.21 (ADR-029 + revision row), SKILL v1.21.0, session log (session_40), worklog
- [x] `.env.example` verified current (no new env plumbing — the gate reuses the e2e server contract)
- [ ] Committed on `main` and pushed via the SSH wrapper (final step — checked off in the session log after the push lands)
