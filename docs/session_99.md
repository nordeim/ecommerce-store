# Session 99 — Round 50: SHOP-FILTERS-1 — The Shop Filter Bar's Interaction States: the Clear-Button Anatomy Fix, the Price-Bucket Semantics, the Popover/Keyboard Pins, and the Reference-Drift Register (the Sweep's Eighth Installment)

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
fast-forwarded `a41ed52..2400cc7` (the user's session_98 narrative log,
docs only — the recent-changes audit CLEAN, zero production code); the
environment survived intact (node_modules, `.env` with
`DATABASE_URL="file:../db/custom.db"`, `db/custom.db` with the
hard-link convergence at inode 397471 at both paths, the Playwright
Chromium cache). The `skills/` exclusion re-verified in all four
configs.

**Baseline gate.** lint 0/0 · tsc clean · **353/353 unit+integration
(22 files)** · build exit 0 · the full E2E baseline re-run **all 333
chromium tests + the setup logins GREEN (four invocations: a–c 149
[4.0m], c–m 41 [2.2m], n–s 65 [3.2m], s–z 82 [2.3m] — the 600s
tooling cap)**. The documented session-97/98 ship state verified
pre-change. (The round's first two baseline attempts ran the FULL
suite under a too-greedy `--grep "^[a-m]"` — Playwright 1.63's grep
matches the title path INCLUDING the project name, so "chromium…"
starts with 'c' and every letter range matching 'c' selects everything;
the four-way FILE-list split is the documented form.)

**The docs review.** AGENTS.md, CLAUDE.md, README, PAD v1.49, SK
v1.49.0, session_97/98, remediation-plan-session49, the worklog S49 —
the repo is 50 remediation rounds deep, 686 tests, every contract
cross-validated. The skills catalog mapped: tdd (the gate-round
convention — this round takes the honest RED → GREEN path), 
agent-browser (the live reference walk), clone-app-pat-pro (the
parity methodology — the DOM probe + the computed style are the ground
truth), code-review-and-audit (the lenses).

**The Round-50 live battery (pre-change, the production standalone on
:3000 via `scripts/battery-runner.sh prod`).** The paired pixel sweep
**ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec`
painted both sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%
[9 px], checkout 0.01%, account 0% [9 px], login 0.28% — byte-identical
to the documented round-42..49 baselines). **The 59th mobile-nav
verification: TOKEN-EXACT PARITY** (all 10 checks). The standing
watches clean (typeahead: the reference fires ZERO search requests;
carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots,
JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11
admin CLEAN.

**The candidate triage (session-95/97's "suggested next" list):** the
shop filters' interaction states **CHOSEN** — the sweep's eighth
installment (the product-card hover family and the account
order-detail surfaces re-deferred — thinner; the credential-gated
items remain: no Stripe test-mode keys or email provider provided).
The sweep's method applied: the filter bar's four controls enumerated
(`shop-filters.tsx` — the search input, the category/price/sort Radix
Selects, the Clear button) + the shop page's server seams
(`parseSearchParams`, the price-bucket where-clauses, the chips) and
cross-checked against the E2E layer — the interaction states had
near-ZERO pins (catalog-parity pins the sort dropdown's 5 option
LABELS; storefront-parity:376 pins the sort trigger's resting
geometry; search.spec pins the header path + chips + the empty state —
but the OPEN-state anatomy, the keyboard contract, the price-bucket
semantics, the category option set, the trigger-label coherence, the
count line, and the Clear button's anatomy/visibility/behavior were
never measured NOR pinned).

**THE AUDIT'S STRUCTURAL FINDING (the fourth consecutive round):** the
filter bar's interaction states are INTERACTION-GATED — the resting
pixel sweep renders /shop UNFILTERED (the Clear button never renders,
the popovers never open, the buckets never activate) — so the
session-2-era custom Clear button survived 49 green rounds unseen.
The sweep's own blind spot, mapped and closed.

**The calibration (FOUR probes — `scripts/shopfilter-probe-r50.mjs` +
`r50b.mjs` + `r50c.mjs` (reference, login-gated) +
`shopfilter-clone-r50d.mjs` (clone side, via the battery runner), live,
the DOM dumps + computed styles as the ground truth):**

- **ONE parity divergence — the Clear button:** the reference's is the
  shadcn ghost/sm anatomy (`inline-flex items-center justify-center
  whitespace-nowrap font-medium transition-colors … hover:bg-accent
  hover:text-accent-foreground h-8 rounded-md px-3 text-xs gap-1` —
  32px tall, 12px/500 font, 10px radius, foreground color, the X at
  `h-3 w-3` classes rendered 16px via `[&_svg]:size-4`, width 74px);
  the clone's was a custom string (36px, 14px, SQUARE 0px radius,
  muted color, `hover:text-foreground` only, `h-4 w-4` X).
- **The parity confirmations:** the four price buckets' sets are
  byte-identical both sides (under-50 = tee/serum/pad · 50-100 =
  planter/blanket/mat · 100-200 = watch/speaker/shoes/pajama ·
  over-200 = headphones/sunglasses — the reference measured via its UI
  path, the clone via its deep-link path); the popover geometry is
  byte-identical (radius 10px, start-aligned at the trigger's left
  edge, 4px gap, content-sized 165px); the item highlight's Radix
  accent pair (rgb(253,243,237) / rgb(138,64,15)); the keyboard
  contract (open highlights the selected item, ArrowDown moves, Enter
  commits, Escape closes uncommitted); the 7 category options in the
  DB order; the 5 price labels byte-exact; the count line's
  singular/plural; the total reset on Clear.
- **THE REFERENCE-DRIFT REGISTER (the round's documentary finding):**
  (a) the reference's active-filter **CHIP ROW IS GONE** — session-3
  measured it live ("Reference shows an active-filter chip row…
  verified live with combined params", remediation-plan-session3
  §SEARCH-1); today's full anchor dump on `?category=electronics` and
  `?search=serum` proves its absence — the session-26 hero-drift
  pattern's second instance; the clone keeps its deep-linkable chips
  as the REGISTERED SUPERSET (never weaken a pin to follow a drift);
  (b) the reference's deep-linked `?sort=` and `?price=` params are
  **DEAD** — every sort value renders FEATURED order (double-read
  stable at 1500ms + 4000ms) and every price bucket renders 12
  products, while its UI paths WORK (price_asc sorts; UI newest =
  reverse array — the clone's semantics match); (c) the reference
  writes the URL ONLY on the header search submit (`/shop?search=watch`
  — the one true URL-write, already pinned); its bar search and all
  filter selections are in-memory only (six URL polls over 2.4s
  proved no transient push); (d) the reference's filter triggers and
  header icon buttons carry **NO aria-labels** — the clone's are the
  a11y superset (the r49 stepper pattern).

**THE DELIVERABLE (SHOP-FILTERS-1)** — ONE production fix + 12 E2E
pins + the drift register:

- **Fix #1 (the Clear button's anatomy):** `shop-filters.tsx` — the
  custom Clear replaced by a plain `<button>` carrying the reference's
  BYTE-EXACT class string + `<X className="h-3 w-3" />` (rendered 16px
  via the `[&_svg]:size-4` override — the reference's exact quirk). A
  plain button, NOT the `Button` component — the clone's `button.tsx`
  is the older shadcn vintage (its base carries `rounded-md text-sm`),
  which would both diverge from the reference's string AND create a
  `text-sm`/`text-xs` conflict. Zero shared-component changes; the
  behavior (`router.push("/shop")`) and the `hasFilters` gate
  unchanged.
- **`tests/e2e/shopfilter-states.spec.ts`** — 12 pins: P1 the Clear's
  byte-exact anatomy (the honest RED); P2 the visibility contract
  (absent unfiltered, present for each of the four dimensions); P3 the
  total reset; P4 the 7 category options + the active check; P5 the 5
  price labels; P6 the four buckets' exact sets (the semantic core);
  P7 the popover geometry; P8 the keyboard contract; P9 the
  trigger-label coherence (the registered superset); P10 the bar
  search's case-insensitive match + URL push; P11 the count line; P12
  the highlighted item's accent pair.

**The round's honest moments (four):** (1) **The aria discovery** —
the first probe pass crashed twice on name-based locators: the
reference's triggers and header icon buttons carry NO aria-labels
(finding #d); all reference-side locators are INDEX-based
(`getByRole("combobox").nth(0/1/2)`) and the header search button is
located by its svg class. (2) **The hydration race** — P9's third
deep-link read returned `["", "", ""]`: the SSR pass renders Radix
SelectValue EMPTY and the label fills after hydration; the pin form is
`expect.poll` (the first two reads had won the race by luck). (3) **The
animation/hover settle** — P7's popover geometry read a mid-transition
gapY of 3.44 (not 4) because the evaluate ran inside the 150ms
entrance animation, and P8's keyboard-highlight read ran before
Radix's state update settled; both pins now carry explicit settle
waits (400ms/250ms — the round-48 mid-transition color lesson's
geometry sibling). (4) **The stale-write mutation bug** — the round's
own M5 proof silently carried M4+M5: a python revert-then-apply that
reads the file once and writes it TWICE writes the ORIGINAL string on
the second pass, resurrecting the reverted mutation; the "M5" run
fired P8+P9 (each attributable), and the clean re-run (M5 alone, the
diff grepped before building) fired exactly P8. The lesson: verify
each mutation's diff before building.

**Mutations ×6, each caught at the E2E layer on the REBUILT artifact
(the session-36 lesson), byte-exact reverts (md5-verified at every
step):** M1 the custom Clear string restored → **exactly P1**; M2
`hasFilters` → true → **P2 + P3** (the always-on Clear breaks both
absence assertions — an honest two-pin catch); M3 under-50's `lte:
4999` → `lt: 4999` (excluding the $49.99 tee) → **exactly P6**; M4 the
sort Select uncontrolled (`defaultValue`) → **exactly P9**; M5 the
sort commit suppressed (`setParam` early-return) → **exactly P8** (the
clean run); M6 the SelectContent `rounded-md` → `rounded-sm` →
**exactly P7**.

**Full gate:** lint 0/0 · tsc clean · 353/353 unit (22 files) · build
0 · **the FULL E2E 349 + 349 × 2 consecutive runs on the final code
(345 chromium tests + the setup login per invocation; each run as four
half-suite invocations: a–c 149 [4.0m/4.0m], c–m 41 [2.2m/2.2m], n–s
77 [3.7m/3.7m] — shopfilter-states joined the n–s file group, s–z 82
[2.4m/2.4m]) — 698 per run (353 unit + 345 E2E)**. (The round's
rate-limit lesson re-learned: the login limiter's 10-attempt/15-min
budget is IN-MEMORY per server process — a lingering diagnostic
server on the E2E port accumulated the attempts and the setup login
timed out; killing the stale server resets the budget. The four-way
split's per-invocation servers are the structural defense.)

**Post-change battery:** the sweep re-run **ALL 8 ROUTES AT BASELINE**
(byte-identical — the fix is interaction-gated; the Clear renders only
when filtered); the **60th mobile-nav verification** re-run
TOKEN-EXACT (the 59th and 60th in one round).

**Screenshots 261-265** (probe-first, single invocation, the
production standalone on :3001 — a FRESH process, ZERO DB mutations by
construction — filters are URL state): the filtered bar with the
reference-anatomy Clear (?category=electronics — 32px/12px/10px, the
X at 16px); the category popover OPEN (the 7 options + the active
check); the price popover OPEN (the 5 byte-exact labels); the sort
popover with the keyboard highlight mid-contract (ArrowDown on "Price:
Low to High" — the accent pair); the bar search result (?search=SERUM
— the case-insensitive match + the heading + the count line). **VLM
5/5 PASS — first-run.**

**Docs:** PAD **v1.50** (§8.1's shopfilter-states row + the Total
50/698/353+345; §8.4's checklist 345; §3.2's tree 27 specs + the
shopfilter-states entry + the 50-plan docs line; the v1.50 revision
row; the header's Last-Updated session tag), SKILL **v1.50.0** (the
version + §11's counts + the line-31 session pointer + Appendix C →
session50 + **lesson 054** — L50 the index-locator rule for aria-less
reference surfaces, L51 the SelectValue SSR-empty hydration race +
expect.poll, L52 the popover-animation/keyboard settle waits, L53 the
stale-write mutation trap), AGENTS (the shopfilter-states bullet),
CLAUDE (the E2E row's family + 345), README (the 698 row + the Testing
table + the mobile-nav 60 row + the File Hierarchy's 27/345), the
verifier's spec-count recalibration 26→27 — **the drift watch re-run
ALL FAMILIES GREEN**, this log, the worklog S50 entry, the plan's
sign-offs. `.env.example` verified current (no env plumbing).

## Round 50 shipped ✅
**Session complete** — the baseline 686-test gate verified on the
pulled workspace; the Round-50 battery (sweep + the 59th mobile-nav +
watches + census) all clean pre-change and re-verified post-change.
**The deliverable: SHOP-FILTERS-1** — the shop filter bar's
interaction states, the customer-surfaces pin-density sweep's eighth
installment: ONE production fix (the Clear button's reference anatomy
— the shadcn ghost/sm string byte-exact on a plain button, avoiding
the Button component's vintage divergence) + 12 pins + the
reference-drift register (the chip row's disappearance — the
hero-drift pattern's second instance — the dead ?sort=/?price= deep
links, and the header-search-only URL-write contract; the clone's
working deep links, chips, and bar-search push are the registered
superset).
**Gate: 698 tests per run** (353 unit + 345 E2E × 2 consecutive
runs), sextuple-mutation-proven at the E2E layer (each on the rebuilt
artifact, byte-exact reverts), sweep at baseline, the 59th + 60th
mobile-nav token-exact, VLM 5/5 first-run (261-265).
**New lessons:** (1) the reference's filter triggers and header icon
buttons carry NO aria-labels — reference-side probes must locate by
INDEX or by svg class; (2) the SSR pass renders Radix SelectValue
EMPTY — trigger-label pins need expect.poll; (3) popover geometry and
keyboard-highlight reads must wait for the entrance animation and the
state settle; (4) a python revert-then-apply that writes the file
twice from a string read once silently carries BOTH mutations —
verify each mutation's diff before building.
**Suggested next:** the sweep's ninth installment (the product-card
hover family — the shadow-lift + heart transition states; the shop
empty-state's interaction corners; or the account order-detail's
remaining surfaces), or the standing credential-gated items (Stripe
test-mode keys — the refund SDK path live; an email provider — the
guest-order merge-back). Just send the next round instruction when
ready.
