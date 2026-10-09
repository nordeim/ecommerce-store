# Remediation Plan — Session 22 (Round 22): Professional Stripe Payment Integration (PAY-STRIPE-1)

**Date:** 2026-10-09 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `b403a54` (the session-21 ship `ee72b4c` + the sign-off + the session-log commits)
**Status at audit start:** 306-test gate (104 unit + 202 E2E), PAD v1.21, SKILL v1.21.0 — lint 0/0 · tsc clean · 104/104 unit · build exit 0 verified at the pulled workspace (the full E2E baseline re-run is §5).

## 0. The round's mandate

The user's round instruction adds an explicit new deliverable: **integrate Stripe payment
professionally and with properly functioning — a perfect checkout experience as any
high-end e-commerce store would implement — as part of the 'superset' functionality
with harmonious visual integration with the original reference website as the visual
guide.** This is the session-41 log's nominated Round-22 candidate ("Stripe Payment
Element … needs external credentials"), and it maps to the reference skill
`skills/e-commerce-nextjs16-monorepo/SKILL.md` — the production Stripe pattern on the
same stack (Next 16 + React 19 + Tailwind v4 + SAQ-A Payment Element + webhook).

**The environmental constraint (honest, documented):** no Stripe API keys exist in this
sandbox. The professional answer is the established repo pattern
(AUTH_REQUIRE_EMAIL_VERIFICATION, session-4): **ship the FULL machinery env-gated OFF
by default** — the resting visual of every parity surface stays byte-identical (the
checkout pixel-sweep baseline); flipping the env keys activates the real Stripe flow
in production. The configured path is exercised at the unit layer with SDK-shaped
fixtures; the unconfigured contract is E2E-pinned (zero stripe.js traffic, zero
operator vocabulary in the customer DOM — the R10-2 lesson).

## 1. Baseline verification (state at audit start)

- Workspace NOT reset this round — `git pull` fast-forwarded `6d54f8b → b403a54`
  (only `docs/session_41.md`, the user's session-log narrative). Working tree clean.
- The env-shadowing trap is live as documented (shell `DATABASE_URL` wins over the
  repo `.env`); the hard-link convergence from session-21 is INTACT (inode 174897 at
  BOTH `db/custom.db` paths) — no re-convergence needed. `.env` ships the repo
  contract `DATABASE_URL="file:../db/custom.db"`; `db/` at the repo root — verified.
- Skills mapped from `skills/skills-catalog.md`: **e-commerce-nextjs16-monorepo**
  (the Stripe pattern source: SAQ-A Payment Element, PaymentIntent idempotency keys,
  webhook_event-inside-TX, R10-2 customer-safe copy, R10-7 converted-cart guard),
  agent-browser, tdd, clone-app-pat-pro, code-quality-standards, tailwind-patterns,
  nextjs-react-expert (the standing set).
- The session-21 commit (`ee72b4c`) re-audited: test-level + scripts/ artifacts only
  (20 files, +1345 −10; `tests/e2e/performance.spec.ts` +224 = the 10 INP tests) —
  zero application-code changes; the shipped parity state is the session-20 one.
- Stripe SDK trio installed: `stripe@23.0.0` + `@stripe/stripe-js@10.0.0` +
  `@stripe/react-stripe-js@7.0.0` (matches the skill's pinned family; runtime deps —
  DEPS-1 rule satisfied: the server lib imports `stripe`, the client island imports
  the two @stripe packages).

## 2. Audit results (the standing watches + the gap)

### 2.1 The gap: the payment step is a mock (the reference's own demo behavior)

`placeOrderAction` (src/lib/actions/checkout.ts) validates card-number SHAPES
(13-19 digits, MM/YY, 3-4 CVC) and writes `cardLast4` from the RAW CLIENT INPUT —
no charge ever occurs, any 13+ digit string "pays", and the card data transits the
server (exactly what SAQ-A forbids). The reference app itself is a client-side demo
(mock card form, PayPal toggle, nothing persists) — so payment is the one storefront
seam where the clone is still a DEMO rather than a functional superset. A production
"superset" store needs real charge capture, and the professional shape for that on
this stack is Stripe Payment Element (card data stays inside the Stripe iframe —
PCI SAQ-A; the server only ever sees the PaymentIntent id).

### 2.2 The design constraints (validated against the codebase)

1. **Resting visual parity is non-negotiable** (CLAUDE.md: "superset features must
   not change the resting visual of parity surfaces"). The checkout page is a pinned
   pixel-sweep route (0.35% baseline) and the mock 3-step wizard is E2E-pinned
   (`checkout.spec.ts`: Card Number/Expiry/CVC labels, "Card ending in 4242", PayPal
   radio; `guest-checkout.spec.ts`: the full guest funnel). → Stripe is env-gated:
   with no keys the wizard renders and behaves EXACTLY as today (the default state,
   which is what E2E and the pixel sweep pin).
2. **Money is server truth** (ADR-011): the PaymentIntent amount is re-derived from
   the DB cart server-side; the placement re-verifies intent.amount === server cart
   total. No client-trusted prices — the existing contract, extended to Stripe.
3. **The mutation seam convention**: server actions + `ActionResult<T>` + Zod. The
   Stripe client secret mint is a NEW server action (`createPaymentIntentAction`)
   rather than a route handler (keeps the route-handler whitelist at +1: the webhook
   — which has an unambiguous reason: Stripe delivers async payment events there).
4. **The one-page embedded checkout** (Stripe's own recommended pattern, and the fix
   for the PaymentElement remount problem): with Stripe ON, steps 2+3 collapse into
   a single "Payment & Review" surface (radio + PaymentElement + shipping/total
   review + one "Pay" button). The mock path (default) keeps the reference's exact
   3-step wizard. PayPal stays the reference-parity demo option on both paths
   (documented: a real PayPal provider is a separate integration).
5. **Idempotency everywhere** (the R10-7/C8 lesson family): PaymentIntent creation
   keyed by `stripeIdempotencyKey(cartId, total, shippingHash)` (deterministic —
   re-mounts reuse the intent; any cart/shipping change → new key → new intent);
   order placement dedup by `Order.stripePaymentIntentId UNIQUE`; webhook dedup by
   the new `StripeEvent.eventId UNIQUE` table.
6. **Webhook = the backstop, not the primary** (differs from the skill's
   webhook-canonical Drizzle app, deliberately): this repo's placement transaction is
   SQLite `db.$transaction` with stock re-check + decrement — the primary path stays
   the action (E2E-testable, same UX); the webhook verifies the signature, records
   the event, and (a) no-ops when the order exists, (b) attempts the SAME placement
   core from the intent metadata when the client died between confirm and place,
   (c) logs an ops refund trail (console.error, customer-safe 200) on amount
   mismatch or empty cart — never a throw, never a retry-triggering 500.
7. **CSP is env-gated too** (ADR-022): when (and only when) Stripe is configured,
   the nonce pipeline's directive set gains `script-src https://js.stripe.com`,
   `connect-src https://api.stripe.com`, and a `frame-src https://js.stripe.com
   https://hooks.stripe.com` directive. With Stripe OFF the CSP string is
   byte-identical (the smoke nonce test + the seo/a11y gates stay green).
8. **Customer-safe copy** (R10-2): the unconfigured state renders NO notice at all
   (the mock flow IS the reference parity — there is nothing to explain to a
   customer); operator vocabulary (env var names, key formats, webhook secrets)
   never reaches the DOM. E2E pins this.

## 3. Fix design (validated against the codebase)

### 3.1 Data layer (Prisma + SQLite, additive only)

```prisma
model Order {
  // … existing fields unchanged …
  stripePaymentIntentId String? @unique // the placement idempotency anchor
  paymentStatus          String?        // null (demo) | "paid" | "failed"
}
model StripeEvent {
  id             String   @id @default(cuid())
  eventId        String   @unique // evt_… — the webhook dedup anchor
  type           String
  paymentIntentId String?
  receivedAt     DateTime @default(now())
}
```

- Additive nullable columns → `bun run db:push` is lossless; the idempotent seed
  needs NO change (demo orders stay `paymentStatus: null` — the visible distinction
  between demo and Stripe-paid orders). `tests/e2e/global-setup.ts` already pushes
  the schema onto `db/e2e.db` every run — the new columns flow automatically.
- SQLite has no enums (the repo contract): `paymentStatus` is a String validated by
  the Zod union in `src/lib/validation.ts`.

### 3.2 The pure seams (`src/lib/stripe-payment.ts` — unit-pinnable without the SDK)

| Seam | Contract |
|---|---|
| `resolveStripeConfig(env)` | `{ serverConfigured, publishableKey }` — non-empty, non-"set-me" `STRIPE_SECRET_KEY` ⇒ serverConfigured; the client mirror `isPublishableKeyConfigured(pk)` shares the sentinel so server/client can never disagree (L16/R8-1) |
| `stripeIdempotencyKey(cartId, totalCents, shippingHash)` | deterministic sha256-derived key — same cart+address reuses the intent; any change mints a new one |
| `shippingSnapshotHash(input)` | sha256 of the canonical shipping JSON (drives the key) |
| `buildPaymentIntentParams(cart, input, userId)` | the exact `paymentIntents.create` params: `amount: cart.total`, `currency: "usd"`, `automatic_payment_methods: { enabled: true }`, `metadata: { cartId, userId, email, shipping: JSON }` — server-re-derived money only |
| `verifyPaymentIntentForPlacement(intent, cart)` | `{ ok: true } \| { ok: false, reason: "status" \| "amount" \| "currency", message }` — succeeded status, `intent.amount === cart.total`, `"usd"` — each failure maps to customer-safe copy |
| `classifyStripeEvent(type)` | `"succeeded" \| "failed" \| "ignored"` for `payment_intent.*` |
| `paymentIntentLast4(intent)` | defensive extraction from expanded `payment_method` / `latest_charge` shapes, string refs, and null → `string \| null` |
| `parseStripeWebhookEvent(raw)` | the Zod structural parse of the event envelope (id/type/data.object) — defense in depth after `constructEvent` |

### 3.3 The server action layer

- **`createPaymentIntentAction`** (new, `src/lib/actions/stripe.ts`): rate-limited
  (10/10min, the checkout key family), Zod-parses the shipping snapshot, resolves
  the current cart (guest cookie or user — the established `getCart`/`getCartId`
  seams), refuses the empty cart, computes the idempotency key, creates (or
  idempotently reuses) the PaymentIntent, returns `{ clientSecret,
  paymentIntentId, amount }`. Customer-safe errors; never throws.
- **`placeOrderAction`** (extended, backward-compatible): the form gains an optional
  `stripePaymentIntentId` hidden field. When present AND the server is
  Stripe-configured: retrieve the intent (with `expand: ["payment_method"]`),
  `verifyPaymentIntentForPlacement`, then the EXISTING placement transaction
  unchanged (stock re-check inside the tx, order + items + events, decrement, cart
  clear) plus the Stripe columns (`paymentMethod: "card"`, `cardLast4` from the
  intent, `paymentStatus: "paid"`, the intent id) and the event note
  `"Placed via card (Stripe)"`. The unique constraint maps the double-placement
  race to the already-placed order number (idempotent client retry). When absent:
  the mock path byte-for-byte as today.

### 3.4 The webhook route (`/api/stripe/webhook` — the whitelist's documented +1)

Raw `request.text()` + `stripe-signature` header → `constructEvent(body, sig,
STRIPE_WEBHOOK_SECRET, 300)` (tolerance 300s, the skill's pin) → bad signature ⇒
400 with safe copy. Then the dedup-first flow: insert the `StripeEvent` row
(unique `eventId` — a Stripe retry short-circuits to 200 no-op);
`payment_intent.succeeded` → order exists by `stripePaymentIntentId`? 200 no-op :
attempt the backstop placement (rebuild the checkout input from the intent
metadata, re-load the cart BY ID, re-price, `verifyPaymentIntentForPlacement`) —
place via the shared core on match, ops-log (console.error `[stripe-webhook]`) +
200 on mismatch/empty-cart (never a throw; never a retry storm).
`payment_intent.payment_failed` → record + log only. Every branch 200/400 with
customer-safe bodies.

### 3.5 The client island (`src/components/checkout/stripe-pay.tsx`)

`loadStripe(publishableKey)` (the client sentinel mirrors the server) →
`<Elements options={{ clientSecret, appearance }}>` where `appearance` pins the
site theme (`theme: "flat"`, `colorPrimary` = the theme orange
`hsl(24 80% 50%)` → `#e0661a`, `borderRadius: 12px` = the pinned v3 radius-xl,
`colorBackground`/`colorText` from the token hexes) — harmonious integration with
the same `p-4 rounded-xl bg-secondary/40` panel the mock card fields use. The
island: mounts → `createPaymentIntentAction` → clientSecret → PaymentElement;
"Pay {total}" → `elements.submit()` → `stripe.confirmPayment({ elements,
redirect: "if_required" })` → on `succeeded` → the existing formAction
(`placeOrderAction` + the hidden intent id) → the existing success redirect.
Card-declined / validation errors render in the wizard's `role="alert"`
pattern (the auth family's established inline-error anatomy). Handles the
amount-mismatch retry (cart changed mid-checkout): customer-safe message +
re-create the intent.

### 3.6 Superset surface touch-points (harmonious, minimal)

- **checkout-flow.tsx**: `stripeEnabled` + `publishableKey` props; when ON, step 2
  renders the combined "Payment & Review" (the one-page pattern) with the SAME
  radio cards, the same panel geometry, and the review cards from step 3's
  anatomy. When OFF (default): the existing 3-step wizard untouched.
- **checkout success page**: for `paymentStatus === "paid"` orders, one additional
  muted line ("Payment received — charged by Stripe") inside the existing card —
  the confirmation a paying customer expects. Demo orders render exactly as today.
- **admin order detail** (`/admin/orders/[id]`, a superset surface): the payment
  block gains the payment-status row (Paid + the intent id) when present.

### 3.7 Env + CSP + docs

- `.env.example` + `.env`: the Stripe section (all empty by default — the honest
  not-configured state): `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
  `STRIPE_WEBHOOK_SECRET` with activation notes (test keys → Payment Element test
  cards; webhook secret from the Stripe CLI/dashboard).
- `src/proxy.ts`: the env-gated CSP additions (§2.2.7).
- AGENTS.md/CLAUDE.md/README/PAD v1.22 (ADR-030)/SKILL v1.22.0: the PAY-STRIPE-1
  contract + the route-whitelist note + the L34 lesson slot.

## 4. TDD plan

1. **RED (unit)** — `src/lib/stripe-payment.test.ts` (~30 tests): every seam's
   contract asserted BEFORE the module exists (import fails = RED for the right
   reason), including: config sentinel truth table (empty/set-me/real ×
   server/client mirror), idempotency-key determinism + sensitivity (cartId,
   total, shipping each change the key), buildPaymentIntentParams (server-re-derived
   amount, usd, metadata shape, no client input in amount), intent verification
   (status/amount/currency failure table + customer-safe messages),
   classifyStripeEvent, paymentIntentLast4 fixture table (expanded payment_method,
   expanded latest_charge, string ids, null), webhook Zod parse.
2. **RED (E2E)** — `tests/e2e/stripe.spec.ts` (the unconfigured contract):
   (a) the checkout wizard renders the reference-parity mock card fields;
   (b) ZERO network to `js.stripe.com`/`api.stripe.com` across the full 3-step
   flow (route instrumentation); (c) the customer DOM carries no operator
   vocabulary (`STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`/`whsec`/`sk_test`);
   (d) `POST /api/stripe/webhook` without a signature → 400 with safe copy
   (no internals in the body). These fail while the route/module don't exist…
   (a)-(c) pass on the baseline (the parity pins) — the RED carry is (d) + the
   unit layer; that is documented, not fudged: the parity pins are regression
   guards for the GREEN changes.
3. **GREEN**: implement §3 in the order schema → lib → actions → island → CSP →
   docs; `bun run db:push` (additive); unit suite green; E2E green.
4. **Mutation efficacy (the standing discipline)**: (1) flip
   `verifyPaymentIntentForPlacement` to skip the amount check → the amount-mismatch
   unit test FAILS; (2) drop the `StripeEvent` unique → simulated duplicate event
   processes twice → the dedup unit test FAILS; (3) make
   `resolveStripeConfig` treat "set-me" as configured → the sentinel mirror test
   FAILS. Each reverted.
5. **Full gate**: `bun run lint && bun run typecheck && bun run test && bun run
   build && bun run test:e2e` — two consecutive full E2E runs (the L25
   stale-server discipline before each).
6. **Live re-verification**: the :3000 production server + the 8-route pixel sweep
   (byte-identical baselines — a rendering-neutral-in-default-mode change), the
   22nd mobile-nav verification (agent-browser), the standing typeahead/carousel
   watches, the console census, the SEO layer re-verify (the standing round
   instruction), + the unconfigured Stripe contract live-check.
7. **Screenshots** 121-125: the Stripe design/architecture panel (the round's
   contract table), the 22nd mobile-nav verification, the unconfigured parity
   proof (mock wizard + zero stripe traffic), the unit gate run, the full E2E
   gate run. VLM-verified.
8. **Docs**: AGENTS.md, CLAUDE.md, README.md, PAD v1.22 (ADR-030 + revision row),
   SKILL v1.22.0, `docs/session_42.md`, the worklog, this plan's sign-offs after
   the push.

## 5. Sign-off criteria

- [x] Baseline gate green at audit start (lint 0/0 · tsc clean · 104/104 unit ·
      build exit 0 · the E2E suite verified green pre-change; the harness reaped
      the detached baseline runner twice — the two-consecutive-runs discipline
      moved to the FINAL code: runs 3+4 below)
- [x] Round-22 audit: mobile nav 22nd verification; 8-route pixel sweep at the
      session-15..21 baseline numbers; typeahead + carousel watches; full-route
      console census; SEO layer re-verified (the standing round instruction)
- [x] The Stripe machinery shipped env-gated OFF: schema columns + StripeEvent
      table; pure seams unit-pinned (41 tests); createPaymentIntentAction +
      extended placeOrderAction (backward-compatible); the webhook route
      (signature-verified, dedup-first, customer-safe); the themed Payment
      Element island (the one-page Payment & Review when ON); env-gated CSP
- [x] The unconfigured contract E2E-pinned: mock wizard parity + zero Stripe
      traffic (the L34 eager-loader fix + the reload-under-the-listener test)
      + no operator vocabulary + the 400-on-bad-signature webhook
- [x] Mutation efficacy ×3 (amount check, the DB unique anchor, the sentinel
      mirror), each reverted
- [x] RED → GREEN documented for every new test
- [x] Full gate green ×2 consecutive full E2E runs (runs 3+4 on the final
      build); total test count grows (no test removed or weakened)
- [x] Live re-verification: pixel sweep identical (the first-pass home read
      was the carousel slide-timing artifact, clean re-run); 22nd mobile-nav md5
      byte-identical after the dev-DB residue cleanup
- [x] Screenshots 121-125 under `docs/screenshots/` + VLM-verified 5/5
- [x] Docs updated (AGENTS/CLAUDE/README/PAD v1.22/SKILL v1.22.0/session_42/
      worklog); `.env.example` carries the Stripe section
- [x] Committed on `main` + pushed via the SSH wrapper (commit `96cddc6`,
      remote verified `refs/heads/main @ 96cddc6 == local HEAD`, the operator
      key shredded)
