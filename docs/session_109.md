# Session 109 — Round 55: HEADER-ICONS-1 — The Header's Icon-Button Family: The Sweep's Fourth Fully-Parity Family, the aria + Badge Supersets, and the Cart-Aria Pluralization Fix (the Honest RED in the Superset Layer)

The standing round instruction: refresh the workspace (a PULL round —
`git pull` fast-forwarded `692f888..8317338`, the user's session_108
narrative log, docs only), review the docs, validate against the codebase,
audit with the repo skills (the `skills/` folder excluded from
checking/testing/compilation — re-verified in all four configs), achieve
parity with the live reference (the agent-browser walk + the sweep battery),
pay particular attention to the mobile navigation (the Tailwind v4 trap
log), keep the Stripe integration professional (demo mode rests green
without keys — the standing credential gates unchanged), keep the vitest +
playwright suites healthy, write + validate + execute a TDD remediation
plan, capture dev-server screenshots, update the docs, and push to main via
the SSH wrapper.

**Workspace state.** PULL (not a reset): the environment intact — `.env`
(`DATABASE_URL="file:../db/custom.db"`), the hard-link DB convergence at
inode 263859 at BOTH paths, `node_modules`, the Playwright Chromium cache.
The `skills/` exclusion re-verified in all four configs (tsconfig exclude
line 41; vitest include allowlist; playwright testDir; eslint ignores).

**Baseline gate.** lint 0/0 · tsc clean · **353/353 unit+integration (22
files)** · build exit 0 · the full E2E baseline re-run **all green — 398
chromium + the setup logins, four FILE-list invocations (a–c 215+1 [6.8m] /
c–m 44+1 [2.2m] / n–s 79+1 [3.0m] / s–z 60+1 [2.1m] — the 398-chromium
total byte-identical to the documented round-54 ship state)** — ZERO flakes.

**The Round-55 live battery (pre-change, the production standalone on :3000
via `scripts/battery-runner.sh prod`).** The paired pixel sweep **ALL 8
ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec` painted both
sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0% [9 px], checkout
0.01%, account 0% [9 px], login 0.28% — byte-identical to the documented
round-42..54 baselines). **The 69th mobile-nav verification: TOKEN-EXACT
PARITY** (all 10 checks). The standing watches clean (typeahead: the
reference fires ZERO search requests; carousel ~5000ms cadence; the SEO
layer: 17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD). The
console census 24 routes + 11 admin CLEAN.

**The candidate triage (session-107/108's "suggested next" list):** the
header's icon-button states **CHOSEN** — the sweep's thirteenth installment
(the toast's enter/exit animations + the account order-detail's final
corners RE-DEFERRED — both carry thinner unpinned axes than the header's
a11y layer; the credential-gated items UNCHANGED — no Stripe keys or email
credentials provided this round).

**THE HEADLINE — THE FOURTH FULLY-PARITY FAMILY.** The calibration (SIX
probes — `headericons-probe-r55a/b/d` (reference, login-gated) +
`headericons-clone-r55c/e/f` (clone, via the battery runner), live, the DOM
dumps + computed styles + REAL-mouse hovers + a keyboard tab-walk as the
ground truth): the family's every computed value is IDENTICAL on the
interaction axis —

- **The four ghost icon buttons** (search / heart-wishlist / bag-cart /
  user-account) at 844/884/924/964, each exactly **36×36** at y=42, in the
  `flex items-center gap-1` cluster (156px, gap 4) — byte-identical to
  r26's geometry pins, now extended to the per-button layer.
- **The svgs are BYTE-IDENTICAL and render 16px COMPUTED on BOTH engines**
  — the surprising row: every icon carries `lucide lucide-X h-5 w-5` but
  the Button base's `[&_svg]:size-4` DESCENDANT utility beats the svg's
  own `h-5 w-5` on v3 AND v4 alike — the icons render 16px, not 20px, on
  both sites (pin the class string AND the computed; M7 proves they can
  diverge).
- **The resting computed**: transparent bg, rgb(23,23,28), radius 10px,
  0.15s transition-colors, cursor pointer — all four, both sides.
- **The REAL-mouse hover**: the accent pair **rgb(253,243,237) /
  rgb(138,64,15)** on all four buttons — the pair first pinned at the
  buy-panel (r52), now pinned at the header.
- **THE PER-ELEMENT-TYPE FOCUS INDICATION (the r53 global-rule discovery
  EXTENDED):** the A wrappers (the logo, the heart/user Links) take the
  global `* { outline-ring/50 }` rule (outline auto 1px) — while the
  shadcn BUTTONS' own `focus-visible:outline-none focus-visible:ring-1
  focus-visible:ring-ring` utilities WIN on the buttons themselves: v3's
  invisible `2px solid transparent` outline vs v4's true `none` (both paint
  nothing — the standing register) + the orange **1px ring** in the
  box-shadow (the reference's 2 layers vs v4's 4 — the layer-count
  register; the orange layer is the visible paint).
- **The tab order is identical, INCLUDING the Link-wrapped heart/user
  DOUBLE-ENTRY** (the wrapper A and the inner BUTTON are both focusable —
  the reference's structure identical: logo → 5 nav → search → heart-A →
  heart-BTN → bag → user-A → user-BTN).

**TWO SUPERSETS pinned as the clone's own contract:** (1) **the aria
layer** — Search (+ `aria-haspopup` + `aria-expanded`, the session-46
toggle), Wishlist, Cart, My account/Log in; the reference's icon buttons
carry NO aria-labels at all; (2) **the count-aware bag badge** — the
reference NEVER paints a counter (its demo cart; the badge sweep read zero
spans in its header), while the clone renders the real-count pill:
`absolute -top-1 -right-2 h-4 min-w-4 px-1 bg-primary
text-primary-foreground text-[10px] font-semibold rounded-full flex
items-center justify-center` — bg rgb(230,107,26), white 10px/600, 16×16,
top -4px right -8px — the anatomy measured live at r55f.

**THE HONEST RED — THE CART ARIA'S PLURALIZATION (the fix lives in the
superset layer).** The clone's cart button read **"Cart, 1 items"** at
itemCount 1 — wrong English, and against the repo's own pluralization
convention (the shop filters' `=== 1 ? "product" : "products"`, pinned by
shopfilter-states:179 since session-50). THE FIX: header.tsx's ternary
(`=== 1 ? "item" : "items"`) + **the 23-locator alignment sweep** — the
"Cart, 1 items" locator occurrences across 9 spec files (cart ×10,
guest-checkout ×3, guest-cart ×2, checkout-validation, checkout,
paystep-states, qty-stepper, stock, stripe ×1 each) updated to "Cart, 1
item"; the 6 "Cart, 2 items" occurrences unchanged; intent-preserving — no
assertion deleted, every locator's badge-bump visibility semantics intact.

**THE DELIVERABLE (HEADER-ICONS-1)** — the honest-RED round form (the r54
pattern):

- **THE FIX (`src/components/store/header.tsx`, one line):** the
  pluralization ternary. The resting paint UNCHANGED (an aria string
  paints nothing — the sweep verified byte-identical post-change).
- **`tests/e2e/headericons-states.spec.ts`** — 14 pins: P1 the four-button
  geometry (the cluster arithmetic 4×36 + 3×4 = 156); P2 the cluster + the
  h-16 justify-between row; P3 the svg class strings + the COMPUTED 16px
  (the size-4-wins contract); P4 the resting computed; P5 the REAL-mouse
  hover accent pair on all four; P6 focus-visible ON a button (outline
  none + the orange 1px ring layer — the utilities beat the global rule);
  P7 focus-visible on the A wrappers (the global rule, both spellings); P8
  the tab order with the double-entry; P9 the aria superset; P10 the badge
  superset anatomy; P11 THE FIX's pluralization pin ("Cart, 1 item"
  singular / "Cart, 2 items" plural); P12 the hover with the badge; P13
  the empty-cart negative; P14 the mobile 390px cluster (x=218, 156w).
- **The honest RED verified:** P11 FAILED against the pre-fix artifact
  (the aria read "Cart, 1 items" — exactly the calibrated divergence); the
  other 13 pins green (after one authoring fix — P8's 6-char text
  signatures, and the tsc strict-null guards on the four
  `document.activeElement` evaluate callbacks). The fix turned the spec
  15/15 green (14 pins + the setup login) with zero collateral — the 9
  swept flow specs re-verified green in a dedicated 64-test collateral
  run.

**Mutations ×8, each caught at the E2E layer on the REBUILT artifact (the
session-36 lesson), byte-exact reverts (md5-verified at every step; the
final state matches the pristine header `79b05ca1…`):** M1 the fix reverted
(the constant plural) → **exactly P11** (the fix's own regression); M2 the
badge `bg-primary` → `bg-secondary` → **exactly P10**; M3 the badge
`-top-1 -right-2` → `top-0 right-0` → **exactly P10**; M4 the bag's
`relative` dropped (the badge escapes to the nearest positioned ancestor)
→ **exactly P10**; M5 the Wishlist aria-label dropped → **exactly P9**; M6
the search's `aria-expanded` dropped → **exactly P9**; M7 the search svg
`h-5 w-5` → `h-6 w-6` with the COMPUTED UNCHANGED at 16px → **exactly P3**
(the class-string pin catching what the computed cannot — the pin's
independent value proven); M8 the cluster `gap-1` → `gap-2` → **P1+P2+P14**
(the honest pair + the mobile catch).

**Full gate:** lint 0/0 · tsc clean · 353/353 unit (22 files) · build 0 ·
**the FULL E2E 412 + 412 × 2 consecutive runs on the final code (each run
as four FILE-list invocations: a–c 229+1 [7.8m — headericons-states joined
the a–c group], c–m 44+1 [2.2m], n–s 79+1 [3.0m], s–z 60+1 [2.0m]) — 765
per run (353 unit + 412 E2E)**.

**Post-change battery:** the sweep re-run **ALL 8 ROUTES AT BASELINE
byte-identical** (the fix is aria-only — zero paint, as predicted); the
**70th mobile-nav verification** re-run TOKEN-EXACT (the 69th and 70th in
one round); the watches + census clean.

**Screenshots 286-290** (probe-first, single invocation, the production
standalone on :3001 — a FRESH process; the badge capture adds ONE cart
item and REMOVES it via the drawer — the DB left as found, verified): the
cluster at rest (four 36×36 ghost buttons); the search button hovered (the
accent pair — the probe read rgb(253,243,237)/rgb(138,64,15)); the search
button keyboard-focused (the orange 1px ring — the probe read the full
4-layer v4 shadow); the bag WITH the badge (**THE FIX'S PROOF — the probe
read `aria="Cart, 1 item"` and the badge at 952,38 16×16 bg
rgb(230,107,26)**; the cleanup verified the aria back to "Cart"); the
mobile 390px row (the three children: menu 16/36, logo 91/88, cluster
218/156). **VLM 4/5 direct + 1 zoom-instrument + the pixel settlement:**
289 disputed at the full crop ("positioned to the right of the bag icon
rather than overlapping the corner") — **the pixel settlement measured the
orange pill's bbox (88,29)-(102,42) OVERLAPPING the bag button's box
(60,32)-(96,68) by 9×11px — ON the top-right corner**; the VLM anchors on
the VISIBLE icon glyphs — a ghost button's INVISIBLE boundary (no fill, no
border) is below the instrument's perceptual floor; the 3× zoom
re-verify with the visible-anchored description PASSED (the box-relative
truth carried by the pixels + the DOM probe).

**The round's honest moments (four):** (1) **THE TAB-START POISON** —
r55d's first attempt clicked `body` at (10,400) before the tab-walk; the
click SET FOCUS at the hero's DOM position and the tab sequence started
MID-PAGE (the hero chevrons read at tabs 2-3, looking like a different
focus contract) — a click is a focus operation; park the pointer WITHOUT
clicking before any tab-walk. (2) **THE STALE-STORE HYDRATION** — the
badge read false after adding an item on the PDP and reading the HOME
page's header: the home page's client store hydrated BEFORE the add
(cross-page client state does not propagate); reload the page after a
cross-page mutation. (3) **THE STRICT-MODE ATC** — the PDP's
`getByRole(/add to cart/i)` matches MULTIPLE buttons (the buy panel + the
related-products quick-add); scope with `.first()` (the buy panel precedes
related in the DOM). (4) **THE INVISIBLE-BOUNDARY VLM LIMIT** — 289's
dispute is the r54 14px-glyph lesson in a new form: the VLM cannot verify
a geometric claim about an element whose boundary is INVISIBLE; describe
the visible anchors for the VLM and carry the box-relative truth by pixel
measurement + the DOM probe.

**Docs:** PAD **v1.55** (the v1.55 revision row; §8.1's headericons-states
row + the Total row 55/765/353+412; §8.4's checklist 412/32 files; §3.2's
tree 32 specs + the headericons-states entry + 55 plans), SKILL **v1.55.0**
(the version; the line-31 session pointer; §11's counts 353/412; Appendix
C → session55 + **lesson 059** — L68 the tab-start poison, L69 the
stale-store hydration, L70 the strict-mode ATC, L71 the per-element-type
focus indication), AGENTS (the headericons bullet + the registers + the
probe disciplines), CLAUDE (the E2E row's family + 412), README (the 765
row + the header family + the Testing table's 412 + the mobile-nav 69/70
row + the File Hierarchy's 32/412), the verifier's spec-count
recalibration 31→32 — **the drift watch re-run ALL FAMILIES GREEN**, this
log, the worklog S55 entry, the plan's sign-offs; `.env.example` verified
current (no env plumbing this round).

## Round 55 shipped ✅
**Session complete** — the baseline 751-test gate verified on the pulled
workspace; the Round-55 battery (sweep + the 69th mobile-nav + watches +
census) all clean pre-change and re-verified post-change.
**The deliverable: HEADER-ICONS-1** — the header's icon-button family, the
customer-surfaces pin-density sweep's thirteenth installment: the sweep's
**FOURTH FULLY-PARITY FAMILY** (every computed value identical on the
interaction axis — the geometry, the 16px-computed svg contract, the
accent-pair hover, the per-element-type focus, the tab order with the
double-entry) + the aria + badge supersets pinned as the clone's own
contract + **ONE honest fix in the superset layer** (the cart aria's
pluralization — "Cart, 1 items" → "Cart, 1 item" — with the 23-locator
alignment sweep) + the 14-pin spec.
**Gate: 765 tests per run** (353 unit + 412 E2E × 2 consecutive runs),
octuple-mutation-proven (M1 → exactly P11 the fix's own regression; M7 →
exactly P3 the class-string catch with the computed UNCHANGED; M8 →
P1+P2+P14 the honest triple), sweep at baseline byte-identical, the 69th +
70th mobile-nav token-exact, VLM 4/5 direct + 1 zoom-instrument + the
pixel settlement (286-290).
**New lessons:** (1) the tab-start poison — never click before a
tab-walk; (2) the stale-store hydration — reload after cross-page
mutations; (3) the strict-mode ATC — scope with .first(); (4) the
per-element-type focus — wrappers take the global rule, buttons take the
ring; (5) the invisible-boundary VLM limit — describe the visible
anchors, settle the geometry by pixels.
**Suggested next:** the sweep's fourteenth installment (the toast's
enter/exit animation states; the account order-detail's final deep
corners; the search-drawer's panel geometry), or the standing
credential-gated items (Stripe test-mode keys — the refund SDK path live;
an email provider — the guest-order merge-back). Just send the next round
instruction when ready.
