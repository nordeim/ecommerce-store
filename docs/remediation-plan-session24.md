# Remediation Plan — Session 24 (Round 24): The Admin Payment-Ops Surface (PAY-OPS-1)

**Date:** 2026-10-09 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `3d9dd39` (the session-23 ship `5ca95a2` + the sign-off `2b9756e` + the session-45 narrative log)
**Status at audit start:** 374-test gate (167 unit+integration + 207 E2E), PAD v1.23, SKILL v1.23.0 — lint 0/0 · tsc clean · 167/167 unit+integration · build exit 0 (24 routes) verified at the re-cloned workspace; the full E2E baseline re-run launched detached (207 expected).

## 0. The round's mandate

The user's standing round instruction re-emphasizes the professional Stripe
integration ("as any high-end e-commerce store would implement"), the full
audit/parity workflow (mobile nav, Tailwind v4 watch, agent-browser A/B),
the `.env`/db-root contract, the vitest + playwright suites, the remediation
plan (TDD), screenshots, `.env.example`, docs, and the main-only push.
Sessions 22/23 shipped and hardened the payment machinery (PAY-STRIPE-1/2).
This round's professional continuation — the session-44 "suggested next
steps" payment-ops candidate, the only Stripe-family item actionable
without external credentials: **the webhook backstop's ops surface — an
admin view over the StripeEvent log** (the superset console's payments
tab). A high-end store's payment operations require every webhook delivery
observable and every orphaned payment actionable; today they are neither.

## 1. Baseline verification (state at audit start)

- Workspace RESET this round (the sandbox was re-provisioned) — fresh
  `git clone` at `3d9dd39`, working tree clean. `bun install` (475
  packages), `.env` re-created with the repo contract, `bun run db:setup`
  green (the env-shadowing trap live as documented: the sandbox injects
  `DATABASE_URL=file:/home/z/my-project/db/custom.db` into the SHELL, which
  wins over the repo `.env` — the session-21 hard-link convergence
  re-established: `db/custom.db` at BOTH paths, ONE inode, verified).
- Baseline gate: lint 0/0 · tsc clean · 167/167 unit+integration (13 files)
  · build exit 0 (24 routes) — the documented session-23 ship state. The
  full E2E baseline re-run launched detached.
- Skills mapped from `skills/skills-catalog.md`: **e-commerce-nextjs16-monorepo**
  (the round's primary — its webhook/ops lesson family H4d/C8/R10-2/R10-7
  re-read for this round's audit), plus the standing set (agent-browser,
  ttd, clone-app-pat-pro, code-quality-standards, tailwind-patterns,
  nextjs-react-expert). The session-23 commit re-audited file-by-file
  (webhook route, stripe-pay island, checkout action, stripe-payment
  seams, the integration layer) — all hold.

## 2. Audit results

### 2.1 The payment-ops observability gap (the round's primary finding)

The `StripeEvent` log — the write path sessions 22/23 made
transactionally-correct — has **no read surface anywhere**. The
refund-trail signals (amount mismatch, stock-short, unusable metadata,
vanished cart — the deterministic "captured payment needs a human" family)
exist only as `console.error` lines in server logs. An operator cannot:

- see which webhook events arrived, when, of what type;
- see which events resolved to placed orders (and which order);
- see which captured payments sit in the refund-needed family;
- verify the backstop receives traffic at all.

The reference site has no such surface (its payments are mock) — this is
pure superset, admin-gated, zero parity risk (the console is in-chrome
superset territory per ADR-015/021).

### 2.2 The demo/e2e demonstrability gap

In the default (unconfigured) mode the webhook answers 400 before any
write — the `StripeEvent` table is empty on every fresh DB, so the
payments surface would render only its empty state in dev and E2E. The
demo data needs fixtures (the same class as the demo orders): one
Stripe-paid demo order + a canonical StripeEvent set, seeded idempotently
and restored by `prisma/e2e-reset.ts` (the run-to-run isolation contract).

### 2.3 The entry-point gap

The admin dashboard's quick actions are Products + Orders only; the
payments surface needs its entry-point button.

### 2.4 Verified-healthy (no action)

- The session-23 webhook restructure (the H4d/L9 rule, the honest
  200/500 policy, the in-tx number generation) — re-read, holds.
- The action path's verify-then-place + the P2002 target classification —
  holds (re-read `checkout.ts`).
- The island's confirm-then-place + mint-retry affordance — holds
  (re-read `stripe-pay.tsx`; the `/pure` loader discipline intact).
- The R10-7 converted-cart class: our architecture covers it by
  construction — the cart CLEARS in the placement tx (an empty cart
  rejects the re-mint "Your cart is empty"), the intent anchor UNIQUE
  constraint makes a post-webhook client submit resolve to the placed
  order, and the webhook's empty-cart path records + refunds. No defect.
- The `resolveStripeConfig` truth table, the e2e global-setup, the
  `.env.example` Stripe section — all current.

## 3. Fix design (validated against the codebase)

### 3.1 The pure seam (`src/lib/admin-payments.ts`, unit-pinned)

Mirrors `admin-orders.ts` (the ADMIN-SEARCH-1 pattern) for the payments
surface's URL-deep-linkable filter state (`?family=` + `?q=`):

| Seam | Contract |
|---|---|
| `ADMIN_PAYMENT_FAMILY_OPTIONS` | `succeeded` / `failed` / `other` — the three event families the page filters by (raw Stripe types are free-form; the family is the operator's mental model). |
| `parseAdminPaymentFilters(params)` | `family` validated against the three canonical values — anything else falls through to undefined (a bad deep-link renders the unfiltered list, never an error); `q` trimmed; array params take their first value; unknown keys ignored. |
| `buildAdminPaymentWhere(filters)` | family → `type: "payment_intent.succeeded"` / `type: "payment_intent.payment_failed"` / `NOT: { OR: [both] }`; `q` → `OR: [{ paymentIntentId: { contains: q } }, { eventId: { contains: q } }]` (the two identifiers an operator relays from the Stripe dashboard); ANDed when both present. |
| `resolvePaymentEventOutcome(event, orderByIntent)` | Pure derivation: type `succeeded` → the linked order's number (`"placed"`) or `"refund-needed"` (a succeeded event with no order is exactly the deterministic-failure family the webhook records + 200s); type `failed` → `"failed"`; anything else → `"ignored"`. Structural input (no Prisma import — unit-testable). |

### 3.2 The page (`src/app/(storefront)/admin/payments/page.tsx`)

Server component, the admin-orders page's anatomy: admin gating
(`/login?redirect=/admin/payments` for guests, `/` for non-admins),
`← Admin` back link + `h1 "Payments"`, a one-line Stripe configuration
status (the `resolveStripeConfig` truth table — "demo mode" vs
"configured"; operator-only surface, so the R10-2 customer-copy rule does
not apply), the filter island, the count line (the `take: 100` bound made
visible), the event rows, the empty state. The row renders: receivedAt
(`toLocaleString`), the type, the eventId + paymentIntentId (mono-ish
`font-mono text-xs`), and the OUTCOME column — a deep link to
`/admin/orders/[id]` for placed events, a destructive "No order — refund
via Stripe dashboard" line for refund-needed, plain "Payment failed" /
"Ignored" for the others. Outcome resolution: ONE
`order.findMany({ where: { stripePaymentIntentId: { in: [...] } } })`
after the event fetch (no N+1). `force-dynamic`; `Metadata` "Admin ·
Payments"; wraps in `div.flex-1` (the one-`<main>` landmark contract).

### 3.3 The filter island (`src/components/account/admin-payment-filters.tsx`)

Mirrors `AdminOrderFilters` (the shop-filter-bar pattern: merged params
via `router.push`, a Select for the family, a search input for `q`).

### 3.4 The dashboard entry point (`src/app/(storefront)/admin/page.tsx`)

A third quick-action button "Payments" (outline, rounded-xl — the
existing pair's anatomy) linking `/admin/payments`.

### 3.5 The demo fixtures (`prisma/seed.ts` + `prisma/e2e-reset.ts`)

- `ORD-2026-003` becomes the Stripe-paid demo order:
  `stripePaymentIntentId: "pi_demo_fixture_003"`, `paymentStatus: "paid"`
  (the order-detail Charge row — already shipped session-22 — finally has
  a seeded demo instance). Idempotent: the create data carries the fields
  AND a post-loop update restores them on existing DBs (the seed skips
  existing orders).
- Three canonical StripeEvent rows (upserted by `eventId`):
  - `evt_demo_fixture_s` — `payment_intent.succeeded` →
    `pi_demo_fixture_003` (outcome: ORD-2026-003 placed)
  - `evt_demo_fixture_f` — `payment_intent.payment_failed` →
    `pi_demo_fixture_004` (outcome: Payment failed)
  - `evt_demo_fixture_r` — `charge.refunded` → `pi_demo_fixture_005`
    (outcome: Ignored)
- `prisma/e2e-reset.ts` restores the canonical set every run (deletes
  non-fixture events; re-upserts the three rows + the ORD-2026-003 paid
  columns) — the run-to-run isolation contract extends to the new table.

### 3.6 The tests

**Unit** (`src/lib/admin-payments.test.ts`, ~16 tests): the parse truth
table (valid families, invalid fall-through, array params, q trimming,
unknown keys), the where truth table (each family, q branches, ANDed,
empty → `{}`), the outcome resolver (succeeded+order → placed,
succeeded+no order → refund-needed, failed, ignored, case variants).

**E2E** (`tests/e2e/admin.spec.ts`, +6 tests): guest gating with intent
(`/admin/payments` → `/login?redirect=/admin/payments`); the page renders
the three fixture events with resolved outcomes (the ORD-2026-003 deep
link, "Payment failed", "Ignored") + the demo-mode status line; the
family filter deep-link (`?family=succeeded` → only the placed fixture)
+ the count line; the `q` search (`pi_demo_fixture_004` → only the failed
event); the empty state + "Clear all filters" (`?family=other&q=zzz`);
the order deep-link navigates to the order-detail page. Plus the a11y
admin gate gains the payments surface (a separate calibrated test — the
new page measures its own census; a zero-violation census pins as
exactly-empty, the stronger shape, rather than weakening the existing
{color-contrast} profile rows).

### 3.7 The docs

AGENTS.md (the PAY-OPS-1 contract + the admin-surface row), CLAUDE.md
(the session-24 contract + counts), README.md (the payments row + counts
+ the 24th verification), PAD v1.24 (ADR-032 + the revision row + the
file/test matrix), `ecommerce-store_SKILL.md` v1.24.0 (the ADR-032 index
entry + any new lesson), `docs/session_46.md`, the worklog, this plan's
sign-offs after the push.

## 4. TDD plan

1. **RED (unit)** — `src/lib/admin-payments.test.ts` written first: the
   module missing = RED for the right reason.
2. **RED (E2E)** — the six admin.spec payments tests: the route 404s on
   the baseline (the platform 404 renders) = RED for the right reason.
3. **GREEN** — implement §3.1 → §3.2 → §3.3 → §3.4 → §3.5 in that order
   (the seam first — the page consumes it; the fixtures before the E2E
   green run). Full unit + integration suites green; the targeted E2E
   spec green.
4. **Mutation efficacy (×3, each reverted):**
   - **M1 (the outcome resolution dropped)** — the join removed, every
     outcome renders refund-needed/ignored → the outcome + deep-link
     tests FAIL (the surgical proof that the resolution is load-bearing).
   - **M2 (the family validation dropped)** — `parseAdminPaymentFilters`
     passes any family through → the parse seam tests + the bad
     deep-link behavior FAIL.
   - **M3 (the admin gate skipped)** — the `isAdmin` check removed from
     the payments page (a non-admin renders it) → the gating test FAIL
     (non-admin → `/` — the console's role contract).
5. **Full gate** — `bun run lint && bun run typecheck && bun run test &&
   bun run build && bun run test:e2e` — two consecutive full E2E runs on
   the FINAL code (the L25 stale-server discipline before each).
6. **Live re-verification** — the :3000 production server on the final
   build: the 24th mobile-nav verification (agent-browser, both sessions
   authenticated, ONE host), the 8-route pixel sweep (baseline band),
   the standing typeahead/carousel watches, the full-route console
   census (the payments route included), the SEO layer re-verify.
7. **Screenshots 131-135** — the payments surface (fixtures + outcomes),
   the filtered view (?family=succeeded + the count line), the 24th
   mobile-nav verification, the unit gate run, the E2E gate run.
   VLM-verified.
8. **Docs** — §3.7; `.env.example` verified current (no new env plumbing
   this round).

## 5. Sign-off criteria

- [x] Baseline gate green at audit start (lint 0/0 · tsc clean · 167/167
      unit+integration · build exit 0 · the full E2E baseline re-run green
      pre-change — 207/207)
- [x] The payments surface shipped: `/admin/payments` renders the
      StripeEvent log with resolved outcomes (placed deep-link /
      refund-needed / failed / ignored), URL-deep-linkable family + q
      filters, count line, empty state, demo-mode status line
- [x] The pure seam (`admin-payments.ts`) unit-pinned (~16 tests)
- [x] The dashboard entry point + the seeded demo fixtures (the paid
      ORD-2026-003 + the canonical three-event set) + the e2e-reset
      isolation contract extended
- [x] Mutation efficacy ×3 (the outcome resolution, the family
      validation, the admin gate), each reverted
- [x] RED → GREEN documented for every new test
- [x] Full gate green ×2 consecutive full E2E runs on the FINAL code
      (207/207 + 7 new = 214/214 both); total test count grew 374 → 400
      (no test removed or weakened)
- [x] Live re-verification: pixel sweep at baseline; the 24th mobile-nav
      verification (the md5 compared against the 13th–23rd band); the
      typeahead/carousel watches; the console census (incl. the payments
      route); the SEO layer
- [x] Screenshots 131-135 under `docs/screenshots/` + VLM-verified
- [x] Docs updated (AGENTS/CLAUDE/README/PAD v1.24/SKILL v1.24.0/
      session_46/worklog); `.env.example` verified current
- [ ] Committed on `main` + pushed via the SSH wrapper (remote verified,
      the operator key shredded)
