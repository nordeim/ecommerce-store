# Remediation Plan — Session 36 (Round 36): The Order Tracking Affordance — "Where's My Order?" (ORDER-TRACKING-1, ADR-044)

**Date:** 2026-10-11 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `585259a` (the session-35 ship `c9535e7` + the user's session_70 narrative log)
**Status at audit start:** 551-test gate (301 unit+integration + 250 E2E), PAD v1.35, SKILL v1.35.0 — lint 0/0 · tsc clean · 301/301 unit+integration (19 files) · build exit 0 · the full E2E baseline re-run **250/250 (8.1m, foreground)** verified on the fresh clone.

## 0. The round's mandate

The user's standing round instruction (the professional Stripe integration
verification, the full audit/parity workflow with the mobile-nav + Tailwind
v4 watches, the `.env`/db-root contract, the vitest + playwright suites, the
TDD remediation plan, the screenshots, the `.env.example`, the docs, and the
main-only push). No Stripe test-mode keys or email credentials were provided
(the two standing credential-gated candidates stay gated), so the round's
deliverable is audit-derived — the pattern of rounds 27–35.

**Workspace state this round:** RESET — the sandbox was re-provisioned (the
repo re-cloned from `github.com/nordeim/ecommerce-store.git` at `585259a`;
the parent workspace's own git state is an unrelated "Initial commit"). The
env-shadowing trap re-verified LIVE: the injected shell `DATABASE_URL`
(`file:/home/z/my-project/db/custom.db`) wins over both `.env` files —
neutralized by the session-21 hard-link convergence (inode 397013 at BOTH
`db/custom.db` paths — one file, whichever resolution wins). `bun install` ·
`bun run db:setup` idempotent (6 categories, 12 products, 4 users, 4
canonical orders, 3 hero slides); the repo `skills/` exclusion re-verified
in all four configs (tsconfig `exclude`, eslint `ignores`, vitest `include`,
playwright `testDir`).

## 1. Baseline verification (state at audit start)

- **Fresh clone → `585259a`** — the working tree clean; the repo `skills/`
  folder exclusion re-verified in all four configs.
- Environment contracts: `.env` carries `DATABASE_URL="file:../db/custom.db"`
  · `db/` at the repo root (the hard link in place — the injected parent
  path and the repo path are ONE file) · `bun run db:setup` green.
- Baseline gate: lint 0/0 · tsc clean · **301/301 unit+integration (19
  files)** · build exit 0 · **the full E2E baseline re-run 250/250 (8.1m,
  foreground — the L26/L27 lesson)** — the documented session-69/70 ship
  state verified pre-change.
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd**
  (red-green-refactor; the failing regression test first), **agent-browser**
  (the live reference walk — via the established Playwright-form battery
  scripts, the sessions 12–35 protocol), **clone-app-pat-pro** (the parity
  methodology: superset features must not change the resting visual of
  parity surfaces), plus the repo's own `ecommerce-store_SKILL.md` §4.2
  (the Tailwind v4 trap log).
- **The Round-36 live battery (the audit):** the paired pixel sweep **ALL
  8 ROUTES AT BASELINE BAND** (home 0% [6 px, both sides painted on slide
  `1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%,
  checkout 0.01%, account 0%, login 0.28%). **The 36th mobile-nav
  verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg
  rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500 with
  identical hrefs; the Electronics deep-link + auto-close passed). The
  standing watches clean (typeahead: the reference fires ZERO search
  requests; carousel ~5000ms cadence; the SEO layer: 17-URL sitemap,
  robots, JSON-LD, offers.price 299.99 USD). The console census 24 routes
  + 11 admin surfaces CLEAN (incl. the session-34 customer-detail walk).
- **The order-surface audit (the round's focus area):** the Round-35
  deliverable verified file-by-file against the docs — the seam
  (`src/lib/order-timeline.ts`), the Timeline card, the deep-link
  (`ordersHref`), the seed's fixture chain (`evt-ord1-transit` …
  `evt-ord4-refunded`), the e2e-reset's `SEEDED_ORDER_EVENT_IDS`
  preservation — all exactly as documented. With the gaps below.

## 2. Audit results

### 2.1 The candidate triage (session-69's "suggested next" list)

Session 69 named the next audit-derived candidates. The triage:

1. **The customer-facing "where's my order" tracking affordance (CHOSEN —
   §2.2):** session-69's first named candidate. The customer order-surfaces
   arc (sessions 33→34→35: the money mirror → the detail read surface → the
   timeline) rendered the order's money state, its resting state, and its
   story — but the fulfillment story stops at words: "Status updated to In
   Transit" tells the customer NOTHING actionable. Every high-end store's
   in-transit order carries a carrier + tracking number + a "track your
   package" link (the Amazon/Shopify pattern). The schema has NO
   carrier/tracking fields today (verified: `model Order` in
   `prisma/schema.prisma` — no such columns), no admin write surface, and
   no customer read surface. This round builds all three.
2. **The in-memory rate limiter's shared-store migration (DEFERRED — the
   PAD's open Medium, unchanged):** re-evaluated and re-deferred (no new
   information; correct for single-instance SQLite).
3. **The payments-surface Stripe-dashboard deep-link (DEFERRED — the
   configured-mode gate, unchanged):** renders nothing in demo mode; the
   standing E2E cannot exercise the configured branch without fixture
   keys. Deferred with the credential.

### 2.2 THE PRIMARY FINDING — the fulfillment story has no actionable affordance: no carrier, no tracking number, no track link (ORDER-TRACKING-1)

The customer's order detail (ADR-042/043) renders the order's STORY
(placed → "Status updated to In Transit" → …) — but "In Transit" is where
the story strands the customer. The natural question at that moment —
"where IS it?" — has no in-app answer: the schema carries no carrier, no
tracking number (`model Order` verified), the operator has no write
surface for them, and the customer has nothing to click. The operator
console has the same gap: the status Select flips the pill, but the
console cannot record HOW the order ships.

**The fix (two columns, one seam, one action, one island, two read rows,
one fixture round):**

- **The columns (`prisma/schema.prisma`):** `Order.carrier String?` +
  `Order.trackingNumber String?` — two additive nullable columns (the
  `paymentStatus`/`failureReason` precedent: null = not set = the calm
  state; SQLite `db push` applies them with zero data motion). The columns
  are the order's RESTING state (like `cardLast4`) — rendered from the
  row, never derived from events.
- **The pure seam (`src/lib/order-tracking.ts`, NEW):**
  `orderTrackingView(carrier, trackingNumber)` →
  `{ visible, carrierLabel, trackingCode, href }` — the canonical carrier
  map (`ups | fedex | usps | dhl` → `{ label, hrefTemplate }`: the four
  carriers' public tracking URLs, the code `encodeURIComponent`-substituted);
  a case-insensitive, whitespace-trimmed match against the canonical keys
  (the operator types "UPS" or "ups" — both link); an UNKNOWN carrier →
  the raw label + `href: null` (the raw-passthrough philosophy — the
  number still renders, just not linked); null/empty/whitespace in EITHER
  field → `{ visible: false }` (the `orderRefundLineView` calm-state
  precedent). Prisma-free, formatCents-free — pure view composition.
- **The validation (`src/lib/validation.ts`):** `trackingSchema` —
  `carrier: trim 1–40`, `trackingNumber: trim 4–64` (real tracking numbers
  vary wildly across carriers: UPS 18, USPS 20–22, FedEx 12–15, DHL 10).
- **The action (`setOrderTrackingAction` in `src/lib/actions/admin.ts`):**
  admin-gated (the house rule) · Zod-parsed · unknown order → the honest
  error · the no-op guard (identical values → ok, NO event write — the
  `updateOrderStatusAction` precedent) · writes the columns + a
  `tracking_added` OrderEvent whose note carries the operator attribution
  ("«carrier» «number» set by admin@luxestore.com" — the status action's
  note format; the operator console renders it, the customer timeline
  never does) · `revalidatePath("/admin") + ("/account")` (the status
  action's paths).
- **The timeline seam extension (`src/lib/order-timeline.ts`):** the
  `tracking_added` case → "Tracking added" (the customer vocabulary; the
  note is structurally absent from the row type — the R10-2 leak stays
  impossible). The customer detail's `TIMELINE_ICONS` gains
  `tracking_added: PackageCheck`.
- **The admin write surface (`src/components/account/admin-tracking-form.tsx`,
  NEW + the Shipping card on `/admin/orders/[id]`):** the compact island —
  carrier Input (aria-label "Carrier for {number}", placeholder
  "UPS, FedEx, USPS, DHL…"), tracking-number Input (aria-label "Tracking
  number for {number}"), Save Button — the `AdminProductRow` stock-form
  anatomy (pending disables, `!res.ok` renders the text-xs destructive
  pair, success `router.refresh()`); pre-filled with the current columns
  so the operator can set OR update. The Shipping card ALSO gains the
  read row when set ("Tracking: UPS · 1Z…" — the dl row pattern).
- **The customer read surface (the Shipping card on
  `/account/orders/[id]`):** the Tracking row when visible —
  "Tracking" muted dt + `«carrierLabel» · «code»` dd, the code an
  EXTERNAL anchor (`target="_blank" rel="noopener noreferrer"`,
  `text-primary underline-offset-4 hover:underline`) when `href` composes,
  plain text otherwise. The calm state renders NOTHING (no empty row —
  the alert-fatigue rule).
- **The fixtures (`prisma/seed.ts` + `prisma/e2e-reset.ts` +
  `prisma/dev-cleanup.ts`):** ORD-2026-002 (john's in-transit order — the
  natural carrier) gains `carrier: "UPS"`, `trackingNumber:
  "1Z999AA10123456784"` (the canonical UPS test number) + the
  `tracking_added` event (`evt-ord2-tracking`, deterministic id, note
  "UPS 1Z999AA10123456784 set by admin@luxestore.com", createdAt
  2026-03-16T09:15:00Z — 30 min after the transit transition). The seed's
  existing-order update path restores the columns idempotently (the
  session-33 paid-columns pattern). The e2e-reset: `evt-ord2-tracking`
  joins `SEEDED_ORDER_EVENT_IDS`; `"tracking_added"` joins the
  deleteMany type filter (per-run tracking events wiped, the canonical
  story survives); ORD-2026-002's restore gains the columns; ORD-2026-003's
  restore CLEARS them (the admin E2E sets them there). dev-cleanup
  mirrors the two restores.
- **Zero parity risk:** every touched surface is superset-only (the admin
  console + the customer detail — the reference has neither; its orders
  are hardcoded rows that link nowhere). The storefront parity surfaces
  are untouched; the sweep re-run confirms.

### 2.3 E2E impact census (verified by reading the specs)

- `account.spec.ts` runs BEFORE `admin.spec.ts` (alphabetical) — the
  admin spec's tracking write on ORD-2026-003 cannot pollute the account
  reads within a run; the e2e-reset clears it between runs.
- The existing ORD-2026-002 timeline is NOT pinned (session-35 pinned 001
  + 004 only) — the new "Tracking added" row breaks no exact-count pin.
- The a11y census pages: the customer detail (pin 8) + the admin
  order-detail (pin 7) — the new rows reuse existing color pairs
  (muted/foreground/primary-on-background); the pins are expected to HOLD
  (verified post-change; recalibrate only if the live counts move).
- The admin money-line pins on ORD-2026-003 (account.spec line ~216)
  read the Payment card — the tracking row lives in the Shipping card; no
  interaction.

## 3. The TDD plan

### 3.1 RED — the unit layer (`src/lib/order-tracking.test.ts`, NEW + one case in `order-timeline.test.ts`)

The seam module absent — the import fails (the right RED). Pins:
1. the calm state: null/null → `{ visible: false }` (and no other keys
   that could leak into a render)
2. the calm state: empty/whitespace strings → `{ visible: false }`
3. known carrier: `("UPS", "1Z…")` → visible, label "UPS", the code, the
   composed href `https://www.ups.com/track?tracknum=1Z…` (the
   case-insensitive + trim normalization: " ups " links identically)
4. fedex/usps/dhl: each composes its canonical URL template
5. unknown carrier: `("Royal Mail", "AB123")` → visible, raw label, code,
   `href: null`
6. the code is `encodeURIComponent`-substituted (a code with a space
   composes the encoded form)
7. a set carrier with a null/short code → the view stays calm when
   either side is missing (the pair contract)
8. `order-timeline.test.ts`: the `tracking_added` row → label
   "Tracking added" (+ the structural no-note pin already covers the new
   type — the row type has no note field)

### 3.2 RED — the E2E layer (2 tests)

- `admin.spec.ts`: "the operator sets tracking from the order detail
  (session-36, ORDER-TRACKING-1)" — the shared admin login; navigate
  ORD-2026-003's detail; fill carrier "FedEx" + tracking "771283940293";
  Save; the tracking read row renders ("FedEx · 771283940293") + the
  admin timeline gains the attributed event row. (Fails RED: the form
  absent.)
- `account.spec.ts`: "the in-transit order carries the tracking line +
  the timeline row (ORD-2026-002, session-36 ORDER-TRACKING-1)" —
  navigate 002's detail; the Tracking row renders ("UPS ·
  1Z999AA10123456784"); the code is an anchor with the UPS href; the
  timeline carries "Tracking added" after "Status updated to In Transit";
  the no-leak pin (the note never renders); AND the calm state on
  ORD-2026-001's detail (no Tracking row — the not-set order renders
  nothing). (Fails RED: the row absent.)

### 3.3 GREEN (the implementation order)

1. `prisma db push` (the columns) — the schema comment block
2. the seam (`src/lib/order-tracking.ts`) — unit GREEN (§3.1)
3. `trackingSchema` (`src/lib/validation.ts`) + the action
   (`setOrderTrackingAction`)
4. the timeline case + the icon map entry
5. the admin form island + the Shipping card read row
6. the customer Shipping card read row
7. the fixtures (seed + e2e-reset + dev-cleanup) — reseed + re-run the
   fast layers
8. the E2E GREEN runs (the two new tests + the touched specs:
   `account.spec.ts`, `admin.spec.ts`, `accessibility.spec.ts` — the two
   census pages)
9. the a11y census pins re-verified (recalibrate ONLY if the live counts
   move — the documented discipline)

### 3.4 Mutations ×3 (each must be caught, then byte-exact reverted — md5-verified)

- **M1 — the href composition dropped** (the seam returns `href: null`
  for a known carrier): the unit pins (§3.1 #3/#4) AND the account E2E
  anchor pin fail. [the seam is the defect]
- **M2 — the consumer's calm-state gate broken** (the customer Shipping
  card renders the Tracking block unconditionally): the account E2E
  calm-state pin fails (ORD-2026-001 renders the row); the seam's unit
  pins stay green — the CONSUMER is the defect (the session-35 M1
  precedent).
- **M3 — the timeline case dropped** (`tracking_added` falls through to
  the raw-type passthrough): the unit pin (§3.1 #8) AND the account
  timeline E2E pin fail ("tracking_added" renders raw instead of
  "Tracking added").

### 3.5 The full gate

lint (0/0) · typecheck · the FULL unit layer · build · the FULL E2E × 2
consecutive runs on the final code (the ship discipline — the L26/L27
lesson: foreground, not background).

## 4. Execution order

1. **RED:** §3.1's unit pins (the module absent) + §3.2's two E2E tests —
   all fail for the RIGHT reasons.
2. **GREEN:** §3.3's order; targeted runs green at each step; the a11y
   census pins verified post-change.
3. **Mutations ×3** (each caught + byte-exact revert, md5-verified).
4. **Full gate:** lint (0/0) · typecheck · unit · build · the FULL E2E × 2
   consecutive runs on the final code.

## 5. Post-change battery + screenshots

- The paired pixel sweep re-run (all 8 routes — the standing drift watch).
- The 36th mobile-nav verification re-run (token-exact parity must hold —
  the header/nav surfaces untouched; already run once this round, re-run
  post-change).
- The watches + census re-run (the touched routes are already in the
  census walk — the customer detail + the admin order-detail).
- Screenshots 191–195 (the production standalone — the exact shipped
  artifact): the ORD-2026-002 customer detail with the tracking line +
  the three-row timeline (fullPage), the ORD-2026-002 tracking row
  close-up (the anchor), the admin order-detail with the tracking form +
  the set row, the ORD-2026-001 calm-state detail (no tracking row,
  fullPage), home (the standing anchor). The live DOM probed BEFORE the
  VLM run (describe reality, not intention — the round-32/33/34/35
  lesson); VLM 5/5 required.

## 6. Docs duty

AGENTS.md (the ORDER-TRACKING-1 architecture rule) · CLAUDE.md (the
session-36 contract + the new unit/E2E counts) · README (the feature rows
+ the test-count row + the 36th mobile-nav verification) · PAD v1.36
(ADR-044 + the revision row) · SKILL v1.36.0 (the ADR-044 row) ·
docs/session_71.md · the worklog S36 entry · this plan's sign-offs.
`.env.example` verified current (the round adds NO env plumbing).

## Sign-offs (completed at execution)

- [x] RED phase verified failing for the right reasons (11 unit — the
      module absent; 1 timeline case — the label raw; 2 E2E — the link
      and the form absent). One design revision during RED: the
      calm-state pin drove the seam to the discriminated-union shape
      ({ visible: false } carries NO fields — the order-money-state
      precedent).
- [x] GREEN phase — all targeted runs green; both a11y census pins
      held at their existing values (customer detail 8, admin
      order-detail 7 — the new rows reuse counted pairing families; no
      recalibration needed)
- [x] Mutations ×3 caught + byte-exact reverts (md5-verified; M1
      verified at BOTH layers with the artifact rebuilt for the E2E
      proof — the playwright webServer boots the pre-built standalone)
- [x] Full gate × 2 consecutive runs on the final code (565 total:
      313 unit + 252 E2E)
- [x] Post-change battery (sweep at baseline · the 36th mobile-nav
      token-exact re-run · watches + census clean)
- [x] Screenshots 191–195 captured + VLM 5/5 (zero description
      corrections — the probe-first discipline)
- [x] Docs aligned; committed to main; pushed via the SSH wrapper
