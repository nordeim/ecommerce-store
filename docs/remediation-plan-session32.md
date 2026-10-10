# Remediation Plan — Session 32 (Round 32): The Refund Action Seam (REFUND-ACTION-1, ADR-040)

**Date:** 2026-10-10 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `ae4b4f3` (the session-31 ship `6a45592` + the user's session-62 narrative log)
**Status at audit start:** 486-test gate (250 unit+integration + 236 E2E), PAD v1.31, SKILL v1.31.0 — lint 0/0 · tsc clean · 250/250 unit+integration (16 files) · build exit 0 (25 routes) · the full E2E baseline re-run **236/236 (7.8m, foreground)** verified on the pulled workspace.

## 0. The round's mandate

The user's standing round instruction (the professional Stripe integration
verification, the full audit/parity workflow with the mobile-nav +
Tailwind v4 watches, the `.env`/db-root contract, the vitest + playwright
suites, the TDD remediation plan, the screenshots, the `.env.example`,
the docs, and the main-only push). No Stripe test-mode keys or email
credentials were provided (the two standing credential-gated candidates
stay gated), so the round's deliverable is audit-derived — the pattern
of rounds 27–31.

**Workspace state this round:** NOT reset — the workspace survived
(the repo, node_modules, both DBs, and the session-21 hard-link
convergence at inode 264240 all intact). `git pull` fast-forwarded
`6a45592 → ae4b4f3` (the user's `docs/session_62.md` narrative log
only — zero code delta between the audit baseline and the session-31
ship).

## 1. Baseline verification (state at audit start)

- **`git pull` → `ae4b4f3`** — one file changed (`docs/session_62.md`,
  +105). The working tree clean; the repo `skills/` folder exclusion
  re-verified in all four configs: `tsconfig.json` `exclude:
  ["node_modules", "skills"]`, `eslint.config.mjs` ignores `"skills"`,
  `vitest.config.ts` includes only `src/**/*.test.ts` +
  `tests/**/*.test.ts`, `playwright.config.ts` `testDir: "./tests/e2e"`.
  (The cloned `scandihaven` repo lives OUTSIDE the ecommerce-store repo
  at `/home/z/my-project/scandihaven` — never type-checked, linted,
  tested or committed.)
- Environment contracts verified: `bun` 1.3.14 · `.env` carries
  `DATABASE_URL="file:../db/custom.db"` · `db/custom.db` at the repo
  root hard-linked with `/home/z/my-project/db/custom.db` (inode 264240
  — the env-shadowing trap neutralized; the shell still injects
  `file:/home/z/my-project/db/custom.db`) · `bun run db:setup`
  idempotent re-seed (6 categories, 12 products, 4 users, 3 orders,
  3 hero slides).
- Baseline gate: lint 0/0 · tsc clean · **250/250 unit+integration (16
  files)** · build exit 0 (25 routes, standalone present) · **the full
  E2E baseline re-run 236/236 (7.8m, foreground — the L26/L27 lesson)** —
  the documented session-31 ship state verified pre-change.
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd**
  (red-green-refactor; the failing regression test first), **agent-browser**
  (the live reference walk — this round via the established
  Playwright-form battery scripts, the sessions 12–31 protocol),
  **clone-app-pat-pro** (the parity methodology), **e-commerce-nextjs16-monorepo**
  (the Scandi master skill — its refund/charge.refunded handling
  patterns reviewed for this round's design), plus the repo's own
  `ecommerce-store_SKILL.md` §4.2 (the Tailwind v4 trap log).
- **The Round-32 live battery (the audit):** the paired pixel sweep
  **ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, both sides painted
  on the same slide `1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%,
  wishlist 0%, checkout 0.01%, account 0%, login 0.28%). **The 32nd
  mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks — panel
  288px / bg rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at
  18px/500 with identical hrefs; the Electronics deep-link + auto-close
  passed). The standing watches clean (typeahead: the reference fires
  ZERO search requests; carousel ~5000ms; the SEO layer: 17-URL sitemap,
  robots, JSON-LD, offers.price 299.99 USD). The console census 24
  routes + 11 admin surfaces CLEAN.
- **The Stripe integration audit (the round's focus area):** the full
  machinery re-read file-by-file — `stripe-config.ts`, `stripe.ts`,
  `stripe-payment.ts` (the pure seams), `actions/stripe.ts` (the mint),
  `actions/checkout.ts` (verify-then-place), `api/stripe/webhook/route.ts`
  (the H4d backstop), `stripe-pay.tsx` + `checkout-flow.tsx` (the
  islands), `admin-payments.ts` (the read seams), and the three admin
  surfaces. Verified healthy and consistent with ADR-030..039 — with
  ONE structural gap, below.

## 2. Audit results

### 2.1 The candidate triage (session-61's "suggested next" list)

Session 61 named three audit-derived candidates. The triage:

1. **The refund action seam (CHOSEN — §2.2):** the payments family
   arc (ADR-030..038) built the write path, the read surface, the
   filters, the dashboard alert, the order trail, and the failure
   reasons — but every refund instruction in the system says "refund
   via the Stripe dashboard" (the webhook's four permanent-classification
   ops trails, the payments surface's "No order — refund via Stripe
   dashboard" line). The action loop is open: an operator reading the
   console cannot ACT on a refund; and a dashboard-initiated refund is
   never reflected on the ORDER (the trail shows the StripeEvent row,
   but `paymentStatus` stays `"paid"` forever and the fulfillment
   timeline carries no refund entry — the order's money state goes
   silently stale).
2. **The guest-order merge-back view (DEFERRED — the PII analysis):**
   linking guest-placed orders (userId null, email X) into the account
   at register/login follows the cart/wishlist merge precedent, but
   orders carry PII (purchased items, totals) and the account email is
   NOT verified in the default posture (`AUTH_REQUIRE_EMAIL_VERIFICATION`
   env-gated OFF — ADR-011's honest lockout-avoidance design). A
   merge at REGISTRATION would expose a victim's guest purchase
   history to whoever claims the email first — the GUEST-TOKEN-1
   lesson (ADR-039: identifiers are not capability tokens) applied in
   reverse: the account's email is an IDENTIFIER, not proof the
   registrant controls the mailbox. A login-only merge narrows but
   does not close it (the attacker-claimed-account case). The safe
   design gates the merge behind active email verification — inert in
   the current deployment and untestable end-to-end without an email
   provider. Deferred until that credential arrives (the same gate as
   the verification/reset seams).
3. **The in-memory rate limiter's shared-store migration (DEFERRED —
   the PAD's open Medium, unchanged):** the limiter's Map is
   process-local — correct for the single-instance SQLite deployment
   this repo is (the PAD's own framing); the migration matters only
   for horizontal scaling SQLite does not support. Re-evaluated and
   re-deferred (no new information).

### 2.2 THE PRIMARY FINDING — the refund loop is read-only; a refunded order's money state never updates (REFUND-ACTION-1)

Two halves of one gap, both verified against the code this round:

**Half 1 — no action seam.** The admin console's only order mutation
is the fulfillment-status Select (`updateOrderStatusAction` —
processing/in_transit/delivered/cancelled). Money operations: none.
A high-end store's operator refunds from the order view (the Shopify
pattern); LUXE's operator must leave the console, find the payment in
the Stripe dashboard by intent id (the order detail helpfully renders
it), and refund there — then has no way to record the outcome. The
payments family's own observability vocabulary ("refund-needed",
"Refunded") has no producing action inside the app.

**Half 2 — no reflection.** The webhook classifies `charge.refunded`
as `ignored` (`classifyStripeEvent`): the delivery is recorded and
200'd, nothing else. When the operator refunds via the Stripe
dashboard (the documented workflow — four ops-trail copy sites say
so), Stripe delivers `charge.refunded` for the order's intent, the
payments surface + the order's payment-events trail render "Refunded
$X" — but the ORDER row itself keeps `paymentStatus: "paid"` and the
fulfillment Timeline carries no refund entry. The Customer card keeps
rendering the green "Paid (Stripe)" badge on an order whose charge was
fully refunded weeks ago. The money state is stale forever.

**The fix (both halves):**

- **The action seam:** `refundOrderAction` — an admin-gated server
  action on the order detail. Eligibility derives from DB state via a
  pure seam (a `stripePaymentIntentId` + `paymentStatus === "paid"`);
  demo mode (Stripe unconfigured — the current state) refuses with the
  honest operator copy; configured mode creates the refund via the SDK
  with an intent-scoped idempotency key. The webhook remains the
  single writer of refund state on the order (the action never writes
  `paymentStatus` — no optimistic local truth).
- **The reflection:** the webhook's `charge.refunded` branch — after
  recording the delivery, if a placed order holds the event's intent,
  a full refund (`charge.refunded === true`, Stripe's own "fully
  refunded" boolean) transitions `paymentStatus` to `"refunded"` and
  writes a first-class `payment_refunded` OrderEvent; a partial refund
  writes the timeline event only (the order is still owed capture
  state — honest). Re-deliveries no-op via the eventId fast-path (the
  succeeded branch's own dedup shape).

Both halves land on superset surfaces (the admin order detail + the
webhook's ignored-classification branch) — zero parity risk, the
ADR-030..038 family's standing discipline.

### 2.3 Verified-healthy (no action)

- The mobile navigation: TOKEN-EXACT parity (32nd verification) — the
  Tailwind v4 trap-log discipline holds.
- The storefront, the checkout wizard, the Stripe placement machinery
  end-to-end (the mint, verify-then-place, the H4d webhook, the
  Payment Element island) — all re-read, all consistent with
  ADR-030..039.
- The vitest + playwright configuration layer (the user's standing
  instruction): professional-grade and green — 250 + 236 verified this
  round; no modifications required.
- The `.env` / db-root contract: `DATABASE_URL="file:../db/custom.db"`,
  `db/custom.db` at the repo root, the hard-link convergence intact,
  `tests/db-path.test.ts` green.
- The a11y/CWV/INP/SEO gates, the census pins, the sweep baseline —
  all green in the baseline run.

## 3. Fix design (validated against the codebase)

### 3.1 The pure eligibility seam — `refundEligibility` in `src/lib/admin-payments.ts`

```ts
export type RefundEligibility =
  | { eligible: true }
  | { eligible: false; reason: "no-stripe-payment" | "not-paid" | "already-refunded" };

export function refundEligibility(order: {
  stripePaymentIntentId: string | null;
  paymentStatus: string | null;
}): RefundEligibility;
```

- `stripePaymentIntentId == null` → `no-stripe-payment` (the
  reference-parity demo/mock path — nothing was ever charged; ORD-2026-001).
- `paymentStatus === "refunded"` → `already-refunded` (the post-
  reflection state — the button stops rendering; the action guard
  rejects).
- `paymentStatus !== "paid"` (null demo columns, `"failed"`) →
  `not-paid`.
- intent + `"paid"` → eligible (the seeded ORD-2026-003 shape).

The ORDER-DETAIL RENDER GATE and the ACTION GUARD compose the SAME
seam — the DASH-ALERT-1 precedent (the dashboard stat and the payments
list can never disagree because they share `buildAdminPaymentWhere`;
here the button and the action can never disagree because they share
`refundEligibility`).

### 3.2 The pure reflection seam — `chargeRefundedReflection` in `src/lib/admin-payments.ts`

```ts
export type ChargeRefundedReflection = {
  /** "refunded" ONLY on a full refund of a paid order; null = no order-state change. */
  paymentStatus: "refunded" | null;
  /** The OrderEvent note; null = reflect nothing (non-paid order / shape drift). */
  eventNote: string | null;
};

export function chargeRefundedReflection(
  order: { paymentStatus: string | null },
  charge: { refunded?: boolean; amount?: number; amount_refunded?: number },
): ChargeRefundedReflection;
```

- `order.paymentStatus !== "paid"` → `{ paymentStatus: null, eventNote:
  null }` — a refund event on a failed/demo/already-refunded order
  reflects nothing (re-deliveries and odd shapes land here; the parse
  family's fall-through philosophy).
- `charge.refunded === true` (Stripe's fully-refunded boolean) →
  `{ paymentStatus: "refunded", eventNote: "Refunded $X via Stripe" }`
  where X = `amount_refunded ?? amount ?? 0` (integer cents through
  `formatCents` — the money contract).
- else (partial refund) → `{ paymentStatus: null, eventNote:
  "Partially refunded $X of $Y via Stripe" }` — the order keeps its
  paid state (a partial refund does not zero the capture); the
  timeline carries the honesty.

Money math stays integer-cents end-to-end (`formatCents` at the note
boundary — ADR-011). The seam is pure + SDK-free — unit-pinnable in
the node environment, the established pattern (`refundNeededAlert`,
`paymentFailureReasonView`).

### 3.3 The refund idempotency key + the schema extension — `src/lib/stripe-payment.ts`

```ts
/**
 * The `refunds.create` idempotency key: ONE full refund per payment
 * intent. A double-click, a retry, or a second operator hours later
 * hits the same key → Stripe replays the FIRST refund's response —
 * never a second refund of the same charge.
 */
export function stripeRefundIdempotencyKey(paymentIntentId: string): string {
  return `refund:${paymentIntentId}`;
}
```

(The `stripeIdempotencyKey` sha256 pattern exists because its inputs
are user-shaped and unbounded; the refund key's input is a Stripe id —
already bounded, url-safe, and self-describing in the Stripe dashboard's
idempotency log. A readable key is the better operator artifact.)

The webhook's zod schema (`stripeWebhookEventSchema.data.object`)
gains two ADDITIVE optional fields — `refunded: z.boolean().optional()`
+ `amount_refunded: z.number().optional()` — the charge-object fields
the reflection reads. Every existing parse outcome is unchanged
(optional fields; the intent-family events carry neither).

### 3.4 The webhook's `charge.refunded` branch — `src/app/api/stripe/webhook/route.ts`

Before the generic ignored fall-through (the current home of
`charge.refunded`), a dedicated branch:

```ts
if (evt.type === "charge.refunded") {
  // Fast duplicate short-circuit (the succeeded branch's own shape):
  // a Stripe re-delivery of the same event id reflects NOTHING twice.
  const alreadyRecorded = await db.stripeEvent.findUnique({ where: { eventId: evt.id } });
  if (alreadyRecorded) return NextResponse.json({ received: true, duplicate: true });

  await recordEvent(evt); // the honest intent column + amount (PAY-OPS-2b/2c)

  const intentId = stripeEventIntentId(evt.data.object);
  const order = await db.order.findUnique({
    where: { stripePaymentIntentId: intentId },
    select: { id: true, paymentStatus: true },
  });
  if (order) {
    const reflection = chargeRefundedReflection(order, evt.data.object);
    if (reflection.paymentStatus || reflection.eventNote) {
      await db.$transaction(async (tx) => {
        if (reflection.paymentStatus) {
          await tx.order.update({ where: { id: order.id }, data: { paymentStatus: reflection.paymentStatus } });
        }
        await tx.orderEvent.create({
          data: { orderId: order.id, type: "payment_refunded", note: reflection.eventNote },
        });
      });
    }
  }
  return NextResponse.json({ received: true });
}
```

Design constraints (validated):
- **The StripeEvent row is the dedup anchor** — the same H4d discipline
  as the succeeded branch (the row records the delivery; the
  reflection is the side effect; a re-delivery short-circuits on the
  row's existence BEFORE any reflection write).
- **The concurrent double-delivery race** (two deliveries of the same
  event passing the fast-path simultaneously) degrades to a cosmetic
  duplicate timeline entry — the same accepted posture as the
  succeeded branch's pre-P2002 window (Stripe retries are spaced by
  minutes; the window is milliseconds).
- **A charge.refunded with NO linked order** (the seeded
  `evt_demo_fixture_r` / `pi_demo_fixture_005` story) records + 200s —
  exactly today's behavior (the reflection finds no order and no-ops).
- **The 200-no-matter-what posture** for this event class: a
  reflection failure (DB blip) answers 500 so Stripe retries — the
  transient policy; the eventId dedup makes the retry safe.

### 3.5 The action — `refundOrderAction` in `src/lib/actions/admin.ts`

```ts
export async function refundOrderAction(orderId: string): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return { ok: false, error: { message: "Forbidden" } };   // defense in depth

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: { message: "Order not found" } };

  const eligibility = refundEligibility(order);   // the SAME seam the view renders
  if (!eligibility.eligible) return { ok: false, error: { message: "This order cannot be refunded." } };

  const stripe = getStripe();
  if (!stripe || !isStripeServerConfigured()) {
    // Demo mode — the honest operator copy (the console may carry
    // operator vocabulary; the R10-2 customer-safe rule is a
    // storefront contract).
    return { ok: false, error: { message: "Stripe is not configured — refund via the Stripe dashboard." } };
  }

  try {
    await stripe.refunds.create(
      { payment_intent: order.stripePaymentIntentId! } as Parameters<typeof stripe.refunds.create>[0],
      { idempotencyKey: stripeRefundIdempotencyKey(order.stripePaymentIntentId!) },
    );
  } catch (e) {
    console.error("[refundOrderAction]", order.number, e);
    return { ok: false, error: { message: "Refund failed — check the Stripe dashboard." } };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  // The webhook's charge.refunded delivery is the single writer of the
  // order's refund state — this action never writes paymentStatus.
  return { ok: true, data: null };
}
```

- The eligibility guard re-derives from DB state INSIDE the action —
  the render gate is not trusted (the DASH-ALERT-1 shared-seam rule).
- The demo-mode refusal is the E2E-visible contract (the current
  environment's honest behavior).
- The SDK path mirrors `createPaymentIntentAction`'s credential-gated
  posture: code-reviewed, pure parts unit-pinned, the network call
  untestable without keys (the standing gate).
- No rate limit — the `updateOrderStatusAction` precedent (admin-gated,
  console-only, low-volume).

### 3.6 The order-detail surface — `src/app/(storefront)/admin/orders/[id]/page.tsx` + a NEW island

1. **The Charge row's refunded branch** (the Customer card):

```tsx
{order.paymentStatus === "refunded" ? (
  <span className="text-muted-foreground">Refunded (Stripe)</span>
) : order.paymentStatus === "paid" ? ( … existing emerald … )
```

   `text-muted-foreground` — the calm terminal money state, the
   console's established vocabulary, and contrast-safe by construction
   (the census page ORD-2026-001 carries `paymentStatus: null` — the
   Charge row never renders there; the a11y order-detail census pin
   stays 7).

2. **The Timeline mapping** — the `payment_refunded` OrderEvent type
   renders "Payment refunded" with the `RotateCcw` icon (the PDP's
   returns icon — the money-returned glyph), the note under it, between
   the `placed` and default branches.

3. **The Refund control** — a NEW client island
   `src/components/account/refund-order-button.tsx` (the admin islands'
   home — `admin-order-row.tsx`'s siblings), rendered inside the
   Customer card when `refundEligibility(order).eligible`:

   - **The two-step inline confirm** (the GitHub destructive-action
     pattern — no dialog dependency, CSP-safe, deterministic in E2E):
     resting state renders an outline "Refund payment" button
     (`border-destructive/30` + the `RotateCcw` icon — the
     DASH-ALERT-1 icon-only destructive accent: NO destructive TEXT,
     the ~3.9:1 lesson); clicking swaps the row to "Confirm refund" +
     "Cancel"; confirming calls the action.
   - **The feedback anatomy** mirrors `admin-order-row.tsx` exactly:
     `pending` disables the buttons; `!res.ok` renders the message in
     `text-xs text-destructive mt-1` (the row-island precedent —
     post-interaction only, never in a census load); `res.ok` renders
     "Refund initiated — the order updates when Stripe confirms." and
     `router.refresh()`.
   - The island receives `{ orderId, orderNumber }` as props (the
     page's RSC data — no client fetching).

   The button renders ONLY on eligible orders (Stripe-paid + not
   refunded): ORD-2026-003 yes; ORD-2026-001 (the census + a11y page)
   no — **the a11y order-detail census pin stays 7 and the best-practice
   census stays empty, unchanged by construction.**

### 3.7 The tests (TDD — RED first)

**Unit (extend `src/lib/admin-payments.test.ts` + `src/lib/stripe-payment.test.ts`, ~10 tests):**
`refundEligibility` ×5 (eligible intent+paid; no-intent; null-status
demo; failed; already-refunded) · `chargeRefundedReflection` ×5 (full
refund of paid → refunded+note; partial → note only, status null;
non-paid order → null/null; amount fallback chain
amount_refunded→amount→0; a full refund note formats cents) ·
`stripeRefundIdempotencyKey` ×2 (deterministic + intent-scoped:
different intents → different keys) + the schema parse ×2
(`charge.refunded` with refunded/amount_refunded parses; an
intent-family event without them parses unchanged).

**Integration (extend `tests/stripe-webhook.integration.test.ts`, +3 tests):**
the full-refund reflection (a fixture order holding the intent +
paymentStatus "paid" → POST the signed `charge.refunded` → 200 → the
order's paymentStatus === "refunded" + the `payment_refunded`
OrderEvent with the formatted note + the StripeEvent row recorded);
the re-delivery idempotency (the same event id POSTed again → 200
duplicate → NO second OrderEvent, the state unchanged); the no-order
fall-through (a charge.refunded for an unknown intent → 200, the row
recorded, no order mutated — the evt_demo_fixture_r story) + the
partial-refund reflection (refunded:false + amount_refunded → the
OrderEvent note only, paymentStatus stays "paid").

**E2E (extend `tests/e2e/admin.spec.ts`, +2 tests):**
(1) the refund control on the eligible fixture — navigate to
ORD-2026-003's detail, assert the "Refund payment" button renders
inside the Customer card, click it, assert the two-step confirm
("Confirm refund" + "Cancel" appear), confirm, assert the demo-mode
refusal copy ("Stripe is not configured — refund via the Stripe
dashboard.") renders; (2) the calm state on the demo path — ORD-2026-001's
detail renders NO refund control (the no-stripe-payment
ineligibility).

**Census confirmation:** the a11y admin gate's order-detail census
page (ORD-2026-001) gains no button, no new text pair, no new icon —
the pin stays 7; the best-practice census stays empty. The full E2E
run re-verifies.

### 3.8 Mutation efficacy plan ×3

1. **The eligibility mutation:** invert `refundEligibility`'s paid
   check (`!== "paid"` → `=== "paid"`) → the eligibility unit tests
   fail (the wrong-branch contract).
2. **The reflection mutation:** drop the full-refund `paymentStatus:
   "refunded"` write (return `{ paymentStatus: null, ... }` always) →
   the full-refund integration test fails (the order stays "paid").
3. **The action-gate mutation:** remove the eligibility guard from
   `refundOrderAction` → the E2E… no — the demo-refusal E2E still
   passes (ORD-2026-003 is eligible either way). The RIGHT mutation:
   remove the demo-mode refusal branch → the E2E refusal-copy test
   fails (the copy never renders). Each mutation caught by the RIGHT
   layer, then reverted byte-exact (md5-verified).

## 4. Execution checklist (TDD)

1. **RED:** write the unit contracts (the seams don't exist yet) + the
   integration scenarios + the two E2E tests; run them — all fail for
   the RIGHT reasons (missing exports/branches/copy), the pre-existing
   tests in the same files stay green.
2. **GREEN:** §3.1 → §3.6 in order (eligibility seam → reflection
   seam → key + schema → webhook branch → action → surface + island).
3. **Targeted runs:** `bunx vitest run src/lib/admin-payments.test.ts
   src/lib/stripe-payment.test.ts tests/stripe-webhook.integration.test.ts`
   → the touched specs; `bunx playwright test tests/e2e/admin.spec.ts`
   → the console spec; `bun run test` → the full unit layer (no
   collateral).
4. **Full gate:** `bun run lint && bun run typecheck && bun run test &&
   bun run build && bun run test:e2e` — then a SECOND consecutive full
   E2E run on the final code (the ship discipline).
5. **Post-change battery:** the paired pixel sweep re-run (all 8
   routes must stay at baseline — the touched surfaces are admin-only
   + the webhook), the 33rd mobile-nav token-exact verification, the
   watches + census.
6. **Screenshots:** the remediated app on the dev server — the
   order detail with the refund control (two-step confirm visible),
   the demo-refusal feedback, the order detail of a refunded-order
   state (the "Refunded (Stripe)" branch — produced on the dev DB via
   a signed charge.refunded probe against the dev server, the
   integration harness's method), the payments surface, and the home
   page — saved as `docs/screenshots/171-*.png` … `175-*.png`.
7. **Docs:** AGENTS.md (the REFUND-ACTION-1 architecture rule), CLAUDE.md
   (the session-32 contract + counts), README.md (the feature row +
   gate counts), PAD v1.32 (ADR-040 + the revision row), SKILL v1.32.0
   (the ADR-040 row), `docs/session_63.md`, the worklog S32 entry, and
   this plan's sign-offs. `.env.example` re-verified (no new env
   plumbing — the refund keys off the existing Stripe configuration).
8. **Push:** single conventional commit to `main` via
   `docs/ssh_git_wrapper_v3.py --remote git@github.com:nordeim/ecommerce-store.git`
   (the wrapper DEFAULTS to task-management — the session-59 lesson),
   then the key shred + remote-verification.

## 5. Sign-offs (checked on completion)

- [x] RED: the unit contracts + integration scenarios + 2 E2E tests fail for the right reasons
- [x] GREEN: §3.1–§3.6 implemented, targeted runs green
- [x] Mutations ×3 caught + byte-exact reverts (md5s recorded)
- [x] Full gate green: lint 0/0 · tsc clean · unit+integration green · build exit 0 · E2E green ×2 consecutive
- [x] Post-change battery: sweep at baseline (all 8 routes) · 33rd mobile-nav token-exact verification · watches + census clean
- [x] Screenshots 171–175 captured + VLM-verified
- [x] Docs updated (AGENTS, CLAUDE, README, PAD v1.32/ADR-040, SKILL v1.32.0, session_63, worklog, plan sign-offs)
- [x] `.env.example` verified current (no new env plumbing)
- [x] Committed to `main` + pushed via the SSH wrapper (remote verified, key shredded)
