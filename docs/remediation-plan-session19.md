# Remediation Plan — Session 19 Review (Round-19 Auth-Screens Axe Gate Completion)

**Date:** 2026-10-09
**Repo:** `nordeim/ecommerce-store` (branch `main`, baseline `78685e3` — the
session-18 ship `536ddac` + sign-off `eb1d4ca` + the remotely-added
`docs/session_35.md` narrative)
**Author:** Review/build agent (Super Z)
**Scope:** Live differential audit (round 19) of the LUXE Store clone against
the reference (`fuzzy-lumina-style-hub.base44.app`). Eighteen prior rounds
closed the catalog, cart, checkout, auth, account, PDP, admin,
computed-geometry, mobile-geometry, social-metadata, interaction-engine,
typography/keyboard, axe-a11y/security-header, CWV/admin-filter,
delivery-layer/CSP, standing-axe-gate, mobile/admin-gate, CWV-gate, and
mobile-CWV-gate gaps (272-test gate). Round 19 targets: (a) the standing
user priorities — mobile navigation (19th verification, Tailwind v4 watch)
and reference drift on pinned surfaces; (b) the standing drift watches
(8-route pixel sweep, full-route console + link census, typeahead,
carousel); (c) **the round's primary new surface — the AUTH-SCREENS axe
differential** (register / forgot-password / verify-email on BOTH sites,
desktop AND mobile — the session-34-nominated completion round) and the
finding it drives: **the standing axe gate covers login but NOT the rest
of the auth family — a defect introduced on those screens (an unlabeled
input, a broken label association, a landmark regression) passes the
standing gate forever** (the A11Y-GATE-2 structural-blindness story, now
for the auth family's remaining routes). The `skills/` folder is excluded
from code checking, testing and compilation per the operating contract.

**Method:** Baseline gate (272/272 green, exactly the documented session-18
ship state) → agent-browser sessions (`ref` = production reference logged in
as the operator account, `clone` = production standalone server on :3000,
ONE host — localhost — for the whole clone lifecycle per the session-14
lesson; states saved before device emulation) + the session-15 paired pixel
sweep + full-route census scripts re-run + the round's new
`scripts/axe-diff-session19.mjs` (the SAME axe-core 4.14.0 build injected on
both sites, the scrolled-reveal pass per the session-12 trap, anonymous
contexts — the auth screens render standalone for anon visitors, the
auth.spec pattern). Every conclusion carries live-measured evidence from
both sites.

---

## 1. Baseline verification (state at audit start)

| Gate | Result |
|---|---|
| `bun run lint` | 0 errors, 0 warnings |
| `bun run typecheck` | clean |
| `bun run test` (Vitest) | 100/100 passed |
| `bun run build` (the repo wrapper — never raw `next build`) | exit 0, 23 routes, zero deprecation warnings |
| `bun run test:e2e` (Playwright) | 172/172 passed (272 total) |
| DB contract | `db/custom.db` at repo root (fresh `db:setup` run with the repo URL inline); hard-link convergence live at the env-shadowed sandbox path (inode 172841, both paths — the documented L-environment contract; `tests/db-path.test.ts` green) |
| Docs | AGENTS/CLAUDE/README/PAD v1.18/SKILL v1.18.0 all current through session-18 (272-test gate, ADR-026, 28 lessons); the session-18 deliverables verified in code (the 7-test performance spec + the persisted diff/calibrate/capture scripts). One cosmetic defect found: the PAD's TITLE still reads "v1.17" (the session-18 revision row + ADR-026 landed but the header was not bumped) — fixed in this round's docs pass |
| Env | `.env` recreated from `.env.example` (`DATABASE_URL="file:../db/custom.db"`; the shell-exported sandbox `DATABASE_URL` shadows the repo file — the hard link converges both paths on ONE file); `.env.example` byte-identical to the shipped state |
| Stale servers | none live at audit start (the `/proc/net/tcp` socket-inode walk scanned :3000/:3100 clean); the round's :3000 server detached via the double-fork orphan pattern (the sandbox reaps plain background processes between commands — the agent-browser daemon is the surviving precedent) |

## 2. Audit results

### Verified at parity this round (no action required)

- **Mobile navigation menu (19th standing verification):** iPhone 14 on both
  sites (agent-browser device emulation, 390×844, DPR 3, hover:false): the
  Sheet panel class string matches token-for-token (modulo attribute order),
  pad 24px, bg `rgb(251, 250, 249)`, w-72 (288px), nav `flex flex-col gap-4
  mt-8` (gap 16px, margin-top 32px), all 5 links identical (text + hrefs
  incl. the category deep-links) at 239×44, 18px/500, `display:block`.
  **No Tailwind v4 regression (19th consecutive verification).** Functional
  check: clicking "Electronics" navigates to `/shop?category=electronics`
  and the sheet auto-closes (the registered superset behavior).
- **Pixel diffs @1024 (standing drift re-check, 8 routes):** home 0.34 /
  shop 0.38 / PDP 0.68 / cart 0.34 / wishlist 0.34 / checkout 0.35 /
  account 0.34 / login 0.28 — ALL at the documented baseline band,
  byte-identical to the session-15/16/17/18 numbers. No drift on any pinned
  surface.
- **Full-route production-readiness census (re-run):** 22 manifest routes —
  ZERO console errors/warnings/pageerrors (demo-user + admin contexts);
  link integrity 19/19 internal targets 200/3xx; admin console clean.
- **Typeahead drift watch:** typing "headphones" into the reference's
  search (fetch + XHR instrumented, search expanded via its icon button)
  fires ZERO search network requests (the remaining requests are base44
  platform telemetry only) — the clone's `/api/search` remains the
  registered superset.
- **Carousel cadence watch:** with the pointer off the hero, both sites
  flip slides at the same ~5.0s cadence (reference stable intervals
  5006/5003ms; clone 5003/5003ms — the first sub-5s interval on each side
  is the mid-cycle entry artifact of the probe's start, not a cadence
  difference; the dot probe tracks the w-8 ACTIVE dot).
- **The round's primary new surface — the AUTH-SCREENS axe differential
  (anonymous contexts, both sites, desktop 1280×720 AND mobile iPhone 14
  390×844, axe-core 4.14.0 both sides, scrolled-reveal pass):**

  | Route | Clone census (desktop) | Ref census (desktop) | Clone census (mobile) | Ref census (mobile) |
  |---|---|---|---|---|
  | /register | {color-contrast}(2) | {color-contrast}(2) | {color-contrast}(2) | {color-contrast}(2) |
  | /forgot-password | {color-contrast}(2) | {color-contrast}(2) | {color-contrast}(2) | {color-contrast}(2) |
  | /verify-email | {color-contrast}(1) | {color-contrast}(1)* | {color-contrast}(1) | {color-contrast}(1)* |

  \* **Measured against the reference's PLATFORM 404** — the reference's
  `/verify-email` route renders its client-side 404 ("The page
  'verify-email' could not be found in this application") because the
  reference's verify screen is a client-side state INSIDE its register
  flow, not a standalone route. The clone's `/verify-email` (a real
  standalone route since session-4, ADR-011) is therefore a **SUPERSET
  surface with no reference counterpart** — its census is a QUALITY pin
  (the admin-gate precedent), not a parity pin. The coincidental count
  match (1 = 1) is not a parity signal.

  The register and forgot-password censuses are TRUE parity: identical
  rule sets AND identical node counts on both sites at both viewports.
  The aria superset holds (the reference carries no additional violations
  on these screens — the auth family's inputs are properly labeled on
  both sites). **Zero parity defects on the new surface.**

### Findings

**No parity defects.** Every pinned surface verified at parity this round;
the reference shows no drift; the census found zero production-readiness
gaps; the auth-screens differential is clean. The round's finding is the
coverage gap the session-34 doc itself nominated:

#### F1 — A11Y-GATE-3 · the axe gate covers login but not the auth family

The standing axe gate (A11Y-GATE-1/2) pins login (desktop + mobile) plus
home/shop/PDP/cart/account (desktop + mobile) plus the admin console —
but register, forgot-password, and verify-email are NOT in the gate. The
auth family shares ONE anatomy (the session-4 rebuild: header block
outside the card, icon-led h-12 inputs with `<Label htmlFor>`
associations, the line-and-label "or" divider, the tinted error box) —
and the family's remaining routes carry real labeled-control
dependencies that a regression could silently break:

1. **The label-association class** — register's three fields
   (Email/Password/Confirm Password) and forgot-password's Email field
   depend on `<Label htmlFor>`; a refactor that drops or mismatches the
   `htmlFor` leaves the input unlabeled → axe `label` fires → the
   standing gate stays green (the screens are not measured).
2. **The aria-label class** — verify-email's 6-digit collector is a
   single invisible input overlaid on the visual digit boxes whose ONLY
   label is `aria-label="Verification code"`
   (`verify-email-form.tsx`) — the screen's most fragile a11y contract
   (the visual boxes are divs, not inputs; the input is
   `opacity-0`). Dropping the aria-label leaves a keyboard/SR-dead
   control that the standing gate never sees.
3. **The landmark/region class** — the auth screens deliberately carry
   NO `main` landmark (reference parity — the auth.spec selector
   contracts depend on it); a future "fix" that adds chrome or a main to
   the auth group breaks both the parity anatomy AND the selector
   contracts — the axe census would flag `landmark-one-main`/region
   rules only if the screens were measured.

The A11Y-GATE-2 precedent applies exactly: the mobile gate exists because
a viewport-only gate has a blind side; the auth-screens gate completes
the family coverage. This is the **nominated round-19 candidate** (the
remaining candidates need external credentials — email provider for
ADR-011, Stripe for ADR-007 — or a new measurement protocol — INP).

**Fix design (validated against the codebase):**

1. **Extend `tests/e2e/accessibility.spec.ts` with an `a11y auth screens
   gate` describe (session-19, A11Y-GATE-3):** six tests — the three
   screens × two viewports, each in an ANONYMOUS context (the
   auth.spec/login-gate pattern: `browser.newContext({ storageState:
   { cookies: [], origins: [] } })`; the screens render standalone for
   anon visitors):
   - Desktop (1280×720): register census exactly {color-contrast} ×2,
     forgot-password ×2, verify-email ×1 (the QUALITY pin — superset
     surface).
   - Mobile (iPhone 14 390×844, the device descriptor spread into the
     newContext): the SAME pins (live-measured identical at both
     viewports — the counts are viewport-invariant on these screens, but
     the gate spans both per the A11Y-GATE-2 lesson: a viewport-only
     gate has a blind side).
   - The describe reuses the SAME `runAxe` helper and the SAME census
     assertion shape (ids toEqual ["color-contrast"] + count pins).
2. **No app code changes** — the gate is test-level, rendering-neutral
   by construction (the session-15/16/17/18 pattern; the pixel sweep +
   mobile-nav md5 re-verification prove it empirically).
3. **E2E-condition calibration before pinning** (the session-15/16/17/18
   discipline — pins come from E2E conditions, not the live dev-DB):
   `scripts/axe-calibrate-session19.mjs` boots the standalone server on
   :3100 against the e2e DB (after `prisma/e2e-reset.ts` restores the
   canonical state) and measures the three screens at both viewports
   under the exact E2E conditions (the auth screens are anonymous +
   DB-independent, so the counts are expected to be byte-identical to
   the live differential — the calibration CONFIRMS the invariance, the
   admin-gate precedent).
4. **Efficacy proof (two mutation checks, per the L26 lesson — target
   the label class on live inputs; REVISED after the live run, see L29):**
   - **Mutation 1 (the verify-email aria-label class):** remove
     `aria-label="Verification code"` from the hidden collector input →
     the verify-email tests FAIL with the `label` rule (an unlabeled
     text input — its placeholder ABSENT, so nothing masks the defect)
     at BOTH viewports; register/forgot stay green. **CONFIRMED LIVE**
     (label(1) at both viewports, the other four tests green).
   - **Mutation 2 (the register label-association class, REVISED):** the
     FIRST design (removing only the `<Label htmlFor="confirmPassword">`
     association) did NOT bite — **L29: axe's `label` rule accepts the
     non-empty PLACEHOLDER as a last-resort name source** (`any` check
     `non-empty-placeholder`), and the auth screens' password inputs
     carry the reference-parity `placeholder="••••••••"` which masks
     every label-association defect. The revised mutation removes the
     htmlFor AND the placeholder → the register tests FAIL with the
     `label` rule at BOTH viewports; the other screens stay green.
     **CONFIRMED LIVE** (label(1) at both viewports, the other four
     tests green). The L29 lesson is registered: mutations in the
     label-association class on inputs carrying placeholders must also
     remove the placeholder, or the label rule never fires.
5. **Gate math:** +6 E2E tests (172 → 178; total 272 → 278; none
   removed). Two consecutive full E2E runs for determinism (the L25
   stale-server discipline: kill the :3100 calibration server before the
   suite runs). No new logins — the auth-screens tests are anonymous
   (zero rate-limit impact).

**Deliberately out of scope (recorded):** INP pins (needs a scripted
interaction protocol — the deterministic next CWV family); an email
provider / Stripe (external credentials that don't exist for a
self-hosted clone); reference-side auth-screen census pinning on
verify-email (the reference has no standalone route — its 404 page is
not a parity target); the auth screens' color-contrast node REDUCTION
(the 2/2/1 counts are the shared parity trait — "fixing" only the clone
would break parity, the session-15 contract).

## 3. TDD plan

**RED (`tests/e2e/accessibility.spec.ts` — the new auth-screens describe):**

1. Write the six tests with the zero-tolerance form of the pins (census
   `[]`, count 0) and run them under E2E conditions: all six must fail
   for the RIGHT reason — the measured {color-contrast} census at
   2/2/1 in the failure payloads.
2. Verify each failure message carries the measured numbers (the audit's
   discipline: the RED is the evidence the assertions bite).

**GREEN:** the calibrated pins ({color-contrast} × 2/2/1 at both
viewports) + the settled describe (no app code changes — the gate is
test-level, rendering-neutral by construction).

**Efficacy (mutations, run once during the round):**
- the verify-email aria-label removal must fail ONLY the verify-email
  tests (label rule) at both viewports;
- the register label-association removal must fail ONLY the register
  tests (label rule) at both viewports — **revised live: the htmlFor
  removal alone is masked by the `••••••••` placeholder (L29 — axe's
  label rule accepts a non-empty placeholder as a name source); the
  mutation also removes the placeholder to bite**;
Revert both, re-run GREEN.

**Gate:** the full suite (`lint && typecheck && test && build && test:e2e`)
— the auth-screens describe adds 6 E2E tests (172 → 178; total 272 → 278;
none removed). **Two consecutive full E2E runs** for determinism (kill the
:3100 calibration server first — the L25 lesson).

**Live verification:** the pixel sweep re-run (rendering-neutral proof) +
the 19th mobile-nav screenshot compared by md5 against the 13th–18th
(rendering continuity across the gate addition).

## 4. Sign-off criteria

- [x] Baseline gate green at audit start (272/272, exactly the documented ship state)
- [x] Round-19 audit complete: mobile nav 19th verification; 8-route pixel drift re-check; full-route census re-run; typeahead + carousel watches; the auth-screens axe differential (3 screens × 2 viewports × both sites)
- [x] Zero parity defects confirmed (register/forgot-password byte-identical censuses on both sites at both viewports; verify-email is the superset surface with the QUALITY pin)
- [x] E2E-condition calibration run (3 screens × 2 viewports) — the pins in the spec are the calibrated numbers
- [x] RED → GREEN: the auth-screens describe landed with calibrated pins, failed-first documented
- [x] Mutation efficacy checks: the verify-email aria-label removal fails ONLY the verify-email tests; the register htmlFor removal is MASKED by the reference-parity placeholder (L29 recorded) — the revised mutation (htmlFor + placeholder removal) fails ONLY the register tests; both reverted, GREEN
- [x] L29 recorded: axe's `label` rule accepts a non-empty PLACEHOLDER as a last-resort name source — label-association mutations on inputs carrying reference-parity placeholders must also remove the placeholder
- [x] Full gate green: lint 0/0 · typecheck clean · 100/100 unit · build 23 routes · E2E green incl. the 6 new auth-screens gate tests — two consecutive full runs for determinism
- [x] Live re-verification: pixel sweep at the identical baseline numbers; the 19th mobile-nav screenshot byte-identical (md5) to the 13th–18th
- [x] Screenshots captured under `docs/screenshots/` (106–110) + VLM-verified
- [x] Docs updated: AGENTS.md, CLAUDE.md, README.md, PAD v1.19 (ADR-027 + the v1.18 title-bump fix), SKILL v1.19.0, session log (session_36), worklog
- [x] `.env.example` verified current (no new env plumbing — the gate is test-level)
- [ ] Committed on `main` and pushed via the SSH wrapper (final step — checked off in the session log after the push lands)
