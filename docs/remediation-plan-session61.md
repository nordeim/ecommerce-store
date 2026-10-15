# Remediation Plan — Session 61 (Round 61): SRCHROWS-STATES-1 — The Search Typeahead Popover's Row Interaction States: The Sweep's Nineteenth Installment (The Thrice-Deferred Standing Next)

**Date:** 2026-10-15 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `9f98fe1` (the r60 ship `f3fec76` + the user's session_119 narrative log — docs only)
**Status at audit start:** 837-test gate per run (356 unit + 481 E2E + setup logins), PAD v1.60, SKILL v1.60.0 — lint 0/0 · tsc clean · 356/356 unit+integration (23 files) · build exit 0 · the full E2E baseline re-run **all green (481 chromium unique across four FILE-list invocations; 490 summed — the CLI regex filter double-counts `guest-cart`/`guest-checkout` under the `cart.spec.ts`/`checkout.spec.ts` patterns, 5 runs, an instrument note for this round's ledger), ZERO flakes** · the pre-change battery **ALL CLEAN** (sweep 8/8 at baseline band byte-identical to the r60 ship state; the mobile-nav TOKEN-EXACT verification; watches + census clean).

## 0. The round's mandate

The user's standing round instruction (the full audit/parity workflow with the mobile-nav + Tailwind v4 watches; the `.env`/db-root contract — verified: `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root with the hard-link convergence at inode 566449; the skills/ exclusion — verified in all 4 configs (vitest include-list, eslint ignores, tsconfig exclude, playwright testDir); the Stripe/env restated below — demo-mode rest re-verified: `STRIPE_SECRET_KEY=""` → the reference-parity demo card form, the credential-gated Payment Element flow stays waiting for keys).

## 1. Baseline verification (state at audit start)

- **Workspace (a FRESH-CLONE round):** the sandbox was reset — `git clone https://github.com/nordeim/ecommerce-store.git` at `9f98fe1`; the environment rebuilt end-to-end (bun install 476 packages; `.env` from `.env.example`; `bun run db:setup` — 6 categories/12 products/4 users/4 orders/3 hero slides; the parent-injection shadow trap hit on cue (`bun -e` read `file:/home/z/my-project/db/custom.db`) and converged via the documented hard-link DB (inode 566449 both paths); Playwright Chromium 1243 installed).
- **Baseline gate:** lint 0/0 · tsc clean · **356/356 unit+integration (23 files)** · build exit 0 · **the full E2E baseline all green** — 481 chromium tests (verified by `--list`: 481 chromium + 1 setup login in 38 files), zero flakes.
- **The Round-61 pre-change live battery (the production standalone on :3000):** the paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec` painted both sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0% [9 px], checkout 0.01%, account 0% [9 px], login 0.28%); the mobile-nav verification **TOKEN-EXACT** (all 11 token checks PASS); the standing watches clean (typeahead ref 0 search requests; carousel flip intervals [4000, 9000, 14000]; sitemap 200/17 locs; robots 200; JSON-LD Organization/WebSite/Product); the console census clean (24 routes + 11 admin).
- **Skills consulted (from the repo `skills/skills-catalog.md`):** **tdd** (the RED→GREEN→mutate discipline), **agent-browser** (the probe conventions — L81 full class strings, L77 the real-keyboard focus discipline, the L84 scroll/viewport awareness), **tailwind-patterns** (the v4 engine registers), **clone-app-pat-pro** (the parity-workflow framing). The scandihaven patterns: reviewed in r58 (the standing instruction); the checkout/webhook patterns confirmed aligned — no changes required this round.

## 2. Audit results

### 2.1 The candidate triage (session-119/120's "suggested next" list)

1. **The search popover's row hover/focus states (CHOSEN — the round's deliverable):** the sweep's nineteenth installment, the thrice-deferred standing next (r58/r59/r60 each deferred it behind the parity-family closure). The superset's own deep states — the reference has NO typeahead popover (established across sessions 8/46/58; the reference's search is the strip alone), so this is a **clone-internal consistency + a11y-quality audit**: the rows' computed anatomy and hover are measured against the app's OWN token vocabulary, and the keyboard/ARIA axes against the WAI-ARIA combobox pattern (the production-superset bar the project sets for itself).
2. **The PDP description-tab's key-features list states (NOT CHOSEN):** a smaller parity-adjacent surface; the r60 note's alternate. Deferred again — the search rows are the standing next and carry the larger functional surface (the a11y semantics + the keyboard model).
3. **The credential-gated items (UNCHANGED):** Stripe test-mode keys and an email provider — no credentials provided this round; the refund loop + Payment Element flow remain built and waiting.

### 2.2 THE MEASURED GROUND TRUTH (one probe: `scripts/srchrows-clone-r61a.mjs` — the clone's popover, live on the production standalone :3000, 1024×768, query "an" → 5 seeded rows)

| # | Axis | Clone (measured live) | The audit bar (the app's own vocabulary / WAI-ARIA) | Verdict |
|---|---|---|---|---|
| 1 | the popover container | `absolute left-4 right-4 mt-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50` — 992×302 at (16,149), bg white, border 1px rgb(233,230,226), radius 12px, z 50 | the app's popover token set (white bg + hairline + rounded-xl + z-50) — consistent | PARITY (consistent) |
| 2 | the row's resting anatomy | 990×60, flex, gap 12px, padding 10px 16px, bg transparent, color rgb(23,23,28), cursor pointer (the session-49 platform-cursor rule) | the row grammar of the app's list rows | PARITY (consistent) |
| 3 | the row's children | img 40×40 radius 10px object-cover; name 14px/500 ellipsis; category 12px/400 rgb(111,111,123) lowercase (the session-8 SEARCH-CASE-1 register); price `text-sm font-semibold` | — | PARITY |
| 4 | the row's HOVER | bg → **rgb(253,243,237)** (accent), NO text flip (name stays rgb(23,23,28)), boxShadow none | the accent token — the SAME hover bg as the ghost X button's pair (searchpanel P5: bg rgb(253,243,237)) | PARITY (consistent) |
| 5 | **the ARIA census** | input: NO `role=combobox`, NO `aria-expanded`, NO `aria-controls`, NO `aria-autocomplete`, NO `aria-activedescendant`; container: NO `role=listbox`, NO `id`; rows: NO `role=option`, NO `aria-selected`, NO `id` | the WAI-ARIA combobox pattern (the production-superset bar): the input announces the popup; the rows are options | **FINDING 1 (THE HEADLINE — the visible listbox is invisible to assistive tech)** |
| 6 | **the keyboard interaction** | ArrowDown/ArrowUp do NOTHING (measured: activeElement stays INPUT, 0 aria-selected rows, no highlight); Enter ALWAYS submits the query; rows ARE Tab-reachable (real-Tab walk: input → Search → Close → row1 → row2 → …; each focused row matches `:focus-visible` and paints the GLOBAL outline `auto 1px` ring/50) | a high-end typeahead: arrows move an ACTIVE row (painted with the same accent bg), Enter commits the active row, Enter without an active row submits the query | **FINDING 2 (no arrow-key navigation — the keyboard model is Tab-only)** |
| 7 | **the price render** | `${(s.price / 100).toFixed(2)}` INLINE — search-bar.tsx:242, the ONLY storefront price NOT via `formatCents` (money.ts): product-card, cart-drawer, admin rows, account tabs all use the seam | the architecture contract: "Money is integer cents everywhere; `toFixed`/`Intl` only at display via `formatCents`" | **FINDING 3 (the seam bypass — output byte-identical today, a hygiene divergence with mutation exposure)** |
| 8 | the Escape path | closes the panel (popover + input unmount) | the pinned srch-behavior/Search behavior | PARITY (existing) |
| 9 | the click path | a row click navigates to the PDP | the pinned search.spec behavior | PARITY (existing) |

### 2.3 The registers (documented, no code change)

1. **The global outline register (r59's heart-icon family):** keyboard-focused RAW buttons paint the browser-default `outline: auto 1px` tinted ring/50 by the global `* { outline-ring/50 }` rule — the rows inherit this register on the Tab path (measured, axis 6). NOT a divergence: it is the app's established raw-button vocabulary (the shadcn buttons instead paint `focus-visible:ring-1` in box-shadow). The fix keeps the rows as raw `<button>`s — the Tab path and its outline stay byte-identical.
2. **The engine-spelling family (standing):** the outline color serializes as `lab(...)` under v4 vs the reference's `rgba()` — the standing engine register, no action.
3. **The `aria-haspopup="dialog"` register:** the header's search toggle already carries `aria-haspopup="dialog"` + `aria-expanded` (session-46) — the panel IS a dialog-shaped strip; the typeahead popover inside it is the combobox surface. The two ARIA layers compose (a dialog containing a combobox) — no conflict.

## 3. The remediation (TDD — the honest-RED form)

### 3.1 The pin spec — `tests/e2e/srch-activerow-states.spec.ts` (14 pins)

FILE-ORDER CONTRACT (the rate-limit discipline, discovered at planning): `/api/search` is rate-limited 60/min/IP and **`srch-behavior.spec.ts`'s P11 (LAST) deliberately EXHAUSTS the budget with a 70-request 429 burst** — a spec sorting after `srch-behavior` would inherit a poisoned bucket (every typeahead request 429s until the 60s window resets). The spec is therefore named `srch-activerow-states` — ASCII `"srch-a…" < "srch-behavior"` — so it draws its ~10 requests from the FRESH budget BEFORE the burst, exactly as searchpanel-states documents its own ordering ("search." < "searchpanel-" < "smoke." < "srch-"). The s–z group grows to 13 files; the round's deliverable ID stays SRCHROWS-STATES-1. Context: the DEFAULT storageState (authed — the home page + header need the storefront chrome; the popover is auth-agnostic client state).

- **P1** — the popover container: computed bg white, border 1px, radius 12px, z 50, the geometry (992 wide at 1024) + **`role="listbox"` + `id="search-suggestions"` + the aria-label** (FINDING 1's container half). **RED.**
- **P2** — the row's resting anatomy: 60px tall, gap 12px, padding 10px 16px; the img 40×40 radius 10px; the name 14px/500; the category 12px muted lowercase; the price span `text-sm/600` rendering the **`formatCents` output** ("$299.99" for the headphones row — the FINDING 3 guard: byte-identical pre/post, catches math mutations)
- **P3** — the row's hover: bg flips to rgb(253,243,237) (accent), NO text flip, cursor pointer
- **P4** — the input's combobox census: `role="combobox"`, `aria-expanded=true` while the popover is open, `aria-controls="search-suggestions"`, `aria-autocomplete="list"` (FINDING 1's input half). **RED.**
- **P5** — the keyboard Tab path (the register pin): from the input, real Tab presses reach the rows (buttons); the focused row matches `:focus-visible` and paints the global outline (`auto 1px`, the ring/50 tint)
- **P6 — THE HEADLINE:** with the popover open, ArrowDown in the input ACTIVATES the first row: the row paints bg rgb(253,243,237) + `aria-selected="true"` + `role="option"`; the input carries `aria-activedescendant` pointing at the row's id. **RED.**
- **P7** — the movement + the wrap: ArrowDown again → the SECOND row active (the first de-activates); ArrowDown from the LAST row wraps to the FIRST. **RED.**
- **P8** — the entry-from-top: ArrowUp from NO active row → the LAST row active (the listbox standard). **RED.**
- **P9** — the Enter commit: with a row active, Enter in the input NAVIGATES to that row's PDP (the panel closes, the URL lands on `/product/<slug>`). **RED.**
- **P10** — the Enter guard (the srch-behavior P6 contract preserved): popover open, rows present, NO arrow pressed → Enter submits the QUERY to `/shop?search=…` (the intercept must not eat the plain Enter)
- **P11** — the click path: clicking a row navigates to the PDP (the existing behavior, unchanged under the fix)
- **P12** — the Escape path: with the popover open, Escape closes the panel (the popover + the input unmount)
- **P13** — the query-change reset: with a row active, typing one more character clears the active row (all `aria-selected=false`, no activedescendant) — the stale-highlight guard. **RED.**
- **P14** — the @375 pass: the popover renders unclipped below the form (the hit-test), rows 343 wide × 60 tall, the arrow activation works on mobile geometry too

### 3.2 The fixes (all in `src/components/store/search-bar.tsx`)

**FIX-1 (the headline, FINDING 1) — the WAI-ARIA combobox census:**
- the Input: `role="combobox"`, `aria-expanded={showSuggestions}`, `aria-controls="search-suggestions"`, `aria-autocomplete="list"`, `aria-activedescendant={activeSlug ? `srch-opt-${activeSlug}` : undefined}`
- the popover container: `id="search-suggestions"`, `role={suggestions.length > 0 ? "listbox" : undefined}` (the loading-only state keeps plain semantics — a listbox with zero options is invalid), `aria-label="Search suggestions"`, `aria-busy={loading}`
- each row: `role="option"`, `id={`srch-opt-${s.slug}`}`, `aria-selected={activeSlug === s.slug}` — the rows stay raw `<button>`s (the Tab path is untouched)

**FIX-2 (FINDING 2) — the arrow-key active-row state machine:**
- `const [activeSlug, setActiveSlug] = React.useState<string | null>(null)` — cleared in the input's onChange (the query change invalidates the highlight; the session-46 query/suggestion preservation is untouched)
- an `onKeyDown` on the Input: ArrowDown → the next option from null (first) or the last (wrap); ArrowUp → the previous from null (LAST — the entry-from-top standard) or wrap; both `event.preventDefault()` (the caret does not jump to start/end while the popup is open — the combobox contract); Enter handled in the form submit (below)
- the active row's paint: `cn(base, activeSlug === s.slug && "bg-accent")` — the SAME accent token as the hover (the app's vocabulary; hover and active compose to one color)
- the Enter intercept in `submit`: if `activeSlug` → `setSearchOpen(false); router.push(\`/product/${activeSlug}\`)` — else the existing query submit (P10/srch-behavior P6 unchanged)
- `scrollIntoView({ block: "nearest" })` for the active row (an effect on activeSlug — a no-op at ≤6 rows, correct if the list ever grows)

**FIX-3 (FINDING 3) — the money seam:** the price span renders `formatCents(s.price)` (the `@/lib/money` import) — the only storefront price outside the seam rejoins it.

**Zero expected resting-pixel drift:** the popover exists ONLY while a ≥2-char query is typed — the pixel sweep types nothing; the strip's enter/exit geometry and the form's arithmetic are untouched (searchpanel P1-P13); the rows' resting computed set is unchanged (the conditional `bg-accent` paints only while a row is ACTIVE). The post-change sweep MUST stay at baseline (the battery's job to prove).

### 3.3 The mutation battery (×8, the teeth proof — each mutation applied to the source, rebuilt, caught, byte-exact restore)

- **M1** drop the container's `role="listbox"`/`id` → P1 (+P4's controls read)
- **M2** drop the rows' `role="option"`/`aria-selected` → P4's row census (+P6/P7's aria reads)
- **M3** drop the Input's `onKeyDown` arrow handling → P6+P7+P8 (+P9, P13)
- **M4** drop the active row's `bg-accent` paint → P6 (+P7's bg read)
- **M5** break the Enter intercept (always submit the query) → P9
- **M6** drop the onChange reset → P13
- **M7** break the price math (`/ 1000`) → P2's price read (the FINDING 3 guard)
- **M8** drop the input's combobox attrs (`role`/`aria-expanded`/`aria-controls`/`aria-autocomplete`) → P4

### 3.4 The verification protocol

1. The honest RED: the spec runs against the CURRENT artifact — P1, P4, P6, P7, P8, P9, P13 FAIL exactly as calibrated (the seven finding pins); the other 7 pass (the parity/consistency axes).
2. The fixes land (§3.2); the spec re-runs — **15/15 (14 pins + the setup login)**.
3. The mutation battery ×8 + the pristine rebuild re-run (15/15).
4. The immediate regression net: search.spec + srch-behavior.spec + searchpanel-states.spec + smoke.spec + storefront-parity.spec (the search-family specs + the resting-parity holders).
5. The full gate ×2: `bun run lint && bun run typecheck && bun run test && bun run build && the E2E ×2` — the four FILE-list groups per run (srchrows-states joins the s–z group at 13 files; the file-list patterns for `cart`/`checkout` use exact-path forms to avoid the regex double-match).
6. The post-change battery: the paired pixel sweep (the resting pixels MUST stay at baseline — the fixes are popover-internal), the mobile-nav verification, the watches, the census.
7. The screenshots 316–320 (docs/screenshots/): the resting popover rows, the hovered row (the accent pair), the arrow-ACTIVE row (the headline's proof — the bg + aria-selected at capture), the Enter-on-active navigation (the PDP landing), the @375 pass. Probe-first, read-only, the standalone on :3001.
8. The VLM verification (the standing round discipline) + pixel settlement for any dispute.
9. The docs duty: PAD v1.61 (the revision row + totals + the family row + the checklist + §3.2's spec tree), the drift-watch verifier recalibration 37→38 re-run ALL FAMILIES GREEN, SKILL v1.61.0 (the round's lesson), AGENTS.md (the search-rows family bullet), CLAUDE.md/README.md (the test-count rows), the session narrative `docs/session_121.md`, the repo worklog S61 entry, the plan's §6 execution record filled.
10. The commit + the push: the SSH wrapper protocol (the key materialized outside the repo, the sanity parse, the dry-run, the real push to main, the remote verify, the key shredded).

## 4. Risks & mitigations

- **The Enter intercept's blast radius (FIX-2):** every Enter in the form now checks activeSlug first. The no-active path is byte-identical (P10 + srch-behavior P6 are the guards); the empty-submit no-op (srch-behavior P5) can never have an active row (no suggestions with an empty query). The click path is untouched (P11).
- **The role additions' blast radius (FIX-1):** `getByLabel("Search products")` locators (the specs' form) are attribute-agnostic; `getByRole("combobox")` exists only in admin.spec against the admin Select (a different surface). The P1 loading-line locator (`header button` filtered by text) is role-agnostic. The rows stay buttons.
- **The conditional listbox role:** the loading-only frame (no rows) renders the container WITHOUT role — the input's `aria-expanded` stays true (the popup IS open, busy); no invalid empty-listbox state.
- **The Tab-path preservation:** the rows keep their `<button>` focusability and the global-outline register (P5 pins it) — the hybrid focus model (focusable options + aria-activedescendant) is the ARIA-authoring-practices-legal form.
- **The sweep's zero-drift proof:** the popover is a typing-only surface; the searchpanel enter/exit pins (P8-P11) and the form arithmetic (P12) are the regression net for the strip itself.

## 5. Sign-offs

- [x] The plan validated against the codebase: the search-bar.tsx structure verified (the popover's conditional render at `showSuggestions && !isExit`, the rows' current class string, the inline price at line 242, the input's current attributes); the money.ts seam verified (`formatCents` + its 5 consumer files); the existing pin coverage verified (searchpanel-states P1-P14, srch-behavior P1-P12, search.spec — the rows' interaction states are the unpinned seam); the ARIA collision check verified (no storefront `getByRole("combobox")` locators; the header's existing `aria-haspopup="dialog"` composes).
- [x] The TDD form: the spec written FIRST (§3.1); the honest REDs calibrated (P1/P4/P6/P7/P8/P9/P13); the fixes after the RED (§3.2); the mutation battery after the GREEN (§3.3).
- [x] The standing gates re-verified post-change: the sweep (zero resting drift), the mobile-nav, the watches, the census, the full gate ×2.

## 6. The execution record (the plan vs. what happened)

- **The workspace:** the FRESH-CLONE round (the sandbox was reset — `git clone` at `9f98fe1`; bun install 476 packages; the `.env` from `.env.example`; db:setup 6/12/4/4/3; Playwright Chromium 1243; the parent-injection shadow trap hit on cue and converged via the hard-link DB at inode 566449 both paths).
- **The baseline gate:** lint 0/0 · tsc clean · 356/356 unit+integration (23 files) · build exit 0 · the full E2E baseline all green — 481 chromium (verified by `--list`: 481 chromium + 1 setup login in 38 files), zero flakes. NOTE (L93, documented in the ledger): the four FILE-list invocation SUMS read 490 because bare `cart.spec.ts`/`checkout.spec.ts` file args are REGEXES that also match `guest-cart.spec.ts`/`guest-checkout.spec.ts` (5 double-matched runs); the unique census is the 481 — the r60 ship state byte-identical.
- **The pre-change battery:** sweep 8/8 at baseline band (home 0% [6 px, slide painted both sides], shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0% [9 px], checkout 0.01%, account 0% [9 px], login 0.28%); the mobile-nav verification TOKEN-EXACT (all 11 token checks); watches + census clean.
- **The audit:** the probe `scripts/srchrows-clone-r61a.mjs` (the clone's popover, live on the production standalone :3000, 1024×768, query "an" → 5 rows) — the first run hit the 1-char query threshold (the popover's ≥2-char gate; the probe re-ran with "an"); the ground truth table §2.2 as measured. THREE findings confirmed: the ARIA census empty, the arrows dead (0 aria-selected, the activeElement unchanged), the price inline.
- **The honest RED:** the spec ran against the CURRENT artifact — **exactly the 8 calibrated REDs** (P1 `role=null ≠ "listbox"`; P4 `role=null ≠ "combobox"`; P6/P7/P8/P9/P13 the arrow family; P14's arrow half) + **6 GREEN** (P2/P3/P5/P10/P11/P12). TWO instrument iterations during the calibration (the honest audit of my own pins): (1) the P5 text-content slice cut the product name one char short of the assert's substring (24 → 30); (2) the geometry pins recalibrated against the E2E viewport — the container is 1248 wide at the 1280 Desktop-Chrome default (the probe's 992 was its own 1024 viewport), and the @375 ROW is 341 (the container's 343 minus the 2px borders) — measured via `scripts/measure375-r61.mjs`. The plan's "7 REDs" calibration note reconciled: P14's arrow half (built into the pin from the start) makes the eighth — the honest count as run.
- **The fixes (§3.2 as planned):** the WAI-ARIA combobox census + the arrow-key active-row state machine + the formatCents seam, all in search-bar.tsx (88 insertions / 4 deletions). Lint 0/0, tsc clean, build exit 0.
- **The GREEN:** the spec re-ran — **15/15 (14 pins + the setup login) in 51.9s**.
- **The immediate regression net:** search.spec + searchpanel-states.spec + srch-behavior.spec + smoke.spec + storefront-parity.spec — **91 passed** (the search family and the resting-parity holders hold under the ARIA additions + the Enter intercept).
- **The mutation battery ×8 (§3.3):** ALL CAUGHT with byte-exact restores (md5-verified per mutation): M1 the container role/id dropped → **exactly P1** · M2 the rows' option semantics dropped → **P6+P7+P8+P13+P14** (5 pins — the attachment set proves the full family) · M3 the arrow handler killed → **the full arrow family P6+P7+P8+P9+P13+P14** · M4 the active paint dropped → **P6+P14** · M5 the Enter intercept broken → **exactly P9** · M6 the query-change reset dropped → **exactly P13** · M7 the price math broken → **exactly P2** (the FINDING 3 guard's teeth) · M8 the input's combobox census dropped → **exactly P4**.
- **The full gate ×2:** lint 0/0 · tsc clean · 356/356 unit (23 files) · build exit 0 · **495 E2E chromium per invocation-set (495 + the 4 setup logins = 499 summed; a–c 202 / c–m 55 / n–q 88 / s–z 154 — srch-activerow-states joined the s–z group at 13 files; the FILE lists use FULL PATHS — the L93 discipline) — ×2 consecutive, ZERO flakes**; the counted total **851 = 356 unit + 495 E2E**.
- **The post-change battery:** sweep **8/8 AT BASELINE byte-identical** (home 0% [6 px], shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0% [9 px], checkout 0.01%, account 0% [9 px], login 0.28%) — the fixes are popover-internal, exactly as calibrated; the mobile-nav verification **TOKEN-EXACT**; watches + census clean.
- **The screenshots 316–320** (probe-first, read-only, the production standalone on :3001 — `scripts/srchrows-captures-r61.mjs` + `scripts/capture-runner-r61.sh`): 316 the resting popover (the listbox/combobox census verified at capture: contRole listbox, contId search-suggestions, inputRole combobox, 5 rows, 60px) · 317 the hovered row (bg rgb(253,243,237), no text flip, pointer) · 318 the arrow-ACTIVE row (row1Selected true, bg the accent, activedescendant srch-opt-wireless-headphones — the headline's proof at capture) · 319 the Enter-on-active navigation (URL /product/wireless-headphones, the h1 verified, the panel closed) · 320 the @375 pass (container 343@x16, row 341×60, selected true, the accent bg).
- **The VLM verification: 5/5 PASS** (the first run — no description-side settles needed this round).
- **The docs duty:** PAD v1.61 (the revision row + the §8.1 Total 61/851/356+495 + the family row + the §8.4 checklist 495/38 + the §3.2 38 specs + the spec tree), the verifier recalibration 37→38 re-run **ALL FAMILIES GREEN**, SKILL v1.61.0 (lesson 065 — L92 the rate-limit file-order trap, L93 the CLI file-arg regex gotcha, L94 the viewport-derived geometry pin), AGENTS.md (the search-rows family bullet), CLAUDE.md + README.md (the count rows + the family summaries); the session narrative docs/session_121.md; the repo worklog S61 entry; this §6 record.
