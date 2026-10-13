# Remediation Plan — Session 56 (Round 56): TOAST-ANIM-1 — The Toast's Enter/Exit Animation States: The Sweep's Fourteenth Installment, the Measured From-Pose and Exit-Curve Fixes (the Honest RED ×2)

**Date:** 2026-10-13 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `9393c15` (the session-55 ship `04c03bc` + the user's session_110 narrative log — docs only)
**Status at audit start:** 765-test gate per run (353 unit + 412 E2E), PAD v1.55, SKILL v1.55.0 — lint 0/0 · tsc clean · 353/353 unit+integration (22 files) · build exit 0 · the full E2E baseline re-run **all green (412 chromium + the setup logins per four FILE-list invocations: a–c 230 [8.1m] / c–m 45 [1.9m] / n–s 80 [2.9m] / s–z 61 [2.1m] — the 412-chromium ship total byte-identical to the documented round-55 state)** — ZERO flakes — verified on the FRESH-CLONE workspace (the sandbox was reset; the environment rebuilt: `bun install`, `.env` from `.env.example`, `db:setup`, the hard-link DB convergence re-established at inode 172950 at BOTH paths (`db/custom.db` + the injected parent `/home/z/my-project/db/custom.db`), the Playwright Chromium 1243 install).

## 0. The round's mandate

The user's standing round instruction (the full audit/parity workflow with the mobile-nav + Tailwind v4 watches; the `.env`/db-root contract — verified: `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root, the hard-link convergence re-established post-reset; the professional Stripe integration verification — demo mode rests green without keys, the standing credential gates unchanged (NO Stripe test-mode keys or email credentials provided this round); the vitest + playwright suites — both verified with the `skills/` exclusion re-confirmed in all four configs (tsconfig exclude line 41; vitest include allowlist; playwright testDir; eslint ignores); the TDD remediation plan; the screenshots; the `.env.example` — verified current, this round adds NO env plumbing; the docs; and the main-only push via the SSH wrapper). The round's deliverable is audit-derived: session-109/110's standing "suggested next" — **the sweep's fourteenth installment: the toast's enter/exit animation states**.

## 1. Baseline verification (state at audit start)

- **Workspace FRESH-CLONED (the sandbox was reset):** `git clone https://github.com/nordeim/ecommerce-store.git` at `9393c15` (the r55 ship + the user's session_110 log). The environment rebuilt end-to-end: `bun install` (475 packages), the repo `.env` copied from `.env.example`, `bun run db:setup` (6 categories / 12 products / 4 users / 4 orders / 3 hero slides), the hard-link DB convergence at inode 172950 at BOTH paths (the parent `/home/z/my-project/.env`'s injected absolute `DATABASE_URL` shadows the repo `.env` — the documented AGENTS.md sandbox trap; both paths now open ONE file), `bunx playwright install chromium` (the 1243 build the pinned @playwright/test 1.63.0 expects).
- Baseline gate: lint 0/0 · tsc clean · **353/353 unit+integration (22 files)** · build exit 0 · **the full E2E baseline re-run all green** — 412 chromium tests + the setup logins, four FILE-list invocations (a–c 230 [8.1m] / c–m 45 [1.9m] / n–s 80 [2.9m] / s–z 61 [2.1m]; total 412 chromium — byte-identical to the documented round-55 ship total).
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd** (the honest-RED round convention — calibration → RED pins → fix → GREEN → mutations; this round has TWO production fixes, the r54 two-fix form), **agent-browser** (the live reference walk — the r56a/b probes), **clone-app-pat-pro** (the parity methodology — the DOM probe + the computed style + the rAF frame series are the ground truth), **code-review-and-audit** (the lenses on the toast family + the animation-curve comparison).
- **The Round-56 live battery (the audit's parity layer, against the production standalone on :3000 via `scripts/battery-runner.sh prod`):** the paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec` painted both sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0% [9 px], checkout 0.01%, account 0% [9 px], login 0.28% — byte-identical to the documented round-42..55 baselines). **The 71st mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks). The standing watches clean (typeahead: the reference fires ZERO search requests; carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11 admin CLEAN.

## 2. Audit results

### 2.1 The candidate triage (session-109/110's "suggested next" list)

1. **The toast's enter/exit animation states (CHOSEN — the round's deliverable):** the sweep's method applied — the family's zones enumerated (`src/components/store/toast-viewport.tsx` + the `.toast-item` CSS block in `src/app/globals.css` + the timing block in `store-provider.tsx` (3000ms → exiting → 3400ms unmount)) + cross-checked against the E2E layer: the toast's RESTING anatomy is pinned (cart.spec:40-79, the session-4 dark-box pins — bg/color/radius/icon/position/stacking/lifetime) but the ANIMATION axis had ZERO pins (no from-pose pin, no curve pin, no exit-timing pin, no settle pin, no overshoot pin).
2. **The account order-detail's final deep corners (RE-DEFERRED, the sixth time):** 27 pins + the session-34/45 detail rounds.
3. **The search-drawer's panel geometry (RE-DEFERRED):** session-46's exhaustive 12-pin coverage.
4. **The credential-gated items (UNCHANGED):** Stripe test-mode keys and an email provider — no credentials provided this round.

### 2.2 THE PRIMARY FINDING — the resting anatomy is a FIFTH fully-parity family; the honest REDs live in the ANIMATION layer (the from-pose + the exit curve)

The calibration (FOUR probes — `toast-probe-r56a.mjs` + `toast-probe-r56b.mjs` (reference, login-gated, live ATC with an in-page MutationObserver + rAF frame sampler) + `toast-clone-r56c.mjs` (clone, via the battery runner, the same instrumentation) + `toast-clone-r56d2.mjs` (the CSSOM walk verification) — the DOM dumps + computed styles + the full rAF frame series on BOTH sides as the ground truth):

| # | Behavior | Reference (measured live) | Clone (measured live) | Verdict |
|---|---|---|---|---|
| 1 | the region class | `fixed bottom-6 right-6 z-[100] flex flex-col gap-2` | identical + `pointer-events-none` | PARITY (pin; the pointer-events-none is the STANDING registered deliberate divergence — the reference's toasts are inert on click (verified session-4) and the clone's click-through keeps the fixed overlay from eating drawer-Checkout clicks) |
| 2 | the region computed | fixed, z 100, flex col, gap 8px, bottom 24px, right 24px | IDENTICAL (+ pointer-events none — the register) | PARITY (pin) |
| 3 | the item class | `bg-foreground text-background px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-medium max-w-xs` | identical (+ the `toast-item` animation hook class) | PARITY (pin) |
| 4 | the item resting computed | bg rgb(23,23,28), color rgb(251,250,249), radius 12px, padding 12px 16px, shadow 0.25, font 14px/500, gap 8px, maxWidth 320px, 320×64 | **IDENTICAL** (every value) | PARITY (pin — the session-4 contract extended to the full computed set) |
| 5 | the svg | `lucide lucide-circle-check-big h-4 w-4 text-primary shrink-0`, 16px/16px computed, rgb(230,107,26) | IDENTICAL | PARITY (pin) |
| 6 | **THE ENTER FROM-POSE** | inline at insertion: **`translateY(20px) scale(0.95)`, `opacity: 0`** (first frame t=4: ty 19.88, sx 0.95, o 0.005) | @starting-style: **`translateY(16px) scale(0.96)`**, opacity 0 (first frame t=11: ty 16.00, sx 0.96, o 0.000) | **DIVERGENCE — the honest RED #1: the from-pose is 4px shallower and 0.01 higher-scale than the measured reference pose (the session-4 approximation was calibrated before live spring measurement)** |
| 7 | the enter settle | ty=0 & o=1 first at **t=302ms** (crosses 0 at ~119ms) | ty=0 at **t=301ms** (crosses 0 at ~118ms) | PARITY (pin) |
| 8 | the enter overshoot | **-2.41px at t=169** (12.05% of the 20px travel) | -1.56px at t=168 pre-fix (9.7% of the 16px travel); ~-1.94 expected post-fix (9.7% of 20px) | PARITY WITHIN BAND (pin the band [-3.5, -0.8]; the magnitude gap 0.47px is the bezier-vs-spring register) |
| 9 | the enter duration/curve | spring, settle 302ms; opacity arrives 1 at ~290ms | CSS 300ms cubic-bezier(0.34,1.56,0.64,1); opacity arrives 1 at ~118ms (the bezier's fast early phase) | REGISTER (the JS-spring vs CSS-bezier architecture — the standing session-4 register; the settle PARITY pins at 300ms) |
| 10 | the transition declared | NONE (`transition: 0s all`, `animation: 0s none` — framer-motion inline JS) | `0.3s, 0.3s` on opacity+transform | REGISTER (the architecture — pinned as the clone's own computed contract) |
| 11 | **THE EXIT TRIGGER** | first moving frame **t=3019ms** past insertion | the `toast-exiting` class lands **t=3010ms** | PARITY (pin) |
| 12 | the exit target | inline: `translateY(-10px) scale(0.95)`, opacity → 0 | `.toast-exiting { opacity: 0; transform: translateY(-10px) scale(0.95); }` | PARITY (pin) |
| 13 | **THE EXIT FADE CURVE** | ease-out character: o=0.74 at +50ms, **0.46 at +100ms, 0.31 at +150ms**, 0.17 at +200ms, 0.001 at +266ms (63% progress at 44% time — fast start, gentle tail) | ease-in character: o=0.88 at +50ms, 0.79 at +100ms, **0.55 at +150ms**, 0.33 at +200ms (32% progress at 50% time — slow start, abrupt end) | **DIVERGENCE — the honest RED #2: mid-exit the clone lingers at 55% opacity while the reference is at 31%; the fade DIRECTION is inverted (the reference eases OUT, the clone eases IN)** |
| 14 | the exit transform curve | rises to -9.37 at +100ms, overshoots to **-11.20** at +166ms, settles -10 at +266ms | ease-in: -2.67 at +108ms, -5.93 at +191ms (no overshoot — CSS beziers with y≤1 cannot) | REGISTER (the spring's overshoot + the split spring rates are the architecture; the fix aligns the fade character; the rise's timing rides the same TF change) |
| 15 | the exit duration | ~266ms (o 1→0.001); unmount ~3317ms past insertion | 300ms CSS; unmount 3401ms past insertion | PARITY WITHIN REGISTER (pin the clone's own 300ms + the by-3600ms unmount; the 266-vs-300 tail + the 84ms unmount lag = the register) |
| 16 | the lifetime | insertion → unmount 3317ms | insertion → unmount 3401ms | REGISTER (imperceptible; the 3s dwell is the pinned contract) |
| 17 | the stacking | gap-2 stack, no dedupe (pinned session-4) | pinned | PARITY (existing pin, extended) |

**THE HEADLINE:** the toast's RESTING anatomy is the sweep's **FIFTH fully-parity family** (every computed value identical — the region, the item, the svg, the geometry). The animation axis carries **TWO honest fixes**: (1) **the enter from-pose** — the measured reference pose is `translateY(20px) scale(0.95)`, the clone's session-4 approximation `translateY(16px) scale(0.96)`; (2) **the exit fade curve** — the measured reference fades ease-OUT (63% progress at 44% time), the clone's `cubic-bezier(0.4, 0, 1, 1)` is an ease-IN (32% progress at 50% time) — the fade direction is inverted, and mid-exit the divergence is 24 opacity points (0.55 vs 0.31 at +150ms).

**The fix #2's target curve, fitted to the measured reference (wall-clock, exit start = 0):** `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (the canonical easeOutQuad approximation) on the existing 300ms duration deviates from the measured reference by ≤0.10 at every checkpoint and ≤0.08 after +150ms (o=0.69/+50ms, 0.56/+100ms, **0.25/+150ms**, 0.11/+200ms, 0.03/+250ms vs the reference's 0.74/0.46/**0.31**/0.17/0.07) — a materially better fit than any alternative (easeOutCubic overshoots the early frames; `ease` undershoots the mid-flight).

**The probe-honesty notes (three):** (1) **THE UNBOUNDED-EVALUATE HANG** — r56b's first form hung the tool invocation: a `page.evaluate` that resolves via a rAF loop with no ceiling can outlive the toast's unmount (the region's `querySelector` then matches a DIFFERENT fixed bottom-right element — a chat-widget/back-to-top artifact — and the loop never ends); every in-page sampler now carries a hard-bound killer timeout (10s) + the probe a global watchdog (90s) + a synchronous progress log that survives SIGKILL. (2) **THE CSSStyleRule NESTING TRAP** — r56d's CSSOM walk found NOTHING because modern Chromium gives EVERY CSSStyleRule a `.cssRules` property (CSS Nesting) — the truthy empty CSSRuleList sent every rule down the group-rule branch; match rules by `selectorText`/text, never branch on `.cssRules` truthiness. (3) **THE framer INLINE-STYLE vs COMPUTED split** — framer-motion writes the animated values as INLINE styles; the computed style reads the same values at frame time, but the RESTING element's inline style reads `transform: none` / `opacity: 1` — pin the from-pose via the CSSOM rule (deterministic) and the curve via the computed rAF series (behavioral), never via the resting inline style.

### 2.3 The registers (documented, no code change — rendered-identical or standing)

1. **The JS-spring vs CSS-bezier architecture (standing session-4, extended):** the reference drives the toast with framer-motion inline JS (`transition: 0s all`, `animation: 0s none` computed); the clone uses CSS `@starting-style` + transitions. The curve micro-shapes differ within the band: the enter's early slope (the bezier reaches 47% progress at 12% time; the spring 24%), the opacity arrival (118ms vs ~290ms), the exit transform's -11.2 overshoot (impossible with y≤1 beziers), the exit's split spring rates (transform stiffer than opacity). REGISTER — the settle (301/302ms), the trigger (3010/3019ms), and the fade character (post-fix) are the pinned parity anchors.
2. **The pointer-events-none region (standing session-4):** the reference's region computes pointer-events auto (its toasts are inert on click); the clone's pointer-events-none is the deliberate click-through divergence. REGISTER.
3. **The unmount timing (84ms):** the reference unmounts at ~3317ms; the clone at 3401ms (the 3000ms trigger + the 400ms window). Imperceptible. REGISTER.
4. **The enter overshoot magnitude (0.47px):** the reference -2.41 (12.05%); the post-fix clone ~-1.94 (9.7% — the bezier's max). Sub-perceptual (the r54 VLM 14px-glyph floor, 30× smaller). REGISTER.
5. **The `toast-item` hook class:** the clone's item carries the extra `toast-item` class token (the animation hook); the reference's item carries none. No rendered effect. REGISTER (cosmetic).

### 2.4 The deliverable's shape

1. **THE FIXES (`src/app/globals.css`, the toast block lines 180-204):**
   - **Fix #1 (the from-pose):** the `@starting-style` inner rule `transform: translateY(16px) scale(0.96)` → `transform: translateY(20px) scale(0.95)` (the measured reference insertion pose).
   - **Fix #2 (the exit fade):** `.toast-item.toast-exiting`'s `transition-timing-function: cubic-bezier(0.4, 0, 1, 1)` → `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (the easeOutQuad fit to the measured reference fade).
   - The comment block updated to cite the measured values (the r56a/b calibration replaces the session-4 approximation note).
   - **`src/components/store/toast-viewport.tsx`:** the doc comment's timing note updated (the measured from-pose + the ease-out exit + the settle/trigger anchors).
2. **`tests/e2e/toast-anim-states.spec.ts`** — the NEW spec (14 pins, the family's animation contract — the honest-RED round form: P4 + P10 + P11 fail against the current artifact, the fixes turn them green):
   - **P1 (the region):** the class string + the computed (fixed, z 100, flex col, gap 8px, bottom 24px, right 24px, pointer-events none — the register noted).
   - **P2 (the item at rest):** the class string + the full computed set (bg, color, radius 12px, padding 12px 16px, font 14px/500, gap 8px, maxWidth 320px, the shadow's 0.25 layer, 320×64 geometry).
   - **P3 (the svg):** the class string + the computed 16px + rgb(230,107,26).
   - **P4 (THE FIX #1 — the from-pose, CSSOM):** the `@starting-style` inner rule's text declares `transform: translateY(20px) scale(0.95)` and `opacity: 0`. **The honest RED: the current artifact reads `translateY(16px) scale(0.96)`.**
   - **P5 (the from-pose, behavioral):** the first rAF frame post-insertion reads ty ≥ 14 && o ≤ 0.05 (both sides pass — the dead-animation catch).
   - **P6 (the settle):** by 400ms post-insertion: the computed transform is the identity matrix and opacity 1.
   - **P7 (the overshoot band):** the minimum ty over t=80..300ms lies within [-3.5, -0.8] (the reference -2.41, the post-fix clone ~-1.94; a linear/ease transition reads 0.00 → fires).
   - **P8 (the enter duration):** the resting item's computed `transitionDuration` = `0.3s, 0.3s` + the declared TF `cubic-bezier(0.34, 1.56, 0.64, 1)`.
   - **P9 (the exit trigger):** at 2900ms post-insertion the item still rests (o=1, no `toast-exiting` class); the class observed within 2900..3400ms.
   - **P10 (THE FIX #2 — the exit contract, CSSOM + computed):** the `.toast-item.toast-exiting` rule declares `opacity: 0` + `transform: translateY(-10px) scale(0.95)` + the computed TF on the exiting element contains `cubic-bezier(0.25, 0.46, 0.45, 0.94)`. **The honest RED: the current artifact reads `cubic-bezier(0.4, 0, 1, 1)`.**
   - **P11 (THE FIX #2 — the mid-exit fade character):** at +150ms after the `toast-exiting` class lands: the computed opacity ≤ 0.40 (the ease-out fade; the measured reference 0.31, the post-fix clone ~0.25). **The honest RED: the current artifact reads ~0.55.**
   - **P12 (the exit completion + unmount):** by +320ms: opacity ≤ 0.02; the item gone from the DOM by 3600ms post-insertion.
   - **P13 (the dwell):** at 2800ms post-insertion the toast is still fully visible (o ≥ 0.99, ty=0) — the 3s lifetime contract.
   - **P14 (the stacking + the second from-pose):** a rapid double-add: two children in the region (the gap-8 stack) + the second toast's first rAF frame also reads ty ≥ 14 (the `@starting-style` applies per element insertion).
3. **The registers** recorded in the PAD's divergence register + AGENTS + this plan (§2.3).

## 3. The TDD plan (the honest-RED round convention: calibration → RED pins → fix → GREEN → mutations)

### 3.1 Calibration (done — the reference measured live across four probes)

§2.2's table. Every pin's expected value carries a first-hand measurement on BOTH sides (the rAF frame series at 60fps cadence, the CSSOM rule text, the computed styles at rest).

### 3.2 The pins, written to the measured truth (the honest REDs first)

The 14-pin spec (§2.4). Conventions: the PDP route `/product/wireless-headphones` at 1024×768 (the sweep's viewport); the ATC scoped with `.first()` (the r55 strict-mode lesson); the from-pose pins read the CSSOM via the recursive walk (match by text — the r56d2 nesting-trap lesson) + the rAF first frame via an in-page MutationObserver+sampler installed BEFORE the click (the r56a/b pattern, with the hard-bound killer); the exit pins poll for the `toast-exiting` class from 2.8s and anchor the +150ms sample on the class landing (frame-noise-proof); the cart left as found (the ATC adds one item — the demo cart returns to empty via the drawer's remove OR the next run's e2e-reset; the spec cleans up after itself like the r55 badge convention). **The honest REDs:** P4 (the from-pose rule reads 16px/0.96), P10 (the exit TF reads the ease-in), P11 (the mid-exit o reads ~0.55) FAIL against the current artifact; the other 11 pass. The two fixes turn them green with ZERO collateral.

### 3.3 The unit layer — unchanged (353): no pure seam is touched (the family is CSS + presentation; no schema, no actions, no libs)

### 3.4 The mutation-style efficacy proofs ×8 (each caught at the E2E layer on the REBUILT artifact (the session-36 lesson), then byte-exact revert, md5-verified at every step; the runner runs ONLY the new spec)

- **M1 (the fix #1 reverted):** the from-pose `translateY(20px) scale(0.95)` → `translateY(16px) scale(0.96)` → **P4 fires** (+P5 stays green — the behavioral band covers both poses; the CSSOM pin is the discriminator).
- **M2 (the fix #2 reverted):** the exit TF → `cubic-bezier(0.4, 0, 1, 1)` → **P10 + P11 fire** (the declared TF + the fade character).
- **M3 (the exit target broken):** `translateY(-10px) scale(0.95)` → `translateY(-30px) scale(0.8)` → **P10 fires** (the target pose).
- **M4 (the enter duration broken):** the base `transition` 300ms → 100ms → **P8 fires** (the computed duration).
- **M5 (the from-pose opacity broken):** the `@starting-style` `opacity: 0` → `opacity: 0.6` → **P4 + P5 fire** (the rule text + the first-frame o).
- **M6 (the region stack broken):** the region `gap-2` → `gap-6` → **P1 + P14 fire** (the computed gap + the stack).
- **M7 (the resting radius broken):** the item `rounded-xl` → `rounded-lg` → **P2 fires**.
- **M8 (the trigger broken):** the store-provider's exiting timeout 3000 → 1000ms → **P9 + P13 fire** (the trigger window + the dwell).

### 3.5 The full gate (the regression proof)

lint (0/0) · typecheck · the FULL unit layer (353 — unchanged) · build · **the FULL E2E × 2 consecutive runs on the final code (412 + 14 = 426 chromium tests per run, as four FILE-list invocations under the 600s cap — toast-anim-states joins the a–c group)**.

## 4. Execution order

1. **Calibration:** the four probes (done, §3.1).
2. **RED:** write the 14-pin spec; run it against the CURRENT artifact — P4 + P10 + P11 must FAIL (the honest REDs), the other 11 green.
3. **FIX:** the globals.css from-pose + exit-TF edits + the comment updates (globals.css + toast-viewport.tsx); re-run the spec — 15/15 green (14 pins + the setup login).
4. **Collateral:** the cart.spec toast trio re-verified (the resting pins unaffected — the fix touches only the animation layer).
5. **Mutations ×8** (§3.4 — each caught + byte-exact revert, the artifact rebuilt for every E2E proof).
6. **Full gate:** lint · typecheck · unit · build · the FULL E2E × 2 consecutive runs.

## 5. Post-change battery + screenshots

- The paired pixel sweep re-run (all 8 routes — the fixes are animation-only, zero resting paint; the baseline must hold byte-identically) + **the 72nd mobile-nav verification** re-run (token-exact parity must hold).
- **Screenshots 291-295** (probe-first, single invocation, the production standalone on :3001 — a FRESH process): the toast at rest (the full anatomy — the region + the item + the icon); the toast mid-enter (~60ms — the from-pose in flight, the probe reading ty>0 + o<1); the toast settled (the resting geometry 320×64 at the corner); the toast mid-exit (+150ms — the ease-out fade in flight, the probe reading o≤0.40); the stacked pair (two toasts, the gap-8 stack). **VLM 5/5 verification** (describe the surface as it IS — the DOM probe is the ground truth; mid-animation captures settle by pixels).

## 6. Docs duty (this round's deliverable + the round's own records)

The PAD **v1.56** (§8.1's toast-anim-states row + the Total row 56/779/353+426; §8.4's checklist 426/33 files; §3.2's tree 33 specs + the toast-anim-states entry + 56 plans; the divergence register's five entries (§2.3); the v1.56 revision row) · SKILL **v1.56.0** (the version; §11's counts reconciled to 353/426; the line-31 session pointer; Appendix C → session56 + **lesson 060** — L72 the unbounded-evaluate hang (every in-page sampler carries a hard-bound killer), L73 the CSSStyleRule nesting trap (match by text, never branch on .cssRules), L74 the framer inline-vs-computed split (pin the rule via CSSOM, the curve via the computed series)) · AGENTS.md (the toast-anim bullet + the registers + the probe disciplines) · CLAUDE.md (the E2E row's family + 426) · README (the 779 row + the toast family + the Testing table's 426 + the mobile-nav 71/72 row + the File Hierarchy's 33/426) · the drift-watch verifier's spec-count recalibration 32→33 + re-run GREEN · `docs/session_111.md` (the round narrative) · the worklog S56 entry · this plan's sign-offs · `.env.example` verified current (NO env plumbing).

## Sign-offs (completed at execution)

- [x] Calibration recorded (FOUR probes — the resting anatomy + the enter/exit frame series + the CSSOM walk, both sides)
- [x] The honest REDs verified (P4 + P10 + P11 failed on the pre-fix artifact — P4 read "translateY(16px) scale(0.96)", P10 read "cubic-bezier(0.4, 0, 1, 1)", P11 read ~0.61 at +150ms; the other 11 green, after two authoring rounds: the t0 POLL (the click resolves ~30ms before the React commit — an eager read gets null and performance.now()-null reads the wall-clock origin) + the insertion-wait phase ("no children" is "not yet inserted", never "gone"))
- [x] The fixes applied (the from-pose 20px/0.95 + the exit TF easeOutQuad + the comment updates in globals.css + toast-viewport.tsx); 15/15 green; the cart.spec toast trio re-verified green
- [x] Mutations ×8 caught + byte-exact reverts (md5-verified at every step; each on the REBUILT artifact — M1 the from-pose reverted -> exactly P4; M2 -> P10+P11; M3 -> exactly P10; M4 -> exactly P8; M5 -> exactly P5 (the behavioral pin's independent value); M6 -> exactly P1; M7 -> exactly P2; M8 -> P9+P13; the P5/P14 MO-pose hardening (the deterministic insertion-pose read at the MutationObserver microtask — the run-2 P5 flake eliminated) re-verified M1+M5 on the final spec)
- [x] Full gate × 2 consecutive runs on the final code (353 + 426 × 2 = 779 per run; lint 0/0 · tsc clean · build 0; toast-anim-states joined the c–m group at 59 — the a–c group at 8.1m/480s too thin for +14 tests)
- [x] Post-change battery (the sweep ALL 8 ROUTES AT BASELINE byte-identical — one honest out-of-band false alarm: the r56c probe's dev-DB cart residue (/cart 12.36%, /checkout 47.11%), cleaned by dev-cleanup per the r49 lesson · the 72nd mobile-nav token-exact · watches + census clean · screenshots 291-295 VLM 3/5 direct + 2 side-by-side settlements (292/294: the static-translucency ambiguity — the relative composite instrument passed both; the pixel blends 55.3%/18.9% vs the probed 61.5%/22.8%))
- [x] Docs aligned (PAD v1.56 + the five registers; SKILL v1.56.0 + lesson 060 — L72 the unbounded-evaluate hang, L73 the CSSStyleRule nesting trap, L74 the click-before-commit race, L75 the screenshot-latency freeze, L76 the static-translucency ambiguity; AGENTS, CLAUDE, README, the verifier recalibration 32→33 — the drift watch ALL FAMILIES GREEN; session_111.md, the worklog S56 entry, this plan's sign-offs); committed to main; pushed via the SSH wrapper
