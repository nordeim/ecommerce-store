# Session 77 — Round 39: The Carrier-Holiday Delivery Window ("Never Quote a Christmas")

The standing round instruction: refresh the workspace, review the docs,
validate against the codebase, audit with the repo skills (the
`skills/` folder excluded from checking/testing/compilation — verified
in all four configs), achieve parity with the live reference (the
agent-browser walk + the sweep battery), pay particular attention to
the mobile navigation (the Tailwind v4 trap log), keep the Stripe
integration professional, keep the vitest + playwright suites healthy,
write + validate + execute a TDD remediation plan, capture dev-server
screenshots, update the docs, and push to main via the SSH wrapper.

**Workspace state.** RESET — the sandbox was re-provisioned; a fresh
`git clone` at `d691c40` (the session-38 ship `2dcfd8e` + the user's
session-75/76 narrative logs, zero code delta). The env-shadowing
trap verified LIVE (the injected shell `DATABASE_URL`
`file:/home/z/my-project/db/custom.db` wins over both `.env` files) —
neutralized the session-21 way: `db:setup` ran against the injected
path, then the hard-link convergence put BOTH `db/custom.db` paths on
one inode (133438). The fresh sandbox needed the Playwright browsers
re-installed (chromium-headless-shell v1243). `bun install` green
(475 packages) · `bun run db:setup` idempotent (6 categories, 12
products, 4 users, 4 canonical orders, 3 hero slides); the repo
`skills/` exclusion re-verified in all four configs.

**Baseline gate.** lint 0/0 · tsc clean · **323/323 unit+integration
(21 files)** · build exit 0 · the FULL E2E baseline re-run **254/254
(8.4m, foreground — the L26/L27 lesson)**. The documented
session-75/76 ship state verified pre-change.

**The docs review.** AGENTS.md, CLAUDE.md, README, PAD v1.38, SKILL
v1.38.0, session_75/76, remediation-plan-session38, the worklog S38 —
the repo is 38 remediation rounds deep, 577 tests, every contract
cross-validated. The skills catalog mapped: tdd, agent-browser,
clone-app-pat-pro, code-review-checklist, code-quality-standards, plus
the repo's own trap log and `skills/nextjs16-tailwind4` §9 (the
mobile-nav pattern). The doc reviews (delegated in parallel) found a
larger-than-usual stale-spot ledger: the PAD's §8.1 per-file E2E rows
six stale (sum 232 ≠ 254 — the v1.38 fix corrected only the totals),
the ADR-045/046 ordering slip, §9.2's env table missing the three
Stripe vars, §11's reset row "no token table" (stale since
session-20), §2's topology + §6.4's PSP note, the SKILL §20 model
count "(13)" and §4.2's "seven" traps, CLAUDE's route-handler lists,
AGENTS' auth-group members + the CSP superseded marker — all fixed
this round.

**The Round-39 live battery.** The paired pixel sweep **ALL 8 ROUTES
AT BASELINE** (home 0% [6 px, both sides painted on slide
`1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%,
checkout 0.01%, account 0%, login 0.28%). **The 39th mobile-nav
verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg
rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500
with identical hrefs; the Electronics deep-link + auto-close). The
watches clean (typeahead: the reference fires ZERO search requests;
carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots,
JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11
admin surfaces CLEAN.

**The code audit (sessions 36–38 + a general scan).** CLEAN — no real
bugs: the delivery-window math independently re-swept over 400
placement days (0 weekend bounds, 0 inversions, DST-moot); both
consumers render the calm state with no DOM delta; the server-action
discipline holds; the three ship commits' file lists match their
documented scope. Three audit micro-findings rode the round: the
cross-month exact-string unit pin gap (filled by the Memorial Day
pin), the unreachable example in checkout.spec's comment (fixed), and
the PAD stale rows (fixed).

**The candidate triage (session-75's list):** the carrier-holiday
calendar CHOSEN (the named candidate — "jurisdiction-aware — needs a
store-config decision"; ADR-046's own documented (−)); the per-order
shipping-method surface re-deferred (the session-38 parity ruling —
the reference checkout carries no selector); the rate-limiter store
re-deferred (the PAD's open Medium, unchanged). The credential-gated
items unchanged (no Stripe test-mode keys or email provider provided).

**THE DELIVERABLE (DELIVERY-WINDOW-3, ADR-047)** — one seam module,
zero consumer churn, zero schema change, zero E2E pin churn:

- **The finding:** the round-38 window counted Mon–Fri but was
  holiday-blind — on the 2026 calendar itself a Friday 2026-12-18
  placement's +7 bound IS Christmas Day, and a Friday 2026-11-20
  placement's +7 bound IS Thanksgiving. The independent full-year
  oracle (a first-principles re-implementation, `scripts/
  verify-holiday-math-r39.mjs` — never the seam) counted 10 placements
  of 2026 whose window lands a bound on a carrier holiday. Every
  high-end store's "3–7 business days" excludes the carrier holidays.
- **The store-config decision (the candidate's open question, MADE):**
  the store's implicit jurisdiction is the US (USD prices, the $9.99
  flat US shipping tier, the State/ZIP address form) → the standard US
  carrier set: the SIX dates New Year's Day (Jan 1), Memorial Day
  (last Monday of May), Independence Day (Jul 4), Labor Day (first
  Monday of September), Thanksgiving (4th Thursday of November),
  Christmas Day (Dec 25) — the UPS/FedEx ground-tier no-delivery set,
  NOT the USPS retail-closure set (MLK/Presidents'/Columbus/Veterans/
  Juneteenth are post-office closures the standard carriers deliver).
- **The exact-date policy:** a fixed-date holiday falling on a weekend
  is already skipped by the weekday rule — no observed-day shift (the
  standard carriers run normal Friday/Monday service; Jul 4, 2026 is a
  Saturday and the 2026 math is identical with or without the
  calendar). Pinned by the Jul-4 policy pin — GREEN through RED and
  GREEN by design; an observed-day model would quote "Jul 8 – 13" and
  fail it.
- **The implementation (inside `src/lib/delivery-window.ts` — the
  round's ONLY production change):** the exported
  `carrierHolidaysForYear(year)` (the six-date table, UTC calendar
  arithmetic — the pinned contract), `isCarrierHoliday` (the UTC-date
  membership check), the stepper's predicate `isDeliverableDay =
  isBusinessDay && !isCarrierHoliday` (the honest `addDeliverableDays`
  rename landed WITH the behavior change), and the per-step year
  resolution (a window crossing Dec 31 picks up the next year's table
  — the double-holiday pin: placed Tue 2026-12-22 → "Dec 28, 2026 –
  Jan 4, 2027", crossing BOTH Christmas and New Year's).
- **The independent oracles:** the unit layer pins HAND-COMPUTED 2026
  and 2027 holiday tables (deriving the expectations from the seam's
  own calendar would be tautological) + per-holiday exact windows
  (Thanksgiving week → "Nov 30 – Dec 4, 2026"; Christmas week →
  "Dec 24 – 31, 2026"; Memorial Day → "May 27 – Jun 2, 2026" — also
  the cross-month exact-string pin; Labor Day → "Sep 9 – 15, 2026")
  + the UPDATED cross-year pin ("Dec 31, 2026 – Jan 7, 2027" — the
  +7 bound steps past Fri Jan 1, 2027) + the extended full-year
  property sweep (365 placements of 2026, both bounds parsed back from
  the three text formats and asserted Mon–Fri AND not a carrier
  holiday — the holiday-blind math fails it on 10 placements).
- **Zero E2E pin churn:** the seeded fixtures are March-placed
  (holiday-free) — the ORD-2026-002 exact pin "Mar 18 – 24, 2026"
  HOLDS; the confirmation's SHAPE regex holds. The round's documented
  known limitation: the E2E layer has no holiday-exercising pin
  (re-dating the fixtures would churn every spec's pins for one
  refinement; live orders place at NOW) — the holiday math is
  UNIT-layer-proven; the E2E layer's role was collateral-damage
  verification (the standing pins held green under the refinement).
- **Zero parity risk — doubly superset-only:** the reference carries
  NO estimate on ANY surface (the round-38 live verification; the
  surfaces are unchanged this round).

**The plan** — docs/remediation-plan-session39.md written and validated
file-by-file against the codebase (the E2E impact census: zero pin
churn — the March fixtures are holiday-free; the math pre-verified by
the independent oracle script before the plan was written).

**TDD RED:** the 9 new/updated unit pins fail for the RIGHT reasons —
6 assertion failures on the refined strings (the math is the defect) +
2 missing-export failures on `carrierHolidaysForYear` + the full-year
sweep's property violation (a Memorial-Day to-bound) — with the 10
carried-over pins GREEN through RED (the calm ×3, the March exact
pins, the in-transit dual-state, the Jul-4 policy pin, the 14-day
sweep, the constants).

**TDD GREEN → REFACTOR:** the six-date table + the stepper predicate
(19/19 in the seam file) → the full layer **332/332** → the REFACTOR
module-header rewrite (the round-38 header's "holidays deliberately
NOT modeled" line had become a lie — the rewrite documents the
six-date set, the US-jurisdiction decision, the exact-date policy;
behavior-neutral, re-run green) → the E2E GREEN runs (account +
checkout + the a11y census 66/66 — the standing pins held).

**Mutations ×3, each caught at the unit layer + byte-exact revert
(md5 6cc7714b2fd7bf05b23dc78477a29e7a verified at every step):** M1
the holiday check dropped from the stepper (the regression to the
holiday-blind form) → 7 failures (the 6 holiday-encoding pins + the
sweep); M2 the Thanksgiving computation mutated 4th→3rd Thursday → 4
failures (BOTH table oracles — the computation mutates for all years —
+ the pin + the sweep); M3 the Christmas fixed date mutated Dec 25→26
→ 5 failures (both oracles + the Christmas-week + double-holiday pins
+ the sweep).

**Full gate:** lint 0/0 · tsc clean · 332/332 unit+integration · build
exit 0 · **the FULL E2E 254/254 (8.2m + 8.3m) × 2 consecutive runs on
the final code (586 total)**.

**Post-change battery:** the sweep re-run ALL 8 ROUTES AT BASELINE;
the 39th mobile-nav verification re-run TOKEN-EXACT again; the watches
+ census clean. (One battery lesson re-learned: the first post-change
sweep run failed its clone login — a STALE SERVER from the pre-change
battery still held :3000 while serving HTML that referenced static
chunk hashes the mid-round rebuild had wiped; the documented
stale-server kill procedure resolved it — kill by port, fresh boot,
re-run, all clean.)

**Screenshots 206–210** (the remediated app, captured against the
production standalone on :3001 — the exact shipped artifact): the
Thanksgiving-window ORD-2026-002 customer detail (the dev DB's
placedAt TEMPORARILY set to 2026-11-24T12:00:00Z → the "Estimated
delivery: Nov 30 – Dec 4, 2026" estimate — the round's headline
visual, fullPage), the estimate-line close-up (the element capture at
deviceScaleFactor 2 — the round-38 VLM OCR lesson), the placed-order
confirmation with the live window (a REAL order placed through the
browser — ORD-2026-005, placed Sunday 2026-10-11T03:42:17Z, quoting
"Oct 14 – 20, 2026", fullPage), the ORD-2026-001 calm-state detail
(no estimate line, fullPage), home (the standing anchor). **The live
DOM probed BEFORE the VLM run** (the probe inside the capture script:
the estimate text/class/position on the tweaked 002, the calm absence
on 001, the fresh confirmation's estimate + class + the DB row);
**VLM 5/5 PASS** (the 206 description honestly notes the temporary
placedAt tweak — the timeline rows keep their seeded March timestamps
while the Placed line and the estimate reflect Nov 24). The dev DB
cleaned after the captures (the placedAt restored to the canonical
2026-03-15T10:22:00Z; dev-cleanup: 1 stray order removed, stock
restored, 5 demo-order status_changed events removed).

**Docs:** AGENTS.md (the DELIVERY-WINDOW-3 architecture rule + the
auth-group five-members fix + the CSP superseded marker), CLAUDE.md
(the session-39 contract + the 332/254 counts + the route-handler/
topology fixes), README (the 586-test row + the estimate clause's
carrier-holiday form + the 39th mobile-nav verification + the
Testing-table counts), PAD **v1.39** (ADR-047 + the revision row + the
ADR-045/046 ordering fix + the stale-spot fixes: the six §8.1 per-file
E2E rows verified against `playwright --list`, §9.2's env table gains
the three Stripe vars, §11's reset row, §2's topology, §6.4's PSP
note), SKILL **v1.39.0** (the ADR-047 row + §20's model count 13→15 +
§4.2's seven→eight + §11's counts + the Appendix C latest-plan
pointer), this log, the worklog S39 entry, the plan's sign-offs.
`.env.example` verified current — the round adds NO env plumbing (the
holiday calendar is code-only).

## Round 39 shipped ✅
**Session complete** — the baseline 577-test gate verified on the fresh
clone (the env-shadowing trap re-neutralized by the hard-link
convergence; the fresh sandbox's Playwright browsers re-installed);
the Round-39 battery (sweep + 39th mobile-nav + watches + census) all
clean pre-change and re-verified post-change (after one stale-server
re-run).
**The deliverable: DELIVERY-WINDOW-3 (ADR-047)** — the carrier-holiday
delivery window: the standard-shipping quote now counts business days
that skip the six standard US carrier non-delivery dates (the
UPS/FedEx ground-tier set, the US store-config decision made, the
exact-date policy with no observed-day shift), computed per-step-year,
UTC-deterministic; the quote never again promises a Thanksgiving or
Christmas arrival. One seam module changed, both consumers untouched —
zero schema change, zero fixtures, zero E2E pin churn.
**Gate: 586 tests** (332 unit+integration + 254 E2E), two consecutive
full runs, triple-mutation-proven at the unit layer. Committed to
`main`, pushed via the SSH wrapper (remote verified, key shredded).
**Suggested next:** the standing credential-gated items remain (Stripe
test-mode keys — would drive the refund action's SDK path live AND
unlock the deferred dashboard deep-link; an email provider — would
unlock the deferred guest-order merge-back). The next audit-derived
candidates: (1) the PAD's §3.2 architecture tree + §4.1 ER diagram +
§12 key-files line counts remain stale (this round fixed the factual
table rows; the tree/ER rewrites are a larger DOCS-ALIGN pass);
(2) a per-order shipping-method surface — still BLOCKED on parity
unless the reference changes; (3) the rate-limiter store migration
(the PAD's open Medium — unchanged, correct for single-instance
SQLite). Just send the next round instruction when ready.
