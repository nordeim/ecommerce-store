# Remediation Plan — Session 50 (Round 50): SHOP-FILTERS-1 — The Shop Filter Bar's Interaction States: the Clear-Button Anatomy Fix + the Price-Semantics/Keyboard/Popover Pin Family (the Customer-Surfaces Pin-Density Sweep's Eighth Installment)

**Date:** 2026-10-12 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `2400cc7` (the session-49 ship `a41ed52` + the user's session_98 narrative log)
**Status at audit start:** 686-test gate per run (353 unit + 333 E2E), PAD v1.49, SKILL v1.49.0 — lint 0/0 · tsc clean · 353/353 unit+integration (22 files) · build exit 0 · the full E2E baseline re-run **all 333 chromium tests + the setup logins GREEN (four invocations: a–c 149 [4.0m], c–m 41 [2.2m], n–s 65 [3.2m], s–z 82 [2.3m])** verified pre-change.

## 0. The round's mandate

The user's standing round instruction (the full audit/parity workflow with the mobile-nav + Tailwind v4 watches; the `.env`/db-root contract — verified: `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root, the hard-link convergence intact at inode 397471 at both paths — a PULL round: `git pull` fast-forwarded `a41ed52..2400cc7` (docs/session_98.md only — the user's narrative log, docs only, ZERO production code; the recent-changes audit CLEAN); the professional Stripe integration verification — demo mode rests green without keys, the standing credential gates unchanged (NO Stripe test-mode keys or email credentials provided this round); the vitest + playwright suites — both verified with the `skills/` exclusion re-confirmed; the TDD remediation plan; the screenshots; the `.env.example` — verified current, this round adds NO env plumbing; the docs; and the main-only push via the SSH wrapper). The round's deliverable is audit-derived: session-95/97's standing "suggested next" — **the shop filters' interaction states** (the sweep's eighth installment).

## 1. Baseline verification (state at audit start)

- **Workspace intact (PULL, not reset):** `git pull` fast-forward `a41ed52..2400cc7` (docs/session_98.md — the user's session-98 narrative log, no code); node_modules present; `.env` verified; `db/custom.db` at the repo root with the hard-link convergence intact (inode 397471 at BOTH paths); Playwright Chromium cache present; `bun run build` fresh.
- Baseline gate: lint 0/0 · tsc clean · **353/353 unit+integration (22 files)** · build exit 0 · **the full E2E baseline re-run all green** (the 333 chromium tests + the setup logins, four invocations under the 600s cap) — the documented session-97/98 ship state verified pre-change.
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd** (the gate-round convention: calibration → the honest RED → pins → mutation-style efficacy proofs), **agent-browser** (the live reference walk — the r50/a/b/c probes), **clone-app-pat-pro** (the parity methodology — the DOM probe + the computed style are the ground truth; the VLM descriptions cross-check the structure), **code-review-and-audit** (the lenses on the filter bar's code).
- **The Round-50 live battery (the audit's parity layer, against the production standalone on :3000 via `scripts/battery-runner.sh prod`):** the paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec` painted both sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0% [9 px], checkout 0.01%, account 0% [9 px], login 0.28% — byte-identical to the documented round-42..49 baselines). **The 59th mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks). The standing watches clean (typeahead: the reference fires ZERO search requests; carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11 admin CLEAN.

## 2. Audit results

### 2.1 The candidate triage (session-95/97's "suggested next" list)

1. **The shop filters' interaction states (CHOSEN — the round's deliverable, below):** session-95/97's standing first suggestion — the sweep's eighth installment. The sweep's method applied: the filter bar's four controls enumerated (`src/components/store/shop-filters.tsx` — the search input, the category/price/sort Radix Selects, the Clear button) + the shop page's server-side filter seams (`src/app/(storefront)/shop/page.tsx` — parseSearchParams + the price-bucket where-clauses + the chips) and cross-checked against the E2E layer: the interaction states had near-ZERO pins (catalog-parity pins the sort dropdown's 5 option LABELS only; storefront-parity:376 pins the sort trigger's resting geometry; search.spec pins the header-search path + the chips + the empty state — but the OPEN-state anatomy, the keyboard contract, the price-bucket semantics, the category option set, the trigger-label coherence, the count line, and the Clear button's anatomy/visibility/behavior were never measured against the reference NOR pinned). The recent-changes audit: CLEAN (docs only).
2. **The product-card hover family (RE-DEFERRED):** the card hover states (shadow lift, heart color transition) are pure-CSS `transition-colors`/shadow tokens already swept at rest; thinner than the filter family.
3. **The account order-detail surfaces (RE-DEFERRED):** already carries a dedicated round (session-34's CUSTOMER-ORDER-DETAIL-1).
4. **The credential-gated items (UNCHANGED):** Stripe test-mode keys and an email provider — no credentials provided this round.

### 2.2 THE PRIMARY FINDING — the shop filter bar's interaction states: ONE measured parity divergence + the reference-drift register + the parity confirmations (SHOP-FILTERS-1)

The surfaces: the filter bar's four controls + the shop page's filter seams. **The interaction states are INTERACTION-GATED** — the pixel sweep renders /shop unfiltered (the Clear button never renders at rest; the popovers never open; the buckets never activate) — so the session-2-era custom Clear button survived 49 green rounds unseen. The sweep's own blind spot, mapped and closed (the same structural finding as rounds 47–49: the resting sweep cannot reach interaction-gated states).

**The calibration (FOUR probes — `scripts/shopfilter-probe-r50.mjs` + `r50b.mjs` + `r50c.mjs` (reference, login-gated) + `shopfilter-clone-r50d.mjs` (clone side, via the battery runner), live, the DOM dumps + computed styles as the ground truth):**

| # | Behavior | Reference (measured live) | Clone (pre-fix) | Verdict |
|---|---|---|---|---|
| 1 | **the Clear button's classes** | `inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs gap-1` (the shadcn ghost/sm vintage + gap-1) | `inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 h-9` (a custom string) | **DIVERGENCE → Fix #1** |
| 2 | the Clear geometry | height 32px · font 12px/500 · radius **10px** · color rgb(23,23,28) foreground · X rendered 16px (classes `h-3 w-3`, overridden by `[&_svg]:size-4`) · width 74px | height **36px** · font **14px** · radius **0px** (square!) · color rgb(111,111,123) muted · X 16px (`h-4 w-4`) | Fix #1's companion |
| 3 | the Clear hover | `hover:bg-accent hover:text-accent-foreground` (the cream/brown pair) | `hover:text-foreground` only | Fix #1's companion |
| 4 | the Clear visibility | present when ANY filter dimension is active in its in-memory state (category B/A, price E, sort G, search B); absent unfiltered | `hasFilters` over the same four URL dimensions | PARITY IN OUTCOME (pin) |
| 5 | the Clear behavior | resets EVERYTHING (grid 12, triggers default, input cleared, Clear gone) | `router.push("/shop")` — the same total reset | PARITY (pin) |
| 6 | the category popover | 7 options — All Categories, Electronics, Clothing, Home & Living, Accessories, Sports, Beauty (the DB order) | **IDENTICAL** | PARITY (pin) |
| 7 | the price popover | 5 options — All Prices / Under $50 / $50 - $100 / $100 - $200 / Over $200 | **IDENTICAL** | PARITY (pin) |
| 8 | **the price bucket semantics** | UI-measured: under-50 = [tee, serum, pad] (3) · 50-100 = [planter, blanket, mat] (3) · 100-200 = [watch, speaker, shoes, pajama] (4) · over-200 = [headphones, sunglasses] (2) | deep-linked: **IDENTICAL SETS + ORDER** (all four buckets) | PARITY (pin — the round's semantic core) |
| 9 | the popover geometry | x=833 (start-aligned) · y=282 · w=165 (content-sized, ≥ the 150px trigger) · gapY 4px · radius 10px | **IDENTICAL** (x=833 y=282 w=165 h=170 gapY 4 radius 10px) | PARITY (pin) |
| 10 | the popover item hover | bg rgb(253,243,237) accent · color rgb(138,64,15) accent-foreground · data-highlighted | **IDENTICAL** | PARITY (pin) |
| 11 | the keyboard contract | open → the active item highlighted → ArrowDown moves → Enter commits → Escape closes uncommitted (Radix-native) | the same Radix Select | PARITY (pin) |
| 12 | the trigger labels | the category trigger follows the deep-link param ("Electronics"); the price/sort triggers stay default at deep links (their params are DEAD — #15) | ALL follow the params (the URL-coherence superset) | SUPERSET (register) |
| 13 | the bar search | filters in-memory, NEVER pushes the URL (6 polls / 2.4s); case-insensitive ("SERUM" matches) | pushes `?search=SERUM` + case-insensitive ✓ | SUPERSET on the URL (register); the case-insensitivity is PARITY (pin) |
| 14 | **the active-filter chips** | **GONE** — no chip row on `?category=electronics` or `?search=serum` TODAY (the full anchor dump proves it); session-3 measured them live (remediation-plan-session3 §SEARCH-1: "Reference shows an active-filter chip row… verified live with combined params") | renders them (deep-linkable, pinned by search.spec since session-3) | **REFERENCE DRIFT** (the session-26 hero-drift pattern's second instance) — the clone keeps its chips as the registered superset |
| 15 | the deep-link `?sort=`/`?price=` params | **DEAD** — ?sort=newest/rating/price_asc all render FEATURED order (double-read stable); ?price= renders 12 products every bucket; the UI paths WORK (G: price_asc sorts; Q4: UI newest = reverse array ✓) | both work (deep-linkable) | SUPERSET (register) |
| 16 | the header search | the reference's ONLY URL write: `/shop?search=watch` | identical (pinned by search.spec) | PARITY ✓ (already pinned) |
| 17 | the count line | "12 products found" / "3 products found" / "1 product found" (singular/plural) | identical | PARITY (pin) |
| 18 | the aria-labels | NONE on the triggers/input/header icon buttons | present ("Filter by category" etc.) | SUPERSET (register — the r49 stepper pattern) |
| 19 | the sort semantics | UI "Newest" = reverse array ✓ · UI "Price: Low to High" = price asc ✓ (the deep-link path is dead — #15) | identical semantics (pinned by catalog-parity since session-9) | PARITY ✓ (already pinned) |
| 20 | the featured order | [headphones, watch, tee, speaker, planter, shoes, serum, blanket, sunglasses, mat, pad, pajama] | **IDENTICAL** (the sortOrder mirror) | PARITY ✓ |

**The probe-honesty notes (three):** (1) the first probe pass crashed twice on name-based locators — the reference's triggers/header icon buttons carry NO aria-labels (finding #18), so all reference-side locators are INDEX-based (`getByRole("combobox").nth(0/1/2)`) and the header search button is located by its svg class; the clone's aria-labels are the superset. (2) The sort deep-link question was double-read (1500ms + 4000ms — no hydration race: the featured order is stable) AND cross-checked against the UI path (which works) — the deep-link death is a real reference behavior change, not a timing artifact. (3) The chips drift was verified TWO ways — the computed-style pill hunt (radius > 100px) AND the full anchor/span dump of main — plus the session-3 documentary record (the chips were measured live with combined params); the drift is triply evidenced.

### 2.3 The deliverable's shape

1. **Fix #1 (the parity divergence — the Clear button's anatomy):** `shop-filters.tsx` — the custom Clear button replaced by a plain `<button>` carrying the reference's **byte-exact class string** (the shadcn ghost/sm vintage + `gap-1`): `inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs gap-1` + `<X className="h-3 w-3" />` (rendered 16px via the `[&_svg]:size-4` override — the reference's exact quirk). A plain button, NOT the `Button` component — the clone's `button.tsx` is the older shadcn vintage (its base carries `rounded-md text-sm`, which would both diverge from the reference's string AND create a `text-sm`/`text-xs` conflict); the raw string avoids touching the shared component (zero parity risk elsewhere). The behavior (`router.push("/shop")`) and the `hasFilters` gate are unchanged.
2. **`tests/e2e/shopfilter-states.spec.ts`** — the NEW spec (12 pins, the family's state-machine + semantics contract):
   - **P1 (parity — THE HONEST RED for Fix #1):** the Clear button's className === the reference's byte-exact string + computed height "32px" + fontSize "12px" + borderRadius "10px" + color rgb(23, 23, 28) + the X's rendered 16px.
   - **P2 (parity):** the Clear visibility contract — ABSENT on /shop; PRESENT for each of the four dimensions (?category=, ?price=, ?sort=, ?search=).
   - **P3 (parity):** the Clear behavior — from a fully-filtered URL, the click resets everything: URL /shop, triggers default, "12 products found", the Clear gone.
   - **P4 (parity):** the category popover — 7 options in the reference order + the active item's aria-selected + the check svg.
   - **P5 (parity):** the price popover — the 5 byte-exact labels + the active item's aria-selected.
   - **P6 (parity — the semantic core):** the four price buckets' slug sets (deep-linked, featured order): under-50 = [organic-cotton-tee, vitamin-c-serum, charging-pad]; 50-100 = [ceramic-planter, linen-blanket, yoga-mat]; 100-200 = [leather-watch, smart-speaker, running-shoes, silk-pajama]; over-200 = [wireless-headphones, titanium-sunglasses].
   - **P7 (parity):** the sort popover's geometry — radius 10px, start-aligned with the trigger (x within 1px), gapY 4px, content width 163–167px.
   - **P8 (parity):** the keyboard contract — open → Featured highlighted → ArrowDown → "Price: Low to High" highlighted → Enter → the trigger label updates + the grid re-sorts (price asc) → re-open → Escape closes uncommitted.
   - **P9 (superset — the registered coherence):** the trigger labels follow the params: ?sort=rating → [All Categories, All Prices, Top Rated]; ?price=over-200 → [All Categories, Over $200, Featured]; ?category=electronics → [Electronics, All Prices, Featured].
   - **P10 (superset + parity):** the bar search — type "SERUM" + Enter → URL /shop?search=SERUM + the set [vitamin-c-serum] + the heading `Results for "SERUM"` (the case-insensitive MATCH is the reference parity; the URL push is the registered superset).
   - **P11 (parity):** the count line — "12 products found" / "3 products found" / "1 product found" (the singular).
   - **P12 (parity):** the popover item highlight — data-highlighted + bg rgb(253, 243, 237) (the Radix accent contract).
3. **The drift + superset register (docs, no code):** the chips drift (#14 — the reference removed its chip row; the clone keeps its deep-linkable chips as the registered superset), the dead `?sort=`/`?price=` params (#15 — the clone's working deep links are the superset), the URL-writing contract (#13 — the reference writes the URL ONLY on the header search; the clone's bar also pushes, the registered superset), the trigger-label coherence (#12), and the aria-labels (#18 — the r49 stepper pattern). All recorded in the PAD's divergence register + this plan.
4. **NO other production code changes.** The one fix is the round's only production diff (one button's markup in one file; zero server changes, zero shared-component changes).

## 3. The TDD plan (the gate-round convention: calibration → RED-first for the fix → pins → mutations)

### 3.1 Calibration (done — the reference measured live across four probes)

§2.2's table. The one divergence (#1/#2/#3 — the Clear anatomy) carries a first-hand byte-exact measurement on BOTH sides; the parity confirmations (#4–#11, #16, #17, #19, #20) each carry the reference's computed styles/sets; the drifts/supersets (#12–#15, #18) each carry the reference's measured behavior + the documentary record.

### 3.2 The honest RED (the fix, TDD-first)

Write P1 FIRST → run against the CURRENT artifact → it FAILS (the custom string + 36px + 14px + 0px radius + muted color) → apply Fix #1 → re-run → GREEN. The round's red→green proof — the failing pin written before the fix, exactly as the CLAUDE.md TDD rule demands for behavior changes.

### 3.3 The pins, written to the measured truth

The 12-pin spec (§2.3). P2–P12 document existing/superset behavior (the gate-round form). The spec's conventions: `page.goto` deep links for the URL-driven states; `getByRole("combobox").nth(0/1/2)` for the triggers (the clone's aria-labels exist but nth() matches the reference-probe form — robust either way); computed-style assertions via `evaluate` (the clone-app-pat-pro methodology); the popover assertions scoped to `[role='listbox']`.

### 3.4 The mutation-style efficacy proofs ×6 (each caught at the E2E layer on the REBUILT artifact — the session-36 lesson, then byte-exact revert, md5-verified at every step)

- **M1 (Fix #1 reverted):** the custom Clear string restored → **P1 fires** (the anatomy pin — the round's own fix).
- **M2 (the visibility gate broken):** `hasFilters` hardcoded `true` → **P2 fires** (the Clear renders unfiltered).
- **M3 (the bucket bound broken):** under-50's `lte: 4999` → `lt: 4999` (excluding the $49.99 tee) → **P6 fires** (the under-50 set = 2 ≠ 3).
- **M4 (the trigger coherence broken):** the sort Select's `value={activeSort}` → uncontrolled (`defaultValue`) → **P9 fires** (the ?sort=rating trigger reads "Featured").
- **M5 (the sort commit suppressed):** the sort's `setParam` drops the `router.push` → **P8 fires** (Enter never updates the trigger/URL).
- **M6 (the popover radius broken):** the SelectContent's `rounded-md` → `rounded-sm` → **P7 fires** (radius 6px ≠ 10px).

### 3.5 The full gate (the regression proof)

lint (0/0) · typecheck · the FULL unit layer (353 — unchanged) · build · **the FULL E2E × 2 consecutive runs on the final code (333 + 12 = 345 chromium tests per run, as four half-suite invocations under the 600s cap)**.

## 4. Execution order

1. **Calibration:** the four probes (done, §3.1).
2. **RED:** write P1 → run against the current artifact → the honest RED (the custom Clear confirmed at the E2E layer).
3. **FIX:** Fix #1 (the Clear button) → P1 GREEN (the red→green cycle).
4. **PINS:** write the full 12-pin spec; run it; the unit layer re-run (353 — unchanged).
5. **Mutations ×6** (§3.4 — each caught + byte-exact revert, the artifact rebuilt for every E2E proof).
6. **Full gate:** lint · typecheck · unit · build · the FULL E2E × 2 consecutive runs.

## 5. Post-change battery + screenshots

- The paired pixel sweep re-run (all 8 routes — the fix lives on an INTERACTION-GATED surface: the Clear renders only when filtered, so the resting sweep must stay at baseline byte-identical) + **the 60th mobile-nav verification** re-run (token-exact parity must hold).
- **Screenshots 261-265** (probe-first, single invocation, the production standalone on :3001 — a FRESH process, zero DB mutations): the filtered bar with the reference-anatomy Clear (?category=electronics — Fix #1's proof: the ghost-sm Clear at 32px/12px/10px beside the three triggers); the category popover OPEN (the 7 options + the active check); the price popover OPEN (the 5 byte-exact labels); the sort popover with the keyboard highlight mid-contract (ArrowDown on "Price: Low to High" — the accent bg); the bar search result (?search=SERUM — the case-insensitive match + the heading + the count line). **VLM 5/5 verification** (describe the surface as it IS — the DOM probe is the ground truth).

## 6. Docs duty (this round's deliverable + the round's own records)

The PAD **v1.50** (§8.1's shopfilter-states row + the Total row 50/698/353+345; §8.4's checklist 345; §3.2's tree 27 specs + the shopfilter-states entry; the divergence register's five new entries (the chips drift + the four supersets); the v1.50 revision row; the header's Last-Updated session tag) · SKILL **v1.50.0** (the version; §11's counts reconciled to 353/345; the line-31 session pointer; Appendix C → session50 + **lesson 054** — the index-locator rule for aria-less reference surfaces + the reference-drift verification pattern) · AGENTS.md (the shopfilter-states bullet + the drift lesson) · CLAUDE.md (the E2E spec list + the shop-filter contract) · README (the 698 row + the Testing table + the mobile-nav 59/60 row) · the drift-watch verifier's spec-count recalibration 26→27 and re-run GREEN · `docs/session_99.md` (the round narrative) · the worklog S50 entry · this plan's sign-offs · `.env.example` verified current (NO env plumbing).

## Sign-offs (completed at execution)

- [x] Calibration recorded (FOUR probes — r50 + r50b + r50c (reference, index-locators after the aria discovery) + shopfilter-clone-r50d (the clone side) — the byte-exact Clear anatomy, the four-bucket semantics, the popover geometry/hover, the keyboard contract, the chips drift (triply evidenced), the dead sort/price deep links, the header-search URL write)
- [x] The honest RED (P1 written first, failing on the current artifact — the custom Clear string + 36px/14px/0px/muted) → Fix #1 → GREEN
- [x] Pins green (the 12-pin spec on the fixed artifact; the unit layer 353 unchanged)
- [x] Mutations ×6 caught + byte-exact reverts (md5-verified at every step; each on the REBUILT artifact)
- [x] Full gate × 2 consecutive runs on the final code (353 + 345 × 2 = 698 per run; lint 0/0 · tsc clean · build 0)
- [x] Post-change battery (the sweep ALL 8 ROUTES AT BASELINE byte-identical · the 60th mobile-nav token-exact · screenshots 261-265 VLM 5/5)
- [x] Docs aligned (PAD v1.50 + the drift register; SKILL v1.50.0 + lesson 054; AGENTS, CLAUDE, README, the verifier recalibration 26→27 — the drift watch re-run ALL FAMILIES GREEN; session_99.md, the worklog S50 entry, this plan's sign-offs); committed to main; pushed via the SSH wrapper
