# Session 32 Log — Round-17 CWV Standing Performance Gate

**Date:** 2026-10-08 · **Agent:** Super Z (review/build) · **Branch:** `main`
**Baseline:** `2d09d1c` (the session-16 ship `715b8ff` + the
remotely-added `docs/session_31.md` narrative)

## Timeline

1. `git pull` (brought `docs/session_31.md`; zero code deltas since the
   session-16 ship). Reviewed all root docs + `docs/session_30.md` +
   `docs/remediation-plan-session16.md` + `worklog.md` +
   `docs/session_31.md` — everything current through session-16 (PAD
   v1.16, SKILL v1.16.0, the 266-test gate, 26 lessons); the session-16
   deliverables verified in code (the 3-describe a11y spec + the
   `axe-core@4.14.0` pin + the persisted scripts). `.env`/`.env.example`
   byte-identical (`DATABASE_URL="file:../db/custom.db"`); hard-link
   convergence live (inode 172348 at both paths). The leftover :3000
   standalone server from the prior session found via the `/proc/net/tcp`
   walk and killed BEFORE the first rebuild (the L25 lesson, applied
   proactively).
2. **Baseline gate:** lint 0/0 · tsc clean · 100/100 unit · build exit 0
   (23 routes, zero deprecation warnings) · 166/166 E2E = **266** —
   exactly the documented session-16 ship state, one run.
3. Skills mapped from `skills/skills-catalog.md` (agent-browser, tdd,
   clone-app-pat-pro, code-quality-standards, tailwind-patterns,
   nextjs-react-expert for the CWV work); the session-16 commit audited
   clean (test-level code + docs only; the a11y spec conforms to every
   repo convention).
4. **Round-17 live A/B audit** (agent-browser sessions `ref` + `clone`;
   the clone on the production standalone server at :3000, ONE host —
   localhost — for the whole lifecycle per L22; states saved before
   device emulation):
   - **Mobile nav (17th standing verification):** iPhone 14 both sites —
     the Sheet panel class string token-identical (modulo attribute
     order), pad 24px, bg `rgb(251,250,249)`, w-72 (288px), nav `flex
     flex-col gap-4 mt-8` (gap 16px, mt 32px), all 5 links byte-identical
     (239×44, 18px/500, block, same hrefs incl. the category deep-links).
     Functional check: "Electronics" deep-links to
     `/shop?category=electronics` and the sheet auto-closes. **No
     Tailwind v4 regression (17th consecutive verification).**
   - **Standing drift watches:** pixel diffs @1024 on 8 routes — ALL at
     the documented baseline band, byte-identical to the session-15/16
     numbers (home 0.34 / shop 0.38 / PDP 0.68 / cart 0.34 / wishlist
     0.34 / checkout 0.35 / account 0.34 / login 0.28). Full-route
     census re-run: 22/22 manifest routes console-clean, 19/19 internal
     links live, all 4 admin surfaces clean. Typeahead watch: the
     reference fires ZERO search network requests (fetch + XHR
     instrumented; only analytics + User/me — the clone's `/api/search`
     stays the superset; the reference's search input sits behind a
     search-icon button at 1280px — expanded, "headphones" typed, zero
     search requests). Carousel cadence: identical ~5.0s dot flips on
     both sites (ref interval 4968ms; clone 4962/4968ms — the dot probe
     re-queries the DOM each poll because the reference's DOM-swap
     carousel replaces the dot elements).
   - **The round's primary new surface — the FIRST multi-route CWV
     differential** (home/shop/PDP, both sites, Desktop 1280×720,
     PerformanceObservers registered pre-paint via addInitScript,
     `scripts/cwv-diff-session17.mjs`): the clone's LCP is 248/460/252ms
     vs the reference's 1008/1132/968ms — **2–4.5× faster on the
     byte-identical LCP elements** (the hero CDN asset 1232×468; the
     288×288 card image; the 584×584 product image) — and the clone's
     CLS is ≤ 0.0011 everywhere (the reference 0.0000–0.0061). **Zero
     parity defects: the SSR performance superset holds on every route.**
     **Methodological finding (measured):** the reference AUTH-GATES
     every route for anonymous visitors — a fresh anonymous context
     renders the login screen client-side ON the requested URL (the
     "Welcome back" H1 appears as the LCP element with a 401 in the
     console). The differential therefore measures authenticated state
     on both sites (the pixel-sweep conditions); round-13's hero-image
     LCP (1576ms) reproduces only under authentication. Persisted the
     debug scripts as the audit artifact
     (`scripts/cwv-debug-session17.mjs`, `cwv-debug2-session17.mjs`).
5. **Remediation plan** (`docs/remediation-plan-session17.md`): the
   audit record + the fix design for the round's finding — **PERF-GATE-1,
   the standing CWV budget gate** (round-13's one-time differential —
   and this round's three-route extension — had no regression pin; the
   defect classes that ship silently: LCP-element regressions, CLS
   regressions, paint-blocking regressions). Validated against the
   codebase before writing: the playwright config (Desktop Chrome
   project + storageState + :3100 + 1 worker), the accessibility.spec
   conventions (the type-cast + describe style), the hero-carousel
   `<img>` and the PDP `aspect-square` container (the mutation
   targets), ADR-025 as the next index slot.
6. **E2E-condition calibration** (the session-15/16 discipline — pins
   come from E2E conditions, not the dev DB): `prisma/e2e-reset.ts`
   restored the canonical state, the standalone server booted on :3100
   with the e2e DB, `scripts/cwv-calibrate-session17.mjs` measured the
   three routes with TWO passes each (demo-user login): home LCP
   292/248ms (IMG 1232×468, e.size 576,576), shop 396/312ms (IMG
   288×288, e.size 82,944), pdp 168/272ms (IMG 584×584, e.size
   317,112); CLS 0.0010/0.0006/0.0011 — byte-consistent with the live
   dev-DB differential (the profile is DB-invariant). The calibration
   server killed via the /proc walk before the suite runs (L25).
7. **TDD RED:** the zero-tolerance form of the three pin families (LCP
   ≤ 0ms, CLS = 0, identity floor impossible) — all 3 route tests failed
   for the RIGHT reason: the failure payloads carried the measured LCP
   (592/892/616ms on the E2E server — cold-start CDN variance, well
   inside any budget), the hero IMG at 576,576 px², and the CLS
   0.0006–0.0011 — documenting the baseline as a DELIBERATE quality
   contract before the budgets landed.
8. **TDD GREEN:** the calibrated budgets — LCP ≤ 2500ms (6–15× headroom
   over the calibration; catches paint-blocking regressions), CLS ≤
   0.03 (27×+ headroom; round-13's long-window 0.0213 stays inside — the
   unsized-media class lands at 0.1+), and LCP-element identity THROUGH
   SCALE (the largest paint is an IMG at ≥ 400,000/50,000/200,000 px²
   per route — a lazy or broken hero moves the LCP to text, which the
   floors exclude). 4/4 green (3 gate tests + the setup).
9. **Dual mutation efficacy check:** mutation 1 — the hero `<img>` given
   `hidden` (the failing-eager-load class) → the home test FAILED at the
   IDENTITY pin (`Expected: "IMG", Received: "H1"`, LCP 392ms, the hero
   IMG absent from the entry list) while the LCP budget stayed GREEN —
   the budget alone cannot see this defect class; that is the proof the
   identity pin exists. Mutation 2 — a late-injected 160px banner
   (900ms post-hydration, the consent-bar/ads class) → the home test
   FAILED at the CLS pin (0.104 vs 0.03 — 3.5× over) with LCP +
   identity GREEN. **Structural finding en route (L27):** the FIRST CLS
   mutation attempt (the PDP `aspect-square` + `h-full` removed) did
   NOT bite at desktop — the PDP's 2-column grid makes the buy-panel
   column the taller one, so the image container's post-load growth is
   absorbed with zero movement; the same defect at mobile (stacked
   1-col) shifts the whole buy panel — the A11Y-GATE-2
   structural-blindness story, now for CLS. The PDP container is the
   registered mobile-CWV mutation target. Both mutations reverted
   (git-diff clean) → GREEN again.
10. **Gate at ship:** lint 0/0 · tsc clean · 100/100 unit · build exit 0
    (23 routes, zero deprecation warnings) · **169/169 E2E = 269 total**
    (was 266; +3 gate tests, none removed) — **two consecutive full E2E
    runs** for determinism.
11. **Live re-verification:** the :3000 production server restarted on
    the current build; pixel re-diff — all 8 routes at the identical
    baseline numbers (the gate is test-level, rendering-neutral,
    empirically confirmed). **The 17th mobile-nav screenshot is
    BYTE-IDENTICAL (md5 `05de11678965f30a85f9196c2ec43bae`) to the
    13th, 14th, 15th, AND 16th** — five consecutive rounds of rendering
    continuity across the CSP, a11y-gate, gate-extension, and CWV-gate
    changes. The diff/calibration/capture scripts persisted
    (`scripts/cwv-diff-session17.mjs`,
    `scripts/cwv-calibrate-session17.mjs`,
    `scripts/capture-session17.ts`).
12. **Screenshots:** 5 new (96–100 — 96 the multi-route CWV differential
    table, 97 the 17th mobile-nav verification, 98 the CWV gate live
    run, 99 the dual mutation efficacy proof, 100 the E2E-condition
    calibration) → 100 total. VLM-verified **5/5** (the first two
    attempts hit the SDK's text-only chat endpoint — the correct call is
    `chat.completions.createVision`; recorded). Dev-DB hygiene run clean
    (canonical 3 orders). `.env.example` verified current (no new env
    plumbing — the gate is test-level).
13. **Docs:** AGENTS.md (the PERF-GATE-1 contract + the PDP-grid
    structural lesson + the reference-auth-gate note), CLAUDE.md (the
    session-17 contract, 100 unit / 169 E2E), README.md (269 tests, the
    CWV-gate row, 17th verification), PAD v1.17 (ADR-025 + revision row
    + Known-Issues Resolved row + matrix 28/269), SKILL v1.17.0 (L27 +
    the ADR-index entry), this session log, the worklog.

## Key decisions

- **The standing-gate round over a new feature:** the remaining
  round-17 candidates need external credentials (email provider for
  ADR-011 activation, Stripe for ADR-007's Payment Element); the
  auth-screens axe extension is a small completion of an already-guarded
  family (the login anon pattern covers the anatomy). The CWV gate is
  the one that compounds the audit infrastructure at zero external
  dependency — and it converts the project's LAST quantified-but-unguarded
  dimension (performance) into a regression pin, completing the standing
  gate family: geometry (computed-style), catalog, money, CSP, headers,
  fonts, a11y (desktop + mobile + admin), and now CWV.
- **A NEW spec file, not an extension:** the a11y gate grows in place
  because it is ONE contract on ONE tool's output; the performance gate
  is a different contract family with its own mechanics (pre-paint
  observers, entry-time geometry, budgets) — the repo's
  spec-per-concern layout is the precedent.
- **The pins are BUDGETS, not parity:** the reference's slower SPA
  numbers are a moving third-party target, not a contract — the gate is
  a QUALITY budget (the same distinction as the admin axe census), with
  the headroom documented from the calibration (LCP 6–15×, CLS 27×+).
- **Identity THROUGH SCALE:** the LCP-element contract is pinned by
  paint-size floors (hero 400k / card 50k / product 200k px²) rather
  than src strings — scale is the stable discriminator between the
  route's primary imagery and text/card-scale paints, and it survives
  CDN asset swaps.
- **Mutations engineered to prove the pin FAMILY, not just that the
  tests run:** mutation 1 leaves the LCP budget green BY CONSTRUCTION
  (text paints fast) — the proof the identity pin exists; mutation 2
  leaves LCP + identity green (the banner does not delay paint) — the
  proof the CLS pin guards a class nothing else sees. The failed first
  CLS mutation (the PDP grid absorbing the growth) was kept as L27
  rather than hidden — it is the mobile-CWV round's registered target.

`docs/remediation-plan-session17.md` records the full audit trail.

## Suggested next steps

Round-18 candidates: the mobile-viewport CWV extension (the L27
structural finding is its mutation target — the PDP `aspect-square`
container bites only at 390px; needs its own calibration pass and
mobile-sized identity floors), extending the axe gate to the remaining
auth screens (register/forgot-password/verify-email), an email provider
to activate the ADR-011 verification gate (external credentials), or
Stripe Payment Element (ADR-007's documented next step, external
credentials). The audit surface is now gated across viewports AND
dimensions (geometry, catalog, money, CSP, headers, fonts, a11y desktop
+ mobile + admin, CWV). Tell me which to pick up and I'll start the
next round.
