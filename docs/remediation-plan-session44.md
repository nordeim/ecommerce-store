# Remediation Plan — Session 44 (Round 44): CHECKOUT-VALIDATION-1 — The Checkout Validation Paths + the Edit-Back Navigation (the Customer-Surfaces Pin-Density Sweep's Second Installment)

**Date:** 2026-10-11 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `023e32f` (the session-43 ship `8439c12` + the user's session_86 narrative log)
**Status at audit start:** 621-test gate (353 unit+integration + 268 E2E), PAD v1.43, SKILL v1.43.0 — lint 0/0 · tsc clean · 353/353 unit+integration (22 files) · build exit 0 · the full E2E baseline re-run **268/268 (8.7m, foreground)** verified pre-change; the round-40 drift watch re-run **GREEN 25/25** at audit start.

## 0. The round's mandate

The user's standing round instruction (the full audit/parity workflow with the mobile-nav + Tailwind v4 watches; the `.env`/db-root contract — verified: `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root, the hard-link convergence applied at inode 304431 both paths — a RESET round: fresh clone at `023e32f`, `bun install` 475 packages, `db:setup` re-seeded, Playwright Chromium v1243 reinstalled, `tests/db-path.test.ts` 15/15; the professional Stripe integration verification — demo mode rests green without keys, the standing credential gates unchanged; the vitest + playwright suites — both verified with the `skills/` exclusion re-confirmed in all four configs (tsconfig `exclude`, eslint `ignores`, vitest `include` — `src/**` + `tests/**` only, playwright `testDir` — `./tests/e2e`); the TDD remediation plan; the screenshots; the `.env.example` — verified current, this round adds NO env plumbing; the docs; and the main-only push via the SSH wrapper). No Stripe test-mode keys or email credentials were provided (the two standing credential-gated candidates stay gated), so the round's deliverable is audit-derived.

## 1. Baseline verification (state at audit start)

- **Fresh clone at `023e32f`** (the workspace was RESET — no node_modules, no `.env`, no `db/`, no Playwright cache; `bun install` 475 packages lockfile-pinned, `cp .env.example .env`, `bun run db:setup` seeded at the SHADOW path — the injected shell `DATABASE_URL` wins, the documented trap; hard-link convergence applied: inode 304431 at BOTH `db/custom.db` paths; Playwright Chromium v1243 + headless shell installed).
- Baseline gate: lint 0/0 · tsc clean · **353/353 unit+integration (22 files)** · build exit 0 · **the full E2E baseline re-run 268/268 (8.7m, foreground)** — the documented session-85/86 ship state verified pre-change; the round-40 drift watch re-run **GREEN 25/25** at audit start.
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd** (the RED-GREEN-REFACTOR discipline — for a test-infrastructure round, the gate-round convention: calibration → pins → mutation-style efficacy proofs), **agent-browser** (the live reference walk — the checkout validation probe below), **clone-app-pat-pro** (the parity methodology — the reference's ungated mock vs the clone's validated superset), **code-review-and-audit + code-quality-standards** (the lenses on the checkout island's code).
- **The Round-44 live battery (the audit's parity layer, against the production standalone on :3000 — the exact shipped artifact, via `scripts/battery-runner.sh prod`):** the paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, both sides painted on slide `1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%, checkout 0.01%, account 0%, login 0.28% — byte-identical to the documented round-42/43 baselines). **The 47th mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500 with identical hrefs; the Electronics deep-link + auto-close). The standing watches clean (typeahead: the reference fires ZERO search requests; carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD). The console census **24 routes + 11 admin + the date-window family (3 routes) CLEAN**. **The dev census 24/24 CLEAN** (zero console errors, zero painted dev-tool badges — ADR-049 verified working first-hand).

## 2. Audit results

### 2.1 The candidate triage (session-85's "suggested next" list)

1. **The checkout-family validation paths (CHOSEN — the round's deliverable, below):** session-85's own named "natural next" — "the pin-density sweep's second installment — the checkout-family validation paths (the shipping form's error states, the edit-back navigation) are the next-thinnest customer surface." The sweep's method applied: the checkout island's behaviors enumerated (`src/components/checkout/checkout-flow.tsx` read line-by-line) and cross-checked against the E2E layer. First-hand findings: checkout.spec.ts pins 9 (the empty-cart block, the full happy path's AGGREGATE disabled-at-start states, the delivery estimate, the history landing, the PayPal skip, the summary aside, the autoComplete tokens, the refunded confirmation, the deep-link), guest-checkout 3, stripe 5 — but the island's VALIDATION surface (the per-field gates + their recovery), the CARD FORMATTERS (the digit grouping, the slash insertion, the CVC stripping), and the ENTIRE edit-back navigation (the step-2 Back, the step-3 Edit × 2 + Back, and their state preservation) have ZERO pins. The validation logic (`shippingValid`, `cardValid`, `formatCardNumber`, `formatExpiry`) lives only inside the client island — no unit seam, no E2E pin. The densest gap in the family — exactly what the sweep exists to find.
2. **The `take: 100` pagination ceiling (RE-DEFERRED — unchanged):** the seed fixture is 4 orders; the date-range window (ADR-048) is the reach-past tool; server-side pagination deferred until fixture scale demands it.
3. **The rate-limiter store migration (RE-DEFERRED — the PAD's open Medium, unchanged):** correct for single-instance SQLite.
4. **The credential-gated items (UNCHANGED):** Stripe test-mode keys and an email provider — no credentials provided this round.
5. **The recent-changes audit (session-43's `tests/e2e/newsletter.spec.ts` + `prisma/e2e-reset.ts`):** re-read line-by-line — CLEAN (test-infra only, zero production code; the 8/8 spec + the reset clear are the proof; the drift watch GREEN 25/25).

### 2.2 THE PRIMARY FINDING — the checkout validation surface + the edit-back navigation: the family's thinnest coverage (CHECKOUT-VALIDATION-1)

The surface (shipped session-0, refined since): the checkout island gates BOTH steps client-side and formats the card fields as the customer types. The measured gaps, first-hand:

- **The per-field validation gates are untested beyond the aggregate empty-state.** The happy path pins `Continue` disabled on the EMPTY form and `Review Order` disabled on the EMPTY card — but the FIELD-LEVEL gates (the email regex, the ZIP `^\d{5}(-\d{4})?$` format, the address ≥3 / city ≥2 / state ≥2 length floors, the card's 13–19 digit floor, the MM/YY expiry format, the 3–4 digit CVC) and their RECOVERY (fix the field → the button enables) have zero pins. A regression that loosens the email regex or the ZIP pattern to `.*` would ship green today.
- **The card formatters are untested at every layer.** `formatCardNumber` groups digits into "4242 4242 4242 4242" as the customer types; `formatExpiry` inserts the slash ("1228" → "12/28"); the CVC input strips non-digits. None have unit pins (inline in the island — no seam) and none have E2E pins. A regression that returns the raw digits would ship green today.
- **The edit-back navigation + its state preservation are completely untested.** The island keeps ONE React state object across the steps: step 2's Back returns to step 1 with the shipping values INTACT; step 3's Edit (Shipping) returns to step 1 preserved; step 3's Edit (Payment) returns to step 2 with the card intact; step 3's Back returns to step 2; and an EDITED address reaches the review (the edit loop closes). None of it is pinned — a regression that resets state on step transitions (a `key`-remount, a state-shape change) would ship green today.

**The reference relationship (measured live this round, `scripts/checkout-validation-probe-r44[e/f].mjs` — the drawer path: PDP add → the ICON-ONLY header cart button → the drawer's Checkout link):** the reference's checkout step 1 renders the same seven-field anatomy (placeholders "John"/"Doe"/"john@example.com"/"123 Main St"/"New York"/"NY"/"10001") but its **"Continue to Payment" button is NEVER disabled** — resting, every invalid state, always enabled (measured: resting false, all-valid false, bad-email false, bad-zip false, short-address false, restored false — the Base44 mock has NO gate at all). Its step 2's "Review Order" is likewise always enabled. Its card input does NO formatting (typing "4242424242424242" stays raw; typing "1228" stays "1228"). Its step 2 → Back → step 1 RESETS the form (the fields render empty — measured: `{"first":"","email":"","city":""}`), and forward again → step 2 renders the card EMPTY. Its step 3 ("Review & Place Order") carries NO shipping/payment summary cards and NO Edit affordances (buttons: Back + "Place Order — $299.99" only; the main text shows the item + totals, no address). The probe lesson: the reference's header cart button is ICON-ONLY (its accessible name is the badge count) — a `/cart/i` role-name regex accidentally matches the PDP's "Add to Cart" (the v4 probe's misfire, VLM-diagnosed: the toast + badge 2); the correct selector is the lucide shopping-bag filter (the clone's own helpers.ts pattern).

**Why this is the round's deliverable (the judgment call, made):** it is session-85's own standing "natural next," the audit's densest first-hand gap (a customer-critical surface — the money path's input validation — whose entire validation + navigation contract has zero pins at any layer), and the test-infrastructure-round precedent is established (the a11y gate session-15/16, the perf gates 17/18/21, the SEO gate 20, the newsletter pins session-43); the mutations prove the pins have teeth. The pins are ALL SUPERSET pins (the reference has no gate, no formatter, no preservation, no Edit affordances — measured live) — zero parity risk by construction: the round changes NO production code.

### 2.3 The deliverable's shape

1. **`tests/e2e/checkout-validation.spec.ts`** — the NEW spec (9 pins, all superset):
   - **P1 (email gate):** the demo defaults prefill name/email; break the email to "ada@example" (no TLD) + fill valid address fields → `Continue to Payment` stays DISABLED; fix to "ada@example.com" → ENABLED (the dynamic recovery).
   - **P2 (ZIP gate):** ZIP "abcde" → DISABLED; "1000" (4 digits) → DISABLED; "10001" → ENABLED.
   - **P3 (length floors):** address "12" → DISABLED; fixed + city "N" → DISABLED; fixed + state "N" → DISABLED; all fixed → ENABLED.
   - **P4 (card formatter):** type raw "4242424242424242" → the input renders "4242 4242 4242 4242" (the grouping).
   - **P5 (expiry formatter):** type "1228" → the input renders "12/28" (the slash insertion).
   - **P6 (card gate):** a 12-digit card + valid expiry + CVC → `Review Order` DISABLED; the full 16-digit card → ENABLED. (The CVC digit-stripping rides along: the CVC fill "123" after a stray letter is stripped by construction — the fill is digits-only.)
   - **P7 (step-2 Back preservation):** fill step 1 → Continue → fill the card → Back → step 1 fields STILL filled (the address/city/state/zip survive) → Continue → step 2 card STILL filled (one React state across the steps).
   - **P8 (the Shipping edit loop):** reach step 3 → the review's Shipping Address card renders (the superset card + the Edit button — the reference's step 3 has neither) → Edit → step 1 preserved → CHANGE the city → Continue → Review Order → step 3's review shows the UPDATED city (the edit loop closes).
   - **P9 (the Payment edit + the full round trip):** reach step 3 → Edit (Payment) → step 2 card preserved ("4242 4242 4242 4242" / "12/28") → Back → step 1 values still preserved (the three-way round trip).

2. **NO production code changes.** The pins document existing behavior (the island read line-by-line this round — clean: the gate predicates, the formatters, and the single-state step machine all follow the established conventions; the formatters stay inline — the E2E pins now cover them, and a seam extraction would be a production change this round deliberately does not make).

## 3. The TDD plan (the gate-round convention: calibration → pins → mutations)

### 3.1 Calibration (the RED-equivalent for a test-infrastructure round)

The reference probe (`scripts/checkout-validation-probe-r44[e/f].mjs`, live — the drawer path): the UNGATED reference measured first-hand (Continue never disabled; no card formatting; Back resets the form; no step-3 Edit affordances) — every pin is therefore a SUPERSET pin with zero parity risk. The clone's behavior read line-by-line from `checkout-flow.tsx` (the gate predicates `shippingValid`/`cardValid`, the formatters `formatCardNumber`/`formatExpiry`, the single-state step machine, the step-3 Edit buttons) — the superset pins' ground truth.

### 3.2 The pins, written to the measured truth

The 9-pin spec (§2.3). Run against the current artifact: **all green by design** — the pins document existing behavior (the gate-round form; the RED discipline lives in the mutations). The spec follows the family's established conventions: the beforeEach cart setup (clearCartViaDrawer → PDP add → the drawer's Checkout link — the same shape as checkout.spec.ts), the `getByRole("main")` scoping (the footer's field collisions), and the post-fill settle waits (the island's controlled inputs re-render per keystroke).

### 3.3 The mutation-style efficacy spot-checks ×3 (each caught at the E2E layer, the artifact REBUILT for every proof — the session-36 lesson, then byte-exact revert, md5-verified at every step)

- **M1 (the email gate):** the email regex loosened in `checkout-flow.tsx` (the `test` replaced with a match-everything form) → **P1 fires** (Continue ENABLED with the bad email); P2/P3 stay green (their flows carry a VALID email — the zip/address gates alone hold the disabled state) — the precise mutation→pin mapping.
- **M2 (the card formatter):** `formatCardNumber` returns the raw digits → **P4 fires** (the input value "4242424242424242", not grouped); P5/P6 stay green (the expiry formatter and the gate predicate are untouched — the gate strips non-digits itself).
- **M3 (the state preservation):** step 2's Back button resets the shipping state (`onClick={() => setStep(1)}` → a reset-then-step form) → **P7 fires** (the address/city lost after Back) AND **P9 fires** (its path clicks the same Back button); P8 stays green (its path uses step 3's Edit button, not step 2's Back) — the two-pin mapping.

### 3.4 The full gate (the regression proof)

lint (0/0) · typecheck · the FULL unit layer (353 — unchanged) · build · **the FULL E2E × 2 consecutive runs on the final code (268 + 9 = 277 each run — the L26/L27 lesson: foreground)**.

## 4. Execution order

1. **Calibration:** the reference probe (done, §3.1) + the code read (done).
2. **PINS:** write `tests/e2e/checkout-validation.spec.ts`; run the spec (268 + 9 = 277 green); the unit layer re-run (353 — unchanged).
3. **Mutations ×3** (§3.3 — each caught + byte-exact revert, the artifact rebuilt for every E2E proof).
4. **Full gate:** lint · typecheck · unit · build · the FULL E2E × 2 consecutive runs.

## 5. Post-change battery + screenshots

- The pins' own proof IS the deliverable's battery (the validation paths + the edit-back navigation exercised end-to-end through the production standalone).
- The paired pixel sweep re-run (all 8 routes — a test-only round must be pixel-INVISIBLE; the baseline band must hold exactly) + the 48th mobile-nav verification re-run (token-exact parity must hold).
- **Screenshots 231–235** (probe-first, single invocation, the production standalone on :3001 — a FRESH process): the checkout step-1 resting anatomy (the standing anchor for the round); the step-1 GATED state (an invalid email + valid address fields — probe: Continue `disabled` — the superset gate the reference lacks); the step-2 formatted card fields (probe: the grouped card number + the slashed expiry — typed raw, rendered formatted); the step-3 review with the Shipping Address + Payment cards + the Edit buttons (probe: both cards render + the reference lacks them); the step-1-after-Edit state (probe: the values preserved + the changed city reaching the review). VLM 5/5 verification (describe the surface as it IS — the round-40..43 lesson).

## 6. Docs duty (this round's deliverable + the round's own records)

The PAD **v1.44** (§8.1's checkout-validation row + the Total row 44/630/353+277; §8.4's checklist 277; §3.2's tree 21 specs + the checkout-validation entry; the v1.44 revision row — the ADR ledger UNCHANGED, a test-coverage round) · SKILL **v1.44.0** (the E2E inventory's checkout-validation row + Appendix C → session44) · AGENTS.md (the checkout-validation bullet + the count rows) · CLAUDE.md (277) · README (the 630 row + the Testing table + the mobile-nav 48 row) · `docs/session_87.md` (the round narrative) · the worklog S44 entry · this plan's sign-offs · the drift watch recalibrated (the count spots 268 → 277) and re-run GREEN · `.env.example` verified current (NO env plumbing).

## Sign-offs (completed at execution)

- [x] Calibration recorded (the reference probe — the ungated mock measured live: Continue never disabled, no card formatting, Back resets the form, no step-3 Edit affordances; the code read line-by-line)
- [x] Pins green (10/10 on the current artifact incl. the setup login — 9 new pins, all green on the first run, the gate-round form; the unit layer 353 unchanged)
- [x] Mutations ×3 caught + byte-exact reverts (md5 d343f5cf… verified at every step; each on the REBUILT artifact — M1 the email regex loosened → exactly P1; M2 the formatter returns raw → exactly P4+P7+P9, the three pins asserting the formatted value; M3 the Back resets state → exactly P7+P9, P8's path uses step 3's Edit)
- [x] Full gate × 2 consecutive runs on the final code (353 + 277 × 2 = 630 total — 9.4m + 9.4m)
- [x] Post-change battery (sweep 8/8 at baseline — byte-identical, pixel-invisible · the 48th mobile-nav token-exact — the 47th + 48th in one round · screenshots 231–235 VLM 5/5 after one description correction — the VLM reads placeholders as typed values)
- [x] Docs aligned (PAD v1.44 — the row + Total 44/630/353+277 + the tree 21 specs + two pre-existing count drifts repaired (the unit layer 19→20 files, the docs folder 40→44 plans) + the revision row, SKILL v1.44.0, AGENTS, CLAUDE, README, the verifier's spec-count recalibration 20→21 — the drift watch re-run GREEN 25/25, session_87.md, the worklog S44 entry); committed to main; pushed via the SSH wrapper
