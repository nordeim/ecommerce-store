# Remediation Plan — Session 49 (Round 49): CART-STEPPER-1 — The Quantity-Stepper Boundary States: the PDP Minus-Floor Fix, the Drawer Decrement-to-Remove Fix, and the /Cart Consistency Fix (the Customer-Surfaces Pin-Density Sweep's Seventh Installment)

**Date:** 2026-10-12 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `ba423d8` (the session-48 ship `53f5bfc` + the user's session_96 narrative log)
**Status at audit start:** 676-test gate per run (353 unit + 323 E2E), PAD v1.48, SKILL v1.48.0 — lint 0/0 · tsc clean · 353/353 unit+integration (22 files) · build exit 0 · the full E2E baseline re-run **all 321 chromium tests + the setup login GREEN (four invocations: a–c 149 [3.9m], c–m 41 [2.2m], n–s 53 [2.6m], s–z 82 [2.3m] — the 600s tooling cap)** verified pre-change.

## 0. The round's mandate

The user's standing round instruction (the full audit/parity workflow with the mobile-nav + Tailwind v4 watches; the `.env`/db-root contract — verified: `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root, the hard-link convergence intact at inode 397471 at both paths — a PULL round: `git pull` fast-forwarded `53f5bfc..ba423d8` (docs/session_96.md only — the user's narrative log, docs only, ZERO production code; the recent-changes audit CLEAN); the professional Stripe integration verification — demo mode rests green without keys, the standing credential gates unchanged (NO Stripe test-mode keys or email credentials provided this round — the two standing credential-gated candidates stay gated); the vitest + playwright suites — both verified with the `skills/` exclusion re-confirmed (tsconfig `exclude` + eslint `ignores` + vitest root-anchored `include` + playwright `testDir`); the TDD remediation plan; the screenshots; the `.env.example` — verified current, this round adds NO env plumbing; the docs; and the main-only push via the SSH wrapper). The round's deliverable is audit-derived: session-95's standing "suggested next" — **the cart drawer's stepper boundary states + the PDP quantity/stock edge family** (the sweep's seventh installment).

## 1. Baseline verification (state at audit start)

- **Workspace intact (PULL, not reset):** `git pull` fast-forward `53f5bfc..ba423d8` (docs/session_96.md — the user's session-96 narrative log, no code); node_modules present; `.env` verified; `db/custom.db` at the repo root with the hard-link convergence intact (inode 397471 at BOTH `db/custom.db` paths); Playwright Chromium cache present; `bun run build` fresh.
- Baseline gate: lint 0/0 · tsc clean · **353/353 unit+integration (22 files)** · build exit 0 · **the full E2E baseline re-run all green** (the 321 chromium tests + the setup login, four invocations under the 600s cap) — the documented session-95/96 ship state verified pre-change.
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd** (the gate-round convention: calibration → the honest RED → pins → mutation-style efficacy proofs), **agent-browser** (the live reference walk — the r49 probes below), **clone-app-pat-pro** (the parity methodology — the DOM probe + the computed style are the ground truth; the VLM descriptions cross-check the structure), **code-review-and-audit** (the lenses on the stepper island's code).
- **The Round-49 live battery (the audit's parity layer, against the production standalone on :3000):** the paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec` painted both sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0% [9 px], checkout 0.01%, account 0% [9 px], login 0.28% — byte-identical to the documented round-42..48 baselines). **The 57th mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks). The standing watches clean (typeahead: the reference fires ZERO search requests; carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11 admin CLEAN.

## 2. Audit results

### 2.1 The candidate triage (session-95's "suggested next" list)

1. **The cart drawer's stepper boundary states + the PDP quantity/stock edge family (CHOSEN — the round's deliverable, below):** session-95's standing "suggested next". The sweep's method applied: the three stepper surfaces enumerated (`src/components/store/buy-panel.tsx` — the PDP stepper with its `disabled={quantity <= 1}` floor and its `Math.min(99, stock)` ceiling; `src/components/store/cart-drawer.tsx` — the drawer stepper with its own `disabled={item.quantity <= 1}` floor and its never-disabled plus; `src/app/(storefront)/cart/cart-client.tsx` — the full-page cart's identical form) and cross-checked against the E2E layer — the boundary states had ZERO pins: cart.spec's stepper tests cover the happy path only ("PDP add respects the quantity stepper" — one plus click; "quantity stepper in the drawer updates totals" — two plus clicks then the trash), stock.spec covers the SERVER clamps (the drawer +1 clamped at stock 2, the oversell rejection, the sold-out PDP) — but the minus-at-1 floor, the decrement-to-remove question, the plus ceilings, and the boundary anatomy were never measured against the reference NOR pinned. The session-2 comment ("production-correct extras the reference lacks (aria-labels, disabled minus at qty 1)") was an ASSUMPTION from before the pin-density methodology existed — the reference's actual boundary behavior had never been measured. The recent-changes audit: CLEAN (docs only).
2. **The account family's remaining error surfaces (RE-DEFERRED):** the account family already carries two dedicated rounds (session-45's validation paths + session-47's auth error density); the remaining unpinned surfaces are thinner than the stepper family.
3. **The credential-gated items (UNCHANGED):** Stripe test-mode keys and an email provider — no credentials provided this round.

### 2.2 THE PRIMARY FINDING — the stepper boundary states: TWO measured parity divergences + one consistency gap (CART-STEPPER-1)

The surfaces: the PDP buy-panel stepper, the cart-drawer stepper, and the full-page cart stepper. **The boundary states are INTERACTION-GATED** — the pixel sweep never opens the drawer (it renders nothing at rest on /cart and the PDP's resting stepper at qty 1 is the only captured state, where the disabled minus at opacity 0.4 vs the reference's opacity 1.0 is a ~28% opacity delta on a 44×44 px control — inside the sweep's noise band on the pdp route's 0.34% baseline) — so the clone's session-2 build liberty survived 48 rounds unseen.

**The calibration (three probes — `scripts/stepper-probe-r49.mjs` + `r49b.mjs` (reference, login-gated, content-scoped after the overlay-selector lesson) + `stepper-clone-r49c.mjs` (clone, via the battery runner), live, the VLM descriptions cross-checking the captures):**

| # | Behavior | Reference (measured) | Clone (pre-fix) | Verdict |
|---|---|---|---|---|
| 1 | **the PDP minus at qty 1** | **ENABLED** — no `disabled` attr, opacity 1, cursor pointer; the click is a **NO-OP** (qty stays "1") | `disabled={quantity <= 1}` + `disabled:opacity-40` — opacity 0.4, cursor default | **DIVERGENCE #1 → Fix #1** |
| 2 | the PDP minus classes | `p-3 hover:bg-secondary transition-colors rounded-l-xl` (the full string) | the same + ` disabled:opacity-40` | Fix #1's companion (drop the token) |
| 3 | the PDP plus classes | `p-3 hover:bg-secondary transition-colors rounded-r-xl` — NEVER disabled (8 clicks → qty 9, still enabled; no cap found) | the same + ` disabled:opacity-40`, `disabled={quantity >= Math.min(99, stock)}` | SUPERSET (the stock/99 ceiling — registered; the token is inert in the reference's range) — pin both the normal-range parity and the ceiling |
| 4 | the PDP qty span | `px-5 font-medium min-w-[3rem] text-center` (min-width 48px, padding 0 20px, weight 500) | identical | PARITY |
| 5 | the PDP stepper container | `flex items-center border border-border rounded-xl` (radius 12px) | identical (radius 12px) | PARITY |
| 6 | **the drawer minus at qty 1** | **ENABLED + the click REMOVES the item** — "Cart (1)" → "Cart (0)" → the empty state ("Your cart is empty" + "Start Shopping"), zero item rows (the definitive r49b measurement on a fresh item) | `disabled={item.quantity <= 1}` + `disabled:opacity-40`; removal only via the trash button | **DIVERGENCE #2 → Fix #2** |
| 7 | the drawer minus/plus classes | `p-1.5 hover:bg-secondary transition-colors rounded-l-lg` / `rounded-r-lg` (padding 6px) | the minus carries ` disabled:opacity-40` extra; the plus is byte-identical | Fix #2's companion |
| 8 | the drawer qty span | `px-3 text-sm font-medium min-w-[2rem] text-center` (32px, 14px) | identical | PARITY |
| 9 | the drawer container | `flex items-center border border-border rounded-lg` (radius 12px — the reference's `rounded-lg` is the shadcn `--radius` 12px, NOT v4's default 8px; the clone's pinned `--radius-lg: var(--radius)` = 12px matches) | identical (radius 12px) | PARITY |
| 10 | the drawer plus at high qty | NO cap, NO error copy (6 clicks → qty 7, plus still enabled, the money tracks: $2099.93) | never disabled in the UI; the server clamps silently at stock | SUPERSET (the registered stock enforcement, pinned by stock.spec) |
| 11 | the stepper aria-labels | NONE (ariaLabel null on both buttons, both surfaces) | "Decrease quantity" / "Increase quantity of «name»" | SUPERSET (accessibility) — keep |
| 12 | the full-page cart minus at qty 1 | (the reference hardcodes /cart to the EMPTY state — verified live session-2; the clone's real cart page is pure superset) | `disabled={item.quantity <= 1}` + `disabled:opacity-40` | **CONSISTENCY GAP → Fix #3** (one design language across the clone's own surfaces) |
| 13 | the server's decrement-to-remove | (the reference's localStorage cart: the minus-at-1 write removes the line) | **ALREADY IMPLEMENTED** — `nextQuantity(1, -1)` = 0 (the DELETE signal, unit-pinned) and `changeQuantityBy` deletes at `next <= 0`; only the UI's `disabled` blocks the path | Fix #2 is UI-only |

**The probe-honesty notes (three):** (1) the first drawer probe's `[role=dialog], [data-state=open]` evaluate matched the Radix OVERLAY (the first element in document order — button-less), not the drawer CONTENT; the VLM descriptions of the captures proved the drawer was open and the minus-at-1 click had REMOVED the item, and the r49b content-scoped selector (the element carrying the "Cart (N)" heading) settled it — the same label-vs-box lesson as round-48: scope the dump to the element that carries the content, not the first portal match. (2) The B4 PDP-plus-15 measurement lost its stepper (the fallback product slug 404'd to a non-PDP page) — the ceiling question is carried by A3 (the PDP plus never disabled through qty 9) + B3 (the drawer plus never disabled through qty 7, no error copy); the reference demonstrably has no cap in any reachable range. (3) The minus-at-1 removal measurement was run TWICE (the accidental first pass + the definitive fresh-item re-run) — both landed "Cart (0)" + the empty state; the finding is doubly measured.

### 2.3 The deliverable's shape

1. **Fix #1 (the parity divergence — the PDP minus floor):** `buy-panel.tsx` — the minus button's `disabled={quantity <= 1}` REMOVED and the ` disabled:opacity-40` token dropped from its className. The island's `setQuantity((q) => Math.max(1, q - 1))` clamp already implements the reference's no-op (the click at qty 1 keeps 1 — pure client state, no cart write). The PLUS keeps its disabled token + ceiling (the registered stock/99 superset — unchanged). The PDP minus className becomes byte-identical to the reference's.
2. **Fix #2 (the parity divergence — the drawer decrement-to-remove):** `cart-drawer.tsx` — the minus button's `disabled={item.quantity <= 1}` REMOVED and the ` disabled:opacity-40` token dropped. The -1 delta at qty 1 flows to `adjustCartItemAction` → `changeQuantityBy` → `nextQuantity(1, -1)` = 0 → the transactional delete — the server path ALREADY exists (session-4's CART-RACE-1 + session-6's STOCK-1 seams; unit-pinned). The minus-at-1 click removes the line — the reference's measured behavior. The trash button stays (the explicit-remove affordance, the aria-label superset).
3. **Fix #3 (the consistency gap — the full-page cart):** `cart-client.tsx` — the same treatment (the `disabled` attr + the token dropped). The reference's /cart is the hardcoded empty state, so the clone's real cart page is pure superset — but it must speak the SAME design language as the drawer (a minus that decrements-to-remove on one surface and disables on the other is an inconsistent mental model). The /cart plus stays never-disabled (the server clamps, as today).
4. **`tests/e2e/qty-stepper.spec.ts`** — the NEW spec (11 pins, named `qty-` so it sorts AFTER `paystep-states`/`performance` and BEFORE `search` in ASCII — p < q < s; no rate-limit-budget interactions; the spec uses the auth.setup storageState):
   - **P1 (parity — THE HONEST RED for Fix #1):** the PDP at resting qty 1 — the minus is ENABLED (`toBeEnabled`), computed opacity "1", cursor "pointer" (the reference's resting anatomy).
   - **P2 (parity):** the PDP minus click at qty 1 → the qty display STAYS "1" (the no-op — pure client state, no cart write).
   - **P3 (parity):** the PDP stepper anatomy — the minus className carries NO `disabled:opacity-40` token and reads exactly `p-3 hover:bg-secondary transition-colors rounded-l-xl`; the container `flex items-center border border-border rounded-xl` at radius 12px; the qty span `px-5 font-medium min-w-[3rem] text-center`.
   - **P4 (parity — THE HONEST RED for Fix #2):** the drawer at qty 1 — the minus is ENABLED, computed opacity "1", cursor "pointer".
   - **P5 (parity — THE HONEST RED for Fix #2's behavior):** the drawer minus click at qty 1 → the item is REMOVED — the heading reads "Cart (0)", the empty state renders ("Your cart is empty" + the "Start Shopping" CTA), zero item images.
   - **P6 (parity):** the drawer minus at qty 2 → decrements to 1 (the normal-path regression guard — the minus still steps normally above the floor).
   - **P7 (parity):** the drawer stepper anatomy at qty 1 — the minus className without the disabled token (`p-1.5 hover:bg-secondary transition-colors rounded-l-lg`); the container radius 12px; the qty span `px-3 text-sm font-medium min-w-[2rem] text-center`.
   - **P8 (superset):** the PDP plus's stock ceiling via the admin seam (`setStock("Wireless Charging Pad", 2)` — the stock.spec pattern): the plus ENABLED at qty 1 → click → qty 2 → the plus now DISABLED (the opacity-40 ceiling — the registered stock enforcement); restore 25 in the finally.
   - **P9 (superset — THE HONEST RED for Fix #3):** the /cart minus at qty 1 — ENABLED + the click REMOVES the item (the empty state renders: "Your cart is empty" + "Continue Shopping" — the /cart empty-state copy).
   - **P10 (superset):** the /cart minus at qty 2 → decrements to 1 (the normal path).
   - **P11 (superset):** the PDP boundary walk — plus ×2 (qty 3) → minus ×2 (back to 1) → minus again (the no-op, qty stays 1) → the full floor/ceiling round trip on one surface.
5. **NO other production code changes.** The three fixes are the round's only production diffs (two attributes + two class tokens across three files; zero server changes — the decrement-to-remove seam already exists and is unit-pinned).

## 3. The TDD plan (the gate-round convention: calibration → RED-first for the fixes → pins → mutations)

### 3.1 Calibration (done — the reference measured live across three probes + the VLM cross-check)

§2.2's table. The two divergences (#1 the PDP minus floor, #6 the drawer minus floor) and the consistency gap (#12) each carry a first-hand measurement: the resting anatomy dumps (classes, opacity, cursor, disabled attrs) on BOTH sides, the no-op click test, and the doubly-measured removal.

### 3.2 The honest RED (the three fixes, TDD-first)

Write P1 + P4 + P5 + P9 FIRST → run against the CURRENT artifact → ALL FOUR FAIL (P1/P4: the minus disabled at opacity 0.4; P5: the click is blocked — the disabled button is inert; P9: the /cart minus disabled) → apply Fix #1 + Fix #2 + Fix #3 → re-run → GREEN. The round's red→green proof — the failing pins written before the fixes, exactly as the CLAUDE.md TDD rule demands for behavior changes.

### 3.3 The pins, written to the measured truth

The 11-pin spec (§2.3). P2/P3/P6/P7/P8/P10/P11 document existing/superset behavior (the gate-round form). The spec follows the family's conventions: the cart beforeEach (clearCartViaDrawer → PDP add → drawer), the drawer's own totals/heading assertions (never the header badge while the dialog is open — the aria-hidden trap), the `getByLabel(/Decrease quantity/)` locator form, and the computed-style assertions via `evaluate` (the clone-app-pat-pro methodology).

### 3.4 The mutation-style efficacy proofs ×5 (each caught at the E2E layer on the REBUILT artifact — the session-36 lesson, then byte-exact revert, md5-verified at every step)

- **M1 (Fix #1 reverted):** the PDP minus's `disabled={quantity <= 1}` + the class token restored → **P1 + P3 fire** (the disabled state + the token back — the two-pin form, both about the PDP resting anatomy; documented like round-48's M1).
- **M2 (Fix #2 reverted):** the drawer minus's `disabled` + token restored → **P4 + P7 fire** (the same two-pin form for the drawer).
- **M3 (Fix #3 reverted):** the /cart minus's `disabled` + token restored → **exactly P9** (the /cart surface's own pin).
- **M4 (the delete signal suppressed):** `cart-quantity.ts`'s `if (next <= 0) return 0` → the floor clamped to 1 instead → **exactly P5** (the drawer minus-at-1 leaves the line at qty 1 — no removal); the unit layer's three floor tests ALSO fire (an honest two-layer catch — documented).
- **M5 (the PDP no-op clamp removed):** `Math.max(1, q - 1)` → `q - 1` → **P2 + P11 fire** (the qty display reads "0" at the floor; the boundary walk ends at 0 — the two-pin catch, documented).

### 3.5 The full gate (the regression proof)

lint (0/0) · typecheck · the FULL unit layer (353 — unchanged) · build · **the FULL E2E × 2 consecutive runs on the final code (321 + 11 = 332 chromium tests per run, as four half-suite invocations under the 600s cap)**.

## 4. Execution order

1. **Calibration:** the three probes + the VLM cross-check (done, §3.1).
2. **RED:** write P1 + P4 + P5 + P9 → run against the current artifact → the honest RED (all four divergences confirmed at the E2E layer).
3. **FIX:** Fix #1 (the PDP minus) + Fix #2 (the drawer minus) + Fix #3 (the /cart minus) → P1 + P4 + P5 + P9 GREEN (the red→green cycle).
4. **PINS:** write the full 11-pin spec; run it; the unit layer re-run (353 — unchanged).
5. **Mutations ×5** (§3.4 — each caught + byte-exact revert, the artifact rebuilt for every E2E proof).
6. **Full gate:** lint · typecheck · unit · build · the FULL E2E × 2 consecutive runs.

## 5. Post-change battery + screenshots

- The paired pixel sweep re-run (all 8 routes — the three fixes live on INTERACTION-GATED surfaces: the PDP resting stepper's minus goes from opacity 0.4 to 1.0, a sub-control visual delta the pdp route's 0.34% baseline band absorbs; the drawer and /cart render nothing extra at rest) + **the 58th mobile-nav verification** re-run (token-exact parity must hold).
- **Screenshots 256-260** (probe-first, single invocation, the production standalone on :3001 — a FRESH process, zero DB mutations): the PDP resting stepper at qty 1 with the minus ENABLED (Fix #1's proof state — full-opacity minus); the drawer at qty 1 with the minus ENABLED (Fix #2's proof state); the drawer AFTER the minus-at-1 click — the empty state ("Cart (0)" + "Your cart is empty" + Start Shopping — the removal proof); the /cart at qty 1 with the minus ENABLED + the post-click empty state (Fix #3's proof); the PDP plus at the stock ceiling — qty 2 of 2, the plus DISABLED at opacity 0.4 (P8's superset proof). **VLM 5/5 verification** (describe the surface as it IS — the DOM probe is the ground truth).
- A stepper pixel comparison against the reference's captures (the /tmp/probe-r49 reference screenshots — the PDP resting + the drawer qty-1 states) as the round's visual-parity eyeball for the interaction surface the sweep cannot reach.

## 6. Docs duty (this round's deliverable + the round's own records)

The PAD **v1.49** (§8.1's qty-stepper row + the Total row 49/687/353+332; §8.4's checklist 332; §3.2's tree 26 specs + the qty-stepper entry; the v1.49 revision row; the header's Last-Updated session tag) · SKILL **v1.49.0** (the version; §11's counts reconciled to 353/332; the line-31 session pointer; Appendix C → session49 + **lesson 053** — the overlay-vs-content dialog scoping rule) · AGENTS.md (the qty-stepper bullet + the overlay-selector lesson) · CLAUDE.md (the E2E spec list + the stepper parity contract update) · README (the 687 row + the Testing table + the mobile-nav 57/58 row) · the drift-watch verifier's spec-count recalibration 25→26 and re-run GREEN · `docs/session_97.md` (the round narrative) · the worklog S49 entry · this plan's sign-offs · `.env.example` verified current (NO env plumbing).

## Sign-offs (completed at execution)

- [x] Calibration recorded (FOUR probes — r49 + r49b (content-scoped) + r49d (the cursor census) + stepper-clone-r49c (the clone side) — the doubly-measured minus-at-1 removal, the no-op floor, the no-cap plus, the anatomy byte-identity, and the platform cursor census 17/17 + 33/33 + synthetic)
- [x] The honest RED (P1 + P4 + P5 + P9 written first, ALL FOUR failing on the current artifact — the disabled states + the blocked removal) → the FOUR fixes (the plan's three + the platform-cursor rule the calibration surfaced mid-round) → GREEN
- [x] Pins green (the 12-pin spec on the fixed artifact, 13/13 incl. the setup login; the unit layer 353 unchanged)
- [x] Mutations ×6 caught + byte-exact reverts (md5 c66215553107c82981f241657ffa5500 / df4d97b7c5a5b232003c891fe3ad1e41 / 9d8a56f78b967ddef31d5c45fa6070bb / 4c615b750f0f36cf87825329535e244d / ef8540ee92bab5e533d2cb7ce454e828 verified at every step; each on the REBUILT artifact): M1 the PDP disabled restored → P1+P2+P3+P11 (the disabled attr also blocks the click-based pins — an honest four-pin catch); M2 the drawer disabled restored → P4+P5+P7; M3 the /cart disabled restored → exactly P9; M4 the delete signal suppressed → P5+P9 + the unit layer (an honest two-layer catch); M5 the no-op clamp removed → exactly P2+P11; M6 the cursor rule removed → P1+P4+P12
- [x] Full gate × 2 consecutive runs on the final code (353 + 333 × 2 = 686 per run; each run as four half-suite invocations under the 600s cap — a–c 149, c–m 41, n–s 65, s–z 82; lint 0/0 · tsc clean · build 0)
- [x] Post-change battery (the sweep's first invocation caught the r49c probe's dev-DB cart residue — /cart 12.36% + /checkout 47.11% out-of-band, the honest false alarm; dev-cleanup restored; the re-run ALL 8 ROUTES AT BASELINE byte-identical · the 58th mobile-nav token-exact · screenshots 256-260 VLM 5/5 — 258/259/260 directly, 256/257 via the byte-identical pixel-zone reconciliation after the VLM's "disabled" misread)
- [x] Docs aligned (PAD v1.49 — §8.1 + Total 49/686 + §8.4 333 + §3.2 26 specs + §12 globals.css ~189; SKILL v1.49.0 + lesson 053 (L47 the portal overlay-vs-content scoping, L48 the VLM world-knowledge misread + the cross-site pixel-zone settlement, L49 the dev-DB-hygiene rule); AGENTS, CLAUDE, README, the verifier's spec-count recalibration 25→26 + the line-count fix — the drift watch re-run ALL FAMILIES GREEN; session_97.md, the worklog S49 entry, this plan's sign-offs); committed to main; pushed via the SSH wrapper
