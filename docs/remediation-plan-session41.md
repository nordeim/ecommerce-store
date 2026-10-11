# Remediation Plan — Session 41 (Round 41): ORDER-WINDOW-1 — The Orders Surface's Date-Range Window (the PAY-OPS-3 Treatment, the Shared Day-Bounds Seam)

**Date:** 2026-10-11 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `ecc3f54` (the session-40 ship `3b07259` + the user's session-79/80 narrative logs)
**Status at audit start:** 586-test gate (332 unit+integration + 254 E2E), PAD v1.40, SKILL v1.40.0 — lint 0/0 · tsc clean · 332/332 unit+integration (21 files) · build exit 0 · the full E2E baseline re-run **254/254 (8.3m, foreground)** verified pre-change.

## 0. The round's mandate

The user's standing round instruction (the professional Stripe integration verification — demo mode rests green without keys, the standing credential gates unchanged; the full audit/parity workflow with the mobile-nav + Tailwind v4 watches; the `.env`/db-root contract — verified: `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root, the env-shadowing trap neutralized by the standing hard-link convergence, `/api/health` returns `db: true`; the vitest + playwright suites — both verified with the `skills/` exclusion in all four configs; the TDD remediation plan; the screenshots; the `.env.example` — verified current, this round adds NO env plumbing; the docs; and the main-only push via the SSH wrapper). No Stripe test-mode keys or email credentials were provided (the two standing credential-gated candidates stay gated), so the round's deliverable is audit-derived — the session-79 suggested-next: "a fresh audit sweep of the NEWER seams (the admin-* family, the stripe-* family)".

**Workspace state this round:** NOT reset — `git pull` (fast-forward `3b07259 → ecc3f54`, the user's session_80.md narrative log). The env-shadowing trap re-verified LIVE (the injected shell `DATABASE_URL` wins over the repo `.env`); the session-40 hard-link convergence HELD (inode 134504 at both `db/custom.db` paths — no re-convergence needed). `bun install` already green; the repo `skills/` exclusion re-verified in all four configs (tsconfig `exclude`, eslint `ignores`, vitest `include`, playwright `testDir`).

## 1. Baseline verification (state at audit start)

- **`git pull` at `ecc3f54`** — the working tree clean; the repo `skills/` folder exclusion re-verified in all four configs.
- Environment contracts: `.env` carries `DATABASE_URL="file:../db/custom.db"` · `db/` at the repo root (the hard link in place, inode 134504 both paths) · `tests/db-path.test.ts` 15/15 on the standing link.
- Baseline gate: lint 0/0 · tsc clean · **332/332 unit+integration (21 files)** · build exit 0 · **the full E2E baseline re-run 254/254 (8.3m, foreground — the L26/L27 lesson)** — the documented session-79/80 ship state verified pre-change.
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd** (the RED-GREEN-REFACTOR discipline), **agent-browser** (the live reference walk — via the established Playwright-form battery scripts, the sessions 12–40 protocol), **clone-app-pat-pro** (the parity methodology), **code-review-checklist + code-quality-standards** (the 12-category/six-axis lenses — applied to the operator-surface family this round), plus the standing drift watch `scripts/verify-docs-align-r40.mjs` (the round-40 verifier — re-run GREEN 25/25 at audit start).
- **The Round-41 live battery (the audit's parity layer):** the paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, both sides painted on slide `1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%, checkout 0.01%, account 0%, login 0.28%). **The 41st mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500 with identical hrefs; the Electronics deep-link + auto-close). The standing watches clean (typeahead: the reference fires ZERO search requests; carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11 admin surfaces CLEAN.
- **The operator-surface code audit (the session-79 suggested-next — the admin-* + stripe-* families, read line-by-line, the 12-category/six-axis lenses):** CLEAN — no real bugs. The full family read first-hand: the five admin pages (dashboard/orders/orders-detail/products/payments — every query bounded, no N+1, the outcome resolution in one query, the shared-seam compositions intact), the seven admin components (the filters' adjust-during-render + canonical re-emission, the rows' pending/error anatomy, the tracking form, the refund control), the five lib seams (admin-orders/admin-payments/admin-products/stripe-payment/stripe-config), the three action modules (admin/checkout/stripe), the webhook route (the H4d/L9 transactional discipline), stripe.ts (the lazy client), and the checkout island (checkout-flow + stripe-pay). The E2E coverage cross-check: 32 admin + 5 stripe tests — every operator behavior pinned. Two zero-behavior `{ }` dead JSX artifacts noted (admin-product-row L60, checkout-flow L369 — render nothing, left in place: the discipline does not touch a parity surface without cause).

## 2. Audit results

### 2.1 The candidate triage (session-79's "suggested next" list)

1. **The operator-surface audit sweep (DONE — this round's §1):** the admin-*/stripe-* families read line-by-line — CLEAN. The sweep produced ONE audit-derived candidate (§2.2).
2. **The rate-limiter store migration (RE-DEFERRED — the PAD's open Medium, unchanged):** re-evaluated and re-deferred (no new information; correct for single-instance SQLite — the migration note reads "before scaling horizontally").
3. **The per-order shipping-method surface (DEFERRED — the session-38 parity ruling, unchanged):** the reference's checkout step 1 carries no method selector; a visible selector would change the resting visual of a checkout parity surface.
4. **The credential-gated items (UNCHANGED):** Stripe test-mode keys and an email provider — no credentials provided this round (the payments-surface Stripe-dashboard deep-link stays gated on the configured-mode gate).

### 2.2 THE PRIMARY FINDING — the orders surface is the only LIST surface without a time dimension (ORDER-WINDOW-1)

The console's three LIST surfaces were built across 14 sessions, and the date-range pattern arrived in the middle of that arc: the orders surface (session-13, ADMIN-SEARCH-1 — `?status=` + `?q=`) predates the payments surface's date-range extension (session-26, PAY-OPS-3 — `?from=`/`?to=` on `receivedAt`) by 13 sessions. The orders surface never received the treatment its own sibling family established. The measured gap, first-hand:

- **No time dimension.** An operator triaging by time — end-of-day reconciliation, "the orders placed this week", the Black Friday window — cannot. The payments operator can (PAY-OPS-3); the orders operator cannot. The cross-surface inconsistency is structural: `parseAdminOrderFilters` handles two keys; `parseAdminPaymentFilters` handles four.
- **The take-100 ceiling is unmitigated.** The orders list's `take: 100` bound is honest (the count line's "100+ of N" form) but final: rows beyond the newest 100 are UNREACHABLE — no date window exists to narrow past them. The payments surface's date range is exactly that reach-past tool (an operator windows down by date); the orders surface has no equivalent.
- **The reference is silent (pure superset — zero parity risk).** The reference has no admin console at all; the orders surface is a superset surface. Adding the date inputs extends a superset surface's filter bar (the PAY-OPS-3 form — `Input type="date"`, the CalendarRange glyph, w-[150px]) — no parity surface is touched.

**Why this is the round's deliverable (the judgment call, made):** it closes a real operator gap with the family's own established pattern (the cross-surface consistency the console's design language is built on), it is the take-100 ceiling's only reach-past tool, it is triply parity-safe (a superset-only surface, no rendering path on parity surfaces, no schema/fixtures/env), and it ships the shared day-bounds seam — the honest DRY extraction the duplication now demands (the session-35 `formatTimelineDate` precedent: when two surfaces need the same pure helper, extract it; the 54 payments pins prove the refactor).

### 2.3 The shared-seam extraction (the session-35 precedent, applied)

`parseAdminPaymentFilters`'s private date-bound code (the `ISO_DAY_RE` shape regex + `parseDateBound`'s Date round-trip) and `buildAdminPaymentWhere`'s inline boundary construction (`new Date(...T00:00:00.000Z)` + the 86,400,000ms day-after) are the only date-range logic in the codebase — 22 lines that the orders surface now needs too. The honest form is NOT a copy: **`src/lib/day-bounds.ts`** — a new pure seam (Prisma-free, SDK-free, node-dependency-free):

- `parseDayBound(raw: string | undefined): string | undefined` — the strict `YYYY-MM-DD` validation (shape + Date round-trip; 2026-02-30 normalizes to March 2, month 13 parses NaN; the "set-me"-style fall-through philosophy).
- `utcDayBounds({ from?, to? }): { gte?: Date; lt?: Date }` — the UTC day-boundary range: `gte` from's midnight, `lt` the midnight AFTER `to` (exclusive — `to`'s whole day is in range; 86,400,000ms).

`admin-payments.ts` drops its private copies and composes the seam (ZERO behavior change — its 54 unit pins, which pin the boundary `Date` values exactly, plus the PAY-OPS-3 E2E pins are the proof). `admin-orders.ts` composes the same seam for the new dimension. The two seams' date handling is provably identical by construction.

### 2.4 E2E impact census

**CONTAINED.** The touched production surface: `/admin/orders`'s filter bar (a superset surface, no parity exposure). The seam changes are additive to `AdminOrderFilters`/`AdminOrderWhere` (the where shapes for existing status/q filters are byte-identical — the composable-AND contract keeps every single-filter shape minimal). The admin-payments refactor is behavior-neutral by its pins. No fixtures, no schema, no env, no config. The existing orders E2E pins (the count-line forms, the deep-link URLs, the empty state) hold unchanged; the spec file gains the date-range family (the payments pattern's mirror).

## 3. The TDD plan

### 3.1 RED — the new pins, written first, failing for the right reasons

1. **`src/lib/admin-orders.test.ts`** (the existing file gains the date family — clean assertion failures, the carried-over pins green):
   - The parse pins: a valid `from`/`to` pair preserved; from-only and to-only preserved (open-ended); the bad shapes dropped (`03/01/2026`, `2026-3-1`, `2026-03-01T10:00:00Z`, `not-a-date`, `2026-13-01`, `2026-02-30`); an inverted pair drops together; an equal pair preserved; an array param takes its first value.
   - The where pins: from+to builds the UTC day-boundary `placedAt` range `[fromStart, toEnd)`; from-only/to-only build open-ended ranges; dates AND with the status branch; dates AND with q (the triple composition); the bare-element shapes hold (status-only renders bare — the pre-session shape byte-identical).
2. **`tests/e2e/admin.spec.ts`** (the orders family gains the date tests — the payments pattern's mirror): the deep-linkable date-range URL; the open-ended from bound; the date range ANDed with the status combobox; the date inputs push merged params from the filter bar (the canonical `?status=…&from=…` order); the inverted-pair and bad-bound deep-links render the unfiltered list.

**RED verified:** the unit pins fail on assertions (the parser returns no `from`/`to` — undefined; the where-builder ignores the keys); the E2E tests fail on the missing inputs (no "From date"/"To date" labels on the orders bar; the date deep-links render the unfiltered list — the count pins mismatch).

### 3.2 GREEN — the fix order

1. **`src/lib/day-bounds.ts`** — the new shared seam (§2.3), with the module-header contract.
2. **`admin-payments.ts` refactored to compose it** — the private `ISO_DAY_RE` + `parseDateBound` deleted, the where-builder's inline construction replaced by `utcDayBounds`; `admin-payments.test.ts` re-run → 54/54 green (the refactor proof — the boundary pins are exact `Date` value pins).
3. **`admin-orders.ts`** — the parser gains `from`/`to` (the inverted-pair drop, the family contract); the where-builder composes the `placedAt` clause as ONE AND element (the composable-AND pattern); the `AdminOrderDateRange` type.
4. **`admin-order-filters.tsx`** — the two date inputs (the AdminPaymentFilters anatomy exactly: the CalendarRange glyph, "From date"/"To date" aria-labels, `w-[150px]`, URL-controlled values); the canonical re-emission order `(status, q, from, to)`; `hasFilters` extended.
5. **`admin/orders/page.tsx`** — passes `activeFrom`/`activeTo` to the island.
6. The verifier re-runs: the unit layer green; the E2E date family green.

### 3.3 The mutation-style efficacy spot-checks ×3 (each caught, then byte-exact reverted — md5-verified at every step)

- **M1 (the seam's parser):** the inverted-pair drop removed — `parseAdminOrderFilters({from: "2026-03-31", to: "2026-03-01"})` preserves the pair → the parse pins fail (the inverted pair must drop together).
- **M2 (the shared module):** `utcDayBounds`'s `lt` loses the `+ 86_400_000` — the day-after boundary becomes `to`'s own midnight → the boundary pins fail at BOTH seams (admin-orders' new pins AND admin-payments' existing where pins — the shared-module proof: one mutation, two seams' guards fire).
- **M3 (the island):** the canonical re-emission order broken (`from` emitted before `status`) → the E2E merged-params URL pin fails (`?status=delivered&from=2026-03-01` — the canonical order is the contract).

### 3.4 The full gate (the regression proof)

lint (0/0) · typecheck · the FULL unit layer (332 + the new date pins) · build · the FULL E2E × 2 consecutive runs on the final code (254 + the new date family, each run — the L26/L27 lesson: foreground).

## 4. Execution order

1. **RED:** write the unit date pins + the E2E date family; run and record the failures (§3.1).
2. **GREEN:** the five batches in §3.2's order (the shared seam first; the admin-payments refactor second — its pins re-run green before any orders change; then the orders seam, the island, the page).
3. **The verifier re-runs:** unit green · E2E green.
4. **Mutations ×3** (§3.3 — each caught + byte-exact revert).
5. **Full gate:** lint · typecheck · unit · build · the FULL E2E × 2 consecutive runs.

## 5. Post-change battery + screenshots

- The paired pixel sweep re-run (all 8 routes — the standing drift watch; the round touches NO parity surface, so the baseline band must hold exactly).
- The 42nd mobile-nav verification's post-change re-run (token-exact parity must hold).
- The watches + census re-run (the kill-by-port discipline BEFORE the battery — the round-39 stale-server lesson, since the mid-round rebuild wipes chunk hashes).
- **Screenshots 216–220** (the remediated app, captured against the production standalone on :3001 — the exact shipped artifact): home (the standing anchor), the orders surface filtered by the date window (the round's deliverable — "From date" + "To date" set, the count line, the March rows only), the orders bar's close-up (the two date inputs beside the status Select), the unfiltered orders surface (the calm state — the bar's resting form), and the mobile nav open (the standing watch surface). The live DOM probed BEFORE the VLM run; VLM 5/5 required.

## 6. Docs duty (this round's deliverable + the round's own records)

The PAD **v1.41** (ADR-048 + the §3.2 tree's `day-bounds.ts` row + §12's row + the §6.1 rate-limiter row unchanged + the revision row) · SKILL **v1.41.0** (the §5.2 inventory's admin-order-filters note + the lib inventory 27→28 + Appendix C's latest-plan pointer → session41) · AGENTS.md (the test-count rows) · CLAUDE.md (the session-41 contract + the counts) · README (the Testing table + the gate row) · `docs/session_81.md` (the round narrative) · the worklog S41 entry · this plan's sign-offs. `.env.example` verified current (the round adds NO env plumbing).

## Sign-offs (completed at execution)

- [x] RED phase verified failing per-family (the unit date pins: 10 assertion failures with the carried-over pins green — the two negative-parse pins aligning with the fall-through contract passed by design; the E2E date family: 6 failures on the missing inputs, the date deep-links rendering the unfiltered list)
- [x] GREEN — the five batches applied (day-bounds.ts; the admin-payments refactor + 54/54 through the refactor; the orders seam 24/24; the island; the page); the verifier green
- [x] Mutations ×3 caught + byte-exact reverts (md5 b9dc507d7d4a930faba18d92b3ea8721 / 1688a8fef007eff7954e7affd258ff72 / f2f02d7046a54f506a5d3b3f3a984239 verified at every step: M1 the inverted-pair drop → 1 unit failure; M2 the shared module's day-after offset → 8 failures at BOTH seams; M3 the island's canonical order → the E2E URL pin, the artifact rebuilt for the proof — the session-36 lesson re-learned)
- [x] Full gate × 2 consecutive runs on the final code (604 total: 344 unit + 260 E2E — 8.3m + 8.7m)
- [x] Post-change battery (sweep 8/8 at baseline · the 42nd mobile-nav token-exact re-run — the 41st and 42nd in one round · watches + census clean — the kill-by-port discipline applied first, the round-39 lesson)
- [x] Screenshots 216–220 captured + VLM 5/5 (probe-first; two honest corrections earned: the 220 button form (the FIRST banner button, the standing protocol), and the 217 locale-rendering of the native date input — the DOM value stays ISO, the rendering is MM/DD/YYYY in en-US)
- [x] Docs aligned (PAD v1.41, SKILL v1.41.0 incl. the missed v1.40.0 header bump repaired, AGENTS, CLAUDE, README, the verifier's ADR recalibration 47→48 — the drift watch GREEN 25/25, session_81.md, the worklog S41 entry); committed to main; pushed via the SSH wrapper
