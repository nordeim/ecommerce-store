# Session 119 — Round 60 (PDPTABS-STATES-1) — the narrative log

I'll start by refreshing the workspace and reviewing the referenced documents, then set up the round's plan.

The workspace was a FRESH-CLONE round: the sandbox was reset — `git clone https://github.com/nordeim/ecommerce-store.git` at `641aa81` (the r59 ship `0243096` + the user's session_118 narrative log, docs only). The environment rebuilt end-to-end: bun install (476 packages), the `.env` from `.env.example` with `DATABASE_URL="file:../db/custom.db"`, `bun run db:setup` (6 categories / 12 products / 4 users / 4 orders / 3 hero slides), Playwright Chromium 1243. The parent-injection shadow trap fired on cue (`bun -e` read `file:/home/z/my-project/db/custom.db` — the parent `.env` wins) — converged via the documented hard-link DB (inode 434979 both paths).

The core docs reviewed: AGENTS.md (the commands, the trap log, the family contracts), CLAUDE.md (the six-phase workflow), README.md (the architecture + quick start), the PAD's revision ledger + test ledger, the SKILL's lessons 061-063, `docs/session_117.md` (the round-59 narrative), `docs/remediation-plan-session59.md`, the worklog's S58/S59 tails, `docs/session_118.md` (the round-59 agent log). The skills consulted per the catalog: tdd (the honest-RED form), agent-browser (the L81-L84 probe conventions), tailwind-patterns (the engine registers). The skills/ exclusion verified in all four configs (vitest allowlists src/**+tests/**; playwright's testDir ./tests/e2e).

The baseline gate, fast layers first: lint 0/0 ✓ · tsc clean ✓ · 356/356 unit+integration (23 files) ✓. The production build exit 0. Then the full E2E baseline as four FILE-list invocations (a–c 193 / c–m 64 / n–q 74 / s–z 140 = 471, zero flakes) — byte-identical to the r59 ship state.

The pre-change battery (the production standalone on :3000): the paired pixel sweep ALL 8 ROUTES AT BASELINE BAND (home 0% [6 px, slide `1237b9a1afec` painted both sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0% [9 px], checkout 0.01%, account 0% [9 px], login 0.28%); the 79th mobile-nav verification TOKEN-EXACT (all 11 token checks); the standing watches clean (typeahead ref 0 search requests; carousel [4000, 9000, 14000]; sitemap/robots/JSON-LD); the console census clean (24 routes + 11 admin).

**The Round-60 audit — the PDP tabs' interaction states** (session-117/118's standing suggested next — the sweep's eighteenth installment; the resting sweep captures the PDP at the default Description tab only). The first probe generation (r60a) hit the L84 viewport-clamp trap on cue — the tablist sits at y=754 on a 768px viewport, the raw-coordinate click at y≈772 clamped and hit NOTHING (the "inert click" read was the instrument, not the app). r60a2 re-ran with the scroll discipline: the reference's tabs DO switch on a real click.

The clone side (r60b) — and the first big finding: **the clicked trigger paints a focus ring on the clone** (the settled boxShadow carries 2px background + 4px orange layers; `matches(":focus-visible")` TRUE) where the reference paints NONE. The account differential (r60c/r60d) confirmed it on the account surface too — AND reversed the class-string finding: the reference renders TWO tabs variants (the PDP form: NO `overflow-x-auto` on the list, NO `gap-2` on the triggers; the ACCOUNT form: both present, the gap-2 pairing with its lucide icons) — the clone's ONE component carried the account variant's classes on both pages.

**THE MECHANISM HUNT (r60e — the instrumented both-sides probe):** `HTMLElement.prototype.focus` patched + a focusin listener on both sites. The reference's mousedown: NATIVE focusin only (matchesFV false). The clone's mousedown: a SCRIPT-FOCUS (the stack pointing into the React chunk) then focusin with matchesFV TRUE. The upstream source: `@radix-ui/react-tabs` ^1.1.12's Trigger mousedown handler calls `event.currentTarget.focus()` (added for Safari's no-focus-on-mousedown) — and Chrome matches a script focus issued during a mousedown dispatch against `:focus-visible` → the ring paints. The reference's older Radix lets the browser focus natively — no match, no ring; the activation lands via Radix's `onFocus` auto-activation at the same mousedown instant.

**THE FIX'S DOM-MECHANICS EXPERIMENT (before writing the fix):** a standalone page with a React-delegation-style root-capture listener — `stopPropagation` at capture stops the bubble handlers (the script focus never runs) while the browser's default action STILL focuses the button natively (activeIsBtn TRUE, matchesFV FALSE). The mechanism validated, the fix designed: a capture-phase mousedown guard in ui/tabs.tsx.

The remediation plan written (docs/remediation-plan-session60.md) + validated against the codebase (the ui/tabs class strings, the account-tabs' icon children, the Radix source lines, the two-consumer grep).

**The pin spec — tests/e2e/pdptabs-states.spec.ts (14 pins), the honest-RED form.** Three instrument iterations during the calibration (the honest audit of my own pins): the P6 network count caught the related-products Link prefetches (`?_rsc=` — the registered superset, filtered with the register documented); the walk cap raised 40 → 60 (the census measured 41 steps at 1280×720); **THE L89 DISCOVERY** — the spread-parse regex captured the FIRST `0px` of every box-shadow layer, mapping every spread to 0 and making the ring asserts TAUTOLOGIES (they passed against the UNFIXED clone — only the `matches(":focus-visible")` assert was live). The anchor moved to the string's end; the teeth restored.

The honest RED: exactly the 4 calibrated REDs (P1 overflowX auto ≠ visible; P2 the class strings; P7 the clicked trigger's :focus-visible TRUE + the ring spreads; P13 the account's same) + 10 GREEN.

**The fixes:** the capture-phase mousedown guard in ui/tabs.tsx (the full why commented in the source) + the variant split (the base becomes the PDP form; account-tabs appends `overflow-x-auto`/`gap-2` via className — the merged account strings byte-match the reference's account variant). The GREEN: 15/15 in 33.6s. The immediate regression net (the tab-clicking specs): 102 passed.

**The mutation battery ×8:** ALL CAUGHT, byte-exact restores — M1 the guard dropped → exactly P7+P13 · M2/M3 the base reverts → P1+P2 / P2 · M4/M5 the account overrides dropped → P12 · M6 the shadow dropped → P2+P3+P7+P13 · M7 the bg dropped → P2+P3 · M8 the mt-6 dropped → P4.

The full gate ×2: 481 E2E per invocation-set (a–c 193 / c–m 64 / n–q 88 — pdptabs joined at 7 files / s–z 140) — ×2 consecutive, zero flakes; the counted total **837 = 356 unit + 481 E2E**.

The post-change battery: sweep 8/8 AT BASELINE byte-identical (the fixes are computed-only — the PDP's overflow-x/gap deltas paint nothing, the account's computed set is UNCHANGED); the 80th mobile-nav TOKEN-EXACT; watches + census clean.

The screenshots 311–315 (probe-first, :3001, read-only): the resting tablist (overflowX visible verified at capture), the Reviews panel swap (the clicked trigger m:false, spreads [0,0,0,0] — the headline's proof), the clicked-trigger crop, the keyboard-focused trigger (m:true, spreads [0,0,2,4] — the two-sided truth), the account variant (gap 8 + iconTextGap 8 verified at capture).

The VLM verification: 5/5 PASS after ONE description-side settle (the first 315 dispute was MY description's error — an avatar claimed in the account heading where the "My Account" h1 lives; the DOM-probed facts were already verified live; the r59 discipline: the VLM is a cross-check, the probes are the ground truth).

The docs duty: PAD v1.60 (the revision row + the Total 60/837/356+481 + the family row + the checklist 481/37 + §3.2's 37 specs), the verifier recalibration 36→37 re-run ALL FAMILIES GREEN, SKILL v1.60.0 (lesson 064 — L89/L90/L91), AGENTS.md (the tabs family bullet), CLAUDE.md + README.md (the count rows). The plan's §6 execution record filled.

The commit + the push: the verification gate green → the SSH wrapper protocol (the key materialized outside the repo, the sanity parse, the dry-run, the real push to main, the remote verify, the key shredded).

**Round 60 delivered — PDPTABS-STATES-1** — the sweep's eighteenth installment: THREE reference-measured fixes (the clicked-trigger ring via the capture-phase guard restoring the reference's native-focus path; the PDP/account variant split), pinned by 14 pins, octuple-mutation-proven.

**Gate: 837 tests per run** (356 unit + 481 E2E), sweep at baseline byte-identical pre- AND post-change, the 79th + 80th mobile-nav token-exact, VLM 5/5 (311-315).

**Next round options:** the sweep's nineteenth installment (the search popover's row hover/focus states — the superset's own deep states, re-deferred three rounds; the PDP description-tab's key-features list states), or the standing credential-gated items (Stripe test-mode keys — the refund loop and the Payment Element flow are built and waiting; an email provider — the verification gate's console seam is ready).
