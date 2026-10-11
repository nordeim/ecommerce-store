# Session 75 — Round 38: The Business-Day Delivery Window ("Never Quote a Sunday")

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
`git clone` at `de09a07` (the session-37 ship `46318e8` + the user's
session-72/73/74 narrative logs, zero code delta). The env-shadowing
trap verified LIVE (the injected shell `DATABASE_URL`
`file:/home/z/my-project/db/custom.db` wins over both `.env` files) —
neutralized the session-21 way: `db:setup` ran against the injected
path, then the hard-link convergence put BOTH `db/custom.db` paths on
one inode (528497). The fresh sandbox needed the Playwright browsers
re-installed (chromium-headless-shell v1243 — the first E2E attempt
failed on the missing executable, the install fixed it). `bun install`
green · `bun run db:setup` idempotent (6 categories, 12 products, 4
users, 4 canonical orders, 3 hero slides); the repo `skills/` exclusion
re-verified in all four configs.

**Baseline gate.** lint 0/0 · tsc clean · **321/321 unit+integration
(21 files)** · build exit 0 · the FULL E2E baseline re-run **254/254
(8.4m, foreground — the L26/L27 lesson)**. The documented
session-73/74 ship state verified pre-change.

**The docs review.** AGENTS.md, CLAUDE.md, README, PAD v1.37, SKILL
v1.37.0, session_73/74, remediation-plan-session37, the worklog S37 —
the repo is 37 remediation rounds deep, 575 tests, every contract
cross-validated. The skills catalog mapped: tdd, agent-browser,
clone-app-pat-pro, plus the repo's own trap log. Stale doc spots found
at review (the PAD §8.1 test-distribution table at session-30 counts
(475/35 files), the PAD §8.4 pre-push checklist at session-31 counts
(250/236), the SKILL §11 pre-ship checklist at "104 unit / 202 E2E",
the SKILL §3/§7 model count at 13 — it has been 15 since session-27's
own DOCS-ALIGN-1) — all fixed this round.

**The Round-38 live battery.** The paired pixel sweep **ALL 8 ROUTES
AT BASELINE** (home 0% [6 px, both sides painted on slide
`1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%,
checkout 0.01%, account 0%, login 0.28%). **The 38th mobile-nav
verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg
rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500 with
identical hrefs; the Electronics deep-link + auto-close). The watches
clean (typeahead: the reference fires ZERO search requests; carousel
~5000ms cadence; the SEO layer: 17-URL sitemap, robots, JSON-LD,
offers.price 299.99 USD). The console census 24 routes + 11 admin
surfaces CLEAN.

**The reference-checkout audit probe (this round's new audit surface).**
The sweep captures the checkout at its EMPTY state only — the with-cart
state was the gap. Probed the reference's full path (PDP add-to-cart →
the header cart button → the drawer → the Checkout link): step 1
"Shipping Information" carries EXACTLY the seven address fields + the
steps indicator + the order-summary sidebar — **ZERO radios, ZERO
selects, NO shipping-method selector, NO delivery estimate**. The
reference's cart also does not persist across direct navigation (a
mock-platform quirk — the /cart page reads empty while the header badge
shows 1); the drawer is the real path. VLM-verified on the PDP capture:
no delivery-date estimates or shipping-speed controls on the reference's
product surface.

**The candidate triage** (session-73's list): the business-day
refinement of the delivery window CHOSEN (the second named candidate —
closes ADR-045's documented "no business-day math" limitation); the
per-order shipping-method surface DEFERRED on NEW evidence (the probe's
parity ruling: the reference checkout carries no method selector, so a
visible selector would change the resting visual of a checkout parity
surface); the rate-limiter store re-deferred (the PAD's open Medium,
unchanged). The credential-gated items unchanged (no Stripe test-mode
keys or email provider provided).

**THE DELIVERABLE (DELIVERY-WINDOW-2, ADR-046)** — one seam function,
zero consumer churn, zero schema change (the lightest refinement form):

- **The finding:** ADR-045's window counted CALENDAR days — on the
  seeded fixture itself the amateur form was visible: ORD-2026-002
  (placed Sunday 2026-03-15) quoted "Mar 18 – 22, 2026", a max bound ON
  A SUNDAY, a day the standard carrier tier does not deliver. Every
  high-end store quotes business days (the Amazon/Shopify form) because
  the carrier SLA is Mon–Fri.
- **The refined math (inside `src/lib/delivery-window.ts` — the round's
  ONLY production change):** `addBusinessDays(placedAt, n)` steps
  forward in fixed 24h UTC increments counting Mon–Fri days
  (`isBusinessDay` — UTC weekday 1–5; UTC has no DST, so the weekday a
  step lands on is exact — the UTC-determinism discipline extends to
  the stepper). `from = placedAt + 3 business days`, `to = + 7`.
  Holidays deliberately NOT modeled (jurisdiction-specific; the standard
  store quote is Mon–Fri — documented in the seam).
- **The honest rename (the REFACTOR step):** the constants are now
  `DELIVERY_WINDOW_MIN_BUSINESS_DAYS = 3` /
  `DELIVERY_WINDOW_MAX_BUSINESS_DAYS = 7` — the quoted bounds ARE
  business days now; the old `*_DAYS` names would mislead the next
  reader. Verified: the constants' only consumers are the seam + its
  test file.
- **The verified windows:** ORD-2026-002 (Sunday-placed) → "Mar 18 –
  24, 2026"; the Saturday instant → "Apr 1 – 7, 2026" (the format
  branch moves from cross-month to same-month — an extra format-branch
  guard); the Monday cross-year instant → "Dec 31, 2026 – Jan 6, 2027";
  a Friday placement → "Mar 25 – 31, 2026" (the tightest interaction —
  both bounds straddle TWO weekends). The seeded-story coherence holds
  in the honest unit: ORD-2026-001 placed Sat 2026-03-28, delivered Thu
  2026-04-02 = 4 business days — inside the window.
- **The property pin (NEW):** the never-a-weekend-bound contract — a
  14-placement-day sweep (Mar 15–28, 2026: both weekend days and every
  weekday) parses the seam's three pinned text formats back into UTC
  dates and asserts both bounds' weekday ∈ Mon–Fri. The guard against
  off-by-one regressions across ALL placements, not just the chosen
  instants.
- **Zero parity risk — doubly superset-only:** the reference carries NO
  estimate on ANY surface (verified live this round), and both clone
  surfaces are superset-only routes/content.

**The plan** — docs/remediation-plan-session38.md written and validated
file-by-file against the codebase (the E2E impact census: the only
affected pin is the ORD-2026-002 exact string; the calm pins and the
a11y census are status-gated, unaffected; the confirmation's SHAPE
regex holds under the new math; the other specs' confirmation pins are
text pins that never pinned the estimate).

**TDD RED:** the refined unit pins (assertion failures — the math is
the defect; the calm ×3 + the constants pins GREEN through RED, the
carried-over contract) + the updated E2E exact pin (fails on the string
mismatch: "Mar 18 – 22" ≠ "Mar 18 – 24"). All failed for the RIGHT
reasons.

**TDD GREEN → REFACTOR:** the seam's business-day math (10/10 unit
green, the full layer 323/323) → the honest constant rename
(behavior-neutral, re-run green) → the E2E GREEN runs (account +
checkout 37/37; the a11y census 30/30 — both pins held at their
existing values).

**Mutations ×3, each caught at BOTH layers + byte-exact revert
(md5-verified; the artifacts rebuilt for every E2E proof — the
session-36 lesson):** M1 the regression-to-calendar mutation (the
weekend check dropped from the stepper) → unit ×6 AND the E2E exact
pin — the strongest proof: the new pins would catch a regression to
the round-37 form; M2 the MAX bound mutated 7→5 → unit ×6 AND the E2E
("Mar 18 – 20"); M3 the MIN bound mutated 3→2 → unit ×6 AND the E2E
("Mar 17 – 24").

**Full gate:** lint 0/0 · tsc clean · 323/323 unit+integration · build
exit 0 · **the FULL E2E 254/254 (8.4m + 8.3m) × 2 consecutive runs on
the final code (577 total)**.

**Post-change battery:** the sweep re-run ALL 8 ROUTES AT BASELINE;
the 38th mobile-nav verification re-run TOKEN-EXACT again; the watches
+ census clean (the touched routes already in the census walk).

**Screenshots 201–205** (the remediated app, captured against the
production standalone on :3001 — the exact shipped artifact): the
ORD-2026-002 customer detail with the refined estimate line (fullPage),
the estimate-line close-up (the element capture), the placed-order
confirmation with the refined estimate (a REAL order placed through
the browser — ORD-2026-007, fullPage), the ORD-2026-001 calm-state
detail (no estimate line, fullPage), home. **The live DOM probed
BEFORE the VLM run** (probe-r38.mjs: the estimate text/class/position
on 002, the calm absence on 001/004, the fresh confirmation's estimate
+ the mb rhythm + the business-day math verified on the placed
instant); **VLM 5/5 PASS** after one capture correction (the close-up
re-captured at deviceScaleFactor 2 — the 1x crop's 14px text was below
the VLM's reliable OCR threshold; it read "Mar 8" for "Mar 18" — the
DOM is authoritative, the capture now legible). The dev DB cleaned
after the captures (dev-cleanup: 3 stray orders removed, stock
restored, 5 demo-order status_changed events removed).

**Docs:** AGENTS.md (the DELIVERY-WINDOW-2 architecture rule), CLAUDE.md
(the session-38 contract + the 323/254 counts), README (the 577-test
row + the estimate clause's business-day form + the 38th mobile-nav
verification + the Testing-table counts), PAD v1.38 (ADR-046 + the
revision row + **the §8.1/§8.4 stale-count fixes — the table was four
rounds behind**), SKILL v1.38.0 (the ADR-046 row + **the stale-spot
fixes: §11's pre-ship counts, §3/§7's 13→15 model count, the Appendix C
latest-plan pointer**), this log, the worklog S38 entry, the plan's
sign-offs. `.env.example` verified current — the round adds NO env
plumbing.

## Round 38 shipped ✅
**Session complete** — the baseline 575-test gate verified on the fresh
clone (the env-shadowing trap re-neutralized by the hard-link
convergence; the fresh sandbox's Playwright browsers re-installed);
the Round-38 battery (sweep + 38th mobile-nav + watches + census) all
clean pre-change and re-verified post-change.
**The deliverable: DELIVERY-WINDOW-2 (ADR-046)** — the business-day
refinement of the delivery window: the standard-shipping quote now
counts Mon–Fri (placedAt + 3 to + 7 business days, UTC-deterministic,
weekend-skipping, holidays deliberately unmodeled), quoted on the same
two superset-only surfaces; the quote never again lands on a day the
standard carrier tier does not deliver. One seam function changed, both
consumers untouched — zero schema change, zero fixtures.
**Gate: 577 tests** (323 unit+integration + 254 E2E), two consecutive
full runs, triple-mutation-proven at both layers. Committed to `main`,
pushed via the SSH wrapper (remote verified, key shredded).
**Suggested next:** the standing credential-gated items remain (Stripe
test-mode keys — would drive the refund action's SDK path live AND
unlock the deferred dashboard deep-link; an email provider — would
unlock the deferred guest-order merge-back behind the verification
gate). The next audit-derived candidates: (1) a per-order
shipping-method surface — now BLOCKED on a parity-safe design (the
reference checkout carries no method selector; the probe's ruling this
round) unless the reference changes; (2) a carrier-holiday calendar for
the window (jurisdiction-aware — needs a store-config decision); (3)
the rate-limiter store migration (the PAD's open Medium — unchanged,
correct for single-instance SQLite). Just send the next round
instruction when ready.
