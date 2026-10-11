# Remediation Plan — Session 38 (Round 38): The Business-Day Delivery Window — the Weekend-Skipping Refinement (DELIVERY-WINDOW-2, ADR-046)

**Date:** 2026-10-11 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `de09a07` (the session-37 ship `46318e8` + the user's session-72/73/74 narrative logs)
**Status at audit start:** 575-test gate (321 unit+integration + 254 E2E), PAD v1.37, SKILL v1.37.0 — lint 0/0 · tsc clean · 321/321 unit+integration (21 files) · build exit 0 · the full E2E baseline re-run **254/254 (8.4m, foreground)** verified on the pulled workspace.

## 0. The round's mandate

The user's standing round instruction (the professional Stripe integration verification, the full audit/parity workflow with the mobile-nav + Tailwind v4 watches, the `.env`/db-root contract, the vitest + playwright suites, the TDD remediation plan, the screenshots, the `.env.example`, the docs, and the main-only push). No Stripe test-mode keys or email credentials were provided (the two standing credential-gated candidates stay gated), so the round's deliverable is audit-derived — the pattern of rounds 27–37.

**Workspace state this round:** FRESH CLONE at `de09a07` (the sandbox was re-provisioned — the git pull path replaced by a clean `git clone`; the working tree clean). The env-shadowing trap verified LIVE (the injected shell `DATABASE_URL` — `file:/home/z/my-project/db/custom.db` — wins over the repo `.env`); neutralized the session-21 way: `bun run db:setup` ran against the injected path, then the hard-link convergence put BOTH `db/custom.db` paths on one inode (528497). The Playwright browsers re-installed for the fresh sandbox (chromium-headless-shell v1243). `bun install` green · `bun run db:setup` idempotent (6 categories, 12 products, 4 users, 4 canonical orders, 3 hero slides); the repo `skills/` exclusion re-verified in all four configs (tsconfig `exclude`, eslint `ignores`, vitest `include`, playwright `testDir`).

## 1. Baseline verification (state at audit start)

- **Fresh clone at `de09a07`** — the working tree clean; the repo `skills/` folder exclusion re-verified in all four configs.
- Environment contracts: `.env` re-created from `.env.example` with `DATABASE_URL="file:../db/custom.db"` · `db/` at the repo root (the hard link in place, inode 528497 both paths) · `bun run db:setup` green and idempotent.
- Baseline gate: lint 0/0 · tsc clean · **321/321 unit+integration (21 files)** · build exit 0 · **the full E2E baseline re-run 254/254 (8.4m, foreground — the L26/L27 lesson)** — the documented session-73/74 ship state verified pre-change.
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd** (red-green-REFACTOR — this round exercises the full three-step cycle: the refinement's RED assertion pins, the GREEN math, and the REFACTOR rename), **agent-browser** (the live reference walk — via the established Playwright-form battery scripts, the sessions 12–37 protocol), **clone-app-pat-pro** (the parity methodology: superset features must not change the resting visual of parity surfaces — the audit's deciding rule for the deferred shipping-method candidate), plus the repo's own `ecommerce-store_SKILL.md` §4.2 (the Tailwind v4 trap log).
- **The Round-38 live battery (the audit):** the paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, both sides painted on slide `1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%, checkout 0.01%, account 0%, login 0.28%). **The 38th mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500 with identical hrefs; the Electronics deep-link + auto-close passed). The standing watches clean (typeahead: the reference fires ZERO search requests; carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11 admin surfaces CLEAN.
- **The reference-checkout audit probe (this round's new audit surface):** the sweep captures the checkout at its EMPTY state only — the with-cart state was the gap. Probed the reference's full path (PDP add-to-cart → the header cart button → the drawer → the Checkout link): step 1 "Shipping Information" carries EXACTLY the seven address fields (First Name, Last Name, Email, Address, City, State, ZIP) + the steps indicator (1 Shipping · 2 Payment · 3 Review) + the order-summary sidebar — **ZERO radios, ZERO selects, NO shipping-method selector, NO delivery estimate** (the drawer quote: "Subtotal / Shipping Free / Total" for an over-$100 cart). VLM-verified on the PDP capture: no delivery-date estimates or shipping-speed controls anywhere on the reference's product surface.

## 2. Audit results

### 2.1 The candidate triage (session-73's "suggested next" list)

1. **The business-day refinement of the delivery window (CHOSEN — §2.2):** session-73's second named candidate — "weekend skipping — the current quote is the honest calendar-day form." ADR-045's own documented (−): "flat 3-7-day quote (no shipping-method awareness, no business-day math)". This round closes the second half of that limitation.
2. **The in-memory rate limiter's shared-store migration (DEFERRED — the PAD's open Medium, unchanged):** re-evaluated and re-deferred (no new information; correct for single-instance SQLite — a DB-backed limiter would add hot-path writes to every login/forgot attempt against the very database the single instance owns).
3. **The per-order shipping-method surface (DEFERRED — the parity ruling, NEW evidence this round):** the reference-checkout probe (§1) verified the reference's checkout step 1 carries NO method selector — address fields only. A visible selector on the clone's step 1 would change the resting visual of a checkout parity surface (the clone-app-pat-pro rule: superset features must not change the resting visual of parity surfaces). Deferred until a parity-safe design exists (e.g. a reference-side change or a collapsed-by-default affordance that re-measures at zero visual delta).

### 2.2 THE PRIMARY FINDING — the calendar-day window quotes days the carrier does not deliver: ADR-045's estimate can land the promise on a Saturday or Sunday (DELIVERY-WINDOW-2)

The round-37 seam quotes `placedAt + 3` to `placedAt + 7` **calendar** days. On the seeded fixture itself the amateur form is visible: ORD-2026-002 (placed Sunday 2026-03-15) quotes "Mar 18 – 22, 2026" — **the max bound IS a Sunday** (2026-03-22), a day UPS/FedEx/USPS do not deliver in the standard tier. Every high-end store quotes the window in business days (the Amazon/Shopify form: "3-7 business days") because the carrier SLA is Mon–Fri; the calendar form both under-promises (a Sunday max bound the carrier will beat) and over-promises (a weekend-blind quote can straddle a Saturday the carrier skips). The reference has no counterpart on any surface (verified this round: the PDP carries no estimate; the reference orders link nowhere; the reference confirmation is the mock), so the refinement is superset-only — doubly parity-safe.

**The fix (one seam function, zero consumer churn, zero schema change):**

- **The refined window math (inside `src/lib/delivery-window.ts`, the ONLY production change):** the bounds stay 3–7 but count **business days** — Mon–Fri, UTC-deterministic. `addBusinessDays(placedAt, n)` steps forward one fixed 24h UTC increment at a time from the placed instant, counting a step when its UTC weekday is 1–5 (UTC has no DST, so the weekday the step lands on is exact — the same UTC-determinism discipline as round 37: a fixed instant renders the same window on any runner TZ). `from = addBusinessDays(placedAt, 3)`, `to = addBusinessDays(placedAt, 7)`. Holidays are deliberately NOT modeled (jurisdiction-specific; the standard store quote is Mon–Fri — documented in the seam).
- **The verified math on the pinned instants (hand-checked + scripted):**
  - ORD-2026-002 (placed **Sun** 2026-03-15T10:22:00Z): from = Wed Mar 18 (Mon 16, Tue 17, Wed 18), to = Tue Mar 24 (Thu 19, Fri 20, ~~Sat/Sun~~, Mon 23, Tue 24) → **"Mar 18 – 24, 2026"** (was "Mar 18 – 22" — the Sunday max bound is gone).
  - The 2026-03-28T15:04:05Z instant (a **Saturday**): from = Wed Apr 1 (Mon 30, Tue 31, Wed Apr 1), to = Tue Apr 7 → **"Apr 1 – 7, 2026"** (was "Mar 31 – Apr 4" — NOTE: the format branch CHANGES from cross-month to same-month, an extra format-branch guard the old pin never exercised).
  - The 2026-12-28T09:00:00Z instant (a **Monday**, cross-year): from = Thu Dec 31, to = Wed Jan 6 2027 (skipping the Jan 2–3 weekend) → **"Dec 31, 2026 – Jan 6, 2027"** (was "Dec 31, 2026 – Jan 4, 2027").
  - NEW PIN — a **Friday** placement (2026-03-20T12:00:00Z, the tightest weekend interaction — both bounds land mid-next-week): from = Wed Mar 25, to = Tue Mar 31 → **"Mar 25 – 31, 2026"**.
- **The honest rename (the REFACTOR step):** `DELIVERY_WINDOW_MIN_DAYS`/`MAX_DAYS` → `DELIVERY_WINDOW_MIN_BUSINESS_DAYS`/`DELIVERY_WINDOW_MAX_BUSINESS_DAYS`. The quoted bounds ARE business days now — the old name is a trap for the next reader (the FLAT_SHIPPING_CENTS precedent is a name that never lied; this one would). Verified: the constants' only consumers are the seam itself and its test file (grep-verified — zero external imports), so the rename is contained.
- **The consumers: UNTOUCHED** — both surfaces (`/account/orders/[id]`'s header line, `/checkout/success`'s muted stack) call `deliveryWindowView(status, placedAt)` and render whatever the seam quotes. No page changes, no schema, no fixtures, no env plumbing — the lightest possible refinement round.
- **The seeded-story coherence check:** ORD-2026-001 placed Sat 2026-03-28, delivered Thu 2026-04-02 = 4 business days — inside the 3–7 business-day window (the seeded fulfillment story keeps sitting inside the promise, the round-37 coherence property, now in the honest unit).

### 2.3 E2E impact census (verified by reading the specs)

- `tests/e2e/account.spec.ts`: the ORD-2026-002 exact pin **updates this round** ("Estimated delivery: Mar 18 – 22, 2026" → **"Estimated delivery: Mar 18 – 24, 2026"**) — the round's E2E contract change. The calm pins (ORD-2026-001 delivered, ORD-2026-004 cancelled → `toHaveCount(0)`) are UNAFFECTED (the statuses are unchanged; the calm discipline is orthogonal to the window math).
- `tests/e2e/checkout.spec.ts`: the confirmation pin is a SHAPE regex (the moving-date honesty — a fresh order's placedAt is NOW) — **holds unchanged** under the new math ("Mar 18 – 24, 2026" matches `/^Estimated delivery: [A-Z][a-z]{2} \d{1,2}(?:, \d{4})? – (?:[A-Z][a-z]{2} )?\d{1,2}, \d{4}$/`). Comment updated to name the business-day form.
- The other specs' confirmation pins (`guest-checkout`, `stock`, `stripe` pin the heading + the order number + the items — verified: none pin the estimate text) — text pins unaffected by the window's date shift.
- The a11y census: reads ORD-2026-001 (delivered → the calm state → no estimate line) — the pin-8 holds; the admin order-detail census (7) is untouched.
- `prisma/seed.ts` + `e2e-reset`: UNTOUCHED (no fixture dates change — the window is computed, never stored).

## 3. The TDD plan

### 3.1 RED — the unit layer (`src/lib/delivery-window.test.ts`, REWRITTEN pins)

The seam EXISTS (round 37) — so the RED is the refinement's assertion deltas, not a missing module. The RED file keeps the old constant names in its imports (the rename is the REFACTOR step, after GREEN — this keeps the RED clean: only the math pins fail, the carried-over calm + constants pins stay green, the round-36/37 "pre-existing tests in the same files green" discipline):

1. the calm states ×3 (delivered / cancelled / unknown → `{ visible: false }`) — CARRIED OVER unchanged (must stay green through RED and GREEN: the refinement cannot touch the calm discipline).
2. `processing` + ORD-2026-002's Sunday instant → **"Mar 18 – 24, 2026"** (UPDATED — fails RED: the current math renders "Mar 18 – 22").
3. `in_transit` + the same instant → the identical window (one quote, two promise states) — UPDATED in step with #2.
4. the Saturday instant (2026-03-28T15:04:05Z) → **"Apr 1 – 7, 2026"** (UPDATED — fails RED; also guards the same-month format branch the old cross-month pin never hit).
5. the Monday cross-year instant (2026-12-28T09:00:00Z) → **"Dec 31, 2026 – Jan 6, 2027"** (UPDATED — fails RED).
6. NEW — the Friday placement (2026-03-20T12:00:00Z) → **"Mar 25 – 31, 2026"** (fails RED: the current math renders "Mar 23 – 27").
7. NEW — the never-a-weekend-bound property: for every placement day of a two-week span (14 consecutive instants, Mar 15–28 2026 — covering both weekend days and every weekday), parse the seam's text output (the three pinned formats) back into UTC dates and assert BOTH bounds' `getUTCDay()` ∈ {1..5} (and from ≤ to). Fails RED: the current calendar math renders Sunday bounds (e.g. the Mar 15 placement's "Mar 22" max).
8. the constants: `DELIVERY_WINDOW_MIN_DAYS === 3`, `DELIVERY_WINDOW_MAX_DAYS === 7` (the values are UNCHANGED — stays green through RED/GREEN; re-pins the new names at REFACTOR).

### 3.2 RED — the E2E layer (1 pin update)

- `account.spec.ts`: the ORD-2026-002 exact pin → **"Estimated delivery: Mar 18 – 24, 2026"** (+ the comment's math note: the Sunday-placed instant + 3/+7 BUSINESS days). Fails RED against the current artifact (the standalone carries the calendar math — the element renders the old string). Verified to fail for the RIGHT reason (`toHaveText` string mismatch, not a flow error).
- `checkout.spec.ts`: comment-only (the shape pin holds).

### 3.3 GREEN → REFACTOR (the implementation order)

1. **GREEN:** the seam's math — `isBusinessDay` (UTC weekday 1–5) + `addBusinessDays` (the fixed-24h stepper) + the window composition from the two bounds; the constants keep their old names for the moment. Unit layer 100% green (the carried-over pins prove no collateral damage).
2. **REFACTOR:** the honest rename — `DELIVERY_WINDOW_MIN_BUSINESS_DAYS`/`DELIVERY_WINDOW_MAX_BUSINESS_DAYS` in the seam + the test file's import/pin + the doc comments (the business-day contract, the no-holiday-modeling note). Behavior-neutral; the full unit layer re-run green (the tdd skill's third step, exercised honestly).
3. The E2E GREEN run: `account.spec.ts` (+ the a11y census pins re-verified — the customer-detail census reads a delivered order, the calm state) + `checkout.spec.ts`. The artifact REBUILT before the E2E run (the playwright webServer boots the pre-built standalone — the session-36 lesson).

### 3.4 Mutations ×3 (each must be caught, then byte-exact reverted — md5-verified)

All three target the seam (the round's only changed production code — the consumers are untouched, so the consumer-mutation class of rounds 35–37 does not apply):

- **M1 — the regression-to-calendar mutation** (the `isBusinessDay` check dropped from the stepper — the round-37 behavior): the unit exact pins ×4 + the never-weekend property pin fail AND the account E2E exact pin fails ("Mar 18 – 22" ≠ "Mar 18 – 24") — the strongest proof: the new pins would catch a regression to the old form at BOTH layers. [the math is the defect]
- **M2 — the MAX bound mutated** (`DELIVERY_WINDOW_MAX_BUSINESS_DAYS` 7 → 5): the unit exact pins (every to-bound ends 2 business days early) + the constants pin fail AND the account E2E exact pin fails ("Mar 18 – 20" ≠ "Mar 18 – 24"). The artifact REBUILT for the E2E proof (the session-36 lesson). [the bound is the defect]
- **M3 — the MIN bound mutated** (`DELIVERY_WINDOW_MIN_BUSINESS_DAYS` 3 → 2): the unit exact pins (every from-bound lands one business day early) + the constants pin fail AND the account E2E exact pin fails ("Mar 17 – 24" ≠ "Mar 18 – 24"). [the second bound is the defect]

### 3.5 The full gate

lint (0/0) · typecheck · the FULL unit layer · build · the FULL E2E × 2 consecutive runs on the final code (the ship discipline — the L26/L27 lesson: foreground, not background).

## 4. Execution order

1. **RED:** §3.1's unit pins (assertion failures on the refined strings — the calm/constant pins green) + §3.2's E2E pin update — all fail for the RIGHT reasons.
2. **GREEN:** §3.3 step 1 (the math) → step 2 (the REFACTOR rename) — the full unit layer green at each step.
3. **Mutations ×3** (each caught + byte-exact revert, md5-verified; M2/M3's E2E proofs run against REBUILT artifacts).
4. **Full gate:** lint (0/0) · typecheck · unit · build · the FULL E2E × 2 consecutive runs on the final code.

## 5. Post-change battery + screenshots

- The paired pixel sweep re-run (all 8 routes — the standing drift watch; the round touches NO rendering code, so the baseline band must hold exactly).
- The 38th mobile-nav verification re-run (token-exact parity must hold — the header/nav surfaces untouched; re-run post-change).
- The watches + census re-run (the touched routes are already in the census walk).
- Screenshots 201–205 (the production standalone — the exact shipped artifact): the ORD-2026-002 customer detail with the refined estimate (fullPage), the estimate-line close-up (the element capture), a placed-order confirmation with the refined estimate (a real order placed through the browser — the moving date probed live before the VLM description, the round-37 UTC-midnight lesson), the ORD-2026-001 calm-state detail (no estimate line, fullPage — the unchanged resting state), home (the standing anchor). The live DOM probed BEFORE the VLM run (describe reality, not intention); VLM 5/5 required. Dev-DB hygiene after the captures (the stray order removed, stock restored).

## 6. Docs duty

AGENTS.md (the DELIVERY-WINDOW-2 architecture rule — the business-day refinement of ADR-045's window) · CLAUDE.md (the session-38 contract + the new unit count 323 / total 577) · README (the 577-test row + the account-dashboard estimate clause updated to the business-day form + the 38th mobile-nav verification + the Testing-table counts) · PAD **v1.38** (ADR-046 + the revision row + **the stale-count fixes found by this round's docs review: §8.1's test-distribution table (475/35 files — session-30 state) and §8.4's pre-push checklist (250/236 — session-31 state) updated to the current gate**) · SKILL **v1.38.0** (the ADR-046 row + **the stale-spot fixes: §11's pre-ship checklist counts ("104 unit tests" / "202 tests") and §3/§20's model count (13 → 15)** + the Appendix C latest-plan pointer) · docs/session_75.md · the worklog S38 entry · this plan's sign-offs. `.env.example` verified current (the round adds NO env plumbing).

## Sign-offs (completed at execution)

- [x] RED phase verified failing for the right reasons (6 unit — the 5 refined
      exact-string pins + the property pin, all assertion failures, with the
      calm ×3 + the constants pin GREEN through RED; the E2E exact pin failed
      on the string mismatch "Mar 18 – 22" ≠ "Mar 18 – 24")
- [x] GREEN + REFACTOR phases — 10/10 in the seam file, the full layer
      323/323 at each step; the E2E GREEN runs (account+checkout 37/37) + the
      a11y census pins held (30/30)
- [x] Mutations ×3 caught at BOTH layers + byte-exact reverts (md5
      a383db6931cc8fb1875046dcb4a60f5a verified at every step; the artifacts
      rebuilt for every E2E proof — M1 the regression-to-calendar mutation →
      unit ×6 AND the E2E; M2 MAX 7→5 → unit ×6 AND the E2E "Mar 18 – 20";
      M3 MIN 3→2 → unit ×6 AND the E2E "Mar 17 – 24")
- [x] Full gate × 2 consecutive runs on the final code (577 total:
      323 unit + 254 E2E — 8.4m + 8.3m)
- [x] Post-change battery (sweep 8/8 at baseline · the 38th mobile-nav
      token-exact re-run · watches + census clean)
- [x] Screenshots 201–205 captured + VLM 5/5 (probe-first; the moving-date
      confirmation's window computed from the order's own placedAt —
      ORD-2026-007, Sunday-placed, "Oct 14 – 20, 2026"; the close-up
      re-captured at deviceScaleFactor 2 after the 1x crop proved below the
      VLM's OCR threshold)
- [x] Docs aligned (incl. the PAD §8.1/§8.4 + SKILL §11/§3/§7/Appendix-C
      stale-count fixes); committed to main; pushed via the SSH wrapper
