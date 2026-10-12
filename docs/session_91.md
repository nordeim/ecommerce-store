# Session 91 — Round 46: SEARCH-BEHAVIOR-1 — The Search Family's Behavioral Contract: the Typeahead State Machine, the Query-Preservation + Toggle-Close Parity Fixes, and the Clip-Fix Discovery ("The Sweep's Fourth Installment, and the One the VLM Caught")

The standing round instruction: refresh the workspace, review the docs,
validate against the codebase, audit with the repo skills (the
`skills/` folder excluded from checking/testing/compilation — re-verified
in all four configs), achieve parity with the live reference (the
agent-browser walk + the sweep battery), pay particular attention to the
mobile navigation (the Tailwind v4 trap log), keep the Stripe
integration professional (demo mode rests green without keys — the
standing credential gates unchanged), keep the vitest + playwright
suites healthy, write + validate + execute a TDD remediation plan,
capture dev-server screenshots, update the docs, and push to main via
the SSH wrapper.

**Workspace state.** PULL this round (not reset) — `git pull`
fast-forwarded `ce50713..e27296d` (the user's session_90 narrative log,
docs only); the environment survived intact (node_modules, `.env`,
`db/custom.db` with the hard-link convergence at inode 397471 both
paths, the Playwright Chromium v1243 cache). The `.env` verified:
`DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root. The
`skills/` exclusion re-verified in all four configs.

**Baseline gate.** lint 0/0 · tsc clean · **353/353 unit+integration
(22 files)** · build exit 0 · the full E2E baseline re-run **288/288
(9.6m, foreground — the L26/L27 lesson)**. The documented session-89/90
ship state verified pre-change.

**The docs review.** AGENTS.md, CLAUDE.md, README, PAD v1.45, SKILL
v1.45.0, session_89/90, remediation-plan-session45, the worklog S45 —
the repo is 46 remediation rounds deep, 641 tests, every contract
cross-validated. The skills catalog mapped: tdd (the gate-round
convention — this round additionally takes the honest RED → GREEN path
for the parity fixes), agent-browser (the live reference walk),
clone-app-pat-pro (the parity methodology — the DOM probe is the ground
truth), code-review-and-audit (the lenses).

**The Round-46 live battery (pre-change, the production standalone on
:3000 via `scripts/battery-runner.sh prod`).** The paired pixel sweep
**ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec`
painted both sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%,
checkout 0.01%, account 0%, login 0.28% — byte-identical to the
documented round-42/43/44/45 baselines). **The 51st mobile-nav
verification: TOKEN-EXACT PARITY** (all 10 checks). The standing
watches clean (typeahead: the reference fires ZERO search requests;
carousel ~5000ms; the SEO layer: 17-URL sitemap, robots, JSON-LD). The
console census 24 routes + 11 admin CLEAN. **The dev census 24/24
CLEAN** (ADR-049 verified).

**The candidate triage (session-89's "suggested next" list):** the
search family **CHOSEN** — the sweep's fourth installment (the auth
error-state density re-deferred as the thinner candidate, ~4 pins vs
the search family's ~10 — it becomes the fifth installment). The
sweep's method applied: the search island enumerated
(`search-bar.tsx` + `api/search/route.ts` + `shop/page.tsx` read
line-by-line) and cross-checked against the E2E layer — the typeahead's
ENTIRE state machine, the close/reopen behavior, the toggle behavior,
the empty-submit no-op, the Enter submit, the case-insensitive match,
the API's limit boundary + 429 burst, and the results page's plural
copy all had ZERO pins. The take-100 ceiling RE-DEFERRED; the
rate-limiter store RE-DEFERRED; the credential-gated items UNCHANGED
(no Stripe test-mode keys or email provider provided). The
recent-changes audit (session-45's diff `7015951..e27296d`): test
fixtures + docs only, ZERO production runtime code — CLEAN.

**The calibration (the probes
`scripts/search-behavior-probe-r46[a/a2/b].mjs`, live, login-gated —
the reference's storefront redirects anonymous visitors to /login, the
round's first probe lesson).** The reference's search dropdown carries
the same panel anatomy (input + Search button) but **fires ZERO
search-shaped requests while typing** — no typeahead, no loading line,
no suggestion popover; the reference's `/api/search` returns the SPA
shell (no JSON API exists — a 200 status code is not an API, the
round's second probe lesson). **The reference PRESERVES the typed query
across close/reopen** (measured: value "serum" after toggle-close +
reopen) — the clone RESET it (divergence #1). **The reference's toggle
button CLOSES the open panel** (the second click) — the clone's button
was open-only (divergence #2). The reference's empty submit does NOT
navigate; its typed + Enter submits navigate to `/shop?search=`; its
results page renders **"2 products found"** (the plural template,
byte-identical to the clone's) with case-insensitive matching
("SERUM" → 1 product found).

**THE DELIVERABLE (SEARCH-BEHAVIOR-1)** — THREE production fixes + 12
E2E pins:

- **Fix #1 (the parity divergence):** `search-bar.tsx` — the
  adjust-during-render reset block REMOVED. The typed query + the
  cached suggestions persist across close/reopen (the reference's
  measured behavior); the cached popover re-appears on reopen (the
  superset detail — the reference has no popover to preserve).
- **Fix #2 (the parity divergence):** `header.tsx` — the search button
  TOGGLES the panel (`setSearchOpen(!searchOpen)` + `aria-expanded`).
  The old open-only onClick was a measured divergence.
- **Fix #3 (THE CLIP FIX — the round's discovery):** the strip's
  session-8-era `overflow-hidden` had **clipped the typeahead popover
  to a 4px sliver — the superset feature was VISUALLY INVISIBLE for 38
  green rounds**. Playwright's `toBeVisible()` is clipping-blind (a
  non-zero bounding box passes), so every E2E assertion on the popover
  stayed green while the customer never saw it; the round's VLM
  screenshot verification caught it (2/5 → the geometry probe measured
  the truth: the popover 62px tall, 58px below the strip's boundary).
  The `overflow-hidden` never served the slide-in animation (it clips
  the element's CONTENT, not the transformed element itself) — removed,
  the popover renders below the strip unclipped, the resting pixels
  unchanged (the panel renders nothing when closed — the sweep stayed
  byte-identical).
- **`tests/e2e/srch-behavior.spec.ts`** — 12 pins: P1 the deferred-route
  "Searching…" loading line + the suggestion transition; P2 the
  no-match calm state; P3 the query preservation (the honest RED);
  P4 the toggle-close (the honest RED); P5 the empty-submit no-op;
  P6 the Enter submit; P7 the case-insensitive typeahead; P8 the API
  limit boundary (11 → 400, 10 → 200); P9 the results-page plural
  ("2 products found"); P10 the results-page case-insensitivity; P11
  the 429 + Retry-After burst (LAST — it exhausts the 60/min budget;
  the file named `srch-` so it sorts AFTER `search.` AND `smoke.`, and
  no later spec touches the endpoint); P12 the popover's NON-CLIPPING —
  **a REAL `elementsFromPoint` hit-test at the row's center, the honest
  visibility check Playwright cannot fake**.

**The round's honest moments (three):** (1) the first capture run
crashed on a Node/browser scope slip (`closedInput` referenced inside
the `page.evaluate` browser callback — the probe's Node-side variable;
fixed by merging it outside); (2) the first VLM verification read
**2/5** — 242/243/244 "missing the popover" — which the geometry probe
then confirmed as the REAL CLIP DEFECT (the VLM was right, the DOM
existence probes were the wrong instrument — `querySelector` measures
existence, not visibility); (3) the re-run VLM needed one description
correction (the logo renders "LUXE", not "Lumina" — the description
wrote the reference's name; the recurring describe-reality lesson).

**Mutations ×5, each caught at the E2E layer on the REBUILT artifact
(the session-36 lesson), byte-exact reverts (md5-verified at every
step):** M1 the reset block restored → **exactly P3**; M2 the
`|| loading` clause dropped from `showSuggestions` → **exactly P1**;
M3 the empty-submit guard deleted → **exactly P5**; M4 the toggle
reverted to open-only → **exactly P4**; M5 the `overflow-hidden`
restored → **exactly P12** (P1/P3 stayed green under M5 — the clipping
is invisible to Playwright's checks; only the hit-test pin catches it —
the mutation mapping's own proof of the pin's necessity).

**Full gate:** lint 0/0 · tsc clean · 353/353 unit (22 files) · build
0 · **the FULL E2E 300/300 (9.7m) + 300/300 (9.8m) × 2 consecutive
runs on the final code — 653 total** (up from 641: +12 E2E).

**Post-change battery:** the sweep re-run ALL 8 ROUTES AT BASELINE
(byte-identical — all three production fixes are pixel-invisible on the
resting surfaces); the **52nd mobile-nav verification** re-run
TOKEN-EXACT (the 51st and 52nd in one round).

**Screenshots 241–245** (probe-first, single invocation, the production
standalone on :3001 — a FRESH process, re-captured after the clip fix):
the search panel's resting anatomy (the standing anchor); the typeahead
LOADING state (the deferred route, the "Searching…" line); the
suggestion popover (the serum row — the name, the lowercase category,
the price); the REOPENED panel with the PRESERVED query + the cached
popover (the parity fix's proof state); the results page's plural copy
("2 products found"). **VLM 5/5 PASS** after the logo-description
correction.

**Docs:** PAD **v1.46** (§8.1's srch-behavior row + the Total
46/653/353+300; §8.4's checklist 300; §3.2's tree 23 specs + the
srch-behavior entry; the v1.46 revision row), SKILL **v1.46.0** (the
version + lesson 051 + Appendix C → session46), AGENTS (the
search-behavior bullet), CLAUDE (300 + the family), README (the 653
row + the Testing table + the mobile-nav 52 row), the verifier's
spec-count recalibration 22→23 (the drift watch re-run ALL FAMILIES
GREEN), this log, the worklog S46 entry, the plan's sign-offs.
`.env.example` verified current (no env plumbing).

## Round 46 shipped ✅
**Session complete** — the baseline 641-test gate verified on the
pulled workspace; the Round-46 battery (sweep + the 51st mobile-nav +
watches + census + dev-census) all clean pre-change and re-verified
post-change. **The deliverable: SEARCH-BEHAVIOR-1** — the search
family's behavioral contract, the customer-surfaces pin-density sweep's
fourth installment: THREE production fixes (the query preservation +
the toggle-close, both reference-measured divergences, and THE CLIP FIX
— the typeahead popover visually invisible for 38 rounds under the
strip's overflow-hidden while the E2E stayed green) + 12 pins (the
typeahead state machine, the parity behaviors, the API edge contract,
the results-page copy, and the honest elementsFromPoint hit-test).
**Gate: 653 tests** (353 unit + 300 E2E × 2 consecutive runs),
quintuple-mutation-proven at the E2E layer (each on the rebuilt
artifact, byte-exact reverts), sweep at baseline, the 51st + 52nd
mobile-nav token-exact, VLM 5/5.
**New lessons:** (1) Playwright's `toBeVisible()` is CLIPPING-BLIND —
an ancestor's `overflow-hidden` can render a superset feature
invisible while every visibility assertion stays green; the honest pin
is a REAL `elementsFromPoint` hit-test at the element's center, and the
VLM screenshot verification is the discipline that catches what the
E2E layer structurally cannot; (2) `overflow-hidden` on a
self-animating element never clips the animation — only the element's
content (the popover below the strip was the collateral); (3) the
reference's storefront is LOGIN-GATED — every live probe authenticates
first; and a 200 from a platform catch-all is not an API — verify the
response SHAPE, not the status; (4) `querySelector` measures EXISTENCE,
not VISIBILITY — a DOM probe on a clipped element lies exactly like
`toBeVisible()` does.
**Suggested next:** the sweep's fifth installment — the auth family's
error-state density (the short-password box path via the register
form's `fieldErrors` fallback + the three pending labels + the
register native-email block); the credential-gated items remain (Stripe
test-mode keys — the refund SDK path live; an email provider — the
guest-order merge-back). Just send the next round instruction when
ready.
