# Session 34 Log — Round-18 Mobile CWV Standing Gate

**Date:** 2026-10-08 · **Agent:** Super Z (review/build) · **Branch:** `main`
**Baseline:** `ba561c1` (the session-17 ship `01d5c15` + the sign-off
`56f07bd` + the remotely-added `docs/session_33.md` narrative)

## Timeline

1. The workspace had been reset — fresh `git clone` of
   `nordeim/ecommerce-store`; `.env` recreated from `.env.example`. The
   env-shadowing trap live from the first command: the shell exports
   `DATABASE_URL=file:/home/z/my-project/db/custom.db` which WINS over the
   repo `.env` (the documented sandbox trap) — `bun run db:setup` run with
   the repo URL inline, then the hard-link convergence restored (inode
   264376 at BOTH paths — the injected location and `<repo>/db/custom.db`
   are ONE file; the `tests/db-path.test.ts` contract holds). Reviewed all
   root docs + `docs/session_32.md` + `docs/remediation-plan-session17.md`
   + `worklog.md` + `docs/session_33.md` — everything current through
   session-17 (PAD v1.17, SKILL v1.17.0, the 269-test gate, 27 lessons);
   the session-17 deliverables verified in code (the 4-test performance
   spec + the persisted diff/calibrate/capture scripts). No stale servers
   live at audit start (the `/proc/net/tcp` walk scanned :3000/:3100
   clean).
2. **Baseline gate:** lint 0/0 · tsc clean · 100/100 unit · build exit 0
   (23 routes, zero deprecation warnings) · 169/169 E2E = **269** —
   exactly the documented session-17 ship state, one run.
3. Skills mapped from `skills/skills-catalog.md` (agent-browser, tdd,
   clone-app-pat-pro, code-quality-standards, tailwind-patterns,
   nextjs-react-expert); the session-17 commit audited clean (test-level
   code + docs only).
4. **Round-18 live A/B audit** (agent-browser sessions `ref` + `clone`;
   the clone on the production standalone server at :3000, ONE host —
   localhost — for the whole lifecycle per L22; states saved before
   device emulation; both sessions logged in — operator account on the
   reference, demo user on the clone):
   - **Mobile nav (18th standing verification):** iPhone 14 both sites —
     the Sheet panel class string token-identical (modulo attribute
     order), pad 24px, bg `rgb(251,250,249)`, w-72 (288px), nav `flex
     flex-col gap-4 mt-8` (gap 16px, mt 32px), all 5 links byte-identical
     (239×44, 18px/500, block, same hrefs incl. the category deep-links).
     Functional check: "Electronics" deep-links to
     `/shop?category=electronics` and the sheet auto-closes. **No
     Tailwind v4 regression (18th consecutive verification).**
   - **Standing drift watches:** pixel diffs @1024 on 8 routes — ALL at
     the documented baseline band, byte-identical to the session-15/16/17
     numbers (home 0.34 / shop 0.38 / PDP 0.68 / cart 0.34 / wishlist
     0.34 / checkout 0.35 / account 0.34 / login 0.28). Full-route census
     re-run: 22/22 manifest routes console-clean, 19/19 internal links
     live, all 4 admin surfaces clean. Typeahead watch: the reference
     fires ZERO search network requests (fetch + XHR instrumented; the
     search expanded via its icon button first). Carousel cadence watch:
     both sites flip at the same ~5.0s interval (the reference
     ~4500/9500/14500ms; the clone 4999/5000ms intervals — the dot probe
     must track the w-8 ACTIVE dot, not the w-2-only class filter).
   - **The round's primary new surface — the FIRST MOBILE-VIEWPORT CWV
     differential** (`scripts/cwv-diff-session18.mjs`; PerformanceObserver
     LCP/CLS/FCP + LCP-element identity, pre-paint via addInitScript,
     iPhone 14, authenticated both sites): first pass at 390×844 (the
     physical screen) measured the clone 2.2–5.7× faster with CLS ≤
     0.0011; re-run at 390×664 (the Playwright device viewport — the
     EXACT viewport the gate's `devices["iPhone 14"]` produces): home
     396ms vs 1260ms, shop 308ms vs 1368ms, pdp 312ms vs 984ms —
     **3.2–4.4× faster on the byte-identical LCP elements** (the hero CDN
     asset at 358×332 vs 370×343, the 169×169 card, the 358×358 product
     image), CLS ≤ 0.0016 vs the reference's 0.0000–0.0156. **Zero parity
     defects — the mobile SSR performance superset.**
   - **L27 mutation-target efficacy pre-check** (validating the plan's
     fix design before writing it): the PDP `aspect-square` + `h-full`
     removed on a scratch build — the shift is REAL at mobile (a
     layout-shift entry of 0.306–0.3205; the buy panel `DIV.flex.flex-col`
     moves y 209→567 = the container growing 0→358px, measured by a
     height probe) while the desktop absorbs it at 0.0184 (inside budget).
     **NEW finding (L28):** the detectability is CDN-timing-dependent — a
     WARM CDN context (login-first flow; the login/account pages warm
     media.base44.com via the header logo) produced ZERO shift entries
     (CLS reads 0.0000 — the defect invisible); a COLD context (fresh,
     direct goto) produced the 0.30+ shift reliably (3/3 runs), sometimes
     landing pre-FCP (Chrome's raw layout-shift API reports pre-FCP
     entries — the raw-sum observer catches them; the official field CLS
     filters them). Mutation reverted, rebuild, clean-build
     re-differential at the mobile baseline (LCP 284–448ms, CLS ≤
     0.0011). The debug scripts persisted
     (`scripts/cwv-mobile-mutation-precheck.mjs`,
     `scripts/cwv-debug-mobile-shift.mjs`).
5. **Zero parity defects → the round's finding is PERF-GATE-2:** the CWV
   gate covers desktop only — the mobile-only defect classes (the L27
   stacked-layout CLS class; a mobile-only imagery regression moving the
   390px LCP to text) pass the desktop gate forever. The A11Y-GATE-2
   story, now for CWV. `docs/remediation-plan-session18.md` written and
   validated (the in-place describe + the devices-viewport calibration
   trap + the three mutation designs) and checked off after execution.
6. **E2E-condition calibration** (`scripts/cwv-calibrate-session18.mjs`;
   e2e-reset → canonical state, :3100 standalone on the e2e DB, one demo
   login, two passes per route): the FIRST pass ran at 390×844 and
   mismatched the gate's device viewport — the hero measured 151,076 px²
   (358×422) while the E2E device context (RED-run payload) measured
   118,856 (358×332). Root cause: **`devices["iPhone 14"]` is 390×664,
   NOT 844** — the Playwright device viewport is the physical screen minus
   browser chrome; `50vh` = 332px at 664. The calibration script fixed to
   the exact device descriptor and re-run: home LCP 228–372ms / e.size
   118,856 / CLS 0.0003–0.0016; shop 340–368ms / 28,561 / 0.0008; pdp
   128–364ms / 128,164 / 0.0006. e.size confirmed CSS-pixel area (DPR 3
   does not multiply it). Floors set at ~2/3 of the measured paints:
   home 79,000 / shop 19,000 / pdp 85,000 px².
7. **TDD RED:** the mobile describe written with the zero-tolerance form
   (LCP ≤ 0ms, CLS = 0, floors impossible) — all 3 mobile tests failed
   for the RIGHT reason (failure payloads carried the measured mobile LCP
   488/440/296ms + the IMG e.size 118,856/28,561/128,164 + CLS values);
   the 4 desktop tests stayed green.
8. **TDD GREEN:** the calibrated mobile budgets landed in the new
   `CWV mobile gate` describe in `tests/e2e/performance.spec.ts`
   (`test.use({...devices["iPhone 14"]})` with `defaultBrowserType`
   stripped — the A11Y-GATE-2 lesson; the project storageState applies —
   the demo user authed at 390px). 7/7 green (4 desktop + 3 mobile).
9. **Triple mutation efficacy check** (one at a time, rebuild, run,
   verify the failure REASON, revert, re-run GREEN):
   - **Mutation 1 — mobile-only hero-img hiding** (globals.css `@media
     (max-width: 640px) { .hero-mut { display: none } }` on the hero img):
     mobile home FAILED at the identity pin (`Expected: "IMG", Received:
     "H1"` — the LCP fell to the H1 at 19,050 px²) while ALL FOUR desktop
     tests stayed GREEN — the structural-blindness PROOF (a mobile-only
     defect passes the desktop gate forever; the ADR-024 proof shape
     transplanted to CWV).
   - **Mutation 2 — the late-injected banner** (160px block, 900ms
     post-hydration, the consent-bar/ads class): mobile home FAILED at
     the CLS pin at **0.2088** (7× over budget) — proportionally LARGER
     than the desktop's 0.1098 (the same 160px is a bigger viewport
     fraction at 390×664); LCP + identity stayed green.
   - **Mutation 3 — the L27 PDP unsized image** (`aspect-square` +
     `h-full` removed): mobile pdp FAILED at the CLS pin at **0.3776**
     (12.6× over budget — the stacked-layout buy-panel shift) while the
     DESKTOP pdp stayed green (the 2-col grid absorbs the growth at
     0.0184, inside budget) — the defect class caught exactly where it
     manifests, under the E2E cold-context conditions (L28's timing
     dependency confirmed on the gate's own terms).
   All three reverted (git-diff clean) → GREEN again.
10. **Gate at ship:** lint 0/0 · tsc clean · 100/100 unit · build exit 0
    (23 routes, zero deprecation warnings) · **172/172 E2E = 272 total**
    (was 269; +3 mobile gate tests, none removed) — **two consecutive
    full E2E runs** for determinism (the :3100 calibration server killed
    via the `/proc/net/tcp` walk before each run — the L25 discipline).
11. **Live re-verification:** the :3000 production server restarted on
    the current build; pixel re-diff — all 8 routes at the identical
    baseline numbers (the gate is test-level, rendering-neutral,
    empirically confirmed). **The 18th mobile-nav screenshot is
    BYTE-IDENTICAL (md5 `05de11678965f30a85f9196c2ec43bae`) to the 13th
    through the 17th** — six consecutive rounds of rendering continuity
    across the CSP, a11y-gate, gate-extension, CWV-gate, and
    mobile-CWV-gate changes. The diff/calibration/capture scripts
    persisted (`scripts/cwv-diff-session18.mjs`,
    `scripts/cwv-calibrate-session18.mjs`,
    `scripts/capture-session18.ts`, plus the pre-check/debug pair).
12. **Screenshots:** 5 new (101–105 — 101 the mobile CWV differential
    table, 102 the 18th mobile-nav verification, 103 the mobile CWV gate
    live run, 104 the triple mutation efficacy proof, 105 the
    E2E-condition mobile calibration) → 105 total. VLM-verified 5/5 (via
    the SDK's `createVision`; 3 direct PASSes + 102 confirmed by direct
    inspection — the sheet is the close-X + nav links, the VLM prompt's
    "LUXE brand" expectation was a description error, the capture is
    md5-identical to the 17th — and 105 confirmed by direct inspection
    after a content-filter false positive on the first prompt). Dev-DB
    hygiene run clean (canonical 3 orders). `.env.example` verified
    current (no new env plumbing — the gate is test-level).
13. **Docs:** AGENTS.md (the PERF-GATE-2 contract + the device-viewport
    fact + the L28 timing-dependence lesson), CLAUDE.md (session-18
    contract, 100 unit / 172 E2E), README.md (272 tests, the mobile-CWV
    row, 18th verification), PAD v1.18 (ADR-026 + revision row +
    Known-Issues Resolved row + matrix 28/272), SKILL v1.18.0 (L28 + the
    ADR-index entry), this session log, the worklog.

## Key decisions

- **The mobile CWV extension over the other round-18 candidates:** the
  remaining candidates need external credentials (email provider for
  ADR-011, Stripe for ADR-007) or are a small completion of an
  already-guarded family (the auth-screens axe extension). The mobile CWV
  gate is the ADR-025-nominated follow-up with its registered mutation
  target ready — and it closes the LAST structural-blindness hole in the
  standing gate family: every dimension (geometry, catalog, money, CSP,
  headers, fonts, a11y, CWV) now spans both viewports.
- **IN PLACE extension, not a new spec file:** the mobile gate is the
  SAME contract family (CWV budgets) on the SAME tool (PerformanceObserver
  measurements) — the a11y-gate precedent (A11Y-GATE-2 grew
  accessibility.spec.ts in place); the mobile describe reuses the
  `measure()` helper and mirrors the desktop PROFILE map with
  viewport-scaled floors.
- **Calibrate at the EXACT device descriptor:** the first calibration pass
  at 390×844 measured a hero 27% larger than the gate's device context
  ever produces (`devices["iPhone 14"]` = 390×664 — 844 is the physical
  screen minus browser chrome). The mismatch surfaced in the RED-run
  payload (118,856 vs 151,076 px²) and was fixed before the floors were
  pinned — the same discipline as the session-15 "pins come from E2E
  conditions" rule, now with the added trap that the DEVICE viewport is
  not the SCREEN resolution.
- **Mutations engineered to prove the pin FAMILIES and the blindness:**
  mutation 1 is viewport-scoped (CSS media query) so the desktop gate
  stays green BY CONSTRUCTION — the structural-blindness proof; mutation
  2 is the deterministic CLS class (always post-paint) at mobile
  proportionality; mutation 3 is the real L27 defect class, kept despite
  its L28 timing-dependence because the E2E cold-context conditions make
  it deterministic there — and because a mutation that bites at 0.3776
  while the same build passes the desktop gate at 0.0184 is the single
  most direct proof of the round's thesis.
- **The L28 lesson recorded rather than hidden:** the first
  mutation-precheck run measured CLS 0.0000 on a defective build (warm
  CDN) — a false GREEN that could have shipped the gate unproven. The
  timing dependence (warm vs cold contexts, pre-FCP entries, the
  raw-sum-vs-field-CLS distinction) is documented so the next round's
  mutation designs start from the deterministic class.

`docs/remediation-plan-session18.md` records the full audit trail.

## Suggested next steps

Round-19 candidates: extending the axe gate to the remaining auth screens
(register/forgot-password/verify-email — the login anon pattern covers the
family's anatomy, so this is a completion round), INP pins (needs a
scripted interaction protocol — the deterministic next CWV family), an
email provider to activate the ADR-011 verification gate (external
credentials), or Stripe Payment Element (ADR-007's documented next step,
external credentials). Just say the word.
