# Remediation Plan — Session 25 (Round 25): Payment-Ops Observability + Console A11y (PAY-OPS-2 / A11Y-HEADING-1)

**Date:** 2026-10-09 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `ebd6361` (the session-24 ship `fbaaeba` + the sign-off `fa5ad8a` + the session-47/48 narrative logs)
**Status at audit start:** 400-test gate (186 unit+integration + 214 E2E), PAD v1.24, SKILL v1.24.0 — lint 0/0 · tsc clean · 186/186 unit+integration · build exit 0 (25 routes) verified on the pulled workspace; the full E2E baseline re-run launched detached (214 expected).

## 0. The round's mandate

The user's standing round instruction re-emphasizes the professional Stripe
integration, the full audit/parity workflow (mobile nav, Tailwind v4 watch,
agent-browser A/B), the `.env`/db-root contract, the vitest + playwright
suites, the remediation plan (TDD), screenshots, `.env.example`, docs, and
the main-only push. Sessions 22–24 shipped and hardened the payment
machinery (PAY-STRIPE-1/2/OPS-1). This round continues the payments-ops
family — the two session-46/47 documented round-25 candidates, both
actionable without external credentials:

1. **PAY-OPS-2 — the payments surface's observability refinement**: the
   refund-needed OUTCOME promoted to a first-class filter family (the
   operator's most actionable signal — "which captured payments need
   refunds TODAY"), the event AMOUNT persisted + rendered (the operator's
   first question: "how much?"), and the charge-event intent honesty fix.
2. **A11Y-HEADING-1 — the console heading-order family fix**: the
   session-24 documented family observation (the lone h1 → the footer's h3
   columns on the three console LIST pages) resolved with sr-only h2s —
   the superset surfaces get the best-practice-clean shape while the
   storefront parity surfaces stay untouched (the reference's own a11y
   tree is the parity trait there).

## 1. Baseline verification (state at audit start)

- Workspace NOT reset this round — `git pull` fast-forwarded
  `06bce7e..ebd6361` (only `docs/session_48.md`, the user's session-log
  narrative). `.env` carries the repo contract
  `DATABASE_URL="file:../db/custom.db"`; the env-shadowing trap live as
  documented (the sandbox injects `DATABASE_URL` into the SHELL); the
  session-21 hard-link convergence INTACT (inode 395370 at BOTH
  `db/custom.db` paths, verified).
- Baseline gate: lint 0/0 · tsc clean · 186/186 unit+integration (14
  files) · build exit 0 (25 routes) — the documented session-24 ship
  state. The full E2E baseline re-run launched detached.
- Skills mapped from `skills/skills-catalog.md`: **e-commerce-nextjs16-monorepo**
  (the round's primary — its ops/webhook lesson family re-read; the
  `payment_orphan` observability pattern and the refund-permission model
  are the reference for what an operator needs), plus the standing set
  (agent-browser, tdd, clone-app-pat-pro). The session-24 commit re-audited
  file-by-file (the payments page, the seam, the filter island, the
  fixtures, the e2e-reset extension) — all hold.

## 2. Audit results

### 2.1 The full-tag axe probe: the heading-order family confirmed live

A standalone probe (self-hosted axe-core, `runOnly: best-practice`, the
:3000 production server, admin-authenticated) measured the console
census:

| Route | best-practice census |
|---|---|
| `/admin` (dashboard) | `{}` — clean (h1 → h2 → footer h3s) |
| `/admin/orders` | `{heading-order: 1}` (lone h1 → footer h3) |
| `/admin/products` | `{heading-order: 1}` (lone h1 → footer h3) |
| `/admin/payments` | `{heading-order: 1}` (lone h1 → footer h3) |
| `/admin/orders/[id]` (detail) | `{}` — clean (h1 → h2 sections) |

The session-24 family observation holds exactly: the three console LIST
pages skip h1 → h3 (the footer's columns follow the page's lone h1). The
dashboard and the order-detail already render h2s. The storefront pages
shop the same shape as the REFERENCE's own a11y tree (parity — the
standing WCAG-tagged gate pins the shared `{color-contrast}` profile;
the heading-order rule is best-practice-tagged and outside the gate's
`runOnly` set) — so the fix is console-only, zero parity risk.

### 2.2 The payments surface's observability gaps (the round's primary findings)

**(a) The refund-needed signal is not filterable.** The outcome resolver
derives refund-needed per row (ADR-032), but the family Select offers
succeeded/failed/other only — an operator must SCAN the succeeded family
to find the actionable rows. A high-end store's payment-ops triage starts
with "show me the money that needs refunding" — the deterministic-failure
family the webhook records + 200s per ADR-031 (amount mismatch,
stock-short, unusable metadata, vanished cart).

**(b) The event rows carry no AMOUNT.** The webhook's structural parse
already extracts `data.object.amount` (the schema has
`amount: z.number().optional()`), and the refund-trail `console.error`
lines log it — but the `StripeEvent` row never persists it. The operator
reading "No order — refund via Stripe dashboard" cannot see the
magnitude without opening the Stripe dashboard.

**(c) The charge-event intent column is dishonest.** `recordEvent`
writes `paymentIntentId: evt.data.object.id` for EVERY type — but a
`charge.refunded` event's `data.object` is a CHARGE (`id: "ch_…"`, with
the real intent id on `payment_intent`). The column (and the surface's
q-search over it) silently records charge ids for the charge family. The
seed's `evt_demo_fixture_r` pretends a pi id — the fixture is not
representative of the real write path.

### 2.3 Verified-healthy (no action)

- The session-23 webhook restructure (H4d/L9, the honest 200/500 policy,
  the in-tx number generation) — re-read, holds.
- The payments page's outcome resolution (ONE findMany, no N+1) — holds.
- The filter island's URL-deep-linkable pattern (ADMIN-SEARCH-1) — holds.
- The demo fixtures + the e2e-reset isolation contract — hold.
- The `.env` / `.env.example` / db-path contracts — current.

## 3. Fix design (validated against the codebase)

### 3.1 The seam (`src/lib/admin-payments.ts`, unit-pinned)

`buildAdminPaymentWhere(filters, placedIntentIds: string[] = [])` gains
an optional second parameter (pure input — no Prisma import; the page
passes the fetched set; the E2E owns the integration contract):

| Filter | Where |
|---|---|
| `family=refund-needed` | `{ type: "payment_intent.succeeded", OR: [{ paymentIntentId: { notIn: placedIntentIds } }, { paymentIntentId: null }] }` — the null branch covers succeeded events with no intent id (the resolver's refund-needed shape) |
| `family=refund-needed` + `q` | `{ AND: [{ type, OR: [notIn/null] }, { OR: [q branches] }] }` — the nested AND keeps the type + notIn group intact |
| empty `placedIntentIds` | every succeeded event is refund-needed (no orders placed) — honest for a fresh DB |

`ADMIN_PAYMENT_FAMILY_OPTIONS` gains `{ value: "refund-needed", label: "Refund needed" }`.
The `AdminPaymentWhere` type widens to express `notIn` + the nested AND
element. The default `[]` is documented: the page ALWAYS passes the
fetched set for the refund-needed family (the deep-link E2E test fails
if it ever forgets — the integration guard lives there, the shape
contract lives here).

### 3.2 The amount column (`prisma/schema.prisma` + the webhook write path)

- `StripeEvent.amount Int?` — minor units, nullable (non-payment types
  and pre-session-25 rows). Additive; `db push` (the repo's convention —
  no migration files).
- `recordEvent` + the in-tx insert persist
  `amount: evt.data.object.amount ?? null`.
- The page renders the amount on the row's right block above the outcome
  (`formatCents` — the operator's eye lands on the outcome; the
  magnitude belongs with it).

### 3.3 The charge-event intent extraction (`src/lib/stripe-payment.ts`)

- `stripeWebhookEventSchema.data.object` gains
  `payment_intent: z.string().optional()`.
- The pure helper `stripeEventIntentId(object)`:
  `object.payment_intent ?? object.id` — payment_intent.* events keep
  recording their own id; charge.* events record the REAL intent id; any
  other shape keeps the object id.
- `recordEvent` + the in-tx insert use the helper.

### 3.4 The page (`src/app/(storefront)/admin/payments/page.tsx`)

- When `family=refund-needed`: fetch the placed-intent set FIRST (one
  bounded query — `order.findMany({ where: { stripePaymentIntentId: {
  not: null } }, select: { stripePaymentIntentId: true } })`), then build
  the where. The count line + `take: 100` bound stay honest (the same
  where feeds `count`).
- The row's right block: the amount line (when present) + the outcome.
- The sr-only h2 before the card (§3.6).

### 3.5 The fixtures (`prisma/seed.ts` + `prisma/e2e-reset.ts`)

- A FOURTH canonical event: `evt_demo_fixture_n` —
  `payment_intent.succeeded` → `pi_demo_fixture_006`, NO linked order,
  `amount: 14900` (the refund-needed family's seeded instance — the
  filter's demonstrability).
- The existing three gain amounts: `s: 52497` (ORD-2026-003's pinned
  display total), `f: 8999`, `r: 7999`.
- `e2e-reset.ts` restores the four-row canonical set + the amounts
  every run (the isolation contract extends).

### 3.6 The console heading-order fix (A11Y-HEADING-1)

An `sr-only` h2 labels the list region on the three console LIST pages
(immediately before the card container): orders → "Orders list",
products → "Products", payments → "Payment event list". The empty-state
h3s then follow h2 (valid); the footer h3s follow h2 (valid). The
storefront pages stay untouched (the reference's own shape — parity).

### 3.7 The tests

**Unit** (`src/lib/admin-payments.test.ts`, ~+7): the refund-needed
parse (valid family), the where without q (notIn + null OR shape), with
q (the nested AND shape), empty placed set (all succeeded), non-empty
placed set (excludes placed intents), the null-intent branch, the
family-options surface. Plus `src/lib/stripe-payment.test.ts` (+2): the
intent-id helper (payment_intent events + charge events + fallback).

**Integration** (`tests/stripe-webhook.integration.test.ts`, +2): the
recorded rows carry the amount (a failed event records the attempted
amount; a succeeded backstop placement records the captured amount); a
`charge.refunded` delivery records the REAL intent id (the payload's
`payment_intent`, not the charge id).

**E2E** (`tests/e2e/admin.spec.ts`, +3): the refund-needed family
deep-link (`?family=refund-needed` → ONLY the fixture-n row + "No order
— refund via Stripe dashboard" + the count line "1 payment event"); the
refund-needed + q combination (`?family=refund-needed&q=pi_demo_fixture_003`
→ the empty state — the AND shape's behavioral pin, the placed s fixture
is NOT refund-needed); the amount rendering (the unfiltered list shows
"$524.97" on the placed row + "$149.00" on the refund-needed row).

**A11y gate** (`tests/e2e/accessibility.spec.ts`, +1): the admin gate
describe gains a best-practice-tag census test on the three LIST pages —
exactly `{}` post-fix (a `runAxeTags` variant parameterizing the tag
set; the standing WCAG gate + its pins stay byte-identical).

### 3.8 The docs

AGENTS.md (the PAY-OPS-2 + A11Y-HEADING-1 contracts), CLAUDE.md (the
session-25 contract + counts), README.md (the payments row + counts +
the 25th verification), PAD v1.25 (ADR-033 + the revision row + the
file/test matrix), `ecommerce-store_SKILL.md` v1.25.0 (the ADR-033
index entry), `docs/session_49.md`, the worklog, this plan's sign-offs
after the push.

## 4. TDD plan

1. **RED (unit)** — extend `admin-payments.test.ts` first (the
   refund-needed contracts fail: the seam lacks the family + the second
   param); extend `stripe-payment.test.ts` (the helper missing).
2. **RED (integration)** — the two new webhook contracts (the recorded
   amount absent; the charge intent id wrong).
3. **RED (E2E)** — the three payments tests (the family option absent;
   the amounts absent) + the best-practice census test (heading-order
   fires ×1 on the three list pages = the pre-fix RED for the right
   reason).
4. **GREEN** — §3.1 → §3.2 (schema + push) → §3.3 → §3.4 → §3.5 → §3.6
   in that order. Full unit + integration suites green; the targeted
   admin + a11y specs green.
5. **Mutation efficacy (×3, each reverted):**
   - **M1 (the placed-intent fetch dropped)** — the page passes `[]`
     for refund-needed → ALL succeeded events render as refund-needed
     → the family deep-link test FAILS (the fixture-s row appears).
   - **M2 (the amount persistence dropped)** — the rows render no
     amount → the amount-rendering test FAILS.
   - **M3 (the sr-only h2 dropped)** — the best-practice census test
     FAILS ({heading-order: 1} again).
6. **Full gate** — `bun run lint && bun run typecheck && bun run test &&
   bun run build && bun run test:e2e` — two consecutive full E2E runs on
   the FINAL code (the L25 stale-server discipline before each).
7. **Live re-verification** — the :3000 production server on the final
   build: the 25th mobile-nav verification (agent-browser, both sessions
   authenticated, ONE host), the 8-route pixel sweep (baseline band),
   the standing typeahead/carousel watches, the full-route console
   census (the payments route included), the SEO layer re-verify.
8. **Screenshots 136-140** — the payments surface with the
   refund-needed filter + amounts, the 25th mobile-nav verification, the
   unit gate run, the E2E gate run, the best-practice census panel.
   VLM-verified.
9. **Docs** — §3.8; `.env.example` verified current (no new env plumbing
   this round).

## 5. Sign-off criteria

- [x] Baseline gate green at audit start (lint 0/0 · tsc clean · 186/186
      unit+integration · build exit 0 · the full E2E baseline re-run green
      pre-change — 214/214)
- [x] The refund-needed family shipped: `?family=refund-needed` renders
      only the actionable rows (the seeded fixture-n + the count line);
      the placed-intent fetch feeds the seam; the combined-filter AND
      shape E2E-pinned
- [x] The amount column shipped: the webhook persists
      `data.object.amount`; the rows render the magnitude beside the
      outcome; the fixtures + e2e-reset carry amounts
- [x] The charge-event intent honesty fix shipped: `payment_intent ??
      object.id` — integration-pinned
- [x] The console heading-order fix shipped: the three LIST pages carry
      sr-only h2s; the best-practice census on the console is exactly
      `{}` (the new gate test); the standing WCAG pins untouched
- [x] Mutation efficacy ×3 (the placed-intent fetch, the amount
      persistence, the sr-only h2), each reverted
- [x] RED → GREEN documented for every new test
- [ ] Full gate green ×2 consecutive full E2E runs on the FINAL code;
      total test count grows 400 → ~412 (no test removed or weakened)
- [x] Live re-verification: pixel sweep at baseline; the 25th mobile-nav
      verification (the md5 compared against the 13th–24th band); the
      typeahead/carousel watches; the console census (incl. the payments
      route); the SEO layer
- [x] Screenshots 136-140 under `docs/screenshots/` + VLM-verified
- [x] Docs updated (AGENTS/CLAUDE/README/PAD v1.25/SKILL v1.25.0/
      session_49/worklog); `.env.example` verified current
- [x] Committed on `main` + pushed via the SSH wrapper (remote verified
      `refs/heads/main @ 246852a == local HEAD`, the operator key shredded)
