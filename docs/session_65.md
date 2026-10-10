# Session 65 — Round 33: The Customer-Side Money-State Mirror

The standing round instruction: refresh the workspace, review the docs,
validate against the codebase, audit with the repo skills (the
`skills/` folder excluded from checking/testing/compilation — verified
in all four configs), achieve parity with the live reference (the
agent-browser walk + the sweep battery), pay particular attention to
the mobile navigation (the Tailwind v4 trap log), keep the Stripe
integration professional, keep the vitest + playwright suites healthy,
write + validate + execute a TDD remediation plan, capture dev-server
screenshots, update the docs, and push to main via the SSH wrapper.

**Workspace state.** RESET this round — the sandbox was rebuilt (a bare
`/home/z/my-project` with no clone). Fresh `git clone` at `701cd29`;
`bun install` (one lightningcss tarball retry); `.env` written with the
repo contract `DATABASE_URL="file:../db/custom.db"`; the env-shadowing
trap LIVE again (the parent `/home/z/my-project/.env` injects an
absolute path and wins) — neutralized the session-21 way: `db:setup`
ran against the injected path, then a hard link converged both paths on
one inode. The repo `skills/` exclusion re-verified in all four configs.

**Baseline gate.** lint 0/0 · tsc clean · **269/269 unit+integration
(16 files)** · build exit 0 (25 routes) · the FULL E2E baseline re-run
**238/238 (7.8m, foreground — the L26/L27 lesson)**. The documented
session-63/64 ship state verified pre-change.

**The docs review.** AGENTS.md, CLAUDE.md, README, PAD v1.32, SKILL
v1.32.0, session_63/64, remediation-plan-session32, the worklog S32 —
the repo is 32 remediation rounds deep, 507 tests, every contract
cross-validated. The skills catalog mapped: tdd, agent-browser,
clone-app-pat-pro, plus the repo's own trap log.

**The Round-33 live battery.** The paired pixel sweep **ALL 8 ROUTES
AT BASELINE** (home 0% [6 px, both sides painted on slide
`1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%,
checkout 0.01%, account 0%, login 0.28%). **The 33rd mobile-nav
verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg
rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500
with identical hrefs; the Electronics deep-link + auto-close). The
watches clean (typeahead: the reference fires ZERO search requests;
carousel ~5000ms; the SEO layer: 17-URL sitemap, robots, JSON-LD,
offers.price 299.99 USD). The console census 24 routes + 11 admin
surfaces CLEAN.

**The candidate triage** (session-63's list): the customer-side
money-state mirror CHOSEN — the payments family (ADR-030..040) built
every OPERATOR surface for the refund state, but the CUSTOMER half
never shipped: `OrderRow` carried no `paymentStatus` (a fully refunded
order was indistinguishable from a fulfilled-and-kept one in the
history tab), and the confirmation's money line handled `paid` only
(a refunded order revisiting its confirmation rendered NOTHING). The
information asymmetry was total. The payments-surface Stripe-dashboard
deep-link DEFERRED (the configured-mode gate — renders nothing in demo
mode; a standing E2E can't exercise it without fixture keys). The
rate-limiter store re-deferred (the PAD's open Medium, unchanged).

**THE DELIVERABLE (CUSTOMER-MONEY-1, ADR-041)** — one pure seam module,
two consumer surfaces, one E2E fixture:

- **The seam** (`src/lib/order-money-state.ts`, Prisma-free;
  `formatCents` via the pure-to-pure import): (a)
  `orderRefundLineView(paymentStatus, totalCents)` — the history row's
  line, visible ONLY on `"refunded"` → the muted "Refunded · $X
  returned" under the date; history NEVER shows a paid line (the
  DASH-ALERT-1 alert-fatigue lesson) and non-refunded rows keep the
  reference's exact anatomy (`{visible:false}` = no DOM delta). (b)
  `confirmationMoneyLineView(paymentStatus)` — the confirmation's
  line: the paid wording byte-exact from session-22, the refunded
  state carrying the customer-safe copy (R10-2: no operator
  vocabulary); the mb rhythm keys off the line's visibility.
- **The surfaces**: `OrderRow` gains `paymentStatus` (the page's query
  already fetched the full row); the row's left block renders the line
  under the date; the confirmation composes the same seam for both
  branches.
- **The fixture** (`ORD-2026-004`): john's fourth order — 1× Ceramic
  Planter Set $79.99 (matching `evt_demo_fixture_r`'s refunded amount
  exactly), status `cancelled` (the refundEligibility design's own
  example in its post-refund resting state), `paymentStatus
  "refunded"` + intent `pi_demo_fixture_005` linking the EXISTING
  evt_demo_fixture_r (its orphan story graduated to the linked shape;
  the payments surface's row/count pins unchanged), placedAt 18
  minutes before the refund event's receivedAt, and a
  `payment_refunded` OrderEvent (the reflection's note format) — the
  fixture's admin order-detail renders full coherence ("Refunded
  (Stripe)" Charge row, "Refunded" Payment events row, "Payment
  refunded" Timeline entry, no refund button). Restored idempotently:
  the seed's paid-columns update pattern + the e2e-reset/dev-cleanup
  guards (004 joins CANONICAL_ORDERS; the admin orders count line
  moved to "4 orders" — the delivered/in_transit filter pins
  unchanged).

**The plan** — docs/remediation-plan-session33.md written and
validated file-by-file against the codebase (every consumer grepped,
every count pin enumerated — including the "4 payment events" set that
kept Option B minimal: linking the EXISTING event instead of adding a
5th).

**TDD RED:** 9 unit contracts (the module absent — the import fails) +
2 E2E tests (the fixture absent — "ORD-2026-004" never renders). All
failed for the RIGHT reasons.

**TDD GREEN:** the seam → the fixture (seed + restores) → the history
surface → the confirmation surface → the admin count-pin updates.
Targeted runs green at each step; the full unit layer **278/278** (269
+ 9).

**Mutations ×3, each caught + byte-exact revert (md5-verified):**
M1 the paid calm case dropped from the history seam → 2 unit failures
+ the E2E account test fails on the paid fixture's no-line pin; M2 the
confirmation's refunded copy broken → the unit text contract fails;
M3 the consumer's calm-state gate broken (any non-null payment renders
a line) → the E2E paid-row pin fails.

**Full gate:** lint 0/0 · tsc clean · 278/278 unit+integration · build
exit 0 · **the FULL E2E 240/240 (7.9m) × 2 consecutive runs on the
final code (518 total)**.

**Post-change battery:** the sweep re-run ALL 8 ROUTES AT BASELINE
(the touched surfaces are the customer order rows + the confirmation;
the account route re-checked); the 33rd mobile-nav verification
TOKEN-EXACT again; the watches + census clean.

**Screenshots 176–180** (the remediated app, captured against the
production standalone — the exact shipped artifact): the account
orders tab (the refund line), the refunded confirmation, the admin
orders list (4 canonical rows), the ORD-2026-004 order-detail (the
fixture's full coherence), home — **VLM 5/5 PASS** after one
description correction (the row-order phrasing had omitted a row's
date, making the sequence unverifiable — the round-32 lesson again:
describe reality, not intention; the probe scripts
`probe-r33.mjs`/`probe-r33b.mjs` verified the live DOM text BEFORE the
VLM run).

**Docs:** AGENTS.md (the CUSTOMER-MONEY-1 architecture rule), CLAUDE.md
(the session-33 contract + the 278/240 counts), README (the 518-test
row + the account-dashboard feature row + the 33rd mobile-nav
verification), PAD v1.33 (ADR-041 + the revision row), SKILL v1.33.0
(the ADR-041 row), this log, the worklog S33 entry, the plan's
sign-offs. `.env.example` verified current — the round reads existing
columns only, no new plumbing.

## Round 33 shipped ✅
**Session 65 complete** — the baseline 507-test gate verified on the
freshly cloned workspace; the Round-33 battery (sweep + 33rd
mobile-nav + watches + census) all clean; the candidate triage defers
the Stripe-dashboard deep-link on the configured-mode gate and
re-defers the rate-limiter store.
**The deliverable: CUSTOMER-MONEY-1 (ADR-041)** — the customer-side
money-state mirror: the payments family's customer half. The order
history surfaces the refund state (the seam-composed line, the calm
state everywhere else), and the confirmation reflects it (the paid
wording preserved, the refunded copy customer-safe). The information
asymmetry is closed.
**Gate: 518 tests** (278 unit+integration + 240 E2E), two consecutive
full runs, triple-mutation-proven. Committed to `main`, pushed via the
SSH wrapper (remote verified, key shredded).
**Suggested next:** the two standing credential-gated items remain
(Stripe test-mode keys — would drive the refund action's SDK path
live AND unlock the deferred dashboard deep-link; an email provider —
would unlock the deferred guest-order merge-back behind the
verification gate). The next audit-derived candidates: (1) the
deferred payments-surface Stripe-dashboard deep-link (the
configured-mode operator affordance), (2) the account orders tab could
deep-link each row to the admin-visible order detail for the customer
(a "view order" affordance — the customer-side read surface for the
full order), (3) the deferred rate-limiter store migration (unchanged).
