# Remediation Plan — Session 48 (Round 48): CHECKOUT-PAYSTEP-1 — The Checkout Family's Payment-Step States: the Card-Block Visibility Fix, the Selected-Option Border/Bg Fix, and the Card-Fields Container Fix (the Customer-Surfaces Pin-Density Sweep's Sixth Installment)

**Date:** 2026-10-12 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `56121ca` (the session-47 ship `01091c6` + the user's session_94 narrative log)
**Status at audit start:** 665-test gate per run (353 unit + 312 E2E), PAD v1.47, SKILL v1.47.0 — lint 0/0 · tsc clean · 353/353 unit+integration (22 files) · build exit 0 · the full E2E baseline re-run **312/312 (two half-suite invocations: a–m 189 [6.0m] + n–z 123 [3.9m] — the 600s tooling cap)** verified pre-change.

## 0. The round's mandate

The user's standing round instruction (the full audit/parity workflow with the mobile-nav + Tailwind v4 watches; the `.env`/db-root contract — verified: `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root, the hard-link convergence intact at inode 397471 at both paths — a PULL round: `git pull` fast-forwarded `01091c6..56121ca` (docs/session_94.md only — the user's narrative log, docs only, ZERO production code; the recent-changes audit CLEAN); the professional Stripe integration verification — demo mode rests green without keys, the standing credential gates unchanged (NO Stripe test-mode keys or email credentials provided this round — the two standing credential-gated candidates stay gated); the vitest + playwright suites — both verified with the `skills/` exclusion re-confirmed (tsconfig `exclude` + eslint `ignores` + vitest root-anchored `include` + playwright `testDir`); the TDD remediation plan; the screenshots; the `.env.example` — verified current, this round adds NO env plumbing; the docs; and the main-only push via the SSH wrapper). The round's deliverable is audit-derived: session-93's standing "suggested next" — **the checkout family's payment-step states** (the sweep's sixth installment).

## 1. Baseline verification (state at audit start)

- **Workspace intact (PULL, not reset):** `git pull` fast-forward `01091c6..56121ca` (docs/session_94.md — the user's session-94 narrative log, no code); node_modules present; `.env` verified; `db/custom.db` at the repo root with the hard-link convergence intact (inode 397471 at BOTH `db/custom.db` paths); Playwright Chromium cache present; `bun run build` fresh.
- Baseline gate: lint 0/0 · tsc clean · **353/353 unit+integration (22 files)** · build exit 0 · **the full E2E baseline re-run 312/312** (a–m 189 + n–z 123) — the documented session-93/94 ship state verified pre-change.
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd** (the gate-round convention: calibration → the honest RED → pins → mutation-style efficacy proofs), **agent-browser** (the live reference walk — the r48 probes below), **clone-app-pat-pro** (the parity methodology — the DOM probe + the computed style are the ground truth; the VLM descriptions cross-check the structure), **code-review-and-audit** (the lenses on the checkout island's code).
- **The Round-48 live battery (the audit's parity layer, against the production standalone on :3000):** the paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec` painted both sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0% [9 px], checkout 0.01%, account 0% [9 px], login 0.28% — byte-identical to the documented round-42..47 baselines). **The 55th mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks). The standing watches clean (typeahead: the reference fires ZERO search requests; carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11 admin CLEAN. **The dev census 24/24 CLEAN** (ADR-049 verified).

## 2. Audit results

### 2.1 The candidate triage (session-93's "suggested next" list)

1. **The checkout family's payment-step states (CHOSEN — the round's deliverable, below):** session-93's standing "suggested next" — "the card CVC/expiry empty-submit paths, the PayPal branch's resting anatomy." The sweep's method applied: the step-2/3 surfaces enumerated (`checkout-flow.tsx` lines 205-360 read line-by-line — the radio group, the conditional card block, the cardValid gate, the three formatters, the step-3 hidden inputs + the Place Order button) and cross-checked against the E2E layer — the CVC gate paths (empty/short/3/4-digit), the CVC formatter (digits-only + the 4-cap), the card 19-digit ceiling, the expiry gate path, the card block's fate under PayPal selection, the selected option's styling, the card fields' container styling, the method-toggle preservation, the step-3 Back payment preservation, and the Place Order label/lock anatomy ALL had ZERO pins (only checkout.spec's thin "PayPal skips the card fields" — two assertions, no styling/visibility/behavioral depth — and checkout-validation's P4-P9 formatter/round-trip family touch the step). The recent-changes audit: CLEAN (docs only).
2. **The credential-gated items (UNCHANGED):** Stripe test-mode keys and an email provider — no credentials provided this round.
3. **The `take: 100` pagination ceiling + the rate-limiter store migration (RE-DEFERRED — unchanged).**

### 2.2 THE PRIMARY FINDING — the payment-step states: THREE measured visual/behavioral parity divergences (CHECKOUT-PAYSTEP-1)

The surface: `src/components/checkout/checkout-flow.tsx` step 2 (the mock wizard's Payment Method section — the default, unconfigured state) + its step-3 Place Order anatomy. **The step-2 surface has NEVER been parity-audited at this depth** — the pixel sweep captures /checkout at step 1 only (the step-2/3 surfaces are interaction-gated), so the clone's session-1 build liberties in the option styling and the card container survived 47 rounds unseen.

**The calibration (seven probes — `scripts/checkout-paystep-probe-r48[.mjs, b, c, d, e, f, g]`, live, login-gated, full-network watch, the VLM descriptions cross-checking the structure):**

| # | Behavior | Reference (measured) | Clone (pre-fix) | Verdict |
|---|---|---|---|---|
| 1 | **the card block under PayPal** | **STAYS VISIBLE** — the three inputs present AND visible (bbox 573×36, elementsFromPoint hit-test true, opacity 1, overflow visible; D1/R3) — they sit BELOW the options in an unstyled group | **UNMOUNTED** (`{payment.method === "card" && ...}`) | **DIVERGENCE #1 → Fix #1** |
| 2 | the card inputs' `required` attrs | NONE (its Review advances to step 3 with the empty visible fields — D4 measured) | `required` ×3 (inert today — the gate blocks the card path first; would BLOCK the PayPal submit after Fix #1 via native validation) | Fix #1's companion — drop them (the island's gate is the single enforcement) |
| 3 | **the selected option's border** | `border-primary/30` — rgba(230, 107, 26, 0.3), the theme orange at **30% alpha** (the class swap measured in both the resting→selected transitions) | `border-primary` — the FULL orange rgb(230,107,26) | **DIVERGENCE #2 → Fix #2** |
| 4 | **the selected option's background** | **NONE** — transparent in ALL states (selected and unselected alike) | `bg-accent` — rgb(253,243,237) tint on the selected label | **DIVERGENCE #2 → Fix #2** |
| 5 | the option hover | `hover:border-primary/30` + `transition-colors` (the full class string measured: `flex items-center space-x-3 p-4 rounded-xl border border-border hover:border-primary/30 transition-colors`) | `transition-colors` only (no hover token) | Fix #2's companion |
| 6 | **the card fields' container** | **UNSTYLED** — `<div class="">` in the form's space-y-6 rhythm (NO bg, NO border, NO radius, NO padding — the full ancestor chain dumped) | `p-4 rounded-xl bg-secondary/40` — a tinted rounded box | **DIVERGENCE #3 → Fix #3** |
| 7 | the option rows' geometry | boxes 573×50, p-4 (16px), rounded-xl (12px), 20px between; label text 14px/500/rgb(23,23,28) | the same (text-sm font-medium, p-4 rounded-xl) | PARITY |
| 8 | the field layout | card number full-width (573), Expiry+CVC side by side (278 each, 16px gap), labels above | the same grid (sm:grid-cols-2 gap-4) | PARITY (Fix #3 keeps the grid) |
| 9 | the radio | the shadcn family — `aspect-square h-4 w-4 rounded-full border border-primary` + the inner dot | the Radix RadioGroup — the same | PARITY |
| 10 | the Review gate | **NEVER disabled** (resting + every state — the Base44 mock has no gate; A1 measured false at resting) | gated on `cardValid` | SUPERSET (session-44's register) — pin the clone's own paths |
| 11 | the CVC input | raw — "12a4b56" stays, no cap, no inputmode, no maxlength | digits-only, capped at 4, inputmode numeric | SUPERSET formatter — pin as-is |
| 12 | the expiry input | raw — "1228" stays | "12/28" (the slash formatter) | SUPERSET (session-44 P5 pinned) |
| 13 | the card overflow | 20 digits all kept | capped at 19 (the formatter's slice) | SUPERSET — pin |
| 14 | the method-toggle preservation | the values survive card→paypal→card (D3 measured) | the values survive (the state object outlives the unmount) | PARITY — pin |
| 15 | the step-3 Back payment | **RESETS** — method back to card, every value wiped (D5 measured) | PRESERVED (the island's one-state contract) | SUPERSET (session-44's preservation family) — pin |
| 16 | the Place Order label | **"Place Order — $299.99"** (the em-dash + the cart total; its $299.99 cart ships free) | the same (`formatCents(cart.total)`; the clone's free-shipping-over-$100 rule makes a $299.99 cart total $299.99) | PARITY — pin the exact label |
| 17 | the Place Order lock icon | NONE | the `Lock` svg (the trust affordance) | SUPERSET — pin as-is (registered) |
| 18 | the Place Order click-through | navigates to / + ONE telemetry POST (no order write — the mock) | places a real order + the confirmation redirect | SUPERSET (session-44's register) |

**The probe-honesty notes (three):** (1) the first probe's label-based selectors found NOTHING — the reference's card inputs are PLACEHOLDER-ONLY (no accessible labels, no `<Label for>` association — itself a finding: the clone's proper `<Label>` elements are a superset); the placeholder-based locators are the portable form. (2) The r48c label-level style dump measured the reference's `<label>` elements as unstyled — the VLM descriptions of the captures contradicted it — the r48e structural probe reconciled the two: **the option BOX is a parent `<div>`, not the label** (`flex items-center space-x-3 p-4 rounded-xl border ...` wrapping the radio + the label); the clone's label-AS-box structure renders equivalently, only the tokens diverge (#3/#4/#5). (3) The reference's radios report `closest("label")` as empty — the label and the radio are siblings inside the box in the reference's DOM (the clone wraps the radio inside the label — an equivalent-visual structural liberty, click-association verified working on both).

### 2.3 The deliverable's shape

1. **Fix #1 (the parity divergence — the card-block visibility):** `checkout-flow.tsx` — the `{payment.method === "card" && (...)}` conditional REMOVED (the card fields group always renders on step 2) + the `required` attribute dropped from the three card inputs (Card Number/Expiry/CVC). The reference's measured behavior: the fields stay visible under PayPal selection and the Review advance is NOT blocked by empty visible fields (its inputs carry no required — D4). The island's `cardValid` gate remains the single enforcement for the CARD path (a disabled Review button — the superset register, unchanged); the PayPal path's short-circuit (`method === "paypal" ||`) is unchanged. The server side needs NOTHING: `src/lib/actions/checkout.ts` already gates its card checks on `paymentMethod === "card"` (line 81) and the Zod schema makes the card fields optional (`validation.ts` lines 160-162) — the paypal-with-empty-card-fields placement was already the shipped contract.
2. **Fix #2 (the parity divergence — the selected option's styling):** the two option labels' className — the selected state `border-primary bg-accent` → **`border-primary/30`** (the measured 30%-alpha orange, NO background tint), the `hover:border-primary/30` token ADDED (the reference's measured hover), `transition-colors` kept. The unselected state `border-border` unchanged (parity already).
3. **Fix #3 (the parity divergence — the card fields' container):** the card fields group's className `grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-secondary/40` → **`grid grid-cols-1 sm:grid-cols-2 gap-4`** (the tinted box dropped — the reference's fields sit in an unstyled div; the grid layout stays: the measured geometry is identical).
4. **`tests/e2e/paystep-states.spec.ts`** — the NEW spec (11 pins, named `paystep-` so it sorts AFTER `newsletter.spec.ts` and BEFORE `performance.spec.ts` in ASCII — `ne` < `pa` < `pe`; new specs never modify existing pins; the spec uses the auth.setup storageState like checkout.spec):
   - **P1 (parity — THE HONEST RED for Fix #1):** with PayPal selected, the card fields group is STILL RENDERED — the Card Number input VISIBLE via the elementsFromPoint hit-test at its center (the round-46 honest-visibility lesson — toBeVisible is clipping/unmount-blind).
   - **P2 (parity — the required-drop proof):** PayPal + EMPTY card fields → the "Review Order" click ADVANCES to step 3 (the "Review & Place Order" heading renders) — no native-validation block (the reference's D4 behavior; the pin's teeth: a restored `required` stalls the advance — the M2 proof).
   - **P3 (superset):** the CVC gate paths on the card path — valid card+expiry with CVC empty → Review disabled; "12" → disabled; "123" → enabled; "1234" → enabled (the Amex 4-digit form).
   - **P4 (superset):** the CVC formatter — typing "12a4b56" → "1245" (the non-digits stripped, the 4-cap enforced — the reference keeps the raw "12a4b56").
   - **P5 (superset):** the card 19-digit ceiling — typing 20 digits → the formatter keeps 19 ("4242 4242 4242 4242 424").
   - **P6 (parity — THE HONEST RED for Fix #2):** the selected (PayPal) option's computed border = `rgba(230, 107, 26, 0.3)` (the /30 alpha) AND its computed background = transparent (NO accent tint).
   - **P7 (parity):** the UNselected (Card) option's border stays the stone `rgb(233, 230, 226)` with a transparent background (both states' unselected contract).
   - **P8 (parity — THE HONEST RED for Fix #3):** the card fields' container carries NO tinted box — the computed background of the fields' parent group is transparent AND its border-radius/padding are 0 (the unstyled-div contract).
   - **P9 (parity):** the method-toggle preservation — fill the card fully, select PayPal, toggle back to Card → every value survives (the reference's D3 parity).
   - **P10 (superset):** the step-3 Back preservation — walk to step 3 with PayPal, Back → step 2 keeps PayPal selected + the card values (the reference RESETS — D5; the clone's one-state superset).
   - **P11 (parity):** the step-3 Place Order label reads exactly "Place Order — $299.99" (the em-dash + the free-shipped total of the 1-item cart) + the Lock icon present (the registered superset affordance, same pin).
5. **NO other production code changes.** The three fixes are the round's only production diffs (one conditional removed + three required attrs dropped; one className expression; one className string).

## 3. The TDD plan (the gate-round convention: calibration → RED-first for the fixes → pins → mutations)

### 3.1 Calibration (done — the reference measured live across seven probes + the VLM structure cross-check)

§2.2's table. The three divergences (#1 the card-block visibility, #3/#4 the selected border/bg, #6 the card container) each carry a first-hand measurement: the visibility hit-test (R3), the computed styles in both selection states (r48e), the full class strings (r48g), and the ancestor chains (r48e/r48f).

### 3.2 The honest RED (the three fixes, TDD-first)

Write P1 + P6 + P8 FIRST → run against the CURRENT artifact → ALL THREE FAIL (P1: the card input not found under PayPal; P6: the border is the full orange + the accent bg; P8: the container carries the tinted box) → apply Fix #1 + Fix #2 + Fix #3 → re-run → GREEN. The round's red→green proof — the failing pins written before the fixes, exactly as the CLAUDE.md TDD rule demands for behavior changes.

### 3.3 The pins, written to the measured truth

The 11-pin spec (§2.3). P2/P3/P4/P5/P7/P9/P10/P11 document existing/superset behavior (the gate-round form). The spec follows the family's conventions: the checkout beforeEach (clearCartViaDrawer → PDP add → drawer → Checkout link — the helpers.ts `openCartDrawer` form), the demo user's prefilled First/Last/Email (only the address block needs filling), and the computed-style assertions via `evaluate` (the clone-app-pat-pro methodology — computed styles over screenshots).

### 3.4 The mutation-style efficacy proofs ×5 (each caught at the E2E layer on the REBUILT artifact — the session-36 lesson, then byte-exact revert, md5-verified at every step)

- **M1 (Fix #1's conditional restored):** `{payment.method === "card" && (...)}` back → **exactly P1 fires** (the input unmounts under PayPal); P2 stays green (no required inputs in the DOM → the advance still works — the mutation's own proof that P2's teeth are the required attrs, not the visibility).
- **M2 (the required attrs restored):** `required` back on the three inputs (Fix #1's conditional still removed) → **exactly P2 fires** (the native validation blocks the PayPal submit with the empty visible fields); P1 stays green (the fields are still visible); P3-P5/P9-P11 green (the card path fills the fields — required satisfied).
- **M3 (Fix #2 reverted):** the selected className back to `border-primary bg-accent` → **exactly P6 fires** (the full-opacity border + the accent bg).
- **M4 (Fix #3 reverted):** the container's `p-4 rounded-xl bg-secondary/40` restored → **exactly P8 fires** (the tinted box back).
- **M5 (the CVC formatter's cap loosened):** `slice(0, 4)` → `slice(0, 6)` on the CVC onChange → **exactly P4 fires** ("12456" survives where the pin expects the 4-cap "1245"); P3 stays green (the gate's regex `^\d{3,4}$` is length-independent of the cap).

### 3.5 The full gate (the regression proof)

lint (0/0) · typecheck · the FULL unit layer (353 — unchanged) · build · **the FULL E2E × 2 consecutive runs on the final code (312 + 11 = 323 per run, each as two half-suite invocations a–m/n–z — the 600s tooling cap)**.

## 4. Execution order

1. **Calibration:** the seven reference probes + the VLM cross-check (done, §3.1).
2. **RED:** write P1 + P6 + P8 → run against the current artifact → the honest RED (all three divergences confirmed at the E2E layer).
3. **FIX:** Fix #1 (the conditional + the required attrs) + Fix #2 (the selected className) + Fix #3 (the container className) → P1 + P6 + P8 GREEN (the red→green cycle).
4. **PINS:** write the full 11-pin spec; run it (323 total); the unit layer re-run (353 — unchanged).
5. **Mutations ×5** (§3.4 — each caught + byte-exact revert, the artifact rebuilt for every E2E proof).
6. **Full gate:** lint · typecheck · unit · build · the FULL E2E × 2 consecutive runs.

## 5. Post-change battery + screenshots

- The paired pixel sweep re-run (all 8 routes — the three fixes live on the step-2 INTERACTION surface, which the resting sweep cannot reach; the resting /checkout (step 1) is untouched → the sweep must stay byte-identical) + the **56th mobile-nav verification** re-run (token-exact parity must hold).
- **Screenshots 251-255** (probe-first, single invocation, the production standalone on :3001 — a FRESH process): the step-2 resting anatomy with CARD selected (the standing anchor — the unboxed fields + the stone borders); the step-2 with PAYPAL selected — the card fields STILL VISIBLE below the options (Fix #1's proof state) + the /30-alpha selected border (Fix #2's proof state); the CVC formatter mid-type (the digits-only 4-cap — the superset anchor); the step-3 review with the "Place Order — $299.99" label + the lock icon (P11's proof state); the step-2 after the step-3 Back with PayPal still selected + the values intact (P10's superset proof). **VLM 5/5 verification** (describe the surface as it IS — the round-40..47 lesson; the DOM probe is the ground truth).
- A step-2 pixel comparison against the reference's captures (the /tmp/probe-r48 reference screenshots — the resting + paypal-selected states) as the round's visual-parity eyeball for the interaction surface the sweep cannot reach.

## 6. Docs duty (this round's deliverable + the round's own records)

The PAD **v1.48** (§8.1's paystep-states row + the Total row 48/676/353+323; §8.4's checklist 323; §3.2's tree 25 specs + the paystep-states entry; the v1.48 revision row; the header's Last-Updated session tag) · SKILL **v1.48.0** (the version; §11's counts reconciled to 353/323; the line-31 session pointer; Appendix C → session48) · AGENTS.md (the paystep bullet + the placeholder-only-inputs lesson + the label-vs-box DOM reconciliation lesson) · CLAUDE.md (323 + the checkout family's parity-contract update — the card-block visibility, the /30 border, the unstyled container) · README (the 676 row + the Testing table + the mobile-nav 56 row) · the drift-watch verifier's spec-count recalibration 24→25 and re-run GREEN · `docs/session_95.md` (the round narrative) · the worklog S48 entry · this plan's sign-offs · `.env.example` verified current (NO env plumbing).

## Sign-offs (completed at execution)

- [x] Calibration recorded (the seven probes r48/b/c/d/e/f/g + the VLM cross-check — the visibility hit-test, the /30 border, the no-bg contract, the unstyled container, the full class strings, the geometry; the code read line-by-line)
- [x] The honest RED (P1 + P6 + P8 written first, ALL THREE failing on the current artifact — P1 the input unmounted, P6 the full-orange + accent, P8 the tinted box) → the three fixes → GREEN
- [x] Pins green (the 11-pin spec on the fixed artifact, 12/12 incl. the setup login; the unit layer 353 unchanged)
- [x] Mutations ×5 caught + byte-exact reverts (md5 5d457e6b26325b068ed825b746221f79 verified at every step; each on the REBUILT artifact): M1 the conditional restored → P1 + P10 (P10's card-value assertions execute in the paypal-selected state the mutation unmounts — an honest two-pin catch); M2 the required restored → exactly P2 (the native block stalls the advance); M3 the styling reverted → exactly P6; M4 the container restored → exactly P8; M5 the CVC cap 4→6 → exactly P4
- [x] Full gate × 2 consecutive runs on the final code (353 + 323 × 2 = 676 per run, each as two half-suite invocations a–m 189 + n–z 134; lint 0/0 · tsc clean · build 0)
- [x] Post-change battery (sweep 8/8 at baseline — byte-identical, the fixes live on the interaction-gated surface · the 56th mobile-nav token-exact · screenshots 251-255 VLM 5/5 FIRST-RUN — the probe-first discipline · the step-2 reference comparison carried by the r48c/d/e computed-style probes + the VLM cross-check)
- [x] Docs aligned (PAD v1.48, SKILL v1.48.0 + lesson 052, AGENTS, CLAUDE, README, the verifier's spec-count recalibration 24→25 + the §12 line-count drift it caught — the drift watch re-run ALL FAMILIES GREEN, session_95.md, the worklog S48 entry); committed to main; pushed via the SSH wrapper
