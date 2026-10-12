# Session 101 — Round 51: CARD-HOVER-1 — The Product Card's Hover Family: The v4 Blur-Scale Trap Fix (the --blur-sm Pin), the Full Hover-Contract Pin Family, and the Wrong-Ancestor Hover Lesson (the Sweep's Ninth Installment)

The standing round instruction: refresh the workspace, review the docs,
validate against the codebase, audit with the repo skills (the `skills/`
folder excluded from checking/testing/compilation — re-verified in all
four configs), achieve parity with the live reference (the
agent-browser walk + the sweep battery), pay particular attention to
the mobile navigation (the Tailwind v4 trap log), keep the Stripe
integration professional (demo mode rests green without keys — the
standing credential gates unchanged), keep the vitest + playwright
suites healthy, write + validate + execute a TDD remediation plan,
capture dev-server screenshots, update the docs, and push to main via
the SSH wrapper.

**Workspace state.** PULL this round (not reset) — `git pull`
fast-forwarded `eff4371..554e7b8` (the user's session_100 narrative
log, docs only — the recent-changes audit CLEAN, zero production code);
the environment survived intact (node_modules, `.env` with
`DATABASE_URL="file:../db/custom.db"`, `db/custom.db` with the
hard-link convergence at inode 397471 at both paths, the Playwright
Chromium cache). The `skills/` exclusion re-verified in all four
configs.

**Baseline gate.** lint 0/0 · tsc clean · **353/353 unit+integration
(22 files)** · build exit 0 · the full E2E baseline re-run **349 per
invocation (345 chromium + the setup login; four FILE-list
invocations: a–c 149 [3.9m], c–m 41 [2.2m], n–s 77 [3.7m], s–z 82
[2.6m — ONE honest flake])**. The flake: `wishlist.spec.ts:86`
("persists across reloads") failed in the s–z invocation, passed
isolated AND in the clean group re-run — a click→reload in-flight-fetch
race (the click resolves at dispatch; the server write lands later;
the reload beat the write). Diagnosed and scheduled as the round's
test-authoring fix.

**The docs review.** AGENTS.md, CLAUDE.md, README, PAD v1.50, SKILL
v1.50.0, session_99/100, remediation-plan-session50, the worklog S50 —
the repo is 51 remediation rounds deep, 698 tests, every contract
cross-validated. The skills catalog mapped: tdd (the gate-round
convention — this round takes the honest RED → GREEN path),
agent-browser (the live reference walk), clone-app-pat-pro (the parity
methodology — the DOM probe + the computed style are the ground
truth), code-review-and-audit (the lenses).

**The Round-51 live battery (pre-change, the production standalone on
:3000 via `scripts/battery-runner.sh prod`).** The paired pixel sweep
**ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec`
painted both sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%
[9 px], checkout 0.01%, account 0% [9 px], login 0.28% — byte-identical
to the documented round-42..50 baselines). **The 61st mobile-nav
verification: TOKEN-EXACT PARITY** (all 10 checks). The standing
watches clean (typeahead: the reference fires ZERO search requests;
carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots,
JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11
admin CLEAN.

**The candidate triage (session-99/100's "suggested next" list):** the
product-card hover family **CHOSEN** — the sweep's ninth installment
(the shop empty-state corners RE-DEFERRED — carries a session-3 pin;
the account order-detail surfaces RE-DEFERRED — carries a dedicated
round; the credential-gated items UNCHANGED). The sweep's method
applied: the card's hover-reachable states enumerated
(`src/components/store/product-card.tsx` — the group container's
shadow lift, the image zoom, the title color, the slide-up Add bar's
hidden/revealed anatomy, the heart button's states, the badge stack,
the info block) + the OTHER backdrop-blur sites (`layout.tsx`'s
header, `hero-carousel.tsx`'s badge + arrows) cross-checked against
the E2E layer: the interaction states had near-ZERO pins (HOVER-GATE-1
at storefront-parity:405 pins the media-gate trap's two states under
touch only; wishlist.spec:29 pins the heart's color states;
cart.spec:83 pins the slide-up click flow — but the shadow lift's
computed layers, the zoom, the title's hovered color, the addbar's
transforms, the heart's blur, the badges' anatomy, and the header/hero
blur sites were never measured against the reference NOR pinned).

**THE AUDIT'S STRUCTURAL FINDING (the fifth consecutive round):** the
card's hover states are INTERACTION-GATED — the resting pixel sweep
captures /shop with NO hover, so the shadow lift, the zoom, the orange
title, and the revealed Add bar never render at rest. AND the round's
sharper finding: the ONE resting-visible divergence — the heart's
backdrop blur — is **SUB-TOLERANCE** for every pixel instrument: a
4px-vs-8px gaussian behind a 36px disc over photographic content
shifts individual channels well under the sweep's 12-per-channel
threshold (the /shop band never moved across 50 rounds, and the
hovered-card element diff reads 0.129% before AND after the fix). The
ONLY instrument that sees it is the computed-style probe.

**The calibration (FIVE probes — `scripts/cardhover-probe-r51.mjs` +
`cardhover-probe-r51b.mjs` + `cardhover-probe-r51d.mjs` (reference,
login-gated) + `cardhover-clone-r51c.mjs` + `cardhover-clone-r51e.mjs`
(clone side, via the battery runner) + the browser-canvas pixel differ
`pix-diff-r51.mjs`, live, the DOM dumps + computed styles as the ground
truth):**

- **ONE parity divergence — the heart's backdrop blur:** the reference
  renders **blur(4px)** (v3's `backdrop-blur-sm`; the class string
  `backdrop-blur-sm` byte-exact on both sides); the clone rendered
  **blur(8px)** — Tailwind v4 RENAMED the blur scale (the old `blur`
  8px became `sm`, a new `xs` 4px was added, md+ unchanged). The
  complete blur census: exactly ONE `*-blur-sm` site exists (the card
  heart); the header's `backdrop-blur-xl` = blur(24px) both sides
  (unchanged by v4); the hero badge + both carousel arrows'
  `backdrop-blur-md` = blur(12px) both sides (unchanged).
- **The parity confirmations:** the container's shadow lift — the
  visible shadow-xl pair byte-identical both sides
  (`rgba(0,0,0,0.1) 0px 20px 25px -5px` + `0px 8px 10px -6px`; v4
  prefixes two zero-layers — the ring/inset vars serialized as zeros);
  the resting shadow-sm/border/bg/transition contract byte-identical;
  the zoom (v3 `matrix(1.05,…)` vs v4's `scale: 1.05` spelling — the
  HOVER-GATE-1 register; 0.5s both); the title (foreground → primary
  rgb(230,107,26), 0.15s both); the addbar (hidden v3
  `matrix(1,0,0,1,0,56)` = translateY(100%) vs v4's `translate: 0px
  100%` — the same 56px offset; revealed identity both; the wrap's
  class string byte-exact); the Add button's full anatomy (32px,
  12px/500, radius 12px, gap 8px, the 16px svg via `[&_svg]:size-4`,
  shadow-lg's visible pair, hover /90 — the `gap-2` class position
  differs, order-only, computed-identical); the heart's states (36px,
  /80, the muted svg rgb(111,111,123) 16px fill none, hover 100%); the
  badges (Best Seller + the -25% at destructive rgb(239,67,67) /
  foreground rgb(250,250,250) — #FAFAFA); the info block.
- **The hovered-card cross-side pixel diff:** 0.129% (109/84,298,
  same-size; the resting pair 0.109%) — the hover adds ~17px; the
  fix's blur difference is sub-tolerance (invisible to the diff both
  before and after — the honest instrument finding).

**THE DELIVERABLE (CARD-HOVER-1)** — ONE production fix + one
test-authoring fix + 12 E2E pins:

- **Fix #1 (the v4 blur-scale trap — globals.css form):** the `@theme`
  block gained `--blur-sm: 4px;` — the `--shadow-sm` pin's exact
  pattern (trap log #8 in the validation report's appendix + the
  globals.css header comment). The class strings stay byte-exact on
  BOTH sides while the computed value returns site-wide; every future
  `backdrop-blur-sm`/`blur-sm` usage inherits v3's 4px automatically.
  NO component changes.
- **Fix #2 (test-authoring):** `wishlist.spec.ts:86` — the aria-flip
  wait inserted between the ADD click and the reload (the store's
  toggleWishlist awaits the action before flipping the label, so the
  flipped "Remove …" label proves the DB write landed — the baseline's
  honest flake made deterministic).
- **`tests/e2e/cardhover-states.spec.ts`** — 12 pins: P1 the heart's
  blur 4px (the honest RED); P2 the hovered shadow-xl pair + radius
  16px; P3 the resting contract (shadow-sm layer, border 1px/50%, bg
  white, all 0.3s cubic-bezier(0.4,0,0.2,1)); P4 the zoom (resting
  none, hovered scale 1.05, 0.5s); P5 the title (foreground → primary,
  0.15s); P6 the addbar (hidden `0px 100%`, revealed `0px`, + the
  wrap's byte-exact class string); P7 the Add button (32px, the
  structural width = wrap − 24 — viewport-independent after the first
  run's 264-vs-200 lesson, 12px/500, 12px radius, gap 8px, 16px svg,
  shadow-lg's pair, hover /90); P8 the heart (36px, /80, shadow-sm, the
  muted svg, 100% hover); P9 the badges (the computed anatomy);
  P10 the info block; P11 the OTHER v4 blur sites (the header 24px +
  the hero 12px — the register guard); P12 the reveal/hide round-trip
  state machine.

**The round's honest moments (five):** (1) **The wrong-ancestor hover
trap** — r51a's first pass selected the product link's
`ancestor::div[3]` (the GRID, not the card): the grid's center falls
between cards, so NO group-hover fired and every "hovered" read
silently returned the resting value. The card is `ancestor::div[1]`;
r51b re-measured everything — and the capture script's hand-rolled
probe re-bitten the SAME trap later (its capture locator was right;
its probe's root-climb was wrong — the [267/266] shadow reads
"none" from the grid; the shadow contract is pinned by P2/P3 instead).
(2) **The PNG decoder** — playwright's bundled `PNG.sync.read` rejects
some element screenshots ("unrecognised content at end of stream");
the pixel diffs moved into a real browser canvas (`pix-diff-r51.mjs` —
data URLs + drawImage + getImageData). Also `Math.round(cs.width)` on
a "36px" string is NaN — read the string or parseFloat. (3) **The
honest RED took three attempts** — the first run failed P1 (expected —
blur 8px) AND P3 (the border color serializes `lab(91.4453 0.525683
2.33001 / 0.5)` on v4 vs the reference's rgba — the r48 lab()
register; the pin now matches `/^1px solid .*0\.5\)$/`) AND P7 (the
button width measured 264 at the E2E's 1280 viewport vs the reference
probes' 200 at the sweep's 1024 — the pin is now STRUCTURAL: btn.w ===
wrap.w − 24, viewport-independent). After the two test-authoring
fixes: P1 the only failure; post-fix: 13/13. (4) **The VLM disputes**
— 3/5 first-run (267/268/269 passed; 266 and 270 failed). The
settlement was PIXEL MEASUREMENT, not adjectives: 266's orange bar
rows 245–276 measured INSIDE the photo's row-range (the bar overlays
the photo's bottom — "below the photo" was phrasing over pixels, the
r49 pattern); 270 was re-captured over the hero imagery (the first
capture scrolled to a white section — the frosted wash invisible) and
measured 144/160 varied rows (stddev up to 53.3 — "solid opaque" was a
misread over an 80%-opacity wash). And the round's own discipline
violation, honestly logged: the first 270 description GUESSED the
nav-link set ("About, Contact" — invented; the actual set is Home,
Shop, Electronics, Clothing, Accessories) — never guess content in a
VLM description; read the DOM first. (5) **The M1 diff-verify grep was
blind** — the mutation runner's `grep -c "$to"` returned 0 for M1 (the
token `/* M1 */ --blur-sm: 8px;` contains regex-special `*` chars the
BRE never matches literally); the mutation itself was verified by the
python assert + P1 firing + the md5 round-trip — the redundant grep
check failed silently. Use `grep -F` for literal tokens.

**Mutations ×6, each caught at the E2E layer on the REBUILT artifact
(the session-36 lesson), byte-exact reverts (md5-verified at every
step; the final state matches the pristine md5s):** M1 the pin removed
→ **exactly P1**; M2 `hover:shadow-xl` → `hover:shadow-lg` → **exactly
P2**; M3 `group-hover:scale-105` → `scale-110` → **exactly P4**; M4
`translate-y-full` → `translate-y-0` → **P6 + P12** (the honest
two-pin catch — both read the hidden state); M5 the Add button's
`hover:bg-primary/90` removed → **exactly P7**; M6 the h3's
`group-hover:text-primary` removed → **exactly P5**.

**Full gate:** lint 0/0 · tsc clean (after three null-guard rounds on
the new spec's evaluates — `querySelector` returns nullable) · 353/353
unit (22 files) · build 0 · **the FULL E2E 361 + 361 × 2 consecutive
runs on the final code (357 chromium tests + the setup login per
invocation; each run as four half-suite invocations: a–c 161 [4.5m —
cardhover-states joined the a–c group], c–m 41 [2.2m], n–s 77 [3.7m],
s–z 82 [2.4m]) — 710 per run (353 unit + 357 E2E)**.

**Post-change battery:** the sweep re-run **ALL 8 ROUTES AT BASELINE**
(byte-identical — the fix is sub-tolerance); the **62nd mobile-nav
verification** re-run TOKEN-EXACT (the 61st and 62nd in one round); the
watches + census clean; the fix confirmed computed on the live clone —
`heartBackdrop: blur(4px)` (the reference's value restored); the
hovered-card cross-side re-diff 0.129% (unchanged — the honest
sub-tolerance finding).

**Screenshots 266-270** (probe-first, single invocation, the
production standalone on :3001 — a FRESH process, ZERO DB mutations by
construction — hover states are CSS-only): the hovered card (the full
contract in one frame — the shadow lift + the zoom + the revealed bar
+ the orange title); the resting card (the shadow-sm baseline, the
addbar hidden); the heart at rest (the blur fix's surface — the 4px
frosted glass); the hero badge + arrows (the md blur sites); the
sticky header over scrolled hero content (the xl blur site —
re-captured after the first 270 read a white section behind the bar).
**VLM 3/5 direct + 2/2 pixel-settled** (266 and 270 via the programmatic
measurement — the r49 reconciliation pattern).

**Docs:** PAD **v1.51** (the v1.51 revision row; §8.1's cardhover-states
row + the Total row 51/710/353+357; §8.4's checklist 357; §3.2's tree
28 specs + the cardhover-states entry + the §12 globals.css ~204
recalibration; the header's Last-Updated session-51 tag), SKILL
**v1.51.0** (the version; §11's counts 357/28; the line-31 session
pointer; Appendix C → session51 + **lesson 055** — L54 the
wrong-ancestor hover trap, L55 the browser-canvas PNG differ + the NaN
read, L56 the pixel-measurement VLM settlement), the validation
report's **Trap 8** entry (the blur-scale shift — the v3/v4 forms, the
sub-tolerance analysis, the fix), AGENTS (the cardhover bullet), CLAUDE
(the E2E row's family + 357), README (the 710 row + the Testing table +
the mobile-nav 61/62 row + the File Hierarchy's 28/357), the verifier's
spec-count recalibration 27→28 + the globals.css line-count
recalibration — **the drift watch re-run ALL FAMILIES GREEN**, this
log, the worklog S51 entry, the plan's sign-offs. `.env.example`
verified current (no env plumbing this round).

## Round 51 shipped ✅
**Session complete** — the baseline 698-test gate verified on the pulled
workspace (one honest flake diagnosed and fixed); the Round-51 battery
(sweep + the 61st mobile-nav + watches + census) all clean pre-change
and re-verified post-change.
**The deliverable: CARD-HOVER-1** — the product card's hover family, the
customer-surfaces pin-density sweep's ninth installment: ONE production
fix (the v4 blur-scale trap — the globals.css `--blur-sm: 4px` pin, trap
log #8, the shadow-sm pin's exact pattern; the class strings stay
byte-exact on both sides) + one test-authoring fix (the wishlist
persists-across-reloads settle) + 12 pins + the engine-spelling
register (the zero shadow-layers, lab() colors, rounded-full
33554432px, transform-vs-translate/scale, the gap-2 class order — all
computed-identical).
**Gate: 710 tests per run** (353 unit + 357 E2E × 2 consecutive runs),
sextuple-mutation-proven at the E2E layer, sweep at baseline (the fix
is sub-tolerance — byte-identical), the 61st + 62nd mobile-nav
token-exact, VLM 3/5 direct + 2/2 pixel-settled (266-270).
**New lessons:** (1) a divergence can be invisible to EVERY pixel
instrument — sub-tolerance VALUE differences are seen only by the
computed-style probe (the r48 lesson inverted: pixels settle engine
SPELLING; computed settles VALUES); (2) the wrong-ancestor hover trap —
ancestor::div[3] from a product link is the GRID (no group-hover fires;
every "hovered" read silently returns the resting value) — the card is
ancestor::div[1], and hand-rolled probes must derive from the same
locator as their captures; (3) VLM disputes settle by pixel measurement,
never adjectives — and never guess content in a VLM description.
**Suggested next:** the sweep's tenth installment (the shop empty-state's
interaction corners; the account order-detail's deep-remaining surfaces;
the PDP buy-panel's hover corners), or the standing credential-gated
items (Stripe test-mode keys — the refund SDK path live; an email
provider — the guest-order merge-back). Just send the next round
instruction when ready.
