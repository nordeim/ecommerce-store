# Remediation Plan — Session 23 (Round 23): Stripe Webhook H4d Hardening + the Backstop Integration Gate (PAY-STRIPE-2)

**Date:** 2026-10-09 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `3ee3633` (the session-22 ship `96cddc6` + the sign-off `fbbb7a7` + the session-43 narrative log)
**Status at audit start:** 352-test gate (145 unit + 207 E2E), PAD v1.22, SKILL v1.22.0 — lint 0/0 · tsc clean · 145/145 unit · build exit 0 (24 routes) verified at the pulled workspace; the full E2E baseline re-run launched detached (the double-fork launch form — the documented surviving pattern).

## 0. The round's mandate

The user's standing round instruction re-emphasizes the Stripe integration
("professionally and with properly functioning — a perfect checkout
experience as any high-end e-commerce store would implement"), the full
audit/parity workflow (mobile nav, Tailwind v4 watch, agent-browser A/B),
the `.env`/db-root contract, the vitest + playwright suites, the remediation
plan (TDD), screenshots, `.env.example`, docs, and the main-only push.
Session-42 shipped the full Stripe machinery env-gated OFF (PAY-STRIPE-1,
ADR-030). This round's professional continuation: **audit the shipped
machinery against the reference skill's hard-won lessons and close the real
gaps found** — one H4d-class defect, one missing failure-recovery policy,
one untested code path family, and one checkout-UX gap.

## 1. Baseline verification (state at audit start)

- Workspace NOT reset — `git pull` fast-forwarded `fbbb7a7 → 3ee3633` (only
  `docs/session_43.md`, the user's session-log narrative of round-22).
  Working tree clean.
- The env-shadowing trap live as documented (shell `DATABASE_URL` wins over
  the repo `.env`); the session-21 hard-link convergence INTACT (inode
  174897 at BOTH `db/custom.db` paths — no re-convergence needed). `.env`
  carries the repo contract `DATABASE_URL="file:../db/custom.db"`; `db/`
  at the repo root — verified. `.env.example` matches the codebase (the
  Stripe section from session-22 — no new env plumbing this round).
- Baseline gate: lint 0/0 · tsc clean · 145/145 unit · build exit 0 — the
  documented session-22 ship state. Full E2E baseline running detached
  (207 expected).
- Skills mapped from `skills/skills-catalog.md`: **e-commerce-nextjs16-monorepo**
  (the primary — its H4d/L9 webhook lesson, the C8 idempotency-row rule, the
  R10-2 customer-safe copy, the failure-policy family), plus the standing
  set (agent-browser, ttd, clone-app-pat-pro, code-quality-standards,
  tailwind-patterns, nextjs-react-expert). The session-22 commit
  (`96cddc6`) re-audited file-by-file (the Stripe round's 20+ files read
  completely — the audit findings below are against that code).

## 2. Audit results

### 2.1 The H4d-class defect: the dedup row commits BEFORE the placement transaction

The webhook's `StripeEvent` insert happens BEFORE the backstop placement
(the route's "dedup-first" flow). The reference skill documents this exact
shape as a High finding (H4d, lesson L9): **a Stripe retry after a placement
failure silently 200s but never creates the order — payment captured, order
dropped.** Concretely in our route: a TRANSIENT placement failure (a
`db.$transaction` error — SQLITE_BUSY, a P2002 number race, an infra blip)
lands in the catch → refund-trail log + **200**. The event row is already
committed. Stripe's retry (non-2xx is what triggers it — we returned 200)
never even fires; if Stripe re-delivers anyway (it can, on dashboard
resend), the dedup `findUnique` short-circuits to `{ duplicate: true }`.
The captured payment is recoverable only by a human reading logs and
refunding. The backstop exists precisely to recover these payments
automatically — and it cannot.

**The fix (the skill's C8 rule):** the idempotency row must commit IN the
same transaction as the side effects. A transient failure rolls the event
row back WITH the placement, and the route answers **500** — Stripe retries
with exponential backoff for up to 3 days, and the retry re-attempts the
full placement. Deterministic-permanent failures (amount mismatch, unusable
metadata, vanished/empty cart, stock-short) keep the 200 + refund-trail
contract (a retry could never succeed — recording the event stops the
noise). This refines ADR-030's "never a 5xx" into the honest policy:
**200 for deterministic outcomes, 500 only when a retry could succeed.**

### 2.2 The failure-policy gap (the same defect's second face)

The current catch treats every placement error identically (log + 200).
The professional classification (mirroring the reference skill's
`resolvePlacementOutcome` seam):
- **duplicate** — a P2002 on `StripeEvent.eventId` (concurrent delivery
  won the race) or on `Order.stripePaymentIntentId` (the client path placed
  between our check and the TX) → 200 with the winner's order number.
- **permanent** — `STOCK_SHORT:*` (the route's typed marker) → record the
  event standalone + 200 + refund-trail (stock-short is deterministic at
  decision time; the operator refunds or restocks).
- **transient** — everything else (TX errors, P2002 on `number`) → the TX
  already rolled back the event row → 500 → Stripe retries.

### 2.3 The order-number race in the webhook

The backstop's `ORD-YYYY-NNN` number is computed from a count query
OUTSIDE the transaction (the action path already computes it inside — the
webhook drifted from the established pattern). Two concurrent placements
can mint the same number; the unique constraint then fails as a generic
error. Fix: move the generation inside the TX (the action path's
convention), where the P2002-number failure classifies as transient (500 +
retry → fresh number → places).

### 2.4 The checkout-UX gap: a failed PaymentIntent mint cannot be retried in place

`stripe-pay.tsx`'s mint effect guards on `sessionError !== null` — once the
`createPaymentIntentAction` call fails (transient network, rate-limit), the
"Preparing secure card payment…" panel renders the error with NO affordance
until a full page reload. A high-end checkout offers an in-place retry.
Fix: a "Try again" button on the error state (clears `sessionError` → the
effect re-runs → re-mint). The resting (unconfigured) visual is untouched
(the island never mounts without keys) — pinned by the existing
stripe.spec + the checkout pixel sweep.

### 2.5 The test gap: the backstop path has zero integration coverage

Session-22 pinned the pure seams (41 unit) and the UNCONFIGURED E2E
contract (5 tests) — but the webhook handler's backstop placement (the
most complex new code path: signature → dedup → metadata rebuild → cart
reload → re-price → verify → TX placement) was never executed by any test.
The round adds the **integration layer**: a vitest suite that drives the
REAL route handler with REAL HMAC-signed event bodies against a scratch
SQLite DB — no network, no keys (the signature is computed with
node:crypto exactly as Stripe does; `constructEvent` is a local HMAC
check; the SDK client constructs offline).

### 2.6 Verified-healthy (no action)

- The pure seams' contracts (41 unit pins) — re-read, all hold.
- The action path's verify-then-place (intent retrieval OUTSIDE the tx,
  the paid columns, the P2002-intent-anchor → the already-placed order
  number) — correct; this round only refines its P2002 target
  classification (a number-race P2002 currently falls to the generic
  error; with the classifier it maps to the honest "please try again"
  and the retry resolves via the intent anchor).
- The island's confirm-then-place flow, the amount-mismatch re-mint
  (adjust-state-during-render), the L34 `/pure` loader discipline, the
  env-gated CSP — all re-verified against the code.
- The sentinel mirror, `checkoutSchema.stripePaymentIntentId` (`^pi_`),
  the e2e global-setup `--accept-data-loss` note — all current.

## 3. Fix design (validated against the codebase)

### 3.1 The pure seams (`src/lib/stripe-payment.ts`, +2 exports, unit-pinned)

| Seam | Contract |
|---|---|
| `classifyWebhookPlacementError(error)` | `"duplicate" \| "permanent" \| "transient"` — P2002 with target containing `eventId` or `stripePaymentIntentId` → duplicate; message starting `STOCK_SHORT:` → permanent; everything else → transient. Accepts a structural error view (`{ code?, message?, meta?: { target? } }`) — no Prisma import in the seam (unit-testable without the client). |
| `isIntentAnchorP2002(error)` | boolean — P2002 with `stripePaymentIntentId` in target (for `placeOrderAction`'s already-placed resolution; a `number`-target P2002 no longer masquerades as it). |

### 3.2 The webhook route restructure (`/api/stripe/webhook`)

The succeeded path becomes: pre-TX fast duplicate check → pre-TX
order-exists check (client-path precedence; records the event standalone) →
pre-TX metadata/cart/re-price/verification (permanent failures: record +
200 refund trail) → **one TX: StripeEvent insert + number generation +
stock re-check + order create + decrement + cart clear** → 200 with the
order number. The catch classifies: duplicate → 200 with the winner's
number; permanent (STOCK_SHORT) → record standalone + 200 + refund trail;
transient → 500 `{ received: false }` (the event row rolled back — Stripe
retries, the retry re-places). `payment_failed` / ignored events keep the
record-only + 200 flow. The unconfigured/400 contract unchanged (E2E-pinned).

### 3.3 The island retry (`src/components/checkout/stripe-pay.tsx`)

The mint-error panel gains a small outline "Try again" button —
`setSessionError(null)` re-runs the mint effect. No visual change to the
unconfigured checkout (the island is gated behind real keys).

### 3.4 The action-path P2002 refinement (`src/lib/actions/checkout.ts`)

The catch's P2002 branch now checks `isIntentAnchorP2002` — the
intent-anchor case keeps the already-placed resolution; a number-race
falls through to the honest retry copy (the customer's retry re-verifies
the intent and resolves via the anchor). Behavior-compatible for every
existing pinned path.

### 3.5 The integration gate (`tests/stripe-webhook.integration.test.ts`)

Vitest, node environment, dynamic imports AFTER env setup:
`DATABASE_URL` → absolute `file:` URL at a scratch `db/webhook-test.db`
(git-ignored; the file is removed at suite start — no residue class);
`STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` → test fixtures (the SDK
constructs offline; `constructEvent` is a local HMAC check). The schema is
pushed to the scratch DB in `beforeAll` (execSync, `--skip-generate`).
Fixtures: a product + cart + items created via the Prisma client; event
bodies built as canonical JSON; signatures computed
`t=…,v1=HMAC_SHA256(whsec, "t.body")`. The suite drives the REAL `POST`
export with `new NextRequest(...)` — no server, no network.

**The contract table (11 tests):**
1. **The backstop placement** — a valid signed `payment_intent.succeeded`
   for an orphaned intent (metadata cartId + shipping) places the order:
   200 + order number; the order row carries the paid columns
   (`paymentStatus: "paid"`, the intent id, `paymentMethod: "card"`), the
   line items snapshot, `status: "processing"`; stock decremented; the
   cart cleared; the StripeEvent recorded.
2. **Duplicate delivery** — the same event re-POSTed → 200
   `{ duplicate: true }`; no second order (count unchanged).
3. **Client-path precedence** — an order already holding the intent id →
   200 with that order's number; no new order; the event recorded.
4. **Amount mismatch** — intent amount ≠ server-re-derived total → 200,
   NO order, the event recorded (permanent — no retry value).
5. **Missing signature** → 400 (customer-safe copy).
6. **Invalid signature** (wrong HMAC) → 400.
7. **THE H4d PROOF (transient failure → recovery)** — `db.order.create`
   mocked to reject ONCE (ECONNRESET): the first POST → **500** AND the
   StripeEvent row NOT recorded (rolled back with the TX); the same event
   re-POSTed after the restore → 200 + the order placed + the event
   recorded. *This test fails on the session-22 code (200 + event
   committed + duplicate no-op on retry — the payment-orphan bug).*
8. **Stock-short is permanent** — fixture stock < quantity → 200, no
   order, the event recorded, the refund-trail log asserted.
9. **`payment_intent.payment_failed`** — recorded + 200; no placement.
10. **An ignored type** (`charge.refunded`) — recorded + 200 `{ ignored }`.
11. **The number race classifies transient** — the seam-level pin plus a
    route-level assertion: a P2002-on-`number` rejection (mocked) → 500
    with the event row rolled back (a retry re-attempts with a fresh
    number).

Plus the unit seam additions in `src/lib/stripe-payment.test.ts` (the two
classifiers' truth tables — ~8 assertions: eventId-target P2002 →
duplicate, intent-target → duplicate, number-target → transient,
STOCK_SHORT → permanent, plain Error → transient, non-P2002 codes →
transient, the string-form target, `isIntentAnchorP2002` × 3).

## 4. TDD plan

1. **RED (integration)** — `tests/stripe-webhook.integration.test.ts`
   written first: the H4d test (7) and the number-race test (11) FAIL on
   the session-22 code (200-instead-of-500 + the committed event row); the
   rest pass on the baseline (regression pins — documented, not fudged).
2. **RED (unit)** — the classifier assertions fail on the missing exports
   (the right reason: the seams don't exist).
3. **GREEN** — implement §3.1 → §3.2 → §3.3 → §3.4 in that order; the
   unit seams first (the route consumes them), then the route restructure,
   then the island button, then the action refinement. Full unit +
   integration suites green.
4. **Mutation efficacy (×3, each reverted):**
   - **M1 (the H4d fix reverted)** — move the StripeEvent insert back
     OUTSIDE the TX → the H4d test FAILS (the retry hits the committed
     dedup row; no order). Only that test fails — the surgical proof.
   - **M2 (the amount gate skipped)** — the webhook's verification call
     removed → the amount-mismatch test FAILS (an order places on a
     mismatched intent).
   - **M3 (the failure policy flattened)** — the classifier returns
     "permanent" for everything → the H4d test FAILS differently (200 +
     recorded event on the transient failure — the session-22 shape) and
     the stock-short test stays green (its shape is permanent) — proving
     the policy is load-bearing, not decorative.
5. **Full gate** — `bun run lint && bun run typecheck && bun run test && bun
   run build && bun run test:e2e` — two consecutive full E2E runs on the
   FINAL code (the L25 stale-server discipline before each).
6. **Live re-verification** — the :3000 production server on the final
   build: the 8-route pixel sweep (byte-identical baselines — the webhook
   and the island button are rendering-neutral in default mode), the 23rd
   mobile-nav verification (agent-browser, both sessions authenticated),
   the standing typeahead/carousel watches, the full-route console census,
   the SEO layer re-verify.
7. **Screenshots 126-130** — the H4d contract panel (the failure-policy
   table), the 23rd mobile-nav verification, the integration-gate run
   (the H4d proof green), the unit gate run, the E2E gate run. VLM-verified.
8. **Docs** — AGENTS.md (the PAY-STRIPE-2 webhook contract — the refined
   200/500 policy replaces "never a 5xx"), CLAUDE.md (the session-23
   contract + counts), README.md (the Stripe row refinement + counts),
   PAD v1.23 (ADR-031 + the revision row), SKILL v1.23.0 (L35: the
   idempotency row commits with the side effects — the H4d lesson
   transplanted; the ADR-031 index entry), `docs/session_44.md`, the
   worklog, this plan's sign-offs after the push.

## 5. Sign-off criteria

- [x] Baseline gate green at audit start (lint 0/0 · tsc clean · 145/145
      unit · build exit 0 · the full E2E baseline re-run green pre-change — 207/207)
- [x] The H4d fix shipped: the StripeEvent row commits IN the placement TX;
      transient failures roll back and answer 500 (Stripe retries — the
      recovery the backstop exists for); permanent failures keep the
      record + 200 refund-trail contract
- [x] The failure-policy seam (`classifyWebhookPlacementError`) unit-pinned;
      the action path's P2002 target classification refined
      (`isIntentAnchorP2002`)
- [x] The integration gate green: the real route handler driven with real
      HMAC-signed events against a scratch DB — 11 tests incl. the H4d
      recovery proof and the duplicate/precedence/mismatch/signature pins
- [x] The island mint-retry affordance shipped (unconfigured resting
      visual untouched — pinned)
- [x] Mutation efficacy ×3 (the H4d revert, the amount gate, the policy
      flatten), each reverted
- [x] RED → GREEN documented for every new test
- [x] Full gate green ×2 consecutive full E2E runs on the FINAL code (207/207
      both); total test count grows 352 → 374 (no test removed or weakened)
- [x] Live re-verification: pixel sweep at baseline (after the documented
      dev-DB residue cleanup); 23rd mobile-nav md5 byte-identical
      (05de11678965f30a85f9196c2ec43bae — eleven consecutive rounds);
      typeahead/carousel watches; console census; SEO layer
- [x] Screenshots 126-130 under `docs/screenshots/` + VLM-verified 5/5
- [x] Docs updated (AGENTS/CLAUDE/README/PAD v1.23/SKILL v1.23.0/
      session_44/worklog); `.env.example` verified current
- [ ] Committed on `main` + pushed via the SSH wrapper (remote verified,
      the operator key shredded)
