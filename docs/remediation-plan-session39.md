# Remediation Plan — Session 39 (Round 39): The Carrier-Holiday Delivery Window — the Six-Date Skip (DELIVERY-WINDOW-3, ADR-047)

**Date:** 2026-10-11 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `d691c40` (the session-38 ship `2dcfd8e` + the user's session-75/76 narrative logs)
**Status at audit start:** 577-test gate (323 unit+integration + 254 E2E), PAD v1.38, SKILL v1.38.0 — lint 0/0 · tsc clean · 323/323 unit+integration (21 files) · build exit 0 · the full E2E baseline re-run **254/254 (8.4m, foreground)** verified on the fresh clone.

## 0. The round's mandate

The user's standing round instruction (the professional Stripe integration verification — demo mode rests green without keys, the two standing credential gates unchanged; the full audit/parity workflow with the mobile-nav + Tailwind v4 watches; the `.env`/db-root contract — verified: `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root, the env-shadowing trap neutralized by the session-21 hard-link convergence, `/api/health` returns `db: true`; the vitest + playwright suites — both verified in all four configs with the `skills/` exclusion; the TDD remediation plan; the screenshots; the `.env.example` — verified current, this round adds NO env plumbing; the docs; and the main-only push via the SSH wrapper). No Stripe test-mode keys or email credentials were provided (the two standing credential-gated candidates stay gated), so the round's deliverable is audit-derived — the pattern of rounds 27–38.

**Workspace state this round:** FRESH CLONE at `d691c40` (the sandbox was re-provisioned — the git pull path replaced by a clean `git clone`; the working tree clean). The env-shadowing trap verified LIVE (the injected shell `DATABASE_URL` — `file:/home/z/my-project/db/custom.db` — wins over the repo `.env`); neutralized the session-21 way: `bun run db:setup` ran against the injected path, then the hard-link convergence put BOTH `db/custom.db` paths on one inode (133438). The Playwright browsers re-installed for the fresh sandbox (chromium-headless-shell v1243). `bun install` green (475 packages) · `bun run db:setup` idempotent (6 categories, 12 products, 4 users, 4 canonical orders, 3 hero slides); the repo `skills/` exclusion re-verified in all four configs (tsconfig `exclude`, eslint `ignores`, vitest `include`, playwright `testDir`).

## 1. Baseline verification (state at audit start)

- **Fresh clone at `d691c40`** — the working tree clean; the repo `skills/` folder exclusion re-verified in all four configs.
- Environment contracts: `.env` re-created from `.env.example` with `DATABASE_URL="file:../db/custom.db"` · `db/` at the repo root (the hard link in place, inode 133438 both paths) · `bun run db:setup` green and idempotent.
- Baseline gate: lint 0/0 · tsc clean · **323/323 unit+integration (21 files)** · build exit 0 · **the full E2E baseline re-run 254/254 (8.4m, foreground — the L26/L27 lesson)** — the documented session-75/76 ship state verified pre-change.
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd** (red-green-REFACTOR — this round exercises the full three-step cycle: the refinement's RED assertion pins, the GREEN holiday math, and the REFACTOR header rewrite), **agent-browser** (the live reference walk — via the established Playwright-form battery scripts, the sessions 12–38 protocol), **clone-app-pat-pro** (the parity methodology: superset features must not change the resting visual of parity surfaces — the doubly-superset-only ruling below), **code-review-checklist + code-quality-standards** (the audit's 12-category/six-axis lenses), plus the repo's own `ecommerce-store_SKILL.md` §4.2 (the Tailwind v4 trap log — trap 5, the mobile-nav `gap-4` rule) and `skills/nextjs16-tailwind4` §9 (the shadcn Sheet mobile-nav pattern).
- **The Round-39 live battery (the audit):** the paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, both sides painted on slide `1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%, checkout 0.01%, account 0%, login 0.28%). **The 39th mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500 with identical hrefs; the Electronics deep-link + auto-close). The standing watches clean (typeahead: the reference fires ZERO search requests; carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11 admin surfaces CLEAN.
- **The code audit (sessions 36–38 + a general scan, the 12-category/six-axis lenses):** CLEAN — the delivery-window math independently re-swept over 400 placement days (0 weekend bounds, 0 inversions, DST-moot verified on both 2026 transition dates); the order-tracking seam's URL building safe; both consumers render the calm state with no DOM delta; the server-action discipline holds (ActionResult, Zod, stock-in-tx, refund single-writer); the three ship commits' file lists match their documented scope. **No real bugs.** Three audit micro-findings ride this round: (1) the cross-month same-year format branch has no exact-string unit pin; (2) `checkout.spec.ts`'s illustrative comment carries an unreachable window example; (3) the PAD's stale-count spots (§6 below).

## 2. Audit results

### 2.1 The candidate triage (session-75's "suggested next" list)

1. **The carrier-holiday calendar for the delivery window (CHOSEN — §2.2):** session-75's named candidate — "a carrier-holiday calendar for the window (jurisdiction-aware — needs a store-config decision)". ADR-046's own documented (−): "carrier holidays are not modeled (the honest generic quote; a jurisdiction-aware calendar would need per-store configuration)". This round closes that limitation: the store's implicit jurisdiction is the US (USD prices, the $9.99 flat US shipping tier, the US State/ZIP address form — ADR-011's money contract), so the store's carrier calendar is the standard US carrier set. The "store-config decision" the candidate flagged is made and documented here: **the six-date standard-carrier set, exact-date policy** (§2.2).
2. **The rate-limiter store migration (DEFERRED — the PAD's open Medium, unchanged):** re-evaluated and re-deferred (no new information; correct for single-instance SQLite — a DB-backed limiter would add hot-path writes to every login/forgot attempt against the very database the single instance owns).
3. **The per-order shipping-method surface (DEFERRED — the session-38 parity ruling, unchanged):** the reference's checkout step 1 carries no method selector (verified live in round 38 via the drawer-path probe); a visible selector would change the resting visual of a checkout parity surface. Unchanged until a parity-safe design exists.
4. **The credential-gated items (UNCHANGED):** Stripe test-mode keys (would drive the refund action's SDK path live and unlock the deferred dashboard deep-link) and an email provider (would unlock the deferred guest-order merge-back) — no credentials provided this round.

### 2.2 THE PRIMARY FINDING — the business-day window still quotes the six days a year the standard carrier does not deliver: the holiday-blind quote can promise a Thanksgiving or Christmas arrival (DELIVERY-WINDOW-3)

The round-38 seam counts Mon–Fri but is holiday-blind. On the 2026 calendar itself the amateur form is visible: an order placed **Friday 2026-12-18** counts `+7` to **Friday 2026-12-25 — Christmas Day**, a date UPS/FedEx/USPS all suspend standard delivery; an order placed **Friday 2026-11-20** counts `+7` to **Thursday 2026-11-26 — Thanksgiving**. The full-year sweep (the verification script, `scripts/verify-holiday-math-r39.mjs` — an independent oracle, not the seam) counts **10 placements of 2026** whose window lands a bound on a carrier holiday under the current math. Every high-end store's "3–7 business days" quote excludes the carrier holidays (the Amazon/Shopify form); the round-38 window is the honest generic quote, and this round makes it the honest carrier-aware quote. The reference has no counterpart on any surface (verified live in round 38: the PDP carries no estimate, the reference orders link nowhere, the reference confirmation is the mock), so the refinement is superset-only — doubly parity-safe.

**The store-config decision (the candidate's open question, decided):**

- **The jurisdiction: the US.** The store's money contract is US-anchored (USD prices, `FLAT_SHIPPING_CENTS = 999` — the $9.99 flat US tier, the State/ZIP address form). The store's carrier calendar is therefore the US carrier calendar.
- **The set: the six standard-carrier non-delivery dates** — New Year's Day (Jan 1), Memorial Day (last Monday of May), Independence Day (Jul 4), Labor Day (first Monday of September), Thanksgiving (4th Thursday of November), Christmas Day (Dec 25). This is the UPS/FedEx ground-tier no-pickup/no-delivery set — NOT the USPS retail-closure set (MLK Day, Presidents' Day, Columbus Day, Veterans Day, Juneteenth are post-office closures; the standard carriers deliver them).
- **The policy: exact dates, no observed-day shift.** A fixed-date holiday falling on a weekend is already skipped by the weekday rule — no double count, no Friday/Monday observance shift (the standard carriers run normal Friday/Monday service when the holiday falls on a weekend; Jul 4 2026 is a Saturday and the 2026 window math is identical with or without the calendar). Pinned by the Jul-4 policy pin (§3.1 #10 — green through RED and GREEN: it distinguishes the exact-date model from an observed-day model, which would shift the from-bound to Jul 8).
- **The computation: per-step year.** The stepper computes the holiday set for the UTC year of each step, so a window crossing Dec 31 picks up the next year's table (pinned by the double-holiday pin). UTC-deterministic like the rest of the seam (the holiday membership check is on the UTC date of the step; the tables are computed from UTC calendar arithmetic — no locale, no TZ).

**The fix (one seam module, zero consumer churn, zero schema change, zero E2E pin churn):**

- **`carrierHolidaysForYear(year): { name, iso }[]` — a NEW export** (the independent oracle's surface): returns the six dates for a year as ISO strings, sorted. Exported so the test layer can pin the 2026/2027 tables against hand-computed values (deriving the expectations from the seam's own window output would be tautological — the audit's ruling; the table export makes the calendar itself the pinned contract).
- **`isCarrierHoliday(d)`** (private): the UTC-date membership check against the year's table.
- **The stepper (the ONLY behavior change):** a day counts when it is a business day AND not a carrier holiday (`isDeliverableDay = isBusinessDay && !isCarrierHoliday`). `addBusinessDays` renamed `addDeliverableDays` — the honest rename lands WITH the behavior change this round (the round-38 REFACTOR precedent applied in the same commit: the old name would lie about what is counted).
- **The constants: UNCHANGED** — `DELIVERY_WINDOW_MIN_BUSINESS_DAYS = 3` / `MAX = 7`; the quoted bounds are still business days, now holiday-aware ones.
- **The consumers: UNTOUCHED** — both surfaces (`/account/orders/[id]`'s header line, `/checkout/success`'s muted stack) call `deliveryWindowView(status, placedAt)` and render whatever the seam quotes. No page changes, no schema, no fixtures, no env plumbing — the lightest possible refinement form (the rounds 37–38 pattern).

**The verified math on the pinned instants (hand-checked + the independent oracle script):**

| Placement (UTC) | Holiday-aware window | Holiday-blind (today) | RED delta |
|---|---|---|---|
| ORD-2026-002, Sun 2026-03-15T10:22:00Z (the E2E pin's fixture) | "Mar 18 – 24, 2026" | "Mar 18 – 24, 2026" | none — March is holiday-free; the E2E exact pin HOLDS |
| Sat 2026-03-28T15:04:05Z (existing pin) | "Apr 1 – 7, 2026" | same | none — holds |
| Fri 2026-03-20T12:00:00Z (existing pin) | "Mar 25 – 31, 2026" | same | none — holds |
| Thu 2026-07-02T12:00:00Z (NEW — the Jul-4 policy pin) | "Jul 7 – 13, 2026" | same | none by DESIGN — the exact-date policy (an observed-day model would quote "Jul 8 – 13") |
| Thu 2026-05-21T12:00:00Z (NEW — Memorial Day; also the cross-month exact-string pin the audit flagged missing) | "May 27 – Jun 2, 2026" | "May 26 – Jun 1, 2026" | both bounds shift past Mon May 25 |
| Thu 2026-09-03T12:00:00Z (NEW — Labor Day) | "Sep 9 – 15, 2026" | "Sep 8 – 14, 2026" | both bounds shift past Mon Sep 7 |
| Tue 2026-11-24T12:00:00Z (NEW — Thanksgiving week) | "Nov 30 – Dec 4, 2026" | "Nov 27 – Dec 3, 2026" | both bounds shift past Thu Nov 26 |
| Mon 2026-12-21T12:00:00Z (NEW — Christmas week) | "Dec 24 – 31, 2026" | "Dec 24 – 30, 2026" | the to-bound shifts past Fri Dec 25 |
| Tue 2026-12-22T12:00:00Z (NEW — the double holiday: crosses BOTH Dec 25 and Jan 1) | "Dec 28, 2026 – Jan 4, 2027" | "Dec 25 – 31, 2026" | both bounds shift; the format branch FLIPS same-year → cross-year; the blind from-bound IS Christmas Day |
| Mon 2026-12-28T09:00:00Z (EXISTING cross-year pin — UPDATED) | "Dec 31, 2026 – Jan 7, 2027" | "Dec 31, 2026 – Jan 6, 2027" | the to-bound shifts past Fri Jan 1, 2027 |

**The seeded-story coherence:** ORD-2026-001 placed Sat 2026-03-28, delivered Thu 2026-04-02 — a March/April span, holiday-free; the round-37/38 coherence property (delivered in 4 business days, inside the 3–7 window) is unaffected.

### 2.3 E2E impact census (verified by reading the specs)

- `tests/e2e/account.spec.ts:511`: the ORD-2026-002 exact pin **"Estimated delivery: Mar 18 – 24, 2026"** — mid-March, holiday-free → **HOLDS UNCHANGED** (the round's zero-E2E-churn guarantee). The calm pins (ORD-2026-001 delivered, ORD-2026-004 cancelled → `toHaveCount(0)`) are status-gated — UNAFFECTED.
- `tests/e2e/checkout.spec.ts:119`: the confirmation pin is a SHAPE regex (the moving-date honesty — a fresh order's placedAt is NOW) — **holds unchanged** under the new math. The comment's illustrative examples UPDATE (the cross-year example "Dec 31, 2026 – Jan 6, 2027" → "…– Jan 7, 2027"; the unreachable cross-month example "Mar 31 – Apr 7, 2026" → the reachable "May 27 – Jun 2, 2026" — the audit's micro-fix #2).
- The other specs' confirmation pins (`guest-checkout`, `stock`, `stripe`) pin the heading + order number + items — none pin the estimate text. The a11y census reads ORD-2026-001 (delivered → calm) — the pin-8 holds.
- `prisma/seed.ts` + `e2e-reset`: UNTOUCHED (no fixture dates change — the window is computed, never stored).
- **The round's known limitation (documented honestly):** the E2E layer has NO holiday-exercising pin — the seeded fixtures are March-placed (holiday-free by design; re-dating them would churn every spec's pins for one refinement), and live orders place at NOW (mid-October 2026, holiday-free for weeks). The holiday math is therefore UNIT-layer-proven (the per-holiday pins + the table oracles + the full-year sweep + the mutations). The E2E GREEN runs re-verify the standing pins hold under the refinement (no collateral damage), which is the E2E layer's role this round.

## 3. The TDD plan

### 3.1 RED — the unit layer (`src/lib/delivery-window.test.ts`, 9 new/updated tests)

The seam EXISTS (rounds 37–38) — the RED is the refinement's assertion deltas plus the new export's oracle pins. Nine tests fail RED; ten stay green through RED (the calm ×3, the Sunday/Saturday/Friday exact pins, the in-transit dual-state pin, the Jul-4 policy pin, the 14-placement-day March sweep, the constants pin — the "pre-existing tests in the same files green" discipline). The file grows 10 → 19 tests:

1. The cross-year pin **UPDATES**: placed Mon 2026-12-28T09:00:00Z → **"Dec 31, 2026 – Jan 7, 2027"** (fails RED: the current math counts Fri Jan 1, 2027 as a deliverable day and renders "…– Jan 6, 2027").
2. NEW — Thanksgiving week: placed Tue 2026-11-24T12:00:00Z → **"Nov 30 – Dec 4, 2026"** (fails RED: the current math renders "Nov 27 – Dec 3, 2026").
3. NEW — Christmas week: placed Mon 2026-12-21T12:00:00Z → **"Dec 24 – 31, 2026"** (fails RED: "Dec 24 – 30, 2026").
4. NEW — the double holiday: placed Tue 2026-12-22T12:00:00Z → **"Dec 28, 2026 – Jan 4, 2027"** (fails RED: "Dec 25 – 31, 2026" — the blind from-bound IS Christmas Day; also guards the cross-year format branch flip and the per-step year table switch).
5. NEW — Memorial Day: placed Thu 2026-05-21T12:00:00Z → **"May 27 – Jun 2, 2026"** (fails RED: "May 26 – Jun 1, 2026"; also fills the audit's cross-month exact-string pin gap).
6. NEW — Labor Day: placed Thu 2026-09-03T12:00:00Z → **"Sep 9 – 15, 2026"** (fails RED: "Sep 8 – 14, 2026").
7. NEW — the Jul-4 weekend-fall policy pin: placed Thu 2026-07-02T12:00:00Z → **"Jul 7 – 13, 2026"** (GREEN through RED and GREEN by design — the exact-date policy: Jul 4 2026 is a Saturday, already skipped by the weekday rule; an observed-day model would quote "Jul 8 – 13, 2026" and fail this pin).
8. NEW — the 2026 table oracle: `carrierHolidaysForYear(2026)` returns exactly **["2026-01-01", "2026-05-25", "2026-07-04", "2026-09-07", "2026-11-26", "2026-12-25"]** (fails RED: the export does not exist — `carrierHolidaysForYear is not a function`; the expected values are HAND-COMPUTED in the test, never derived from the seam — the independent-oracle rule).
9. NEW — the 2027 table oracle: `carrierHolidaysForYear(2027)` returns exactly **["2027-01-01", "2027-05-31", "2027-07-04", "2027-09-06", "2027-11-25", "2027-12-25"]** (fails RED: same).
10. NEW — the full-year property sweep: for EVERY placement day of 2026 (365 placements at 12:00 UTC), parse the seam's window text back into UTC dates (the three pinned formats) and assert BOTH bounds are Mon–Fri AND not in the 2026+2027 holiday tables, and `from ≤ to` (fails RED: the independent oracle counts 10 placements whose window lands a bound on a carrier holiday under the current math). The round-38 14-placement-day March sweep test is KEPT unchanged (green through RED — the carried-over contract).
11. CARRIED OVER unchanged: the calm ×3, the Sunday/Saturday/Friday exact pins, the in-transit dual-state pin, the constants pin (3/7 — the values are unchanged; the bounds are business days, now holiday-aware).

### 3.2 RED — the E2E layer (comment-only, zero pin churn)

- `checkout.spec.ts`: the comment's illustrative examples UPDATE (the reachable cross-month form + the new cross-year form) — the SHAPE pin itself is untouched and green.
- `account.spec.ts`: NOTHING (the exact pin holds — §2.3).

### 3.3 GREEN → REFACTOR (the implementation order)

1. **GREEN:** the seam's holiday math — `carrierHolidaysForYear` (the six-date table: three fixed dates + `lastMondayOf(May)` + `firstMondayOf(September)` + `fourthThursdayOf(November)`, UTC calendar arithmetic), `isCarrierHoliday` (the UTC-date membership check), and the stepper's counting predicate becomes `isBusinessDay(d) && !isCarrierHoliday(d)` (with the honest `addDeliverableDays` rename landing in the same change — the name now tells the truth about what is counted). Unit layer 100% green (the carried-over pins prove no collateral damage).
2. **REFACTOR:** the module header rewrite — the round-38 header's "Holidays are deliberately NOT modeled (jurisdiction-specific…)" line is now a LIE; the rewrite documents the six-date standard-carrier set, the US-jurisdiction decision, the exact-date policy (no observed-day shift), and the per-step year computation. Behavior-neutral; the full unit layer re-run green (the tdd skill's third step, exercised honestly).
3. The E2E GREEN run: `account.spec.ts` + `checkout.spec.ts` + the a11y census — the standing pins verified green under the refinement. The artifact REBUILT before the E2E run (the playwright webServer boots the pre-built standalone — the session-36 lesson).

### 3.4 Mutations ×3 (each must be caught at the unit layer, then byte-exact reverted — md5-verified)

All three target the seam (the round's only changed production code). The E2E layer's role this round is collateral-damage verification (the standing pins stay green), NOT mutation-catching — the holiday branch is structurally unreachable from the seeded fixtures (§2.3's known limitation, documented):

- **M1 — the regression-to-holiday-blind mutation** (the `isCarrierHoliday` check dropped from the stepper's predicate — the round-38 behavior): the six per-holiday pins + the updated cross-year pin + the full-year sweep fail (8 tests) — the strongest proof: the new pins would catch a regression to the holiday-blind form.
- **M2 — the Thanksgiving computation mutated** (the 4th-Thursday `n = 4` → `n = 3`): the 2026 table oracle fails ("2026-11-19" ≠ "2026-11-26") AND the Thanksgiving pin + the full-year sweep fail (the window stops skipping Nov 26 and starts skipping Nov 19 — both a false positive and a false negative in one mutation).
- **M3 — a fixed-date mutation** (Christmas `Dec 25` → `Dec 26`): BOTH table oracles fail (2026 + 2027) AND the Christmas-week pin ("Dec 24 – 30, 2026" ≠ "Dec 24 – 31, 2026") + the double-holiday pin + the full-year sweep fail.

### 3.5 The full gate

lint (0/0) · typecheck · the FULL unit layer (332 expected) · build · the FULL E2E × 2 consecutive runs on the final code (254 each — the E2E count is unchanged; the ship discipline — the L26/L27 lesson: foreground, not background). Total expected: **586 (332 unit + 254 E2E)**.

## 4. Execution order

1. **RED:** §3.1's unit pins (9 failures for the RIGHT reasons — 7 assertion failures on the refined strings, 2 `is not a function` failures on the missing export; 11 carried-over pins green) + §3.2's comment-only E2E touch.
2. **GREEN:** §3.3 step 1 (the holiday math + the honest rename) → step 2 (the REFACTOR header rewrite) — the full unit layer green at each step.
3. **Mutations ×3** (each caught at the unit layer + byte-exact revert, md5-verified).
4. **Full gate:** lint (0/0) · typecheck · unit (332) · build · the FULL E2E × 2 consecutive runs on the final code (254 × 2).

## 5. Post-change battery + screenshots

- The paired pixel sweep re-run (all 8 routes — the standing drift watch; the round touches NO rendering code path the sweep exercises differently, so the baseline band must hold exactly).
- The 39th mobile-nav verification re-run (token-exact parity must hold — the header/nav surfaces untouched; re-run post-change).
- The watches + census re-run (the touched routes are already in the census walk).
- Screenshots 206–210 (the production standalone — the exact shipped artifact): the Thanksgiving-window customer order detail (a dev-DB order's `placedAt` temporarily set to 2026-11-24T12:00:00Z → the "Nov 30 – Dec 4, 2026" estimate — the round's headline visual, fullPage), the estimate-line close-up (the element capture at deviceScaleFactor 2 — the round-38 VLM OCR lesson), a placed-order confirmation with the live window (a real order placed through the browser — the moving date probed live before the VLM description), the ORD-2026-001 calm-state detail (no estimate line, fullPage — the unchanged resting state), home (the standing anchor). The live DOM probed BEFORE the VLM run (describe reality, not intention); VLM 5/5 required. Dev-DB hygiene after the captures (the placedAt restored, the stray order removed, stock restored — `prisma/dev-cleanup.ts`).

## 6. Docs duty

AGENTS.md (the DELIVERY-WINDOW-3 architecture rule — the six-date standard-carrier set, the exact-date policy, the per-step year computation, the oracle pins + the stale-spot fixes: the (auth)/ route-group bullet's 5 members, the session-12 CSP note's superseded marker) · CLAUDE.md (the session-39 contract + the new unit count 332 / total 586 + the stale-spot fixes: §3's route-handler list gains `/api/stripe/webhook`, §10's "(3 route handlers)" → 4 + the admin `payments` + `account/orders/[id]` omissions) · README (the 586-test row + the account-dashboard estimate clause's carrier-holiday form + the 39th mobile-nav verification + the Testing-table counts) · PAD **v1.39** (ADR-047 + the revision row + the stale-spot fixes found by this round's docs review: the six stale §8.1 E2E per-file rows [checkout 5→9, account 17→27, guest-checkout 1→3, admin 28→32, accessibility 28→29, seo 6→7 — the per-file sum now 254], the ADR-045/046 ordering slip, §9.2's env table gains the three Stripe vars, §11's password-reset "no token table" stale parenthetical, §2's topology + §6.4's PSP note) · SKILL **v1.39.0** (the ADR-047 row + the stale-spot fixes: §20's "(13)" model count → 15, §4.2's "seven measured differences" → eight, the Appendix C latest-plan pointer → session39) · docs/session_77.md · the worklog S39 entry · this plan's sign-offs. `.env.example` verified current (the round adds NO env plumbing — the holiday calendar is code-only).

## Sign-offs (completed at execution)

- [x] RED phase verified failing for the right reasons (9 unit — 6 assertion
      failures on the refined strings + 2 missing-export failures on
      `carrierHolidaysForYear` + the full-year sweep's Memorial-Day property
      violation; 10 carried-over pins GREEN through RED — the calm ×3, the
      March exact pins, the in-transit dual-state, the Jul-4 policy pin, the
      14-day sweep, the constants; the E2E comment-only)
- [x] GREEN + REFACTOR phases — 19/19 in the seam file, the full layer
      332/332 at each step; the E2E GREEN runs (account + checkout + the
      a11y census 66/66 — the standing pins held)
- [x] Mutations ×3 caught at the unit layer + byte-exact reverts
      (md5 6cc7714b2fd7bf05b23dc78477a29e7a verified at every step:
      M1 the holiday check dropped → 7 failures; M2 Thanksgiving 4th→3rd
      Thursday → 4 failures (both year-table oracles); M3 Christmas
      Dec 25→26 → 5 failures)
- [x] Full gate × 2 consecutive runs on the final code (586 total:
      332 unit + 254 E2E — 8.2m + 8.3m)
- [x] Post-change battery (sweep 8/8 at baseline · the 39th mobile-nav
      token-exact re-run · watches + census clean — after one stale-server
      kill-by-port re-run: the pre-change battery's server survived the
      mid-round rebuild and served chunk-hash-less HTML)
- [x] Screenshots 206–210 captured + VLM 5/5 (probe-first; the
      Thanksgiving-window detail with the placedAt tweak honestly described
      in the VLM check; the close-up at 2x; the fresh confirmation
      ORD-2026-005 → "Oct 14 – 20, 2026"; the dev DB restored + cleaned)
- [x] Docs aligned (incl. the PAD §8.1 six-row + §9.2/§11/§2/§6.4 +
      ADR-ordering + SKILL §20/§4.2/§11/Appendix-C + CLAUDE/AGENTS
      stale-spot fixes); committed to main; pushed via the SSH wrapper
