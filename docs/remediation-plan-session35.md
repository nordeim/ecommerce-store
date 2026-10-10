# Remediation Plan — Session 35 (Round 35): The Customer-Safe Order Timeline + the Confirmation Deep-Link (CUSTOMER-TIMELINE-1 / CHECKOUT-DEEPLINK-1, ADR-043)

**Date:** 2026-10-10 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `e27aeb1` (the session-34 ship `61f5727` + the user's session_68 narrative log)
**Status at audit start:** 531-test gate (285 unit+integration + 246 E2E), PAD v1.34, SKILL v1.34.0 — lint exit 0 **but 1 warning** (the round-34 capture script — §2.4) · tsc clean · 285/285 unit+integration (18 files) · build exit 0 · the full E2E baseline re-run **246/246 (8.0m, foreground)** verified on the pulled workspace.

## 0. The round's mandate

The user's standing round instruction (the professional Stripe integration
verification, the full audit/parity workflow with the mobile-nav + Tailwind
v4 watches, the `.env`/db-root contract, the vitest + playwright suites, the
TDD remediation plan, the screenshots, the `.env.example`, the docs, and the
main-only push). No Stripe test-mode keys or email credentials were provided
(the two standing credential-gated candidates stay gated), so the round's
deliverable is audit-derived — the pattern of rounds 27–34.

**Workspace state this round:** NOT reset — `git pull` fast-forwarded
`61f5727 → e27aeb1` (the user's session_68.md narrative log only, zero code
delta). The session-21 hard-link convergence INTACT (inode 172490 at both
`db/custom.db` and the sandbox-injected `/home/z/my-project/db/custom.db` —
the env-shadowing trap verified live via the parent `.env`, neutralized by
the link); `bun run db:setup` re-run idempotent (6 categories, 12 products,
4 users, 4 canonical orders — the ORD-2026-004 fixture present); the repo
`skills/` exclusion re-verified in all four configs (tsconfig `exclude`,
eslint `ignores`, vitest `include` patterns, playwright `testDir`).

## 1. Baseline verification (state at audit start)

- **`git pull` → `e27aeb1`** — the working tree clean; the repo `skills/`
  folder exclusion re-verified in all four configs.
- Environment contracts: `.env` carries `DATABASE_URL="file:../db/custom.db"`
  · `db/` at the repo root with the hard link in place · `bun run db:setup`
  green.
- Baseline gate: lint exit 0 (1 warning — §2.4) · tsc clean · **285/285
  unit+integration (18 files)** · build exit 0 · **the full E2E baseline
  re-run 246/246 (8.0m, foreground — the L26/L27 lesson)** — the documented
  session-67/68 ship state verified pre-change.
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd**
  (red-green-refactor; the failing regression test first), **agent-browser**
  (the live reference walk — this round via the established Playwright-form
  battery scripts, the sessions 12–34 protocol), **clone-app-pat-pro** (the
  parity methodology: superset features must not change the resting visual
  of parity surfaces), plus the repo's own `ecommerce-store_SKILL.md` §4.2
  (the Tailwind v4 trap log).
- **The Round-35 live battery (the audit):** the paired pixel sweep **ALL
  8 ROUTES AT BASELINE BAND** (home 0% [6 px, both sides painted on slide
  `1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%,
  checkout 0.01%, account 0%, login 0.28%). **The 35th mobile-nav
  verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg
  rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500 with
  identical hrefs; the Electronics deep-link + auto-close passed). The
  standing watches clean (typeahead: the reference fires ZERO search
  requests; carousel ~5000ms cadence; the SEO layer: 17-URL sitemap,
  robots, JSON-LD, offers.price 299.99 USD). The console census 24 routes +
  11 admin surfaces CLEAN (incl. the session-34 customer-detail walk).
- **The order-surface audit (the round's focus area):** the customer's
  order-reading surfaces re-read file-by-file — the detail route
  (`account/orders/[id]/page.tsx`), the confirmation
  (`checkout/success/page.tsx`), the history rows (`account-tabs.tsx`), the
  operator detail (`admin/orders/[id]/page.tsx` — the event timeline), the
  OrderEvent write sites (`actions/checkout.ts`, `actions/admin.ts`, the
  Stripe webhook route, the seed), `prisma/e2e-reset.ts` (the fixture
  lifecycle), and the four consumer specs. Verified healthy and consistent
  with ADR-039..042 — with the gaps below.

## 2. Audit results

### 2.1 The candidate triage (session-67's "suggested next" list)

Session 67 named four candidates. The triage:

1. **The customer-safe order timeline (CHOSEN — §2.2):** the Round-34
   detail page renders the order's CURRENT state (the pill, the money
   line) but not its HISTORY. The OrderEvent timeline — written by
   placement, the admin status action, and the Stripe webhook since
   session-7 — renders ONLY in the operator console, and its notes carry
   operator attribution ("processing → delivered by admin@luxestore.com")
   plus operator vocabulary (R10-2). Session-34 excluded the timeline by
   design for exactly this reason; session-67 named the mapping as the
   unlock. This round builds it.
2. **The checkout success page's "View Orders" deep-link (CHOSEN — §2.3):**
   session-67's second suggestion. The confirmation's "View Orders" button
   links to `/account` — which defaults to the PROFILE tab (the orders
   history is not even visible without a click). The owner just placed an
   order; the natural destination is THAT order's new detail page.
3. **The payments-surface Stripe-dashboard deep-link (DEFERRED — the
   configured-mode gate, unchanged):** renders nothing in demo mode; the
   standing E2E cannot exercise the configured branch without fixture
   keys. Deferred with the credential.
4. **The in-memory rate limiter's shared-store migration (DEFERRED — the
   PAD's open Medium, unchanged):** re-evaluated and re-deferred (no new
   information; correct for single-instance SQLite).

### 2.2 THE PRIMARY FINDING — the customer's per-order surface has no history; the only timeline is operator-only (CUSTOMER-TIMELINE-1)

The customer's order-detail page (Round-34, ADR-042) renders the payment
record, the shipping address, and the itemized totals — the order's resting
state. What it does NOT render is the order's STORY: when it was placed,
how it moved through fulfillment, what happened to the money. The
OrderEvent rows that carry that story exist in the database (four write
sites: the seed, the placement action, the admin status action, the Stripe
webhook's refund reflection), but they render in exactly one place — the
operator console's order detail — and they cannot simply be re-rendered
for the customer because:

- The `status_changed` note embeds operator attribution:
  `"processing → in_transit by admin@luxestore.com"` (written by
  `updateOrderStatusAction`) — an operator email is never customer-safe
  vocabulary (R10-2).
- The refund note carries operator vocabulary ("Refunded $79.99 via
  Stripe" — the operator-facing phrasing; the customer-side mirror has its
  own copy since session-33).

Every high-end store's order detail carries a timeline the customer can
read ("Order placed · Status updated to In Transit · Delivered"). The
superset has the events — it owes the customer a customer-safe rendering.

**The fix (one seam, one surface, one fixture round):**

- **The seam (`src/lib/order-timeline.ts`, NEW):**
  `customerOrderTimeline(events)` maps OrderEvent rows to
  `{ key, type, label, at }` rows — the customer-safe vocabulary:
  `placed` → "Order placed"; `status_changed` → the note parsed the
  parse-family way (`"{old} → {new} by {actor}"` → the `{new}` slug →
  composed through the session-34 `STATUS_LABELS` seam → "Status updated
  to In Transit"; malformed/null notes fall through to "Status updated");
  `payment_succeeded` → "Payment received" (session-22's wording);
  `payment_failed` → "Payment failed"; `payment_refunded` → "Payment
  refunded"; unknown types → the raw type (the `paymentEventLabel`
  raw-passthrough precedent). The note is STRUCTURALLY absent from the
  output (the row type has no note field — it cannot leak). Rows sort by
  `createdAt` asc. Plus `formatTimelineDate(iso)` — the admin detail's
  exact `toLocaleString("en-US", { month: "short", day: "numeric", year:
  "numeric", hour: "numeric", minute: "2-digit" })` — extracted so the
  customer card and the admin detail share one source (the drift-proofing
  rule; the admin's two inline copies refactor to the seam, zero behavior
  delta).
- **The surface (the Timeline card on `/account/orders/[id]`):** a fourth
  card after Items — the account family's card language (`bg-card
  rounded-2xl border border-border/50 shadow-sm`, the icon + h2 header
  row) over an `<ol>` of rows (the admin's list anatomy): the type icon in
  a secondary circle (Package / Truck / CreditCard / RotateCcw / History
  default), the label (`font-medium`), the timestamp (`text-xs
  text-muted-foreground` via the seam). The query adds `events: {
  orderBy: { createdAt: "asc" } }` to the include. The R10-2 discipline:
  the raw note NEVER renders; the icons and labels are the customer
  vocabulary. Pure superset territory (the reference's orders are
  hardcoded rows — no timeline anywhere).
- **The fixtures (the seed + the e2e-reset):** the demo orders gain
  `status_changed` events with REALISTIC operator-attribution notes (the
  action's exact format) so the mapping and the R10-2 no-leak property are
  E2E-provable on the live surface, not just unit-provable:
  - ORD-2026-001 (delivered): placed Mar 28 15:04 → `processing →
    in_transit` Mar 30 09:00 → `in_transit → delivered` Apr 2 11:30.
  - ORD-2026-002 (in_transit): placed Mar 15 10:22 → `processing →
    in_transit` Mar 16 08:45.
  - ORD-2026-003 (delivered, the Stripe-paid fixture): placed-only — the
    calm one-row timeline.
  - ORD-2026-004 (cancelled + refunded): placed Feb 22 13:45 →
    `processing → cancelled` Feb 22 14:03 → `payment_refunded` Feb 22
    14:03:30 (the coherent charge-then-refund story, ordered after the
    14:03:00 StripeEvent).
  Each fixture event carries a deterministic id (`evt-ord1-transit`, …)
  and explicit `createdAt`; the placed events' `createdAt` converges to
  the order's `placedAt` (dbs seeded before this round carry seed-time
  stamps, which would sort the placed row AFTER the transitions). The
  convergence block is idempotent (upsert-by-id + a legacy-duplicate
  deleteMany scoped to the canonical orders), the session-33
  restore-columns precedent. `prisma/e2e-reset.ts` extends its
  status_changed cleanup to the fixture id set (`notIn` — the
  FIXTURE_EVENT_IDS pattern) and to legacy `payment_refunded` duplicates,
  so the admin combobox spec's per-run events are wiped while the seeded
  timeline survives every reset.

### 2.3 THE SECOND FINDING — the confirmation's "View Orders" lands on the profile tab, not the placed order (CHECKOUT-DEEPLINK-1)

The success page's "View Orders" button links to `/account` for everyone —
owner, token-holding guest, and generic visitor alike. The account page
defaults to the PROFILE tab: the just-placed order is two clicks away.
Session-34 built the persistent per-order detail; session-67 named the
deep-link as the natural completion.

**The fix:** the href deepens for the OWNER only —
`ownerView ? /account/orders/${order.id} : "/account"`. The button's text,
variant, and geometry are untouched (the zero-visual-delta superset
pattern); the guest token view and the generic view keep `/account` (the
guest's detail route renders the not-found block by the GUEST-TOKEN-1
discipline — a guest order has `userId: null`; the pinned guest-checkout
behavior "View Orders gates the anonymous buyer to the login screen" is
preserved verbatim). The existing guest-checkout enumeration test's
step-2/step-4 surfaces are unaffected (they are the non-owner paths).

### 2.4 THE HYGIENE FINDING — the lint contract drifted to 0 errors / 1 warning

`scripts/capture-round34.mjs:177` ships `server.pid && process.kill(...)` —
an unused expression the documented gate describes as "lint 0/0". The
AGENTS.md contract is exit 0 (which holds), but the warning is a drift
from the documented clean state. **The fix:** the expression becomes a
statement (`if (server.pid) process.kill(-server.pid, "SIGKILL");`) —
restores the documented 0/0.

### 2.5 Parity analysis (the clone-app-pat-pro discipline)

The reference has NO order timeline and NO real orders (its account rows
are hardcoded demo rows — verified across 35 live battery rounds) — the
Timeline card is pure superset territory (the /verify-email and /admin/*
family). The ONLY parity-surface touch is the success page's link href —
an attribute invisible at rest: the button's text/variant/geometry are
byte-identical, the success page is not a swept route, and the
stripe-gate's parity anchors (the wizard's) are untouched. The pixel sweep
(8 routes), the mobile-nav token-exact checks, and every standing gate are
expected to stay at baseline — the post-change battery re-verifies.

**Impact census on the standing pins (validated file-by-file):** the
seeded status_changed events add rows to the ADMIN order-detail timeline —
no admin spec pins event counts or "Status changed" text (verified by
grep); the admin a11y census on the order-detail surface WILL shift (the
new note/date text nodes) — its pin recalibrates (§3.6). The customer
detail census likewise (the timeline rows' muted timestamps) —
recalibrates. The account.spec timeline tests run BEFORE admin.spec
(alphabetical spec order), so the combobox spec's per-run event cannot
pollute them. The e2e-reset's fixture-id preservation keeps the seeded
timeline identical across runs and fresh clones.

## 3. The deliverable — file-by-file

### §3.1 `src/lib/order-timeline.ts` + `src/lib/order-timeline.test.ts` (NEW)

The pure seam (the order-* family: order-status, order-money-state,
order-view-token). `CustomerTimelineRow = { key, type, label, at }`;
`customerOrderTimeline(events)` (sort asc + the vocabulary map + the
status-note parse with the "Status updated" fall-through);
`formatTimelineDate(iso)` (the admin's exact options — the shared source).
Unit pins (~13): the six canonical labels; the unknown-status raw
passthrough; the malformed/null-note fall-through; the unknown-type raw
passthrough; the asc ordering (shuffled input); the structural no-note
pin (the serialized rows carry no note fragment); the `formatTimelineDate`
SHAPE pin (`/^[A-Z][a-z]{2} \d{1,2}, \d{4}, \d{1,2}:\d{2} (AM|PM)$/` —
NOT a calendar-day pin; the runner TZ is not a contract — the
formatOrderDate precedent); the key/at passthrough.

### §3.2 `src/app/(storefront)/account/orders/[id]/page.tsx` (MODIFIED)

The query adds `events: { orderBy: { createdAt: "asc" } }`; the page
composes `customerOrderTimeline(order.events)`; the Timeline card renders
after the Items card (the anatomy in §2.2 — the account family's card
language, the admin's `<ol>` row anatomy, the customer's vocabulary). The
icon map stays in the page (presentation); the label/date come from the
seam (never string-built in the consumer — the drift-proofing rule).

### §3.3 `src/app/(storefront)/checkout/success/page.tsx` (MODIFIED)

`const ordersHref = ownerView && order ? `/account/orders/${order.id}` :
"/account"` — the "View Orders" Link's href. No other change: the text,
the variant, the geometry, and both calm paths are byte-identical.

### §3.4 `src/app/(storefront)/admin/orders/[id]/page.tsx` (MODIFIED — the single-source refactor)

The two inline `toLocaleString` timestamp blocks (the event list + the
payment trail) become `formatTimelineDate(...)` calls — identical output
(zero visual delta on the operator surface), one source (the §3.1 seam).

### §3.5 `prisma/seed.ts` + `prisma/e2e-reset.ts` (MODIFIED — the fixture round)

The seed: the `extraEvents` shape gains `id` + `createdAt`; the four
orders' fixture events per §2.2; the placed events' `createdAt` converges
to `placedAt`; the idempotent convergence block (upsert-by-id + the
legacy-duplicate deleteMany scoped to the canonical orders' fixture
types). The reset: the status_changed deleteMany becomes the
fixture-id-preserving form (`type in [status_changed, payment_refunded]`
+ `id notIn SEEDED_ORDER_EVENT_IDS` on the canonical orders) — the
FIXTURE_EVENT_IDS pattern the StripeEvent cleanup already uses.

### §3.6 `tests/e2e/account.spec.ts` + `tests/e2e/checkout.spec.ts` + `tests/e2e/guest-checkout.spec.ts` + `tests/e2e/accessibility.spec.ts` (MODIFIED — the RED tests)

- **account.spec ×2:** (1) the ORD-2026-001 detail renders the
  customer-safe timeline — the Timeline heading; the rows "Order placed" /
  "Status updated to In Transit" / "Status updated to Delivered" in order;
  the placed row's timestamp begins "Mar 28, 2026" (the TZ-safe date
  part); NO operator attribution ("by admin@luxestore.com" × 0); NO raw
  note ("Seeded demo order" × 0); NO operator vocabulary ("Status
  changed" × 0 — the admin's label). (2) the ORD-2026-004 timeline —
  "Order placed" / "Status updated to Cancelled" / "Payment refunded" in
  order (the money story joins the fulfillment story) + the same
  no-attribution pins.
- **checkout.spec ×1:** the owner's confirmation deep-links — as john,
  visit `/checkout/success?order=ORD-2026-004`; the "View Orders" href
  matches `^/account/orders/[a-z0-9]+$`; click → the detail h1 renders
  ORD-2026-004.
- **guest-checkout.spec ×1:** the non-owner paths keep the generic href —
  the placement view (the guest's tokened confirmation) and a bare-number
  anonymous probe both render "View Orders" with `href="/account"` (the
  GUEST-TOKEN-1 discipline: a guest order's detail route is not-found for
  everyone but the token).
- **accessibility.spec (recalibration, no new tests):** the customer
  detail census pin 8 → the measured count; the ADMIN_PROFILE
  order-detail pin 7 → the measured count (the ADMIN_PROFILE entries gain
  an explicit `expected` field — the ternary becomes a table).

### §3.7 `scripts/capture-round34.mjs` (MODIFIED — the hygiene rider)

Line 177: the unused expression becomes an `if` statement — lint 0/0
restored.

### §3.8 No schema, no env, no isolation changes

The round reads EXISTING columns only (OrderEvent.id/type/note/createdAt,
Order.placedAt) — no migration, no new env plumbing (`.env.example`
unchanged), no new spec users. The e2e-reset change is the fixture
lifecycle this round owns.

## 4. TDD protocol

1. **RED:** write §3.1's unit pins (the module absent — the import fails)
   + §3.6's four E2E tests (the timeline card absent; the deep-link
   absent) — all fail for the RIGHT reasons. The a11y recalibrations run
   after GREEN (the pins move with the surface).
2. **GREEN:** §3.1 the seam → §3.5 the fixtures → §3.2 the card → §3.3
   the deep-link → §3.4 the admin refactor. Targeted runs green at each
   step; the two a11y census pins calibrated from the live counts (the
   session-16 calibration pattern).
3. **Mutations ×3 (each caught + byte-exact revert, md5-verified):**
   M1 — the seam leaks the operator note (the timeline row renders
   `event.note` as its label's subtitle) → the unit structural pin AND
   both E2E no-attribution pins fail; M2 — the status vocabulary
   composition dropped (the label string-builds the raw slug) → the unit
   "Status updated to Delivered" pin AND the E2E exact-text pins fail;
   M3 — the deep-link reverted (the owner's href stays `/account`) → the
   checkout deep-link E2E fails.
4. **Full gate:** lint (0/0) · typecheck · unit · build · the FULL E2E × 2
   consecutive runs on the final code (the ship discipline).

## 5. Post-change battery + screenshots

- The paired pixel sweep re-run (all 8 routes — the touched surfaces are
  not swept, but the standing drift watch re-verifies).
- The 35th mobile-nav verification re-run (token-exact parity must hold —
  the header/nav surfaces untouched).
- The watches + census re-run (the two touched routes are already in the
  census walk — `/checkout/success` and the customer detail).
- Screenshots 186–190 (the production standalone — the exact shipped
  artifact): the ORD-2026-001 customer detail with the timeline
  (fullPage), the ORD-2026-004 refunded detail with the timeline
  (fullPage), the owner's confirmation (the deep-linked surface), the
  ORD-2026-002 in-transit detail (the minimal timeline), home (the
  standing anchor). The live DOM probed BEFORE the VLM run (describe
  reality, not intention — the round-32/33/34 lesson); VLM 5/5 required.

## 6. Docs duty

AGENTS.md (the CUSTOMER-TIMELINE-1 + CHECKOUT-DEEPLINK-1 architecture
rules) · CLAUDE.md (the session-35 contract + the new unit/E2E counts) ·
README (the test-count row + the account-dashboard feature row + the 35th
mobile-nav verification) · PAD v1.35 (ADR-043 + the revision row) · SKILL
v1.35.0 (the ADR-043 row) · docs/session_69.md · the worklog S35 entry ·
this plan's sign-offs. `.env.example` verified current.

## Sign-offs (completed at execution)

- [x] RED phase verified failing for the right reasons (3 RED + 1 boundary
      guard green by design — the guard catches the INVERSE mutation)
- [x] GREEN phase — all targeted runs green; both a11y census pins held at
      their existing values (no recalibration needed — the new pairings
      match the counted families)
- [x] Mutations ×3 caught + byte-exact reverts (md5-verified)
- [x] Full gate × 2 consecutive runs on the final code (551 total:
      301 unit + 250 E2E)
- [x] Post-change battery (sweep at baseline · the 35th mobile-nav
      token-exact re-run · watches + census clean)
- [x] Screenshots 186–190 captured + VLM 5/5 (one test-side description
      correction — the confirmation carries the standard storefront chrome)
- [x] Docs aligned; committed to main; pushed via the SSH wrapper
