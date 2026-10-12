# Remediation Plan — Session 53 (Round 53): HERO-NAV-1 — The Hero Carousel's Dot/Arrow Interaction Family: The Sweep's Second Fully-Parity Family (the Computed Contracts Byte-Identical, the Superset Behaviors Documented) (the Customer-Surfaces Pin-Density Sweep's Eleventh Installment)

**Date:** 2026-10-13 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `78df1b5` (the session-52 ship `887803c` + the user's session_104 narrative log — docs only, zero production code)
**Status at audit start:** 723-test gate per run (353 unit + 370 E2E), PAD v1.52, SKILL v1.52.0 — lint 0/0 · tsc clean · 353/353 unit+integration (22 files) · build exit 0 · the full E2E baseline re-run **all green (370 chromium + the setup logins per four FILE-list invocations: a–c 174 / c–m 41 / n–s 77 / s–z 82)** — ZERO flakes — verified pre-change on a FRESH CLONE (the workspace was reset: `git clone` @ `78df1b5`, `bun install` 475 packages, the `.env` contract re-created from `.env.example`, the hard-link DB convergence re-established at inode 263859 at both paths, the Playwright Chromium cache re-installed).

## 0. The round's mandate

The user's standing round instruction (the full audit/parity workflow with the mobile-nav + Tailwind v4 watches; the `.env`/db-root contract — verified: `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root, the hard-link convergence intact at inode 263859; the professional Stripe integration verification — demo mode rests green without keys, the standing credential gates unchanged (NO Stripe test-mode keys or email credentials provided this round); the vitest + playwright suites — both verified with the `skills/` exclusion re-confirmed in all four configs (tsconfig exclude line 41; vitest include allowlist; playwright testDir; eslint ignores); the TDD remediation plan; the screenshots; the `.env.example` — verified current, this round adds NO env plumbing; the docs; and the main-only push via the SSH wrapper). The round's deliverable is audit-derived: session-103's standing "suggested next" — **the sweep's eleventh installment**.

## 1. Baseline verification (state at audit start)

- **Workspace RESET this round (not a pull):** the local workspace had been wiped — `git clone https://github.com/nordeim/ecommerce-store.git` @ `78df1b5` (the session-52 ship + the user's session_104.md narrative log — the recent-changes audit CLEAN, docs only, zero production code); `bun install` (475 packages); `.env` re-created from `.env.example`; the hard-link DB convergence re-established (`ln /home/z/my-project/db/custom.db db/custom.db` — inode 263859 at BOTH paths; the injected parent `.env`'s absolute `DATABASE_URL` wins, and both URLs open ONE file — the documented sandbox contract); `bun run db:setup` idempotent (12 products, 4 users, 4 orders, 3 hero slides); the Playwright Chromium cache re-installed (`bunx playwright install chromium`).
- Baseline gate: lint 0/0 · tsc clean · **353/353 unit+integration (22 files)** · build exit 0 · **the full E2E baseline re-run all green** — 370 chromium tests + the setup logins, four FILE-list invocations under the 600s cap (a–c 174 [5.0m] / c–m 41 [2.2m] / n–s 77 [3.7m] / s–z 82 [2.4m] — byte-identical to the documented round-52 ship split; `--list` cross-check: 371 total = 370 chromium + 1 setup).
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd** (the gate-round convention — calibration → pins → mutation-style efficacy proofs; this round has NO production fix, so the mutation layer is the round's entire red-green rigor), **agent-browser** (the live reference walk — the r53c/d/e probes), **clone-app-pat-pro** (the parity methodology — the DOM probe + the computed style are the ground truth), **code-review-and-audit** (the lenses on the hero-carousel + the swap-vs-fade architecture question).
- **The Round-53 live battery (the audit's parity layer, against the production standalone on :3000 via `scripts/battery-runner.sh prod`):** the paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec` painted both sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0% [9 px], checkout 0.01%, account 0% [9 px], login 0.28% — byte-identical to the documented round-42..52 baselines). **The 65th mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks). The standing watches clean (typeahead: the reference fires ZERO search requests; carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11 admin CLEAN.

## 2. Audit results

### 2.1 The candidate triage (session-103's "suggested next" list)

1. **The hero carousel's dot/arrow interaction family (CHOSEN — the round's deliverable, below):** session-103's standing suggestion, first position. The sweep's method applied: the family's zones enumerated (`src/components/store/hero-carousel.tsx` — the prev/next arrow buttons, the dot pagination buttons + their row, the slide crossfade containers, the text-block rise, the auto-advance timer + the hover-pause) + cross-checked against the E2E layer: the family's INTERACTION-GATED states had near-ZERO pins (storefront-parity:159 pins the dots' RESTING geometry [session-3]; storefront-parity:52 the CTA pill; :172 the slide content; :381 the h1 line-height; :441 the inert slides; cardhover-states:264 P11 pins the hero's 12px blur register — but the arrows' anatomy/hover/focus, the dots' active/inactive computed contract + the width morph, the dot no-hover rule, the crossfade durations, the wrap-around, the hover-pause, and the dot-click timer restart were never measured against the reference NOR pinned).
2. **The footer's interaction corners (RE-DEFERRED, the first time):** the hover pattern is ONE repeated token (`text-background/60 hover:text-background` across ~14 links + the bottom row); the newsletter block carries a dedicated round (session-43's NEWSLETTER-E2E-1); the contact block pinned by smoke.spec:239 — thinner than the hero family.
3. **The header's search-drawer family (RE-DEFERRED):** the behavioral contract is exhaustively pinned by session-46's SEARCH-BEHAVIOR-1 (12 pins in srch-behavior.spec + 10 in search.spec) — the richest-pinned family on the site; the remaining corners (the strip's resting anatomy) are partially covered by the sweep + the a11y specs.
4. **The credential-gated items (UNCHANGED):** Stripe test-mode keys and an email provider — no credentials provided this round.

### 2.2 THE PRIMARY FINDING — the hero dot/arrow family is FULLY PARITY: the sweep's second zero-divergence family (HERO-NAV-1), with FIVE superset behaviors documented

The surfaces: the hero's two arrow buttons + the three dot buttons + their row + the crossfade machinery + the auto-advance/hover-pause behavior. **The interaction states are INTERACTION-GATED** (the resting pixel sweep captures the hero mid-slide-1 with no hover, no focus, no click — the same structural finding as rounds 47–52) AND the behavioral layer (pause, wrap, restart) is invisible to every existing pin.

**The calibration (SEVEN probes — `hero-clone-r53a.mjs` + `hero-clone-r53b.mjs` + `hero-clone-r53f.mjs` (clone side, via the battery runner) + `hero-probe-r53c.mjs` + `hero-probe-r53d.mjs` + `hero-probe-r53e.mjs` (reference, login-gated; r53e run on BOTH sides via the HERO_PROBE_MODE env), live, the DOM dumps + computed styles as the ground truth):**

| # | Behavior | Reference (measured live) | Clone | Verdict |
|---|---|---|---|---|
| 1 | the arrow class string | `absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors` | **BYTE-IDENTICAL** | PARITY (pin — the byte-level class identity) |
| 2 | the arrow geometry | 40×40, inset 16px both sides, topCenterOffset 0 (vertical center), svg 20×20 | **IDENTICAL** (40/40/16/16/0/20) | PARITY (pin — structural) |
| 3 | the arrow resting bg | `rgba(255,255,255,0.2)` (white/20) | `oklab(0.999994 … / 0.2)` — the same paint | PARITY (pin — both spellings; the lab() register) |
| 4 | the arrow radius + blur | `9999px` + `blur(12px)` (rounded-full + backdrop-blur-md) | `3.35544e+07px` + `blur(12px)` | PARITY (pin; the radius serialization register) |
| 5 | **the arrow hover** | `rgba(255,255,255,0.3)` (hover:bg-white/30 — REAL mouse) | `oklab(… / 0.3)` — IDENTICAL paint | **PARITY (pin — both spellings)** |
| 6 | **the arrow focus outline** | `outline: auto 1px rgba(230,107,26,0.5)` — the GLOBAL `outline-ring/50` base rule (the primary orange at 50%) | `outline: auto 1px lab(60.0768 45.9585 63.0005 / 0.5)` — the SAME rule, the same paint | **PARITY (pin — both spellings; the global-rule discovery)** |
| 7 | the arrow transition | 0.15s, the v3 6-property transition-colors list | 0.15s, v4's longer list (+ outline-color, --tw-gradient-*) | PARITY (pin the duration; the list = register) |
| 8 | the arrow transform | `transform: matrix(1,0,0,1,0,-20)`; `translate: none` (v3) | `transform: none`; `translate: 0px -50%` (v4's standalone property) | REGISTER (rendered-identical — topCenterOffset 0 both sides) |
| 9 | the active dot | `h-2 rounded-full transition-all duration-300 w-8 bg-white` — 32×8, bg `rgb(255,255,255)`, radius 9999px, transition `0.3s / all` | **BYTE-IDENTICAL** classes; 32×8, rgb white, `3.35544e+07px`, 0.3s/all | PARITY (pin) |
| 10 | the inactive dot | `h-2 rounded-full transition-all duration-300 w-2 bg-white/50` — 8×8, bg `rgba(255,255,255,0.5)` | **BYTE-IDENTICAL**; 8×8, `oklab(… / 0.5)` | PARITY (pin — both spellings) |
| 11 | **the dot no-hover rule** | REAL mouse: NO change (bg /0.5, w 8 — the class string carries no hover: variant) | REAL mouse: NO change | **PARITY (pin — the negative)** |
| 12 | the dot row | `absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2` — gap 8px, bottom 24px above the hero bottom edge, centered | **BYTE-IDENTICAL**; gap 8, offset 24, rowCenteredOffset 0 | PARITY (pin) |
| 13 | **the dot click — the width morph** | (the reference's swap DOM: the active dot's class flips w-8/w-2; no morph — instant) | The LIVE morph 8→32 via transition-all (0.3s), bg → white, aria-current → true | SUPERSET (pin the clone's morph contract; the reference's class flip is register #7) |
| 14 | **the dot-click timer restart** | NO restart — the flip after a dot click landed 403ms later (the pre-existing timer fired) | RESTART — the flip landed 4838ms ≈ 5s after the click (`go(i); startAuto()`) | SUPERSET (the anti-jank polish; register) |
| 15 | **the auto-advance cadence** | deltas 5009/5007ms (re-query polling, DOM-swap safe) | 5005ms | **PARITY (the standing watch, now reference-verified)** |
| 16 | **the hover-pause** | NO pause — the slide advanced during a 7s real-mouse dwell | PAUSE — 7s dwell: no advance; leave: resumed within 6s | SUPERSET (the WCAG-friendly pause; register) |
| 17 | **the crossfade** | The reference renders ONE slide at a time (heroImgCount 1), parent `absolute inset-0` transition **0s**, text `max-w-lg` transition **0s** — an INSTANT cut (the swap architecture, session-11's note) | All 3 slides in the DOM, `transition-opacity duration-700` + text `transition-all duration-700` + `translate-y-4` rise — a 700ms crossfade | SUPERSET (the original port's polish; register) |
| 18 | the wrap-around | next×3: 1→2→3→(mid-swap null read — the swap artifact); prev from 1: inconclusive read | next×3: 1→2→3→**1** ✓; prev from 1: →3 ✓ — clean both directions | PARITY (the clone's clean reads pinned; the reference's wrap is the ported original — the null read honestly noted) |
| 19 | the aria layer | NO aria-labels on arrows or dots; NO aria-current | `aria-label="Previous/Next slide"` + `aria-label="Go to slide N: title"` + `aria-current` | SUPERSET (the a11y contract — pin) |

**THE ROUND'S HEADLINE: the sweep's SECOND FULLY-PARITY FAMILY.** After the buy-panel (r52), the hero's dot/arrow family measures ALL-PARITY at the computed level — every class string BYTE-IDENTICAL, every computed value identical modulo the engine registers — with FIVE deliberate superset behaviors now first-time documented (the crossfade, the text rise, the hover-pause, the dot-click timer restart, the aria layer). The honest finding: the sweep is converging; the interaction-gated families the earlier rounds could not reach are now mapped AND verified byte-level on both sides.

**The probe-honesty notes (four):** (1) **The synthetic-event wall (the round's own lesson)** — r53a's `dispatchEvent(new MouseEvent("mouseover"))` reads did NOT activate CSS `:hover` (the arrow hover read the resting /0.2) and did NOT fire React's `onMouseEnter` (the hover-pause read `paused: false` — a false alarm that looked like a REAL functional bug): CSS pseudo-classes and React's delegated synthetic listeners require TRUSTED pointer events — every interaction-gated read was re-verified with Playwright's real `page.hover()` / `page.mouse.move()` (r53b). The r52 lesson L58 (getComputedStyle is LIVE) EXTENDED: not just read-before-teardown — the EVENT ITSELF must be trusted. (2) **The DOM-swap staleness trap** — the reference swaps slides in the DOM (ONE img at a time), so r53c's captured-`imgs` polling produced garbage flips ([1002, 1602] — 601ms apart!) and a false `paused: false`; the re-query polling (r53d — re-query the DOM every poll, never hold element references across swaps) settled the true 5000ms cadence and the true no-pause behavior. NEVER hold element references across a swapping DOM. (3) **The battery runner does not forward argv** — r53e's first clone-side run silently hit the REFERENCE (MODE defaulted to "ref"; the runner invokes `node scripts/<name>` with no args): the mode now reads the `HERO_PROBE_MODE` env var. Always verify the probe's target from its OWN output header (`[clone]` vs `[ref]`). (4) **The reference's wrap read (r53e §B)** — the third next-click's read returned null (the swap happened between the click and the 900ms read); the wrap is parity-by-port (the byte-identical class strings came from the reference's own carousel), honestly documented rather than re-probed to death.

### 2.3 The registers (documented, no code change — all rendered-identical or deliberate superset)

1. **The lab()/oklab() alpha serialization (the r48/r51/r52 form):** the reference serializes white/20, white/30, white/50 as `rgba(255,255,255,α)`; v4 serializes as `oklab(0.999994 0.0000455678 0.0000200868 / α)`. Same paint. REGISTER.
2. **The standalone translate property:** v4's `-translate-y-1/2`/`-translate-x-1/2` emit `translate: 0px -50%`/`-50%` (transform: none); v3 emitted `transform: matrix(1,0,0,1,0,-20)`. Rendered-identical (topCenterOffset 0, rowCenteredOffset 0 both sides). REGISTER.
3. **The radius serialization:** `9999px` (v3) vs `3.35544e+07px` (v4) — both "full". REGISTER.
4. **The transition-colors property list (the r52 form):** v4's list is longer (+ outline-color, --tw-gradient-*). Same 0.15s. REGISTER.
5. **The swap-vs-crossfade architecture:** the reference renders ONE slide (instant cut, transition 0s); the clone renders all 3 + 700ms opacity crossfade + the text rise. The DELIBERATE superset polish from the original port — resting parity holds (the home sweep reads 0%: both sides paint slide 1 fully at capture). REGISTER (superset).
6. **The hover-pause + the dot-click timer restart:** the reference does neither; the clone does both (the WCAG-friendly anti-jank pattern). REGISTER (superset).
7. **The reference's own a11y gap:** no aria-labels, no aria-current on the hero controls; the clone carries both. REGISTER (superset).

### 2.4 The deliverable's shape

1. **`tests/e2e/heronav-states.spec.ts`** — the NEW spec (14 pins, the family's computed + behavioral contract — the pure gate-round form: every pin documents measured existing behavior; NO honest RED because there is NO production fix — the mutation layer (§3.4) is the round's entire red-green rigor, and it is doubled for exactly that reason):
   - **P1 (the arrow geometry — STRUCTURAL):** 40×40 both arrows, inset 16px both sides, vertical center offset 0, svg 20×20 — measured on the clone, calibrated on both.
   - **P2 (the arrow anatomy):** bg white/20 (both spellings), radius the full value (both serializations), backdrop-filter blur(12px), color white, cursor pointer, flex centering.
   - **P3 (the arrow hover):** REAL mouse → white/30 (both spellings).
   - **P4 (the arrow focus outline):** script focus on a pointer-clean page → `auto 1px` + the ring/50 orange (both spellings) — the global-rule discovery, read BEFORE blur (the r52 L58 lesson).
   - **P5 (the arrow transition duration):** 0.15s (the property-list register in the comment).
   - **P6 (the active dot):** 32×8, bg rgb white, radius full, `transition-all 0.3s`.
   - **P7 (the inactive dot):** 8×8, bg white/50 (both spellings), the same transition.
   - **P8 (the dot row):** gap 8px, 24px above the hero bottom edge, horizontally centered (offset 0), 3 dots.
   - **P9 (the dot click — the width morph):** click dot 3 → the live morph 8→32 + bg white + aria-current true.
   - **P10 (the dot no-hover — the negative):** REAL mouse on an inactive dot → NO bg/width change.
   - **P11 (the crossfade — the superset contract):** the slide container `transition 0.7s / opacity` + the text block `transition 0.7s / all`.
   - **P12 (the wrap-around):** next×3 from slide 1 → back to slide 1; prev from slide 1 → slide 3 (the active-slide reader via aria-current).
   - **P13 (the hover-pause — the superset contract):** a real-mouse 6.5s dwell on the hero → NO advance; leave → advance within 6.5s.
   - **P14 (the aria superset):** the arrows carry "Previous/Next slide"; the dots carry "Go to slide N: title" + aria-current on the active.
2. **NO production code changes.** The round's only diffs: the new spec + the docs + this plan. (The seven registers of §2.3 are the audit's documented output.)
3. **The engine/vintage registers** recorded in the PAD's divergence register + AGENTS + this plan.

## 3. The TDD plan (the gate-round convention: calibration → pins → mutations — the fixless form)

### 3.1 Calibration (done — the reference measured live across seven probes)

§2.2's table. Every pin's expected value carries a first-hand measurement on BOTH sides.

### 3.2 The pins, written to the measured truth (no RED — there is no fix)

The 14-pin spec (§2.4). Conventions: the home route `/`; the arrows located by aria-label (the clone's own superset labels — the honest locator, no heuristics); the dots likewise; the active-slide reader via aria-current (DOM-stable on the clone — no swap); REAL mouse for every hover/dwell pin (the r53a synthetic-event lesson); the focus pins read BEFORE blur (the r52 L58 lesson); both-spelling regexes for alpha colors (the lab() register); the structural relations (inset/center offsets) asserted viewport-independent.

### 3.3 The unit layer — unchanged (353): no pure seam is touched (the family is presentation + timer behavior; no schema, no actions, no libs)

### 3.4 The mutation-style efficacy proofs ×8 (the fixless round's red-green rigor — each caught at the E2E layer on the REBUILT artifact (the session-36 lesson), then byte-exact revert, md5-verified at every step; verify each mutation's diff before building — the r50 stale-write lesson; use `grep -F` for literal tokens — the r51 M1 lesson)

- **M1 (the arrow resting bg broken):** `bg-white/20` → `bg-white/30` → **P2 fires** (the resting bg = the hover value).
- **M2 (the arrow hover broken):** `hover:bg-white/30` → `hover:bg-white/40` → **P3 fires**.
- **M3 (the blur dropped):** the prev+next `backdrop-blur-md` removed → **P2 fires** (blur(12px) gone).
- **M4 (the arrow geometry broken):** `h-10 w-10` → `h-9 w-9` → **P1 fires** (36×36 ≠ 40×40).
- **M5 (the active dot width broken):** the active `w-8` → `w-6` → **P6 + P9 fire** (24 ≠ 32; the morph lands at 24).
- **M6 (the dot transition broken):** `duration-300` → `duration-150` → **P6 + P7 fire** (0.15s ≠ 0.3s — the honest two-pin catch).
- **M7 (the crossfade broken):** the slide `duration-700` → `duration-500` → **P11 fires**.
- **M8 (the pause handler dropped — the BEHAVIORAL mutation):** `onMouseEnter={stopAuto} onMouseLeave={startAuto}` removed → **P13 fires** (the carousel advances during the dwell).

### 3.5 The full gate (the regression proof)

lint (0/0) · typecheck · the FULL unit layer (353 — unchanged) · build · **the FULL E2E × 2 consecutive runs on the final code (370 + 14 = 384 chromium tests per run, as four FILE-list invocations under the 600s cap — heronav-states joins the a–c group)**.

## 4. Execution order

1. **Calibration:** the seven probes (done, §3.1).
2. **PINS:** write the 14-pin spec; run it (15/15 green on the current artifact — the pure gate-round form); the unit layer re-run (353 — unchanged).
3. **Mutations ×8** (§3.4 — each caught + byte-exact revert, the artifact rebuilt for every E2E proof).
4. **Full gate:** lint · typecheck · unit · build · the FULL E2E × 2 consecutive runs.

## 5. Post-change battery + screenshots

- The paired pixel sweep re-run (all 8 routes — the round's only diff is a NEW spec file; the baseline must hold byte-identically) + **the 66th mobile-nav verification** re-run (token-exact parity must hold).
- **Screenshots 276-280** (probe-first, single invocation, the production standalone on :3001 — a FRESH process, ZERO DB mutations by construction): the arrows + dots at rest (the full control layer in one frame); the prev arrow hovered (the /0.3 tint); the dot row with dot 3 activated (the 32px active pill + the 8px inactives); the arrow focused (the ring/50 outline — the keyboard-affordance proof); the crossfade mid-transition (two slides at intermediate opacity — the superset's visual signature). **VLM 5/5 verification** (describe the surface as it IS — the DOM probe is the ground truth; never guess content — the r51/r52 discipline; sub-perceptual disputes settle by pixel measurement).

## 6. Docs duty (this round's deliverable + the round's own records)

The PAD **v1.53** (§8.1's heronav-states row + the Total row 53/737/353+384; §8.4's checklist 384; §3.2's tree 30 specs + the heronav-states entry + 53 plans; the divergence register's seven entries (§2.3); the v1.53 revision row; the header's Last-Updated session tag) · SKILL **v1.53.0** (the version; §11's counts reconciled to 353/384; the line-31 session pointer; Appendix C → session53 + **lesson 057** — L60 the synthetic-event wall (trusted pointer events for :hover + React onMouseEnter), L61 the DOM-swap staleness trap (re-query, never hold references), L62 the battery-runner argv pass-through gap (env-var modes + self-identifying probe headers), L63 the VLM settlement extended + the describe-reality discipline) · AGENTS.md (the heronav bullet + the registers + the trusted-event discipline) · CLAUDE.md (the E2E row's family + 384) · README (the 737 row + the 357→384 Playwright stale-count fix + the Testing table + the mobile-nav 65/66 row + the File Hierarchy's 30/384) · the drift-watch verifier's spec-count recalibration 29→30 + re-run GREEN · `docs/session_105.md` (the round narrative) · the worklog S53 entry · this plan's sign-offs · `.env.example` verified current (NO env plumbing).

## Sign-offs (completed at execution)

- [x] Calibration recorded (SEVEN probes — the full control-layer contract, the behavioral layer, the swap-vs-fade architecture)
- [x] Pins green (15/15 — the 14-pin spec + the setup login on the current artifact — the pure gate-round form, zero production changes; one test-authoring round: the tsc `HTMLElement` annotations on the six offsetWidth evaluate callbacks)
- [x] Mutations ×8 caught + byte-exact reverts (md5-verified at every step; each on the REBUILT artifact; M1→P2+P3 (the honest pair), M2→P3, M3→P2, M4→P1, M5→P6+P9, M6→P6+P7, M7→P11, M8→P13 (the honest BEHAVIORAL catch); the final state matches the pristine md5 — hero-carousel 03d4a444…)
- [x] Full gate × 2 consecutive runs on the final code (353 + 384 × 2 = 737 per run; lint 0/0 · tsc clean · build 0; heronav-states joined the a–c group at 188)
- [x] Post-change battery (the sweep ALL 8 ROUTES AT BASELINE byte-identical — the round's only diff is a spec file · the 66th mobile-nav token-exact · watches + census clean · screenshots 276-280 VLM 3/5 direct + 2 pixel-settled (277: the /0.3 tint +113R/+122G/+128B; 279: the orange ring 26.1% warm-hued at the edge band) + 2 corrected-description (276: the guessed headline + photo subject corrected to the DOM-probed facts; 278: the low-contrast context named — the DOM probe's [8,8,32] the ground truth))
- [x] Docs aligned (PAD v1.53 + the seven registers; SKILL v1.53.0 + lesson 057 — L60/L61/L62/L63; AGENTS, CLAUDE, README (incl. the 357→384 Playwright stale-count fix), the verifier recalibration 29→30 — the drift watch ALL FAMILIES GREEN; session_105.md, the worklog S53 entry, this plan's sign-offs); committed to main; pushed via the SSH wrapper
