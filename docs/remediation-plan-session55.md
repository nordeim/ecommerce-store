# Remediation Plan — Session 55 (Round 55): HEADER-ICONS-1 — The Header's Icon-Button Family: The Fourth Fully-Parity Family (the Sweep's Thirteenth Installment), the aria + Badge Supersets, and the Cart-Aria Pluralization Fix (the Honest RED)

**Date:** 2026-10-13 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `8317338` (the session-54 ship `692f888` + the user's session_108 narrative log — docs only, zero production code)
**Status at audit start:** 751-test gate per run (353 unit + 398 E2E), PAD v1.54, SKILL v1.54.0 — lint 0/0 · tsc clean · 353/353 unit+integration (22 files) · build exit 0 · the full E2E baseline re-run **all green (398 chromium + the setup logins per four FILE-list invocations: a–c 215+1 [6.8m] / c–m 44+1 [2.2m] / n–s 79+1 [3.0m] / s–z 60+1 [2.1m] — the 398-chromium ship total byte-identical to the documented round-54 state)** — ZERO flakes — verified on the PULLED workspace (the environment intact: `.env` contract, the hard-link DB convergence at inode 263859 at both paths, node_modules, the Playwright Chromium cache).

## 0. The round's mandate

The user's standing round instruction (the full audit/parity workflow with the mobile-nav + Tailwind v4 watches; the `.env`/db-root contract — verified: `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root, the hard-link convergence intact at inode 263859; the professional Stripe integration verification — demo mode rests green without keys, the standing credential gates unchanged (NO Stripe test-mode keys or email credentials provided this round); the vitest + playwright suites — both verified with the `skills/` exclusion re-confirmed in all four configs (tsconfig exclude line 41; vitest include allowlist; playwright testDir; eslint ignores); the TDD remediation plan; the screenshots; the `.env.example` — verified current, this round adds NO env plumbing; the docs; and the main-only push via the SSH wrapper). The round's deliverable is audit-derived: session-107/108's standing "suggested next" — **the sweep's thirteenth installment: the header's icon-button states**.

## 1. Baseline verification (state at audit start)

- **Workspace PULLED (not reset):** `git pull` fast-forwarded `692f888..8317338` (docs/session_108.md only — the user's round-54 narrative log; the recent-changes audit CLEAN, docs only, zero production code). The environment intact.
- Baseline gate: lint 0/0 · tsc clean · **353/353 unit+integration (22 files)** · build exit 0 · **the full E2E baseline re-run all green** — 398 chromium tests + the setup logins, four FILE-list invocations under the 600s cap (a–c 215+1 [6.8m] / c–m 44+1 [2.2m] / n–s 79+1 [3.0m] / s–z 60+1 [2.1m]; total 398 chromium — byte-identical to the documented round-54 ship total).
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd** (the honest-RED round convention — calibration → RED pins → fix → GREEN → mutations; this round HAS a production fix, the r54 form), **agent-browser** (the live reference walk — the r55a/b/d probes), **clone-app-pat-pro** (the parity methodology — the DOM probe + the computed style are the ground truth), **code-review-and-audit** (the lenses on the header family + the pluralization question).
- **The Round-55 live battery (the audit's parity layer, against the production standalone on :3000 via `scripts/battery-runner.sh prod`):** the paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec` painted both sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0% [9 px], checkout 0.01%, account 0% [9 px], login 0.28% — byte-identical to the documented round-42..54 baselines). **The 69th mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks). The standing watches clean (typeahead: the reference fires ZERO search requests; carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11 admin CLEAN.

## 2. Audit results

### 2.1 The candidate triage (session-107/108's "suggested next" list)

1. **The header's icon-button states (CHOSEN — the round's deliverable):** the sweep's method applied — the family's zones enumerated (`src/components/store/header.tsx` — the four ghost icon buttons: Search / Heart-wishlist / Bag-cart / User-account; the cluster container; the cart-count badge; the A-wrapped heart/user structure; the focus-visible layer) + cross-checked against the E2E layer: the header's GEOMETRY is pinned (storefront-parity:204 the gap-1 cluster + the 156w arithmetic; :229 the mobile 3-child row) but the INTERACTION axis had near-ZERO pins (no hover pin, no focus-visible pin, no aria pin, no badge anatomy pin — the bag badge appears only inside flow locators like `getByRole("button", { name: "Cart, 1 items" })`).
2. **The toast's enter/exit animation states (RE-DEFERRED):** the toast carries the session-4 dark-box pins (cart.spec:38-56) + the toast-viewport round — the enter/exit spring corners remain, thinner than the header family on the a11y axis.
3. **The account order-detail's final deep corners (RE-DEFERRED, the fifth time):** 27 pins + the session-34/45 detail rounds.
4. **The credential-gated items (UNCHANGED):** Stripe test-mode keys and an email provider — no credentials provided this round.

### 2.2 THE PRIMARY FINDING — the family is the sweep's FOURTH FULLY-PARITY FAMILY; the honest RED lives in the SUPERSET layer

The calibration (SIX probes — `headericons-probe-r55a.mjs` + `headericons-probe-r55b.mjs` + `headericons-probe-r55d.mjs` (reference, login-gated) + `headericons-clone-r55c.mjs` + `headericons-clone-r55e.mjs` + `headericons-clone-r55f.mjs` (clone, via the battery runner), live, the DOM dumps + computed styles + REAL-mouse hovers + a keyboard tab-walk as the ground truth):

| # | Behavior | Reference (measured live) | Clone (measured live) | Verdict |
|---|---|---|---|---|
| 1 | the four buttons' geometry | search 844, heart 884, bag 924, user 964 — each **36×36** at y=42 | **IDENTICAL** (844/884/924/964, 36×36) | PARITY (pin) |
| 2 | the cluster | `flex items-center gap-1` — 156px wide, gap 4px, 4 children | **BYTE-IDENTICAL** (r26's pin re-verified in-family) | PARITY (pin) |
| 3 | the svg class strings | `lucide lucide-{search,heart,shopping-bag,user} h-5 w-5` | **BYTE-IDENTICAL** | PARITY (pin) |
| 4 | the svg COMPUTED size | **16px/16px** — the `[&_svg]:size-4` descendant utility beats the svg's own `h-5 w-5` | **IDENTICAL 16px/16px** (the same contest, the same winner — v4 behaves as v3) | PARITY (pin — the surprising row: the icons render 16px, not 20px, on BOTH sides) |
| 5 | the Button class string | the base carries `gap-2`; search/heart/bag carry `relative` (user does not) | no `gap-2` (the standing r52 register); `relative` only on the bag (the badge's anchor) | REGISTER ×2 (the standing gap-2 vintage + the NEW `relative` placement — rendered-identical: no offsets, no positioned children on the reference's search/heart) |
| 6 | the resting computed | bg transparent, color rgb(23,23,28), radius 10px, transition 0.15s, cursor pointer | **IDENTICAL** (all four buttons) | PARITY (pin) |
| 7 | the REAL-mouse hover | bg **rgb(253,243,237)**, color **rgb(138,64,15)** (the accent pair), radius 10px — all four | **IDENTICAL** (all four) | PARITY (pin — the accent pair's first pin at the header) |
| 8 | focus-visible ON the buttons | outline `2px solid transparent` (v3 outline-none) + box-shadow `rgb(255,255,255) 0 0 0 0, rgb(230,107,26) 0 0 0 1px` (ring-1) | outline `none` (v4 outline-none) + box-shadow `3×transparent 0-layers + rgb(230,107,26) 0 0 0 1px` | RENDERED-PARITY (pin the orange 1px ring layer; the invisible-outline + the 2-vs-4-layer-count engine registers — both standing from r52) |
| 9 | focus-visible on the A wrappers | the global rule: outline `auto 1px rgba(230,107,26,0.5)` (logo A, heart A) | the global rule: outline `auto 1px lab(60.0768 45.9585 63.0005 / 0.5)` | PARITY (pin both spellings — the r53 global-rule discovery extends to the header's wrappers) |
| 10 | the tab order | logo A → 5 nav links → search BTN → heart A → heart BTN → bag BTN → user A → user BTN (the nested A>Button double-entry) | **IDENTICAL** (the same double-entry — the Link-wrapped heart/user both focusable) | PARITY (pin) |
| 11 | the aria layer | **NO aria-labels on ANY icon button** (only the menu + search carry `aria-haspopup`) | aria-labels on all four: Search / Wishlist / Cart / Log in (or My account); `aria-expanded` on search (the session-46 toggle) | **SUPERSET** (pin the clone's own contract) |
| 12 | the bag badge | **NEVER PAINTS** — zero spans in the reference's bag button, no counter anywhere in its header (the demo cart) | the real-count badge: `absolute -top-1 -right-2 h-4 min-w-4 px-1 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full flex items-center justify-center` — bg rgb(230,107,26), white 10px/600, 16×16 (min-w 16), radius full, top -4px right -8px, pad 0 4px | **SUPERSET** (pin the clone's own contract) |
| 13 | the badge's hover coexistence | (no badge to coexist) | the bag hover STILL paints the accent pair with the badge present | SUPERSET (pin) |
| 14 | the cart button's aria-label | (none) | `Cart, ${cart.itemCount} items` — measured live: **"Cart, 1 items"** at itemCount 1 | **DIVERGENCE (the honest RED — the pluralization: "1 items" is wrong English; the repo's own convention is `=== 1 ? "product" : "products"` at the shop filters, pinned by shopfilter-states:179)** |

**THE HEADLINE:** the family is the sweep's **FOURTH FULLY-PARITY family** (after buy-panel r52, heronav r53, announcement-bar r54) — every computed value identical on the interaction axis (geometry, resting, the accent-pair hover, focus-visible modulo the two standing engine registers, the tab order incl. the double-entry). The supersets: the aria layer + the count-aware badge. The ONE honest fix lives in the superset layer: the cart aria's pluralization (`Cart, 1 items` → `Cart, 1 item`).

**The probe-honesty notes (four):** (1) **THE TAB-START POISON** — r55d's first attempt clicked `body` at (10,400) before tabbing; the click landed IN THE HERO and the tab sequence started mid-page (the chevron arrows at tabs 2-3) — a click sets focus, and Tab continues from the clicked element's DOM position; park the pointer WITHOUT clicking. (2) **THE STALE-STORE HYDRATION** — r55c/r55e's badge read returned false after a PDP add: the HOME page's client store hydrated BEFORE the add (the badge needs a page reload to re-hydrate) — cross-page client state does not propagate; reload after the mutation. (3) **THE STRICT-MODE ATC** — `getByRole("button", { name: /add to cart/i })` matches MULTIPLE buttons on the PDP (the buy panel + the related-products quick-add): scope with `.first()` (the buy panel precedes related in the DOM). (4) **THE r53 GLOBAL-RULE EXTENSION** — the `* { outline-ring/50 }` global rule paints the A wrappers, but the shadcn BUTTONS' own `focus-visible:outline-none focus-visible:ring-1` utilities win on the buttons themselves — the focus indication is per-element-type (wrappers → global rule; buttons → the ring), measured on BOTH sides.

### 2.3 The registers (documented, no code change — rendered-identical or standing)

1. **The `relative` placement register (NEW):** the reference carries `relative` on its search/heart/bag buttons (the badge-positioning pattern copied across its code); the clone carries it only on the bag (where the positioned child exists). Zero rendered effect (no offsets, no positioned children on the reference's search/heart). REGISTER.
2. **The gap-2 Button-base vintage (standing r52):** the reference's Button base string carries `gap-2`; the clone's does not. Rendered-identical (single-svg children — gap applies only between siblings). REGISTER.
3. **The logo-A trailing space:** the clone's logo A renders `class="flex items-center gap-2 "` (a template-literal trailing space); the reference's has no trailing space. Whitespace-insensitive in rendering. REGISTER (cosmetic).
4. **The invisible-outline engine register (standing r52):** v3 `outline-none` = `outline: 2px solid transparent` (an invisible outline that paints nothing); v4 `outline-none` = `outline-style: none`. Same paint. REGISTER.
5. **The ring layer-count engine register (standing r52):** the reference's ring-1 = 2 box-shadow layers (the white 0-width base + the orange 1px); v4's = 4 (3 transparent 0-width + the orange 1px). Same visible ring. REGISTER.
6. **The lab()/oklab() alpha serialization (standing r48..r54):** the reference serializes ring/50 as `rgba(230,107,26,0.5)`; v4 as `lab(60.0768 45.9585 63.0005 / 0.5)`. Same paint. REGISTER.

### 2.4 The deliverable's shape

1. **THE FIX (`src/components/store/header.tsx`, line 88 — the pluralization):**
   - `aria-label={cart.itemCount > 0 ? `Cart, ${cart.itemCount} items` : "Cart"}` → `aria-label={cart.itemCount > 0 ? `Cart, ${cart.itemCount} ${cart.itemCount === 1 ? "item" : "items"}` : "Cart"}`
   - **The locator alignment (mechanical, intent-preserving):** the 23 `"Cart, 1 items"` locator occurrences across 9 spec files (cart 10, guest-cart 2, guest-checkout 3, checkout-validation 1, checkout 1, paystep-states 1, qty-stepper 1, stock 1, stripe 1) → `"Cart, 1 item"`; the 6 `"Cart, 2 items"` occurrences are UNCHANGED (the plural is already correct). No assertion is deleted; every locator's intent (the badge-bump visibility) is preserved.
2. **`tests/e2e/headericons-states.spec.ts`** — the NEW spec (14 pins, the family's computed + behavioral contract — the honest-RED round form: P11 fails against the current artifact, the fix turns it green):
   - **P1 (the geometry):** the four buttons at 844/884/924/964, each 36×36 at y=42 (1024×768, home) — the cluster arithmetic 4×36 + 3×4 = 156.
   - **P2 (the cluster + row):** `flex items-center gap-1`, 156px wide, gap 4px, 4 children; the row `flex items-center justify-between h-16` (r26 re-pinned in-family).
   - **P3 (the svgs):** the four svg class strings (`lucide lucide-X h-5 w-5`) + the COMPUTED 16px/16px (the size-4-wins contract).
   - **P4 (the resting computed):** bg transparent, color rgb(23,23,28), radius 10px, transition 0.15s color..., cursor pointer — on all four.
   - **P5 (the REAL-mouse hover):** all four buttons → bg rgb(253,243,237), color rgb(138,64,15) (the accent pair).
   - **P6 (focus-visible on a button):** keyboard-focus the search button → outline none + the orange 1px ring layer (`rgb(230, 107, 26) 0px 0px 0px 1px` in the box-shadow).
   - **P7 (focus-visible on the A wrappers):** the logo A / heart A → outline `auto 1px` with the ring/50 color (both spellings: rgba | lab).
   - **P8 (the tab order):** logo A → 5 nav links → search → heart-A → heart-BTN → bag → user (the nested double-entry contract).
   - **P9 (the aria superset):** Search (label + haspopup + expanded), Wishlist, Cart, Log in — the reference carries none (the superset documented in the pin's comment).
   - **P10 (the badge superset anatomy):** with 1 cart item — the class string, bg rgb(230,107,26), color white, 10px/600, h 16, min-w 16, radius > 1000 (full), position absolute, top -4px, right -8px, pad 0 4px, the geometry (span at the bag's top-right corner).
   - **P11 (THE FIX — the aria pluralization):** with 1 item → `Cart, 1 item` (NOT "Cart, 1 items"); with 2 items → `Cart, 2 items`. **The honest RED: the current artifact reads "Cart, 1 items".**
   - **P12 (the hover with the badge):** the bag's accent-pair hover still paints with the badge present.
   - **P13 (the empty-cart negative):** with an empty cart → NO badge span, the aria reads the bare "Cart".
   - **P14 (the mobile contract):** at 390×664 — the cluster at x=218, 156w, the four buttons present at 36×36 (the mobile row's r26 pin extended to the cluster's own geometry).
3. **The engine/vintage registers** recorded in the PAD's divergence register + AGENTS + this plan (§2.3).

## 3. The TDD plan (the honest-RED round convention: calibration → RED pins → fix → GREEN → mutations)

### 3.1 Calibration (done — the reference measured live across six probes)

§2.2's table. Every pin's expected value carries a first-hand measurement on BOTH sides.

### 3.2 The pins, written to the measured truth (the honest RED first)

The 14-pin spec (§2.4). Conventions: the home route `/` at 1024×768; the icon buttons located by their svg (`svg.lucide-search` etc.); REAL mouse for every hover pin (the r53 L60 synthetic-event wall); keyboard Tab for the focus pins (parked pointer, no click — the r55d tab-start lesson); the badge pins add ONE item via the buy panel's ATC (`.first()` — the strict-mode lesson) then RELOAD for the re-hydration (the stale-store lesson); the cart cleaned via the drawer's remove (the cart.spec helper convention — the seeded demo cart must return to empty for the flow specs' absolute counts). **The honest RED:** P11 (the pluralization) FAILS against the current artifact (the aria reads "Cart, 1 items"); the other 13 pass. The fix turns P11 green with ZERO collateral (the 23 locator updates keep the flow specs green in lockstep).

### 3.3 The unit layer — unchanged (353): no pure seam is touched (the family is presentation-only; no schema, no actions, no libs)

### 3.4 The mutation-style efficacy proofs ×8 (each caught at the E2E layer on the REBUILT artifact (the session-36 lesson), then byte-exact revert, md5-verified at every step; use `grep -F` for literal tokens — the r51 M1 lesson; the runner runs ONLY the new spec)

- **M1 (the fix reverted):** the pluralization ternary → the constant `"items"` → **P11 fires** (the singular read breaks).
- **M2 (the badge bg broken):** `bg-primary` → `bg-secondary` on the badge span → **P10 fires**.
- **M3 (the badge position broken):** `-top-1 -right-2` → `top-0 right-0` → **P10 fires** (the geometry pin).
- **M4 (the bag's anchor dropped):** the bag button's `relative` removed → **P10 fires** (the badge escapes to the nearest positioned ancestor).
- **M5 (an aria-label dropped):** the Wishlist label removed → **P9 fires**.
- **M6 (the search's aria-expanded dropped):** → **P9 fires**.
- **M7 (the svg class broken):** the search svg `h-5 w-5` → `h-6 w-6` → **P3 fires** (the class-string pin; the computed stays 16px — the pin's independent value proven).
- **M8 (the cluster gap broken):** `gap-1` → `gap-2` → **P1+P2 fire** (the honest pair — the geometry arithmetic).

### 3.5 The full gate (the regression proof)

lint (0/0) · typecheck · the FULL unit layer (353 — unchanged) · build · **the FULL E2E × 2 consecutive runs on the final code (398 + 14 = 412 chromium tests per run, as four FILE-list invocations under the 600s cap — headericons-states joins the a–c group)**.

## 4. Execution order

1. **Calibration:** the six probes (done, §3.1).
2. **RED:** write the 14-pin spec; run it against the CURRENT artifact — P11 must FAIL (the honest RED), the other 13 green.
3. **FIX:** the header.tsx pluralization edit + the 23-locator alignment sweep; re-run the spec — 15/15 green (14 pins + the setup login).
4. **Mutations ×8** (§3.4 — each caught + byte-exact revert, the artifact rebuilt for every E2E proof).
5. **Full gate:** lint · typecheck · unit · build · the FULL E2E × 2 consecutive runs.

## 5. Post-change battery + screenshots

- The paired pixel sweep re-run (all 8 routes — the fix changes an ARIA STRING only, zero paint; the baseline must hold byte-identically) + **the 70th mobile-nav verification** re-run (token-exact parity must hold).
- **Screenshots 286-290** (probe-first, single invocation, the production standalone on :3001 — a FRESH process, ZERO DB mutations by construction): the icon cluster at rest (the four buttons + the cluster arithmetic); the search button hovered (the accent pair); the search button keyboard-focused (the orange 1px ring); the bag WITH the badge (the superset — the orange 16×16 pill at the corner, the aria's proof in the same capture); the mobile 390px header row (the cluster at x=218). **VLM 5/5 verification** (describe the surface as it IS — the DOM probe is the ground truth; sub-perceptual disputes settle by pixel measurement).

## 6. Docs duty (this round's deliverable + the round's own records)

The PAD **v1.55** (§8.1's headericons-states row + the Total row 55/765/353+412; §8.4's checklist 412/32 files; §3.2's tree 32 specs + the headericons-states entry + 55 plans; the divergence register's six entries (§2.3); the v1.55 revision row; the header's Last-Updated session tag) · SKILL **v1.55.0** (the version; §11's counts reconciled to 353/412; the line-31 session pointer; Appendix C → session55 + **lesson 059** — L68 the tab-start poison (a click sets focus — park, never click, before a tab-walk), L69 the stale-store hydration (cross-page client state does not propagate — reload after the mutation), L70 the strict-mode ATC (scope the PDP's add-to-cart to `.first()`), L71 the per-element-type focus indication (wrappers take the global rule, buttons take the ring)) · AGENTS.md (the headericons bullet + the registers) · CLAUDE.md (the E2E row's family + 412) · README (the 765 row + the header family + the Testing table's 412 + the mobile-nav 69/70 row + the File Hierarchy's 32/412) · the drift-watch verifier's spec-count recalibration 31→32 + re-run GREEN · `docs/session_109.md` (the round narrative) · the worklog S55 entry · this plan's sign-offs · `.env.example` verified current (NO env plumbing).

## Sign-offs (completed at execution)

- [x] Calibration recorded (SIX probes — the four buttons' full contract + the focus layer + the badge superset, both sides)
- [x] The honest RED verified (P11 failed on the pre-fix artifact — the aria read "Cart, 1 items"; the other 13 green, after one authoring fix on P8's 6-char text signatures + the tsc strict-null guards on the four document.activeElement evaluate callbacks)
- [x] The fix applied (the pluralization ternary + the 23-locator alignment across 9 spec files); 15/15 green; the 9 swept flow specs re-verified in a dedicated 64-test collateral run
- [x] Mutations ×8 caught + byte-exact reverts (md5-verified at every step; each on the REBUILT artifact — M1 -> exactly P11 (the fix's own regression); M2 -> exactly P10; M3 -> exactly P10; M4 -> exactly P10 (the badge escapes); M5 -> exactly P9; M6 -> exactly P9; M7 -> exactly P3 (the class-string catch with the computed UNCHANGED at 16px — the pin's independent value); M8 -> P1+P2+P14 (the honest pair + the mobile catch); the final state matches the pristine header 79b05ca1...)
- [x] Full gate × 2 consecutive runs on the final code (353 + 412 × 2 = 765 per run; lint 0/0 · tsc clean · build 0; each run as four FILE-list invocations — headericons-states joined the a-c group at 229+1)
- [x] Post-change battery (the sweep ALL 8 ROUTES AT BASELINE byte-identical — the fix is aria-only, zero paint · the 70th mobile-nav token-exact · watches + census clean · screenshots 286-290 VLM 4/5 direct + 1 zoom-instrument + the pixel settlement (289: the orange pill bbox (88,29)-(102,42) overlaps the bag button's box (60,32)-(96,68) by 9x11px — ON the top-right corner; the VLM anchors on the visible icon glyphs — the ghost button's invisible boundary is below its perceptual floor; the 3x zoom re-verify with the visible-anchored description passed))
- [x] Docs aligned (PAD v1.55 + the six registers; SKILL v1.55.0 + lesson 059 — L68 the tab-start poison, L69 the stale-store hydration, L70 the strict-mode ATC, L71 the per-element-type focus; AGENTS, CLAUDE, README, the verifier recalibration 31→32 — the drift watch ALL FAMILIES GREEN; session_109.md, the worklog S55 entry, this plan's sign-offs); committed to main; pushed via the SSH wrapper
