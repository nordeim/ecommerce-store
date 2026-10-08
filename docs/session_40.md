# Session 40 Log — Round-21 INP Standing Gate (ADR-029, PERF-GATE-3)

**Date:** 2026-10-09 · **Agent:** Super Z (review/build) · **Branch:** `main`
**Baseline:** `51b6bbb` (the session-20 ship `24b9c75` + the sign-off
commit + the session-log commits)

## Timeline

1. The workspace had been reset — fresh `git clone` of
   `nordeim/ecommerce-store`; `.env` recreated from `.env.example`. The
   env-shadowing trap live from the first command (the shell exports
   `DATABASE_URL=file:/home/z/my-project/db/custom.db` which WINS over the
   repo `.env`) — `bun run db:setup` run with the repo URL inline, then the
   hard-link convergence restored (inode 174897 at BOTH paths; the
   `tests/db-path.test.ts` contract holds). Reviewed all root docs +
   `docs/session_38.md` + `docs/remediation-plan-session20.md` +
   `worklog.md` + `docs/session_39.md` — everything current through
   session-20 (PAD v1.20, SKILL v1.20.0, the 296-test gate, 31 lessons).
   No stale servers live at audit start (the `/proc/net/tcp` walk scanned
   :3000/:3100 clean). The round's :3000 server detached via the
   double-fork orphan pattern; the calibration :3100 server likewise.
2. **Baseline gate:** lint 0/0 · tsc clean · 104/104 unit · build exit 0
   (23 routes, zero deprecation warnings) · 192/192 E2E = **296** —
   exactly the documented session-20 ship state, one run.
3. Skills mapped from `skills/skills-catalog.md` (agent-browser, tdd,
   clone-app-pat-pro, code-quality-standards, tailwind-patterns,
   nextjs-react-expert); the session-20 commit audited clean (the
   reset-token lib follows the Session sha256 pattern; the JSON-LD data
   blocks sit outside pinned child lists; the seo/axe specs pin the
   layer).
4. **Round-21 live A/B audit** (agent-browser sessions `ref` + `clone`;
   the clone on the production standalone server at :3000, ONE host —
   localhost — for the whole lifecycle per L22; states saved before
   device emulation; both sessions logged in — the operator account on
   the reference, the demo user on the clone):
   - **Mobile nav (21st standing verification):** iPhone 14 both sites —
     the Sheet panel class string token-identical (w-72 → 288px, p-6 →
     pad 24px, bg `rgb(251,250,249)`, h-full 664px), the nav `flex
     flex-col gap-4 mt-8`, all 5 links byte-identical (239×44, 18px/500,
     block, the same hrefs incl. the category deep-links, the same
     colors). Functional check: "Electronics" deep-links to
     `/shop?category=electronics` and the sheet auto-closes (the ref's
     sheet stays open — the documented deliberate divergence). **No
     Tailwind v4 regression (21st consecutive verification).**
   - **Standing drift watches:** pixel diffs @1024 on 8 routes — ALL at
     the documented baseline band (home 0.34 / shop 0.38 / PDP 0.68 /
     cart 0.34 / wishlist 0.34 / checkout 0.35 / account 0.34 / login
     0.28). Typeahead watch: the reference fires ZERO search network
     requests. Carousel cadence watch: both sites flip at the same ~5.0s
     stable interval. Full-route console census (24 routes + 3 admin):
     ZERO errors/pageerrors. **SEO layer re-verified** (the standing
     round instruction): the sitemap census 17 URLs, the robots rule
     block, the JSON-LD nodes — all green in the baseline E2E run; the
     reference's own sitemap unchanged.
   - **The round's primary new surface — the FIRST INP differential**
     (`scripts/inp-diff-session21.mjs`, the session-20 nomination: "the
     deterministic next CWV family"): a scripted 5-interaction protocol
     (PDP add-to-cart · PDP wishlist heart · search typing · drawer
     stepper · carousel next) on BOTH sites at BOTH viewports
     (1280×720 + iPhone 14 390×664), authenticated, fresh context per
     surface, entries collected by `PerformanceObserver(type "event",
     buffered, durationThreshold: 0)` grouped by `interactionId`.
     **ZERO parity defects** — every surface on both sites at 16–48ms,
     deep in Google's good band (≤200ms). The architecture-level
     finding: **the clone's server-action mutations paint as fast as
     the reference's client-state mutations** (React 19 transitions
     keep the main thread free through the action dispatch — the worst
     clone surface, the transactional stepper, matches the reference's
     client-side stepper at 48/48ms desktop).
   - **Two methodological discoveries (L32/L33):** (1) synthetic
     `evaluate(() => el.click())` generates ZERO interaction entries —
     the first script draft measured "0 interactions everywhere"
     because `interactionId` attaches only to input events dispatched
     through the browser input pipeline; Playwright locator clicks and
     `keyboard.type` are trusted. (2) the observer's default
     `durationThreshold` (16ms) hides fast interactions — the collector
     pins 0. The universal structural locators (the reference's
     icon-only buttons are unlabeled — the a11y superset):
     `header button:has(svg.lucide-search)` / `:has(svg.lucide-shopping-bag)`;
     the PDP heart = the action row's LAST button (both sites:
     [-][+][ATC][heart], the heart at 82px); the drawer "+" =
     `[role="dialog"] div.gap-2 button:has(svg.lucide-plus)`; carousel
     next = `button:has(svg.lucide-chevron-right)`. The reference's
     cart is client state — the drawer flow stays ON ONE page (a full
     reload resets it; verified live).
5. **The E2E-condition calibration** (the session-15/16/17/18
   discipline): `scripts/inp-calibrate-session21.mjs` ran the protocol
   against the exact gate conditions (:3100 standalone, e2e DB pushed +
   seeded + reset, GUEST contexts — the zero-pollution design, both
   viewports, 2 runs each): 16–56ms everywhere. **Budget: INP ≤ 200ms
   per surface** (the good line, 3.5–12.5x headroom).
6. **The remediation plan written and validated**
   (`docs/remediation-plan-session21.md` — the guest-context
   state-pollution design checked against the spec-order coupling
   (wishlist.spec sorts AFTER performance.spec), the mutation targets
   verified in the code (cart-drawer.tsx line 70 / hero-carousel.tsx
   line 143), the trusted-click requirement baked into the protocol).
7. **TDD RED:** the zero-tolerance form (inpMax: 0 — impossible): all 10
   tests failed for the RIGHT reason — the failure payloads carried the
   measured per-surface INP (56–72ms desktop, 16–56ms mobile) + the
   full interaction tables. The 7 pre-existing CWV tests stayed green.
8. **TDD GREEN:** the real budgets (200ms/surface) → 17/17 on the
   performance spec. One TS fix on the way: the DOM lib's
   `PerformanceObserverInit` lacks `durationThreshold` — the options
   object is cast (documented in the spec).
9. **Dual mutation efficacy check** (one at a time, rebuild via
   `bun run build`, kill the stale :3100 via the /proc walk, run, verify
   the failure REASON, revert, GREEN):
   - **Mutation 1 — the drawer stepper busy-wait:** a 400ms
     synchronous busy-wait at the top of the "+" handler
     (cart-drawer.tsx) → ONLY the drawer-stepper tests FAIL at
     432/416ms (~400ms + overhead, 2x over budget) at BOTH viewports;
     the other 8 INP tests + 7 CWV tests stay green.
   - **Mutation 2 — the carousel next busy-wait:** the same 400ms
     busy-wait in the slide-advance handler (hero-carousel.tsx
     `go(index+1)`) → ONLY the carousel-next tests FAIL at 456/448ms;
     everything else green.
   - Both reverted (git-diff clean — the round's production-code delta
     is ZERO lines) → 17/17 green again. Why a busy-wait: only
     SYNCHRONOUS main-thread work delays the next paint (an `await
     setTimeout` yields) — the minimal deterministic long-task
     reproduction of the defect class the gate exists to catch.
10. **Gate at ship:** lint 0/0 · tsc clean · 104/104 unit · build exit 0
    (23 routes) · **202/202 E2E = 306 total** (was 296; +10, none
    removed) — **two consecutive full E2E runs** for determinism (the
    L25 stale-server discipline before each).
11. **Live re-verification:** the :3000 production server restarted on
    the current build; pixel re-diff — all 8 routes at the identical
    baseline numbers (the first pass read cart 12.74% / checkout 47.45%
    OUT OF BAND — the INP differential's cart/wishlist residue in the
    dev DB, the documented dev-cleanup class; `bun
    prisma/dev-cleanup.ts` restored the baseline numbers exactly).
    **The 21st mobile-nav screenshot is BYTE-IDENTICAL (md5
    `05de11678965f30a85f9196c2ec43bae`) to the 13th through the 20th**
    — nine consecutive rounds of rendering continuity. The diff script
    (`scripts/inp-diff-session21.mjs`) + the calibration script
    (`scripts/inp-calibrate-session21.mjs`) + the census script
    (`scripts/census-session21.mjs`) + the sweep script
    (`scripts/sweep-session21.mjs`) + the capture script
    (`scripts/capture-session21.ts`) + the VLM verification script
    (`scripts/vlm-verify-session21.mjs`) persisted.
12. **Screenshots:** 5 new (116–120 — 116 the INP differential table,
    117 the 21st mobile-nav verification, 118 the INP gate live run,
    119 the dual mutation efficacy proof, 120 the E2E-condition
    calibration) → 121 total. VLM-verified 5/5 (via the SDK's
    `createVision`; the transient SDK install reverted). Dev-DB hygiene
    run clean. `.env.example` verified current (no new env plumbing —
    the gate reuses the e2e server contract).
13. **Docs:** AGENTS.md (the PERF-GATE-3 contract + the L32/L33
    lessons), CLAUDE.md (the session-21 contract, 104 unit / 202 E2E),
    README.md (306 tests, the INP row, 21st verification), PAD v1.21
    (ADR-029 + revision row + the Known-Issues Resolved row + matrix
    31/306), SKILL v1.21.0 (L32/L33 + the ADR-index entry), this
    session log, the worklog.

## Key decisions

- **Zero parity defects → the round's deliverable is the gate (the
  session-17/18/19 pattern):** the INP differential's finding is an
  architecture-level confirmation (the React 19 transition superset —
  server-action mutations paint as fast as client-state mutations), and
  the gap it exposed is coverage: interaction latency had no regression
  pin. PERF-GATE-3 completes the CWV standing-gate family (LCP + CLS +
  identity + INP, each at both viewports, each mutation-proven).
- **The guest-context design (the state-pollution problem):** an authed
  INP protocol would seed the demo user's cart mid-suite (the ATC +
  stepper surfaces) and toggle the PDP heart — `wishlist.spec.ts` sorts
  AFTER `performance.spec.ts` alphabetically and asserts absolute
  counts, so the coupling would break it. The guest contexts
  (`storageState` opt-out — the guest-cart.spec precedent) confine the
  cart/wishlist to the context's cookie token, which dies with the
  test: zero e2e.db pollution, and a failed test's pollution dies with
  it too (no cleanup step to skip).
- **The trusted-click requirement (L32) is the gate's load-bearing
  methodology:** a synthetic-click protocol would measure nothing
  forever; the locator-based structural clicks (the `:has()` icon
  selectors) work identically on both engines because the reference's
  icon buttons are unlabeled (the labeled clone buttons are the a11y
  superset — the name-based locators would only match the clone).
- **The budget sits at the good line (200ms), not at the measurement:**
  the ADR-025 convention (LCP ≤ 2500ms with 168–460ms measured) —
  budgets with 2.8–12.5x headroom catch the regression class (long
  tasks land at 400ms+) without flaking on run variance (the harness
  overhead alone inflates values 15–30%).
- **The busy-wait is the minimal deterministic mutation (the L28
  lesson applied):** only synchronous main-thread work delays the next
  paint; an async delay yields and paints. The 400ms busy-wait in a
  handler reproduces the defect class exactly, deterministically, at
  both viewports.

`docs/remediation-plan-session21.md` records the full audit trail.

## Suggested next steps

Round-22 candidates: the INP gate's protocol could grow the authed
interaction surfaces (the account tabs, the checkout wizard steps) if a
per-user guest-like isolation pattern lands (a dedicated fixture user
with its own e2e-reset restoration — the resetuser precedent); an email
provider to activate the ADR-011 verification gate + the ADR-028 reset
delivery (external credentials); or Stripe Payment Element (ADR-007's
documented next step, external credentials). Just say the word.

## Ship

Committed on `main` and pushed via `docs/ssh_git_wrapper_v3.py` (the
paramiko-shim Appendix-A deployment — no OpenSSH binary in this sandbox).
The wrapper's post-push verification confirms `refs/heads/main @ <HEAD>
== local HEAD` and synced `refs/remotes/origin/main`. The operator key
shredded. The remediation plan's final sign-off item checked off in the
follow-up commit.
