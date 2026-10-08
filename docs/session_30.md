# Session 30 Log — Round-16 Mobile + Admin Axe Gate Extension

**Date:** 2026-10-08 · **Agent:** Super Z (review/build) · **Branch:** `main`
**Baseline:** `2404bf0` (the session-15 ship `f3fdc26` + the
remotely-added `docs/session_29.md` narrative)

## Timeline

1. `git pull` (brought `docs/session_29.md`; zero code deltas since the
   session-15 ship). Reviewed all root docs + `docs/session_28.md` +
   `docs/remediation-plan-session15.md` + `worklog.md` +
   `docs/session_29.md` — everything current through session-15 (PAD
   v1.15, SKILL v1.15.0, the 256-test gate, 25 lessons); the session-15
   deliverables verified in code (the standing axe gate + the
   `axe-core@4.14.0` pin + the persisted axe-diff/calibrate/census/sweep/
   capture scripts). `.env`/`.env.example` byte-identical
   (`DATABASE_URL="file:../db/custom.db"`); hard-link convergence live
   (inode 172348 at both paths). Both the leftover :3000 audit server and
   the :3100 E2E calibration server from the prior session found alive
   and killed BEFORE the first rebuild (the L25 lesson applied
   proactively).
2. **Baseline gate:** lint 0/0 · tsc clean · 100/100 unit · build exit 0
   (23 routes) · 156/156 E2E = **256** — exactly the documented
   session-15 ship state, one run.
3. Skills mapped from `skills/skills-catalog.md` (agent-browser, tdd,
   clone-app-pat-pro, code-quality-standards, tailwind-patterns); the
   session-15 commit audited clean (test-level code only + docs; the
   a11y spec conforms to every repo convention).
4. **Round-16 live A/B audit** (agent-browser sessions `ref` + `clone`;
   the clone on the production standalone server at :3000, ONE host —
   localhost — for the whole lifecycle per L22; states saved before
   device emulation):
   - **Mobile nav (16th standing verification):** iPhone 14 both sites —
     the Sheet panel class string token-identical, pad 24px, bg
     `rgb(251,250,249)`, w-72 (288px), nav `flex flex-col gap-4 mt-8`
     (gap 16px, mt 32px), all 5 links byte-identical (239×44, 18px/500,
     block, same hrefs incl. the category deep-links). Functional check:
     "Electronics" deep-links to `/shop?category=electronics` and the
     sheet auto-closes. **No Tailwind v4 regression (16th consecutive
     verification).**
   - **Standing drift watches:** pixel diffs @1024 on 8 routes — ALL at
     the documented baseline band, byte-identical to the session-15
     numbers (home 0.34 / shop 0.38 / PDP 0.68 / cart 0.34 / wishlist
     0.34 / checkout 0.35 / account 0.34 / login 0.28). Full-route
     census re-run: 22/22 manifest routes console-clean, 19/19 internal
     links live, all 4 admin surfaces clean. Typeahead watch: the
     reference fires ZERO search network requests (fetch + XHR
     instrumented; the clone's `/api/search` stays the superset).
     Carousel cadence: identical ~5.0s dot flips on both sites (measured
     5501/11001ms ref vs 5500/11001ms clone).
   - **The round's primary new surface — the FIRST mobile-viewport axe
     differential** (iPhone 14 via `devices["iPhone 14"]`, both sites,
     same build 4.14.0, scrolled-reveal): the clone's mobile census is
     EXACTLY `{color-contrast}` on all 6 measured routes with counts
     BYTE-IDENTICAL to the desktop pins (28/23/14/8/8/3); the reference
     additionally carries button-name (5–21) + link-name (2) + label (4,
     account) per route — the clone's aria superset HOLDS AT MOBILE.
   - **The round's second new surface — the FIRST admin-surface axe
     census** (clone-only, Desktop 1280×720, admin-authenticated): the
     dashboard, orders list, products list, and order detail all census
     at EXACTLY `{color-contrast}` — 8/7/7/7 — zero aria violations on
     any console surface.
5. **Remediation plan** (`docs/remediation-plan-session16.md`): the
   audit record + the fix design for the round's finding — **A11Y-GATE-2,
   the standing axe gate extended to mobile viewports + admin
   surfaces** (the structural-blindness argument: an `lg:hidden` element
   is `display:none` at desktop → axe skips it → a mobile-only defect
   passes the desktop gate forever; the admin console had no a11y guard
   at all). Validated against the codebase before writing: the
   `adminLogin` helper (the admin.spec beforeAll pattern, rate-limit
   budget 3 admin logins/run × 2 runs < 10/15min), the `devices` export,
   the ORD-2026-001 link-click convention (the e2e.db cuid is not
   hardcodable), the mobile menu button's `lg:hidden` + aria-label (the
   mobile-only mutation target), the eye buttons (the admin mutation
   target).
6. **E2E-condition calibration** (the session-15 discipline — pins come
   from E2E conditions, not the dev DB): `prisma/e2e-reset.ts` restored
   the canonical state, the standalone server booted on :3100 with the
   e2e DB, `scripts/axe-calibrate-session16.mjs` measured the mobile 6
   (iPhone 14 + storageState) + admin 4 (adminLogin) — **byte-identical
   numbers to the live dev-DB measurement** (28/23/14/8/8/3 and
   8/7/7/7): the profile is DB-invariant and viewport-invariant.
7. **TDD RED:** the zero-violation form of the 10 new assertions — all
   failed for the RIGHT reason (color-contrast present at the exact
   expected counts, e.g. shop 23 — the shared parity trait; the failure
   documents the baseline as a DELIBERATE parity contract before the
   pin). First run surfaced the Playwright mechanics lesson:
   `test.use({ ...devices["iPhone 14"] })` inside a describe REJECTS the
   descriptor's `defaultBrowserType` (forces a new worker) — stripped;
   the project's storageState still applies at 390px.
8. **TDD GREEN:** the pinned form — the `a11y mobile gate` describe
   reuses the SAME `PROFILE` map (the mobile census is byte-identical to
   the desktop's — that identity IS the contract; a viewport divergence
   is flagged like a drift), the login route anon at iPhone 14; the
   `a11y admin gate` describe (one `adminLogin` in `beforeAll`) pins the
   QUALITY census {color-contrast} at 8/7/7/7, the order detail via the
   ORD-2026-001 link. 17/17 a11y tests green.
9. **Dual mutation efficacy check:** mutation 1 — the mobile menu
   button's `aria-label` removed → 5 storefront MOBILE tests FAILED
   (`button-name(1)` in the census) while ALL desktop tests stayed GREEN
   (the button is `display:none` at 1280px — axe skips it; the
   structural-blindness PROOF: this is a defect the desktop gate could
   never catch). Mutation 2 — the admin eye buttons' `aria-labels`
   removed → the admin products test FAILED (`button-name(12)`).
   Methodological discovery en route: the first admin mutation attempt
   (aria-label on the plain stats-grid div) did NOT fire — a plain
   role-less div with aria-label is NOT aria-prohibited-attr under the
   wcag2x tag set; the session-12 defect fired because the toast
   viewport carries `aria-live="polite"` (aria-label on a LIVE REGION is
   prohibited) — recorded as L26 with the registered mutation targets.
   Both mutations reverted (git-diff clean) → GREEN again.
10. **Gate at ship:** lint 0/0 · tsc clean · 100/100 unit · build exit 0
    (23 routes) · **166/166 E2E = 266 total** (was 256; +10 gate tests,
    none removed) — **two consecutive full E2E runs** for determinism.
    (The L25 stale-server trap hit once mid-round — a rebuild under the
    running :3100 calibration server broke auth.setup; killed via the
    /proc/net/tcp walk and re-run clean.)
11. **Live re-verification:** the :3000 production server restarted on
    the current build; pixel re-diff — all 8 routes at the identical
    baseline numbers (the extension is test-level, rendering-neutral,
    empirically confirmed). **The 16th mobile-nav screenshot is
    BYTE-IDENTICAL (md5 `05de11678965f30a85f9196c2ec43bae`) to the 13th,
    14th, AND 15th** — four consecutive rounds of rendering continuity
    across the CSP, a11y-gate, and gate-extension changes. The
    axe-diff + calibration + capture scripts persisted
    (`scripts/axe-diff-session16.mjs`,
    `scripts/axe-calibrate-session16.mjs`, `scripts/capture-session16.ts`).
12. **Screenshots:** 5 new (91–95 — 91 the mobile axe differential
    parity table, 92 the 16th mobile-nav verification, 93 the extended
    gate live runs [mobile + admin], 94 the dual mutation efficacy
    proof, 95 the admin axe census) → 95 total. VLM-verified **5/5**.
    Dev-DB hygiene run clean (canonical 3 orders). `.env.example`
    verified current (no new env plumbing — the gate is test-level).
13. **Docs:** AGENTS.md (the gate-coverage contract + the plain-div
    aria-label lesson), CLAUDE.md (the session-16 contract, 100 unit /
    166 E2E), README.md (266 tests, the gate-coverage row, 16th
    verification), PAD v1.16 (ADR-024 + revision row + Known-Issues
    Resolved row + matrix 27/266), SKILL v1.16.0 (L26 + the ADR-index
    entry), this session log, the worklog.

## Key decisions

- **The coverage-extension round over a new feature:** the remaining
  round-16 candidates need external credentials that don't exist for a
  self-hosted clone (email provider for ADR-011 activation, Stripe for
  ADR-007's Payment Element); pagination has no demonstrated need at 12
  products. The gate extension is the one that compounds the audit
  infrastructure at zero external dependency — and it closes the exact
  gap ADR-023 itself recorded ("a future mobile-viewport or
  admin-surface extension needs its own calibration pass").
- **The mobile pins are the DESKTOP pins:** the live differential +
  E2E calibration both measured the mobile census byte-identical to the
  desktop's on both sites — so the mobile describe reuses the same
  `PROFILE` map rather than a new one. The identity is itself pinned:
  a viewport divergence is now flagged exactly like a drift at either
  viewport.
- **The admin pins are a QUALITY census, not parity:** no reference
  counterpart exists for the console, so 8/7/7/7 pins the measured
  profile (drift in either direction flagged) rather than a parity
  contract — the distinction is recorded in the spec comment and the
  ADR.
- **Mutations engineered to prove the STRUCTURAL claim:** the
  mobile-only mutation (an `lg:hidden` button) leaves the desktop gate
  green BY CONSTRUCTION — that is the proof the extension covers
  something the desktop gate never could, not merely that the new tests
  execute. The failed first admin mutation (plain-div aria-label) was
  kept as a lesson (L26) rather than hidden — the session-12 defect
  class fires on live regions, not plain divs.
- **The gate grows in place:** both new describes live in
  `tests/e2e/accessibility.spec.ts` — one file, one contract, one place
  to look; a separate spec would fragment the a11y story.

`docs/remediation-plan-session16.md` records the full audit trail.

## Suggested next steps

Round-17 candidates: an email provider to activate the ADR-011
verification gate (external credentials), Stripe Payment Element
(ADR-007's documented next step, external credentials), extending the
axe gate to the remaining auth screens at mobile (register/
forgot-password/verify-email), or a performance budget gate (the CWV
differential as a standing LCP/CLS pin). The audit surface is now gated
across viewports (geometry, catalog, money, CSP, headers, fonts, a11y
desktop + mobile + admin). Tell me which to pick up and I'll start the
next round.
