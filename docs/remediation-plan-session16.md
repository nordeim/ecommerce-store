# Remediation Plan — Session 16 Review (Round-16 Mobile + Admin Axe Gate Extension)

**Date:** 2026-10-08
**Repo:** `nordeim/ecommerce-store` (branch `main`, baseline `2404bf0` — the
session-15 ship `f3fdc26` plus the remotely-added `docs/session_29.md`
narrative)
**Author:** Review/build agent (Super Z)
**Scope:** Live differential audit (round 16) of the LUXE Store clone against
the reference (`fuzzy-lumina-style-hub.base44.app`). Fifteen prior rounds
closed the catalog, cart, checkout, auth, account, PDP, admin,
computed-geometry, mobile-geometry, social-metadata, interaction-engine,
typography/keyboard, axe-a11y/security-header, CWV/admin-filter,
delivery-layer/CSP, and standing-axe-gate gaps (256-test gate). Round 16
targets: (a) the standing user priorities — mobile navigation (16th
verification, Tailwind v4 watch) and reference drift on pinned surfaces;
(b) the standing drift watches (8-route pixel sweep, full-route console +
link census, typeahead, carousel); (c) **the round's primary new surface —
the MOBILE-VIEWPORT axe differential** (never measured: 15 rounds of
mobile-nav geometry verifications, but no mobile a11y census) and **the
ADMIN-SURFACE axe census** (superset surface, no reference counterpart —
never measured with axe). The `skills/` folder is excluded from code
checking, testing and compilation per the operating contract.

**Method:** Baseline gate (256/256 green, exactly the documented session-15
ship state) → agent-browser sessions (`ref` = production reference logged in
as the operator account, `clone` = production standalone server on :3000,
ONE host — localhost — for the whole clone lifecycle per the session-14
lesson; states saved before device emulation) + the session-15 paired pixel
sweep + full-route census scripts re-run + the round's new
`scripts/axe-diff-session16.mjs` (mobile differential + admin census, same
axe build 4.14.0 injected every side, scrolled-reveal per the session-12
whileInView trap). Every conclusion carries live-measured evidence from
both sites.

---

## 1. Baseline verification (state at audit start)

| Gate | Result |
|---|---|
| `bun run lint` | 0 errors, 0 warnings |
| `bun run typecheck` | clean |
| `bun run test` (Vitest) | 100/100 passed |
| `bun run build` (the repo wrapper — never raw `next build`) | exit 0, 23 routes |
| `bun run test:e2e` (Playwright) | 156/156 passed (256 total) |
| DB contract | `db/custom.db` at repo root; hard-link convergence live at the injected sandbox path (inode 172348, both paths); canonical state |
| Docs | AGENTS/CLAUDE/README/PAD v1.15/SKILL v1.15.0 all current through session-15 (256-test gate, ADR-023) |
| Env | `.env` `DATABASE_URL="file:../db/custom.db"`; byte-identical to `.env.example`; session-15 deliverables verified in code (`tests/e2e/accessibility.spec.ts` + `axe-core@4.14.0` pin + the persisted axe-diff/calibrate/census/sweep/capture scripts) |
| Stale servers | both the :3000 production server and the :3100 E2E calibration server from the prior session were found live and killed BEFORE the rebuild (the L25 lesson — a stale server under a rebuilt `.next/standalone` 500s every renamed chunk) |

**Standing state:** the axe standing gate, CSP nonce pipeline, and all four
security headers live on the standalone server (re-verified via curl — the
nonce differs across two requests).

## 2. Audit results

### Verified at parity this round (no action required)

- **Mobile navigation menu (16th standing verification):** iPhone 14 on both
  sites (agent-browser device emulation, 390×844, DPR 3): the Sheet panel
  class string matches token-for-token (`fixed z-50 gap-4 bg-background p-6
  shadow-lg transition ease-in-out … inset-y-0 left-0 h-full border-r …
  w-72 sm:max-w-sm`), pad 24px, bg `rgb(251, 250, 249)`, w-72 (288px), nav
  `flex flex-col gap-4 mt-8` (gap 16px, margin-top 32px), all 5 links
  identical (text + hrefs incl. the category deep-links) at 239×44,
  18px/500, `display:block`. **No Tailwind v4 regression (16th consecutive
  verification).** Functional check: clicking "Electronics" navigates to
  `/shop?category=electronics` and the sheet auto-closes.
- **Pixel diffs @1024 (standing drift re-check, 8 routes):** home 0.34 /
  shop 0.38 / PDP 0.68 / cart 0.34 / wishlist 0.34 / checkout 0.35 / account
  0.34 / login 0.28 — ALL at the documented baseline band, byte-identical
  to the session-15 numbers. No drift on any pinned surface.
- **Full-route production-readiness census (re-run):** 22 manifest routes —
  ZERO console errors/warnings/pageerrors (demo-user + admin contexts); link
  integrity 19/19 internal targets 200/3xx.
- **Typeahead drift watch:** typing "headphones" into the reference's search
  (fetch + XHR instrumented) fires ZERO search network requests — the
  clone's `/api/search` remains the registered superset.
- **Carousel cadence watch:** with the pointer off the hero, both sites flip
  slides at the same ~5.0s cadence (dot transitions measured at 5501/11001ms
  ref vs 5500/11001ms clone — identical within measurement resolution).
- **The round's primary new surface — the MOBILE-VIEWPORT axe differential
  (iPhone 14 via `devices["iPhone 14"]`, both sites, same build 4.14.0,
  scrolled-reveal):** the clone's violation census is EXACTLY
  `{color-contrast}` on every measured route with node counts
  **byte-identical to the DESKTOP pins** — home 28, shop 23, PDP 14, cart 8,
  account 8, login 3. The reference additionally carries button-name (5–21)
  + link-name (2) + label (4, account) per route — the clone's aria
  superset HOLDS AT MOBILE (the ref's mobile profile: home button-name(21) +
  color-contrast(28) + link-name(2), etc.). The mobile profile is not a
  reflow artifact: the identical element set renders at 390px, and the
  contrast rule counts the same text nodes.
- **The round's second new surface — the ADMIN-SURFACE axe census
  (clone-only, Desktop 1280×720, admin-authenticated):** the admin
  dashboard, orders list, products list, and order detail all census at
  EXACTLY `{color-contrast}` — 8 / 7 / 7 / 7 nodes respectively. ZERO aria
  violations on any admin surface (no button-name, no label, no landmarks,
  no aria-prohibited-attr) — the admin console carries the same
  quality profile as the shopper surfaces.

### Findings

**No parity defects.** Every pinned surface verified at parity this round;
the reference shows no drift; the census found zero production-readiness
gaps. The round's finding is the gate-coverage gap the session-15 plan
itself recorded as a future candidate:

#### F1 — A11Y-GATE-2 · the standing axe gate covers neither mobile viewports nor admin surfaces

The session-15 gate (`tests/e2e/accessibility.spec.ts`) pins the axe
profile of 6 shopper routes at Desktop Chrome 1280×720 only. Two entire
surface families have NO a11y regression pin:

1. **Mobile viewports** — the standing user priority (16 consecutive
   mobile-nav geometry verifications, the Tailwind v4 watch surface). The
   desktop gate is structurally blind to mobile-only defects: an element
   hidden at desktop (`lg:hidden`) is `display:none` → axe SKIPS it at
   1280×720 → a defect that only renders at 390px passes the desktop gate
   forever. The live mobile differential proves the profile is STABLE and
   byte-identical to desktop's (28/23/14/8/8/3) — pinning it costs zero
   new calibration risk.
2. **Admin surfaces** — the clone's functional superset (4 routes: the
   dashboard, the orders list, the products list, the order detail). No
   reference counterpart exists, so the pin is a QUALITY census (the
   measured profile: `{color-contrast}` only, 8/7/7/7). Session-12's
   history proves the defect class the gate guards (aria-label on role-less
   divs, nested landmarks) shipped on SUPerset surfaces too (the admin had
   its own nested-main until session-7) — the admin surfaces currently have
   no guard at all.

**Fix design (validated against the codebase):**

1. **Extend `tests/e2e/accessibility.spec.ts`** (same file — the standing
   gate grows in place; conventions already imported: `test.describe` +
   `beforeAll` + `adminLogin(browser)` from helpers (the admin.spec
   pattern — one login per file, own rate-limit bucket: 3 admin logins per
   E2E run stays inside the 10/15min bucket with two consecutive runs) +
   `devices` from `@playwright/test` (the iPhone 14 descriptor, the same
   source the live measurement used — 390×664 viewport, isMobile, hasTouch):
   - **A MOBILE describe** — `test.use({ ...devices["iPhone 14"] })` rides
     the existing chromium project (storageState still applies — the demo
     user is authed at 390px), reusing the SAME `PROFILE` map and the same
     `runAxe` helper: the pins are the identical 28/23/14/8/8/3 (the
     mobile census is byte-identical to the desktop's — that identity IS
     the contract being pinned; a drift at EITHER viewport OR a divergence
     between viewports is flagged). The login route runs anon at iPhone 14
     via `browser.newContext({ ...devices["iPhone 14"] })` (the anon
     describe pattern).
   - **An ADMIN describe** — `beforeAll` → `adminLogin(browser)` (fresh
     desktop context, its own login); the 4 surfaces asserted with their own
     `ADMIN_PROFILE` map (census exactly `{color-contrast}` + pinned
     counts). The order-detail route is reached by CLICKING the
     `ORD-2026-001` link (the admin.spec convention — the e2e.db cuid is
     not hardcodable across fresh clones).
2. **E2E-condition calibration before pinning** (the session-15 discipline —
   pins come from E2E conditions, not the dev DB): `prisma/e2e-reset.ts`
   restores the canonical state (the a11y spec runs FIRST alphabetically —
   the DB state at its runtime is exactly the fresh-reset state), a
   standalone server boots on :3100 with the e2e DB, and
   `scripts/axe-calibrate-session16.mjs` measures the mobile 6 + admin 4
   surfaces under the exact E2E conditions (iPhone 14 + storageState for
   mobile; adminLogin for admin). The pins written into the spec are the
   calibrated numbers.
3. **Efficacy proof (two mutation checks, one per new gate):**
   - **Mobile-gate mutation:** remove `aria-label="Open navigation menu"`
     from the header's `lg:hidden` menu button (`src/components/store/
     header.tsx`) → `button-name` fires ONLY at mobile (the button is
     `display:none` at desktop — the DESKTOP gate stays GREEN while the
     MOBILE gate goes RED) → the gate is proven to catch mobile-only
     defects the desktop gate structurally cannot see → revert → GREEN.
   - **Admin-gate mutation:** add `aria-label="Stats"` to the role-less
     `div.grid.grid-cols-2.lg:grid-cols-4` stats container
     (`src/app/(storefront)/admin/page.tsx`) → `aria-prohibited-attr`
     fires ONLY in the admin describe → revert → GREEN.

**Deliberately out of scope (recorded):** fixing the shared color-contrast
violations (parity — the reference carries the identical set); an
email provider / Stripe (external credentials that don't exist for a
self-hosted clone — the round-16 candidate list's other items); server-side
pagination (no demonstrated need at 12 products / 3 demo orders); axe on
the remaining auth screens at mobile (register/forgot-password/verify-email
— the login anon pattern already covers the family's anatomy; the admin
extension is the higher-value surface).

## 3. TDD plan

**RED (`tests/e2e/accessibility.spec.ts` extension):**

1. Write the mobile describe with the LIVE-measured pins (28/23/14/8/8/3)
   first and run it under E2E conditions: any count divergence between the
   live dev-DB measurement and the E2E-condition measurement IS the RED
   (the pins must come from E2E conditions — the calibration discipline
   documents the delta before the pin lands). If the counts match
   (expected — both DBs render the canonical catalog), the RED is the
   coverage gap itself, closed by the calibration + spec landing together.
2. Write the admin describe with the live-measured pins (8/7/7/7) — same
   RED discipline via the E2E calibration.

**GREEN:** the calibrated pins + the two new describes in
`tests/e2e/accessibility.spec.ts` (no app code changes — the gate is
test-level, rendering-neutral by construction; re-verified empirically).

**Efficacy (mutations, run once during the round):** the two mutations
above — the mobile gate must catch a mobile-only defect while the desktop
gate stays green (the structural-blindness proof); the admin gate must
catch the aria-prohibited-attr class. Revert both, re-run GREEN.

**Gate:** the full suite (`lint && typecheck && test && build && test:e2e`)
— the extension rides the existing suite (+10 tests: 6 mobile + 4 admin;
none removed; the standing gate now covers both viewports of the shopper
surfaces AND the admin console). **Two consecutive full E2E runs** for
determinism (the E2E_PORT=3200 fallback if a stale :3100 server resists
killing — the L25 lesson).

**Live verification:** the pixel sweep re-run (rendering-neutral proof) +
the 16th mobile-nav screenshot compared by md5 against the 15th/13th
(rendering continuity across the gate extension).

## 4. Sign-off criteria

- [x] Baseline gate green at audit start (256/256, exactly the documented ship state)
- [x] Round-16 audit complete: mobile nav 16th verification; 8-route pixel drift re-check; full-route census re-run; typeahead + carousel watches; the mobile-viewport axe differential (6 routes both sites) + the admin-surface axe census (4 routes)
- [x] Zero parity defects confirmed (every finding at parity, no reference drift; the mobile profile byte-identical to desktop's, the aria superset holds at mobile)
- [x] E2E-condition calibration run (mobile 6 + admin 4) — the pins in the spec are the calibrated numbers
- [x] RED → GREEN: the two new describes landed with calibrated pins
- [x] Mutation efficacy checks: the mobile gate catches a mobile-only defect (desktop gate stays green); the admin gate catches the aria-prohibited-attr class; both reverted, GREEN
- [x] Full gate green: lint 0/0 · typecheck clean · 100/100 unit · build 23 routes · E2E green incl. the 10 new gate tests — two consecutive full runs for determinism
- [x] Live re-verification: pixel sweep at the identical baseline numbers; the 16th mobile-nav screenshot byte-identical (md5) to the 13th–15th
- [x] Screenshots captured under `docs/screenshots/` (91–95) + VLM-verified
- [x] Docs updated: AGENTS.md, CLAUDE.md, README.md, PAD v1.16 (ADR-024), SKILL v1.16.0, session log (session_30), worklog
- [x] `.env.example` verified current (no new env plumbing — the gate is test-level)
- [ ] Committed on `main` and pushed via the SSH wrapper (final step — checked off in the session log after the push lands)
