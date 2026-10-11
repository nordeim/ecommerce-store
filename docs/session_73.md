# Session 73 — Round 37: The Customer-Facing Delivery Estimate ("When Will It Arrive?")

The standing round instruction: refresh the workspace, review the docs,
validate against the codebase, audit with the repo skills (the
`skills/` folder excluded from checking/testing/compilation — verified
in all four configs), achieve parity with the live reference (the
agent-browser walk + the sweep battery), pay particular attention to
the mobile navigation (the Tailwind v4 trap log), keep the Stripe
integration professional, keep the vitest + playwright suites healthy,
write + validate + execute a TDD remediation plan, capture dev-server
screenshots, update the docs, and push to main via the SSH wrapper.

**Workspace state.** NOT reset — `git pull` fast-forwarded
`1102c3a → 5225615` (the user's session_72.md narrative log only, zero
code delta). The env-shadowing trap verified LIVE: the injected shell
`DATABASE_URL` (`file:/home/z/my-project/db/custom.db`) wins over both
`.env` files — the session-21 hard-link convergence intact (inode
397013 at BOTH `db/custom.db` paths — one file, whichever resolution
wins). `bun run db:setup` idempotent (6 categories, 12 products, 4
users, 4 canonical orders, 3 hero slides). The repo `skills/` exclusion
re-verified in all four configs.

**Baseline gate.** lint 0/0 · tsc clean · **313/313 unit+integration
(20 files)** · build exit 0 · the FULL E2E baseline re-run **252/252
(8.2m, foreground — the L26/L27 lesson)**. The documented
session-71/72 ship state verified pre-change.

**The docs review.** AGENTS.md, CLAUDE.md, README, PAD v1.36, SKILL
v1.36.0, session_71/72, remediation-plan-session36, the worklog S36 —
the repo is 36 remediation rounds deep, 565 tests, every contract
cross-validated. The skills catalog mapped: tdd, agent-browser,
clone-app-pat-pro, plus the repo's own trap log. Two STALE doc spots
found at review (the README's Testing table — last touched at round 32,
under-reporting by 44 unit + 14 E2E; the SKILL doc's §4.3 next/font
line + its Appendix C "latest: session-10" pointer) — both fixed this
round.

**The Round-37 live battery.** The paired pixel sweep **ALL 8 ROUTES
AT BASELINE** (home 0% [6 px, both sides painted on slide
`1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%,
checkout 0.01%, account 0%, login 0.28%). **The 37th mobile-nav
verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg
rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500 with
identical hrefs; the Electronics deep-link + auto-close). The watches
clean (typeahead: the reference fires ZERO search requests; carousel
~5000ms cadence; the SEO layer: 17-URL sitemap, robots, JSON-LD,
offers.price 299.99 USD). The console census 24 routes + 11 admin
surfaces CLEAN.

**The candidate triage** (session-71's list): the customer-facing
delivery-window surface CHOSEN (the first named candidate — "no schema
change, composed from the status + placedAt"; the codebase verified to
carry ZERO estimate code: the arc answered "where is it" but never
"when will it arrive"). The rate-limiter store re-deferred (the PAD's
open Medium, unchanged). The payments-surface Stripe-dashboard
deep-link re-deferred (the configured-mode gate, unchanged).

**THE DELIVERABLE (DELIVERY-WINDOW-1, ADR-045)** — one seam, two
surfaces, zero schema change (the lightest round of the arc):

- **The pure seam** (`src/lib/delivery-window.ts`):
  `deliveryWindowView(status, placedAt)` — a discriminated union (the
  order-tracking precedent: the calm branch carries NO fields). The
  standard-shipping window: `placedAt + 3` to `+ 7` calendar days
  (`DELIVERY_WINDOW_MIN_DAYS/MAX_DAYS` exported + unit-pinned — the
  FLAT_SHIPPING_CENTS precedent: the quoted bounds ARE the contract;
  the seeded fulfillment stories sit inside it — ORD-2026-001 placed
  03-28, delivered 04-02 = 5 days). Visible ONLY for the promise states
  (`processing`, `in_transit`); `delivered` → calm (delivered IS the
  answer — a past window is noise), `cancelled` → calm (no promise —
  the alert-fatigue rule), unknown → calm (the parse-family
  fallthrough). **The date math is UTC-deterministic** (`timeZone:
  "UTC"` in every format call — the formatOrderDate lesson: the worker
  TZ is not a contract), so the unit layer pins exact strings AND the
  E2E pins the seeded fixture's window exactly. The format is the
  professional compressed window: same-month "Mar 18 – 22, 2026",
  cross-month "Mar 31 – Apr 4, 2026", cross-year "Dec 31, 2026 – Jan 4,
  2027" (both years when they differ — the honest form).
- **The customer detail surface** (the header block on
  `/account/orders/[id]`): the estimate line UNDER the order
  number/status row (the Amazon pattern — the estimate is the first
  thing the customer reads after "where's my order") in
  `text-sm text-muted-foreground mt-2`; the header row moves inside a
  `mb-8` wrapper so the CALM state renders byte-identically to the
  pre-round layout (the zero-visual-delta calm pattern).
- **The confirmation surface** (the visible-details branch of
  `/checkout/success`): the estimate joins the muted line stack as the
  WHEN before the money line's HOW MUCH; the mb rhythm composes off
  which lines render (the session-33 refunded-confirmation rendering
  preserved byte-exactly — a cancelled revisit carries no estimate);
  renders for the owner AND the guest token view.
- **The admin console: untouched** — the estimate is a customer
  promise, not operator data. No schema change, no fixtures, no env
  plumbing.

**The plan** — docs/remediation-plan-session37.md written and
validated file-by-file against the codebase (the E2E impact census:
the existing detail pins read cards/rows the estimate never touches;
the a11y census reads ORD-2026-001 — delivered → calm → the pin-8
holds; the other specs' confirmation pins are text pins an added muted
line cannot break).

**TDD RED:** 8 unit contracts (the module absent — the import fails)
+ 2 E2E tests (the line absent on both surfaces). All failed for the
RIGHT reasons (`element(s) not found` on the estimate testid; TS2307
on the module).

**TDD GREEN:** the seam → the detail header → the confirmation. The
full unit layer **321/321** (313 + 8). Both a11y census pins HELD at
their existing values (customer detail 8 — the census reads a
delivered order, the calm state; admin order-detail 7 — untouched).

**Mutations ×3, each caught + byte-exact revert (md5-verified):** M1
the seam's MAX bound mutated 7→5 → unit ×5 (every exact-string window
ends 2 days early + the constant) AND the account E2E exact pin
("Mar 18 – 20" ≠ "Mar 18 – 22") — the artifact REBUILT for the E2E
proof (the session-36 lesson: the playwright webServer boots the
pre-built standalone); M2 the detail's calm gate broken (the line
renders unconditionally) → the E2E calm pins (001/004 render the
line) while the seam's unit pins stay green — the CONSUMER is the
defect; M3 the confirmation's line dropped (`{false && …}`) → the
checkout E2E while both other layers stay green — the second consumer
is the defect.

**Full gate:** lint 0/0 · tsc clean · 321/321 unit+integration ·
build exit 0 · **the FULL E2E 254/254 (8.4m) × 2 consecutive runs on
the final code (575 total)**.

**Post-change battery:** the sweep re-run ALL 8 ROUTES AT BASELINE;
the 37th mobile-nav verification re-run TOKEN-EXACT again; the watches
+ census clean (the touched routes already in the census walk).

**Screenshots 196–200** (the remediated app, captured against the
production standalone on :3001 — the exact shipped artifact): the
ORD-2026-002 customer detail with the estimate line + the tracking
line + the three-row timeline (fullPage), the estimate-line close-up
(the element capture), the placed-order confirmation with the estimate
(a REAL order placed through the browser — ORD-2026-006, fullPage),
the ORD-2026-001 calm-state detail (no estimate line, fullPage), home
— the live DOM probed BEFORE the VLM run (probe-r37.mjs: the estimate
text/class/position on 002, the calm absence on 001/004, the fresh
confirmation's estimate + the mb rhythm + the money line's calm all
verified); **VLM 5/5 PASS** after two description corrections (the
footer's public contact hello@luxestore.com is expected chrome, not an
operator email; the confirmation's window read "Oct 14 – 18, 2026" —
the UTC-midnight rollover between the probe's order and the capture's
order, the +3/+7 math verified correct on both). The dev DB cleaned
after the captures (dev-cleanup: 2 stray orders removed, stock
restored).

**Docs:** AGENTS.md (the DELIVERY-WINDOW-1 architecture rule), CLAUDE.md
(the session-37 contract + the 321/254 counts), README (the 575-test
row + the account-dashboard estimate clause + the 37th mobile-nav
verification + **the stale Testing-table fix — 269/238 → 321/254, four
rounds of drift**), PAD v1.37 (ADR-045 + the revision row), SKILL
v1.37.0 (the ADR-045 row + the §4.3 stale-spot fixes: the self-hosted
woff2 correction + the star-row wording + the Appendix C
latest-session pointer), this log, the worklog S37 entry, the plan's
sign-offs. `.env.example` verified current — the round adds NO env
plumbing.

## Round 37 shipped ✅
**Session 73 complete** — the baseline 565-test gate verified on the
pulled workspace (the env-shadowing trap re-neutralized by the intact
hard link); the Round-37 battery (sweep + 37th mobile-nav + watches +
census) all clean pre-change and re-verified post-change.
**The deliverable: DELIVERY-WINDOW-1 (ADR-045)** — the "when will it
arrive" affordance: the standard-shipping window (placedAt + 3 to + 7
days, UTC-deterministic) quoted on the customer order detail's header
and the just-placed confirmation; delivered/cancelled orders render
nothing (the terminal states carry no promise). Composed from the
status + placedAt only — zero schema change, the lightest round of the
arc.
**Gate: 575 tests** (321 unit+integration + 254 E2E), two consecutive
full runs, triple-mutation-proven. Committed to `main`, pushed via the
SSH wrapper (remote verified, key shredded).
**Suggested next:** the two standing credential-gated items remain
(Stripe test-mode keys — would drive the refund action's SDK path
live AND unlock the deferred dashboard deep-link; an email provider —
would unlock the deferred guest-order merge-back behind the
verification gate). The next audit-derived candidates: (1) the
rate-limiter store migration (the PAD's open Medium — unchanged);
(2) a business-day refinement of the delivery window (weekend
skipping — the current quote is the honest calendar-day form);
(3) a per-order shipping-method surface (a second method would need
the order to carry the choice). Just send the next round instruction
when ready.
