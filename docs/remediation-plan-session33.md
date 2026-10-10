# Remediation Plan — Session 33 (Round 33): The Customer-Side Money-State Mirror (CUSTOMER-MONEY-1, ADR-041)

**Date:** 2026-10-10 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `701cd29` (the session-32 ship `d0d4b00` + the user's session-64 narrative log)
**Status at audit start:** 507-test gate (269 unit+integration + 238 E2E), PAD v1.32, SKILL v1.32.0 — lint 0/0 · tsc clean · 269/269 unit+integration (16 files) · build exit 0 (25 routes) · the full E2E baseline re-run **238/238 (7.8m, foreground)** verified on the freshly cloned workspace.

## 0. The round's mandate

The user's standing round instruction (the professional Stripe integration
verification, the full audit/parity workflow with the mobile-nav + Tailwind
v4 watches, the `.env`/db-root contract, the vitest + playwright suites, the
TDD remediation plan, the screenshots, the `.env.example`, the docs, and the
main-only push). No Stripe test-mode keys or email credentials were provided
(the two standing credential-gated candidates stay gated), so the round's
deliverable is audit-derived — the pattern of rounds 27–32.

**Workspace state this round:** RESET — the sandbox was rebuilt (a bare
`/home/z/my-project` with no ecommerce-store clone). Fresh `git clone`
at `701cd29`; `bun install` (one lightningcss tarball retry); `.env`
written with the repo contract `DATABASE_URL="file:../db/custom.db"`; the
sandbox env-shadowing trap LIVE again (the parent `/home/z/my-project/.env`
injects `file:/home/z/my-project/db/custom.db` and wins over the repo
`.env`) — neutralized the session-21 way: `db:setup` ran against the
injected path, then `ln` hard-linked it onto the repo path
(`/home/z/my-project/db/custom.db` ⇔ `<repo>/db/custom.db`, one inode).
`bun run db:setup` idempotent (6 categories, 12 products, 4 users, 3
orders, 3 hero slides); E2E DB provisioning unchanged (global-setup owns
`db/e2e.db` with its own `DATABASE_URL` override).

## 1. Baseline verification (state at audit start)

- **`git clone` → `701cd29`** — the working tree clean; the repo `skills/`
  folder exclusion re-verified in all four configs: `tsconfig.json`
  `exclude: ["node_modules", "skills"]`, `eslint.config.mjs` ignores
  `"skills"`, `vitest.config.ts` matches only `src/**/*.test.ts` +
  `tests/**/*.test.ts`, `playwright.config.ts` `testDir: "./tests/e2e"`.
- Environment contracts: `bun` 1.3.14 · node v24.21.0 · `.env` carries
  `DATABASE_URL="file:../db/custom.db"` · `db/` at the repo root with the
  hard link in place · `bun run db:setup` green.
- Baseline gate: lint 0/0 · tsc clean · **269/269 unit+integration (16
  files)** · build exit 0 (25 routes, standalone present) · **the full E2E
  baseline re-run 238/238 (7.8m, foreground — the L26/L27 lesson)** — the
  documented session-63/64 ship state verified pre-change.
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd**
  (red-green-refactor; the failing regression test first), **agent-browser**
  (the live reference walk — this round via the established
  Playwright-form battery scripts, the sessions 12–32 protocol),
  **clone-app-pat-pro** (the parity methodology: superset features must not
  change the resting visual of parity surfaces), plus the repo's own
  `ecommerce-store_SKILL.md` §4.2 (the Tailwind v4 trap log).
- **The Round-33 live battery (the audit):** the paired pixel sweep **ALL
  8 ROUTES AT BASELINE BAND** (home 0% [6 px, both sides painted on the
  same slide `1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist
  0%, checkout 0.01%, account 0%, login 0.28%). **The 33rd mobile-nav
  verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg
  rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500 with
  identical hrefs; the Electronics deep-link + auto-close passed). The
  standing watches clean (typeahead: the reference fires ZERO search
  requests; carousel ~5000ms; the SEO layer: 17-URL sitemap, robots,
  JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11
  admin surfaces CLEAN.
- **The payments-family audit (the round's focus area):** the arc's
  read/write surfaces re-read file-by-file — `stripe-payment.ts` (the
  pure seams incl. `chargeRefundedReflection`), `api/stripe/webhook/route.ts`
  (the reflection writer), `actions/admin.ts` (`refundOrderAction`),
  `admin-payments.ts` (the read seams), the three admin surfaces, and the
  two CUSTOMER-facing order surfaces. Verified healthy and consistent with
  ADR-030..040 — with ONE structural gap, below.

## 2. Audit results

### 2.1 The candidate triage (session-63's "suggested next" list)

Session 63 named three audit-derived candidates. The triage:

1. **The customer-side money-state mirror (CHOSEN — §2.2):** the payments
   family arc (ADR-030..040) built every OPERATOR surface — the payments
   log, the family filters, the dashboard alert, the order payment-events
   trail, the failure reasons, the refund ACTION, and the webhook's
   `charge.refunded` order-state reflection — but the CUSTOMER side of the
   money state never shipped. `OrderRow` carries no `paymentStatus`
   (the account orders tab renders only the fulfillment status), and the
   checkout confirmation's money line handles `paid` only. A fully
   refunded order is indistinguishable from a fulfilled-and-kept one on
   every customer surface. The information asymmetry is total: the
   operator's console sees the refund; the customer whose money was
   returned sees nothing — forever.
2. **The payments surface's Stripe-dashboard deep-link (DEFERRED — the
   configured-mode gate):** the refund-needed rows could deep-link their
   intents into `dashboard.stripe.com`. In the current deployment (demo
   mode) the affordance renders nothing, and the standing E2E cannot
   exercise the configured branch without fixture keys (the same gate as
   the round-32 live-probe technique — a probe, not a standing gate).
   Valuable when test-mode keys arrive; deferred with the credential.
3. **The in-memory rate limiter's shared-store migration (DEFERRED — the
   PAD's open Medium, unchanged):** re-evaluated and re-deferred (no new
   information; correct for single-instance SQLite).

### 2.2 THE PRIMARY FINDING — the money state is operator-only; the customer surfaces never mirror it (CUSTOMER-MONEY-1)

Two halves of one gap, both verified against the code this round:

**Half 1 — the order-history mirror is absent.** The account orders tab
(the customer's persistent order surface) renders per row: the number,
`date · item count`, the fulfillment status pill, and the total.
`OrderRow` (mapped in `account/page.tsx`) has no `paymentStatus` field,
and `account-tabs.tsx` renders no money state — a refunded order
(`paymentStatus: "refunded"`, written by the webhook's reflection — the
single writer, ADR-040) looks identical to a paid one. The customer has
no in-app record that their money was returned.

**Half 2 — the confirmation mirror is half-blind.** The checkout success
page renders "Payment received — charged by Stripe." for `paid` orders
(session-22) — but a refunded order revisiting its confirmation (owner
view or token view) renders NOTHING: the money line is silent exactly
when it matters most. The page's only payment branch is
`paymentStatus === "paid"`; `refunded` falls through to the bare
confirmation block.

**The fix (both halves, one contract):**

- **The seam** (`src/lib/order-money-state.ts`, NEW — the customer-side
  money-state view family, the module boundary following the data): two
  pure functions, unit-pinned, import-free of Prisma (`formatCents` from
  `./money` is a pure-to-pure import — the admin-payments precedent).
  - `orderRefundLineView(paymentStatus, totalCents)` — the order-history
    row's line: `{ visible: false }` for null (the demo path), `"paid"`,
    and unknown values (the calm state — history rows keep the
    reference's exact anatomy; only the EXCEPTIONAL money state earns a
    line, the DASH-ALERT-1 alert-fatigue lesson); `{ visible: true, text:
    "Refunded · $X returned" }` for `"refunded"` (a full refund —
    partials keep `paid`, so the state implies the amount).
  - `confirmationMoneyLineView(paymentStatus)` — the confirmation page's
    line: `"paid"` → "Payment received — charged by Stripe." (session-22's
    wording, byte-exact); `"refunded"` → "Payment refunded — the amount
    has been returned to your original payment method."; else
    `{ visible: false }`. Customer-safe copy (the R10-2 rule): no
    operator vocabulary (no intent ids, no "via Stripe dashboard").
- **The fixture** (`prisma/seed.ts`): `ORD-2026-004` — john's fourth
  order, 1× Ceramic Planter Set ($79.99 — matching `evt_demo_fixture_r`'s
  refunded amount 7999 exactly), `status: "cancelled"` (the coherent
  full-refund story: cancelled in the window → fully refunded; the
  refundEligibility design's own example — "a cancelled-but-paid order is
  exactly the refund case", now in its post-refund resting state),
  `paymentStatus: "refunded"` + `stripePaymentIntentId:
  "pi_demo_fixture_005"` (linking the EXISTING `evt_demo_fixture_r` —
  its "orphan" comment story graduates to the linked shape the
  reflection family produces; the payments-surface row is unaffected:
  charge.refunded stays "Ignored", the 4-event set and every count pin
  unchanged), placedAt 2026-02-22T13:45:00Z (18 minutes before the
  refund event's receivedAt — the coherent charge-then-refund same-day
  story), and a `payment_refunded` OrderEvent (note "Refunded $79.99 via
  Stripe" — the reflection's exact format) alongside the placed event.
  The paid-columns update pattern (the ORD-2026-003 precedent) restores
  the refunded columns idempotently on re-seed.
- **The surfaces**: the account page maps `paymentStatus` into `OrderRow`
  (the query already fetches the full row — `include: { items: true }` on
  `db.order.findMany`); the row renders the money line in the left block
  under the date line (`text-sm text-muted-foreground`, flush stacking —
  no margin class; the preflight resets p margins) ONLY when the view is
  visible. The success page composes `confirmationMoneyLineView` for both
  branches (the paid wording preserved; the mb-1/mb-8 rhythm keyed off
  `money.visible`).
- **The isolation restores**: `e2e-reset.ts` + `dev-cleanup.ts` —
  `ORD-2026-004` joins `CANONICAL_ORDERS`, the status restore
  (`cancelled`), and the refunded-columns guard (the
  ORD-2026-003-paid-columns precedent).
- **The pin updates** (legitimate, documented): the admin orders count
  line "3 orders" → "4 orders" (three unfiltered sites + the john@ search
  site in `admin.spec.ts`); the delivered filter stays "2 orders" and
  in_transit stays "1 order" (004 is cancelled — no update); the
  payments-surface pins ALL unchanged (no new events); the dashboard
  Recent Orders gains a row (take:5 — no pin; the row anatomy is
  contrast-safe on white cards: foreground/muted/secondary texts, no
  colored links — the a11y census pins hold by construction, re-verified
  by the standing gate); the `/account` a11y census pin 8 unchanged by
  construction (the orders tab is unmounted at census time — Radix
  inactive-content unmounting, no forceMount in the repo's Tabs).

### 2.3 Parity analysis (the clone-app-pat-pro discipline)

The reference has NO payment state anywhere (no Stripe, hardcoded orders)
— both surfaces are pure superset territory. The resting-visual rule:
non-refunded rows and non-refunded confirmations render byte-identically
to today (the seam returns `{ visible: false }` → no DOM delta). The
refund line reuses the row's existing muted vocabulary
(`text-sm text-muted-foreground` on the `bg-secondary/30` tinted row —
the same pair the date line already renders). The confirmation's refunded
line reuses the paid line's exact anatomy (`text-sm text-muted-foreground
mb-8`). Zero parity risk on every untouched surface; zero operator
vocabulary in the customer DOM (R10-2).

## 3. The deliverable — file-by-file

### §3.1 `src/lib/order-money-state.ts` + `src/lib/order-money-state.test.ts` (NEW)

The pure seam module + the unit pins (RED first):
`orderRefundLineView` — refunded+7999 → `Refunded · $79.99 returned`;
refunded+0 → `$0.00`; refunded+123456 → `$1,234.56`; null → invisible;
`"paid"` → invisible (the calm state: history never shows a paid line);
unknown → invisible.
`confirmationMoneyLineView` — `paid` → "Payment received — charged by
Stripe." (byte-exact, the session-22 wording); `refunded` → the
returned-to-original-payment-method copy; null → invisible; unknown →
invisible.

### §3.2 `prisma/seed.ts` — the ORD-2026-004 fixture

The demoOrders array entry + the post-loop refunded-columns update (the
003 pattern). The `events.create` for 004 carries both the placed event
and the `payment_refunded` event (note "Refunded $79.99 via Stripe").

### §3.3 `src/app/(storefront)/account/page.tsx` + `src/components/account/account-tabs.tsx`

`OrderRow` gains `paymentStatus: string | null`; the page maps it
(`paymentStatus: o.paymentStatus`); the row's left block renders the
money line when `orderRefundLineView(...).visible` — the line text from
the seam (never string-built in the consumer).

### §3.4 `src/app/(storefront)/checkout/success/page.tsx`

Both money branches compose `confirmationMoneyLineView`; the
confirmation-sent line's mb rhythm keys off `money.visible`; the paid
wording byte-exact; the refunded branch NEW.

### §3.5 The E2E (RED first)

- `tests/e2e/account.spec.ts` — NEW test "refunded orders surface the
  money state in history (session-33, CUSTOMER-MONEY-1)": the orders tab
  renders ORD-2026-004 + "Refunded · $79.99 returned" + the Cancelled
  pill; the demo-path rows carry NO refund line (001's row scoped — the
  calm state); the existing "orders tab lists the seeded reference order
  history" test unchanged (its assertions are additive-safe).
- `tests/e2e/checkout.spec.ts` — NEW test "a refunded order's confirmation
  reflects the refund (session-33)": `/checkout/success?order=ORD-2026-004`
  (authenticated → owner view) renders the refunded line + the $79.99
  total + NO "Payment received" (the paid vocabulary must not render on a
  refunded order — the branch-exclusivity pin).
- `tests/e2e/admin.spec.ts` — the count-pin updates only ("3 orders" →
  "4 orders" ×3 unfiltered + the john@ site; the delivered/in_transit
  filters unchanged).

### §3.6 The isolation restores — `prisma/e2e-reset.ts` + `prisma/dev-cleanup.ts`

`ORD-2026-004` in `CANONICAL_ORDERS` + the status restore (`cancelled`)
+ the refunded-columns guard (the 003 precedent: `paymentStatus:
"refunded"`, intent 005). The `status_changed` deleteMany already keys
off `CANONICAL_ORDERS` — 004 joins automatically.

## 4. TDD protocol

**RED** (all fail for the RIGHT reasons; pre-existing tests in the same
files stay green):
1. Unit: `order-money-state.test.ts` — the module doesn't exist (import
   fails → every contract RED).
2. E2E account: "ORD-2026-004" never renders (the fixture absent) + the
   refund line absent.
3. E2E checkout: the refunded confirmation line absent.

**GREEN** (the order): §3.1 the seam → §3.2 the fixture (seed + re-run
`db:setup` on the dev DB; the e2e DB re-seeds per global-setup) → §3.3
the history surface → §3.4 the confirmation surface → §3.5/§3.6 the
restores + the pin updates. Targeted runs green at each step; the admin
count-pin updates land here (the seed change makes the old pins fail —
the documented graduate-and-update pattern).

**Mutations ×3** (each caught + byte-exact revert, md5-verified):
- M1: `orderRefundLineView` — drop the `"paid"` calm case (paid orders
  render a paid line) → the unit calm-state contract fails + the E2E
  account test's 003-row-scoped assertion fails.
- M2: the confirmation seam — break the refunded branch's copy → the
  unit text contract fails + the E2E checkout test fails.
- M3: the account row — render the line unconditionally (ignore
  `.visible`) → the E2E calm-state assertion fails (the demo rows carry
  the line).

## 5. The full gate + the post-change battery

- `bun run lint && bun run typecheck && bun run test` → build → the FULL
  E2E ×2 consecutive runs on the final code (the ship discipline).
- The post-change battery: the sweep re-run (the touched surfaces are
  customer order rows — the account route re-checked), the 33rd→34th
  mobile-nav verification (the header untouched), the watches + census.
- The a11y standing gate re-run: the census pins must hold (the
  contrast-safety analysis in §2.2; any drift is investigated, never
  rubber-stamped).

## 6. Documentation duty

AGENTS.md (the CUSTOMER-MONEY-1 architecture rule), CLAUDE.md (the
session-33 contract + the new counts), README.md (the test-count row +
the feature rows), PAD v1.33 (ADR-041 + the revision row), SKILL v1.33.0
(the ADR-041 row), `docs/session_65.md`, the worklog S33 entry, this
plan's sign-offs. `.env.example` verified current (no new plumbing — the
round reads existing columns only).

## 7. Commit + push

Conventional Commit on `main`; push via `docs/ssh_git_wrapper_v3.py`
(the `--remote` flag; key at 0600 outside the repo; fingerprint
verified; dry-run then real push; key shredded after).

## 8. Sign-offs (checked on completion)

- [x] RED: 9 unit contracts + 2 E2E tests fail for the right reasons (the module absent; the fixture absent)
- [x] GREEN: §3.1–§3.6 implemented, targeted runs green (57/57 on the three affected specs)
- [x] Mutations ×3 caught + byte-exact reverts (md5s recorded at /tmp/round33-md5s.txt; M1 unit 2 + E2E 1; M2 unit 1; M3 E2E 1)
- [x] Full gate green: lint 0/0 · tsc clean · 278/278 unit+integration · build exit 0 · E2E 240/240 ×2 consecutive (518 total)
- [x] Post-change battery: sweep at baseline (all 8 routes) · 33rd mobile-nav token-exact verification · watches + census clean
- [x] Screenshots 176–180 captured + VLM-verified 5/5 (one description correction — the row-order phrasing)
- [x] Docs updated (AGENTS, CLAUDE, README, PAD v1.33/ADR-041, SKILL v1.33.0, session_65, worklog S33, plan sign-offs)
- [x] `.env.example` verified current (no new env plumbing — the round reads existing columns only)
- [x] Committed to `main` + pushed via the SSH wrapper (remote verified, key shredded)
