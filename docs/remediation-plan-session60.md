# Remediation Plan — Session 60 (Round 60): PDPTABS-STATES-1 — The Tabs Interaction Family (PDP + Account): The Sweep's Eighteenth Installment

**Date:** 2026-10-15 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `641aa81` (the r59 ship `0243096` + the user's session_118 narrative log — docs only)
**Status at audit start:** 823-test gate per run (356 unit + 467 E2E + 4 setup logins), PAD v1.59, SKILL v1.59.0 — lint 0/0 · tsc clean · 356/356 unit+integration (23 files) · build exit 0 · the full E2E baseline re-run **all green (471 across four FILE-list invocations: a–c 193 / c–m 64 / n–q 74 / s–z 140), ZERO flakes** · the pre-change battery **ALL CLEAN** (sweep 8/8 at baseline band byte-identical to the r59 ship state; the **79th mobile-nav verification TOKEN-EXACT**; watches + census clean).

## 0. The round's mandate

The user's standing round instruction (the full audit/parity workflow with the mobile-nav + Tailwind v4 watches; the `.env`/db-root contract — verified: `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root with the hard-link convergence at inode 434979; the skills/ exclusion — verified in all 4 configs; the Stripe/env/story restated below).

## 1. Baseline verification (state at audit start)

- **Workspace (a FRESH-CLONE round):** the sandbox was reset — `git clone https://github.com/nordeim/ecommerce-store.git` at `641aa81`; the environment rebuilt end-to-end (bun install 476 packages; `.env` from `.env.example` with `DATABASE_URL="file:../db/custom.db"`; `bun run db:setup` — 6 categories/12 products/4 users/4 orders/3 hero slides; the parent-injection shadow trap hit and converged via the hard-link DB (inode 434979 both paths); Playwright Chromium 1243 installed).
- **Baseline gate:** lint 0/0 · tsc clean · **356/356 unit+integration (23 files)** · build exit 0 · **the full E2E baseline all green** — 471 (467 chromium + 4 setup logins) across four FILE-list invocations, **ZERO flakes**.
- **The Round-60 pre-change live battery (the production standalone on :3000):** the paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec` painted both sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0% [9 px], checkout 0.01%, account 0% [9 px], login 0.28%); the **79th mobile-nav verification TOKEN-EXACT** (all 11 token checks PASS); the standing watches clean (typeahead ref 0 search requests; carousel flip intervals [4000, 9000, 14000]; sitemap 200/17 locs; robots 200; JSON-LD Organization/WebSite/Product); the console census clean (24 routes + 11 admin).
- **Skills consulted (from the repo `skills/skills-catalog.md`):** **tdd** (the RED→GREEN→mutate discipline — the r58 remediation form: FOUR honest REDs), **agent-browser** (the probe conventions — L81 full class strings, L82 enumerate children, L83 coordinate-based interactions, L84 viewport-clamp/scroll discipline), **tailwind-patterns** (the v4 engine registers), **clone-app-pat-pro** (the parity-workflow framing). The scandihaven patterns: reviewed in r58 (the standing instruction); the checkout/webhook patterns confirmed aligned — no changes required this round.

## 2. Audit results

### 2.1 The candidate triage (session-117/118's "suggested next" list)

1. **The PDP tabs' interaction states (CHOSEN — the round's deliverable):** the sweep's eighteenth installment. The resting sweep captures the PDP at the default Description tab only; the tabs' INTERACTION states (the tablist/trigger computed anatomy, the selected/inactive/hover states, the click panel swap, the focus/keyboard paths, the roving tabindex) were never measured. The account family's tabs share the same `ui/tabs.tsx` component — one component, two surfaces.
2. **The search popover's row hover/focus states (RE-DEFERRED — the third consecutive round):** the superset's own deep states — a clone-internal consistency surface with no reference counterpart; deferred behind the parity-family closure (the r59 triage's rationale, unchanged).
3. **The credential-gated items (UNCHANGED):** Stripe test-mode keys and an email provider — no credentials provided this round.

### 2.2 THE MEASURED GROUND TRUTH (SEVEN probes: `pdptabs-probe-r60a.mjs` + `r60a2.mjs` (the reference PDP — a2 re-ran with the L84 scroll discipline after the first click sequence hit the viewport-clamp trap at the tablist's y=754) + `pdptabs-clone-r60b.mjs` (the clone PDP) + `pdptabs-probe-r60c.mjs` (the reference ACCOUNT) + `pdptabs-clone-r60d.mjs` (the clone ACCOUNT) + `pdptabs-mechanism-r60e.mjs` (the instrumented both-sides focus hunt) + `pdptabs-probe-r60f.mjs` (the reference's keyboard path) + `pdptabs-experiment-r60.mjs` (the DOM-mechanics validation of the fix))

| # | Axis | Reference (measured live) | Clone (measured live) | Verdict |
|---|---|---|---|---|
| 1 | the tablist geometry | 976×36 at (24, 754), bg secondary/50, radius 12px, padding 4px, inline-flex justify-start | IDENTICAL (bg `lab(...)` — the engine register) | PARITY |
| 2 | **the PDP list's class** | `inline-flex h-9 items-center text-muted-foreground w-full justify-start bg-secondary/50 rounded-xl p-1` — **NO `overflow-x-auto`** (computed overflowX: **visible**) | carries **`overflow-x-auto`** (computed auto; content fits — zero visual delta today) | **FINDING 2 (class divergence)** |
| 3 | **the ACCOUNT list's class** | carries **`overflow-x-auto`** (computed auto) — the account variant | identical | PARITY (the account variant) |
| 4 | **the PDP trigger's class** | `…data-[state=active]:shadow rounded-lg` — **NO `gap-2`** (computed gap: normal) | carries **`gap-2`** (computed 8px — INERT: the PDP triggers are text-only, one flex child) | **FINDING 3 (class divergence, inert)** |
| 5 | **the ACCOUNT trigger's class** | carries **`gap-2`** + lucide icons (icon→text gap 8px MEASURED) | identical (icons + gap 8px) | PARITY (the account variant) |
| 6 | the trigger anatomy | 3 triggers: Description 101×28 / Reviews (234) 118×28 / Shipping 82×28; 14px/500; padding 4px 12px; radius 12px; transition `0.15s cubic-bezier(0.4,0,0.2,1)` | IDENTICAL every value | PARITY |
| 7 | the selected trigger at rest | bg background rgb(251,250,249), color foreground, the v3 `shadow` (2 shadow layers @0.1) | bg/color identical; the v4 6-layer shadow (4 reset layers + the 2 shadow layers) | PARITY (the layer-count register) |
| 8 | the inactive triggers at rest | transparent, muted rgb(111,111,123), shadow none | identical | PARITY |
| 9 | the hover on an unselected trigger | NO computed change (no hover variant in the class) | identical | PARITY |
| 10 | **THE CLICK** (Reviews) | activates: selText Reviews, panel `Customer reviews coming soon.`, panelStates [inactive, active, inactive], **0 network** | IDENTICAL (same text, same states, 0 network) | PARITY |
| 11 | **the roving tabindex** | all −1 at rest; after the click [−1, 0, −1] | IDENTICAL | PARITY |
| 12 | the panel | gap 24px (mt-6), the class `…focus-visible:ring-2… mt-6`, the Description content | IDENTICAL | PARITY |
| 13 | **THE CLICKED TRIGGER'S RING** | **`:focus-visible` FALSE — the native mousedown focus (NO focusin script events — the instrumented probe); the settled boxShadow carries NO ring layers (the 2 shadow layers only)** | **`:focus-visible` TRUE — Radix 1.1.12's `onMouseDown` script-focuses the trigger (`event.currentTarget.focus()` — the source line confirmed in node_modules); the settled boxShadow carries the ring layers (2px background + 4px orange)** | **FINDING 1 (THE HEADLINE — the visible orange halo paints on the CLICKED trigger)** |
| 14 | the script-focus activation | `focus()` on an inactive trigger ACTIVATES it (the onFocus auto-activation) | identical (Shipping activates + panel swaps) | PARITY |
| 15 | **the keyboard path** (:focus-visible) | Tab #20 lands on the roving-current trigger; the settled ring = 2px offset + 4px orange + the shadow pair; the outline settles TRANSPARENT (v3 outline-none — the session-55 invisible-outline register; the mid-transition orange echo documented) | identical (the ring at full settle; outline style none — v4, the same invisible register) | PARITY (the two-sided truth) |
| 16 | the arrow navigation | ArrowRight from the focused trigger → the next trigger (auto-activated, tabIndex follows) | identical (wrap-around verified) | PARITY |
| 17 | @375 | list 343×36 (no scroll: scrollWidth === clientWidth), triggers 101/118/82 at x 20/121/239, h 28 | IDENTICAL trigger geometry (computed overflow-x differs — Finding 2's register) | PARITY |

### 2.3 THE ROOT CAUSE (Finding 1 — the mechanism hunt)

`@radix-ui/react-tabs` ≥ 1.1 (the clone: ^1.1.12) added to the Trigger's mousedown handler:
`event.currentTarget.focus(); context.onValueChange(value);` — the script focus. Chrome matches a script `focus()` issued during a mousedown dispatch against **`:focus-visible`** → the trigger's `focus-visible:ring-2 ring-ring ring-offset-2` utilities paint the ring on the CLICKED trigger. The reference (older Radix — the instrumented probe E: zero SCRIPT-FOCUS events) lets the BROWSER focus the trigger natively on mousedown — the native pointer focus does NOT match `:focus-visible` → no ring; the activation lands via Radix's `onFocus` auto-activation (`activationMode !== Manual` → `onValueChange`), i.e., at the same mousedown instant. **The fix reproduces the reference's exact flow.**

### 2.4 The registers (documented divergences, no code change)

1. **The engine-spelling family (standing):** v4's `lab()` vs v3's `rgba()` alpha serialization; v4's 4 transparent shadow reset layers vs v3's 2; v4's `outline-style: none` vs v3's `outline: 2px solid transparent` (the session-55 invisible-outline register — re-verified: the reference's keyboard-focused trigger settles at `rgba(0,0,0,0)`); the Radix id prefixes (`radix-:r3:-` vs `radix-_R_…_-`).
2. **The class token order:** the clone's base list string orders `bg-secondary/50 rounded-xl p-1` before `w-full justify-start` (the reference's PDP string orders them after) — the same SET, inert; the ACCOUNT variant's order matches byte-exact both sides.
3. **The PDP trigger's `type` sibling register:** n/a (the trigger is a native `<button>`; no submit/button divergence here — the r59 quick-add register was the related-products Add button).
4. **The account's resting pixel parity:** the account variant's classes (gap-2 + overflow-x-auto + icons) are present on BOTH sides — the fix must not drift them (the P12 regression pin).

## 3. The remediation (TDD — the honest-RED form)

### 3.1 The pin spec — `tests/e2e/pdptabs-states.spec.ts` (14 pins)

FILE-ORDER CONTRACT: `pdptabs-states` sorts AFTER `paystep-states` and BEFORE `performance` — the n–q group grows to 7 files. Context: the DEFAULT storageState (authed — the account pins need it; the PDP tab interactions are auth-agnostic client state).

- **P1** — the tablist's computed anatomy: h 36, radius 12px, padding 4px, bg secondary/50 (lab/rgba register), **computed `overflowX === "visible"`** (FINDING 2's pin)
- **P2** — the variant's class strings: the PDP list carries NO `overflow-x-auto` and the PDP triggers carry NO `gap-2` (the base-variant pin); the full base string asserted modulo the token-order register
- **P3** — the resting selection: Description `aria-selected=true` `data-state=active`, bg rgb(251,250,249), color rgb(23,23,28), the boxShadow carrying the 2 shadow layers (0.1 blacks) and NO ring layers at rest; Reviews/Shipping inactive (transparent/muted/none)
- **P4** — the panel: the active panel is the Description content; the tablist→panel gap 24px; the panel class carries `mt-6`
- **P5** — the hover on the Reviews trigger: NO computed change (bg transparent, color muted, boxShadow none, state inactive)
- **P6** — the click: the Reviews trigger activates (aria-selected/data-state flip, the panel swaps to "Customer reviews coming soon.", panelStates [inactive, active, inactive]), **ZERO xhr/fetch during the switch**
- **P7 — THE HEADLINE:** the clicked trigger does NOT match `:focus-visible` and its settled (900ms) boxShadow carries NO ring layers — only the shadow pair (the 2px/4px spread layers absent). **RED against the current artifact.**
- **P8** — the roving tabindex: all −1 at rest; after the click [−1, 0, −1]
- **P9** — the script-focus auto-activation: `focus()` on the Shipping trigger → it activates (aria-selected true, the panel swaps to the Shipping content)
- **P10** — the keyboard path (the two-sided truth): blur + Tab-walk (≤40) to the roving-current trigger → it MATCHES `:focus-visible` and its settled boxShadow carries the ring layers (2px background + 4px orange)
- **P11** — the arrow navigation: ArrowRight from the focused trigger → the next trigger focused + auto-activated (aria-selected) + the tabIndex follows
- **P12** — the ACCOUNT variant regression pin: /account's list computed `overflowX === "auto"` + the triggers computed `gap === "8px"` + the icon→text gap 8px (the variant split must not drift the account)
- **P13** — the ACCOUNT's clicked trigger: the same no-ring pin as P7 (the shared-component fix covers both surfaces) + the activation lands (the Orders panel swaps)
- **P14** — the @375 mobile pass: the list 343 wide, scrollWidth === clientWidth (no scroll), the trigger widths 101/118/82, h 28

### 3.2 The fixes (all in `src/components/ui/tabs.tsx` + `src/components/account/account-tabs.tsx`)

**FIX-1 (the headline) — the capture-phase mousedown guard in `ui/tabs.tsx`'s TabsTrigger:**
```tsx
onMouseDownCapture={(event) => {
  if (event.button === 0 && !event.ctrlKey && !event.defaultPrevented) {
    event.stopPropagation();
  }
}}
```
The mechanism (validated by `scripts/pdptabs-experiment-r60.mjs` — the DOM-mechanics experiment): React's root-container capture listener dispatches the synthetic capture walk BEFORE the native event descends to the target; `stopPropagation()` there stops the native descent → the bubble-phase delegated handlers (Radix's mousedown script-focus + the roving group's/item's mousedown handlers) never run → the BROWSER's default action still focuses the trigger natively (the experiment: activeIsBtn TRUE, matchesFV FALSE) → the focusin chain fires Radix's item `onFocus` (the roving current-stop update — P8's tabIndex) and the Trigger's `onFocus` auto-activation (P6's swap, at the same mousedown instant as the reference). The keyboard paths (Tab/Enter/arrows) and the ctrl/right-click paths (Radix's preventDefault branch) are untouched. The guard is commented with the full why (the trap-log discipline).

**FIX-2 + FIX-3 (the variant split) — the base becomes the reference's PDP variant; the account appends its variant extras:**
- `ui/tabs.tsx` TabsList base: `inline-flex h-9 items-center text-muted-foreground w-full justify-start bg-secondary/50 rounded-xl p-1` (no `overflow-x-auto`)
- `ui/tabs.tsx` TabsTrigger base: `…data-[state=active]:shadow rounded-lg` (no `gap-2`)
- `account-tabs.tsx`: `<TabsList className="overflow-x-auto">` + `<TabsTrigger className="gap-2">` ×4 (the cn/tailwind-merge append — the account's merged strings byte-match the reference's account variant)

**Zero expected resting-pixel drift:** the PDP's computed deltas (overflowX visible, gap normal) paint nothing (content fits; single-child flex); the account's computed set is UNCHANGED (gap-2 + overflow-x-auto re-appended). The post-change sweep MUST stay at baseline (the battery's job to prove).

### 3.3 The mutation battery (×8, the teeth proof — each mutation applied to the source, rebuilt, caught, byte-exact restore)

- **M1** drop the capture-phase guard → P7 + P13 (the ring returns on both surfaces)
- **M2** restore `overflow-x-auto` to the base list → P1 + P2 (the list half)
- **M3** restore `gap-2` to the base trigger → P2 (the trigger half)
- **M4** drop the account's `overflow-x-auto` override → P12 (the account variant drifts)
- **M5** drop the account's `gap-2` overrides → P12 (the gap half)
- **M6** drop `data-[state=active]:shadow` from the base trigger → P3 (the selected shadow)
- **M7** drop `data-[state=active]:bg-background` from the base trigger → P3 (the selected bg)
- **M8** drop `mt-6` from the TabsContent base → P4 (the panel gap)

### 3.4 The verification protocol

1. The honest RED: the spec runs against the CURRENT artifact — P1, P2, P7, P13 FAIL exactly as calibrated (the four findings); the other 10 pass (the parity axes).
2. The fixes land (§3.2); the spec re-runs — **14/14 GREEN**.
3. The mutation battery ×8 + the pristine rebuild re-run (14/14).
4. The full gate ×2: `bun run lint && bun run typecheck && bun run test && bun run build && the E2E ×2` — the four FILE-list groups per run (pdptabs-states joins the n–q group at 7 files).
5. The post-change battery: the paired pixel sweep (the resting pixels MUST stay at baseline — the fixes are computed-only), the 80th mobile-nav verification, the watches, the census.
6. The screenshots 311–315 (docs/screenshots/): the resting tablist, the selected trigger's computed set, the CLICKED trigger (no ring — the headline's proof), the keyboard-focused trigger (the ring paints — the two-sided truth), the account variant (the regression pin). Probe-first, read-only, the standalone on :3001.
7. The VLM verification (the standing round discipline) + pixel settlement for any dispute.
8. The docs duty: PAD v1.60 (the revision row + §8.1 totals + §8.4's r60 row + the checklist + §3.2's 37 specs), the drift-watch verifier recalibration 36→37, SKILL v1.60.0 (lesson 064 — the Radix mousedown script-focus family), AGENTS.md (the tabs family bullet), CLAUDE.md/README.md (the test-count rows), the session log + the repo worklog S60 entry.
9. The commit + the push: the SSH wrapper protocol (the key materialized outside the repo, the sanity parse, the dry-run, the real push to main, the remote verify, the key shredded).

## 4. Risks & mitigations

- **The capture-stop's blast radius (FIX-1):** the guard stops the mousedown's React dispatch for ALL tab triggers on both surfaces — the activation moves from Radix's mousedown handler to the onFocus auto-activation path. The existing specs that CLICK tabs (account.spec's Orders/Addresses/Settings clicks + the panel assertions; smoke's Reviews click + the empty-panel pin; catalog-parity's Reviews label) re-validate in the full gate — they are the regression net. The keyboard/ctrl-click paths are untouched by construction (the guard's button/ctrlKey conditions).
- **The variant split's blast radius (FIX-2/3):** two files; the account's resting pixels are the highest-risk surface (the sweep's account 0% band) — the P12 pin + the post-change sweep prove zero drift.
- **The Radix version drift (the root cause) is NOT fixed by downgrading** — the pin/downgrade would churn 823 tests for a library swap; the 6-line capture guard is the surgical form (the buy-panel's `h-10 px-8` precedent: the page-level variant, not the library).
- **The P7 settle timing:** the boxShadow read at 900ms (the 150ms transition × 6 headroom); the ring layers' absence asserted by a spread-radius parse (not a string compare — the layer-count register tolerance).
- **The Tab-walk flakiness (P10):** the walk asserts ≤40 steps with a per-step activeElement check; the roving current is deterministic (the LAST selected trigger); a fresh page load per pin isolate keeps the walk's starting state clean.

## 5. Sign-offs

- [x] The plan validated against the codebase: the ui/tabs.tsx class strings verified (lines 23/41 — the base carries overflow-x-auto + gap-2 today); the account-tabs.tsx trigger children verified (lucide icons + text — the gap-2's visible consumer); the Radix 1.1.12 mousedown source verified (node_modules/@radix-ui/react-tabs/dist/index.mjs:127-133); the onFocus auto-activation verified (index.mjs:143-149); the only two tabs consumers verified (grep: the PDP page + account-tabs).
- [x] The TDD form: the spec written FIRST (§3.1); the honest REDs calibrated (P1/P2/P7/P13); the fixes after the RED (§3.2); the mutation battery after the GREEN (§3.3).
- [x] The standing gates re-verified post-change: the sweep (zero resting drift), the mobile-nav (the 80th), the watches, the census, the full gate ×2.

## 6. The execution record (the plan vs. what happened)

- **The honest RED (TDD):** `tests/e2e/pdptabs-states.spec.ts` ran against the CURRENT artifact — **exactly the 4 calibrated REDs** (P1 `overflowX "auto" ≠ "visible"`; P2 the class strings carry `overflow-x-auto` + `gap-2`; P7 `matches(":focus-visible") true ≠ false` + the ring spreads; P13 the account's same) + **10 GREEN** (the parity axes). Two spec-instrument iterations BEFORE the honest run (the round's honest audit of my own pins): (1) the P6 network count caught the related-products Link prefetches (`?_rsc=` — the registered superset, NOT tab-driven) — the filter + register documented; (2) the P10/P11 walk cap raised 40 → 60 (the diagnostic census measured 41 steps at 1280×720); (3) **THE L89 DISCOVERY** — the spread-parse regex `s.match(/(\d+…)px/)` captured the FIRST `0px` of every layer string, mapping every spread to 0 and making the ring asserts TAUTOLOGIES (they passed against the UNFIXED clone — only the `matches(":focus-visible")` assert was live); anchored the capture at the string's END (`px$`) and re-verified P7's failure now carries BOTH the match AND the spread teeth.
- **The fixes (§3.2 as planned):** the capture-phase mousedown guard in ui/tabs.tsx (the commented why in the source) + the variant split (the base = the PDP form; account-tabs appends `overflow-x-auto`/`gap-2`). Lint 0/0, tsc clean, build exit 0.
- **The GREEN:** the spec re-ran — **15/15 (14 pins + the setup login) in 33.6s**.
- **The immediate regression net:** account.spec + smoke.spec + catalog-parity.spec + storefront-parity.spec + acct-validation.spec — **102 passed** (the tab-clicking specs and the resting parity hold under the guard).
- **The mutation battery ×8 (§3.3):** ALL CAUGHT with byte-exact restores (md5-verified per mutation): M1 the guard dropped → **exactly P7+P13** · M2 the base list's overflow-x-auto restored → **exactly P1+P2** · M3 the base trigger's gap-2 restored → **exactly P2** · M4 the account's overflow-x-auto override dropped → **exactly P12** · M5 the account's gap-2 overrides dropped → **exactly P12** · M6 the selected shadow dropped → P2+P3+P7+P13 (the shadow-pair asserts give P7/P13 bonus teeth) · M7 the selected bg dropped → **P2+P3** · M8 the panel's mt-6 dropped → **exactly P4**.
- **The full gate ×2:** lint 0/0 · tsc clean · 356/356 unit (23 files) · build exit 0 · **481 E2E per invocation-set (481 chromium + 4 setups; a–c 193 [6.0m] / c–m 64 [3.1m] / n–q 88 [4.1m] — pdptabs-states joined at 7 files / s–z 140 [4.6m]) — ×2 consecutive, ZERO flakes**; the counted total **837 = 356 unit + 481 E2E**.
- **The post-change battery:** sweep **8/8 AT BASELINE byte-identical** (home 0% [6 px], shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0% [9 px], checkout 0.01%, account 0% [9 px], login 0.28%) — the fixes are computed-only, exactly as calibrated; the **80th mobile-nav TOKEN-EXACT**; watches + census clean.
- **The screenshots 311–315** (probe-first, read-only, the production standalone on :3001): 311 the resting tablist (the PDP variant — `overflowX visible` verified at capture) · 312 the Reviews panel swap (the clicked trigger `m:false`, spreads `[0,0,0,0]` — the headline's proof at capture) · 313 the clicked-trigger crop (no ring) · 314 the keyboard-focused trigger (`m:true`, spreads `[0,0,2,4]` — the ring paints, the two-sided truth) · 315 the account variant (overflowX auto, gap 8px, iconTextGap 8 — the regression pin's proof at capture).
- **The VLM verification: 5/5 PASS** (after ONE description-side settle — the first run's 315 dispute was MY description's error: it claimed an avatar in the account heading; the account heading is the "My Account" h1, the avatar lives in the Profile panel — the capture's DOM-probed facts were already verified live; the corrected description re-ran 5/5 — the r59 discipline: the VLM is a cross-check, the probes are the ground truth).
- **The docs duty:** PAD v1.60 (the revision row + §8.1 Total 60/837/356+481 + §8.4's r60 row via the family list + the checklist 481/37 + §3.2's 37 specs + pdptabs-states in the tree list), the verifier recalibration 36→37 re-run **ALL FAMILIES GREEN**, SKILL v1.60.0 (lesson 064 — L89 the first-match regex trap, L90 the library-upgrade focus flip, L91 the walk-step read timing), AGENTS.md (the tabs family bullet), CLAUDE.md + README.md (the count rows + the family summary).
- **The workspace:** the FRESH-CLONE round (the sandbox was reset — the environment rebuilt end-to-end; the parent-injection shadow trap converged via the hard-link DB at inode 434979).
