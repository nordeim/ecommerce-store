# Remediation Plan — Session 34 (Round 34): The Customer Order-Detail Read Surface (CUSTOMER-ORDER-DETAIL-1, ADR-042)

**Date:** 2026-10-10 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `da842f6` (the session-33 ship `8bd5bb2` + the user's session-66 narrative log)
**Status at audit start:** 518-test gate (278 unit+integration + 240 E2E), PAD v1.33, SKILL v1.33.0 — lint 0/0 · tsc clean · 278/278 unit+integration (17 files) · build exit 0 · the full E2E baseline re-run **240/240 (8.1m, foreground)** verified on the pulled workspace.

## 0. The round's mandate

The user's standing round instruction (the professional Stripe integration
verification, the full audit/parity workflow with the mobile-nav + Tailwind
v4 watches, the `.env`/db-root contract, the vitest + playwright suites, the
TDD remediation plan, the screenshots, the `.env.example`, the docs, and the
main-only push). No Stripe test-mode keys or email credentials were provided
(the two standing credential-gated candidates stay gated), so the round's
deliverable is audit-derived — the pattern of rounds 27–33.

**Workspace state this round:** NOT reset — `git pull` fast-forwarded
`8bd5bb2 → da842f6` (the user's session_66.md narrative log only, zero code
delta). The session-21 hard-link convergence INTACT (inode 172490 at both
`db/custom.db` and the sandbox-injected `/home/z/my-project/db/custom.db` —
the env-shadowing trap verified live via `bun -e`, neutralized by the link);
`bun run db:setup` re-run idempotent (6 categories, 12 products, 4 users,
**4 orders** — the ORD-2026-004 fixture present); the repo `skills/`
exclusion re-verified in all four configs.

## 1. Baseline verification (state at audit start)

- **`git pull` → `da842f6`** — the working tree clean; the repo `skills/`
  folder exclusion re-verified in all four configs: `tsconfig.json`
  `exclude: [..., "skills"]`, `eslint.config.mjs` `ignores: [..., "skills",
  ...]`, `vitest.config.ts` matches only `src/**/*.test.ts` +
  `tests/**/*.test.ts`, `playwright.config.ts` `testDir: "./tests/e2e"`.
- Environment contracts: `.env` carries `DATABASE_URL="file:../db/custom.db"`
  · `db/` at the repo root with the hard link in place (both paths resolve
  to ONE file — the shadow injection is inert) · `bun run db:setup` green.
- Baseline gate: lint 0/0 · tsc clean · **278/278 unit+integration (17
  files)** · build exit 0 · **the full E2E baseline re-run 240/240 (8.1m,
  foreground — the L26/L27 lesson)** — the documented session-65/66 ship
  state verified pre-change.
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd**
  (red-green-refactor; the failing regression test first), **agent-browser**
  (the live reference walk — this round via the established Playwright-form
  battery scripts, the sessions 12–33 protocol), **clone-app-pat-pro** (the
  parity methodology: superset features must not change the resting visual
  of parity surfaces), plus the repo's own `ecommerce-store_SKILL.md` §4.2
  (the Tailwind v4 trap log).
- **The Round-34 live battery (the audit):** the paired pixel sweep **ALL
  8 ROUTES AT BASELINE BAND** (home 0% [6 px, both sides painted on the
  same slide `1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist
  0%, checkout 0.01%, account 0%, login 0.28%). **The 34th mobile-nav
  verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg
  rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500 with
  identical hrefs; the Electronics deep-link + auto-close passed). The
  standing watches clean (typeahead: the reference fires ZERO search
  requests; carousel ~5000ms; the SEO layer: 17-URL sitemap, robots,
  JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11
  admin surfaces CLEAN.
- **The order-surface audit (the round's focus area):** the customer's
  order surfaces re-read file-by-file — `account/page.tsx` (the OrderRow
  mapping), `account-tabs.tsx` (the history rows + the STATUS vocabulary),
  `checkout/success/page.tsx` (the token-gated confirmation),
  `admin/orders/[id]/page.tsx` (the operator detail — the design
  reference), the seed fixtures, and the GUEST-TOKEN-1 gate discipline.
  Verified healthy and consistent with ADR-039..041 — with ONE structural
  gap, below.

## 2. Audit results

### 2.1 The candidate triage (session-65's "suggested next" list)

Session 65 named three candidates. The triage:

1. **The customer order-detail read surface (CHOSEN — §2.2):** the
   customer's ONLY per-order views are the one-line history row and the
   ephemeral token-gated confirmation. The confirmation is a single visit
   (a guest needs the HMAC token; the owner sees it until they navigate
   away), and the history row renders five fields. The customer has NO
   persistent "view this order" surface — no items-with-images detail, no
   shipping address, no payment record — while the OPERATOR console has
   had the full `/admin/orders/[id]` read surface since session-7
   (ADR-015). Every high-end store's account area links each order row to
   its detail.
2. **The payments surface's Stripe-dashboard deep-link (DEFERRED — the
   configured-mode gate, unchanged):** renders nothing in demo mode; the
   standing E2E cannot exercise the configured branch without fixture
   keys. Valuable when test-mode keys arrive; deferred with the
   credential.
3. **The in-memory rate limiter's shared-store migration (DEFERRED — the
   PAD's open Medium, unchanged):** re-evaluated and re-deferred (no new
   information; correct for single-instance SQLite).

### 2.2 THE PRIMARY FINDING — the customer's per-order read surface is a single ephemeral page; the history row has no affordance (CUSTOMER-ORDER-DETAIL-1)

The customer's order-reading experience, verified against the code this
round:

- **The history row is five fields** — number, `date · item count`, the
  fulfillment pill, the total, and (since session-33) the refunded money
  line. The number is plain text (`<p className="font-semibold">`); the
  row links nowhere.
- **The confirmation is ephemeral** — `/checkout/success` renders the
  items + total + money line ONCE, gated behind the owner check or the
  placement redirect's HMAC view token (GUEST-TOKEN-1). There is no way
  BACK to a per-order view: no route exists, and the reference app has no
  counterpart (its orders are hardcoded demo rows — verified across 34
  live battery rounds).
- **The operator console holds the only per-order read surface** —
  `/admin/orders/[id]` (ADR-015): the customer block, the shipping
  snapshot, the item snapshots, the timeline. Admin-gated; a customer can
  never see their own order there.

The gap is structural: after leaving the confirmation, a customer with a
question ("what did I order? where is it shipping? how did I pay?") has no
in-app answer. The superset has real orders — it owes them a real read
surface.

**The fix (one route, one seam extraction, one affordance):**

- **The route** (`/account/orders/[id]`, NEW — the customer's per-order
  read surface, owner-gated): a server page under the `(storefront)`
  group (the full chrome, the single-`<main>` contract), rendering the
  customer-safe subset of the operator detail in the account family's own
  design language — the header (ghost "← Orders" back link, the number
  h1, the STATUS pill from the history vocabulary, the total), the Items
  card (the snapshot rows: image / name / `unit × qty` / line total, the
  Subtotal/Shipping/Total block), the Shipping card (the parsed
  `shippingAddress` JSON snapshot — the ADR-015 pattern), and the
  Payment card (the method + cardLast4 row — `Card ···· 4242`, the
  admin's format — plus the money state through
  `confirmationMoneyLineView`, the per-order read vocabulary: paid →
  "Payment received — charged by Stripe.", refunded → "Payment refunded
  — the amount has been returned to your original payment method.",
  demo-path null → nothing (the calm state)). NO OrderEvent timeline —
  the events carry operator attribution ("by admin" — the R10-2
  customer-safe rule); the status pill + the money line suffice.
- **The gate (the GUEST-TOKEN-1 discipline):** anonymous → the
  REDIRECT-1 pattern (`/login?redirect=/account/orders/<id>` — the
  admin-detail precedent of carrying the exact path); a signed-in
  NON-OWNER (or an unknown id, or a guest order with `userId: null`) →
  the in-chrome "Order not found" block (the ADR-015 pattern — the
  platform 404 is reserved for unknown routes; the block never confirms
  or denies an order's existence to a non-owner). The route reads the
  DATABASE id (the cuid — the admin-detail convention), never the
  public order number.
- **The affordance (the admin-console precedent):** order numbers link
  to their detail — the history row's `<p className="font-semibold">`
  gains a `<Link>` child (`<p className="font-semibold"><Link
  href={`/account/orders/${o.id}`}>{o.number}</Link></p>`). Computed
  styles are UNCHANGED: the `<p>` keeps `font-semibold` (the pinned
  `numberWeight: 600` assertion reads the p), and Tailwind v4's preflight
  sets `a { color: inherit; text-decoration: inherit }` — the anchor
  renders in the same foreground at the same weight with no underline
  (the resting visual is byte-identical; the deliberate-divergence
  register gains the entry — a superset affordance with zero visual
  delta, the footer-deep-link precedent).
- **The seam extraction (`src/lib/order-status.ts`, NEW):**
  `STATUS_STYLES` + `STATUS_LABELS` (the session-9 reference-measured
  badge vocabulary — delivered = the primary variant + shadow, the
  others = secondary; unmeasured statuses fall back to secondary + the
  raw label) and `formatOrderDate(iso)` (the account family's short
  format — "Mar 28, 2026") move OUT of `account-tabs.tsx` (a `"use
  client"` module whose plain-object exports are NOT importable from
  server components — the client-reference boundary) into a pure lib
  module both consumers import. Zero behavior change for the tabs (the
  maps were module-level consts; the E2E anatomy pins read computed
  styles, not source). Unit-pinned: the four canonical class strings +
  labels + the fall-through.
- **The metadata:** `pageMetadata({ title: "Order Details", path:
  "/account", noindex: true })` — the CHECKOUT-SEO-1 belt-and-suspenders
  (a personal page: the robots.txt `/account` disallow already covers
  it; noindex prevents indexing of any linked URL). The og:url points at
  the account family root (the admin pages skip the builder entirely;
  a per-order canonical would leak the cuid into share previews — the
  private-page posture).

### 2.3 Parity analysis (the clone-app-pat-pro discipline)

The reference has NO order-detail route (its account orders are hardcoded
rows that link nowhere — verified across 34 live battery rounds) — the new
route is pure superset territory (the /verify-email and /admin/* family).
The ONLY parity-surface touch is the history row's number paragraph
gaining an anchor child:

- **Computed styles unchanged:** the `<p>` keeps `font-semibold`
  (`numberWeight: 600` — the pinned assertion); the anchor inherits
  color via preflight (`a { color: inherit; text-decoration: inherit }`)
  — no `text-primary`, no underline, NO hover classes (the resting
  visual byte-identical; keyboard focus gets the default focus-visible
  outline — the drawer aria-label precedent of an invisible-at-rest
  superset).
- **The pinned locators stay green:** `getByText("ORD-2026-001")`
  matches the anchor's text; `row.querySelector("p")` still finds the p;
  the `div.justify-between` row locator is untouched; the a11y account
  census is measured on the PROFILE tab (the orders tab is unmounted at
  census time — Radix inactive-content unmounting), and the account
  pixel sweep renders identical text.
- **Zero operator vocabulary in the customer DOM** (R10-2): no intent
  ids, no actor attributions, no console vocabulary — the money line is
  the confirmation's customer-safe copy.

## 3. The deliverable — file-by-file

### §3.1 `src/lib/order-status.ts` + `src/lib/order-status.test.ts` (NEW)

The pure seam (the status vocabulary family — the module boundary follows
the data): `STATUS_STYLES` (the four canonical class strings + the
secondary fall-through), `STATUS_LABELS` (Delivered / In Transit /
Processing / Cancelled + the raw passthrough), `formatOrderDate(iso)`
(the account family's `toLocaleDateString("en-US", { month: "short", day:
"numeric", year: "numeric" })` — E2E-pinned via both consumers' date pins;
NOT unit-pinned on TZ-determinism grounds: a fixed ISO timestamp renders
different calendar days under different runner TZs — the vitest worker TZ
is not a contract). Unit pins: delivered's class string contains
`bg-primary` + `shadow`; the other three contain `bg-secondary`; all four
labels; an unknown status renders the raw label (the parse family's
fall-through philosophy).

### §3.2 `src/app/(storefront)/account/orders/[id]/page.tsx` (NEW)

The customer order-detail page — `dynamic = "force-dynamic"` (reads the
session), the metadata above, the gate order: `getCurrentUser()` →
`redirect("/login?redirect=/account/orders/" + id)` when anonymous →
`db.order.findUnique({ where: { id }, include: { items: true } })` → the
not-found block when `!order || order.userId !== user.id` (ONE combined
check — existence and ownership return the SAME generic block; never
leak which one failed) → the read surface. The anatomy follows the
account family (`max-w-5xl mx-auto px-4 sm:px-6 py-8`, the `border
bg-card ... rounded-2xl` cards, the `div.flex-1` wrapper — the session-12
single-main contract) and the operator detail's card interiors (the
`<dl>` rows, the `<address>` block, the item rows, the totals block).
The STATUS pill composes the §3.1 seam (`STATUS_STYLES[status]` + the
rounded-full pill classes from the history rows); the Payment card
composes `confirmationMoneyLineView(paymentStatus)` (the seam's text,
never string-built in the consumer).

### §3.3 `src/components/account/account-tabs.tsx` (MODIFIED)

The local `STATUS_STYLES`/`STATUS_LABELS`/`formatDate` definitions are
REPLACED by the §3.1 imports (single source — the drift-proofing rule);
the history row's number paragraph gains the `<Link>` child. No other
change: the money line, the row anatomy, and every class string stay
byte-identical.

### §3.4 `tests/e2e/account.spec.ts` (MODIFIED — the RED tests)

Five new tests: (1) the history numbers are links to the detail route
(click ORD-2026-001 → the URL matches `/account/orders/` → the h1
renders the number); (2) the ORD-2026-001 detail renders the full read
surface (the 2 item snapshots with `unit × qty` + line totals, Subtotal
$349.98 / Shipping Free / Total $349.98, the shipping address block, the
payment row `Card ···· 4242`, NO money line — the demo-path calm state);
(3) the refunded fixture's detail surfaces the money state (ORD-2026-004:
the Cancelled pill + "Payment refunded — the amount has been returned to
your original payment method." + the planter row $79.99); (4) the owner
gate — an admin-context visit to john's order URL renders the generic
"Order not found" block (a non-owner is a non-owner regardless of role;
`adminLogin(browser)` — the stock-spec second-context precedent, the
admin email's own rate-limit bucket); (5) the anonymous redirect carries
the intent (a bare storageState context → `/account/orders/anything` →
`/login?redirect=/account/orders/anything` — the redirect fires before
the lookup, so any id exercises it).

### §3.5 `tests/e2e/accessibility.spec.ts` (MODIFIED — the quality census)

One new test in the standing-gate family: the customer order-detail
route (superset — no reference counterpart) carries the QUALITY census
{color-contrast} × N — N calibrated by running the gate form on the
live page during GREEN (the session-16 admin-gate calibration pattern;
the route is reached via the history link — the e2e.db cuid is not
hardcodable across fresh clones, the admin-gate convention). Any other
rule firing is a regression.

### §3.6 No schema, no seed, no isolation changes

The round reads EXISTING columns only (`items`, `shippingAddress`,
`paymentMethod`, `cardLast4`, `paymentStatus`, `status`, `placedAt`,
`total`, `subtotal`, `shipping`, `userId`) — no migration, no new
fixtures, no e2e-reset/dev-cleanup changes. `.env.example` unchanged
(no new env plumbing).

## 4. TDD protocol

1. **RED:** write §3.1's unit pins (the module absent — the import
   fails) + §3.4's five E2E tests + §3.5's census test (placeholder N —
   the RED failure reads the actual count) — all fail for the RIGHT
   reasons (the route 404s through the platform catch-all; the link
   absent).
2. **GREEN:** §3.1 the seam → §3.2 the route → §3.3 the tabs refactor +
   the link. Targeted runs green at each step; the a11y census N pinned
   from the live count.
3. **Mutations ×3 (each caught + byte-exact revert, md5-verified):**
   M1 — the ownership gate inverted to `order.userId !== user.id` for
   the RENDER (every owner gets the not-found block) → the §3.4 owner
   tests fail; M2 — the §3.1 extraction weakened (delivered's class
   string loses `bg-primary`/the shadow) → the unit pin + the detail
   E2E pill assertions fail; M3 — the consumer bypasses the seam (the
   Payment card string-builds its own refunded copy) → the unit text
   contract + the §3.4 refunded-detail exact-text pin fail.
4. **Full gate:** lint · typecheck · unit · build · the FULL E2E × 2
   consecutive runs on the final code (the ship discipline).

## 5. Post-change battery + screenshots

- The paired pixel sweep re-run (the account route touched — the sweep
  must stay AT BASELINE; home/shop/pdp/cart/wishlist/checkout/login
  re-verified as the standing drift watch).
- The 34th+1 mobile-nav verification re-run (token-exact parity must
  hold — the header/nav surfaces untouched).
- The watches + census re-run (24 routes + the new route's census entry
  added to the console census walk).
- Screenshots 181–185 (the production standalone — the exact shipped
  artifact): the account orders tab (the linked numbers), the
  ORD-2026-001 customer detail (fullPage), the ORD-2026-004 refunded
  detail (the money line), the not-found block (the admin-context
  probe), home (the standing anchor). The live DOM probed BEFORE the
  VLM run (describe reality, not intention — the round-32/33 lesson);
  VLM 5/5 required.

## 6. Docs duty

AGENTS.md (the CUSTOMER-ORDER-DETAIL-1 architecture rule + the
deliberate-divergence register entry for the linked order numbers) ·
CLAUDE.md (the session-34 contract + the new unit/E2E counts) · README
(the test-count row + the account-dashboard feature row + the 34th
mobile-nav verification) · PAD v1.34 (ADR-042 + the revision row) ·
SKILL v1.34.0 (the ADR-042 row) · docs/session_67.md · the worklog S34
entry · this plan's sign-offs. `.env.example` verified current.

## Sign-offs (completed at execution)

- [x] RED phase verified failing for the right reasons
- [x] GREEN phase — all targeted runs green
- [x] Mutations ×3 caught + byte-exact reverts (md5-verified)
- [x] Full gate × 2 consecutive runs on the final code
- [x] Post-change battery (sweep at baseline · mobile-nav token-exact ·
      watches + census clean)
- [x] Screenshots 181–185 captured + VLM 5/5
- [x] Docs aligned; committed to main; pushed via the SSH wrapper
