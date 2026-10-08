# Remediation Plan — Session 15 Review (Round-15 Full-Route Census + Standing Axe A11y Gate)

**Date:** 2026-10-08
**Repo:** `nordeim/ecommerce-store` (branch `main`, baseline `443d03d` — the
session-14 ship state `c59de6f` plus the remotely-added `docs/session_27.md`
narrative)
**Author:** Review/build agent (Super Z)
**Scope:** Live differential audit (round 15) of the LUXE Store clone against
the reference (`fuzzy-lumina-style-hub.base44.app`). Fourteen prior rounds
closed the catalog, cart, checkout, auth, account, PDP, admin,
computed-geometry, mobile-geometry, social-metadata, interaction-engine,
typography/keyboard, axe-a11y/security-header, CWV/admin-filter, and
delivery-layer/CSP gaps (250-test gate). Round 15 targets: (a) the standing
user priorities — mobile navigation (15th verification, Tailwind v4 watch)
and reference drift on pinned surfaces; (b) **the first full-route
production-readiness census** — console/page-error capture on every route in
the manifest (prior rounds censused 7–12) plus a link-integrity crawl (every
internal link target fetched, never done); (c) the standing pixel-diff drift
re-check @1024 on 8 routes; (d) the content census + console-error census +
typeahead/carousel drift watches; (e) a repeat of the session-12 axe-core
differential (same-build injection both sides) to re-establish the parity
profile before pinning it as an automated gate. The `skills/` folder is
excluded from code checking, testing and compilation per the operating
contract.

**Method:** Baseline gate (250/250 green, exactly the documented session-14
ship state) → agent-browser sessions (`ref` = production reference logged in
as the operator account, `clone` = production standalone server on :3000,
ONE host — localhost — for the whole clone lifecycle per the session-14
lesson) + a paired Playwright pixel sweep + a full-route census script + an
axe differential script. Every conclusion carries live-measured evidence
from both sites.

---

## 1. Baseline verification (state at audit start)

| Gate | Result |
|---|---|
| `bun run lint` | 0 errors, 0 warnings |
| `bun run typecheck` | clean |
| `bun run test` (Vitest) | 100/100 passed |
| `bun run build` (the repo wrapper — never raw `next build`) | exit 0, 23 routes, zero deprecation warnings |
| `bun run test:e2e` (Playwright) | 150/150 passed (250 total) |
| DB contract | `db/custom.db` at repo root; hard-link convergence live at the injected sandbox path (inode 172348, both paths); canonical state (12 products, 3 demo orders) |
| Docs | AGENTS/CLAUDE/README/PAD v1.14/SKILL v1.14.0 all current through session-14 (250-test gate, 13 traps) |
| Env | `.env` `DATABASE_URL="file:../db/custom.db"` created from `.env.example`; session-14 deliverables verified in code (`src/proxy.ts` CSP live on the server, force-dynamic auth pages, 85 screenshots) |

**Standing state:** the CSP nonce pipeline + all four security headers live
on the standalone server (re-verified via curl — the nonce differs across
two requests); the admin-order filter bar renders on the production server.

## 2. Audit results

### Verified at parity this round (no action required)

- **Mobile navigation menu (15th standing verification):** iPhone 14 on both
  sites: the Sheet panel class string matches token-for-token (`fixed z-50
  gap-4 bg-background p-6 shadow-lg transition ease-in-out … inset-y-0
  left-0 h-full border-r … w-72 sm:max-w-sm`), pad 24px, bg
  `rgb(251, 250, 249)`, w-72 (288px), nav `flex flex-col gap-4 mt-8` (gap
  16px, margin-top 32px), all 5 links identical (text + hrefs incl. the
  category deep-links) at 239×44, 18px/500, `display:block`. **No Tailwind
  v4 regression (15th consecutive verification).** Functional check:
  clicking "Electronics" navigates to `/shop?category=electronics` and the
  sheet auto-closes (the documented deliberate superset behavior).
- **Pixel diffs @1024 (standing drift re-check, 8 routes):** home 0.34 /
  shop 0.38 / PDP 0.68 / cart 0.34 / wishlist 0.34 / checkout 0.35 / account
  0.34 / login 0.28 — all at the documented baseline band (0.27–0.63%;
  PDP's 0.68% sits in the documented thin-text-AA sub-threshold family —
  session-12 proved the PDP pair reproduces with a 0.00% reference
  self-diff). No drift on any pinned surface. The sweep script enforces the
  session-14 lessons: ONE host for the clone lifecycle, auth verified via
  `location.pathname` immediately before every authed capture (a failed
  login aborts the sweep), networkidle + font-ready + fixed settle on every
  route.
- **Content census:** home product-card text byte-identical on both sites
  (22 link texts incl. badges + ratings + prices). One recorded
  non-defect: the DOM text of the card category label differs in CASE
  (clone `Electronics`, reference `electronics`) — both elements carry the
  identical class string `text-xs text-muted-foreground capitalize mb-1`
  and the identical computed `text-transform: capitalize`, so both RENDER
  identically ("Electronics"); the pixel diff confirms (home 0.34%). DOM
  text is not the contract; computed rendering is.
- **Hero carousel timing:** with the pointer off the hero, the clone flips
  slides at ~5.0s intervals (measured 4964 + 5036ms) — the reference cycles
  at ~5.0s too (measured 4960 + 5040ms). Cadence parity confirmed.
- **Console-error census:** ZERO console errors/warnings/pageerrors on the
  home route (agent-browser) AND on the full 22-route manifest walk
  (census script, authenticated demo-user context) AND on all 4 admin
  surfaces (admin-authenticated context). Prior rounds censused 7–12
  routes; this round covered the manifest.
- **Typeahead drift watch:** typing in the reference's search fires ZERO
  search network requests (client-side in-memory filtering — re-confirmed)
  — the clone's `/api/search` remains the registered superset.
- **The round's primary new surface — full-route production-readiness
  census:**
  - **Route manifest walk (22 routes):** every route in the build manifest
    loaded in a real browser with networkidle — ZERO console entries, ZERO
    page errors, ZERO navigation failures (home, shop ×3 filter/search
    states, PDP incl. the unknown-slug in-chrome not-found, cart, checkout,
    wishlist, account, all four auth screens, all four admin surfaces incl.
    the order detail, the platform 404, sitemap, robots, health).
  - **Link-integrity crawl:** 19 unique internal link targets collected
    from the rendered pages — ALL resolve 200/3xx. Zero broken internal
    links. (No 404-status targets either — the platform-404 route renders
    via the document response, and product links all resolve.)
- **Axe-core differential (session-12 methodology repeated, same build
  4.14.0 injected both sides, scrolled-reveal per the whileInView trap):**
  the clone's violation profile on the 6 measured routes is EXACTLY the
  shared-parity set — `color-contrast` only, with node counts
  byte-identical to the reference's on every route (home 28=28, shop 23=23,
  PDP 14=14, cart 8=8, account 8=8, login 3=3). The reference additionally
  carries 4–20 `button-name` + 2 `link-name` + 4 `label` violations per
  route that the clone does not (the documented aria superset). The counts
  were re-calibrated under exact E2E conditions (standalone server on the
  e2e DB, Desktop Chrome 1280×720, storageState auth) — identical numbers:
  28/23/14/8/8/3.

### Findings

**No parity defects.** Every pinned surface verified at parity this round;
the reference shows no drift. The full-route census and link crawl found
zero production-readiness gaps (no console noise, no dead links).

The round's finding is the process gap that session-12's own history
exposes — **the axe differential exists only as a manual audit**:

#### F1 — A11Y-GATE-1 · the a11y parity profile is not regression-pinned (the axe differential is manual-only)

Session-12's axe differential exposed the longest-lived defect in the
project's history — four shopper pages shipped a NESTED `<main>` landmark
from session-1 through session-11, invisible to eleven computed-style
rounds (Playwright `main`-locator chains dedupe shared descendants), and
`aria-label`s on role-less divs. Those were fixed in session-12 — but the
only thing preventing their return is a human remembering to re-run the
manual injection. Meanwhile the E2E suite pins geometry, colors, catalog
order, money, CSP, headers, fonts — everything EXCEPT the a11y profile.
The profile is stable (re-measured this round at byte-identical counts),
the reference parity contract is documented (color-contrast is a SHARED
trait — white-on-orange badges etc. — dismissed as parity in session-12),
and the injection is fully self-hostable (axe-core already ships in the
repo's node_modules as a transitive of eslint-plugin-jsx-a11y). This is the
standing-gate conversion the session-14 log itself nominated as a round-15
candidate.

**Fix design (validated against the codebase):**

1. **`axe-core` as an explicit devDependency** (pinned `4.14.0` — the
   exact build currently in the tree via the eslint chain and the exact
   build this round's differential injected on both sites; an explicit pin
   keeps the E2E injection independent of the lint chain's resolution).
2. **New spec `tests/e2e/accessibility.spec.ts`** (joins the main chromium
   project — storageState-authenticated, like every parity spec):
   - Routes: `/`, `/shop`, `/product/wireless-headphones`, `/cart`,
     `/account` (authed) + `/login` (anon — an opted-out describe, the
     auth.spec pattern).
   - Injection: `page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" })`
     — self-hosted (no CDN, CSP-compatible: Playwright injects via the
     DevTools protocol, exempt from page CSP).
   - The scrolled-reveal pass before `axe.run` (the session-12
     whileInView methodology trap — content kept at `opacity: 0` until
     scrolled is skipped by axe).
   - **The parity contract assertions:** (a) the violation ID census is
     EXACTLY `{color-contrast}` on every measured route — any other rule
     firing (button-name, label, landmarks, aria-prohibited-attr, …) is a
     REGRESSION (the aria superset + the session-12 fixes pinned);
     (b) the color-contrast node counts equal the calibrated pins
     (28/23/14/8/8/3) — a drift in EITHER direction is flagged (the counts
     are byte-identical to the reference's, measured this round).
3. **Efficacy proof (the mutation check, run once during the round):**
   temporarily re-introduce a session-12-class defect (an `aria-label` on
   the toast viewport's role-less div) → the gate FAILS (aria-prohibited-attr
   appears in the census) → revert → the gate is GREEN again. A gate that
   has never caught anything is unproven; this proves the census assertion
   actually bites.

**Deliberately out of scope (recorded):** fixing the shared color-contrast
violations (they are PARITY — the reference carries the identical set;
"fixing" only the clone would break parity); axe on the admin surfaces
(superset surface, no reference counterpart — recorded as a future
candidate); axe on mobile viewports (the geometry is separately pinned by
the mobile specs); HTML-validate / link-checker tooling (the link crawl
ran clean this round; a standing gate would duplicate the manifest walk).

## 3. TDD plan

**RED (`tests/e2e/accessibility.spec.ts`):**

1. Write the spec with the zero-violation assertion first — "every route's
   axe profile is CLEAN" — and run it: it FAILS for the right reason
   (color-contrast violations exist: 28 on home — the shared parity trait
   with the reference). The failure documents that the baseline profile is
   a DELIBERATE parity contract, not an oversight, before the profile gets
   pinned.
2. Also RED-verify the injection itself: the spec's `addScriptTag` +
   `axe.run` wiring must work under the production server's CSP (if the
   injection were blocked, the spec fails with "axe is not defined" — the
   wrong reason, fixed in the wiring, not the assertion).

**GREEN:** refine the assertions to the measured parity contract —
census === {color-contrast} + the pinned node counts (28/23/14/8/8/3);
`axe-core` pinned as an explicit devDependency in package.json.

**Efficacy (mutation):** temporarily add `aria-label="Notifications"` back
onto the toast viewport div (`src/components/store/toast-viewport.tsx`),
re-run the home assertion → expect a FAIL (aria-prohibited-attr in the
census) → revert → GREEN. Recorded in the session log.

**Gate:** the full suite (`lint && typecheck && test && build && test:e2e`)
— the new spec rides the existing 150-test suite (+6 tests: one per route;
none removed; the standing gate now runs on every `test:e2e` invocation).

**Live verification:** the axe-diff script (already persisted as
`scripts/axe-diff-session15.mjs`) re-run post-change — the profile
unchanged; the calibration script (`scripts/axe-calibrate-session15.mjs`)
documents the E2E-condition pins.

## 4. Sign-off criteria

- [x] Baseline gate green at audit start (250/250, exactly the documented ship state)
- [x] Round-15 audit complete: mobile nav 15th verification; full-route census (22 routes) + link-integrity crawl (19 targets); 8-route pixel drift re-check; content + console + typeahead/carousel drift watches; axe differential re-measurement
- [x] Zero parity defects confirmed (every finding at parity, no reference drift)
- [x] RED test written and confirmed failing for the right reason (the zero-violation assertion fails on the shared color-contrast trait — the parity contract encoded deliberately)
- [x] GREEN: the parity-profile spec (census + pinned counts) + axe-core as an explicit pinned devDependency
- [x] Mutation efficacy check: a re-introduced session-12-class defect FAILS the gate; reverted, the gate is GREEN
- [x] Full gate green: lint 0/0 · typecheck clean · 100/100 unit · build 23 routes · E2E green incl. the 6 new a11y gate tests — two consecutive full runs for determinism
- [x] Live re-verification against the production server (axe profile unchanged; the differential scripts persisted)
- [x] Pixel re-diff of the 8-route sweep unchanged from parity (the spec adds no surface changes — code-identical rendering expected; re-verified)
- [x] Screenshots captured under `docs/screenshots/` (86–90) + VLM-verified
- [x] Docs updated: AGENTS.md (the a11y-gate contract), CLAUDE.md, README.md, PAD v1.15 (ADR-023), SKILL v1.15.0, session log (session_28), worklog
- [x] `.env.example` verified current (no new env plumbing — the gate is test-level)
- [ ] Committed on `main` and pushed via the SSH wrapper (final step — checked off in the session log after the push lands)
