# Remediation Plan — Session 28 (Round 28): The Dashboard Refund-Needed Alert Stat (DASH-ALERT-1, ADR-036) + The Sweep Self-Diagnosis (SWEEP-DIAG-1, L37)

**Date:** 2026-10-09 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `9901111` (the session-27 ship `6d85082` + the user's session-54 log commit)
**Status at audit start:** 456-test gate (226 unit+integration + 230 E2E), PAD v1.27, SKILL v1.27.0 — lint 0/0 · tsc clean · 226/226 unit+integration · build exit 0 (25 routes) · **the full E2E baseline re-run 230/230 (7.4m, foreground)** verified on the freshly-cloned workspace.

## 0. The round's mandate

The user's standing round instruction (the professional Stripe integration
verification, the full audit/parity workflow with the mobile-nav +
Tailwind v4 watches, the `.env`/db-root contract, the vitest + playwright
suites, the TDD remediation plan, the screenshots, the `.env.example`,
the docs, and the main-only push). The session-53 suggested-next-steps
name the Stripe test-mode keys and the email provider — both remain
credential-gated. The actionable candidate is the third suggestion:
**"With the console trifecta complete, the next console rounds move from
pattern-completion to depth: the dashboard could surface the
refund-needed count as an alert stat (ONE bounded query at the entry
point — the natural observability graduation)."** The round's own audit
contributed a process finding (the sweep's transient out-of-band reading
— §2.1) and its fix (the hero-phase instrumentation — §3.4).

## 1. Baseline verification (state at audit start)

- **Workspace RESET this round** — the sandbox was rebuilt, so the repo
  was `git clone`d fresh (not fast-forwarded). Environment rebuilt per
  the documented contracts: `bun install` · `.env` written with the repo
  contract `DATABASE_URL="file:../db/custom.db"` · `bun run db:setup`
  (seed: 6 categories, 12 products, 4 users, 3 orders) · **the session-21
  hard-link convergence recreated** (the shell's injected
  `DATABASE_URL=file:/home/z/my-project/db/custom.db` resolves to the
  same inode as the repo's `db/custom.db` — inode 264946 at BOTH paths,
  verified) — the env-shadowing trap neutralized exactly as documented.
- Baseline gate: lint 0/0 · tsc clean · **226/226 unit+integration (15
  files)** · build exit 0 (25 routes, standalone present) · **the full
  E2E baseline re-run 230/230 (7.4m, foreground — the L26/L27 lesson:
  the sandbox reaps detached runs between tool calls)** — the documented
  session-27 ship state verified pre-change.
- Skills mapped from `skills/skills-catalog.md`: the standing set
  (agent-browser, tdd, clone-app-pat-pro) +
  **e-commerce-nextjs16-monorepo** (the round's primary — its
  admin-console/observability patterns re-read). The session-27 commit
  re-audited file-by-file (`src/lib/admin-products.ts`,
  `admin-product-filters.tsx`, the products page wiring, the 18 unit
  contracts, the 5 E2E filter tests) — all hold.
- **The Round-28 live battery** (single invocation, the :3000 production
  server, the r28 scripts): the pixel sweep's FIRST run measured **home
  59.95% (471,434 px) — OUT OF BAND** (7 other routes in-band) → the
  round-26 drift playbook invoked → see §2.1 for the investigation and
  the no-drift verdict; the **28th mobile-nav verification: TOKEN-EXACT
  PARITY** (all 10 checks — panel 288px / bg rgb(251,250,249), nav flex
  gap-4 mt-8, 5 links 239×44 at 18px/500 with identical hrefs; the
  Electronics deep-link + auto-close passed); the standing watches clean
  (typeahead — the reference fires ZERO search requests; carousel
  cadence 5000ms; the SEO layer — 17-URL sitemap, robots, JSON-LD,
  offers.price 299.99 USD); the console census 24 routes + 11 admin
  surfaces (the payments ×4 + products-filter ×4 variants) CLEAN.

## 2. Audit results

### 2.1 THE PROCESS FINDING — the sweep's transient out-of-band reading (SWEEP-DIAG-1)

The battery's first sweep run measured home at 59.95% (471,434 px) —
60% of the viewport, nearly exactly the hero band (the hero is
976×499 = 487,124 px at 1024×768), with the diff-band localizer
confirming rows 109–607 (the entire hero region below the 108px
header). The round-26 drift playbook was invoked (a hero-media
regeneration was the prior round's confirmed root cause). The
investigation this round:

1. **The active-slide probe** (fresh contexts, both sites, the sweep's
   exact settle flow): the active hero img is IDENTICAL on both sites
   (`7cfe01108_generated_076a6d07.png`, y=109, 976×499) and the h1's
   computed styles are identical (48px/700/48px, white) — a sweep-replica
   capture diffed **0.00% (16 px)**.
2. **The interleaved replica** (the sweep's exact sequence — ref goto →
   clone goto → ref settle → clone settle → ref shot → clone shot, with
   the active slide recorded at shot time): 3/3 runs **0.00% (6 px)**,
   both sides on slide 1 every time.
3. **The sweep re-run**: the SAME script, unmodified, re-measured home
   at **0% (6 px) — ALL ROUTES AT BASELINE**.
4. **The content inventories**: the CTAs all `/shop` (3/3 both sites),
   the hero copy identical, and the shop img inventory identical
   (12 imgs, same order, both sites) — no content drift anywhere.

**Verdict: NOT drift — a transient capture artifact.** The first run
was the cold first-boot battery: fresh browser contexts, cold DNS/TLS
to `media.base44.com`, a freshly-booted standalone server. One side's
remote hero media had not painted (or was mid-flip) at capture time —
`networkidle` + the 1000ms settle guarantees network quiet, not paint
completion of a cold-fetched remote PNG. Four independent re-measurements
all read 0.00%; the drift signal was not reproducible.

**The systemic gap:** the sweep had NO instrument for distinguishing
drift from artifact — round 26 spent a full investigation cycle on real
drift (correctly); this round's reading would have sent another
investigation down a path with no drift at the end of it. **Fix
(§3.4): the sweep now records the hero phase at capture time** — the
active slide's src hash tail + its paint state (`naturalWidth > 0`)
for BOTH sides on every home capture. A differing phase or a
`NOT-PAINTED` flag at capture = artifact (re-measure before diagnosing);
an identical, painted phase + a persistent out-of-band diff = drift (run
the full playbook). Lesson **L37**.

### 2.2 THE PRIMARY FINDING — the dashboard's missing triage entry point (DASH-ALERT-1)

The payments surface's refund-needed family (sessions 25/26, PAY-OPS-2
+ PAY-OPS-3) is the operator's most actionable signal — a succeeded
payment with no placed order is money the store captured and must
refund. But the signal lives ONLY on `/admin/payments?family=refund-needed`:

- The dashboard (`/admin` — the console's entry point) renders four KPI
  stat cards (Revenue, Orders, Products, Customers) + the Recent Orders
  list. **No trace of the refund-needed count.**
- An operator opening the console has no indication that triage work
  exists — they must already know the family filter exists AND navigate
  to the payments surface to discover it.

The graduation the session-53 suggestion names: ONE bounded count query
at the entry point + the deep-link to the family filter. The design
elegant part (§3.2): the count reuses **the SAME seam the payments
surface filters by** — `buildAdminPaymentWhere({ family:
"refund-needed" }, placedIntentIds)` — so the dashboard stat and the
payments list can never disagree about the family (a divergent count is
structurally impossible, not just untested).

### 2.3 Verified-healthy (no action)

The session-27 products filters (the seam + island + page wiring + the
18/5 tests) — re-verified in the static audit and the E2E baseline
re-run (all products-filter tests green). The session-26 hero/header
content pins + the payments date-range filter — hold (the E2E baseline
re-ran their tests green; the live A/B battery confirmed parity). The
28th mobile-nav token parity — holds. The `.env` / `.env.example` /
db-path contracts — current (the `.env` was rewritten this round from
the `.env.example` contract — byte-equivalent coverage; no new env
plumbing this round). The SEO/a11y/CWV/INP standing gates — all green
in the baseline re-run.

## 3. Fix design (validated against the codebase)

### 3.1 The pure seam — `refundNeededAlert(count)` in `src/lib/admin-payments.ts`

The alert's presentation contract (the file the refund-needed family
already lives in — the natural home):

- `refundNeededAlert(0)` → `{ visible: false }` — the honest calm
  state: no alert noise when there is nothing to act on (alert
  fatigue is the failure mode a permanent zero-row invites).
- `refundNeededAlert(1)` → `{ visible: true, label: "1 payment needs
  refund attention", href: "/admin/payments?family=refund-needed" }`.
- `refundNeededAlert(N)` → `{ visible: true, label: "N payments need
  refund attention", … }` — the singular/plural forms pinned.
- The href constant: the family deep-link, exactly the family Select's
  own value (the payments surface's canonical param order guarantees
  the shape).

Negative/NaN counts are out of contract (the caller is a Prisma count)
but the seam stays total: the parse family's fall-through philosophy
applies — the label renders the count as given; `visible` is strictly
`count > 0`.

### 3.2 The page wiring — `/admin` (the dashboard)

Two bounded queries added to the existing `Promise.all` (the
`buildAdminPaymentWhere` reuse is the design's core):

1. The placed-intent set: `db.order.findMany({ where: {
   stripePaymentIntentId: { not: null } }, select: {
   stripePaymentIntentId: true } })` — the SAME bounded input query the
   payments page runs for the family (small: orders holding a Stripe
   intent; 1 row in the seeded set).
2. The count: `db.stripeEvent.count({ where:
   buildAdminPaymentWhere({ family: "refund-needed" },
   placedIntentIds) })` — the EXACT where the payments family filter
   composes. **The dashboard stat and the payments filter share one
   seam — divergence is structurally impossible.**

Rendering (harmonious with the console's card anatomy — the superset
surfaces follow the console's own visual vocabulary, with the reference
as the parity guide for the storefront only):

- The alert row sits between the stats grid and the Recent Orders card
  (an action item, not a KPI — it does not join the 4-card grid and
  break its `lg:grid-cols-4` rhythm).
- Anatomy: the card shape (`bg-card rounded-2xl border shadow-sm`) with
  a `border-destructive/30` accent + an `AlertTriangle` icon in a
  `bg-destructive/10` round chip (the icon-only destructive accent —
  NOT destructive-colored TEXT: `text-destructive` on white measures
  ~3.9:1 and would grow the admin census's pinned color-contrast
  count; the session-27 precedent — "the island adds no contrast
  nodes, no recalibration" — keeps the dashboard pin at 8).
- The copy: "Payment review needed" (foreground, font-semibold) +
  the seam's label (muted) + the seeded context line. The count
  emphasized via `font-semibold text-foreground` inside the label —
  contrast-safe.
- The action: a "Review payments" outline Button (the console's own
  `rounded-xl` outline anatomy — the same shape the dashboard header's
  Products/Payments buttons use) deep-linking to the family filter.
- `visible: false` renders nothing (§3.1).

### 3.3 The E2E test — `admin.spec.ts` (the dashboard describe)

One test, the family's integration guard (the session-25 pattern —
"the integration guard lives there, the shape contract lives here"):

- `goto("/admin")` → the alert row visible: "Payment review needed" +
  "1 payment needs refund attention" (the e2e-reset restores the
  canonical 4-event fixture set every run — `evt_demo_fixture_n` is
  the only unlinked succeeded event; the count is deterministically 1).
- Click "Review payments" → `toHaveURL(/\/admin\/payments\?family=refund-needed$/)`
  → the refund-needed row renders (`No order — refund via Stripe
  dashboard`).
- The existing dashboard stat test (scoped to `div.grid.grid-cols-2`)
  is untouched — the alert renders OUTSIDE the grid.
- The a11y admin gate: the dashboard pin stays 8 (§3.2's contrast-safe
  design) — re-run to confirm; a change would mean the design failed
  its own constraint and the FIX is the design (recalibration only as
  the documented last resort, per the session-16 precedent).

### 3.4 The sweep instrumentation (SWEEP-DIAG-1's fix)

`scripts/sweep-session28.mjs` now records the hero phase at capture
time on every home capture (BOTH sides): the active slide's src hash
tail + the paint state (`naturalWidth > 0` → `painted`/`NOT-PAINTED`).
The output line becomes self-diagnosing:
`home 0% (6 px)  [hero ref=1237b9a1afec(painted) clone=1237b9a1afec(painted)]`.
A differing tail or a NOT-PAINTED flag beside an out-of-band number =
artifact → re-measure before diagnosing; identical painted phases + a
persistent diff = drift → run the full round-26 playbook. (Validated
live: the instrumented sweep ran clean — both sides painted, same
slide, 0%.)

### 3.5 Mutation efficacy plan (×3, the standing discipline)

- **M1** — the seam's visibility gate inverted (`count >= 0`): the
  alert renders at count 0 → the UNIT contract fails (`visible: false`
  at 0). (E2E cannot catch this — the e2e fixture set always counts 1;
  the seam contract owns the calm state.)
- **M2** — the label drops the pluralization (always "payments need"):
  the singular form's unit contract fails.
- **M3** — the page's count query passes an EMPTY placed-intent set:
  every succeeded event counts (2 in the fixture set: `evt_s` + 
  `evt_n`) → the label reads "2 payments need refund attention" → the
  E2E test fails (expects the exact "1 payment needs refund attention").
  This is the integration guard's mutation — the page wiring's own
  efficacy proof.

## 4. Execution checklist (TDD)

1. **RED (unit)** — the `refundNeededAlert` contracts appended to
   `src/lib/admin-payments.test.ts` (0/1/N visible + label + href): the
   function missing → the import fails → RED for the right reason.
2. **RED (E2E)** — the alert test in `admin.spec.ts`'s dashboard
   describe: the alert row does not exist → failing for the right
   reason (verified against the unmodified page).
3. **GREEN §3.1** — the seam function (≤20 lines, total, pure).
4. **GREEN §3.2** — the page wiring (2 bounded queries + the alert row).
5. **Targeted runs** — the admin spec (the full dashboard describe incl.
   the new test) + the payments unit spec; the a11y admin gate re-run
   (the pin-8 confirmation).
6. **Mutations ×3** — each applied, verified caught, reverted,
   byte-exact-verified (md5).
7. **Full gate** — lint 0/0 · tsc clean · unit 226+3 · build exit 0 ·
   **the FULL E2E suite, two consecutive runs on the FINAL code**.
8. **The live re-verification battery** (post-change): the sweep (with
   the phase record) + the 29th mobile-nav + the watches + the census —
   the admin-only change touches no parity surface (the design intent).
9. **Screenshots** (151–155): the dashboard alert live (the deep-link
   proof pair), the refund-needed family live, the unit gate, the E2E
   gate. VLM verification.

## 5. Sign-offs (checked on completion)

- [x] RED verified for the right reasons (the import-fail 4/34 + the absent alert row)
- [x] GREEN: seam + wiring + targeted runs (38/38 unit; the full admin spec 28/28; one tsc-caught narrowing correction)
- [x] The a11y admin dashboard pin UNCHANGED at 8 (the contrast-safe design held — re-run green, no recalibration)
- [x] Mutations ×3 caught + byte-exact reverts (one md5 pair across the three)
- [x] Full gate: lint 0/0 · tsc clean · unit 229/229 (+4 — the actual count 230/230, the plan's estimate off by one existing test) · build 0 · E2E 231/231 (+1), two consecutive full runs (7.5m/7.5m)
- [x] Live battery re-verified post-change (the instrumented sweep all-8 in band with the phase record [both sides painted, same slide]; the 28th mobile-nav token-exact re-verified; watches + census clean)
- [x] Screenshots 151–155 captured + VLM 5/5 PASS (152 re-verified with the corrected description — my description's error, not the screenshot's)
- [x] Docs: AGENTS.md (the DASH-ALERT-1 contract), CLAUDE.md (the session-28 contract + 230/231 counts), README.md (the dashboard alert row + 461 tests + the 28th verification + the Testing table's stale 167/214 counts), PAD v1.28 (ADR-036 + the revision row + the matrix corrected to 35 files/461), SKILL v1.28.0 (the L37 lesson + the ADR-036 index), docs/session_55.md, worklog.md, this plan's sign-offs
- [x] `.env.example` verified current (no new env plumbing this round; the `.env` rewritten from it this round — byte-equivalent coverage)
- [ ] Committed to `main` + pushed via the SSH wrapper (executed at ship: commit + dry-run + push + key shred) — checked in the commit message

