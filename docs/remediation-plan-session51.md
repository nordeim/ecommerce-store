# Remediation Plan — Session 51 (Round 51): CARD-HOVER-1 — The Product Card's Hover Family: The Backdrop-Blur v4 Trap Fix + the Full Hover-Contract Pin Family (the Customer-Surfaces Pin-Density Sweep's Ninth Installment)

**Date:** 2026-10-12 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `554e7b8` (the session-50 ship `eff4371` + the user's session_100 narrative log)
**Status at audit start:** 698-test gate per run (353 unit + 345 E2E), PAD v1.50, SKILL v1.50.0 — lint 0/0 · tsc clean · 353/353 unit+integration (22 files) · build exit 0 · the full E2E baseline re-run **349/349 per invocation (345 chromium + the setup login; four FILE-list invocations: a–c 149 [3.9m], c–m 41 [2.2m], n–s 77 [3.7m], s–z 82 [2.3m — one honest flake, wishlist:86, re-run clean])** verified pre-change.

## 0. The round's mandate

The user's standing round instruction (the full audit/parity workflow with the mobile-nav + Tailwind v4 watches; the `.env`/db-root contract — verified: `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root, the hard-link convergence intact at inode 397471 at both paths — a PULL round: `git pull` fast-forwarded `eff4371..554e7b8` (docs/session_100.md only — the user's narrative log, docs only, ZERO production code; the recent-changes audit CLEAN); the professional Stripe integration verification — demo mode rests green without keys, the standing credential gates unchanged (NO Stripe test-mode keys or email credentials provided this round); the vitest + playwright suites — both verified with the `skills/` exclusion re-confirmed in all four configs; the TDD remediation plan; the screenshots; the `.env.example` — verified current, this round adds NO env plumbing; the docs; and the main-only push via the SSH wrapper). The round's deliverable is audit-derived: session-99/100's standing "suggested next" — **the product-card hover family** (the sweep's ninth installment).

## 1. Baseline verification (state at audit start)

- **Workspace intact (PULL, not reset):** `git pull` fast-forward `eff4371..554e7b8` (docs/session_100.md — the user's session-100 narrative log, no code); node_modules present; `.env` verified; `db/custom.db` at the repo root with the hard-link convergence intact (inode 397471 at BOTH paths); Playwright Chromium cache present; `bun run build` fresh.
- Baseline gate: lint 0/0 · tsc clean · **353/353 unit+integration (22 files)** · build exit 0 · **the full E2E baseline re-run all green** (349 per invocation — 345 chromium + the setup login, four FILE-list invocations under the 600s cap) — the documented session-99/100 ship state verified pre-change, with ONE honest flake observed and diagnosed: `wishlist.spec.ts:86` ("persists across reloads") failed in the s–z invocation, passed isolated AND in the clean group re-run — a click→reload in-flight-fetch race (the click resolves at dispatch; the server write lands later; the reload beat the write). Scheduled as the round's test-authoring fix (§2.4).
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd** (the gate-round convention: calibration → the honest RED → pins → mutation-style efficacy proofs), **agent-browser** (the live reference walk — the r51/b/d probes), **clone-app-pat-pro** (the parity methodology — the DOM probe + the computed style are the ground truth; the VLM descriptions cross-check), **code-review-and-audit** (the lenses on the card's code).
- **The Round-51 live battery (the audit's parity layer, against the production standalone on :3000 via `scripts/battery-runner.sh prod`):** the paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec` painted both sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0% [9 px], checkout 0.01%, account 0% [9 px], login 0.28% — byte-identical to the documented round-42..50 baselines). **The 61st mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks). The standing watches clean (typeahead: the reference fires ZERO search requests; carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11 admin CLEAN.

## 2. Audit results

### 2.1 The candidate triage (session-99/100's "suggested next" list)

1. **The product-card hover family (CHOSEN — the round's deliverable, below):** session-99/100's standing first suggestion — the sweep's ninth installment. The sweep's method applied: the card's hover-reachable states enumerated (`src/components/store/product-card.tsx` — the group container's shadow lift, the image zoom, the title color, the slide-up Add bar's hidden/revealed anatomy, the heart button's resting/hover states, the badge stack, the info block) and cross-checked against the E2E layer: the interaction states had near-ZERO pins (HOVER-GATE-1 at storefront-parity:405 pins the media-gate trap's two states under touch emulation only; wishlist.spec:29 pins the heart's color states; cart.spec:83 pins the slide-up click flow — but the shadow lift's computed layers, the zoom's transform/transition, the title's hovered color + duration, the addbar's hidden/revealed transforms + the button's full anatomy, the heart's blur/hover-bg/backdrop, the badges' computed anatomy, and the header/hero blur sites were never measured against the reference NOR pinned). The recent-changes audit: CLEAN (docs only).
2. **The shop empty-state's interaction corners (RE-DEFERRED):** carries a session-3 pin already (search.spec:101 — the copy, the h3 18px, the icon circle, the Clear action); thinner than the hover family.
3. **The account order-detail's remaining surfaces (RE-DEFERRED):** carries a dedicated round (session-34's CUSTOMER-ORDER-DETAIL-1 + session-35's timeline + session-37/38's delivery windows — five pins in account.spec).
4. **The credential-gated items (UNCHANGED):** Stripe test-mode keys and an email provider — no credentials provided this round.

### 2.2 THE PRIMARY FINDING — the product card's hover family: ONE measured production divergence (the v4 backdrop-blur scale shift) + the engine-spelling registers + the parity confirmations (CARD-HOVER-1)

The surfaces: the card's seven hover-reachable zones. **The hover states are INTERACTION-GATED** — the pixel sweep captures /shop at rest (no hover, no shadow-xl, no zoom, no revealed bar) — so the v4 blur-scale shift on the heart survived 50 green rounds unseen (the same structural finding as rounds 47–50: the resting sweep cannot reach interaction-gated states; the heart's blur is ALSO resting-visible but its 4px-vs-8px difference falls largely under the sweep's 12-per-channel tolerance on photographic content — the /shop band never moved).

**The calibration (FIVE probes — `scripts/cardhover-probe-r51.mjs` + `cardhover-probe-r51b.mjs` + `cardhover-probe-r51d.mjs` (reference, login-gated) + `cardhover-clone-r51c.mjs` + `cardhover-clone-r51e.mjs` (clone side, via the battery runner), live, the DOM dumps + computed styles as the ground truth; plus `pix-diff-r51.mjs`, a browser-canvas pixel differ):**

| # | Behavior | Reference (measured live) | Clone (pre-fix) | Verdict |
|---|---|---|---|---|
| 1 | **the heart's backdrop blur** | **blur(4px)** (v3's `backdrop-blur-sm`; class string `backdrop-blur-sm` byte-exact both sides) | **blur(8px)** (v4 renamed the scale: sm 4→8, added xs=4) | **DIVERGENCE → Fix #1** |
| 2 | the header's backdrop blur | blur(24px) (`backdrop-blur-xl`) | blur(24px) — xl unchanged in v4 | PARITY (pin) |
| 3 | the hero badge + arrows' blur | blur(12px) (`backdrop-blur-md`) | blur(12px) — md unchanged in v4 | PARITY (pin) |
| 4 | the container's resting shadow | `rgba(0,0,0,0.05) 0px 1px 2px 0px` (shadow-sm) | **IDENTICAL** (the globals.css v3 shadow-scale pin, trap #5) | PARITY ✓ (already pinned by the sweep) |
| 5 | **the container's hovered shadow (the lift)** | `rgba(0,0,0,0.1) 0px 20px 25px -5px, rgba(0,0,0,0.1) 0px 8px 10px -6px` (shadow-xl) | the SAME visible pair, prefixed by two zero-layers (`rgba(0,0,0,0) 0px 0px 0px 0px` ×2 — v4's ring/inset vars serialized as zeros) | PARITY (pin — the visible pair; the zero-layers register) |
| 6 | the container's radius/border/bg | 16px · 1px solid rgba(233,230,226,0.5) · rgb(255,255,255) | **IDENTICAL** | PARITY (pin) |
| 7 | the container's transition | all 0.3s cubic-bezier(0.4,0,0.2,1) | **IDENTICAL** | PARITY (pin) |
| 8 | the image zoom | hovered `transform: matrix(1.05,…)` (v3), 0.5s | hovered `scale: 1.05` (v4's property split), 0.5s — the HOVER-GATE-1 register | PARITY (pin — the v4 spelling) |
| 9 | the title color | resting rgb(23,23,28) → hovered rgb(230,107,26), 0.15s | **IDENTICAL** | PARITY (pin) |
| 10 | **the addbar hidden/revealed** | hidden `matrix(1,0,0,1,0,56)` (translateY 100% = 56px) → revealed identity, 0.3s | hidden `translate: 0px 100%` → revealed `translate: 0px` (v4's property split), 0.3s — the SAME visual offset (56px = 100% of the 56px wrap) | PARITY (pin — the v4 spelling) |
| 11 | the addbar wrap's classes | `absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300` | **BYTE-IDENTICAL** | PARITY (pin) |
| 12 | the Add button's anatomy | h32 · w200 · 12px/500 · radius 12px · bg rgb(230,107,26) · white · gap 8px · svg 16px · shadow-lg's visible pair · hover bg-primary/90 | **IDENTICAL** (the class set equal; the `gap-2` position differs — order-only, computed-identical; the svg 14px class overridden by `[&_svg]:size-4` → 16px both sides) | PARITY (pin) |
| 13 | the heart's resting anatomy | 36×36 · radius full · bg alpha 0.8 · shadow-sm · svg rgb(111,111,123) 16px fill none | **IDENTICAL** (bg serialized lab() by v4 — the engine register) | PARITY (pin) |
| 14 | the heart's hover | bg 100% rgb(251,250,249) (from /80) | **IDENTICAL** | PARITY (pin) |
| 15 | the badges | Best Seller: primary/white 10px/600, padding 2px 10px, h21; -25%: destructive rgb(239,67,67) / foreground **rgb(250,250,250)** | **IDENTICAL** (radius full: v4 serializes 33554432px vs v3's 9999px — the engine register; both render a perfect circle) | PARITY (pin) |
| 16 | the info block | category muted 12px · h3 14px/600 clamp 2 · price 16px/700 · compareAt line-through muted | **IDENTICAL** | PARITY (pin) |
| 17 | **the hovered card's pixels (cross-side)** | ref-hovered vs clone-hovered element captures (same-size 224×376, browser-canvas diff, 12/channel tolerance): **0.129%** (109/84,298; the resting pair 0.109% — the hover adds ~17px: the heart's 4-vs-8 blur zone + the zoom's AA) | — | PARITY (the r48 canvas-pipeline lesson) — re-diff after Fix #1 |

**The probe-honesty notes (three):** (1) **the wrong-ancestor lesson** — r51a's first pass selected the link's `ancestor::div[3]` (the GRID, not the card): the grid's center falls between cards, so no group-hover fired and every "hovered" read returned the resting value; the card is `ancestor::div[1]` (div.group) — the structural dump (the pruned outerHTML) settled the selector, and r51b re-measured everything. (2) **The PNG decoder** — playwright's bundled `PNG.sync.read` rejects some element screenshots ("unrecognised content at end of stream"); the pixel diffs run in a real browser canvas instead (`pix-diff-r51.mjs` — the browser decodes its own PNGs; the r48 lesson mechanized). (3) **The NaN read** — `Math.round(getComputedStyle(el).width)` on a "36px" string is NaN; use `cs.width` directly (the string) or parseFloat — the heart's size parity rests on the byte-exact `h-9 w-9` class anyway.

### 2.3 The deliverable's shape

1. **Fix #1 (the parity divergence — the v4 blur-scale trap, globals.css form):** the `@theme` block gains the v3 blur pin — `--blur-sm: 4px;` (the exact form of the existing `--shadow-sm` pin, trap #5): v4 renamed the blur scale (sm 4→8, xs=4 added); the pin keeps every byte-identical `backdrop-blur-sm`/`blur-sm` class rendering v3's 4px. ONE line + the trap-log comment (Trap 8) + the validation report's appendix entry. NO component changes — the class strings stay byte-exact to the reference on BOTH sides (the strongest parity form: same string, same computed value). The census: exactly ONE `*-blur-sm` site exists today (the card heart, product-card.tsx:60); md (12px) and xl (24px) are unchanged in v4 and verified byte-identical live — no other site is affected.
2. **Fix #2 (test-authoring, no production code):** `tests/e2e/wishlist.spec.ts:86` — the click→reload race: insert the aria-flip wait (`await page.getByRole("button", { name: /Remove Silk Pajama Set from wishlist/ }).waitFor()`) between the ADD click and the reload — the store's `toggleWishlist` awaits the server action before flipping the label, so the flipped label proves the DB write landed. The baseline's honest flake, made deterministic.
3. **`tests/e2e/cardhover-states.spec.ts`** — the NEW spec (12 pins, the family's hover contract):
   - **P1 (parity — THE HONEST RED for Fix #1):** the heart's computed `backdrop-filter` === "blur(4px)" (on /shop, the card heart).
   - **P2 (parity):** the container's hovered shadow — the visible shadow-xl pair (`rgba(0, 0, 0, 0.1) 0px 20px 25px -5px` + `rgba(0, 0, 0, 0.1) 0px 8px 10px -6px`) as a substring of the computed box-shadow, + borderRadius 16px.
   - **P3 (parity):** the container's resting contract — the shadow-sm layer substring, border `1px solid rgba(233, 230, 226, 0.5)`, bg `rgb(255, 255, 255)`, transition `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`.
   - **P4 (parity):** the image — resting transform "none" + transition 0.5s → hovered scale "1.05" (the v4 spelling; the v3 spelling is matrix — the register).
   - **P5 (parity):** the title — resting color rgb(23,23,28) → hovered rgb(230,107,26), transition-duration 0.15s.
   - **P6 (parity):** the addbar — hidden `translate: 0px 100%` (v4's spelling of v3's translateY(56px)) → hovered `translate: 0px`, transition 0.3s (the transform family).
   - **P7 (parity):** the Add button — h32/w200, font 12px/500, radius 12px, bg rgb(230,107,26), color white, gap 8px, svg 16px, the shadow-lg visible pair, hover bg alpha 0.9 (rgba(230,107,26,0.9) or the lab()-equivalent — the engine register: assert the alpha channel via canvas or accept both spellings by asserting `backgroundColor` ≠ the resting rgb string).
   - **P8 (parity):** the heart — 36×36 (`36px` strings), radius full (any spelling ≥ 9999px), resting bg alpha 0.8, shadow-sm layer, svg rgb(111,111,123) 16px fill none → hovered bg `rgb(251, 250, 249)`.
   - **P9 (parity):** the badges — the Best Seller (bg rgb(230,107,26), color white, 10px/600, padding 2px 10px, h21) + the -25% (bg rgb(239,67,67), color rgb(250,250,250)) — both radius full.
   - **P10 (parity):** the info block — category rgb(111,111,123) 12px; h3 14px/600, -webkit-line-clamp 2; price 16px/700 rgb(23,23,28); compareAt line-through rgb(111,111,123).
   - **P11 (parity — the OTHER v4 blur sites):** the header's backdrop-filter blur(24px) + the hero badge's blur(12px) (the / route) — the blur-scale register (xl/md unchanged in v4; the pin guards the whole scale).
   - **P12 (parity — the state machine):** the reveal/hide round-trip — hover → the bar revealed (translate 0px) → mouse away → re-hidden (translate 0px 100%) — both reads settled (the r50 animation lesson).
4. **The engine-spelling register (docs, no code):** v4's extra zero shadow layers; lab()/oklab() color serialization vs v3's rgba/rgb; rounded-full 33554432px vs 9999px; the transform-vs-translate/scale property split; the Add button's `gap-2` class-order. All computed-identical or visually identical; all recorded in the PAD's divergence register + this plan.
5. **NO other production code changes.** The two fixes are the round's only diffs (one globals.css line + one test-authoring wait; zero component changes, zero server changes).

## 3. The TDD plan (the gate-round convention: calibration → RED-first for the fix → pins → mutations)

### 3.1 Calibration (done — the reference measured live across five probes + the pixel differ)

§2.2's table. The one divergence (#1 — the heart's blur) carries a first-hand byte-exact measurement on BOTH sides (the class string identical, the computed value 4px-vs-8px); the parity confirmations (#2–#16) each carry the reference's computed styles; the pixel cross-diff (#17) carries the canvas-pipeline verdict.

### 3.2 The honest RED (the fix, TDD-first)

Write P1 FIRST → run against the CURRENT artifact → it FAILS (blur(8px)) → apply Fix #1 (the globals.css pin) → re-run → GREEN (blur(4px)). The round's red→green proof — the failing pin written before the fix, exactly as the CLAUDE.md TDD rule demands for behavior changes.

### 3.3 The pins, written to the measured truth

The 12-pin spec (§2.3). P2–P12 document existing/superset behavior (the gate-round form). The spec's conventions: `page.goto("/shop")` + the first-card locator `a[href^="/product/"] >> xpath=ancestor::div[1]`; computed-style assertions via `evaluate` (the clone-app-pat-pro methodology); hover settles ≥ 700ms (the r48/r50 mid-transition lesson — the transitions here are 150/300/500ms); the substring form for shadow pairs (the zero-layers register); the / route for P11 (the header + hero).

### 3.4 The mutation-style efficacy proofs ×6 (each caught at the E2E layer on the REBUILT artifact — the session-36 lesson, then byte-exact revert, md5-verified at every step; verify each mutation's diff before building — the r50 stale-write lesson)

- **M1 (Fix #1 reverted):** the `--blur-sm` pin removed from globals.css → the heart returns to 8px → **P1 fires**.
- **M2 (the lift broken):** the card's `hover:shadow-xl` → `hover:shadow-lg` (product-card.tsx) → **P2 fires** (the visible pair becomes 10px 15px).
- **M3 (the zoom broken):** `group-hover:scale-105` → `group-hover:scale-110` → **P4 fires** (scale 1.1).
- **M4 (the hidden state broken):** the wrap's `translate-y-full` → `translate-y-0` → **P6 fires** (hidden reads 0px, not 0px 100%).
- **M5 (the button hover broken):** the Add button's `hover:bg-primary/90` removed → **P7 fires** (hovered bg alpha 1.0).
- **M6 (the title hover broken):** the h3's `group-hover:text-primary` removed → **P5 fires** (hovered color stays foreground).

### 3.5 The full gate (the regression proof)

lint (0/0) · typecheck · the FULL unit layer (353 — unchanged) · build · **the FULL E2E × 2 consecutive runs on the final code (345 + 12 = 357 chromium tests per run, as four FILE-list invocations under the 600s cap — cardhover-states joins the a–c group)**.

## 4. Execution order

1. **Calibration:** the five probes + the pixel differ (done, §3.1).
2. **RED:** write P1 → run against the current artifact → the honest RED (blur(8px)).
3. **FIX:** Fix #1 (the globals.css blur pin) → P1 GREEN (the red→green cycle); Fix #2 (the wishlist settle).
4. **PINS:** write the full 12-pin spec; run it; the unit layer re-run (353 — unchanged).
5. **Mutations ×6** (§3.4 — each caught + byte-exact revert, the artifact rebuilt for every E2E proof).
6. **Full gate:** lint · typecheck · unit · build · the FULL E2E × 2 consecutive runs.

## 5. Post-change battery + screenshots

- The paired pixel sweep re-run (all 8 routes — the fix is a resting-visible micro-change on ONE 36×36 zone: the /shop band must stay at baseline; the heart zone's blur now matches the reference's 4px, so the diff can only improve) + **the 62nd mobile-nav verification** re-run (token-exact parity must hold).
- **The hovered-card pixel re-diff** (ref-hovered vs clone-hovered, the browser canvas): the before 0.129% → the after (expected ≤ 0.11% — the heart zone's contribution gone).
- **Screenshots 266-270** (probe-first, single invocation, the production standalone on :3001 — a FRESH process, zero DB mutations — hover states are CSS-only): the hovered card (the shadow lift + the zoom + the revealed bar + the orange title — the full contract in one frame); the resting card (the shadow-sm baseline); the heart button at rest + hovered (the bg shift — the blur fix's surface); the hero badge + arrows (the md blur sites); the sticky header over scrolled content (the xl blur site). **VLM 5/5 verification** (describe the surface as it IS — the DOM probe is the ground truth).

## 6. Docs duty (this round's deliverable + the round's own records)

The PAD **v1.51** (§8.1's cardhover-states row + the Total row 51/710/353+357; §8.4's checklist 357; §3.2's tree 28 specs + the cardhover-states entry; the divergence register's engine-spelling entries; the v1.51 revision row; the header's Last-Updated session tag) · SKILL **v1.51.0** (the version; §11's counts reconciled to 353/357; the line-31 session pointer; Appendix C → session51 + **lesson 055** — the wrong-ancestor hover lesson + the browser-canvas pixel differ) · the validation report's **Trap 8** entry (the blur-scale shift) · AGENTS.md (the cardhover-states bullet + the blur-trap note) · CLAUDE.md (the E2E spec list) · README (the 710 row + the Testing table + the mobile-nav 61/62 row) · the drift-watch verifier's spec-count recalibration 27→28 and re-run GREEN · `docs/session_101.md` (the round narrative) · the worklog S51 entry · this plan's sign-offs · `.env.example` verified current (NO env plumbing).

## Sign-offs (completed at execution)

- [x] Calibration recorded (FIVE probes + the pixel differ — the blur census, the full hover contract, the addbar translate register, the cross-side pixel pairs)
- [x] The honest RED (P1 written first, failing on the current artifact — blur(8px); two test-authoring rounds: the border lab() register + the viewport-structural width) → Fix #1 → GREEN (blur(4px), confirmed live)
- [x] Pins green (the 12-pin spec on the fixed artifact, 13/13 incl. setup; the unit layer 353 unchanged)
- [x] Mutations ×6 caught + byte-exact reverts (md5-verified at every step; each on the REBUILT artifact; M4 the honest two-pin catch P6+P12; the final state matches the pristine md5s)
- [x] Full gate × 2 consecutive runs on the final code (353 + 357 × 2 = 710 per run; lint 0/0 · tsc clean · build 0; cardhover-states joined the a–c group)
- [x] Post-change battery (the sweep ALL 8 ROUTES AT BASELINE byte-identical — the fix is sub-tolerance · the 62nd mobile-nav token-exact · the hovered re-diff 0.129% (unchanged, the honest sub-tolerance finding) · the fix confirmed computed blur(4px) · watches + census clean · screenshots 266-270 VLM 3/5 direct + 2/2 pixel-settled (the r49 reconciliation pattern))
- [x] Docs aligned (PAD v1.51 + the engine-spelling register; SKILL v1.51.0 + lesson 055; the Trap 8 entry; AGENTS, CLAUDE, README, the verifier recalibration 27→28 + globals.css ~204 — the drift watch ALL FAMILIES GREEN; session_101.md, the worklog S51 entry, this plan's sign-offs); committed to main; pushed via the SSH wrapper
