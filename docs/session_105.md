# Session 105 — Round 53: HERO-NAV-1 — The Hero Carousel's Dot/Arrow Interaction Family: The Sweep's Second Fully-Parity Family (Byte-Identical Class Strings, Five Superset Behaviors Pinned) and the Trusted-Event + DOM-Swap Lessons (the Sweep's Eleventh Installment)

The standing round instruction: refresh the workspace (a RESET round — the
local workspace had been wiped: fresh `git clone` @ `78df1b5`, `bun install`,
the `.env` contract re-created, the hard-link DB convergence re-established,
the Playwright Chromium cache re-installed), review the docs, validate
against the codebase, audit with the repo skills (the `skills/` folder
excluded from checking/testing/compilation — re-verified in all four
configs), achieve parity with the live reference (the agent-browser walk +
the sweep battery), pay particular attention to the mobile navigation (the
Tailwind v4 trap log), keep the Stripe integration professional (demo mode
rests green without keys — the standing credential gates unchanged), keep
the vitest + playwright suites healthy, write + validate + execute a TDD
remediation plan, capture dev-server screenshots, update the docs, and push
to main via the SSH wrapper.

**Workspace state.** RESET (not a pull): the previous workspace was gone —
`git clone https://github.com/nordeim/ecommerce-store.git` @ `78df1b5` (the
session-52 ship `887803c` + the user's session_104 narrative log — the
recent-changes audit CLEAN, docs only, zero production code). The
environment rebuilt: `bun install` (475 packages), `.env` re-created from
`.env.example` (`DATABASE_URL="file:../db/custom.db"`), the hard-link DB
convergence re-established (`ln` — inode 263859 at BOTH paths; the injected
parent `.env`'s absolute URL wins and both URLs open ONE file — the
documented sandbox contract), `bun run db:setup` idempotent (12/4/4/4 + 3
hero slides), and the Playwright Chromium cache re-installed (the
fresh-clone gap). The `skills/` exclusion re-verified in all four configs.

**Baseline gate.** lint 0/0 · tsc clean · **353/353 unit+integration
(22 files)** · build exit 0 · the full E2E baseline re-run **all green —
370 chromium + the setup logins, four FILE-list invocations (a–c 174 [5.0m]
/ c–m 41 [2.2m] / n–s 77 [3.7m] / s–z 82 [2.4m] — byte-identical to the
documented round-52 ship split; the `--list` cross-check: 371 = 370 + 1
setup)** — **ZERO flakes**.

**The docs review.** AGENTS.md, CLAUDE.md, README, PAD v1.52, SKILL
v1.51.0→v1.52.0, session_103/104, remediation-plan-session52, the worklog
S52 — the repo is 52 remediation rounds deep, 723 tests, every contract
cross-validated. The skills catalog mapped: tdd (the gate-round
convention), agent-browser (the live reference walk), clone-app-pat-pro
(the parity methodology), code-review-and-audit (the lenses).

**The Round-53 live battery (pre-change, the production standalone on
:3000 via `scripts/battery-runner.sh prod`).** The paired pixel sweep
**ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec`
painted both sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%
[9 px], checkout 0.01%, account 0% [9 px], login 0.28% — byte-identical
to the documented round-42..52 baselines). **The 65th mobile-nav
verification: TOKEN-EXACT PARITY** (all 10 checks). The standing watches
clean (typeahead: the reference fires ZERO search requests; carousel
~5000ms cadence; the SEO layer: 17-URL sitemap, robots, JSON-LD,
offers.price 299.99 USD). The console census 24 routes + 11 admin CLEAN.

**The candidate triage (session-103's "suggested next" list):** the hero
carousel's dot/arrow interaction family **CHOSEN** — the sweep's eleventh
installment (the footer corners RE-DEFERRED — one repeated hover token
`text-background/60 hover:text-background` + the newsletter block carries
session-43's dedicated round; the header search-drawer RE-DEFERRED —
exhaustively pinned by session-46's 12-pin SEARCH-BEHAVIOR-1; the
credential-gated items UNCHANGED). The sweep's method applied: the
family's zones enumerated (`hero-carousel.tsx` — the prev/next arrows, the
dots + their row, the crossfade containers, the text-block rise, the
auto-advance timer + the hover-pause) + cross-checked against the E2E
layer: the INTERACTION-GATED states had near-ZERO pins (the dots' RESTING
geometry pinned by session-3; the CTA pill, the slide content, the h1
line-height, the inert slides, the hero blur register — but the arrows'
anatomy/hover/focus, the dots' active/inactive computed contract + the
width morph, the no-hover rule, the crossfade durations, the wrap-around,
the hover-pause, and the dot-click timer restart were never measured
against the reference NOR pinned).

**THE ROUND'S HEADLINE — THE SECOND FULLY-PARITY FAMILY OF THE SWEEP.**
The hero's dot/arrow family measures ALL-PARITY at the computed level —
**the arrow class string and BOTH dot class strings are BYTE-IDENTICAL on
the two sides**, every computed value identical modulo the engine
registers — with **FIVE deliberate superset behaviors** first-time
documented. The calibration (SEVEN probes — `hero-clone-r53a/b/f` (clone,
via the battery runner) + `hero-probe-r53c/d/e` (reference, login-gated;
r53e on BOTH sides via the HERO_PROBE_MODE env), live, the DOM dumps +
computed styles as the ground truth):

- **The arrows:** 40×40, inset 16px both sides, vertical-center offset 0,
  chevrons 20×20, bg white/20 (rgba vs oklab — the engine register),
  radius full, `backdrop-filter: blur(12px)`, 0.15s transition-colors, the
  REAL-mouse hover → white/30 — and **THE GLOBAL-RULE DISCOVERY**: the
  arrows' focus indication is the global `* { outline-ring/50 }` base rule
  (outline auto 1px, the primary orange at 50% alpha) IDENTICALLY on both
  sides — the first family whose focus indication is the global rule
  rather than component utilities.
- **The dots:** active 32×8 solid white `transition-all 0.3s`, inactive
  8×8 white/50, the row `gap-2`/bottom-6/centered — byte-identical
  classes both sides; the REAL-mouse no-hover negative verified BOTH
  sides; the live 8→32 width morph on click.
- **The behavioral layer:** the auto-advance cadence **5000ms PARITY**
  (the reference's re-query-polled deltas 5009/5007 vs the clone's 5005);
  the wrap-around both directions (the clone's clean reads; the
  reference's own wrap read is a DOM-swap null artifact, honestly
  documented); and **THE DOT-CLICK TIMER RESTART** — the clone's flip
  lands ~5s after the click (`go(i); startAuto()`), the reference's
  landed 403ms (NO restart — the pre-existing timer fired).
- **THE FIVE SUPERSET BEHAVIORS (deliberate, now pinned as the clone's
  own contract):** (1) the 700ms crossfade + text rise — the reference
  renders ONE slide at a time (heroImgCount 1, parent transition 0s — an
  INSTANT cut, the swap architecture session-11 noted); (2) the
  hover-pause — the reference does NOT pause on a 7s real-mouse dwell, the
  clone freezes and resumes; (3) the dot-click timer restart; (4) the
  arrows' aria-labels; (5) the dots' aria-labels + aria-current (the
  reference carries NONE — its own a11y gap).
- **SEVEN REGISTERS:** lab()/oklab(); v4's STANDALONE translate property
  (`translate: 0px -50%`) vs v3's matrix — assert centering structurally;
  the radius serialization (9999px vs 3.35544e+07px); v4's longer
  transition-colors list; the swap-vs-crossfade architecture; the pause +
  restart; the a11y gap.

**THE ROUND'S HONEST MOMENTS (four):** (1) **THE SYNTHETIC-EVENT WALL**
— r53a's `dispatchEvent(new MouseEvent("mouseover"))` reads did NOT
activate CSS `:hover` (the arrow hover read the resting /0.2) and did NOT
fire React's `onMouseEnter` (the hover-pause read `paused: false` — a
false alarm that looked like a REAL functional bug until the real-mouse
re-probe settled it): CSS pseudo-classes and React's delegated listeners
require TRUSTED pointer events — every interaction-gated read re-verified
with `page.hover()` / `page.mouse.move()`. The r52 L58 lesson (read before
teardown) EXTENDED: the EVENT ITSELF must be trusted. (2) **THE DOM-SWAP
STALENESS TRAP** — the reference swaps slides in the DOM (ONE img at a
time), so r53c's captured-`imgs` polling produced garbage cadence flips
([1002, 1602] — 601ms apart!) and a false no-pause read; the re-query
polling (r53d — re-query the DOM every poll, never hold element
references across swaps) settled the true 5000ms cadence and the true
no-pause behavior. (3) **The battery runner does NOT forward argv** —
r53e's first clone-side run silently hit the REFERENCE (the MODE arg
defaulted to "ref"; the runner invokes `node scripts/<name>` with no
args): the mode now reads the `HERO_PROBE_MODE` env var, and every
probe's target is verified from its OWN output header. (4) **The VLM
disputes settled by pixels + MY OWN DESCRIPTION ERRORS** — 277: the /0.3
hover is a +113R/+122G/+128B lightening ("grey" is the VLM's name for 30%
white over a dark photo); 279: the orange ring IS in the edge-band pixels
(26.1% warm-hued at r 21–23 — the r52 275 precedent); and 276 failed
TWICE on my GUESSED description content (first the headline, then the
photo subject) — the final description names only DOM-probed facts:
describe reality, never guess content (the r51 discipline, re-learned).

**THE DELIVERABLE (HERO-NAV-1)** — the pure gate-round form (NO honest
RED: nothing to fix; the mutation layer is the round's entire red-green
rigor):

- **`tests/e2e/heronav-states.spec.ts`** — 14 pins: P1 the structural
  arrow geometry; P2 the arrow anatomy + blur(12px); P3 the REAL-mouse
  hover /0.3 (both engine spellings); P4 the focus outline (the
  global-rule discovery — read BEFORE blur); P5 the 0.15s duration; P6
  the active dot; P7 the inactive dot; P8 the row; P9 the live width
  morph + aria-current; P10 the no-hover negative; P11 the crossfade
  durations (the superset contract); P12 the wrap-around; P13 the
  hover-pause (the superset contract); P14 the aria superset. 15/15 green
  on the current artifact (14 pins + the setup login).
- **NO production code changes** — the round's only diffs: the new spec +
  the docs + the plan (the seven registers are the audit's documented
  output).

**Mutations ×8, each caught at the E2E layer on the REBUILT artifact (the
session-36 lesson), byte-exact reverts (md5-verified at every step; the
final state matches the pristine md5 — hero-carousel `03d4a444…`):** M1
the resting bg /20→/30 → **exactly P2+P3** (the honest pair — the resting
read is in both); M2 the hover /30→/40 → **exactly P3**; M3 the blur
dropped → **exactly P2**; M4 the geometry h-10→h-9 → **exactly P1**; M5
the active w-8→w-6 → **exactly P6+P9**; M6 duration-300→150 → **exactly
P6+P7** (the honest two-pin catch); M7 the crossfade 700→500 → **exactly
P11**; M8 the pause handler dropped — **THE BEHAVIORAL MUTATION** — →
**exactly P13** (the superset contract pin catches its own machinery).

**Full gate:** lint 0/0 · tsc clean · 353/353 unit (22 files) · build 0 ·
**the FULL E2E 384 + 384 × 2 consecutive runs on the final code (each run
as four FILE-list invocations: a–c 188 [5.6m — heronav-states joined the
a–c group], c–m 41 [2.2m], n–s 77 [3.7m], s–z 82 [2.3m]) — 737 per run
(353 unit + 384 E2E)**.

**Post-change battery:** the sweep re-run **ALL 8 ROUTES AT BASELINE
(byte-identical — the round's only diff is a spec file)**; the **66th
mobile-nav verification** re-run TOKEN-EXACT (the 65th and 66th in one
round); the watches + census clean.

**Screenshots 276-280** (probe-first, single invocation, the production
standalone on :3001 — a FRESH process, ZERO DB mutations by construction):
the control layer at rest (the arrows + the dots in one frame); the prev
arrow hovered (the /0.3 tint); the dot row with dot 3 activated (the 32px
pill + the 8px inactives); the arrow focused (the ring/50 outline — the
re-capture on a pointer-clean page after the first capture's
mouse-tainted state read outline-style none); the crossfade
mid-transition (two slides at 0.62/0.38 opacity — the superset's
signature). **VLM 3/5 direct + 2 pixel-settled + 2
corrected-description** (277 + 279 by the programmatic measurement; 276 +
  278 by the corrected descriptions — 278's dots sit on the bright
third-slide photo, the low-contrast context named explicitly).

**Docs:** PAD **v1.53** (the v1.53 revision row; §8.1's heronav-states row
+ the Total row 53/737/353+384; §8.4's checklist 384; §3.2's tree 30 specs
+ the heronav-states entry + 53 plans; the header's Last-Updated
session-53 tag), SKILL **v1.53.0** (the version; §11's counts 384/30; the
line-31 session pointer; Appendix C → session53 + **lesson 057** — L60 the
synthetic-event wall, L61 the DOM-swap staleness trap, L62 the
battery-runner argv gap, L63 the VLM settlement + the describe-reality
discipline), AGENTS (the heronav bullet + the registers + the
trusted-event discipline), CLAUDE (the E2E row's family + 384), README
(the 737 row + the 357→384 Playwright fix + the Testing table + the
mobile-nav 65/66 row + the File Hierarchy's 30/384), the verifier's
spec-count recalibration 29→30 — **the drift watch re-run ALL FAMILIES
GREEN**, this log, the worklog S53 entry, the plan's sign-offs;
`.env.example` verified current (no env plumbing this round).

## Round 53 shipped ✅
**Session complete** — the baseline 723-test gate verified on the FRESH
CLONE (the workspace-reset round: the environment rebuilt, the hard-link
convergence re-established at inode 263859, the Chromium cache
re-installed); the Round-53 battery (sweep + the 65th mobile-nav + watches
+ census) all clean pre-change and re-verified post-change.
**The deliverable: HERO-NAV-1** — the hero carousel's dot/arrow
interaction family, the customer-surfaces pin-density sweep's eleventh
installment: **the sweep's SECOND FULLY-PARITY FAMILY** (the arrow + dot
class strings byte-identical both sides, every computed value identical
modulo the engine registers) + the FIVE superset behaviors first-time
pinned as the clone's own contract (the crossfade, the hover-pause, the
dot-click timer restart, the arrows'/dots' aria layer) + the
global-rule focus discovery + the 14-pin spec + the seven registers.
**Gate: 737 tests per run** (353 unit + 384 E2E × 2 consecutive runs),
octuple-mutation-proven (M8 the honest BEHAVIORAL catch), sweep at
baseline byte-identical, the 65th + 66th mobile-nav token-exact, VLM 3/5
direct + 2 pixel-settled + 2 corrected-description (276-280).
**New lessons:** (1) the synthetic-event wall — dispatchEvent'd
MouseEvents activate neither :hover nor React's onMouseEnter (the r53a
false-alarm that looked like a real pause bug); (2) the DOM-swap
staleness trap — re-query every poll, never hold element references
across a swapping DOM; (3) the battery runner does not forward argv —
env-var modes + self-identifying probe headers; (4) describe reality,
never guess content — my own 276 description failed twice on guessed
content before the DOM-probed facts passed.
**Suggested next:** the sweep's twelfth installment (the footer's
interaction corners — the one-hover-token family; the account
order-detail's deep-remaining corners; the announcement bar's
scroll-marquee behavior), or the standing credential-gated items (Stripe
test-mode keys — the refund SDK path live; an email provider — the
guest-order merge-back). Just send the next round instruction when ready.
