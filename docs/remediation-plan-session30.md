# Remediation Plan — Session 30 (Round 30): The Deterministic-Failure Reason Trail (REASON-TRAIL-1, ADR-038)

**Date:** 2026-10-10 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `2873e41` (the session-29 ship `24ea9d7` + the user's session-58 narration log)
**Status at audit start:** 467-test gate (235 unit+integration + 232 E2E), PAD v1.29, SKILL v1.29.0 — lint 0/0 · tsc clean · 235/235 unit+integration · build exit 0 (25 routes) · the full E2E baseline re-run **232/232 (7.5m, foreground)** verified on the pulled workspace.

## 0. The round's mandate

The user's standing round instruction (the professional Stripe integration
verification, the full audit/parity workflow with the mobile-nav +
Tailwind v4 watches, the `.env`/db-root contract, the vitest + playwright
suites, the TDD remediation plan, the screenshots, the `.env.example`,
the docs, and the main-only push). The session-58 suggested-next-steps
name two items: the Stripe test-mode keys (credential-gated — no keys
were provided, so the live Payment Element stays untestable) and
**"persist the deterministic-failure reasons so the refund-needed family
is self-explanatory"** — the only non-credential-gated candidate, and
the round's deliverable.

## 1. Baseline verification (state at audit start)

- **Workspace refreshed (not reset)** — `git pull` fast-forwarded
  `24ea9d7 → 2873e41` (the user's session-58 narrative log). The
  persisted environment re-verified against the documented contracts:
  `.env` carries the repo contract `DATABASE_URL="file:../db/custom.db"`
  · `db/custom.db` at the repo root · **the session-21 hard-link
  convergence still intact** (inode 263783 at BOTH `db/custom.db` paths
  — the env-shadowing trap neutralized: the shell still injects
  `file:/home/z/my-project/db/custom.db`, both paths are ONE file).
- Baseline gate: lint 0/0 · tsc clean · **235/235 unit+integration (15
  files)** · build exit 0 (25 routes, standalone present) · **the full
  E2E baseline re-run 232/232 (7.5m, foreground — the L26/L27 lesson)** —
  the documented session-29 ship state verified pre-change.
- Skills mapped from `skills/skills-catalog.md`: the standing set
  (agent-browser, tdd, clone-app-pat-pro) + **e-commerce-nextjs16-monorepo**
  (the round's primary — its Stripe webhook/observability patterns
  re-read) + **tdd** (the red-green loop, vertical slices, seams — the
  skill's rules match the repo's established unit/integration/E2E
  layering). The session-29 commit re-audited file-by-file
  (`src/lib/admin-payments.ts` `paymentEventLabel`/`orderPaymentTrail`
  seams + the 5 unit contracts, the order-detail page's ONE bounded
  query + the card between Items and Timeline, the E2E trail test) —
  all hold.
- **The Round-30 live battery (the audit):** the L38-hardened pixel
  sweep **ALL 8 ROUTES AT BASELINE** (home 0% [6 px, both sides painted
  on the same slide `1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%,
  wishlist 0%, checkout 0.01%, account 0%, login 0.28%). **The 30th
  mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks — panel
  288px / bg rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at
  18px/500 with identical hrefs; the Electronics deep-link + auto-close
  passed). The standing watches clean (typeahead — the reference fires
  ZERO search requests; carousel cadence; the SEO layer — 17-URL
  sitemap, robots, JSON-LD, offers.price 299.99 USD). The console
  census 24 routes + 11 admin surfaces CLEAN.

## 2. Audit results

### 2.1 THE PRIMARY FINDING — the refund-needed family renders its signal without its WHY (REASON-TRAIL-1)

When the webhook's backstop placement fails DETERMINISTICALLY, the
route (`src/app/api/stripe/webhook/route.ts`) records the `StripeEvent`
row, answers 200 (a retry could never succeed — ADR-031), and writes
the reason to **`console.error` only**. Four distinct write sites:

1. orphaned payment without usable metadata →
   `"[stripe-webhook] orphaned payment without usable metadata — refund via dashboard"`
2. vanished/empty cart →
   `"[stripe-webhook] orphaned payment with empty/absent cart — refund via dashboard"`
3. amount mismatch →
   `"[stripe-webhook] amount mismatch — refund via dashboard … reason=…"`
4. stock-short (the `STOCK_SHORT:` marker surfaced through the
   permanent classification) →
   `"[stripe-webhook] captured payment unfulfillable (stock) — refund via dashboard"`

The `StripeEvent` row persists type, intent id, amount, receivedAt —
**the reason is NOT persisted**. The read surfaces therefore render the
refund-needed family's signal with no WHY: `/admin/payments` renders
"No order — refund via Stripe dashboard" for every refund-needed row,
and the dashboard alert counts them — an operator triaging a
refund-needed event must SSH into server logs to learn whether the
payment mismatched the cart, hit a stock short, or carried unusable
metadata. The console-error trail exists exactly for the operator, but
the operator's triage surface is the admin console, not the log stream.

The fix: persist a canonical reason CODE on the row at the four write
sites, surface it on the payments list (the refund-needed family's own
surface) through a pure label seam — the same enrichment graduation the
amount column took in session-25 (PAY-OPS-2b: the payload's magnitude
joined the row so the operator's first question — "how much?" — was
answered; this round answers the second — "why?").

### 2.2 Design constraints discovered in the audit

- **The outcome derivation must stay DB-state-honest.** The
  refund-needed family derives from `type + no linked order` — never
  from the reason column. A null-reason refund-needed row (recorded
  before session-30, or a path the webhook never classified) is STILL
  refund-needed; a reason row is enrichment, never derivation. The
  `resolvePaymentEventOutcome` seam is untouched.
- **The reason line must be contrast-safe.** The payments a11y census
  pin is `{color-contrast}` × 9 (the fourth fixture's destructive
  line + the footer's shared trait, node-enumerated). The reason line
  uses the row's OWN muted vocabulary (`text-muted-foreground` — the
  same pair the timestamp line already renders on every row) — zero
  new color pairs, zero census growth by construction.
- **The seed's refund-needed fixture (`evt_demo_fixture_n`)** gains the
  demonstrable reason — the coherent story for a $149 succeeded intent
  with NO order is an amount mismatch (the webhook refused a payment
  that didn't match the server-derived cart). Restored idempotently by
  `prisma/e2e-reset.ts` every run (the run-to-run isolation contract).
- **The schema change is nullable-additive** — `failureReason
  String?` on `StripeEvent` (SQLite `db push`, no migration file; the
  dev DB + the E2E global-setup push + the integration test's scratch
  push all pick it up; every pre-existing row reads null = the calm
  state).

### 2.3 Verified-healthy (no action)

The session-29 order-detail payment-event trail (the seam + the page
wiring + the 5 unit + 1 E2E contracts — re-audited and re-run green in
the baseline). The session-28 dashboard alert, the session-27 products
filters, the session-26 payments date-range, the session-25
refund-needed family — all hold. The 30th mobile-nav token parity. The
`.env` / `.env.example` / db-path contracts (no new env plumbing this
round). The Stripe client-path seams (`createPaymentIntentAction`,
`stripe-pay.tsx`, the `/pure` loader discipline, the
verify-then-placement contract) — re-read, all hold; the live-mode
Payment Element remains untested without test keys (the documented
credential gate). The SEO/a11y/CWV/INP standing gates — all green in
the baseline re-run.

## 3. Fix design (validated against the codebase)

### 3.1 The write-side vocabulary — `src/lib/stripe-payment.ts`

The canonical reason codes, exported beside the failure classification
they complement (the module the route already imports; the single
source the webhook writes and the read seam maps — no stringly-typed
drift):

```ts
export const STRIPE_FAILURE_REASON = {
  metadataUnusable: "metadata-unusable",
  cartUnavailable: "cart-unavailable",
  amountMismatch: "amount-mismatch",
  stockShort: "stock-short",
} as const;
```

### 3.2 The schema — `prisma/schema.prisma` (StripeEvent)

`failureReason String?` — nullable canonical code; null = no reason
known (pre-session-30 rows, the failed/ignored recordings, the
client-path-precedence recording, the successful in-tx insert).
Comment-documented per the schema's own session-25 amount precedent.

### 3.3 The write path — `src/app/api/stripe/webhook/route.ts`

`recordEvent(evt, failureReason?)` gains the optional parameter; the
FOUR deterministic-failure sites pass their code (metadata-unusable /
cart-unavailable / amount-mismatch / stock-short — the permanent-
classification catch passes the stock-short code). Every other
recording site (failed, ignored, client-precedence, the in-tx insert)
writes no reason. No behavior change beyond the persisted column —
the response contracts, the 200/400/500 policy, and the H4d
transactional rule are untouched.

### 3.4 The read seam — `src/lib/admin-payments.ts` (the payments data family)

`paymentFailureReasonView(reason: string | null)` — the presentation
contract (the refundNeededAlert precedent):

- `null`/`""` → `{ visible: false }` — the honest calm state;
- the four canonical codes → `{ visible: true, label: "Reason: …" }`
  (operator copy: "Reason: amount mismatch vs cart total", "Reason:
  insufficient stock at placement", "Reason: payment metadata
  unusable", "Reason: cart unavailable at placement");
- an unknown code → `{ visible: true, label: "Reason: <raw>" }` — the
  parse family's fall-through philosophy (paymentEventLabel's raw
  passthrough precedent: an unanticipated code renders its honest
  name, never an error).

### 3.5 The page wiring — `/admin/payments/page.tsx`

The refund-needed outcome block composes the view: under the "No order
— refund via Stripe dashboard" line, when BOTH gates pass
(`outcome.kind === "refund-needed"` AND the view's `visible`), a muted
line `text-xs text-muted-foreground mt-0.5` renders the label. The
placed/failed/ignored outcomes render no reason line (a placed order
has no placement failure by construction; the page's composition makes
that structural, not assumed).

### 3.6 The seed + e2e-reset — the demonstrable fixture

`evt_demo_fixture_n` gains `failureReason: "amount-mismatch"` in BOTH
`prisma/seed.ts` and `prisma/e2e-reset.ts` (the upsert update covers
restoration; the run-to-run isolation contract). The other three
fixtures keep null (the placed/failed/refunded rows — no placement
failure).

### 3.7 The tests (TDD)

**Unit — `src/lib/admin-payments.test.ts` (6 contracts):** the calm
state at null; the four canonical labels; the unknown-code raw
passthrough.

**Integration — `tests/stripe-webhook.integration.test.ts` (1 test
driving all four write sites):** a metadata-less succeeded event →
row.failureReason `"metadata-unusable"`; a succeeded event whose
cartId points at no cart → `"cart-unavailable"`; an amount-mismatched
event → `"amount-mismatch"`; a stock-short event → `"stock-short"`;
and the successful placement's in-tx row → `null` (the no-reason
contract for the success path — asserted in the same test).

**E2E — `tests/e2e/admin.spec.ts` (1 test):** on
`/admin/payments?family=refund-needed`, the fixture row (scoped to the
row containing `pi_demo_fixture_006`) renders the reason line
"Reason: amount mismatch vs cart total" BESIDE the destructive outcome
line; and the placed fixture's row (the row containing
`pi_demo_fixture_003`) renders NO "Reason:" text (the calm state on
the real page). The existing refund-needed family tests + the
dashboard alert deep-link test are untouched (no selector moves — the
line is ADDED under the existing outcome line).

**The a11y admin gate (the pin confirmation):** the payments census pin
stays `{color-contrast}` × 9 — the reason line introduces zero new
color pairs (the muted-foreground-on-card pair already renders in the
same row's timestamp line). Re-run to confirm; a count change would
mean the design failed its own constraint.

### 3.8 Mutation efficacy plan (×3, the standing discipline)

- **M1** — the seam drops the canonical mapping (returns the raw code
  as the label always): the UNIT label contracts fail.
- **M2** — the seam's visible gate inverted (null → visible): the
  calm-state UNIT contract fails.
- **M3** — the webhook's amount-mismatch write site drops the reason
  (records without it): the INTEGRATION contract fails (the row's
  failureReason reads null) — no rebuild needed (the integration test
  imports the route handler directly).
- The page wiring's efficacy is owned by the E2E integration guard
  (the new test fails if the reason line render is dropped) — the
  standing layer split.

## 4. Execution checklist (TDD)

1. **RED (unit)** — the 6 `paymentFailureReasonView` contracts appended
   to `src/lib/admin-payments.test.ts`: the import fails → RED for the
   right reason.
2. **RED (integration + E2E)** — the reason-persistence integration
   test (fails: the column does not exist yet — the schema push comes
   with GREEN §3.2) + the reason-line E2E test (fails against the
   unmodified page through the standalone build).
3. **GREEN §3.1–§3.3** — the vocabulary consts, the schema column
   (`bun run db:push` on the dev DB), the webhook write sites.
4. **GREEN §3.4–§3.6** — the read seam, the page wiring, the seed +
   e2e-reset fixture.
5. **Targeted runs** — the payments unit spec + the webhook
   integration test + the full admin spec; the a11y admin gate re-run
   (the payments pin-9 confirmation).
6. **Mutations ×3** — each applied, verified caught, reverted,
   byte-exact-verified (md5).
7. **Full gate** — lint 0/0 · tsc clean · unit 235+6+1(integration
   assertions live in the same file family) · build exit 0 · **the
   FULL E2E suite, two consecutive runs on the FINAL code**.
8. **The live re-verification battery** (post-change): the sweep + the
   30th mobile-nav re-verified post-change + the watches + the census —
   the admin-only change touches no parity surface (the design intent).
9. **Screenshots** (161–165): the refund-needed family with the reason
   line live (the fixture row + the family filter), the calm state (the
   placed fixture row renders no reason), the sweep panel, the unit
   gate, the E2E gate. VLM verification.

## 5. Sign-offs (checked on completion)

- [x] RED verified for the right reasons (the import-fail 6/43 + the integration absent-column 1/13 + the absent line on the unmodified page)
- [x] GREEN: seam + wiring + targeted runs (49/49 unit; 14/14 integration; the full admin spec 30/30; the a11y payments pin UNCHANGED at 9)
- [x] Mutations ×3 caught + byte-exact reverts (the md5 pair a53fe16a…/b8a8112f… across all three)
- [x] Full gate: lint 0/0 · tsc clean · unit 242/242 (+6 unit +1 integration) · build 0 · E2E 233/233 (+1) = 475 total, two consecutive full runs (7.6m/7.7m)
- [x] Live battery re-verified post-change (the sweep all-8 in band [both sides painted, same slide 1237b9a1afec]; the 30th mobile-nav token-exact re-verified post-change; watches + census clean)
- [x] Screenshots 161–165 captured + VLM 5/5 PASS (162's first FAIL was the description's row-ordering error — the session-26 lesson repeat; re-verified with the corrected newest-first description)
- [x] Docs: AGENTS.md (the REASON-TRAIL-1 contract), CLAUDE.md (the session-30 contract + the 242/233 counts), README.md (the reason-trail row + the 475-test row + the 30th verification + the Testing table), PAD v1.30 (ADR-038 + the revision row + the test matrix corrected to 35 files/475), SKILL v1.30.0 (the ADR-038 index entry), docs/session_59.md, worklog.md, this plan's sign-offs
- [x] `.env.example` verified current (no new env plumbing this round; the persisted `.env` byte-equivalent coverage)
- [ ] Committed to `main` + pushed via the SSH wrapper (executed at ship: commit + dry-run + push + key shred) — checked in the commit message
