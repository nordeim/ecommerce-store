# Remediation Plan — Session 52 (Round 52): BUY-PANEL-1 — The PDP Buy-Panel Action Family: The First Fully-Parity Family of the Sweep (the Pin Family + the Button-Vintage Registers) (the Customer-Surfaces Pin-Density Sweep's Tenth Installment)

**Date:** 2026-10-12 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `8ff1129` (the session-51 ship `c51d0d6` + the user's session_102 narrative log — docs only, zero production code)
**Status at audit start:** 710-test gate per run (353 unit + 357 E2E), PAD v1.51, SKILL v1.51.0 — lint 0/0 · tsc clean · 353/353 unit+integration (22 files) · build exit 0 · the full E2E baseline re-run **all green (357 chromium + the setup login per four FILE-list invocations: a–c 189-equivalent [the 11-file form] / c–m 13 / n–s 77 / s–z 82; the documented a–c 161 + c–m 41 split reconstructed and verified: 160+40+76+81 = 357)** — ZERO flakes (the round-51 wishlist settle fix verified at scale) — verified pre-change on a FRESH CLONE (the workspace was reset: `git clone` @ `8ff1129`, `bun install`, the `.env` contract re-created from `.env.example`, the hard-link DB convergence re-established at inode 134870 at both paths, the Playwright Chromium cache re-installed).

## 0. The round's mandate

The user's standing round instruction (the full audit/parity workflow with the mobile-nav + Tailwind v4 watches; the `.env`/db-root contract — verified: `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root, the hard-link convergence intact; the professional Stripe integration verification — demo mode rests green without keys, the standing credential gates unchanged (NO Stripe test-mode keys or email credentials provided this round); the vitest + playwright suites — both verified with the `skills/` exclusion re-confirmed in all four configs (tsconfig exclude line 41; vitest include allowlist; playwright testDir; eslint ignores); the TDD remediation plan; the screenshots; the `.env.example` — verified current, this round adds NO env plumbing; the docs; and the main-only push via the SSH wrapper). The round's deliverable is audit-derived: session-101's standing "suggested next" — **the sweep's tenth installment**.

## 1. Baseline verification (state at audit start)

- **Workspace RESET this round (not a pull):** the local workspace had been wiped — `git clone https://github.com/nordeim/ecommerce-store.git` @ `8ff1129` (the session-51 ship + the user's session_102.md narrative log — the recent-changes audit CLEAN, docs only, zero production code); `bun install` (475 packages); `.env` re-created from `.env.example`; the hard-link DB convergence re-established (`ln /home/z/my-project/db/custom.db db/custom.db` — inode 134870 at BOTH paths; the injected parent `.env`'s absolute `DATABASE_URL` wins, and both URLs open ONE file — the documented sandbox contract); `bun run db:setup` idempotent (12 products, 4 users, 4 orders, 3 hero slides); the Playwright Chromium cache re-installed (`bunx playwright install chromium` — the fresh-clone gap that failed the first E2E invocation's setup login).
- Baseline gate: lint 0/0 · tsc clean · **353/353 unit+integration (22 files)** · build exit 0 · **the full E2E baseline re-run all green** — 357 chromium tests + the setup logins, four FILE-list invocations under the 600s cap (the documented split reconstructed via `--list` per file: a–c [accessibility→cart] 160 + 1, c–m [catalog-parity→mobile-navigation] 40 + 1, n–s [newsletter→shopfilter-states] 76 + 1, s–z [smoke→wishlist] 81 + 1) — **zero flakes** (the round-51 wishlist aria-flip settle verified at scale).
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd** (the gate-round convention — calibration → pins → mutation-style efficacy proofs; this round has NO production fix, so the mutation layer is the round's entire red-green rigor), **agent-browser** (the live reference walk — the r52b–r52g probes), **clone-app-pat-pro** (the parity methodology — the DOM probe + the computed style are the ground truth), **code-review-and-audit** (the lenses on the buy-panel + Button component).
- **The Round-52 live battery (the audit's parity layer, against the production standalone on :3000 via `scripts/battery-runner.sh prod`):** the paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec` painted both sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0% [9 px], checkout 0.01%, account 0% [9 px], login 0.28% — byte-identical to the documented round-42..51 baselines). **The 63rd mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks). The standing watches clean (typeahead: the reference fires ZERO search requests; carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11 admin CLEAN.

## 2. Audit results

### 2.1 The candidate triage (session-101's "suggested next" list)

1. **The PDP buy-panel's action family (CHOSEN — the round's deliverable, below):** session-101's standing suggestion. The sweep's method applied: the action row's zones enumerated (`src/components/store/buy-panel.tsx` — the stepper container + minus/plus buttons, the qty span, the ATC Button, the outline-heart Button; plus the Button component's own vintage anatomy `src/components/ui/button.tsx`) and cross-checked against the E2E layer: the family's INTERACTION-GATED states had near-ZERO pins (storefront-parity:279 pins the heart's px-8 class + 82px width + the svg classes; wishlist.spec:29 pins the heart's ACTIVE red; qty-stepper.spec pins the stepper's BOUNDARY states [session-49]; cart.spec pins the ATC's click flows — but the ATC's full computed anatomy [the bare `shadow` under v4, the hover /90, the focus ring], the heart's hover states [the accent pair], the stepper hovers, the qty span, the transition contracts, and the accent token at its RESTING sites were never measured against the reference NOR pinned).
2. **The shop empty-state's interaction corners (RE-DEFERRED, the third time):** carries a session-3 pin already (search.spec:101 — the copy, the h3 18px, the icon circle, the Clear action); thinner than the buy-panel family.
3. **The account order-detail's deep-remaining surfaces (RE-DEFERRED, the third time):** carries a dedicated round (session-34's CUSTOMER-ORDER-DETAIL-1 + session-35's timeline + session-36/37/38's tracking/windows — eight pins in account.spec).
4. **The credential-gated items (UNCHANGED):** Stripe test-mode keys and an email provider — no credentials provided this round.

### 2.2 THE PRIMARY FINDING — the PDP buy-panel's action family is FULLY PARITY: the first zero-divergence family of the sweep (BUY-PANEL-1)

The surfaces: the PDP action row's four zones (the stepper, the qty span, the ATC, the heart) + the Button component's vintage anatomy + the accent token at its resting sites. **The hover/focus states are INTERACTION-GATED** (the resting pixel sweep captures the PDP with no hover, no focus — the same structural finding as rounds 47–51) AND the resting-visible accent sites (the home tiles) were never value-pinned.

**The calibration (SEVEN probes — `scripts/buypanel-clone-r52a.mjs` + `buypanel-clone-r52f.mjs` (clone side, via the battery runner) + `buypanel-probe-r52b.mjs` + `buypanel-probe-r52c.mjs` + `buypanel-probe-r52d.mjs` + `buypanel-probe-r52e.mjs` (reference, login-gated) + `buypanel-probe-r52g.mjs` (reference, LOGGED-OUT for the auth buttons), live, the DOM dumps + computed styles as the ground truth):**

| # | Behavior | Reference (measured live) | Clone | Verdict |
|---|---|---|---|---|
| 1 | the action row | `flex items-center gap-4 mb-4`, 456px row @1024, widths [stepper 130, ATC 212, heart 82], gaps 16px | **IDENTICAL** (130/212/82, row 456) | PARITY (pin — structural) |
| 2 | the ATC geometry | 212×40 (flex-1 absorbs), cursor pointer | **IDENTICAL** | PARITY (pin) |
| 3 | the ATC anatomy | bg rgb(230,107,26) · white · radius 12px · 14px/500 · gap 8px · svg 16px · padding 0px 32px · the bare-`shadow` pair `rgba(0,0,0,0.1) 0px 1px 3px 0px` + `0px 1px 2px -1px` | **IDENTICAL** except padding **8px 32px** (the py-2 register, #10) and 4-vs-2 zero shadow layers (register #12) | PARITY (pin) |
| 4 | the ATC hover | bg `rgba(230,107,26,0.9)` (hover:bg-primary/90) | `lab(60.0768 45.9585 63.0005 / 0.9)` — the same paint, v4's serialization | PARITY (pin — both spellings) |
| 5 | the ATC focus ring | `rgb(230,107,26) 0px 0px 0px 1px` (ring-1 ring-ring — the --ring token = the primary orange) | **IDENTICAL** (3 zero-layers + the same orange 1px) | PARITY (pin) |
| 6 | the heart anatomy | 82×40 · bg transparent · border 1px solid rgb(233,230,226) · radius 12px · shadow-sm's visible layer `rgba(0,0,0,0.05) 0px 1px 2px 0px` · svg rgb(23,23,28) 16px fill none · padding 0px 32px | **IDENTICAL** except padding (the py-2 register) | PARITY (pin) |
| 7 | **the heart hover — THE ACCENT PAIR** | bg **rgb(253,243,237)** (accent = hsl(24 80% 96%)) + color **rgb(138,64,15)** (accent-foreground = hsl(24 80% 30%)) | **IDENTICAL** | **PARITY (pin — the accent token pair, never pinned anywhere)** |
| 8 | the stepper container | 130×42 · border 1px solid rgb(233,230,226) · radius 12px | **IDENTICAL** | PARITY (pin) |
| 9 | the minus/plus | `p-3 hover:bg-secondary transition-colors rounded-l/r-xl` · cursor pointer · hover bg **rgb(242,240,237)** (secondary) | **IDENTICAL** (byte-exact classes; hover rgb(242,240,237)) | PARITY (pin) |
| 10 | the qty span | `px-5 font-medium min-w-[3rem] text-center` · 16px/500 · padding 0px 20px · min-width 48px · rgb(23,23,28) | **IDENTICAL** | PARITY (pin) |
| 11 | the transitions | 0.15s, the v3 transition-colors property list (color, background-color, border-color, text-decoration-color, fill, stroke) | 0.15s, v4's LONGER list (+ outline-color, --tw-gradient-*) | PARITY (pin the duration; the list = register #13) |
| 12 | the accent at REST — the home feature tile | bg rgb(253,243,237) + the primary icon rgb(230,107,26) | **IDENTICAL** | PARITY (pin — the resting accent site) |
| 13 | the accent-foreground at REST — the home category tile | bg rgb(253,243,237) + the icon rgb(138,64,15) | **IDENTICAL** | PARITY (pin — the resting accent-foreground site) |
| 14 | the Radix Select item highlight (the accent's third family) | rgb(253,243,237) + rgb(138,64,15) | **IDENTICAL** (the same tokens) | PARITY (documented; the r50 family's surface) |
| 15 | the outline (invisible pair) | focus-visible: `rgba(0,0,0,0) solid 2px` (transparent — never renders) | `lab(... / 0.5) none 1px` (style none — never renders) | REGISTER (both invisible) |

**THE ROUND'S HEADLINE: the first ZERO-production-divergence family of the sweep.** After five consecutive rounds of real fixes (r47 ×2, r48 ×3, r49 ×4, r50 ×1, r51 ×1), the buy-panel family measures ALL-PARITY on both sides — the honest finding, and the proof the sweep is converging: the interaction-gated states the earlier rounds could not reach are now mapped AND verified byte-level.

**The probe-honesty notes (three):** (1) **the .last() locator trap (the round's own lesson)** — r52c's first heart-hover read hit a RELATED-PRODUCT CARD heart (`main button` + lucide-heart + `.last()` — the PDP's related section carries its own hearts whose hover:bg-background = rgb(251,250,249), the BACKGROUND token, not the accent): the read looked like a genuine accent-token divergence (#FBFAF9 vs #FDF3ED) until the scoped re-measure (r52d §B, the action row's own heart) settled it — the reference's accent IS rgb(253,243,237), identical to the clone. The r51 wrong-ancestor lesson EXTENDED: not just the wrong ANCESTOR — the wrong SAME-ELEMENT COLLISION (the PDP has THREE heart populations: the buy-panel heart + the related-cards' hearts + the wishlist page's); scope probes to the action row's own subtree. (2) **the reference's own Button vintages are INCONSISTENT** (r52g): the login submit's base = `... gap-2 whitespace-nowrap rounded-md text-sm ...` + size `px-4 py-2`; the Google button's base = `... gap-2 whitespace-nowrap rounded-md ...` (text-sm in className); the PDP heart's base = `... gap-2 whitespace-nowrap text-sm font-medium ...` (NO size classes — the reference's Button has NO defaultVariants.size, so a call without an explicit size ships no h-9/px-4/py-2); the shopfilter Clear's base (r50) = `... whitespace-nowrap font-medium ...` (no gap-2, no text-sm). Chasing base-class identity against a reference this inconsistent is not well-defined — the computed contract is the pin, the vintage differences are registers. (3) **the script-focus :focus-visible method** — `el.focus()` on a pointer-clean page matches :focus-visible in Chromium (the UA heuristic), so the ring pins need no Tab-walk (r52e's 30-Tab walk landed on a related-product card — the tab order on the PDP reaches the cards before the buy panel at some viewports).

### 2.3 The registers (documented, no code change — all rendered-identical)

1. **The py-2 size-default vintage:** the clone's Button carries `defaultVariants.size = "default"` (`h-9 px-4 py-2`), so EVERY Button gains py-2 unless overridden — the heart/ATC (h-10) compute padding **8px 32px** vs the reference's **0px 32px** (the reference's heart call ships NO size classes). Rendered-identical (h-10 fixes the height; flex centers); class-string + computed-padding drift. Fixing it (removing defaultVariants.size) would churn ~60 call sites to preserve the default-size buttons' classes — zero rendered change, and the reference's own call sites are inconsistent anyway. REGISTER.
2. **The gap-2 base vintage:** the reference's Button bases carry `gap-2`; the clone's base does not (the clone's ATC passes `gap-2` in className — the ATC's final class set is IDENTICAL; the heart differs by gap-2, INERT — a single svg child means no between-children gap). Every other clone Button is text-only or single-icon (census: 66 usages, 2 with explicit gap classes) — inert everywhere. REGISTER.
3. **The 2-vs-4 zero shadow layers:** the reference serializes `--tw-ring-offset-shadow/--tw-ring-shadow/--tw-shadow` (2 zero-layers + the visible pair); v4 emits more shadow vars (4 zero-layers + the same pair). The visible geometry is byte-identical. REGISTER (the r51 form).
4. **The transition-colors property list:** v4's list is longer (+ outline-color, --tw-gradient-*). Same 0.15s duration, same rendered behavior for color-only elements. REGISTER.
5. **The lab()/oklab() serialization:** v4 serializes alpha colors in lab() (the ATC hover /90, the heart hover's alpha-free accent stays rgb()); v3 serializes rgba(). Same paint. REGISTER (the r48/r51 form).
6. **The invisible-outline pair:** the reference's transparent 2px solid outline vs the clone's none-styled outline — both never render. REGISTER.

### 2.4 The deliverable's shape

1. **`tests/e2e/buypanel-states.spec.ts`** — the NEW spec (13 pins, the family's computed contract — the pure gate-round form: every pin documents measured existing behavior; NO honest RED because there is NO production fix — the mutation layer (§3.4) is the round's entire red-green rigor, and it is doubled for exactly that reason):
   - **P1 (the action-row geometry — STRUCTURAL):** the stepper 130×42, the heart 82×40, and `atc.w === row.w − 130 − 82 − 32` (the two 16px gaps) — viewport-independent (the r51 structural-width lesson).
   - **P2 (the ATC anatomy):** bg rgb(230,107,26), color white, radius 12px, font 14px/500, gap 8px, svg 16px, padding "8px 32px" (the py-2 register — the clone's computed truth, commented), cursor pointer, the bare-`shadow` pair as substrings.
   - **P3 (the ATC hover):** the /90 alpha — both spellings (`rgba(230, 107, 26, 0.9)` or `lab(60.0768 45.9585 63.0005 / 0.9)`).
   - **P4 (the ATC focus ring):** `rgb(230, 107, 26) 0px 0px 0px 1px` in the focused box-shadow (script focus, pointer-clean page).
   - **P5 (the heart anatomy):** 82×40, bg rgba(0,0,0,0), border 1px solid rgb(233,230,226), radius 12px, the shadow-sm visible layer, svg rgb(23,23,28) 16px, padding "8px 32px" (register).
   - **P6 (the heart hover — THE ACCENT PAIR):** bg rgb(253,243,237) + color rgb(138,64,15) — the accent token pair pinned for the first time.
   - **P7 (the stepper container):** 130×42, border 1px solid rgb(233,230,226), radius 12px.
   - **P8 (the stepper hovers):** the minus AND the plus hover to bg rgb(242,240,237) (secondary).
   - **P9 (the qty span):** 16px/500, padding 0px 20px, min-width 48px, color rgb(23,23,28), text centered, "1" at rest.
   - **P10 (the transition durations):** 0.15s on the ATC, the heart, and the minus (the property-list register in the comment).
   - **P11 (the accent at rest — the feature tile):** on `/`: the h-12 tile bg rgb(253,243,237) + the primary icon rgb(230,107,26).
   - **P12 (the accent-foreground at rest — the category tile):** on `/`: the h-14 tile bg rgb(253,243,237) + the icon rgb(138,64,15).
   - **P13 (the heart's focus ring):** the same orange 1px substring.
2. **NO production code changes.** The round's only diffs: the new spec + the docs + this plan. (The six registers of §2.3 are the audit's documented output.)
3. **The engine/vintage registers** recorded in the PAD's divergence register + AGENTS + this plan.

## 3. The TDD plan (the gate-round convention: calibration → pins → mutations — the fixless form)

### 3.1 Calibration (done — the reference measured live across seven probes)

§2.2's table. Every pin's expected value carries a first-hand measurement on BOTH sides.

### 3.2 The pins, written to the measured truth (no RED — there is no fix)

The 13-pin spec (§2.4). Conventions: the PDP route `/product/wireless-headphones`; the action-row locator `main .flex.items-center.gap-4.mb-4` (the r52 probes' verified form — the wrong-population trap avoided); hover settles ≥ 700ms (the r48/r50/r51 lesson); the ring pins use script focus on a pointer-clean page (the r52e method); the substring form for shadow pairs (the zero-layers register); both-spelling regexes for alpha colors (the lab() register); the structural width relation (the r51 viewport-independence lesson).

### 3.3 The unit layer — unchanged (353): no pure seam is touched (the family is presentation-only; no schema, no actions, no libs)

### 3.4 The mutation-style efficacy proofs ×8 (the fixless round's red-green rigor — each caught at the E2E layer on the REBUILT artifact (the session-36 lesson), then byte-exact revert, md5-verified at every step; verify each mutation's diff before building — the r50 stale-write lesson; use `grep -F` for literal tokens — the r51 M1 lesson)

- **M1 (the ATC's shadow dropped):** button.tsx default variant `shadow` removed → **P2 fires** (the pair gone).
- **M2 (the ATC hover broken):** `hover:bg-primary/90` → `hover:bg-primary/80` → **P3 fires**.
- **M3 (the heart hover broken):** outline variant `hover:bg-accent` → `hover:bg-secondary` → **P6 fires** (bg rgb(242,240,237) ≠ the accent).
- **M4 (the feature tile broken):** category-card.tsx `bg-accent` → `bg-secondary` → **P11 fires**.
- **M5 (the category icon broken):** `text-accent-foreground` → `text-muted-foreground` → **P12 fires**.
- **M6 (the ring dropped):** button.tsx base `focus-visible:ring-1` removed → **P4 + P13 fire** (the honest two-pin catch — both read the ring).
- **M7 (the stepper hover broken):** buy-panel.tsx minus `hover:bg-secondary` → `hover:bg-accent` → **P8 fires**.
- **M8 (the span broken):** buy-panel.tsx span `font-medium` → `font-normal` → **P9 fires**.

### 3.5 The full gate (the regression proof)

lint (0/0) · typecheck · the FULL unit layer (353 — unchanged) · build · **the FULL E2E × 2 consecutive runs on the final code (357 + 13 = 370 chromium tests per run, as four FILE-list invocations under the 600s cap — buypanel-states joins the a–c group)**.

## 4. Execution order

1. **Calibration:** the seven probes (done, §3.1).
2. **PINS:** write the 13-pin spec; run it (13/13 green on the current artifact — the pure gate-round form); the unit layer re-run (353 — unchanged).
3. **Mutations ×8** (§3.4 — each caught + byte-exact revert, the artifact rebuilt for every E2E proof).
4. **Full gate:** lint · typecheck · unit · build · the FULL E2E × 2 consecutive runs.

## 5. Post-change battery + screenshots

- The paired pixel sweep re-run (all 8 routes — the round's only diff is a NEW spec file; the baseline must hold byte-identically) + **the 64th mobile-nav verification** re-run (token-exact parity must hold).
- **Screenshots 271-275** (probe-first, single invocation, the production standalone on :3001 — a FRESH process, ZERO DB mutations by construction): the action row at rest (the full family in one frame — the stepper + the ATC + the heart); the ATC hovered (the /90 tint); the heart hovered (the accent pair — the round's key parity confirmation); the stepper's minus hovered (the secondary tint) + the qty span; the ATC focused (the orange ring — the keyboard-affordance proof). **VLM 5/5 verification** (describe the surface as it IS — the DOM probe is the ground truth; never guess content — the r51 discipline).

## 6. Docs duty (this round's deliverable + the round's own records)

The PAD **v1.52** (§8.1's buypanel-states row + the Total row 52/723/353+370; §8.4's checklist 370; §3.2's tree 29 specs + the buypanel-states entry; the divergence register's vintage entries (§2.3's six); the v1.52 revision row; the header's Last-Updated session tag) · SKILL **v1.52.0** (the version; §11's counts reconciled to 353/370; the line-31 session pointer; Appendix C → session52 + **lesson 056** — the same-element-collision locator trap + the inconsistent-reference-vintage principle) · AGENTS.md (the buypanel bullet + the registers) · CLAUDE.md (the E2E row's family + 370) · README (the 723 row + the Testing table + the mobile-nav 63/64 row + the File Hierarchy's 29/370) · the drift-watch verifier's spec-count recalibration 28→29 + re-run GREEN · `docs/session_103.md` (the round narrative) · the worklog S52 entry · this plan's sign-offs · `.env.example` verified current (NO env plumbing).

## Sign-offs (completed at execution)

- [x] Calibration recorded (SEVEN probes — the full action-family contract, the accent token at three families, the Button vintage census, the focus rings)
- [x] Pins green (14/14 — the 13-pin spec + the setup login on the current artifact — the pure gate-round form, zero production changes; the unit layer 353 unchanged; the ring pins took one test-authoring round: getComputedStyle is LIVE — the first run read post-blur)
- [x] Mutations ×8 caught + byte-exact reverts (md5-verified at every step; each on the REBUILT artifact; M1→P2, M2→P3, M3→P6, M4→P11, M5→P12, M6→P4+P13 (the honest two-pin catch), M7→P8, M8→P9; the final state matches the pristine md5s — button 3735b7c7…, category-card 82453209…, buy-panel c6621555…)
- [x] Full gate × 2 consecutive runs on the final code (353 + 370 × 2 = 723 per run; lint 0/0 · tsc clean · build 0; buypanel-states joins the a–c group at 174)
- [x] Post-change battery (the sweep ALL 8 ROUTES AT BASELINE byte-identical — the round's only diff is a spec file · the 64th mobile-nav token-exact · watches + census clean · screenshots 271-275 VLM 3/5 direct + 2/2 pixel-settled (272: the /90 tint +12G/+17B measurable; 275: the 1px ring the extra orange column — the r49/r51 settlement pattern))
- [x] Docs aligned (PAD v1.52 + the vintage registers; SKILL v1.52.0 + lesson 056 — L57/L58/L59; AGENTS, CLAUDE, README, the verifier recalibration 28→29 — the drift watch ALL FAMILIES GREEN; session_103.md, the worklog S52 entry, this plan's sign-offs); committed to main; pushed via the SSH wrapper
