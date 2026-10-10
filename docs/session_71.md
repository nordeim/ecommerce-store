# Session 71 — Round 36: The Order Tracking Affordance ("Where's My Order?")

The standing round instruction: refresh the workspace, review the docs,
validate against the codebase, audit with the repo skills (the
`skills/` folder excluded from checking/testing/compilation — verified
in all four configs), achieve parity with the live reference (the
agent-browser walk + the sweep battery), pay particular attention to
the mobile navigation (the Tailwind v4 trap log), keep the Stripe
integration professional, keep the vitest + playwright suites healthy,
write + validate + execute a TDD remediation plan, capture dev-server
screenshots, update the docs, and push to main via the SSH wrapper.

**Workspace state.** RESET — the sandbox was re-provisioned; the repo
re-cloned from `github.com/nordeim/ecommerce-store.git` at `585259a`
(the session-35 ship `c9535e7` + the user's session_70 narrative log).
The env-shadowing trap verified LIVE: the injected shell
`DATABASE_URL` (`file:/home/z/my-project/db/custom.db`) wins over both
`.env` files — neutralized by the session-21 hard-link convergence
(inode 397013 at BOTH `db/custom.db` paths — one file, whichever
resolution wins). `bun install` · `bun run db:setup` idempotent (6
categories, 12 products, 4 users, 4 canonical orders, 3 hero slides).
The repo `skills/` exclusion re-verified in all four configs.

**Baseline gate.** lint 0/0 · tsc clean · **301/301 unit+integration
(19 files)** · build exit 0 · the FULL E2E baseline re-run **250/250
(8.1m, foreground — the L26/L27 lesson)**. The documented
session-69/70 ship state verified pre-change.

**The docs review.** AGENTS.md, CLAUDE.md, README, PAD v1.35, SKILL
v1.35.0, session_69/70, remediation-plan-session35, the worklog S35 —
the repo is 35 remediation rounds deep, 551 tests, every contract
cross-validated. The skills catalog mapped: tdd, agent-browser,
clone-app-pat-pro, plus the repo's own trap log.

**The Round-36 live battery.** The paired pixel sweep **ALL 8 ROUTES
AT BASELINE** (home 0% [6 px, both sides painted on slide
`1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%,
checkout 0.01%, account 0%, login 0.28%). **The 36th mobile-nav
verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg
rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500 with
identical hrefs; the Electronics deep-link + auto-close). The watches
clean (typeahead: the reference fires ZERO search requests; carousel
~5000ms; the SEO layer: 17-URL sitemap, robots, JSON-LD, offers.price
299.99 USD). The console census 24 routes + 11 admin surfaces CLEAN.

**The candidate triage** (session-69's list): the "where's my order"
tracking affordance CHOSEN (the first named candidate — the schema
verified to carry NO carrier/tracking fields; the arc's words end at
"In Transit" with no actionable answer). The rate-limiter store
re-deferred (the PAD's open Medium, unchanged). The payments-surface
Stripe-dashboard deep-link re-deferred (the configured-mode gate,
unchanged).

**THE DELIVERABLE (ORDER-TRACKING-1, ADR-044)** — two columns, one
seam, one action, one island, two read rows, one fixture round:

- **The columns** (`prisma/schema.prisma`): `Order.carrier String?` +
  `Order.trackingNumber String?` (additive nullable — the
  paymentStatus precedent): the order's RESTING tracking state,
  rendered from the row like `cardLast4`, never derived from events.
- **The pure seam** (`src/lib/order-tracking.ts`):
  `orderTrackingView(carrier, trackingNumber)` — a discriminated union
  (the order-money-state precedent: the calm state carries NO fields).
  The canonical carrier map (ups/fedex/usps/dhl → the public tracking
  URL, the code `encodeURIComponent`-substituted); a case-insensitive
  + whitespace-trimmed key match ("UPS"/"ups"/" ups " link
  identically); unknown carriers → the raw label + `href: null` (the
  raw passthrough — the number still renders); either side missing →
  `{ visible: false }` (the pair contract).
- **The write path** (`setOrderTrackingAction` in
  `src/lib/actions/admin.ts`): admin-gated, `trackingSchema`-validated
  (carrier trim 1–40, number trim 4–64), the no-op guard on the
  identical pair (the status-action precedent), overwrite semantics
  (corrections append the auditable event), and the `tracking_added`
  OrderEvent whose note carries the operator attribution (the console
  renders it; the customer timeline NEVER does — R10-2).
- **The timeline seam extension**: `tracking_added` → "Tracking
  added" (the note structurally absent from the row type); the
  customer detail's icon map gains `PackageCheck`.
- **The surfaces**: the admin detail's Shipping card (the
  "Current: UPS · 1Z…" read row + the `AdminTrackingForm` island —
  the stock-form anatomy, pre-filled); the customer detail's Shipping
  card (the Tracking line — the number an external safe-opener anchor
  in `text-primary` when the href composes, plain text for unknown
  carriers; the calm state renders nothing).
- **The fixtures**: ORD-2026-002 (in-transit) carries `UPS` +
  `1Z999AA10123456784` + `evt-ord2-tracking` (deterministic id,
  preserved across e2e-reset via `SEEDED_ORDER_EVENT_IDS` +
  `tracking_added` joining the wiped types; the seed's convergence
  update restores the columns the paid-columns way; dev-cleanup
  mirrors; the admin E2E's per-run FedEx write on ORD-2026-003 is
  cleared by the reset).

**The plan** — docs/remediation-plan-session36.md written and
validated file-by-file against the codebase (the E2E impact census:
account.spec runs before admin.spec alphabetically — no intra-run
pollution; the existing ORD-2026-002 timeline NOT pinned (session-35
pinned 001 + 004 only); the a11y census pages read the Payment card —
the tracking row lives in the Shipping card).

**TDD RED:** 11 unit contracts (the module absent — the import fails)
+ 1 timeline case pin + 2 E2E tests. All failed for the RIGHT reasons
(the tracking link absent; the form absent; the label raw). One
design revision during RED: the calm-state pin wanted the
discriminated-union shape (the order-money-state precedent) — the
seam refactored from empty-string fields to `{ visible: false }`
carrying NO fields before the first GREEN run.

**TDD GREEN:** the columns → the seam → the validation + action → the
timeline case → the admin island + rows → the customer row → the
fixtures. Targeted runs green at each step; the full unit layer
**313/313** (301 + 12). Both a11y census pins HELD at their existing
values with the new rows present (customer detail 8, admin
order-detail 7 — the new pairings match the counted families; no
recalibration needed).

**Mutations ×3, each caught + byte-exact revert (md5-verified):** M1
the href composition dropped (a known carrier links nowhere) → unit
×6 (every canonical-URL pin) AND the E2E anchor pin (the rebuilt
artifact verified); M2 the consumer's calm-state gate broken (the
customer card renders the tracking block unconditionally) → the E2E
calm pin (ORD-2026-001 renders the row) while the seam's unit pins
stay green — the CONSUMER is the defect; M3 the timeline case dropped
(the raw type renders) → the unit pin AND the E2E label pin.

**Full gate:** lint 0/0 · tsc clean · 313/313 unit+integration ·
build exit 0 · **the FULL E2E 252/252 (8.2m) × 2 consecutive runs on
the final code (565 total)**.

**Post-change battery:** the sweep re-run ALL 8 ROUTES AT BASELINE;
the 36th mobile-nav verification re-run TOKEN-EXACT again; the
watches + census clean (the two touched routes already in the census
walk).

**Screenshots 191–195** (the remediated app, captured against the
production standalone on :3001 — the exact shipped artifact): the
ORD-2026-002 customer detail with the tracking line + the three-row
timeline (fullPage), the tracking-line close-up (the element
capture), the admin order-detail with the tracking form + the "Current:"
row (fullPage), the ORD-2026-001 calm-state detail (no tracking row,
fullPage), home — the live DOM probed BEFORE the VLM run
(probe-r36.mjs: the anchor href/target/class, the timeline labels,
the pre-filled form inputs, the calm state's absence all verified);
**VLM 5/5 PASS** (no description corrections needed this round — the
probe-first discipline paid off).

**Docs:** AGENTS.md (the ORDER-TRACKING-1 architecture rule), CLAUDE.md
(the session-36 contract + the 313/252 counts), README (the 565-test
row + the account-dashboard tracking clause + the admin-console write
surface + the 36th mobile-nav verification), PAD v1.36 (ADR-044 + the
revision row), SKILL v1.36.0 (the ADR-044 row), this log, the worklog
S36 entry, the plan's sign-offs. `.env.example` verified current — the
round adds NO env plumbing.

## Round 36 shipped ✅
**Session 71 complete** — the baseline 551-test gate verified on the
fresh clone (the env-shadowing trap re-neutralized by the hard link);
the Round-36 battery (sweep + 36th mobile-nav + watches + census) all
clean pre-change and re-verified post-change.
**The deliverable: ORDER-TRACKING-1 (ADR-044)** — the "where's my
order" affordance: the operator records carrier + tracking number on
the order detail; the customer's in-transit order detail carries the
Tracking line with the carrier's public track link and the
"Tracking added" timeline milestone. The columns are the resting
state (rendered from the row like cardLast4); the event is the audit
trail (the operator note structurally absent from the customer
timeline — R10-2).
**Gate: 565 tests** (313 unit+integration + 252 E2E), two consecutive
full runs, triple-mutation-proven. Committed to `main`, pushed via the
SSH wrapper (remote verified, key shredded).
**Suggested next:** the two standing credential-gated items remain
(Stripe test-mode keys — would drive the refund action's SDK path
live AND unlock the deferred dashboard deep-link; an email provider —
would unlock the deferred guest-order merge-back behind the
verification gate). The next audit-derived candidates: (1) a
customer-facing shipping-estimate/delivery-window surface (no schema
change — composed from the status + placedAt); (2) the rate-limiter
store migration (unchanged, the PAD's open Medium); (3) the deferred
payments-surface Stripe-dashboard deep-link (unchanged, the
configured-mode gate).
