# Session 49 — Round 25: Payment-Ops Observability + Console A11y (PAY-OPS-2, ADR-033 + A11Y-HEADING-1)

**Date:** 2026-10-09 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `ebd6361` · **Deliverable commit:** (this round's `feat: session-25 …`)
**Plan:** `docs/remediation-plan-session25.md` · **ADR-033** (PAD v1.25) · **SKILL v1.25.0**

## 0. The round's mandate

The user's standing round instruction (re-emphasizing the professional Stripe
integration, the full audit/parity workflow, the `.env`/db-root contract,
the vitest + playwright suites, the TDD remediation plan, the screenshots,
the `.env.example`, the docs, and the main-only push). Sessions 22–24
shipped the payment machinery (PAY-STRIPE-1/2) and its ops surface
(PAY-OPS-1). This round continued the payments-ops family with the two
session-46/47 documented round-25 candidates — both actionable without
external credentials: **PAY-OPS-2** (the refund-needed first-class filter
family, the persisted event amount, the honest charge-event intent column)
and **A11Y-HEADING-1** (the console LIST pages' heading-order family
observation, resolved with sr-only h2s).

## 1. Baseline verification (state at audit start)

- Workspace NOT reset — `git pull` fast-forwarded `06bce7e..ebd6361`
  (only `docs/session_48.md`, the user's session-log narrative). `.env`
  carries the repo contract `DATABASE_URL="file:../db/custom.db"`; the
  env-shadowing trap live as documented (the sandbox injects
  `DATABASE_URL` into the SHELL); the session-21 hard-link convergence
  INTACT (inode 395370 at BOTH `db/custom.db` paths, verified).
- Baseline gate: lint 0/0 · tsc clean · 186/186 unit+integration (14
  files) · build exit 0 (25 routes) · **the full E2E baseline re-run
  214/214 (6.9m)** — the documented session-24 ship state verified
  pre-change.
- Skills mapped from `skills/skills-catalog.md`:
  **e-commerce-nextjs16-monorepo** (the round's primary — its
  ops/webhook lesson family re-read; the `payment_orphan` observability
  pattern + the refund-permission model are the reference for what an
  operator needs), plus the standing set (agent-browser, tdd,
  clone-app-pat-pro). The session-24 commit re-audited file-by-file
  (the payments page, the seam, the filter island, the fixtures, the
  e2e-reset extension) — all hold.

## 2. Audit results

### 2.1 The heading-order family confirmed live (the full-tag probe)

A standalone probe (self-hosted axe-core, `runOnly: best-practice`,
the :3000 production server, admin-authenticated) measured the console
census: `{}` on the dashboard + the order-detail (h2s present);
`{heading-order: 1}` on each of the three LIST pages (orders/products/
payments — the lone h1 → the footer's h3 columns). Exactly the
session-24 documented family observation. The storefront pages share
the REFERENCE's own heading shape (parity — untouched by design).

### 2.2 The payments surface's observability gaps (the primary findings)

(a) **The refund-needed signal was not filterable** — the outcome
resolver derived refund-needed per row, but the family Select offered
succeeded/failed/other only; an operator had to SCAN the succeeded
family for the actionable rows. (b) **The event rows carried no
AMOUNT** — the webhook's parse schema already extracted
`data.object.amount` (and the refund-trail logs printed it), but the
`StripeEvent` row never persisted it; "how much needs refunding?"
required the Stripe dashboard. (c) **The charge-event intent column
was dishonest** — `recordEvent` wrote `paymentIntentId:
object.id` for every type, so a `charge.refunded` delivery recorded
its CHARGE id (the real intent id lives on `payment_intent`) — the
surface's q-search over the column was untruthful for the charge
family, and the seed's `evt_demo_fixture_r` (a pi id) was not
representative of the real write path.

### 2.3 Verified-healthy (no action)

The session-23 webhook restructure (H4d/L9, the honest 200/500 policy,
the in-tx number generation) — holds. The payments page's outcome
resolution (ONE findMany, no N+1) — holds. The filter island's
URL-deep-linkable pattern (ADMIN-SEARCH-1) — holds. The demo fixtures +
the e2e-reset isolation contract — hold. The `.env` / `.env.example` /
db-path contracts — current (no new env plumbing this round).

## 3. The TDD execution trail

1. **RED (unit)** — `admin-payments.test.ts` extended first (the
   refund-needed contracts — the family canonical, the notIn+null OR
   shape, the nested AND shape, the default-[] contract, the
   placed-set ignored for other families; +5) and
   `stripe-payment.test.ts` (the charge-family parse with
   `payment_intent`, the `stripeEventIntentId` helper × 4; +5): the
   seam lacked the family + the second parameter = RED for the right
   reason (11 failures, verified).
2. **RED (integration)** — 2 new webhook contracts (the recorded rows
   persist the payload amount; a charge-family event records the REAL
   intent id + the fallback shape): 2 failures verified against the
   session-24 code.
3. **RED (E2E)** — 3 new admin.spec payments tests (the refund-needed
   family deep-link, the combined AND shape, the amount rendering) +
   the a11y gate's best-practice census test (heading-order ×1 fires
   on the three list pages = the pre-fix RED) + the count-line
   evolution (3 → 4 events).
4. **GREEN (in the plan's order)** — §3.1 the seam
   (`buildAdminPaymentWhere(filters, placedIntentIds = [])`) → §3.2
   the schema (`StripeEvent.amount Int?`, additive db push) → §3.3 the
   intent helper + the parse schema's `payment_intent` field → §3.4
   the page (the placed-intent fetch + the amount rendering + the
   sr-only h2) → §3.5 the fixtures (the FOURTH canonical event
   `evt_demo_fixture_n` + amounts on the set, seed + e2e-reset) → §3.6
   the sr-only h2s on the orders/products list pages. 198/198
   unit+integration (+12); the targeted admin+a11y specs 46/46.
5. **Two test-contract evolutions discovered on GREEN** (both
   legitimate, both calibrated): (a) the succeeded family now contains
   TWO fixtures (the placed s + the refund-needed n) — the strict-mode
   violation on the shared text locator + the family-filter count
   1 → 2, both fixed with honest count assertions; (b) the payments
   a11y pin 8 → 9 — the fourth fixture's destructive line
   (node-enumerated via the calibration probe: the SAME app-wide
   destructive-color contrast class, `.text-destructive` on the card
   background — not a new defect class).
6. **Mutation efficacy ×3 (each reverted, verified against the
   pre-mutation backups):** (1) the placed-intent fetch dropped (the
   page passes the default []) → the refund-needed family deep-link +
   the combined-filter tests FAIL (2 — every succeeded event renders
   as refund-needed); (2) the amount persistence dropped → the
   integration amount test FAILS (the write path's proof); (3) the
   sr-only h2s dropped → the best-practice census test FAILS alone.
7. **One process trap caught and corrected:** the first E2E run-2
   launch died at test #4 — my :3000 restart killed processes by the
   `standalone/server` NAME PATTERN, which also matched the E2E's
   :3100 server (both are `bun .next/standalone/server.js`). The
   documented L25 stale-server family's mirror image: **kill by PORT,
   never by process-name pattern** (the E2E relaunched clean —
   218/218).
8. **Full gate** — lint 0/0 · tsc clean · 198/198 unit+integration ·
   build exit 0 (25 routes) · **218/218 E2E, two consecutive full
   runs on the FINAL code** (7.0m + the relaunched run).

## 4. The live A/B verification (round 25)

- **The 25th mobile-nav verification** (the standing protocol,
  Playwright form — BOTH sites authenticated, iPhone 14 device
  emulation): token-exact parity on every check — panel 288px /
  bg rgb(251,250,249), nav `flex` gap-4 mt-8, 5 links 239×44 at
  18px/500 with identical hrefs; the functional deep-link
  (Electronics → `/shop?category=electronics`) + auto-close passed.
- **The pixel sweep**: all 8 routes at the 0.28–0.68% baseline band
  (home 0.34 / shop 0.38 / pdp 0.68 / cart 0.34 / wishlist 0.34 /
  checkout 0.35 / account 0.34 / login 0.28).
- **The standing watches**: typeahead — the reference fires ZERO
  search requests; the carousel cadence stable at ~5000ms; the SEO
  layer re-verified (17-URL sitemap, robots, JSON-LD,
  offers.price 299.99 USD).
- **The console census**: 24 routes + 7 admin surfaces (the payments
  route ×4 variants incl. the NEW `?family=refund-needed`) — ZERO
  console errors/pageerrors.
- **Screenshots 136–140** (the round's contract panel, the 25th
  mobile-nav, the payments surface live ×2 — unfiltered + the
  refund-needed family —, the unit gate, the E2E gate): **VLM 5/5
  PASS** (the transient SDK reverted; package.json + bun.lock
  restored).
- **The 25th mobile-nav md5 BYTE-IDENTICAL**
  (`05de11678965f30a85f9196c2ec43bae`) — **thirteen consecutive
  rounds of rendering continuity**.

## 5. The deliverable

**PAY-OPS-2 (ADR-033) + A11Y-HEADING-1** — the payments surface
graduates from observable to TRIAGEABLE:

- `?family=refund-needed` — the operator's most actionable signal as
  a first-class filter: exactly the succeeded events with NO linked
  order (the ADR-031 deterministic-failure family), resolved via the
  pure seam's second parameter (the placed-intent set, default `[]`)
  fed by ONE bounded query; the family+q AND shape E2E-pinned.
- `StripeEvent.amount Int?` — the magnitude persisted at both webhook
  write sites + rendered beside every outcome ("how much needs
  refunding?" answered on the surface).
- `stripeEventIntentId` = `payment_intent ?? object.id` — charge-family
  deliveries record the REAL intent id (integration-pinned); the
  q-search stays truthful.
- The sr-only h2s on the three console LIST pages — the heading-order
  family observation RESOLVED; the best-practice census pinned
  EXACTLY EMPTY; the storefront keeps the reference's own shape.
- The FOURTH canonical fixture (`evt_demo_fixture_n` — succeeded, NO
  order, amount 14900) + amounts on the set; the payments a11y pin
  recalibrated 8 → 9 (node-enumerated, the same app-wide class).

**Gate at ship:** lint 0/0 · tsc clean · 198/198 unit+integration
(+12) · build exit 0 (25 routes) · 218/218 E2E (+4) = **416 total** —
two consecutive full runs on the FINAL code.

## 6. Suggested next steps

- Provide Stripe test-mode keys (`sk_test`/`pk_test` + a webhook
  endpoint) to exercise the full Payment Element flow live — the
  integration gates already cover the webhook contract, and the
  payments surface will show real events (with amounts, refund-needed
  triage, and honest charge-family intent ids).
- Wire an email provider to activate the verification/reset delivery
  (the console.info seams are ready).
- A payments-surface date-range filter (the receivedAt column is
  indexed by the ordering) — a natural round-26 superset candidate.
