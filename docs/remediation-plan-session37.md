# Remediation Plan — Session 37 (Round 37): The Customer-Facing Delivery Estimate — "When Will It Arrive?" (DELIVERY-WINDOW-1, ADR-045)

**Date:** 2026-10-11 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `5225615` (the session-36 ship `1102c3a` + the user's session_72 narrative log)
**Status at audit start:** 565-test gate (313 unit+integration + 252 E2E), PAD v1.36, SKILL v1.36.0 — lint 0/0 · tsc clean · 313/313 unit+integration (20 files) · build exit 0 · the full E2E baseline re-run **252/252 (8.2m, foreground)** verified on the pulled workspace.

## 0. The round's mandate

The user's standing round instruction (the professional Stripe integration
verification, the full audit/parity workflow with the mobile-nav + Tailwind
v4 watches, the `.env`/db-root contract, the vitest + playwright suites, the
TDD remediation plan, the screenshots, the `.env.example`, the docs, and the
main-only push). No Stripe test-mode keys or email credentials were provided
(the two standing credential-gated candidates stay gated), so the round's
deliverable is audit-derived — the pattern of rounds 27–36.

**Workspace state this round:** NOT reset — `git pull` fast-forwarded
`1102c3a → 5225615` (the user's session_72.md narrative log only, zero code
delta). The env-shadowing trap verified LIVE (the injected shell
`DATABASE_URL` — `file:/home/z/my-project/db/custom.db` — wins over both
`.env` files); the session-21 hard-link convergence intact (inode 397013 at
BOTH `db/custom.db` paths — one file, whichever resolution wins). `bun
install` (already satisfied) · `bun run db:setup` idempotent (6 categories,
12 products, 4 users, 4 canonical orders, 3 hero slides); the repo `skills/`
exclusion re-verified in all four configs (tsconfig `exclude`, eslint
`ignores`, vitest `include`, playwright `testDir`).

## 1. Baseline verification (state at audit start)

- **`git pull` → `5225615`** — the working tree clean; the repo `skills/`
  folder exclusion re-verified in all four configs.
- Environment contracts: `.env` carries `DATABASE_URL="file:../db/custom.db"`
  · `db/` at the repo root (the hard link in place) · `bun run db:setup`
  green and idempotent.
- Baseline gate: lint 0/0 · tsc clean · **313/313 unit+integration (20
  files)** · build exit 0 · **the full E2E baseline re-run 252/252 (8.2m,
  foreground — the L26/L27 lesson)** — the documented session-71/72 ship
  state verified pre-change.
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd**
  (red-green-refactor; vertical slices — one seam, one test, one
  implementation; the failing regression test first), **agent-browser** (the
  live reference walk — via the established Playwright-form battery scripts,
  the sessions 12–36 protocol), **clone-app-pat-pro** (the parity
  methodology: superset features must not change the resting visual of
  parity surfaces), plus the repo's own `ecommerce-store_SKILL.md` §4.2
  (the Tailwind v4 trap log).
- **The Round-37 live battery (the audit):** the paired pixel sweep **ALL
  8 ROUTES AT BASELINE BAND** (home 0% [6 px, both sides painted on slide
  `1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%,
  checkout 0.01%, account 0%, login 0.28%). **The 37th mobile-nav
  verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg
  rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500 with
  identical hrefs; the Electronics deep-link + auto-close passed). The
  standing watches clean (typeahead: the reference fires ZERO search
  requests; carousel ~5000ms cadence; the SEO layer: 17-URL sitemap,
  robots, JSON-LD, offers.price 299.99 USD). The console census 24 routes
  + 11 admin surfaces CLEAN.
- **The order-surface audit (the round's focus area):** the Round-36
  deliverable verified file-by-file against the docs — the seam
  (`src/lib/order-tracking.ts`), the `AdminTrackingForm` island, the schema
  columns, the seeded UPS fixture — all exactly as documented. With the
  gap below.

## 2. Audit results

### 2.1 The candidate triage (session-71's "suggested next" list)

Session 71 named the next audit-derived candidates. The triage:

1. **The customer-facing shipping-estimate / delivery-window surface (CHOSEN
   — §2.2):** session-71's first named candidate — "no schema change,
   composed from the status + placedAt." The customer order-surfaces arc
   (sessions 33→34→35→36: the money mirror → the detail read surface → the
   timeline → the tracking link) answers "where is it" but never "when will
   it arrive": the in-transit detail carries a Tracking line and a
   `Tracking added` milestone, yet the customer reading the page still has
   to do day math on the placed date to form an expectation. Every
   high-end store states the promise explicitly (the Amazon/Shopify
   pattern: "Estimated delivery: Mar 18 – 22"). The codebase has NO
   estimate surface today (verified: zero `Estimated delivery` /
   `deliveryWindow` references in `src/`, `tests/`, `prisma/`).
2. **The in-memory rate limiter's shared-store migration (DEFERRED — the
   PAD's open Medium, unchanged):** re-evaluated and re-deferred (no new
   information; correct for single-instance SQLite).
3. **The payments-surface Stripe-dashboard deep-link (DEFERRED — the
   configured-mode gate, unchanged):** renders nothing in demo mode; the
   standing E2E cannot exercise the configured branch without fixture
   keys. Deferred with the credential.

### 2.2 THE PRIMARY FINDING — the fulfillment story states the past, never the future: no delivery estimate on any customer surface (DELIVERY-WINDOW-1)

The customer order detail (ADR-042/043/044) renders the order's STORY
(placed → transitions → tracking) — all backward-looking facts. The natural
question at the moment of purchase and while the order is in flight —
"when will it arrive?" — has no in-app answer: the confirmation ends at
"Order Confirmed", the detail's header ends at the status pill, and the
customer is left to infer a date from the placed row. The reference has no
counterpart on either surface (its orders are hardcoded rows that link
nowhere; its confirmation is the mock "order placed" — verified in the
session-34/35 divergence register), so the estimate is superset-only: the
professional high-end pattern, with zero parity risk.

**The fix (one seam, two surfaces, zero schema change — session-71's exact
framing):**

- **The pure seam (`src/lib/delivery-window.ts`, NEW):**
  `deliveryWindowView(status, placedAt)` → a discriminated union (the
  order-money-state / order-tracking precedent: the calm state carries NO
  fields). The window is the standard-shipping quote — `placedAt + 3` to
  `placedAt + 7` calendar days (`DELIVERY_WINDOW_MIN_DAYS = 3`,
  `DELIVERY_WINDOW_MAX_DAYS = 7`, exported and unit-pinned — the
  `FLAT_SHIPPING_CENTS` precedent: the quoted bounds ARE the contract).
  Visible ONLY for the promise states — `processing` and `in_transit`;
  `delivered` → `{ visible: false }` (delivered IS the answer — a past
  window is noise), `cancelled` → `{ visible: false }` (no promise for a
  cancelled order — the alert-fatigue rule), unknown status →
  `{ visible: false }` (the parse-family fallthrough). The date math is
  UTC-deterministic (`timeZone: "UTC"` in every format call): a fixed
  instant renders the same window on any runner TZ — the seam's output is
  unit-pinnable to exact strings AND E2E-pinnable on the seeded fixtures
  (the formatOrderDate lesson: the worker TZ is not a contract).
- **The format (inside the seam):** the professional compressed window —
  same-month `Mar 18 – 22, 2026`, cross-month `Mar 31 – Apr 4, 2026`,
  cross-year `Dec 31, 2026 – Jan 4, 2027` (both years when they differ —
  the honest form). Pinned through the public seam with chosen placedAt
  instants (tests live at seams, never internals — the tdd skill).
- **The customer detail surface (the header block on
  `/account/orders/[id]`):** the estimate line renders UNDER the order
  number/status row — the Amazon pattern (the estimate is the first thing
  the customer reads after "where's my order"): "Estimated delivery:
  «window»" in `text-sm text-muted-foreground mt-2`. The header's flex row
  moves inside a `mb-8` wrapper (the row keeps its own classes minus the
  carried `mb-8`); the calm state renders the wrapper with the row ONLY —
  the layout is byte-identical to today (the zero-visual-delta calm
  pattern). `data-testid="delivery-window"` (the tracking-line
  convention).
- **The confirmation surface (the visible-details branch of
  `/checkout/success`):** the estimate joins the muted line stack as the
  "when" before the money line's "how much" (the reading order: thank-you
  → email → estimate → money → items). The mb rhythm composes off which
  lines render: both calm → the email line keeps `mb-8` (byte-identical
  to today — the session-33 refunded-confirmation pin preserved); money
  only (the cancelled-refunded revisit) → byte-identical to today;
  estimate visible (a fresh `processing` order — always, at placement) →
  the estimate carries the trailing rhythm. Renders for the owner AND the
  guest token view (the estimate is customer-safe info — no PII beyond
  what the view already shows).
- **The admin console: untouched** — the estimate is a customer promise,
  not operator data (the operator sees the status + sets the tracking;
  quoting the customer's window back to them is noise on a console
  surface).
- **Zero parity risk:** both touched surfaces are superset-only (the
  customer detail is a clone-only route; the confirmation's
  visible-details branch is clone-only content — the reference's
  confirmation is the mock). The storefront parity surfaces are untouched;
  the sweep re-run confirms. No schema change, no new fixtures, no env
  plumbing — the lightest round of the arc (the estimate composes from
  `Order.status` + `Order.placedAt`, both already read by both surfaces).

### 2.3 E2E impact census (verified by reading the specs)

- `account.spec.ts`: the existing detail tests (001 full surface, 004
  money line, 001 timeline, 002 tracking) pin text that the estimate line
  does not touch — the new line renders ABOVE the cards, in the header
  block. The `getByText("Mar 28, 2026", { exact: true })` pin (the
  Payment card's Placed row) does not collide with the estimate's
  compressed format ("Mar 31 – Apr 4, 2026" style — the 001 detail is
  delivered anyway, so its estimate is calm).
- The a11y census pages: the customer-detail census reads ORD-2026-001
  (delivered → the estimate is calm → no new line → the pin holds at 8);
  the admin order-detail census (7) is untouched. The new line reuses the
  muted-on-card pairing family already counted on the page — and never
  renders on the census's fixture anyway.
- The confirmation pins of the other specs (`guest-checkout`, `stock`,
  `stripe` pin the heading + the order number + items) — text pins
  unaffected by an added muted line.
- The checkout spec's new test places one per-run order (cleared by
  e2e-reset — the run-to-run isolation contract); no intra-run pollution
  (the new test's reads are its own order's confirmation).

## 3. The TDD plan

### 3.1 RED — the unit layer (`src/lib/delivery-window.test.ts`, NEW)

The seam module absent — the import fails (the right RED). Pins:
1. the calm state: `delivered` → `{ visible: false }` (whole-object
   `toEqual` — the house pattern; no other keys that could leak into a
   render)
2. the calm state: `cancelled` → `{ visible: false }`
3. the calm state: an unknown status → `{ visible: false }` (the
   parse-family fallthrough)
4. `processing` → visible, the same-month compressed window: placed
   `2026-03-15T10:22:00Z` (ORD-2026-002's instant) → `"Mar 18 – 22, 2026"`
5. `in_transit` → the same promise (the identical window — one quote, two
   promise states)
6. a window crossing a month repeats the end month: placed
   `2026-03-28T15:04:05Z` → `"Mar 31 – Apr 4, 2026"`
7. a window crossing a year shows both years: placed
   `2026-12-28T09:00:00Z` → `"Dec 31, 2026 – Jan 4, 2027"`
8. the bounds are the quoted contract: `DELIVERY_WINDOW_MIN_DAYS === 3`,
   `DELIVERY_WINDOW_MAX_DAYS === 7` (the FLAT_SHIPPING_CENTS precedent)

### 3.2 RED — the E2E layer (2 tests)

- `account.spec.ts`: "the in-transit order detail carries the delivery
  estimate (ORD-2026-002, session-37 DELIVERY-WINDOW-1)" — navigate 002's
  detail; the estimate line renders `Estimated delivery: Mar 18 – 22,
  2026` (exact — UTC-deterministic: placed `2026-03-15T10:22:00Z` + 3/+7
  days); AND the calm states — ORD-2026-001 (delivered) and ORD-2026-004
  (cancelled) render NO estimate line (the delivered order IS the answer;
  the cancelled order has no promise). (Fails RED: the line absent.)
- `checkout.spec.ts`: "the confirmation carries the delivery estimate
  (session-37, DELIVERY-WINDOW-1)" — the full 3-step wizard (the first
  test's anatomy); the confirmation renders the estimate line — the
  prefix + the date SHAPE via regex (the moving-date honesty: a fresh
  order's placedAt is NOW, and the runner TZ is not a contract — the
  session-34 formatOrderDate lesson; the exact strings are unit-pinned on
  fixed instants). (Fails RED: the line absent.)

### 3.3 GREEN (the implementation order)

1. the seam (`src/lib/delivery-window.ts`) — unit GREEN (§3.1)
2. the customer detail header (the wrapper restructure + the line)
3. the confirmation (the estimate line + the composed mb rhythm)
4. the E2E GREEN runs (the two new tests + the touched specs:
   `account.spec.ts`, `checkout.spec.ts`, `accessibility.spec.ts` — the
   census pin re-verified)
5. the a11y census pins re-verified (recalibrate ONLY if the live counts
   move — the documented discipline)

### 3.4 Mutations ×3 (each must be caught, then byte-exact reverted — md5-verified)

- **M1 — the seam's bound mutated** (`DELIVERY_WINDOW_MAX_DAYS` 7 → 5):
  the unit pins (§3.1 #4/#5/#6/#7 — every exact-string window ends 2 days
  early — and #8 — the constant) AND the account E2E exact pin ("Mar 18 –
  20" ≠ "Mar 18 – 22") fail. [the seam is the defect]
- **M2 — the consumer's calm-state gate broken** (the customer detail
  renders the estimate line unconditionally): the account E2E calm pins
  fail (ORD-2026-001 and ORD-2026-004 render the line) while the seam's
  unit pins stay green — the CONSUMER is the defect (the session-35/36 M2
  precedent).
- **M3 — the confirmation's line dropped** (the estimate never joins the
  confirmation stack): the checkout E2E fails on the confirmation pin (the
  regex matches nothing) while BOTH other layers stay green — the second
  consumer is the defect.

### 3.5 The full gate

lint (0/0) · typecheck · the FULL unit layer · build · the FULL E2E × 2
consecutive runs on the final code (the ship discipline — the L26/L27
lesson: foreground, not background).

## 4. Execution order

1. **RED:** §3.1's unit pins (the module absent) + §3.2's two E2E tests —
   all fail for the RIGHT reasons.
2. **GREEN:** §3.3's order; targeted runs green at each step; the a11y
   census pins verified post-change.
3. **Mutations ×3** (each caught + byte-exact revert, md5-verified; M1's
   E2E proof runs against a REBUILT artifact — the playwright webServer
   boots the pre-built standalone, the session-36 lesson).
4. **Full gate:** lint (0/0) · typecheck · unit · build · the FULL E2E × 2
   consecutive runs on the final code.

## 5. Post-change battery + screenshots

- The paired pixel sweep re-run (all 8 routes — the standing drift watch).
- The 37th mobile-nav verification re-run (token-exact parity must hold —
  the header/nav surfaces untouched; re-run post-change).
- The watches + census re-run (the touched routes are already in the
  census walk — the customer detail via the account link).
- Screenshots 196–200 (the production standalone — the exact shipped
  artifact): the ORD-2026-002 customer detail with the estimate line
  (fullPage), the estimate-line close-up (the element capture), the
  placed-order confirmation with the estimate (fullPage — a real order
  placed through the browser), the ORD-2026-001 calm-state detail (no
  estimate line, fullPage), home (the standing anchor). The live DOM
  probed BEFORE the VLM run (describe reality, not intention — the
  round-32/33/34/35/36 lesson); VLM 5/5 required.

## 6. Docs duty

AGENTS.md (the DELIVERY-WINDOW-1 architecture rule) · CLAUDE.md (the
session-37 contract + the new unit/E2E counts) · README (the 575-test row +
the account-dashboard estimate clause + the 37th mobile-nav verification +
**the stale Testing-table fix: 269/238 → the current counts — the table was
last touched at round 32**) · PAD v1.37 (ADR-045 + the revision row) · SKILL
v1.37.0 (the ADR-045 row + the §4.3 stale-spot fixes: the next/font →
self-hosted woff2 correction, the Appendix C latest-plan pointer) ·
docs/session_73.md · the worklog S37 entry · this plan's sign-offs.
`.env.example` verified current (the round adds NO env plumbing).

## Sign-offs (completed at execution)

- [x] RED phase verified failing for the right reasons (8 unit — the
      module absent, TS2307; 2 E2E — `element(s) not found` on the
      estimate testid, both surfaces)
- [x] GREEN phase — all targeted runs green; the a11y census pins held at
      their existing values (customer detail 8, admin order-detail 7)
- [x] Mutations ×3 caught + byte-exact reverts (md5-verified; M1 verified
      at BOTH layers with the artifact rebuilt for the E2E proof — the
      session-36 lesson)
- [x] Full gate × 2 consecutive runs on the final code (575 total:
      321 unit + 254 E2E)
- [x] Post-change battery (sweep at baseline · the 37th mobile-nav
      token-exact re-run · watches + census clean)
- [x] Screenshots 196–200 captured + VLM 5/5 (probe-first; two
      description corrections — the footer's public contact email is
      expected chrome, the confirmation's window moved with the
      UTC-midnight rollover between probe and capture, the math verified
      correct on both)
- [x] Docs aligned; committed to main; pushed via the SSH wrapper
