# Remediation Plan — Session 54 (Round 54): FOOTER-ANN-1 — The Footer's Interaction Family + the Announcement-Bar Static-Parity Closure: The Policy-Span Hover Divergence (the Honest RED) and the Sweep's Third Zero-Divergence Family (the Customer-Surfaces Pin-Density Sweep's Twelfth Installment)

**Date:** 2026-10-13 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `dda6f33` (the session-53 ship `a9360f8` + the user's session_106 narrative log — docs only, zero production code)
**Status at audit start:** 737-test gate per run (353 unit + 384 E2E), PAD v1.53, SKILL v1.53.0 — lint 0/0 · tsc clean · 353/353 unit+integration (22 files) · build exit 0 · the full E2E baseline re-run **all green (384 chromium + the setup logins per four FILE-list invocations: a–c 188 [5.6m] / c–m 41 [2.2m] / n–s 77 [3.7m] / s–z 82 [2.3m] — byte-identical to the documented round-53 ship split)** — ZERO flakes — verified on the PULLED workspace (the environment intact: `.env` contract, the hard-link DB convergence at inode 263859 at both paths, node_modules, the Playwright Chromium cache).

## 0. The round's mandate

The user's standing round instruction (the full audit/parity workflow with the mobile-nav + Tailwind v4 watches; the `.env`/db-root contract — verified: `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root, the hard-link convergence intact at inode 263859; the professional Stripe integration verification — demo mode rests green without keys, the standing credential gates unchanged (NO Stripe test-mode keys or email credentials provided this round); the vitest + playwright suites — both verified with the `skills/` exclusion re-confirmed in all four configs (tsconfig exclude line 41; vitest include allowlist; playwright testDir; eslint ignores); the TDD remediation plan; the screenshots; the `.env.example` — verified current, this round adds NO env plumbing; the docs; and the main-only push via the SSH wrapper). The round's deliverable is audit-derived: session-105's standing "suggested next" — **the sweep's twelfth installment**.

## 1. Baseline verification (state at audit start)

- **Workspace PULLED (not reset):** `git pull` fast-forwarded `a9360f8..dda6f33` (docs/session_106.md only — the user's round-53 narrative log; the recent-changes audit CLEAN, docs only, zero production code). The environment intact: `.env` (`DATABASE_URL="file:../db/custom.db"`), the hard-link DB convergence at inode 263859 at BOTH paths, `node_modules`, the Playwright Chromium cache.
- Baseline gate: lint 0/0 (after ONE drive-by cleanup — the r53 capture script's `el && el.blur()` no-unused-expressions warning, `scripts/capture-heronav-r53.mjs:102`, rewritten as `if (el) el.blur()`; a scripts/ file, zero production surface) · tsc clean · **353/353 unit+integration (22 files)** · build exit 0 · **the full E2E baseline re-run all green** — 384 chromium tests + the setup logins, four FILE-list invocations under the 600s cap (a–c 188 [5.6m] / c–m 41 [2.2m] / n–s 77 [3.7m] / s–z 82 [2.3m] — byte-identical to the documented round-53 ship split; total 384 chromium).
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd** (the honest-RED round convention — calibration → RED pins → fix → GREEN → mutations; this round HAS a production fix, the r51 form), **agent-browser** (the live reference walk — the r54a/b/d probes), **clone-app-pat-pro** (the parity methodology — the DOM probe + the computed style are the ground truth), **code-review-and-audit** (the lenses on the footer + the announcement-bar marquee question).
- **The Round-54 live battery (the audit's parity layer, against the production standalone on :3000 via `scripts/battery-runner.sh prod`):** the paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec` painted both sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0% [9 px], checkout 0.01%, account 0% [9 px], login 0.28% — byte-identical to the documented round-42..53 baselines). **The 67th mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks). The standing watches clean (typeahead: the reference fires ZERO search requests; carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11 admin CLEAN.

## 2. Audit results

### 2.1 The candidate triage (session-105's "suggested next" list)

1. **The announcement bar's "scroll-marquee behavior" (SETTLED BY MEASUREMENT — the marquee does not exist):** the session-105 phrase was SPECULATIVE. The r54a probe (reference, login-gated, the DOM dump + computed styles + a 6s re-query positional poll): the reference's bar is a **STATIC single-text-node strip** — `childCount: 0`, `animation: none`, ZERO marquee/scroll keyframes in the document stylesheets, the 6s poll reads `innerX range [0, 0] — STATIC`, no hover behavior (cursor auto, no play-state change), `white-space: normal`, `overflow: visible`. The class string is **BYTE-IDENTICAL to the clone's** (`bg-primary text-primary-foreground text-center py-1.5 text-xs font-medium tracking-wide`) and every computed value matches (28px tall, 12px/500, letter-spacing 0.3px, py 6/6, bg rgb(230,107,26), color white, text-center). **The family closes as the sweep's THIRD ZERO-DIVERGENCE FAMILY** (after the buy-panel r52 and the heronav r53) — the unpinned resting values fold into this round as anchor pins.
2. **The footer's interaction family (CHOSEN — the round's deliverable):** the sweep's method applied — the family's zones enumerated (`src/components/store/footer.tsx` — the /60 hover token across the 7 Shop links + 5 Company spans; the bottom row's /40 layer + its hover; the 4-col grid; the heading typography; the contact icon rows; the blurb; the hairline; the responsive collapse) + cross-checked against the E2E layer: the footer's INTERACTION states had near-ZERO pins (storefront-parity:92 pins the footer bg/color; :120 the Join button; :129 the hairline rhythm; smoke:239 the contact text; newsletter.spec carries session-43's dedicated round — but the hover contracts, the grid geometry, the heading typography, the bottom-row layer, and the mobile collapse were never measured against the reference NOR pinned).
3. **The account order-detail's deep-remaining corners (RE-DEFERRED, the fourth time):** 27 pins in account.spec + the session-34/45 detail rounds — thinner than the footer family on the interaction axis.
4. **The credential-gated items (UNCHANGED):** Stripe test-mode keys and an email provider — no credentials provided this round.

### 2.2 THE PRIMARY FINDING — the bottom-row policy-span hover divergence (THE honest RED)

The calibration (FOUR probes — `announcement-probe-r54a.mjs` + `footer-probe-r54b.mjs` + `footer-probe-r54d.mjs` (reference, login-gated) + `footer-clone-r54c.mjs` (clone, via the battery runner), live, the DOM dumps + computed styles + REAL-mouse hovers as the ground truth):

| # | Behavior | Reference (measured live) | Clone (measured live) | Verdict |
|---|---|---|---|---|
| 1 | the announcement bar class string | `bg-primary text-primary-foreground text-center py-1.5 text-xs font-medium tracking-wide` | **BYTE-IDENTICAL** | PARITY (pin — the closure) |
| 2 | the announcement bar computed | 28px, 12px/500, ls 0.3px, py 6/6, bg rgb(230,107,26), color white, text-center, 0 children | IDENTICAL (all 10 values) | PARITY (pin) |
| 3 | **the announcement bar marquee** | **DOES NOT EXIST** — `animation: none`, 0 keyframes, 6s poll STATIC, no hover, white-space normal | Same (static) | PARITY (pin the STATIC negative — the session-105 speculation closed) |
| 4 | the footer class string | `bg-foreground text-background` (marginTop 0) | `bg-foreground text-background mt-auto` (marginTop 0 rendered on full pages) | PARITY + REGISTER (the mt-auto sticky-footer superset) |
| 5 | the container | `max-w-7xl mx-auto px-4 sm:px-6 py-16` — maxW 1280, px 24, py 64 | **BYTE-IDENTICAL** | PARITY (pin) |
| 6 | the grid | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10` — 4×278px, gap 40, 4 children | **BYTE-IDENTICAL** (4×278, gap 40) | PARITY (pin) |
| 7 | the headings | `font-semibold text-sm uppercase tracking-wider mb-4` — 14px/600/uppercase/0.7px/mb 16 (×3) | **BYTE-IDENTICAL** | PARITY (pin) |
| 8 | the Shop links' class string | `text-sm text-background/60 hover:text-background transition-colors` — 7 links, 14px, rgba(251,250,249,.6) | **BYTE-IDENTICAL**; `lab(98.3283 … / 0.6)` | PARITY (pin — both spellings; the lab() register) |
| 9 | the Shop links' hrefs | ALL 7 → `/shop` (NO query params) | `/shop` + `?category=…` ×6 | **SUPERSET** (the clone's links filter — the functional upgrade; pin the clone's own contract) |
| 10 | **the Shop-link hover** | REAL mouse: rgba(.6) → **rgb(251,250,249)** (full), 0.15s transition-colors | REAL mouse: lab(/.6) → **rgb(251,250,249)**, 0.15s | **PARITY (pin — both spellings)** |
| 11 | the Company spans | `text-sm text-background/60 hover:text-background transition-colors cursor-pointer` — /60, pointer | **BYTE-IDENTICAL** | PARITY (pin) |
| 12 | **the Company-span hover** | REAL mouse: /60 → full | REAL mouse: lab(/.6) → rgb(251,250,249) | **PARITY (pin — both spellings)** |
| 13 | the bottom-row container | `flex flex-col sm:flex-row justify-between items-center gap-4` — row, between, center, gap 16 | **BYTE-IDENTICAL** | PARITY (pin) |
| 14 | the copyright | `p.text-xs text-background/40` — 12px, /40 | **BYTE-IDENTICAL** (class + computed) | PARITY (pin) |
| 15 | **the policy spans' CLASS PLACEMENT** | each span: `text-xs text-background/40 hover:text-background/60 cursor-pointer transition-colors`; the parent just `flex gap-6` | the parent carries `flex gap-6 text-xs text-background/40`; each span just `hover:text-background transition-colors cursor-pointer` | **DIVERGENCE (the structural half of the fix — rendered-equivalent at REST, divergent on HOVER)** |
| 16 | **the policy spans' hover** | REAL mouse: rgba(251,250,249,**0.4**) → rgba(251,250,249,**0.6**) — **the /60 target** | REAL mouse: lab(/0.4) → **rgb(251,250,249)** (FULL) — **the wrong target** | **DIVERGENCE (THE honest RED — the functional half of the fix)** |
| 17 | the contact block | `flex flex-col gap-2 text-sm text-background/60` — gap 8, icons 16×16, stroke /60 | **BYTE-IDENTICAL** | PARITY (pin) |
| 18 | the blurb | `text-sm text-background/60 leading-relaxed mb-6` — 14px, lh 22.75px, mb 24 | **BYTE-IDENTICAL** | PARITY (pin) |
| 19 | the hairline | `shrink-0 h-[1px] w-full my-10 bg-background/10` — 1px, /10, my 40/40 | **BYTE-IDENTICAL** (pinned r4; re-verified) | PARITY (re-pin in-family) |
| 20 | the mobile collapse (390px) | grid 1×358px, gap 40; bottom row column, gap 16 | IDENTICAL | PARITY (pin — the responsive contract) |

**THE HEADLINE:** the footer family is NEAR-parity — **18 of 20 rows byte-identical or rendered-identical** — with ONE real divergence (rows 15+16: the policy spans' class placement + hover target) and TWO deliberate supersets (row 9: the category-filter hrefs; row 4: the mt-auto sticky footer). The announcement-bar question CLOSES as the sweep's third zero-divergence family: the session-105 "scroll-marquee" was speculation, and the measurement settles it — static both sides, byte-identical classes, every computed value equal.

**The probe-honesty notes (two):** (1) **The regex-hole in the first bottom-row read** — r54b's policy-span census filtered `/policy/i`, which MISSED "Terms of Service" (the reference's bottom row read `policyCount: 2`); the r54d structure probe re-read the full child inventory and found all 3 spans — never filter a census by a content regex that the content itself can violate; enumerate the children instead. (2) **The inherited-token trap** — the clone's bottom row renders /40 12px at REST through INHERITANCE (the parent's tokens), so the resting pixel sweep AND a naive resting computed read both see parity; the divergence lives only in the HOVER state, where the reference's per-span `hover:text-background/60` meets the clone's per-span `hover:text-background` (full). The resting sweep cannot see it; only the interaction-gated computed read does — the same structural finding as rounds 47–53.

### 2.3 The registers (documented, no code change — rendered-identical or deliberate superset)

1. **The category-link superset:** the reference's 7 Shop links ALL point to plain `/shop`; the clone's carry `?category=electronics` etc. — the clone's links actually filter (the functional upgrade from the port). REGISTER (superset; pin the clone's own href contract).
2. **The mt-auto sticky-footer superset:** the clone's footer carries `mt-auto` (the sticky-footer pattern — short pages keep the footer at the viewport bottom); the reference's footer computes marginTop 0. Rendered-identical on full-height pages. REGISTER (superset).
3. **The lab()/oklab() alpha serialization (the r48..r53 standing register):** the reference serializes /60, /40 as `rgba(251,250,249,α)`; v4 serializes as `lab(98.3283 0.212789 0.603545 / α)`. Same paint. REGISTER.
4. **The v4 transition-colors property list (the r52/r53 standing register):** v4's list is longer (+ outline-color, --tw-gradient-from/via/to). Same 0.15s cubic-bezier(0.4,0,0.2,1). REGISTER.
5. **The reference's global `transition: all` curiosity:** the reference's LUXE span reads `transition: 0s all` (a global rule the reference carries; a 0s no-op). The clone's span carries none. REGISTER (no-op).
6. **The space-y-3 serialization:** both sides read `rowGap: normal` on the ul (the space-y utility emits margin-block on the LIs, not row-gap) with `display: block` — the 12px rhythm asserts via the LI margins or the rendered geometry, not row-gap. REGISTER (assert structurally).

### 2.4 The deliverable's shape

1. **THE FIX (`src/components/store/footer.tsx`, the bottom row):** move the tokens onto each policy span + the /60 hover target, matching the reference's structure byte-for-byte:
   - The parent: `flex gap-6 text-xs text-background/40` → `flex gap-6`
   - Each span: `hover:text-background transition-colors cursor-pointer` → `text-xs text-background/40 hover:text-background/60 cursor-pointer transition-colors`
   - The resting paint is UNCHANGED (the computed /40 12px moves from inheritance to the span's own tokens — the sweep must hold byte-identically); the hover target changes /40→FULL ⇒ /40→**/60**.
2. **`tests/e2e/footer-states.spec.ts`** — the NEW spec (14 pins, the family's computed + behavioral contract — the honest-RED round form: P10 + P11 fail against the current artifact, the fix turns them green):
   - **P1 (the announcement bar — the closure):** the full resting contract — the class string, bg/color, 12px/500, ls 0.3px, py 6/6, height 28, text-center, the exact copy.
   - **P2 (the announcement bar — the STATIC negative):** 0 element children, `animation-name: none`, no scroll (the anti-marquee pin — the session-105 speculation closed permanently).
   - **P3 (the footer structural anatomy):** bg rgb(23,23,28), color rgb(251,250,249), the container maxW 1280/py 64/px 24, the grid 4 columns × 278px, gap 40, 4 children.
   - **P4 (the heading typography):** 3 h3s, the class string, 14px/600/uppercase/ls 0.7px/mb 16.
   - **P5 (the Shop links — resting):** 7 links, the class string, 14px, /60 (both spellings), no underline.
   - **P6 (the Shop-link hover):** REAL mouse → full rgb(251,250,249), the 0.15s duration.
   - **P7 (the Company spans):** 5 spans, the class string, /60, cursor pointer, 14px.
   - **P8 (the Company-span hover):** REAL mouse → full.
   - **P9 (the bottom row + copyright):** the row class string (flex-col sm:flex-row between center gap-4), the copyright `text-xs text-background/40`.
   - **P10 (the policy spans — resting, THE FIX'S STRUCTURAL PIN):** 3 spans, each carrying `text-xs text-background/40 hover:text-background/60 cursor-pointer transition-colors`, computed /40 (both spellings), 12px, cursor pointer.
   - **P11 (the policy hover — THE FIX'S BEHAVIORAL PIN):** REAL mouse → **/60** (both spellings — `rgba(251, 250, 249, 0.6)` | `lab(98.3283 0.212789 0.603545 / 0.6)`), NOT full.
   - **P12 (the contact block):** the class string, flex-col gap 8, the 16×16 icons, /60 text + stroke.
   - **P13 (the blurb + hairline):** the blurb 14px/lh 22.75/mb 24/60; the hairline 1px /10 my 40/40.
   - **P14 (the mobile responsive contract):** at 390px — the grid 1 column, the bottom row column-direction gap 16; PLUS the category-href superset (the clone's 7 hrefs incl. the `?category=` filters — the clone's own contract, the reference's are plain /shop).
3. **The engine/vintage registers** recorded in the PAD's divergence register + AGENTS + this plan.

## 3. The TDD plan (the honest-RED round convention: calibration → RED pins → fix → GREEN → mutations)

### 3.1 Calibration (done — the reference measured live across four probes)

§2.2's table. Every pin's expected value carries a first-hand measurement on BOTH sides.

### 3.2 The pins, written to the measured truth (the honest RED first)

The 14-pin spec (§2.4). Conventions: the home route `/`; the footer located by `getByRole("contentinfo")`; the spans located by their exact texts (Privacy Policy / Terms of Service / Cookie Policy — the honest locators); REAL mouse for every hover pin (the r53 L60 synthetic-event wall); both-spelling regexes for alpha colors (the lab() register); hover reads taken after a 400ms settle (past the 0.15s transition); the announcement bar located as the header's first child (the storefront-parity:22 convention). **The honest RED:** P10 (the per-span class placement) + P11 (the /60 hover target) FAIL against the current artifact; the other 12 pass. The fix turns P10+P11 green with ZERO collateral.

### 3.3 The unit layer — unchanged (353): no pure seam is touched (the family is presentation-only; no schema, no actions, no libs)

### 3.4 The mutation-style efficacy proofs ×8 (each caught at the E2E layer on the REBUILT artifact (the session-36 lesson), then byte-exact revert, md5-verified at every step; use `grep -F` for literal tokens — the r51 M1 lesson)

- **M1 (the fix reverted — the hover target):** the span `hover:text-background/60` → `hover:text-background` → **P11 fires** (the full-rgb catch — the fix's own regression pin).
- **M2 (the fix reverted — the placement):** the span tokens dropped (the parent-carried form restored on ONE span: `text-xs text-background/40` removed) → **P10 fires**.
- **M3 (the Shop-link hover broken):** `hover:text-background` removed from the Shop link → **P6 fires**.
- **M4 (the Shop-link resting broken):** `text-background/60` → `text-background/50` → **P5 fires**.
- **M5 (the heading typography broken):** `tracking-wider` removed → **P4 fires**.
- **M6 (the grid broken):** `lg:grid-cols-4` → `lg:grid-cols-3` → **P3 fires**.
- **M7 (the announcement bar broken):** `py-1.5` → `py-1` → **P1 fires** (26px ≠ 28px).
- **M8 (the cursor affordance dropped — the behavioral-ish mutation):** `cursor-pointer` removed from the policy span → **P10 fires** (the affordance catch).

### 3.5 The full gate (the regression proof)

lint (0/0) · typecheck · the FULL unit layer (353 — unchanged) · build · **the FULL E2E × 2 consecutive runs on the final code (384 + 14 = 398 chromium tests per run, as four FILE-list invocations under the 600s cap — footer-states joins the a–c group)**.

## 4. Execution order

1. **Calibration:** the four probes (done, §3.1).
2. **RED:** write the 14-pin spec; run it against the CURRENT artifact — P10 + P11 must FAIL (the honest RED), the other 12 green.
3. **FIX:** the footer.tsx bottom-row edit (§2.4.1); re-run the spec — 15/15 green (14 pins + the setup login).
4. **Mutations ×8** (§3.4 — each caught + byte-exact revert, the artifact rebuilt for every E2E proof).
5. **Full gate:** lint · typecheck · unit · build · the FULL E2E × 2 consecutive runs.

## 5. Post-change battery + screenshots

- The paired pixel sweep re-run (all 8 routes — the fix changes the HOVER paint only; the resting computed moves from inheritance to the span's own tokens with the SAME values; the baseline must hold byte-identically) + **the 68th mobile-nav verification** re-run (token-exact parity must hold).
- **Screenshots 281-285** (probe-first, single invocation, the production standalone on :3001 — a FRESH process, ZERO DB mutations by construction): the footer at rest (the full 4-col block); the Shop link hovered (the /60 → full tint); the policy span hovered (THE FIX'S PROOF — the /60 target, visibly softer than full); the announcement bar (the closure's anchor capture); the mobile footer (390px — the 1-col collapse + the bottom-row column). **VLM 5/5 verification** (describe the surface as it IS — the DOM probe is the ground truth; never guess content — the r51/r52/r53 discipline; sub-perceptual disputes settle by pixel measurement).

## 6. Docs duty (this round's deliverable + the round's own records)

The PAD **v1.54** (§8.1's footer-states row + the Total row 54/751/353+398; §8.4's checklist 398; §3.2's tree 31 specs + the footer-states entry + 54 plans; the divergence register's six entries (§2.3); the v1.54 revision row; the header's Last-Updated session tag) · SKILL **v1.54.0** (the version; §11's counts reconciled to 353/398; the line-31 session pointer; Appendix C → session54 + **lesson 058** — L64 the regex-hole census (enumerate children, never content-filter), L65 the inherited-token trap (the resting read sees parity; the divergence lives in the hover), L66 the speculative-behavior closure (measure before planning a behavior round)) · AGENTS.md (the footer bullet + the registers + the closure note) · CLAUDE.md (the E2E row's family + 398) · README (the 751 row + the Testing table + the mobile-nav 67/68 row + the File Hierarchy's 31/398) · the drift-watch verifier's spec-count recalibration 30→31 + re-run GREEN · `docs/session_107.md` (the round narrative) · the worklog S54 entry · this plan's sign-offs · `.env.example` verified current (NO env plumbing).

## Sign-offs (completed at execution)

- [x] Calibration recorded (FOUR probes — the announcement bar's static closure + the footer's full interaction contract, both sides)
- [x] The honest RED verified (P10 + P11 failed on the pre-fix artifact — P11 read the full rgb(251,250,249); the other 12 green)
- [x] The fix applied (the bottom-row span placement + the /60 hover target); 15/15 green
- [x] Mutations ×8 caught + byte-exact reverts (md5-verified at every step; each on the REBUILT artifact — M1 -> P10+P11 (the honest pair), M2 -> exactly P10, M3 -> P5+P6, M4 -> P5+P6, M5 -> exactly P4, M6 -> exactly P3, M7 -> P1+P14 (the honest pair — the mobile height check), M8 -> exactly P10; the final state matches the pristine md5s footer ca8c5c98... + announcement-bar 95083947...)
- [x] Full gate × 2 consecutive runs on the final code (353 + 398 × 2 = 751 per run; lint 0/0 · tsc clean · build 0; each run as four FILE-list invocations — footer-states joined the a-c group at 202)
- [x] Post-change battery (the sweep ALL 8 ROUTES AT BASELINE byte-identical — the fix is hover-only, the resting computed moved from inheritance to the span's own tokens with the SAME values · the 68th mobile-nav token-exact · watches + census clean · screenshots 281-285 VLM 3/5 direct + 1 recaptured-corrected (283: the copyright named outside the first crop; the full-row recapture + the corrected description passed) + 1 zoom-instrument (282: disputed twice at the full crop, the pixels measured the glyph cores p95 234 vs 150 — the hover WAS rendered — and the 3x-enlarged crop from the EXISTING capture passed; the 283 recapture's pixel settlement measured the /60 target at p95 142 = 0.6 x 250 vs the resting 100 = 0.4 x 250)
- [x] Docs aligned (PAD v1.54 + the six registers; SKILL v1.54.0 + lesson 058 — L64 the regex-hole census, L65 the inherited-token trap, L66 the speculative-behavior closure, L67 the VLM 14px-glyph zoom; AGENTS, CLAUDE, README, the verifier recalibration 30->31 — the drift watch ALL FAMILIES GREEN; session_107.md, the worklog S54 entry, this plan's sign-offs); committed to main; pushed via the SSH wrapper
