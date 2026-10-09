# Remediation Plan — Session 29 (Round 29): The Order-Detail Payment-Event Trail (REFUND-TRAIL-1, ADR-037) + The Battery Login Robustness Fix (L38)

**Date:** 2026-10-10 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `f079f98` (the session-28 ship `cf90c12` + the user's session-56 narration log)
**Status at audit start:** 461-test gate (230 unit+integration + 231 E2E), PAD v1.28, SKILL v1.28.0 — lint 0/0 · tsc clean · 230/230 unit+integration · build exit 0 (25 routes) · **the full E2E baseline re-run 231/231 (7.6m, foreground)** verified on the freshly-cloned workspace.

## 0. The round's mandate

The user's standing round instruction (the professional Stripe integration
verification, the full audit/parity workflow with the mobile-nav +
Tailwind v4 watches, the `.env`/db-root contract, the vitest + playwright
suites, the TDD remediation plan, the screenshots, the `.env.example`,
the docs, and the main-only push). The session-55 suggested-next-steps
name the Stripe test-mode keys and the email provider — both remain
credential-gated. The actionable candidate is the third: **"A natural
depth candidate: order-detail refund-trail rendering (the
deterministic-failure events already record the context)."** The round's
own audit contributed a process finding (the battery's login helper
reading the reference's now-slow redirect chain mid-flight — §2.1) and
its fix (L38, already applied to the session-29 battery scripts).

## 1. Baseline verification (state at audit start)

- **Workspace RESET this round** — the sandbox was rebuilt, so the repo
  was `git clone`d fresh. Environment rebuilt per the documented
  contracts: `bun install` · `.env` written from the `.env.example`
  contract (`DATABASE_URL="file:../db/custom.db"`) · `bun run db:setup`
  with the env override (seed: 6 categories, 12 products, 4 users, 3
  orders, 3 hero slides) · **the session-21 hard-link convergence
  recreated** (inode 263783 at BOTH `db/custom.db` paths — the repo root
  and the shell-injected `/home/z/my-project/db/custom.db` — the
  env-shadowing trap neutralized exactly as documented).
- Baseline gate: lint 0/0 · tsc clean · **230/230 unit+integration (15
  files)** · build exit 0 (25 routes, standalone present) · **the full
  E2E baseline re-run 231/231 (7.6m, foreground — the L26/L27 lesson:
  the sandbox reaps detached runs between tool calls)** — the documented
  session-28 ship state verified pre-change.
- Skills mapped from `skills/skills-catalog.md`: the standing set
  (agent-browser, tdd, clone-app-pat-pro) +
  **e-commerce-nextjs16-monorepo** (the round's primary — its
  admin-console/observability patterns re-read). The session-28 commit
  re-audited file-by-file (`src/lib/admin-payments.ts` refundNeededAlert
  seam + the 4 unit contracts, the dashboard page's two bounded queries
  composed through `buildAdminPaymentWhere`, the E2E alert deep-link
  test) — all hold.
- **The Round-29 live battery (the audit):** the FIRST sweep run
  measured every authed route 22–66% OUT OF BAND with `ref login ->
  /login` — **the reference's login redirect chain became slow** (login
  → login ×N → / takes >2.5s; verified live: the final URL is `/` with
  the authenticated home DOM, the redirect just outlasts the helper's
  networkidle+1500ms read). The battery login helpers were patched with
  `waitForURL` (L38) and the battery re-run: **the pixel sweep ALL 8
  ROUTES AT BASELINE** (home 0% [6 px, both sides painted on the same
  slide `1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist
  0%, checkout 0.01%, account 0%, login 0.28%). **The 29th mobile-nav
  verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg
  rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500
  with identical hrefs; the Electronics deep-link + auto-close passed).
  The standing watches clean (typeahead — the reference fires ZERO
  search requests; carousel cadence 5000ms; the SEO layer — 17-URL
  sitemap, robots, JSON-LD, offers.price 299.99 USD). The console
  census 24 routes + 11 admin surfaces (the payments ×4 +
  products-filter ×4 variants) CLEAN.

## 2. Audit results

### 2.1 THE PROCESS FINDING — the battery's login helper read the reference's slow redirect mid-flight (L38)

The first sweep run this round read `ref login -> /login` and measured
40–66% out-of-band on every authed route: the REFERENCE CAPTURES WERE
OF THE LOGIN PAGE (an unauthenticated diff, not drift). The diagnosis:
a scripted login probe (navigations logged, 4s settle) showed the
reference's chain is `login → login ×3 → /` — the redirect completes
AFTER the helper's `networkidle + 1500ms` window, so the helper read
the pre-redirect pathname and every subsequent authed reference capture
ran in a logged-OUT context. The same helper shape ships in the
sweep/mobile-nav/watches battery scripts (the census logs into the
clone only — unaffected).

**The fix (applied this round):** every reference login helper now
waits for the URL to LEAVE `/login` (`page.waitForURL((u) =>
!u.pathname.startsWith("/login"), { timeout: 25000 })`) before the
networkidle + settle reads, falling through to the caller's own path
guard on timeout. Lesson **L38**, validated live (the re-run battery
is fully green with `ref login -> /`).

### 2.2 THE PRIMARY FINDING — the order detail has no payment story (REFUND-TRAIL-1)

The payments surface (sessions 24–26) renders every StripeEvent's
outcome and deep-links succeeded events to their order; the dashboard
(session 28) surfaces the refund-needed count. But the ORDER side of
the link is a dead end: `/admin/orders/[id]` for a Stripe-paid order
(the seeded ORD-2026-003 — `paymentStatus: "paid"`,
`stripePaymentIntentId: "pi_demo_fixture_003"`) renders the Charge row
("Paid (Stripe)" + the plain-text intent id) and NOTHING else about the
payment. The events that exist for that intent in the DB
(`evt_demo_fixture_s` — captured $524.97 on Feb 20, 2026, and in live
operation any `charge.refunded` the dashboard operator triggers)
render NOWHERE on the order surface. An operator auditing an order —
"was this payment refunded? when was it captured?" — must leave the
order, open `/admin/payments`, and search the intent id by hand.

The session-55 suggestion names this graduation: the order-detail
refund-trail rendering. The deterministic-failure events already
record the context (`StripeEvent`: type, paymentIntentId, amount,
receivedAt — the webhook's record path is shipped and
integration-tested); what is missing is the READ surface on the order
side.

### 2.3 Verified-healthy (no action)

The session-28 dashboard alert (the seam + the page wiring + the 4 unit
+ 1 E2E contracts — re-audited file-by-file and re-run green in the
baseline). The session-27 products filters, the session-26
hero/header pins + payments date-range filter, the session-25
refund-needed family — all hold (the E2E baseline re-ran their tests
green; the live A/B battery confirmed parity). The 29th mobile-nav
token parity. The `.env` / `.env.example` / db-path contracts (the
`.env` rewritten this round from the `.env.example` contract — no new
env plumbing). The SEO/a11y/CWV/INP standing gates — all green in the
baseline re-run.

## 3. Fix design (validated against the codebase)

### 3.1 The pure seam — `src/lib/admin-payments.ts` (the payments data family)

Two exports appended to the module the refund-needed family and the
dashboard alert already live in (the order detail consumes PAYMENTS
data — the module boundary follows the data, the session-28 precedent
of a dashboard surface importing the payments seam):

1. **`paymentEventLabel(type: string): string`** — the operator
   vocabulary for the canonical event types (the family Select's own
   mental model, applied to raw Stripe types):
   - `payment_intent.succeeded` → `"Payment captured"`
   - `charge.refunded` → `"Refunded"`
   - `payment_intent.payment_failed` → `"Payment failed"`
   - anything else → the raw type (the parse family's fall-through
     philosophy — an unknown event type renders its honest raw name,
     never an error).

2. **`orderPaymentTrail(rows)`** — the presentation contract:
   - Input: `{ type: string; amount: number | null; receivedAt: Date }[]`
     (the structural view of the StripeEvent rows for ONE intent — the
     page queries them `receivedAt asc`).
   - `[]` → `{ visible: false }` — the honest calm state: an order with
     no Stripe intent, or an intent with no recorded events, renders NO
     card (the alert-fatigue rule from DASH-ALERT-1 applied to the
     order surface; also what keeps the a11y order-detail census pin at
     7 — the census page is ORD-2026-001, a non-Stripe order).
   - Non-empty → `{ visible: true; events: rows.map(...) }` — each row
     `{ label: paymentEventLabel(row.type), amount: row.amount,
     receivedAt: row.receivedAt }`, order preserved (the page's
     chronological sort is the contract).
   - Pure + total — no Prisma import, no Date re-formatting (the page
     formats).

### 3.2 The page wiring — `/admin/orders/[id]/page.tsx`

ONE bounded query added after the order fetch (the intent id is
already loaded — the query composes the exact linkage the payments
surface's outcome resolver uses):

```ts
const paymentEvents = order.stripePaymentIntentId
  ? await db.stripeEvent.findMany({
      where: { paymentIntentId: order.stripePaymentIntentId },
      orderBy: { receivedAt: "asc" },
      select: { type: true, amount: true, receivedAt: true },
    })
  : [];
const paymentTrail = orderPaymentTrail(paymentEvents);
```

Rendering (harmonious with the console's card anatomy — the superset
surfaces follow the console's own visual vocabulary; the reference is
the parity guide for the storefront only):

- The card sits between the Items card and the Timeline card (the
  payment history and the fulfillment history are both chronological
  trails, grouped at the bottom of the reading order).
- Anatomy: the page's own card shape (`bg-card rounded-2xl border
  border-border/50 shadow-sm`) with the CreditCard icon + a
  "Payment events" h2 (the cards' h2 rhythm — Customer, Shipping
  Address, Items, Payment events, Timeline).
- Rows: the payments surface's row shape (`p-4 rounded-xl border
  border-border/50`, `flex items-center justify-between`) — the label
  (`font-medium`) with the amount right-aligned (`font-semibold`,
  `formatCents` — null renders no amount, the PAY-OPS-2b contract) and
  the timestamp line (`text-sm text-muted-foreground`, the Timeline's
  own `toLocaleString("en-US", …)` format).
- **Contrast-safe by construction**: foreground + muted text only —
  NO `text-destructive` (the order-detail a11y census pin stays 7;
  double-safe because the census page is a non-Stripe order and
  renders no card at all).
- `visible: false` renders nothing (§3.1).

### 3.3 The E2E test — `admin.spec.ts` (the order-detail area)

One test, the integration guard (the session-25 pattern — the
integration guard lives in E2E, the shape contract in unit):

- Navigate `/admin/orders` → click the `ORD-2026-003` link (the seeded
  Stripe-paid order) → the "Payment events" heading visible → the
  capture row visible: `"Payment captured"` + the fixture's amount
  **$524.97** (scoped to the row container — the order total and the
  items-total row render the same string, so the assertion must target
  the trail's row: `div.rounded-xl` filtered `hasText: "Payment
  captured"` and `hasText: "$524.97"`).
- The guard's other side: navigate to ORD-2026-001's detail (a
  non-Stripe demo order) → the "Payment events" heading count 0 (the
  calm state on the real page — a query drop or a visible-gate break
  surfaces here).
- The existing order-detail tests (items/shipping/timeline,
  status-transition audit trail) are untouched — the new card renders
  after Items and before Timeline, no existing selector moves.

### 3.4 The a11y admin gate (the pin confirmation)

The order-detail census (via ORD-2026-001, the ADMIN_PROFILE
`viaOrders` entry) stays `{color-contrast}` × 7: the census page is a
non-Stripe order → the trail renders nothing → zero new nodes. Re-run
to confirm; a count change would mean the design failed its own
constraint (recalibration only as the documented last resort).

### 3.5 Mutation efficacy plan (×3, the standing discipline)

- **M1** — `paymentEventLabel` drops the canonical mapping (returns
  the raw type always): the UNIT contract fails ("Payment captured"
  for `payment_intent.succeeded`). (The E2E would ALSO fail — the row
  label reads `payment_intent.succeeded` — but the unit layer is the
  primary catcher, pinned closer to the contract.)
- **M2** — `orderPaymentTrail`'s visible gate inverted (`[]` →
  visible): the calm-state UNIT contract fails (`{ visible: false }`
  at empty). The E2E integration guard's other side would also fail
  (ORD-2026-001 would render an empty "Payment events" card) — the
  layer split mirrors M2 of session-28 (the unit layer owns the calm
  state; the e2e fixture set always renders the card for the
  Stripe-paid order).
- **M3** — the page queries by the WRONG column (`eventId:
  order.stripePaymentIntentId` instead of `paymentIntentId`): the
  event set is empty → `visible: false` → the E2E fails (no trail card
  on ORD-2026-003's page). The page wiring's own efficacy proof — the
  query's linkage is what the unit layer cannot see.

## 4. Execution checklist (TDD)

1. **RED (unit)** — the `paymentEventLabel` + `orderPaymentTrail`
   contracts appended to `src/lib/admin-payments.test.ts`: the label
   mapping (3 canonical + the raw passthrough), the calm state at `[]`,
   the row mapping at non-empty (label + amount + order preserved),
   the null-amount row. The functions missing → the import fails →
   RED for the right reason.
2. **RED (E2E)** — the trail test in `admin.spec.ts`: the card does
   not exist → failing for the right reason (verified against the
   unmodified page through the standalone build).
3. **GREEN §3.1** — the two seam functions (pure, total, ≤20 lines
   each).
4. **GREEN §3.2** — the page wiring (ONE bounded query + the card).
5. **Targeted runs** — the payments unit spec + the full admin spec
   (the order-detail + payments describes); the a11y admin gate re-run
   (the order-detail pin-7 confirmation).
6. **Mutations ×3** — each applied, verified caught, reverted,
   byte-exact-verified (md5).
7. **Full gate** — lint 0/0 · tsc clean · unit 230+6 · build exit 0 ·
   **the FULL E2E suite, two consecutive runs on the FINAL code**.
8. **The live re-verification battery** (post-change): the sweep + the
   29th mobile-nav re-verified post-change + the watches + the census
   — the admin-only change touches no parity surface (the design
   intent).
9. **Screenshots** (156–160): the order-detail trail live (the
   ORD-2026-003 detail with the payment events card), the calm state
   (ORD-2026-001 renders no card), the sweep panel, the unit gate, the
   E2E gate. VLM verification.

## 5. Sign-offs (checked on completion)

- [x] RED verified for the right reasons (the import-fail 5/38 + the absent card)
- [x] GREEN: seam + wiring + targeted runs (43/43 unit; the full admin spec 29/29; the a11y order-detail pin UNCHANGED at 7)
- [x] Mutations ×3 caught + byte-exact reverts (the md5 pair 6d7da74e…/c8b3ef81… across the three)
- [x] Full gate: lint 0/0 · tsc clean · unit 235/235 (+5 — the plan's +6 estimate was one high) · build 0 · E2E 232/232 (+1), two consecutive full runs (7.5m/7.6m)
- [x] Live battery re-verified post-change (the L38-hardened sweep all-8 in band [both sides painted, same slide]; the 29th mobile-nav token-exact re-verified post-change; watches + census clean)
- [x] Screenshots 156–160 captured + VLM 5/5 PASS
- [x] Docs: AGENTS.md (the REFUND-TRAIL-1 contract), CLAUDE.md (the session-29 contract + the 235/232 counts), README.md (the order-detail payment-event trail row + the 467-test row + the 29th verification), PAD v1.29 (ADR-037 + the revision row + the test matrix corrected to 35 files/467), SKILL v1.29.0 (the L38 lesson + the ADR-037 index), docs/session_57.md, worklog.md, this plan's sign-offs
- [x] `.env.example` verified current (no new env plumbing this round; the `.env` rewritten from it this round — byte-equivalent coverage)
- [ ] Committed to `main` + pushed via the SSH wrapper (executed at ship: commit + dry-run + push + key shred) — checked in the commit message
