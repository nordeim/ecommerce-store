# Session 81 — Round 41: ORDER-WINDOW-1 — The Orders Surface's Date-Range Window ("The Sibling Treatment")

The standing round instruction: refresh the workspace, review the docs,
validate against the codebase, audit with the repo skills (the
`skills/` folder excluded from checking/testing/compilation — verified
in all four configs), achieve parity with the live reference (the
agent-browser walk + the sweep battery), pay particular attention to
the mobile navigation (the Tailwind v4 trap log), keep the Stripe
integration professional, keep the vitest + playwright suites healthy,
write + validate + execute a TDD remediation plan, capture dev-server
screenshots, update the docs, and push to main via the SSH wrapper.

**Workspace state.** NOT reset — `git pull` (fast-forward `3b07259 →
ecc3f54`, the user's session_80.md narrative log). The env-shadowing
trap re-verified LIVE (the injected shell `DATABASE_URL` wins over the
repo `.env`) — the session-40 hard-link convergence HELD (inode 134504
at both `db/custom.db` paths; no re-convergence needed). The repo
`skills/` exclusion re-verified in all four configs.

**Baseline gate.** lint 0/0 · tsc clean · **344-test-ward 332/332
unit+integration (21 files)** · build exit 0 · the FULL E2E baseline
re-run **254/254 (8.3m, foreground — the L26/L27 lesson)**. The
documented session-79/80 ship state verified pre-change.

**The docs review.** AGENTS.md, CLAUDE.md, README, PAD v1.40, SKILL,
session_79/80, remediation-plan-session40, the worklog S40 — the repo
is 41 remediation rounds deep, 586 tests, every contract
cross-validated. The skills catalog mapped: tdd, agent-browser,
clone-app-pat-pro, code-review-checklist, code-quality-standards, plus
the standing drift watch `scripts/verify-docs-align-r40.mjs` (re-run
GREEN 25/25 at audit start).

**The Round-41 live battery (pre-change).** The paired pixel sweep
**ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, both sides painted on
slide `1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%,
checkout 0.01%, account 0%, login 0.28%). **The 41st mobile-nav
verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg
rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500 with
identical hrefs; the Electronics deep-link + auto-close). The standing
watches clean (typeahead: the reference fires ZERO search requests;
carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots,
JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11
admin surfaces CLEAN.

**The code audit (the session-79 suggested-next: the operator surfaces
— the admin-* + stripe-* families, read line-by-line, the
12-category/six-axis lenses).** CLEAN — no real bugs. The full family
read first-hand: the five admin pages (dashboard/orders/orders-detail/
products/payments — every query bounded, no N+1, the outcome resolution
in one query, the shared-seam compositions intact), the seven admin
components (the filters' adjust-during-render + canonical re-emission,
the rows' pending/error anatomy, the tracking form, the refund control),
the five lib seams (admin-orders/admin-payments/admin-products/
stripe-payment/stripe-config), the three action modules
(admin/checkout/stripe), the webhook route (the H4d/L9 transactional
discipline), stripe.ts (the lazy client), and the checkout island
(checkout-flow + stripe-pay). The E2E coverage cross-check: 32 admin +
5 stripe tests — every operator behavior pinned. Two zero-behavior
`{ }` dead JSX artifacts noted (admin-product-row L60, checkout-flow
L369 — render nothing; left in place: the discipline does not touch a
parity surface without cause).

**The candidate triage (session-79's list):** the operator-surface
audit sweep DONE (clean) — it produced ONE audit-derived candidate:
**ORDER-WINDOW-1 (CHOSEN)** — the orders surface is the only LIST
surface without a time dimension (it predates the payments surface's
date-range extension by 13 sessions — session-13 ADMIN-SEARCH-1 vs
session-26 PAY-OPS-3 — and never received the treatment its own sibling
family established); the take-100 ceiling was unmitigated (rows beyond
the newest 100 unreachable — the payments date range is exactly that
reach-past tool); zero parity risk (the reference has no admin console
— pure superset). The rate-limiter store migration re-deferred (the
PAD's open Medium; correct for single-instance SQLite — the migration
note reads "before scaling horizontally"); the per-order
shipping-method surface re-deferred (the session-38 parity ruling);
the credential-gated items unchanged (no Stripe test-mode keys or
email provider provided).

**THE DELIVERABLE (ORDER-WINDOW-1, ADR-048)** — the PAY-OPS-3
treatment applied to the orders surface + the shared day-bounds seam:

- **The shared seam `src/lib/day-bounds.ts`** — `parseDayBound` (the
  strict YYYY-MM-DD validation: shape + Date round-trip; 2026-02-30
  normalizes to March 2, month 13 parses NaN) + `utcDayBounds` (the
  [fromStart, toEnd) UTC day-boundary range — `gte` from's midnight,
  `lt` the midnight AFTER to, 86,400,000ms), extracted from
  admin-payments' private helpers (the session-35 formatTimelineDate
  precedent: when a SECOND surface needs the same pure helper, it moves
  to a shared seam instead of being copied). admin-payments composes it
  with ZERO behavior change — its 54 unit pins (which pin the boundary
  `Date` values exactly) re-ran green through the refactor.
- **The orders seam** — `parseAdminOrderFilters` gains `from`/`to`
  (each bound validates independently, an inverted pair drops
  together); `buildAdminOrderWhere` composes the `placedAt` clause as
  the flat shape's third key (Prisma ANDs top-level keys — every
  pre-round where shape byte-identical: the date keys were simply
  absent before).
- **The island** — `AdminOrderFilters` gains the two
  `<Input type="date">` bounds (the AdminPaymentFilters anatomy
  exactly: the CalendarRange glyph, "From date"/"To date" aria-labels,
  w-[150px], URL-controlled values) with the canonical re-emission
  order `(status, q, from, to)`.
- **The page** passes `activeFrom`/`activeTo`; the count line and take
  bound unchanged (the window is the reach-past tool, not a pagination).

**TDD RED:** the unit date pins written first — 10 failures on
assertions (the parser returned no from/to — undefined; the
where-builder ignored the keys) with the carried-over pins green (the
two negative-parse pins that align with current behavior passed by
design — the family's fall-through contract). The E2E date family
written against the pre-change build — 6 failures (the missing "From
date"/"To date" inputs; the date deep-links rendering the unfiltered
list). RED for the right reasons at both layers.

**TDD GREEN:** the five batches — day-bounds.ts; the admin-payments
refactor to compose it (54/54 green — the refactor proof); the orders
seam extension (the RED unit pins 24/24); the island (the two date
inputs + the canonical order); the page wiring. Lint 0/0 · tsc clean ·
344/344 unit · build 0 · the E2E date family green (the admin spec
39/39).

**Mutations ×3, each caught + byte-exact revert (md5
b9dc507d…/1688a8fe…/f2f02d70… verified at every step):** M1 the seam's
inverted-pair drop removed → 1 unit failure (exactly the inverted-pair
pin); M2 the shared module's day-after offset removed (`lt` =
`to`'s own midnight) → **8 failures at BOTH seams** (4 in admin-orders'
new pins + 4 in admin-payments' existing where pins — one shared-module
mutation, two seams' guards fired: the shared-seam proof); M3 the
island's canonical re-emission order broken (`from` before `status`)
→ the E2E merged-params URL pin — after the first run PASSED against
the stale artifact, the session-36 lesson re-learned: the artifact must
be REBUILT for the E2E proof; rebuilt, re-run, caught.

**Full gate:** lint 0/0 · tsc clean · **344/344 unit+integration** ·
build 0 · **the FULL E2E 260/260 (8.3m) + 260/260 (8.7m) × 2
consecutive runs on the final code — 604 total** (up from 586: +12
unit, +6 E2E).

**Post-change battery:** kill-by-port FIRST (the round-39 stale-server
lesson), fresh boot, then the sweep re-run ALL 8 ROUTES AT BASELINE;
the **42nd mobile-nav verification** re-run TOKEN-EXACT (the 41st and
42nd in one round — pre- and post-change); watches + census clean.

**Screenshots 216–220** (the remediated app, captured against the
production standalone on :3001 — the exact shipped artifact): the
orders surface filtered by the March window (probe-verified: the URL
`?from=2026-03-01&to=2026-03-31`, the count "2 orders", the date-input
VALUES "2026-03-01"/"2026-03-31", the rows [ORD-2026-001,
ORD-2026-002] — the February pair excluded), the bar close-up at 2x
(the round-38 OCR lesson), the calm state (4 rows, EMPTY date inputs,
no Clear), the combined filter (`?status=delivered&from=2026-03-01` —
the canonical URL order, "1 order", rows [001]), and the mobile nav
open (the standing watch surface — after one honest capture correction:
the first attempt clicked the LAST banner button; the standing
protocol's form is the FIRST). **VLM 5/5 PASS after one reality
correction** — the 217 description expected the ISO value form
"2026-03-01" but the browser RENDERS `<input type="date">` in the
en-US locale form "03/01/2026": the DOM probe stays authoritative for
the VALUE (ISO), the description describes the RENDERING (locale) —
the round-40 214 lesson repeating: read the surface, then describe it.

**Docs:** PAD **v1.41** (ADR-048 + the §3.2 tree's day-bounds row +
§12's row + the §8.1 admin rows + the §8.4 checklist 344/260 + the
v1.41 revision row), SKILL **v1.41.0** (the lib inventory 27→28 + the
admin family's date note + Appendix C → session41 + the MISSED v1.40.0
version-header bump repaired — a first-hand audit finding: round 40's
commit claimed "SKILL v1.40.0" but the `version:` header was never
bumped, still 1.39.0; now 1.41.0), AGENTS (the orders rule + the E2E
row), CLAUDE (the orders rule + 344/260), README (the key-features
rows + the Testing table), the verifier's ADR recalibration 47→48
(the drift watch re-run GREEN 25/25 — its five test-count spots
unchanged by design), this log, the worklog S41 entry, the plan's
sign-offs. `.env.example` verified current (the round adds NO env
plumbing).

## Round 41 shipped ✅
**Session complete** — the baseline 586-test gate verified on the pulled
workspace (the env-shadowing trap neutralized by the standing hard-link
convergence); the Round-41 battery (sweep + the 41st + 42nd mobile-nav
+ watches + census) all clean pre-change and re-verified post-change.
**The deliverable: ORDER-WINDOW-1 (ADR-048)** — the orders surface's
date-range window: the shared `day-bounds` seam (parseDayBound +
utcDayBounds) extracted from admin-payments' private helpers with zero
behavior change (the 54 payments pins the proof), the orders seam's
parser + where-builder extended (the flat shape's third key — every
pre-round where shape byte-identical), the island's two URL-controlled
date inputs (the AdminPaymentFilters anatomy, the canonical re-emission
order status/q/from/to), and the page wiring. **Gate: 604 tests** (344
unit + 260 E2E × 2 consecutive runs), triple-mutation-proven (M2 the
shared-module proof: one mutation, both seams' guards fired), sweep +
mobile-nav + watches + census all clean.
**New lessons:** (1) a shared-seam round's mutation proof is the
strongest form — one mutation in the module fires every consumer's
guards; (2) the session-36 lesson repeats at the E2E layer: the
artifact must be rebuilt for EVERY E2E mutation proof (M3 passed
against the stale build — caught only after the rebuild); (3) the
native `<input type="date">` renders the LOCALE form (MM/DD/YYYY in
en-US) while the DOM value attribute stays ISO — probe the value,
describe the rendering (the round-40 214 lesson, again).
**Suggested next:** the standing credential-gated items remain (Stripe
test-mode keys — the refund action's SDK path live + the
Stripe-dashboard deep-link; an email provider — the guest-order
merge-back). The rate-limiter store migration stays the PAD's open
Medium (re-deferred — correct for single-instance SQLite). The
operator-surface audit is now complete (this round closed its one
candidate); the next audit sweep's natural targets: the customer
surfaces' E2E pin density (a fresh census of which behaviors lack
exact-string pins), or the `take: 100` pagination ceiling (a
future round if the fixture scale ever demands it). Just send the next
round instruction when ready.
