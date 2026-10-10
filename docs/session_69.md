# Session 69 — Round 35: The Customer-Safe Order Timeline + the Confirmation Deep-Link

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
`61f5727 → e27aeb1` (the user's session_68.md narrative log only, zero
code delta). The session-21 hard-link convergence INTACT (inode 172490
at both `db/custom.db` and the sandbox-injected parent path — the
env-shadowing trap neutralized by the link); `bun run db:setup` re-run
idempotent (4 canonical orders). The repo `skills/` exclusion
re-verified in all four configs.

**Baseline gate.** lint exit 0 **but 1 warning** (the round-34 capture
script's unused expression — §2.4 of the plan, fixed this round) · tsc
clean · **285/285 unit+integration (18 files)** · build exit 0 · the
FULL E2E baseline re-run **246/246 (8.0m, foreground — the L26/L27
lesson)**. The documented session-67/68 ship state verified pre-change.

**The docs review.** AGENTS.md, CLAUDE.md, README, PAD v1.34, SKILL
v1.34.0, session_67/68, remediation-plan-session34, the worklog S34 —
the repo is 34 remediation rounds deep, 531 tests, every contract
cross-validated. The skills catalog mapped: tdd, agent-browser,
clone-app-pat-pro, plus the repo's own trap log.

**The Round-35 live battery.** The paired pixel sweep **ALL 8 ROUTES
AT BASELINE** (home 0% [6 px, both sides painted on slide
`1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%,
checkout 0.01%, account 0%, login 0.28%). **The 35th mobile-nav
verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg
rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500 with
identical hrefs; the Electronics deep-link + auto-close). The watches
clean (typeahead: the reference fires ZERO search requests; carousel
~5000ms; the SEO layer: 17-URL sitemap, robots, JSON-LD, offers.price
299.99 USD). The console census 24 routes + 11 admin surfaces CLEAN
(incl. the session-34 customer-detail walk).

**The candidate triage** (session-67's list): the customer-safe order
timeline + the checkout-success deep-link CHOSEN (session-67's two
named candidates — the timeline was session-34's deliberate exclusion
with the mapping named as the unlock; the deep-link was the second
suggestion). The payments-surface Stripe-dashboard deep-link re-DEFERRED
(the configured-mode gate — unchanged, no fixture keys). The
rate-limiter store re-deferred (the PAD's open Medium, unchanged).
Plus one hygiene finding: the lint contract had drifted to 0 errors /
1 warning (the round-34 capture script) — restored to 0/0.

**THE DELIVERABLE (CUSTOMER-TIMELINE-1 / CHECKOUT-DEEPLINK-1,
ADR-043)** — one seam, one surface, one fixture round, one companion
affordance:

- **The seam** (`src/lib/order-timeline.ts`):
  `customerOrderTimeline(events)` maps OrderEvent rows to `{ key, type,
  label, at }` — `placed` → "Order placed"; `status_changed` → the note
  parsed the parse-family way (`"{old} → {new} by {actor}"` → the new
  status slug → composed through the session-34 STATUS_LABELS seam →
  "Status updated to In Transit"; malformed/null notes fall through to
  "Status updated"); `payment_succeeded` → "Payment received"
  (session-22's wording); `payment_failed` → "Payment failed";
  `payment_refunded` → "Payment refunded"; unknown types → the raw type
  (the paymentEventLabel raw-passthrough precedent). **The row type has
  NO note field — the operator attribution leak is structurally
  impossible, not filtered** (R10-2). `formatTimelineDate(iso)` extracts
  the admin detail's exact en-US timestamp shape; the admin's two
  inline copies refactored to the seam (zero behavior delta).
- **The surface** (the Timeline card on `/account/orders/[id]`): after
  the Items card — the account family's card language over the admin's
  `<ol>` row anatomy; the icons stay in the page (presentation).
- **The fixtures**: the seed gains status_changed events with the admin
  action's EXACT note format (the attribution is the point — the E2E
  pins the no-leak property against REAL notes), deterministic ids
  (`evt-ord1-transit`, …) preserved across e2e-reset
  (`SEEDED_ORDER_EVENT_IDS`, the FIXTURE_EVENT_IDS pattern — the
  combobox spec's per-run events wiped, the canonical story survives
  every reset), and the placed events' `createdAt` converged to
  `placedAt` (the idempotent convergence block; ORD-2026-003 needed its
  own convergence pass — it carries no fixture events, so the first
  loop skipped it).
- **The companion affordance** (the confirmation deep-link): "View
  Orders" → `/account/orders/${order.id}` for the OWNER only; the guest
  token view and the generic view keep `/account` (the GUEST-TOKEN-1
  discipline — a guest order's detail is not-found for everyone but the
  token). The href is the only delta (zero visual delta).
- **The hygiene rider**: `scripts/capture-round34.mjs`'s unused
  expression became a statement — the documented lint 0/0 restored.

**The plan** — docs/remediation-plan-session35.md written and validated
file-by-file against the codebase (every touched file read: the success
page, the detail route, the seed, the e2e-reset, the admin detail, the
four consumer specs; the admin-spec impact census verified by grep —
no event-count pins; the account-spec-runs-before-admin-spec ordering
verified — the combobox spec's per-run event cannot pollute the
timeline tests).

**TDD RED:** 16 unit contracts (the module absent — the import fails) +
4 E2E tests. Three failed for the RIGHT reasons (the Timeline heading
absent; the labels list absent; the href not deep-linked) + one
boundary guard green by design (the non-owner href — its job is the
INVERSE mutation). One test-side repair during RED: the guard test's
checkout flow missed the "Continue to Payment" click (the PayPal radio
timeout was the symptom — the error-context snapshot showed the wizard
stuck on step 1); the fix + a fill-stuck verification (cheap insurance
against the late-hydration wipe).

**TDD GREEN:** the seam → the fixtures (seed + reset) → the card → the
deep-link → the admin refactor. Targeted runs green at each step; the
full unit layer **301/301** (285 + 16). Both a11y census pins held at
their existing values with the new rows present (customer detail 8,
admin order-detail 7 — the new pairings match the counted families; no
recalibration needed). One seed-side correction during GREEN: the
placed-event convergence loop originally iterated only
fixture-bearing orders — ORD-2026-003 (placed-only) kept its seed-time
stamp; the convergence moved to its own four-order loop.

**Mutations ×3, each caught + byte-exact revert (md5-verified):** M1
the consumer bypasses the seam (the raw events render WITH notes, the
admin's pattern) → both timeline E2E tests fail on the no-attribution
pins — the unit pins stay green because the SEAM is unmolested, the
consumer is the defect; M2 the STATUS_LABELS composition dropped (the
raw slug lands in the label) → unit ×3 AND E2E ×2; M3 the deep-link
reverted (every path keeps `/account`) → the checkout E2E fails on the
href, the non-owner guard holding the inverse.

**Full gate:** lint 0/0 (the contract restored) · tsc clean · 301/301
unit+integration · build exit 0 · **the FULL E2E 250/250 (8.3m) × 2
consecutive runs on the final code (551 total)**.

**Post-change battery:** the sweep re-run ALL 8 ROUTES AT BASELINE;
the 35th mobile-nav verification re-run TOKEN-EXACT again; the watches
+ census clean (the two touched routes already in the census walk).

**Screenshots 186–190** (the remediated app, captured against the
production standalone on :3001 — the exact shipped artifact): the
ORD-2026-001 customer detail with the timeline (fullPage), the
ORD-2026-004 refunded detail with the timeline (fullPage), the owner's
confirmation (the deep-linked surface), the ORD-2026-002 in-transit
detail (the minimal timeline), home — the live DOM probed BEFORE the
VLM run (probe-r35.mjs); **VLM 5/5 PASS** after one test-side
description correction (the confirmation carries the standard
storefront chrome — the first description wrongly said "no extra
navigation elements" and the VLM correctly failed it; describing
reality, not intention, caught MY error).

**Docs:** AGENTS.md (the CUSTOMER-TIMELINE-1 + CHECKOUT-DEEPLINK-1
architecture rule + the divergence-register entries), CLAUDE.md (the
session-35 contract + the 301/250 counts), README (the 551-test row +
the account-dashboard feature row + the 19-spec/250-test tree row +
the 35th mobile-nav verification), PAD v1.35 (ADR-043 + the revision
row), SKILL v1.35.0 (the ADR-043 row), this log, the worklog S35 entry,
the plan's sign-offs. `.env.example` verified current — the round reads
existing columns only, no new plumbing.

## Round 35 shipped ✅
**Session 69 complete** — the baseline 531-test gate verified on the
pulled workspace (with the lint-warning finding); the Round-35 battery
(sweep + 35th mobile-nav + watches + census) all clean pre-change and
re-verified post-change.
**The deliverable: CUSTOMER-TIMELINE-1 / CHECKOUT-DEEPLINK-1
(ADR-043)** — the customer's order detail now carries the order's STORY
(placed → fulfillment transitions → money events) through the
operator→customer vocabulary mapping, with the operator attribution
structurally absent from the row type (impossible, not filtered); the
confirmation's "View Orders" deep-links the owner straight to the
placed order's detail. The fixture lifecycle (deterministic ids
preserved across e2e-reset + the placed-event createdAt convergence)
was the round's hardest problem — solved with the StripeEvent cleanup's
FIXTURE_EVENT_IDS pattern.
**Gate: 551 tests** (301 unit+integration + 250 E2E), two consecutive
full runs, triple-mutation-proven. Committed to `main`, pushed via the
SSH wrapper (remote verified, key shredded).
**Suggested next:** the two standing credential-gated items remain
(Stripe test-mode keys — would drive the refund action's SDK path live
AND unlock the deferred dashboard deep-link; an email provider — would
unlock the deferred guest-order merge-back behind the verification
gate). The next audit-derived candidates: (1) a customer-facing
"where's my order" progress affordance would need carrier/tracking
fields (a schema change — the schema has none today); (2) the
rate-limiter store migration (unchanged, the PAD's open Medium); (3)
the deferred payments-surface Stripe-dashboard deep-link (unchanged,
the configured-mode gate).
