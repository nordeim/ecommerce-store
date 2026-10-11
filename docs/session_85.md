# Session 85 — Round 43: NEWSLETTER-E2E-1 — The Newsletter Funnel's E2E Pin Family ("The Pin-Density Sweep's First Catch")

The standing round instruction: refresh the workspace, review the docs,
validate against the codebase, audit with the repo skills (the
`skills/` folder excluded from checking/testing/compilation — re-verified
in all four configs), achieve parity with the live reference (the
agent-browser walk + the sweep battery), pay particular attention to
the mobile navigation (the Tailwind v4 trap log), keep the Stripe
integration professional (demo mode rests green without keys — the
standing credential gates unchanged), keep the vitest + playwright
suites healthy, write + validate + execute a TDD remediation plan,
capture dev-server screenshots, update the docs, and push to main via
the SSH wrapper.

**Workspace state.** NOT reset this round — `git pull` fast-forward
`e17d015..a583efb` (the user's session_84 narrative log); the
environment survived intact (node_modules, the Playwright Chromium
cache, `.env`, `db/custom.db` + `db/e2e.db`). The env-shadowing trap
re-verified LIVE (the injected shell `DATABASE_URL` wins) — the
session-42 hard-link convergence HELD (inode 529174 at BOTH
`db/custom.db` paths). The repo `skills/` exclusion re-verified in all
four configs.

**Baseline gate.** lint 0/0 · tsc clean · **353/353 unit+integration
(22 files)** · build exit 0 · the full E2E baseline re-run **261/261
(8.4m, foreground — the L26/L27 lesson)**. The documented session-83/84
ship state verified pre-change; the round-40 drift watch re-run GREEN
25/25 at audit start.

**The docs review.** AGENTS.md, CLAUDE.md, README, PAD v1.42, SKILL
v1.42.0, session_83/84, remediation-plan-session42, the worklog S42 —
the repo is 43 remediation rounds deep, 614 tests, every contract
cross-validated. The skills catalog mapped: tdd (the gate-round
convention: calibration → pins → mutation-style efficacy proofs),
agent-browser (the live reference walk), clone-app-pat-pro (the parity
methodology), code-review-and-audit + code-quality-standards (the
12-category/six-axis lenses).

**The Round-43 live battery (pre-change, the production standalone on
:3000 via `scripts/battery-runner.sh prod` — the exact shipped
artifact).** The paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND**
(home 0% [6 px, both sides painted on slide `1237b9a1afec`]; shop
0.05%, pdp 0.34%, cart 0.01%, wishlist 0%, checkout 0.01%, account 0%,
login 0.28% — byte-identical to the documented round-42 baselines).
**The 45th mobile-nav verification: TOKEN-EXACT PARITY** (all 10
checks). The standing watches clean (typeahead: the reference fires
ZERO search requests; carousel ~5000ms cadence; the SEO layer: 17-URL
sitemap, robots, JSON-LD, offers.price 299.99 USD). The console census
24 routes + 11 admin + the date-window family (3 routes) CLEAN. **The
dev census 24/24 CLEAN** (zero console errors, zero painted dev-tool
badges — ADR-049 verified working first-hand, the round-42
deliverable's own watch).

**The candidate triage (session-83's "suggested next" list):** the
customer surfaces' E2E pin density **CHOSEN** — the standing "natural
next audit sweep" (re-deferred twice). The sweep's method: enumerate
the customer-facing surfaces' behaviors and cross-check each against
the E2E layer. First-hand findings: storefront-parity 32 +
catalog-parity 10 (dense), cart 10, checkout 9, account 32 (the
densest), wishlist 6, search 11, auth 22, guest flows 2+3, stock 2 —
**ONE surface family has ZERO E2E coverage: the newsletter funnel**.
The take-100 ceiling RE-DEFERRED (the seed fixture is 4 orders); the
rate-limiter store RE-DEFERRED (correct for single-instance SQLite);
the credential-gated items UNCHANGED (no Stripe test-mode keys or email
provider provided). The recent-changes audit (session-42's csp.ts +
proxy.ts): re-read line-by-line — CLEAN.

**THE PRIMARY FINDING.** The footer's "Stay Updated" funnel is a
DB-writing customer surface present on EVERY page (island → POST
/api/newsletter → Zod → rate-limit 10/10min/IP → NewsletterSubscriber
upsert → the inline role="status" line) with ZERO E2E pins — only a
Zod-shape unit pin and a passing comment reference existed. And
`prisma/e2e-reset.ts` did not clear the table (the isolation
contract's hole). The reference relationship measured live
(`scripts/newsletter-probe-r43.mjs`): the reference renders the SAME
resting anatomy (the h3, the copy, "Your email" placeholder, the 32px
Join button, the privacy line) but its input is a BARE text input and
its Join click is fully INERT — zero network calls, no status line, no
toast (the Base44 cosmetic mock). The clone's funnel is the classic
superset: same resting surface, real behavior.

**THE DELIVERABLE (NEWSLETTER-E2E-1)** — 7 E2E pins + the isolation
fix, ZERO production code changes:

- **`tests/e2e/newsletter.spec.ts`** — the resting anatomy (the parity
  pins + the superset attrs type=email/required/aria-label); the UI
  subscribe success state (the role="status" line + the cleared input);
  the idempotent re-subscribe (the upsert guard — a create-regression
  trips P2002 → the 500 fallback); the API invalid-email 400 (the Zod
  copy); the bad-body 400; the 200 shape; the rate-limit 429 +
  Retry-After (the burst-until-trip form — LAST in the spec, it
  exhausts the shared in-memory budget; deterministic: workers:1, only
  this spec POSTs the endpoint, each E2E run boots a fresh server).
- **`prisma/e2e-reset.ts`** — the NewsletterSubscriber clear (no
  seeded fixtures — clear-all; the run-to-run isolation contract's
  newest member).

**The round's own RED moments (the honest-drive lessons):** the first
spec run failed 2/7 — `toBeRequired()` does not exist in this
Playwright version (the attribute form `toHaveAttribute("required",
"")` is the pin), and playwright JSON-quotes string `data` (a string
body arrives as a VALID JSON string → the Zod non-object rejection,
NOT the route's catch) — the bad-body pin's honest drive is an EMPTY
POST body. Both fixed to the measured truth; 8/8 green (the setup
login + 7 pins).

**Mutations ×3, each caught at the E2E layer on the REBUILT artifact
(the session-36 lesson), byte-exact reverts (md5 f9a518…/8fd372…
verified at every step):** M1 upsert→create → exactly the re-subscribe
pin + the burst pin (the fresh-subscribe pin stays green — the precise
mutation→pin mapping); M2 the Zod message drift → exactly the
exact-message pin; M3 the rate-limit gate bypassed → exactly the 429
pin.

**Full gate:** lint 0/0 · tsc clean · 353/353 unit (22 files) · build
0 · **the FULL E2E 268/268 (8.6m) + 268/268 (8.6m) × 2 consecutive
runs on the final code — 621 total** (up from 614: +7 E2E).

**Post-change battery:** the sweep re-run ALL 8 ROUTES AT BASELINE
(byte-identical — a test-only round is pixel-invisible by requirement);
the **46th mobile-nav verification** re-run TOKEN-EXACT (the 45th and
46th in one round — pre- and post-change).

**Screenshots 226–230** (probe-first, single invocation, the
production standalone on :3001 — a FRESH process whose in-memory rate
limiter starts at zero, which the 229 burst budget depends on): the
home anchor (the standing slide); the Stay Updated column's resting
anatomy (probe: h3/copy/placeholder/aria-label/type/required/Join
32px/privacy line, NO status line at rest); the subscribe success
state (probe: POST 200, the line, the cleared input); **the
rate-limited state** (11 UI submits through the fresh limiter — probe:
the 11th POST 429, Retry-After 595, the error line in text-red-300);
the mobile nav open (the standing watch surface). The capture row
cleaned from the dev DB (the dev-cleanup form). **VLM 5/5 PASS.**

**Docs:** PAD **v1.43** (the §8.1 newsletter row + Total 43/621/353+268;
§8.4's checklist 268; §3.2's tree 20 specs + the newsletter entry; the
v1.43 revision row), SKILL **v1.43.0** (the version + Appendix C →
session43), AGENTS (the newsletter-funnel bullet), CLAUDE (268 + the
funnel), README (the 621 row + the Testing table + the mobile-nav 46
row), the verifier's spec-count recalibration 19→20 (the drift watch
re-run GREEN 25/25 — it caught the tree's 19-specs line first, the
watch earning its keep again), this log, the worklog S43 entry, the
plan's sign-offs. `.env.example` verified current (no env plumbing).

## Round 43 shipped ✅
**Session complete** — the baseline 614-test gate verified on the
survived workspace (the hard-link convergence held); the Round-43
battery (sweep + the 45th mobile-nav + watches + census + dev-census)
all clean pre-change and re-verified post-change. **The deliverable:
NEWSLETTER-E2E-1** — the newsletter funnel's E2E pin family, the
customer-surfaces pin-density sweep's first installment: 7 pins (the
anatomy, the success state, the idempotent re-subscribe, the two 400s,
the 200 shape, the 429 + Retry-After) + the e2e-reset isolation clear.
**Gate: 621 tests** (353 unit + 268 E2E × 2 consecutive runs),
triple-mutation-proven at the E2E layer (each on the rebuilt artifact,
byte-exact reverts), sweep at baseline, the 45th + 46th mobile-nav
token-exact, VLM 5/5.
**New lessons:** (1) the pin-density sweep's method works — enumerate
behaviors per surface, cross-check the E2E layer, and the densest gap
surfaces immediately (a DB-writing surface on every page had zero
end-to-end pins); (2) playwright's request fixture JSON-quotes string
`data` — the honest drive of a parse-failure catch path is an EMPTY
body; (3) `toBeRequired()` is not in every Playwright version — the
attribute form is the portable pin; (4) the capture-server protocol
cares about LIFECYCLE state, not just mode — the rate-limit shot needed
a FRESH process (an in-memory limiter at zero), not merely a production
one.
**Suggested next:** the pin-density sweep's second installment — the
checkout-family validation paths (the shipping form's error states, the
edit-back navigation) are the next-thinnest customer surface; the
credential-gated items remain (Stripe test-mode keys — the refund SDK
path live; an email provider — the guest-order merge-back). Just send
the next round instruction when ready.
