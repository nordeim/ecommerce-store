# Remediation Plan — Session 43 (Round 43): NEWSLETTER-E2E-1 — The Newsletter Funnel's E2E Pin Family (the Customer-Surfaces Pin-Density Sweep's First Installment)

**Date:** 2026-10-11 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `a583efb` (the session-42 ship `e17d015` + the user's session_84 narrative log)
**Status at audit start:** 614-test gate (353 unit+integration + 261 E2E), PAD v1.42, SKILL v1.42.0 — lint 0/0 · tsc clean · 353/353 unit+integration (22 files) · build exit 0 · the full E2E baseline re-run **261/261 (8.4m, foreground)** verified pre-change.

## 0. The round's mandate

The user's standing round instruction (the full audit/parity workflow with the mobile-nav + Tailwind v4 watches; the `.env`/db-root contract — verified: `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root, the hard-link convergence HELD (inode 529174 at both `db/custom.db` paths — NOT a reset this round, `git pull` fast-forward `e17d015..a583efb`); the professional Stripe integration verification — demo mode rests green without keys, the standing credential gates unchanged; the vitest + playwright suites — both verified with the `skills/` exclusion re-confirmed in all four configs (tsconfig `exclude`, eslint `ignores`, vitest `include` — `src/**` + `tests/**` only, playwright `testDir` — `./tests/e2e`); the TDD remediation plan; the screenshots; the `.env.example` — verified current, this round adds NO env plumbing; the docs; and the main-only push via the SSH wrapper). No Stripe test-mode keys or email credentials were provided (the two standing credential-gated candidates stay gated), so the round's deliverable is audit-derived.

## 1. Baseline verification (state at audit start)

- **`git pull` fast-forward `e17d015..a583efb`** (the user's session_84 narrative log; NOT a reset — the environment survived: node_modules, the Playwright Chromium v1243 cache, `.env`, `db/custom.db` + `db/e2e.db`); the working tree clean; the env-shadowing trap re-verified LIVE (the injected shell `DATABASE_URL` wins) — the session-42 hard-link convergence HELD (inode 529174 at BOTH `db/custom.db` paths; `tests/db-path.test.ts` inside the 353).
- Baseline gate: lint 0/0 · tsc clean · **353/353 unit+integration (22 files)** · build exit 0 · **the full E2E baseline re-run 261/261 (8.4m, foreground)** — the documented session-83/84 ship state verified pre-change; the round-40 drift watch re-run **GREEN 25/25** at audit start.
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd** (the RED-GREEN-REFACTOR discipline — for a test-infrastructure round, the gate-round convention: calibration → pins → mutation-style efficacy proofs), **agent-browser** (the live reference walk — the newsletter probe below), **clone-app-pat-pro** (the parity methodology — the reference's inert mock vs the clone's DB-backed superset), **code-review-and-audit + code-quality-standards** (the 12-category/six-axis lenses on the newsletter surface's code).
- **The Round-43 live battery (the audit's parity layer, against the production standalone on :3000 — the exact shipped artifact, via `scripts/battery-runner.sh prod`):** the paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, both sides painted on slide `1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%, checkout 0.01%, account 0%, login 0.28% — byte-identical to the documented round-42 baselines). **The 45th mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500 with identical hrefs; the Electronics deep-link + auto-close). The standing watches clean (typeahead: the reference fires ZERO search requests; carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD). The console census **24 routes + 11 admin + the date-window family (3 routes) CLEAN**. **The dev census 24/24 CLEAN** (zero console errors, zero painted dev-tool badges — ADR-049 verified working first-hand).

## 2. Audit results

### 2.1 The candidate triage (session-83's "suggested next" list)

1. **The customer surfaces' E2E pin density (CHOSEN — the round's deliverable, below):** the standing "natural next audit sweep" (re-deferred twice, sessions 81 + 83). The sweep's method: enumerate the customer-facing surfaces' behaviors and cross-check each against the E2E layer. First-hand findings: home/shop/PDP (storefront-parity 32 + catalog-parity 10 — dense), cart (10), checkout (9), account (32 — the densest), wishlist (6), search (11), auth (22), guest flows (2+3), stock (2). **ONE surface family has ZERO E2E coverage: the newsletter funnel** — a real DB-writing customer surface (footer island → POST /api/newsletter → Zod → rate-limit → NewsletterSubscriber upsert → inline response), present on EVERY page (the footer renders `NewsletterForm`), with only a Zod-shape unit pin (`validation.test.ts:115`) and a passing comment reference (storefront-parity's ©-line scope note). The densest gap, exactly what the sweep exists to find.
2. **The `take: 100` pagination ceiling (RE-DEFERRED — unchanged):** the seed fixture is 4 orders; the date-range window (ADR-048) is the reach-past tool; server-side pagination deferred until fixture scale demands it.
3. **The rate-limiter store migration (RE-DEFERRED — the PAD's open Medium, unchanged):** correct for single-instance SQLite.
4. **The credential-gated items (UNCHANGED):** Stripe test-mode keys and an email provider — no credentials provided this round.
5. **The recent-changes audit (session-42's `src/lib/csp.ts` + `src/proxy.ts`):** re-read line-by-line — CLEAN (the 9 unit pins + the E2E negative pin + the dev census green are the proof; the drift watch GREEN 25/25).

### 2.2 THE PRIMARY FINDING — the newsletter funnel: a DB-writing customer surface with ZERO E2E pins (NEWSLETTER-E2E-1)

The surface (shipped session-4, refined since): the footer's "Stay Updated" column renders the `NewsletterForm` client island — `type="email"` + `required` + `aria-label="Email address"` input, the reference-parity small Join button (h-8/32px), posting to `/api/newsletter` (Zod-validated `newsletterSchema`, rate-limited **10/10min/IP** via the shared `rateLimit` seam, idempotent `NewsletterSubscriber` upsert), rendering the inline `role="status"` line ("Thanks for subscribing!" / the error copy) and the privacy line. The measured gaps, first-hand:

- **The full funnel is untested end-to-end.** No spec fills the input, clicks Join, or asserts the inline response. The API route's contract (200 shape, the invalid-email 400, the bad-body 400, the 429 + Retry-After) has ZERO pins at any layer beyond the Zod shape (the rate-limit path itself is only unit-pinned on the SHARED seam, never exercised through THIS route).
- **The run-to-run isolation contract has a hole.** `prisma/e2e-reset.ts` clears carts/wishlists/spec-users/addresses/orders/stripe-events/password-tokens — but NOT `NewsletterSubscriber`. The family's own convention (every table a spec writes gets a reset) says the table joins the reset the day a spec writes it — this round.
- **The idempotent re-subscribe (the DB-backed superset's own proof) is unpinned.** A `create` in place of the upsert would surface as a P2002 500 on the second subscribe — no test would catch it today.

**The reference relationship (measured live this round, `scripts/newsletter-probe-r43.mjs`):** the reference's newsletter block renders the SAME resting anatomy — "Stay Updated" h3, "Subscribe for exclusive offers and new arrivals." copy, placeholder "Your email", the 32px Join button, "By subscribing, you agree to our Privacy Policy." — but its input is a BARE text input (no type, no aria-label, not required) and its Join click is **fully INERT**: zero network calls, no status line, no toast (the Base44 cosmetic mock). The clone's funnel is the classic superset: same resting surface, real behavior. The resting anatomy pins are therefore PARITY pins (measured against the reference); the behavior pins are SUPERSET pins (the clone's own contract). Zero parity risk — the round changes NO production code.

**Why this is the round's deliverable (the judgment call, made):** it is the standing candidate list's own "natural next sweep," the audit's densest first-hand gap (a DB-writing surface on every page with zero end-to-end pins), and the test-infrastructure-round precedent is established (the a11y gate session-15/16, the perf gates 17/18/21, the SEO gate 20 — calibration, pins, mutation-style efficacy proofs); the mutations prove the pins have teeth.

### 2.3 The deliverable's shape

1. **`tests/e2e/newsletter.spec.ts`** — the NEW spec (7 pins, ordered — the rate-limit test is LAST, it exhausts the limiter budget):
   - **P1 (anatomy, parity):** the footer's "Stay Updated" column — the h3, the copy, the input's placeholder "Your email" + `aria-label="Email address"` + `type=email` + `required` (the superset attrs pinned as the clone's own contract), the exact-text Join button, the privacy line.
   - **P2 (UI happy path):** fill `e2e.newsletter@example.com` → Join → the inline `role="status"` line "Thanks for subscribing!" + the input cleared.
   - **P3 (idempotent re-subscribe):** the SAME email again → still "Thanks for subscribing!" (the upsert — the DB-backed superset proof; a `create` regression trips P2002 → the 500 fallback copy).
   - **P4 (API invalid email):** POST `not-an-email` → 400 `{ ok: false, message: "Enter a valid email address" }`.
   - **P5 (API bad body):** POST a non-JSON body → 400 `{ ok: false, message: "Invalid request body." }`.
   - **P6 (API happy shape):** POST a valid email → 200 `{ ok: true, message: "Thanks for subscribing!" }`.
   - **P7 (rate limit, LAST):** burst POSTs until 429 → `{ ok: false, message: "Too many attempts. Please try again later." }` + the `Retry-After` header present. Budget math: P2..P6 consume 5; the limiter trips at request 11 (10/10min); the loop's 12-iteration ceiling gives headroom. **Only this spec POSTs to /api/newsletter** (verified by grep) and the suite runs `workers: 1, fullyParallel: false` → the count is deterministic; each `bun run test:e2e` run boots a FRESH server (the webServer lifecycle) → the in-memory limiter resets per run (the ×2 gate convention is safe — the auth specs' own 10/15min limiter already proves the per-run reset).
2. **`prisma/e2e-reset.ts`** — `await db.newsletterSubscriber.deleteMany({})` joins the transient clears (the table has NO seeded fixtures — clear-all is the correct form; the run-to-run isolation contract closed).

**NO production code changes.** The pins document existing behavior (the route + island read line-by-line this round — clean: the rate-limit-before-parse ordering, the upsert, the `role="status"` naming pattern all follow the established conventions).

## 3. The TDD plan (the gate-round convention: calibration → pins → mutations)

### 3.1 Calibration (the RED-equivalent for a test-infrastructure round)

The reference probe (`scripts/newsletter-probe-r43.mjs`, this round): the resting anatomy measured live (the parity pins' ground truth) + the click inertness proven (no network/status/toast — the superset framing). The clone's behavior read line-by-line from `newsletter-form.tsx` + `api/newsletter/route.ts` + `validation.ts` + `rate-limit.ts` (the superset pins' ground truth).

### 3.2 The pins, written to the measured truth

The 7-pin spec + the reset clear (§2.3). Run against the current artifact: **all green by design** — the pins document existing behavior (the gate-round form; the RED discipline lives in the mutations).

### 3.3 The mutation-style efficacy spot-checks ×3 (each caught at the E2E layer, the artifact REBUILT for every proof — the session-36 lesson, then byte-exact revert, md5-verified at every step)

- **M1 (the upsert):** `upsert` → `create` in the route (the re-subscribe trips P2002 → the 500 fallback) → **P3 fires** (the second subscribe renders the fallback copy, not the success line); P2/P6 stay green (a fresh email row succeeds on create) — the precise mutation→pin mapping.
- **M2 (the validation copy):** the Zod message drift (`"Enter a valid email address"` → `"Invalid email"`) → **P4 fires** (the exact-message pin).
- **M3 (the rate-limit gate):** the `rl.ok` check bypassed in the route → **P7 fires** (no 429 ever arrives within the loop ceiling — the timeout-driven failure).

### 3.4 The full gate (the regression proof)

lint (0/0) · typecheck · the FULL unit layer (353 — unchanged) · build · **the FULL E2E × 2 consecutive runs on the final code (261 + 7 = 268 each run — the L26/L27 lesson: foreground)**.

## 4. Execution order

1. **Calibration:** the reference probe (done, §3.1) + the code read (done).
2. **PINS:** write `tests/e2e/newsletter.spec.ts` + the e2e-reset clear; run the spec (261 + 7 = 268 green); the unit layer re-run (353 — the reset change is E2E infrastructure, not unit-covered).
3. **Mutations ×3** (§3.3 — each caught + byte-exact revert, the artifact rebuilt for every E2E proof).
4. **Full gate:** lint · typecheck · unit · build · the FULL E2E × 2 consecutive runs.

## 5. Post-change battery + screenshots

- The pins' own proof IS the deliverable's battery (the funnel exercised end-to-end through the production standalone on :3100).
- The paired pixel sweep re-run (all 8 routes — a test-only round must be pixel-INVISIBLE; the baseline band must hold exactly) + the 46th mobile-nav verification re-run (token-exact parity must hold).
- **Screenshots 226–230** (probe-first, single invocation, the production standalone): the home anchor (the standing slide); the footer's Stay Updated block close-up (the resting surface — the round's parity anchor); the subscribe success state (the inline role=status line + the cleared input, live-DOM probed); the API error state (the invalid-email inline line — driven via the page's fetch from the browser console-equivalent island path, or the request-level response rendered — the capture shows the surface, the probe shows the 400 body); the mobile nav open (the standing watch surface). VLM 5/5 verification (describe the surface as it IS — the round-40/41/42 lesson).

## 6. Docs duty (this round's deliverable + the round's own records)

The PAD **v1.43** (ADR-050? — NO: this is not an architecture decision, it is a test-coverage round; the PAD's §8.1 gains the newsletter spec row + the Total row 43/621/353+268; §8.4's checklist 353/268; the revision row — the ADR ledger UNCHANGED, the pin-density sweep documented in the testing section) · SKILL **v1.43.0** (the E2E inventory's newsletter row + Appendix C → session43) · AGENTS.md (the test-count rows + the newsletter-funnel bullet) · CLAUDE.md (353/268) · README (the Testing table + the gate row) · `docs/session_85.md` (the round narrative) · the worklog S43 entry · this plan's sign-offs · the drift watch recalibrated (the count spots 353/261 → 353/268) and re-run GREEN · `.env.example` verified current (NO env plumbing).

## Sign-offs (completed at execution)

- [x] Calibration recorded (the reference probe — the inert mock + the measured resting anatomy; the code read line-by-line)
- [x] Pins green (8/8 on the current artifact incl. the setup login — 7 new pins; the unit layer 353 unchanged; two honest-RED fixes earned: `toBeRequired()` → the attribute form; playwright JSON-quotes string `data` → the empty-body drive)
- [x] Mutations ×3 caught + byte-exact reverts (md5 f9a518…/8fd372… verified at every step; each on the REBUILT artifact — M1 upsert→create → the re-subscribe pin + the burst pin with the fresh-subscribe pin green; M2 the Zod drift → exactly the exact-message pin; M3 the gate bypassed → exactly the 429 pin)
- [x] Full gate × 2 consecutive runs on the final code (353 + 268 × 2 = 621 total — 8.6m + 8.6m)
- [x] Post-change battery (sweep 8/8 at baseline — byte-identical, pixel-invisible · the 46th mobile-nav token-exact — the 45th + 46th in one round · the dev census clean · screenshots 226–230 VLM 5/5 — incl. the rate-limited red error state driven through 11 UI submits on a fresh server)
- [x] Docs aligned (PAD v1.43, SKILL v1.43.0, AGENTS, CLAUDE, README, the verifier's spec-count recalibration 19→20 — the drift watch re-run GREEN 25/25 after catching the tree's 19-specs line, session_85.md, the worklog S43 entry); committed to main; pushed via the SSH wrapper
