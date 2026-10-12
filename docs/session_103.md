# Session 103 — Round 52: BUY-PANEL-1 — The PDP Buy-Panel Action Family: The Sweep's First Fully-Parity Family (Zero Production Divergence), the Accent-Token Pair Pinned for the First Time, and the Button-Vintage Registers (the Sweep's Tenth Installment)

The standing round instruction: refresh the workspace (a RESET round — the
local workspace had been wiped: fresh `git clone` @ `8ff1129`, `bun install`,
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
`git clone https://github.com/nordeim/ecommerce-store.git` @ `8ff1129` (the
session-51 ship `c51d0d6` + the user's session_102 narrative log — the
recent-changes audit CLEAN, docs only, zero production code). The
environment rebuilt: `bun install` (475 packages), `.env` re-created from
`.env.example` (`DATABASE_URL="file:../db/custom.db"`), the hard-link DB
convergence re-established (`ln` — inode 134870 at BOTH paths; the injected
parent `.env`'s absolute URL wins and both URLs open ONE file — the
documented sandbox contract), `bun run db:setup` idempotent (12/4/4/4 + 3
hero slides), and the Playwright Chromium cache re-installed (the
fresh-clone gap that failed the FIRST E2E invocation's setup login —
`browserType.launch: Executable doesn't exist` — fixed by
`bunx playwright install chromium`). The `skills/` exclusion re-verified in
all four configs.

**Baseline gate.** lint 0/0 · tsc clean · **353/353 unit+integration
(22 files)** · build exit 0 · the full E2E baseline re-run **all green —
357 chromium + the setup logins, four FILE-list invocations (a–c 189 in the
11-file form / c–m 13 / n–s 77 / s–z 82; the documented a–c 161 + c–m 41
split reconstructed via per-file `--list` and verified: 160+40+76+81 =
357)** — **ZERO flakes** (the round-51 wishlist aria-flip settle verified
at scale).

**The docs review.** AGENTS.md, CLAUDE.md, README, PAD v1.51, SKILL
v1.51.0, session_101/102, remediation-plan-session51, the worklog S51 —
the repo is 51 remediation rounds deep, 710 tests, every contract
cross-validated. The skills catalog mapped: tdd (the gate-round
convention — this round takes the FIXLESS form: pins + the doubled
mutation rigor), agent-browser (the live reference walk), clone-app-pat-pro
(the parity methodology — the DOM probe + the computed style are the ground
truth), code-review-and-audit (the lenses).

**The Round-52 live battery (pre-change, the production standalone on
:3000 via `scripts/battery-runner.sh prod`).** The paired pixel sweep
**ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec`
painted both sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%
[9 px], checkout 0.01%, account 0% [9 px], login 0.28% — byte-identical
to the documented round-42..51 baselines). **The 63rd mobile-nav
verification: TOKEN-EXACT PARITY** (all 10 checks). The standing watches
clean (typeahead: the reference fires ZERO search requests; carousel
~5000ms cadence; the SEO layer: 17-URL sitemap, robots, JSON-LD,
offers.price 299.99 USD). The console census 24 routes + 11 admin CLEAN.

**The candidate triage (session-101's "suggested next" list):** the PDP
buy-panel's action family **CHOSEN** — the sweep's tenth installment (the
shop empty-state corners RE-DEFERRED — carries a session-3 pin; the
account order-detail's deep-remaining surfaces RE-DEFERRED — carries a
dedicated round; the credential-gated items UNCHANGED). The sweep's
method applied: the action row's zones enumerated (`buy-panel.tsx` — the
stepper container + minus/plus, the qty span, the ATC Button, the
outline-heart Button; plus `button.tsx`'s vintage anatomy) + cross-checked
against the E2E layer: the INTERACTION-GATED states had near-ZERO pins
(the heart's px-8/82px + svg classes pinned by session-5; the stepper
BOUNDARY states by session-49; the heart's ACTIVE red by wishlist.spec —
but the ATC's full computed anatomy [the bare `shadow` under v4, the
hover /90, the focus ring], the heart's hover states, the stepper hovers,
the qty span, the transition durations, and the accent token at its
RESTING sites were never measured against the reference NOR pinned).

**THE ROUND'S HEADLINE — THE FIRST FULLY-PARITY FAMILY OF THE SWEEP.**
After five consecutive rounds of real fixes (r47 ×2, r48 ×3, r49 ×4, r50
×1, r51 ×1), the buy-panel family measures ALL-PARITY on both sides:
**zero production divergence** — the honest finding, and the proof the
sweep is converging. The calibration (SEVEN probes —
`buypanel-clone-r52a/f` (clone, via the battery runner) +
`buypanel-probe-r52b/c/d/e/g` (reference — the last LOGGED-OUT for the
auth buttons), live, the DOM dumps + computed styles as the ground truth):

- **The geometry:** the action row byte-identical (stepper 130×42, heart
  82×40, the ATC the flex-1 absorber = row − 130 − 82 − 32; both sides
  456px at 1024).
- **The ATC:** the full anatomy parity — bg primary, radius 12, 14px/500,
  gap 8, the svg 16px, cursor pointer, and the bare-`shadow` visible pair
  (`rgba(0,0,0,0.1) 0px 1px 3px 0px` + `0px 1px 2px -1px`) — **v4's bare
  `shadow` KEPT v3's value** (the scale shift only touched the NAMED steps
  below it, and the globals.css `--shadow-sm` pin covers those); the hover
  /90 (rgba vs lab — the engine register); the focus ring `rgb(230,107,26)
  0px 0px 0px 1px` (ring-1 ring-ring = the --ring token = the primary
  orange, BOTH buttons).
- **THE ACCENT PAIR, pinned for the first time:** the reference's accent =
  **rgb(253,243,237)** (hsl(24 80% 96%)) + accent-foreground =
  **rgb(138,64,15)** (hsl(24 80% 30%)) — verified at FOUR families (the
  heart hover, the home feature tiles, the category tiles, the Radix
  Select item highlight). The clone's tokens are IDENTICAL.
- **The stepper family:** the container 130×42 (border, radius 12), the
  minus/plus `p-3 hover:bg-secondary` with hover bg rgb(242,240,237), the
  qty span 16px/500 / px-5 / min-w 3rem — byte-identical both sides.
- **SIX VINTAGE/ENGINE REGISTERS (rendered-identical, documented):**
  (1) **py-2** — the clone's `defaultVariants.size` ships `h-9 px-4 py-2`,
  so the h-10 heart/ATC compute padding 8px 32px vs the reference's 0px
  32px (its heart call ships NO size classes — the reference's Button has
  no defaultVariants.size and its own call sites are inconsistent: the
  login submit carries px-4 py-2, the heart nothing); (2) **gap-2** — the
  reference's base carries it, the clone's does not (inert: single-child
  buttons or explicit gap classes — a census of 66 usages); (3) v4's
  4-vs-2 zero shadow layers; (4) v4's longer transition-colors list; (5)
  lab() alpha serialization; (6) the transparent-outline vs
  outline-none invisible pair.

**THE ROUND'S HONEST MOMENTS (four):** (1) **The same-element-collision
locator trap** — r52c's first heart-hover read used a page-wide
`main button` + lucide-heart + `.last()` locator, which hit a
RELATED-PRODUCT CARD heart (the PDP carries THREE heart populations: the
buy-panel heart + the related-cards' hearts + the wishlist page's): the
card heart's hover:bg-background is the BACKGROUND token
rgb(251,250,249), so the read looked like a genuine accent-token
divergence (#FBFAF9 vs #FDF3ED — a real-looking finding!) until the
action-row-scoped re-measure (r52d §B) settled it: the reference's accent
IS rgb(253,243,237), identical to the clone. The r51 wrong-ancestor
lesson EXTENDED: not just the wrong ANCESTOR — the wrong SAME-ELEMENT
POPULATION; scope probe reads to the target's own subtree. (2) **The
reference's own Button vintages are INCONSISTENT** (r52g, logged-out):
the login submit's base = `gap-2 whitespace-nowrap rounded-md text-sm` +
`px-4 py-2`; the Google button's = `gap-2 whitespace-nowrap rounded-md`
(text-sm in className); the heart's = `gap-2 whitespace-nowrap text-sm
font-medium` (NO size classes); the shopfilter Clear's (r50) = no gap-2,
no text-sm. Chasing base-class identity against a reference this
inconsistent is not well-defined — pin the COMPUTED contract, register
the vintage differences. (3) **getComputedStyle returns a LIVE object** —
the ring pins' first run read `cs.boxShadow` AFTER `el.blur()` and got
the RESTING shadow (2 failed → fixed by reading the string into a local
before the teardown). (4) **The VLM disputes settled by pixel
measurement** (the r49/r51 pattern): 272 — the VLM saw "solid resting
orange" on the hovered capture, but the /90 tint IS present (the ATC
center measures rest rgb(235,138,75) vs hovered rgb(237,150,92) — a
+12G/+17B lightening the VLM cannot see without a side-by-side); 275 —
the VLM saw "no focus ring", but the 1px ring renders as the extra
orange column at the button's edge (the edge detector: x=486 focused vs
x=485 resting — the halo column is in the pixels).

**THE DELIVERABLE (BUY-PANEL-1)** — the pure gate-round form (NO honest
RED: nothing to fix; the mutation layer is the round's entire red-green
rigor, doubled for exactly that reason):

- **`tests/e2e/buypanel-states.spec.ts`** — 13 pins: P1 the structural
  row geometry (viewport-independent — the r51 lesson); P2 the ATC
  anatomy + the shadow pair (substrings — the zero-layer register); P3
  the ATC hover /90 (both engine spellings); P4 the ATC focus ring
  (script focus on a pointer-clean page — the r52e method, read BEFORE
  blur); P5 the heart anatomy; P6 **THE ACCENT PAIR** at hover; P7 the
  stepper container; P8 the stepper hovers (minus AND plus); P9 the qty
  span; P10 the 0.15s transition durations; P11 the accent at rest (the
  feature tile); P12 the accent-foreground at rest (the category tile);
  P13 the heart's focus ring. 14/14 green on the current artifact (13
  pins + the setup login).
- **NO production code changes** — the round's only diffs: the new spec
  + the docs + the plan (the six registers are the audit's documented
  output).

**Mutations ×8, each caught at the E2E layer on the REBUILT artifact (the
session-36 lesson), byte-exact reverts (md5-verified at every step; the
final state matches the pristine md5s — button 3735b7c7…, category-card
82453209…, buy-panel c6621555…):** M1 the ATC's `shadow` dropped →
**exactly P2**; M2 `hover:bg-primary/90` → `/80` → **exactly P3**; M3 the
heart's `hover:bg-accent` → `hover:bg-secondary` → **exactly P6**; M4 the
feature tile's `bg-accent` → `bg-secondary` → **exactly P11**; M5 the
category icon's `text-accent-foreground` → `text-muted-foreground` →
**exactly P12**; M6 the base's `focus-visible:ring-1` dropped → **P4 +
P13** (the honest two-pin catch); M7 the minus's `hover:bg-secondary` →
`hover:bg-accent` → **exactly P8**; M8 the span's `font-medium` →
`font-normal` → **exactly P9**.

**Full gate:** lint 0/0 · tsc clean · 353/353 unit (22 files) · build 0 ·
**the FULL E2E 370 + 370 × 2 consecutive runs on the final code (each run
as four FILE-list invocations: a–c 174 [5.0m — buypanel-states joined the
a–c group], c–m 41 [2.2m], n–s 77 [3.7m], s–z 82 [2.4m]) — 723 per run
(353 unit + 370 E2E)**.

**Post-change battery:** the sweep re-run **ALL 8 ROUTES AT BASELINE
(byte-identical — the round's only diff is a spec file)**; the **64th
mobile-nav verification** re-run TOKEN-EXACT (the 63rd and 64th in one
round); the watches + census clean.

**Screenshots 271-275** (probe-first, single invocation, the production
standalone on :3001 — a FRESH process, ZERO DB mutations by construction
— hover/focus states are CSS-only): the action row at rest (the full
family in one frame); the ATC hovered (the /90 tint); the heart hovered
(THE ACCENT PAIR — the round's key parity confirmation); the stepper's
minus hovered (the secondary tint + the qty span); the ATC focused (the
orange ring). **VLM 3/5 direct + 2/2 pixel-settled** (272 and 275 via the
programmatic measurement — the r49/r51 reconciliation pattern).

**Docs:** PAD **v1.52** (the v1.52 revision row; §8.1's buypanel-states
row + the Total row 52/723/353+370; §8.4's checklist 370; §3.2's tree 29
specs + the buypanel-states entry + 52 plans; the header's Last-Updated
session-52 tag), SKILL **v1.52.0** (the version; §11's counts 370/29; the
line-31 session pointer; Appendix C → session52 + **lesson 056** — L57
the same-element-collision locator trap, L58 the live getComputedStyle
object, L59 the sub-perceptual VLM settlement), AGENTS (the buypanel
bullet + the registers), CLAUDE (the E2E row's family + 370), README (the
723 row + the Testing table + the mobile-nav 63/64 row + the File
Hierarchy's 29/370), the verifier's spec-count recalibration 28→29 — **the
drift watch re-run ALL FAMILIES GREEN**, this log, the worklog S52 entry,
the plan's sign-offs; `.env.example` verified current (no env plumbing
this round).

## Round 52 shipped ✅
**Session complete** — the baseline 710-test gate verified on the FRESH
CLONE (the workspace-reset round: the environment rebuilt, the hard-link
convergence re-established, the Chromium cache re-installed); the
Round-52 battery (sweep + the 63rd mobile-nav + watches + census) all
clean pre-change and re-verified post-change.
**The deliverable: BUY-PANEL-1** — the PDP buy-panel action family, the
customer-surfaces pin-density sweep's tenth installment: **the sweep's
FIRST FULLY-PARITY FAMILY** (zero production divergence — the honest
headline after five fix rounds) + the accent-token pair pinned for the
first time (rgb(253,243,237)/rgb(138,64,15) at four families) + the
13-pin spec + the six Button-vintage/engine registers (py-2, gap-2, the
zero-layer count, the transition list, lab(), the invisible outline).
**Gate: 723 tests per run** (353 unit + 370 E2E × 2 consecutive runs),
octuple-mutation-proven, sweep at baseline byte-identical, the 63rd +
64th mobile-nav token-exact, VLM 3/5 direct + 2/2 pixel-settled (271-275).
**New lessons:** (1) the same-element-collision locator trap — a page-wide
`.last()` heart probe hit a related-card heart whose hover token is the
BACKGROUND, producing a real-looking false accent divergence for one
probe cycle (the r51 ancestor lesson extended to element populations);
(2) a reference whose own component call sites are inconsistent cannot be
class-string-pinned — pin the computed contract, register the vintage
differences; (3) getComputedStyle is LIVE — read before any state
teardown; (4) sub-perceptual differences (a ~5% tint, a 1px halo) settle
by pixel measurement, never VLM adjectives.
**Suggested next:** the sweep's eleventh installment (the footer's
deep-remaining interaction corners; the header's search-drawer family;
the hero carousel's dot/arrow interaction states), or the standing
credential-gated items (Stripe test-mode keys — the refund SDK path
live; an email provider — the guest-order merge-back). Just send the
next round instruction when ready.
