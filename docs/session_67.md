# Session 67 — Round 34: The Customer Order-Detail Read Surface

The standing round instruction: refresh the workspace, review the docs,
validate against the codebase, audit with the repo skills (the
`skills/` folder excluded from checking/testing/compilation — verified
in all four configs), achieve parity with the live reference (the
agent-browser walk + the sweep battery), pay particular attention to
the mobile navigation (the Tailwind v4 trap log), keep the Stripe
integration professional, keep the vitest + playwright suites healthy,
write + validate + execute a TDD remediation plan, capture dev-server
screenshots, update the docs, and push to main via the SSH wrapper.

**Workspace state.** NOT reset — `git pull` fast-forwarded
`8bd5bb2 → da842f6` (the user's session_66.md narrative log only, zero
code delta). The session-21 hard-link convergence INTACT (inode 172490
at both `db/custom.db` and the sandbox-injected parent path — the
env-shadowing trap verified live via `bun -e`, neutralized by the
link); `bun run db:setup` re-run idempotent (4 canonical orders — the
ORD-2026-004 fixture present). The repo `skills/` exclusion
re-verified in all four configs.

**Baseline gate.** lint 0/0 · tsc clean · **278/278 unit+integration
(17 files)** · build exit 0 · the FULL E2E baseline re-run **240/240
(8.1m, foreground — the L26/L27 lesson)**. The documented
session-65/66 ship state verified pre-change.

**The docs review.** AGENTS.md, CLAUDE.md, README, PAD v1.33, SKILL
v1.33.0, session_65/66, remediation-plan-session33, the worklog S33 —
the repo is 33 remediation rounds deep, 518 tests, every contract
cross-validated. The skills catalog mapped: tdd, agent-browser,
clone-app-pat-pro, plus the repo's own trap log.

**The Round-34 live battery.** The paired pixel sweep **ALL 8 ROUTES
AT BASELINE** (home 0% [6 px, both sides painted on slide
`1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%,
checkout 0.01%, account 0%, login 0.28%). **The 34th mobile-nav
verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg
rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500
with identical hrefs; the Electronics deep-link + auto-close). The
watches clean (typeahead: the reference fires ZERO search requests;
carousel ~5000ms; the SEO layer: 17-URL sitemap, robots, JSON-LD,
offers.price 299.99 USD). The console census 24 routes + 11 admin
surfaces CLEAN.

**The candidate triage** (session-65's list): the customer
order-detail read surface CHOSEN — the customer's per-order view was a
one-line history row plus the ephemeral token-gated confirmation; no
persistent detail, no affordance, while the operator console has held
the full `/admin/orders/[id]` read surface since session-7 (ADR-015).
Every high-end store's account area links each order row to its
detail. The payments-surface Stripe-dashboard deep-link re-DEFERRED
(the configured-mode gate — unchanged, no fixture keys). The
rate-limiter store re-deferred (the PAD's open Medium, unchanged).

**THE DELIVERABLE (CUSTOMER-ORDER-DETAIL-1, ADR-042)** — one route,
one seam extraction, one affordance:

- **The route** (`/account/orders/[id]`): the customer's persistent
  per-order view, the DATABASE id (the admin-detail convention),
  owner-gated the GUEST-TOKEN-1 way — anonymous → the REDIRECT-1
  exact-path login redirect; a signed-in non-owner, an unknown id, and
  a guest order ALL render the same generic in-chrome "Order not
  found" block (existence is never confirmed to a non-owner). noindex
  (the CHECKOUT-SEO-1 belt-and-suspenders). The read surface: the
  header (the "← Orders" back link, the number h1, the STATUS pill,
  the total) + the Payment card (method + `···· 4242`, the placed
  date, the money state via `confirmationMoneyLineView` — the
  per-order read vocabulary) + the Shipping Address card (the parsed
  JSON snapshot) + the Items card (the snapshot rows + the totals
  block). NO OrderEvent timeline (operator attribution — the R10-2
  rule).
- **The seam** (`src/lib/order-status.ts`): `STATUS_STYLES` /
  `STATUS_LABELS` (the session-9 reference-measured badge vocabulary)
  + `formatOrderDate` extracted from the client account-tabs — a
  `"use client"` module's plain-object exports are CLIENT REFERENCES,
  not importable values from server components; the pure seam lets the
  tabs and the server page share one source. `formatOrderDate` is
  E2E-pinned via both consumers, deliberately NOT unit-pinned to a
  calendar day (a fixed UTC instant renders different local days
  under different runner TZs).
- **The affordance**: the history rows' order numbers are `<Link>`s
  (the admin-console precedent) — the `<p>` KEEPS `font-semibold`
  (the pinned numberWeight: 600 assertion reads the p) and the anchor
  inherits color/decoration via the Tailwind v4 preflight — the
  resting visual byte-identical (the zero-visual-delta superset
  pattern; registered in the divergence log).

**The plan** — docs/remediation-plan-session34.md written and
validated file-by-file against the codebase (the preflight anchor rule
verified in node_modules/tailwindcss/preflight.css before the design
was committed; the account.spec anatomy pins re-read to confirm the
`<p>`-wraps-Link structure keeps every assertion green).

**TDD RED:** 7 unit contracts (the module absent — the import fails) +
6 E2E tests (5 account + 1 a11y census — the link absent, the route
absent). All failed for the RIGHT reasons.

**TDD GREEN:** the seam → the route → the tabs refactor + the link.
Targeted runs green at each step; the full unit layer **285/285**
(278 + 7); the a11y census calibrated at {color-contrast} × 8 (the
QUALITY-pin pattern — the measured profile was clean, only the count
needed pinning). Two test-side corrections along the way (the
toHaveURL full-URL anchoring; the strict-mode .first() scoping) and
one fixture-name correction ("Organic Cotton **Oversized** Tee" — the
seed's actual nameSnapshot).

**Mutations ×3, each caught + byte-exact revert (md5-verified):** M1
the ownership gate inverted → 4 E2E failures (the owner locked out
AND the non-owner leaked in); M2 the seam's delivered variant weakened
→ the unit pin AND the session-9 anatomy E2E fail (the seam feeds the
history pills — the extraction single-sourced the vocabulary); M3 the
consumer's drifted money copy → the exact-text pin.

**Full gate:** lint 0/0 · tsc clean · 285/285 unit+integration · build
exit 0 (26 routes) · **the FULL E2E 246/246 (8.1m) × 2 consecutive
runs on the final code (531 total)**.

**Post-change battery:** the sweep re-run ALL 8 ROUTES AT BASELINE
(account 0% — the Link is visually inert as designed); the 34th
mobile-nav verification TOKEN-EXACT again; the watches + census clean
(the new route added to the census walk — CLEAN).

**Screenshots 181–185** (the remediated app, captured against the
production standalone — the exact shipped artifact): the account
orders tab (the linked numbers), the ORD-2026-001 customer detail
(fullPage), the ORD-2026-004 refunded detail (the money line), the
not-found block (the admin-context non-owner probe), home — **VLM 5/5
PASS** (the live DOM probed BEFORE the VLM run: probe-r34.mjs). The
capture-time lesson: a Link click immediately after the Radix tab
click races the panel's React mount — the E2E's actionability wait
absorbs it, but raw scripts must settle or waitForURL before reading
the DOM (the hydration-race quirk in its third form; the first
capture attempt read the pre-navigation DOM and was re-captured
deterministically).

**Docs:** AGENTS.md (the CUSTOMER-ORDER-DETAIL-1 architecture rule +
the divergence-register entry), CLAUDE.md (the session-34 contract +
the 285/246 counts), README (the 531-test row + the account-dashboard
feature row + the 34th mobile-nav verification), PAD v1.34 (ADR-042 +
the revision row), SKILL v1.34.0 (the ADR-042 row), this log, the
worklog S34 entry, the plan's sign-offs. `.env.example` verified
current — the round reads existing columns only, no new plumbing.

## Round 34 shipped ✅
**Session 67 complete** — the baseline 518-test gate verified on the
pulled workspace; the Round-34 battery (sweep + 34th mobile-nav +
watches + census) all clean; the candidate triage re-defers the
Stripe-dashboard deep-link (the configured-mode gate) and the
rate-limiter store (the PAD's open Medium).
**The deliverable: CUSTOMER-ORDER-DETAIL-1 (ADR-042)** — the customer
order-detail read surface: every history row's number links to an
owner-gated per-order view rendering the payment record, the shipping
address, and the itemized totals — the persistent confirmation a real
store owes its customers. The information gap between the operator
console (full detail since ADR-015) and the customer (a five-field
row) is closed.
**Gate: 531 tests** (285 unit+integration + 246 E2E), two consecutive
full runs, triple-mutation-proven. Committed to `main`, pushed via the
SSH wrapper (remote verified, key shredded).
**Suggested next:** the two standing credential-gated items remain
(Stripe test-mode keys — would drive the refund action's SDK path
live AND unlock the deferred dashboard deep-link; an email provider —
would unlock the deferred guest-order merge-back behind the
verification gate). The next audit-derived candidates: (1) a
customer-safe order timeline (the events' operator attribution would
need a customer vocabulary mapping — the deferred surface this round
excluded by design), (2) the checkout success page could deep-link
"View Orders" to the placed order's new detail page, (3) the deferred
payments-surface Stripe-dashboard deep-link (unchanged), (4) the
rate-limiter store migration (unchanged).
