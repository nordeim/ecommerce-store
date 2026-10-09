# Session 57 — Round 29: The Order-Detail Payment-Event Trail (REFUND-TRAIL-1, ADR-037) + The Battery Login Robustness Fix (L38)

**Date:** 2026-10-10 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `f079f98` (the session-28 ship `cf90c12` + the user's session-56 narration log)
**Deliverable commit:** (this round's `feat: session-29 …`)
**Plan:** `docs/remediation-plan-session29.md` · **ADR-037** (PAD v1.29) · **SKILL v1.29.0**

## 0. The round's mandate

The user's standing round instruction (the professional Stripe integration
verification, the full audit/parity workflow with the mobile-nav +
Tailwind v4 watches, the `.env`/db-root contract, the vitest + playwright
suites, the TDD remediation plan, the screenshots, the `.env.example`,
the docs, and the main-only push). The session-55 suggested-next-steps
name the Stripe test-mode keys and the email provider — both still
credential-gated. The actionable candidate is the third: **"a natural
depth candidate: order-detail refund-trail rendering (the
deterministic-failure events already record the context)"** — plus the
round's own audit finding (the battery's login helper reading the
reference's now-slow redirect chain mid-flight, §2.1) and its fix (L38).

## 1. Baseline verification (state at audit start)

- **Workspace RESET this round** — the sandbox was rebuilt, so the repo
  was `git clone`d fresh. Environment rebuilt per the documented
  contracts: `bun install` · `.env` written from the `.env.example`
  contract (`DATABASE_URL="file:../db/custom.db"`) · `bun run db:setup`
  (6 categories, 12 products, 4 users, 3 orders, 3 hero slides) · **the
  session-21 hard-link convergence recreated** (inode 263783 at BOTH
  `db/custom.db` paths — the repo root and the shell-injected
  `/home/z/my-project/db/custom.db` — the env-shadowing trap
  neutralized exactly as documented).
- Baseline gate: lint 0/0 · tsc clean · **230/230 unit+integration (15
  files)** · build exit 0 (25 routes, standalone present) · **the full
  E2E baseline re-run 231/231 (7.6m, foreground — the L26/L27 lesson:
  the sandbox reaps detached runs between tool calls)** — the documented
  session-28 ship state verified pre-change.
- Skills mapped from `skills/skills-catalog.md`: the standing set
  (agent-browser, tdd, clone-app-pat-pro) +
  **e-commerce-nextjs16-monorepo** (the round's primary — its
  admin-console/observability patterns re-read). The session-28 commit
  re-audited file-by-file (the `refundNeededAlert` seam + 4 unit
  contracts, the dashboard page's two bounded queries composed through
  `buildAdminPaymentWhere`, the E2E alert deep-link test) — all hold.
- **The Round-29 live battery, part 1 (the audit):** the pixel sweep's
  FIRST run measured **every authed route 22–66% OUT OF BAND** with `ref
  login -> /login` — NOT drift: **the reference's login redirect chain
  became slow** (verified live: the chain is login → login ×3 → `/`,
  completing after the helper's networkidle+1500ms read; the final URL
  is `/` with the authenticated home DOM — the login SUCCEEDS, only the
  pathname read is early). The battery login helpers were patched with
  `waitForURL` (L38) and the battery re-run: **ALL 8 ROUTES AT THE
  BASELINE BAND** (home 0% [6 px, both sides painted on the same slide
  `1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%,
  checkout 0.01%, account 0%, login 0.28%). **The 29th mobile-nav
  verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg
  rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500
  with identical hrefs; the Electronics deep-link + auto-close
  passed). The standing watches clean (typeahead — the reference fires
  ZERO search requests; carousel cadence 5000ms; the SEO layer — 17-URL
  sitemap, robots, JSON-LD, offers.price 299.99 USD; one transient
  reference-login timeout on the first watches run — a re-run was
  fully clean, the L38 family). The console census 24 routes + 11
  admin surfaces CLEAN.

## 2. Audit results

### 2.1 THE PROCESS FINDING — the battery's login helper read the reference's slow redirect mid-flight (L38)

The first sweep run read `ref login -> /login` and measured 40–66%
out-of-band on every authed route — the reference captures were of the
LOGIN PAGE (an unauthenticated diff, not drift). The diagnosis (a
navigation-logging login probe, 4s settle): the reference's chain is
login → login ×3 → `/` — the redirect completes AFTER the helper's
`networkidle + 1500ms` window, so the helper read the pre-redirect
pathname and every subsequent authed reference capture ran logged-OUT.
The same helper shape ships in the sweep, mobile-nav, and watches
battery scripts (the census logs into the clone only — unaffected).

**The fix (applied this round):** every reference login helper now
waits for the URL to LEAVE `/login` (`page.waitForURL((u) =>
!u.pathname.startsWith("/login"), { timeout: 25000 })`) before the
networkidle + settle reads, falling through to the caller's own path
guard on timeout. Lesson **L38**, validated live (the re-run battery is
fully green with `ref login -> /`). The signature rule for future
rounds: an out-of-band reading on EVERY authed route at once is the
signature of an auth failure, not drift — drift is localized.

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
order, open `/admin/payments`, and search the intent id by hand. The
session-55 suggestion named this graduation; the audit confirmed the
gap on the live surface.

### 2.3 Verified-healthy (no action)

The session-28 dashboard alert (the seam + the page wiring + the 4
unit + 1 E2E contracts — re-audited file-by-file and re-run green in
the baseline). The session-27 products filters, the session-26
hero/header content pins + the payments date-range filter, the
session-25 refund-needed family — all hold (the E2E baseline re-ran
their tests green; the live A/B battery confirmed parity). The 29th
mobile-nav token parity. The `.env` / `.env.example` / db-path
contracts (the `.env` rewritten this round from the `.env.example`
contract — byte-equivalent coverage; no new env plumbing). The
SEO/a11y/CWV/INP standing gates — all green in the baseline re-run.

## 3. The TDD execution trail

1. **RED (unit)** — 5 contracts appended to
   `src/lib/admin-payments.test.ts` (the `paymentEventLabel` canonical
   mapping + the raw passthrough; the `orderPaymentTrail` calm state at
   `[]`, the label/amount/order row mapping, the null-amount row): the
   functions missing → the import fails → **5 failed / 38 passed** —
   RED for the right reason.
2. **RED (E2E)** — the trail test in `admin.spec.ts`'s order-detail
   area (the "Payment events" card + the capture row "Payment
   captured" + $524.97 scoped to the trail's row — the order total and
   the items-total row render the same "$524.97" string — + the calm
   state on ORD-2026-001): **1 failed** against the unmodified page
   (the card does not exist).
3. **GREEN §3.1 (the seam)** — `paymentEventLabel` +
   `orderPaymentTrail` in `src/lib/admin-payments.ts` (the module the
   payments family, the outcome resolver, and the dashboard alert
   already live in — the module boundary follows the data, the
   session-28 precedent): the operator vocabulary mapping with the raw
   passthrough, the discriminated-union trail return with the calm
   state at an empty set. **43/43 unit.**
4. **GREEN §3.2 (the wiring)** — the order-detail page: ONE bounded
   query on the exact linkage the payments outcome resolver uses
   (`paymentIntentId = order.stripePaymentIntentId`, `receivedAt asc`,
   select-only; an order with no intent queries nothing) composed
   through the seam; the card between Items and the Timeline (the two
   chronological trails read together) with the console's card anatomy
   and the payments surface's row shape — foreground + muted text
   only, NO destructive accent (contrast-safe by construction).
5. **GREEN §3.3 (the E2E)** — the trail test green through the
   rebuilt standalone (the E2E-serves-the-build lesson); the full
   admin spec **29/29** (the existing order-detail, payments, and
   products tests untouched — no selector moved).
6. **The a11y admin gate re-run GREEN with the pin UNCHANGED** — the
   order-detail census stays {color-contrast} × 7 (double-safe: the
   census page is ORD-2026-001, a non-Stripe order that renders no
   card; and the card itself carries no contrast-risky classes). The
   dashboard (8), orders (7), products (7), payments (9) pins all
   hold.
7. **Mutation efficacy ×3** (each reverted, verified byte-exact against
   the pre-mutation backups — the md5 pair `6d7da74e…` /
   `c8b3ef81…` across the three reverts): (1) **M1** the label
   mapping dropped (always the raw type) → **3 unit contracts FAIL**
   (the vocabulary contract); (2) **M2** the trail's visible gate
   inverted (empty → visible) → **3 unit contracts FAIL** (the
   calm-state contract); (3) **M3** the page queries the WRONG column
   (`eventId` instead of `paymentIntentId` → an empty set → no card)
   → **the E2E integration guard FAILS** — verified through a rebuild
   + the targeted E2E (the page wiring's own efficacy proof — the
   query linkage is what the unit layer cannot see).
8. **Full gate** — lint 0/0 · tsc clean · **235/235 unit+integration
   (+5)** · build exit 0 (25 routes) · **232/232 E2E (+1), two
   consecutive full runs on the FINAL code (7.5m + 7.6m, zero
   failures)**.

## 4. The live A/B verification (round 29, post-change)

- **The pixel sweep (the L38-hardened form):** ALL 8 ROUTES AT THE
  BASELINE BAND — home 0% (6 px, both sides painted on the same slide
  `1237b9a1afec`), shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%,
  checkout 0.01%, account 0%, login 0.28% — the admin-only change
  touches no parity surface (the design intent).
- **The 29th mobile-nav verification (re-run post-change):** all 10
  checks PASS — the drawer is unaffected.
- **The standing watches:** typeahead — the reference fires ZERO search
  requests; the carousel cadence stable at 5000ms; the SEO layer
  re-verified (17-URL sitemap, robots, JSON-LD, offers.price 299.99
  USD).
- **The console census:** 24 routes + 11 admin surfaces (payments ×4 +
  products filters ×4) — ZERO console errors/pageerrors.
- **Screenshots 156–160** (the trail live — ORD-2026-003's detail with
  the "Payment events" card rendering the capture row; the calm state —
  ORD-2026-001's detail renders no card; the L38-hardened sweep panel;
  the unit gate; the E2E gate): **VLM 5/5 PASS** (the transient SDK
  reverted, package.json + bun.lock md5-restored).

## 5. The deliverable

**REFUND-TRAIL-1 (ADR-037) + L38**:

- **The order-detail payment-event trail** — the order side of the
  payments deep link: ONE bounded query on the exact linkage the
  payments outcome resolver uses (`paymentIntentId = the order's
  `stripePaymentIntentId`), composed through the pure
  `orderPaymentTrail` + `paymentEventLabel` seams in the payments
  module (the operator vocabulary: "Payment captured" / "Refunded" /
  "Payment failed" / raw passthrough; the calm state — a non-Stripe
  order renders NO card), rendered as the "Payment events" card between
  Items and the Timeline with the console's own card anatomy and the
  payments surface's row shape, contrast-safe by construction. The
  deep-link contract is now bidirectional: the payments surface answers
  "which order did this payment become?" and the order detail answers
  "which payment events did I absorb?".
- **The battery login robustness fix (L38)** — every reference login
  helper in the battery scripts waits for the URL to LEAVE `/login`
  before reading state; an every-route-at-once out-of-band reading is
  now recognized as the auth-failure signature (drift is localized).

**Gate at ship:** lint 0/0 · tsc clean · 235/235 unit+integration
(+5) · build exit 0 (25 routes) · 232/232 E2E (+1) = **467 total** —
two consecutive full runs on the FINAL code.

## 6. Suggested next steps

- Provide Stripe test-mode keys (`sk_test`/`pk_test` + a webhook
  endpoint) to exercise the full Payment Element flow live — the
  integration gates cover the webhook contract, the payments surface +
  the dashboard alert + the NEW order-detail trail will react to REAL
  events (a dashboard refund would land `charge.refunded` in the
  order's trail — the multi-event case the single fixture cannot
  demonstrate).
- Wire an email provider to activate the verification/reset delivery
  (the console.info seams are ready).
- With the trail live, the next depth candidates: rendering the
  deterministic-failure REASON on the payments surface (the webhook's
  permanent-failure classifications currently log the reason to the
  console only — persisting it would make the refund-needed family
  self-explanatory), or an order-level refund action (Stripe API —
  credential-gated).
