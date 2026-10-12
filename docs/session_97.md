# Session 97 — Round 49: CART-STEPPER-1 — The Quantity-Stepper Boundary States: the PDP Minus-Floor Fix, the Drawer Decrement-to-Remove Fix, the /Cart Consistency Fix, and the Platform-Cursor Rule (the Sweep's Seventh Installment)

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
fast-forwarded `53f5bfc..ba423d8` (the user's session_96 narrative log,
docs only — the recent-changes audit CLEAN, zero production code); the
environment survived intact (node_modules, `.env` with
`DATABASE_URL="file:../db/custom.db"`, `db/custom.db` with the
hard-link convergence at inode 397471 at both paths, the Playwright
Chromium cache). The `skills/` exclusion re-verified in all four
configs.

**Baseline gate.** lint 0/0 · tsc clean · **353/353 unit+integration
(22 files)** · build exit 0 · the full E2E baseline re-run **all 321
chromium tests + the setup login GREEN (four invocations: a–c 149
[3.9m], c–m 41 [2.2m], n–s 53 [2.6m], s–z 82 [2.3m] — the 600s
tooling cap)**. The documented session-95/96 ship state verified
pre-change.

**The docs review.** AGENTS.md, CLAUDE.md, README, PAD v1.48, SKILL
v1.48.0, session_95/96, remediation-plan-session48, the worklog S48 —
the repo is 49 remediation rounds deep, 676 tests, every contract
cross-validated. The skills catalog mapped: tdd (the gate-round
convention — this round takes the honest RED → GREEN path for the
four fixes), agent-browser (the live reference walk), clone-app-pat-pro
(the parity methodology — the DOM probe + the computed style are the
ground truth), code-review-and-audit (the lenses).

**The Round-49 live battery (pre-change, the production standalone on
:3000 via `scripts/battery-runner.sh prod`).** The paired pixel sweep
**ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec`
painted both sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%
[9 px], checkout 0.01%, account 0% [9 px], login 0.28% — byte-identical
to the documented round-42..48 baselines). **The 57th mobile-nav
verification: TOKEN-EXACT PARITY** (all 10 checks). The standing
watches clean (typeahead: the reference fires ZERO search requests;
carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots,
JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11
admin CLEAN.

**The candidate triage (session-95's "suggested next" list):** the
cart drawer's stepper boundary states + the PDP quantity/stock edge
family **CHOSEN** — the sweep's seventh installment (the account
family's remaining error surfaces re-deferred — it already carries two
dedicated rounds; the credential-gated items remain: no Stripe
test-mode keys or email provider provided). The sweep's method
applied: the three stepper surfaces enumerated (`buy-panel.tsx`, 
`cart-drawer.tsx`, `cart-client.tsx`) and cross-checked against the
E2E layer — the boundary states had ZERO pins (cart.spec covers the
happy path; stock.spec covers the server clamps), and the session-2
comment ("production-correct extras the reference lacks: disabled
minus at qty 1") was an ASSUMPTION from before the pin-density
methodology existed — the reference's actual boundary behavior had
never been measured.

**THE AUDIT'S STRUCTURAL FINDING:** the stepper boundary states are
INTERACTION-GATED (the pixel sweep never opens the drawer; the PDP's
resting disabled-minus at opacity 0.4 sat inside the pdp route's
0.34% noise band) — a session-2 build liberty that survived 48 green
rounds unseen. The sweep's own blind spot, mapped and closed.

**The calibration (FOUR probes — `scripts/stepper-probe-r49.mjs`,
`r49b.mjs` (content-scoped), `r49d.mjs` (the cursor census), +
`stepper-clone-r49c.mjs` (the clone side, via the battery runner) —
live, login-gated, the VLM descriptions cross-checking the captures):**
the reference's PDP minus at qty 1 is **ENABLED** (opacity 1, cursor
pointer) and its click is a **NO-OP** (the qty stays 1); its **DRAWER
minus at qty 1 is ENABLED and its click REMOVES the item** ("Cart (1)"
→ "Cart (0)" → the empty state + Start Shopping — doubly measured,
first by accident then definitively on a fresh item); its stepper
plus has **NO cap** in any reachable range (the PDP plus still enabled
at qty 9, the drawer plus at qty 7, no error copy); its steppers carry
NO aria-labels (the clone's are the accessibility superset); its
stepper anatomy is **byte-identical** to the clone's (`p-3 hover:bg-secondary
transition-colors rounded-l-xl` / `p-1.5 … rounded-l-lg`, the
containers at radius 12px — the reference's `rounded-lg` is the shadcn
`--radius` 12px, matching the clone's pinned scale); and — **THE
PLATFORM-CURSOR DISCOVERY** (probe r49d) — the reference's Base44
platform CSS gives **EVERY `<button>` cursor:pointer** (the complete
census: 17/17 buttons on its PDP, 33/33 on its home, the auth submits,
AND a synthetic bare `<button>` appended to the DOM: pointer — a
platform-level rule, not a per-component class), while Tailwind
v4.3.3's preflight sets NO button cursor — the clone's buttons
computed `default` site-wide, a hover-affordance divergence invisible
to the pixel sweep (the cursor is never rendered in screenshots).

**THE DELIVERABLE (CART-STEPPER-1)** — FOUR production fixes + 12 E2E
pins:

- **Fix #1 (the parity divergence — the PDP minus floor):**
  `buy-panel.tsx` — the `disabled={quantity <= 1}` attr + the
  `disabled:opacity-40` token DROPPED (the `Math.max(1, q - 1)` clamp
  IS the reference's no-op; the class string is now byte-identical to
  the reference's).
- **Fix #2 (the parity divergence — the drawer decrement-to-remove):**
  `cart-drawer.tsx` — the same drop; the -1 delta flows to
  `adjustCartItemAction` → `changeQuantityBy`, where
  `nextQuantity(1, -1) = 0` is the DELETE signal (the session-4/6
  seams, already unit-pinned — ZERO server changes). The minus-at-1
  click removes the line, exactly as the reference does.
- **Fix #3 (the consistency gap — the full-page cart):**
  `cart-client.tsx` — the same drop on the pure-superset surface (the
  reference's /cart is the hardcoded empty state; one design language:
  the drawer and /cart both decrement-to-remove).
- **Fix #4 (the platform discovery — the cursor rule):**
  `globals.css` — `@layer base { button { cursor: pointer; } }` (the
  Base44 platform rule; explicit utilities like
  `disabled:cursor-not-allowed` keep winning via class specificity).
- **`tests/e2e/qty-stepper.spec.ts`** — 12 pins (named `qty-` so it
  sorts after `paystep-states`/`performance` and before `search` —
  p < q < s): P1 the PDP minus enabled at full opacity; P2 the no-op
  click; P3 the PDP anatomy byte-exact; P4 the drawer minus enabled;
  P5 the drawer minus-at-1 REMOVES the item (Cart (0) + the empty
  state + Start Shopping); P6 the qty-2 decrement (the normal-path
  guard); P7 the drawer anatomy byte-exact; P8 the PDP plus's stock
  ceiling via the admin seam (setStock 2 — enabled at 1, disabled at
  opacity 0.4 at 2; restore 25 — the registered superset); P9 the
  /cart enabled + removal; P10 the /cart qty-2 decrement; P11 the PDP
  boundary walk (3 → 1 → the floor no-op); P12 the cursor census —
  every button on the PDP computes pointer.

**The round's honest moments (three):** (1) **The first drawer probe's
overlay trap** — the `[role=dialog], [data-state=open]` evaluate
matched the Radix OVERLAY (the first portal element in document order
— button-less), not the drawer CONTENT; the VLM descriptions of the
captures proved the drawer was open and the click had removed the
item, and the r49b content-scoped selector (the element matching
`/Cart \(\d+\)/`) settled it — the round-48 label-vs-box lesson
generalized to portal layers. (2) **The VLM's "disabled" misread** —
the VLM described the ENABLED minus (opacity 1, DOM-verified) as
"disabled (dimmed/faded)" — world knowledge over pixels (steppers
typically dim the minus at qty 1). The reconciliation captured the
REFERENCE'S OWN stepper element and ran the identical pixel-zone
analysis: **BYTE-IDENTICAL** (minus zone darkest 79 / sub-120 count 20
/ avg 245 on BOTH sites — the 16px single-stroke glyph simply renders
lighter than the plus's crossing strokes). The VLM description is a
cross-check, never the ground truth; a cross-site pixel-zone
comparison is the definitive settlement. (3) **The dev-DB residue
false alarm** — the post-change sweep flagged /cart at 12.36% +
/checkout at 47.11% OUT OF BAND; the diagnosis: the r49c clone-side
probe had left a cart item in the demo user's dev cart (the probe ran
against the production standalone with the dev DB). `bun
prisma/dev-cleanup.ts` restored the 8/8 baseline — the sweep's alarm
IS the hygiene check working. Live-audit probes that run against the
dev DB MUST run dev-cleanup afterward.

**Mutations ×6, each caught at the E2E layer on the REBUILT artifact
(the session-36 lesson), byte-exact reverts (md5-verified at every
step):** M1 the PDP disabled restored → **P1 + P2 + P3 + P11** (the
disabled attr also blocks the click-based pins — an honest four-pin
catch); M2 the drawer disabled restored → **P4 + P5 + P7**; M3 the
/cart disabled restored → **exactly P9**; M4 the delete signal
suppressed in `cart-quantity.ts` → **P5 + P9 + the unit layer** (both
removal pins share the server seam — an honest two-layer catch); M5
the no-op clamp removed → **exactly P2 + P11**; M6 the cursor rule
removed → **P1 + P4 + P12**.

**Full gate:** lint 0/0 · tsc clean · 353/353 unit (22 files) · build
0 · **the FULL E2E 337 + 337 × 2 consecutive runs on the final code
(333 chromium tests + the setup login per invocation; each run as four
half-suite invocations: a–c 149 [4.0m/4.0m], c–m 41 [2.2m/2.1m], n–s
65 [3.3m/3.2m], s–z 82 [2.3m/2.4m]) — 686 per run (353 unit + 333
E2E)**.

**Post-change battery:** the sweep re-run — the first invocation
caught the dev-DB residue (the honest false alarm above), the cleanup,
then **ALL 8 ROUTES AT BASELINE** (byte-identical); the **58th
mobile-nav verification** re-run TOKEN-EXACT (the 57th and 58th in one
round).

**Screenshots 256-260** (probe-first, single invocation, the
production standalone on :3001 — a FRESH process): the PDP resting
stepper at qty 1 with the minus ENABLED (Fix #1's proof — full-opacity
minus, the class string byte-identical); the drawer at qty 1 with the
minus ENABLED (Fix #2's proof + the exact stepper anatomy); the drawer
AFTER the minus-at-1 click — "Cart (0)" + "Your cart is empty" +
Start Shopping (the removal proof); the /cart AFTER the minus-at-1
click — the empty state + Continue Shopping (Fix #3's consistency
proof); the PDP plus at the stock ceiling — qty 25 of 25, the plus
DISABLED at opacity 0.4 (P8's superset proof, reached by 24
client-state clicks — zero DB mutations). **VLM 5/5 PASS** — 258/259/
260 confirmed directly; **256/257 verified via the byte-identical
pixel-zone reconciliation** (the VLM's "disabled" misread settled by
the cross-site comparison — the round's deepest verification).

**Docs:** PAD **v1.49** (§8.1's qty-stepper row + the Total
49/686/353+333; §8.4's checklist 333; §3.2's tree 26 specs + the
qty-stepper entry + the §12 globals.css line-count drift the verifier
caught, fixed; the v1.49 revision row; the header's Last-Updated
session tag), SKILL **v1.49.0** (the version + §11's counts + the
line-31 session pointer + Appendix C → session49 + **lesson 053** —
L47 the overlay-vs-content portal scoping rule, L48 the VLM
world-knowledge misread + the cross-site pixel-zone settlement, L49
the dev-DB-hygiene rule for live-audit probes), AGENTS (the
qty-stepper bullet + the three lessons), CLAUDE (the E2E family rows +
333), README (the 686 row + the Testing table + the mobile-nav 58 row
+ the File Hierarchy's spec count), the verifier's spec-count
recalibration 25→26 + the line-count fix — **the drift watch re-run
ALL FAMILIES GREEN**, this log, the worklog S49 entry, the plan's
sign-offs. `.env.example` verified current (no env plumbing).

## Round 49 shipped ✅
**Session complete** — the baseline 686-test gate verified on the
pulled workspace; the Round-49 battery (sweep + the 57th mobile-nav +
watches + census) all clean pre-change and re-verified post-change.
**The deliverable: CART-STEPPER-1** — the quantity-stepper boundary
states, the customer-surfaces pin-density sweep's seventh installment:
FOUR production fixes (the PDP minus floor — the reference's minus is
enabled and no-ops at qty 1, the clone's disabled attr + token
dropped; the drawer decrement-to-remove — the reference's minus-at-1
click REMOVES the line, doubly measured, the clone's disabled dropped
with zero server changes — the DELETE-signal seam already existed and
was unit-pinned; the /cart consistency — one design language across
the clone's own superset surfaces; and the platform cursor rule — the
reference's Base44 platform CSS gives every button cursor:pointer,
restored in globals.css after a complete 17/17+33/33+synthetic census)
+ 12 pins — all on the interaction-gated boundary surfaces the resting
sweep structurally cannot reach, mapped and closed.
**Gate: 686 tests per run** (353 unit + 333 E2E × 2 consecutive runs),
sextuple-mutation-proven at the E2E layer (each on the rebuilt
artifact, byte-exact reverts), sweep at baseline (after the honest
dev-DB-residue false alarm — the hygiene check working), the 57th +
58th mobile-nav token-exact, VLM 5/5 (256/257 via the byte-identical
pixel-zone reconciliation).
**New lessons:** (1) a `[role=dialog]` evaluate matches the Radix
OVERLAY — the first portal element, button-less; scope DOM dumps to
the element carrying the CONTENT (the "Cart (N)" heading); (2) the VLM
described the ENABLED minus as "disabled (dimmed/faded)" — world
knowledge over pixels; the definitive settlement is a cross-site
pixel-zone comparison (the reference's own element capture —
byte-identical zones prove the glyph's natural rendering); (3)
live-audit probes that run against the dev DB through the production
standalone MUST run `prisma/dev-cleanup.ts` afterward — the post-change
sweep's out-of-band alarm on /cart + /checkout was dev-DB residue, not
a code regression, and the cleanup restored the baseline.
**Suggested next:** the sweep's eighth installment — the shop filters'
interaction states (the price-slider bounds + the sort combobox's
open/keyboard states), the product-card hover family, or the
account-family order-detail surfaces; the credential-gated items
remain (Stripe test-mode keys — the refund SDK path live; an email
provider — the guest-order merge-back). Just send the next round
instruction when ready.
