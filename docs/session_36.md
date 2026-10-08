# Session 36 Log — Round-19 Auth-Screens Axe Gate (A11Y-GATE-3)

**Date:** 2026-10-09 · **Agent:** Super Z (review/build) · **Branch:** `main`
**Baseline:** `78685e3` (the session-18 ship `536ddac` + the sign-off
`eb1d4ca` + the remotely-added `docs/session_35.md` narrative)

## Timeline

1. The workspace had been reset — fresh `git clone` of
   `nordeim/ecommerce-store`; `.env` recreated from `.env.example`. The
   env-shadowing trap live from the first command (the shell exports
   `DATABASE_URL=file:/home/z/my-project/db/custom.db` which WINS over the
   repo `.env`) — `bun run db:setup` run with the repo URL inline, then the
   hard-link convergence restored (inode 172841 at BOTH paths; the
   `tests/db-path.test.ts` contract holds). Reviewed all root docs +
   `docs/session_34.md` + `docs/remediation-plan-session18.md` +
   `worklog.md` + `docs/session_35.md` — everything current through
   session-18 (PAD v1.18, SKILL v1.18.0, the 272-test gate, 28 lessons).
   One cosmetic defect found in the docs pass: the PAD's TITLE still read
   "v1.17" (the session-18 revision row landed but the header was never
   bumped) — fixed this round. No stale servers live at audit start
   (the `/proc/net/tcp` walk scanned :3000/:3100 clean). The round's :3000
   server detached via the double-fork orphan pattern — the sandbox reaps
   plain background processes between commands (only the agent-browser
   daemon survives as a session leader; `(setsid … &)` reproduces that
   state for the standalone server).
2. **Baseline gate:** lint 0/0 · tsc clean · 100/100 unit · build exit 0
   (23 routes, zero deprecation warnings) · 172/172 E2E = **272** —
   exactly the documented session-18 ship state, one run.
3. Skills mapped from `skills/skills-catalog.md` (agent-browser, tdd,
   clone-app-pat-pro, code-quality-standards, tailwind-patterns,
   nextjs-react-expert); the session-18 commit audited clean (test-level
   code + docs only).
4. **Round-19 live A/B audit** (agent-browser sessions `ref` + `clone`;
   the clone on the production standalone server at :3000, ONE host —
   localhost — for the whole lifecycle per L22; states saved before
   device emulation; both sessions logged in — operator account on the
   reference, demo user on the clone):
   - **Mobile nav (19th standing verification):** iPhone 14 both sites —
     the Sheet panel class string token-identical (modulo attribute
     order), pad 24px, bg `rgb(251,250,249)`, w-72 (288px), nav `flex
     flex-col gap-4 mt-8` (gap 16px, mt 32px), all 5 links byte-identical
     (239×44, 18px/500, block, same hrefs incl. the category deep-links).
     Functional check: "Electronics" deep-links to
     `/shop?category=electronics` and the sheet auto-closes. **No
     Tailwind v4 regression (19th consecutive verification).**
   - **Standing drift watches:** pixel diffs @1024 on 8 routes — ALL at
     the documented baseline band, byte-identical to the
     session-15/16/17/18 numbers (home 0.34 / shop 0.38 / PDP 0.68 /
     cart 0.34 / wishlist 0.34 / checkout 0.35 / account 0.34 / login
     0.28). Full-route census re-run: 22/22 manifest routes
     console-clean, 19/19 internal links live, all 4 admin surfaces
     clean. Typeahead watch: the reference fires ZERO search network
     requests (fetch + XHR instrumented; the search expanded via its
     icon button first). Carousel cadence watch: both sites flip at the
     same ~5.0s stable interval (ref 5006/5003ms; clone 5003/5003ms —
     the first sub-5s interval on each side is the probe's mid-cycle
     entry artifact; the dot probe tracks the w-8 ACTIVE dot).
   - **The round's primary new surface — the FIRST AUTH-SCREENS axe
     differential** (`scripts/axe-diff-session19.mjs`; the SAME
     axe-core 4.14.0 build injected on both sites, the scrolled-reveal
     pass, ANONYMOUS contexts at desktop 1280×720 AND mobile iPhone 14):
     register {color-contrast}(2) = ref {color-contrast}(2); forgot-
     password (2) = (2); verify-email (1) vs the reference's platform
     404 — **the reference's `/verify-email` route renders its
     client-side 404** ("The page 'verify-email' could not be found in
     this application"): the reference's verify screen is a client-side
     state INSIDE its register flow, NOT a standalone route. The clone's
     standalone `/verify-email` (session-4, ADR-011) is therefore a
     SUPERSET surface — its census is a QUALITY pin (the admin-gate
     precedent), the count match is coincidental. **Zero parity
     defects; the aria superset holds on the whole auth family.**
5. **Zero parity defects → the round's finding is A11Y-GATE-3:** the
   standing axe gate covers login (desktop + mobile) but NOT register /
   forgot-password / verify-email — a defect introduced on the three
   unmeasured screens (an unlabeled input, a broken label association,
   an added landmark) passes the standing gate forever (the
   A11Y-GATE-2 structural-blindness story, now for the auth family —
   the session-34-nominated completion round). The remaining candidates
   need external credentials (email provider / Stripe) or a new
   protocol (INP). `docs/remediation-plan-session19.md` written and
   validated (the anon-context pattern + the two mutation designs —
   one revised live, see L29) and checked off after execution.
6. **E2E-condition calibration** (`scripts/axe-calibrate-session19.mjs`;
   e2e-reset → canonical state, :3100 standalone on the e2e DB, anon
   contexts at the exact device descriptors): register {color-contrast}:2
   and forgot-password :2 and verify-email :1 at BOTH viewports —
   byte-identical to the live differential (the screens are anonymous +
   DB-independent; the invariance itself confirmed, the admin-gate
   precedent).
7. **TDD RED:** the auth-screens describe written with the
   zero-tolerance form (census `[]`, count 0) — all 6 tests failed for
   the RIGHT reason (failure payloads carried the measured censuses:
   `[{"id":"color-contrast","nodes":2}]` ×4 and `[{"id":
   "color-contrast","nodes":1}]` ×2 — desktop and mobile each).
8. **TDD GREEN:** the calibrated pins ({color-contrast} × 2/2/1 at both
   viewports) landed in the new `a11y auth screens gate` describe in
   `tests/e2e/accessibility.spec.ts` (six tests = 3 screens × 2
   viewports, each in its own ANONYMOUS context —
   `browser.newContext({...})` with the iPhone 14 descriptor spread in
   for the mobile half; zero rate-limit impact). 23/23 a11y tests green
   (was 17).
9. **Dual mutation efficacy check** (one at a time, rebuild, run,
   verify the failure REASON, revert, re-run GREEN):
   - **Mutation 1 — the verify-email collector's aria-label removed:**
     verify-email FAILED at both viewports with
     `[{"id":"color-contrast","nodes":1},{"id":"label","nodes":1}]` —
     the hidden `opacity-0` input's ONLY name source is the
     aria-label, and with no placeholder there is no mask; register +
     forgot-password stayed GREEN. The per-screen pin proof.
   - **Mutation 2 — the register label-association class (REVISED
     LIVE):** the FIRST design (removing only
     `<Label htmlFor="confirmPassword">`) did NOT bite — all six tests
     green. Root cause investigated: **axe's `label` rule `any` checks
     include `non-empty-placeholder`** — the reference-parity
     `placeholder="••••••••"` on the password inputs is a last-resort
     name source that MASKS the label-association defect. **L29
     registered.** The revised mutation (the htmlFor AND the
     placeholder removed): register FAILED at both viewports with
     `[{"id":"color-contrast","nodes":2},{"id":"label","nodes":1}]`
     while forgot-password + verify-email stayed GREEN.
   - En route: the L25 stale-server trap hit once (the manually-booted
     :3100 calibration server kept serving the pre-rebuild build —
     the setup login timed out on stale chunks); killed via the
     `/proc/net/tcp` walk, re-run clean.
   - Both mutations reverted (git-diff clean) → GREEN again.
10. **Gate at ship:** lint 0/0 · tsc clean · 100/100 unit · build exit 0
    (23 routes, zero deprecation warnings) · **178/178 E2E = 278 total**
    (was 272; +6 auth-screens gate tests, none removed) — **two
    consecutive full E2E runs** for determinism (the :3100 calibration
    server killed via the `/proc/net/tcp` walk before each run — the
    L25 discipline).
11. **Live re-verification:** the :3000 production server restarted on
    the current build; pixel re-diff — all 8 routes at the identical
    baseline numbers (the gate is test-level, rendering-neutral,
    empirically confirmed). **The 19th mobile-nav screenshot is
    BYTE-IDENTICAL (md5 `05de11678965f30a85f9196c2ec43bae`) to the
    13th through the 18th** — seven consecutive rounds of rendering
    continuity across the CSP, a11y-gate, gate-extension, CWV-gate,
    mobile-CWV-gate, and auth-screens-gate changes. The
    diff/calibration/capture scripts persisted
    (`scripts/axe-diff-session19.mjs`,
    `scripts/axe-calibrate-session19.mjs`,
    `scripts/capture-session19.ts`, plus the re-usable
    `scripts/sweep-session19.mjs`).
12. **Screenshots:** 5 new (106–110 — 106 the auth-screens axe
    differential table, 107 the 19th mobile-nav verification, 108 the
    auth-screens gate live census, 109 the dual mutation efficacy
    proof incl. the L29 story, 110 the E2E-condition auth calibration)
    → 110 total. VLM-verified 5/5 (via the SDK's `createVision`; 4
    direct PASSes + 107 confirmed by direct inspection + md5 continuity
    — the sheet is the close-X + nav links, the "LUXE brand at top"
    expectation in the prompt was a description error, the capture is
    md5-identical to the 13th–18th; the same session-18 precedent).
    Dev-DB hygiene run clean (canonical 3 orders). `.env.example`
    verified current (no new env plumbing — the gate is test-level).
13. **Docs:** AGENTS.md (the A11Y-GATE-3 contract + the L29
    placeholder-masking lesson), CLAUDE.md (session-19 contract, 100
    unit / 178 E2E), README.md (278 tests, the auth-family census row,
    19th verification), PAD v1.19 (ADR-027 + revision row +
    Known-Issues Resolved row + matrix 28/278 + **the v1.18 title-bump
    defect fixed** — the header had read v1.17 since session-18), SKILL
    v1.19.0 (L29 + the ADR-index entry), this session log, the worklog.

## Key decisions

- **The auth-family completion over the other round-19 candidates:** the
  remaining candidates need external credentials (an email provider to
  activate ADR-011's verification gate, Stripe for ADR-007's Payment
  Element) or a new measurement protocol (INP — the scripted
  interaction protocol is the deterministic next CWV family). The
  auth-screens gate is the session-34-nominated completion round: the
  family shares one anatomy, the login anon pattern already covers it,
  and the screens carry real labeled-control dependencies (the Label
  associations; the verify-email collector's aria-label-only input).
- **Anonymous contexts, not storageState:** the auth screens render
  standalone for anon visitors (the auth.spec pattern) — the six tests
  each open their own `browser.newContext` (desktop or the iPhone 14
  descriptor), which ALSO means zero logins → zero rate-limit impact
  (the standing gate family otherwise draws from the setup's demo
  login + the admin describe's 3 logins).
- **The QUALITY pin for verify-email, honestly derived:** the live
  differential revealed the reference's `/verify-email` route renders
  its client-side platform 404 — the reference's verify screen is a
  state inside its register flow, not a standalone route. Pinning the
  reference's 404-page census as a "parity" target would be dishonest;
  the clone's standalone superset screen gets a QUALITY census pin
  (the admin-gate precedent — the honest contract for surfaces with no
  reference counterpart).
- **The L29 lesson recorded rather than worked around:** the first
  mutation-2 design silently failed (the placeholder masks the
  label-association defect), which is exactly the class of engine fact
  this project's trap log exists to record. The lesson cuts both ways:
  mutation designs must account for it, AND the gate itself cannot see
  a label-association regression on placeholder-carrying inputs — the
  visible `<Label htmlFor>` association remains the primary name
  contract, with the placeholder as the documented last line of
  defense. (The alternative — stripping the reference-parity
  placeholders so the gate could see more — would break visual parity;
  rejected.)
- **In-place extension, the ADR-024/026 precedent:** the auth-screens
  gate is the SAME contract family (the axe census) on the SAME tool —
  one describe added to `accessibility.spec.ts`, the same `runAxe`
  helper, the same assertion shape.

`docs/remediation-plan-session19.md` records the full audit trail.

## Suggested next steps

Round-20 candidates: INP pins (the scripted interaction protocol — the
deterministic next CWV family; needs a repeatably-driven interaction
set like the cart stepper or the search typeahead), an email provider
to activate the ADR-011 verification gate (external credentials), or
Stripe Payment Element (ADR-007's documented next step, external
credentials). Just say the word.

## Ship

Committed `3cc091e` (feat: session-19 auth-screens axe gate, ADR-027) and
pushed to `main` via `docs/ssh_git_wrapper_v3.py` (the paramiko-shim
Appendix-A deployment — no OpenSSH binary in this sandbox): the wrapper's
post-push verification confirmed `refs/heads/main @ 3cc091e == local HEAD`
and synced `refs/remotes/origin/main`. The operator key shredded. The
remediation plan's final sign-off item checked off in the follow-up commit.
