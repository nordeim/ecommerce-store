# Session 55 — Round 28: The Dashboard Refund-Needed Alert Stat (DASH-ALERT-1 + SWEEP-DIAG-1, ADR-036)

**Date:** 2026-10-09 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `9901111` (the session-27 ship `6d85082` + the user's session-54 log)
**Deliverable commit:** (this round's `feat: session-28 …`)
**Plan:** `docs/remediation-plan-session28.md` · **ADR-036** (PAD v1.28) · **SKILL v1.28.0**

## 0. The round's mandate

The user's standing round instruction (the professional Stripe integration
verification, the full audit/parity workflow with the mobile-nav +
Tailwind v4 watches, the `.env`/db-root contract, the vitest + playwright
suites, the TDD remediation plan, the screenshots, the `.env.example`,
the docs, and the main-only push). The session-53 suggested-next-steps
name the Stripe test-mode keys and the email provider — both still
credential-gated. The actionable candidate is the third: **"the dashboard
could surface the refund-needed count as an alert stat (ONE bounded
query at the entry point — the natural observability graduation)"** —
plus the round's own audit finding (the sweep's transient out-of-band
reading, §1) and its instrumentation fix (§3.4).

## 1. Baseline verification (state at audit start)

- **Workspace RESET this round** — the sandbox was rebuilt, so the repo
  was `git clone`d fresh. Environment rebuilt per the documented
  contracts: `bun install` · `.env` written with the repo contract
  `DATABASE_URL="file:../db/custom.db"` · `bun run db:setup` (6
  categories, 12 products, 4 users, 3 orders, 3 hero slides) · **the
  session-21 hard-link convergence recreated** (the shell's injected
  `DATABASE_URL=file:/home/z/my-project/db/custom.db` resolves to the
  same inode as the repo's `db/custom.db` — inode 264946 at BOTH paths,
  verified) — the env-shadowing trap neutralized exactly as documented.
- Baseline gate: lint 0/0 · tsc clean · **226/226 unit+integration (15
  files)** · build exit 0 (25 routes, standalone present) · **the full
  E2E baseline re-run 230/230 (7.4m, foreground — the L26/L27 lesson:
  the sandbox reaps detached runs between tool calls)** — the documented
  session-27 ship state verified pre-change.
- Skills mapped from `skills/skills-catalog.md`: the standing set
  (agent-browser, tdd, clone-app-pat-pro) +
  **e-commerce-nextjs16-monorepo** (the round's primary — its
  admin-console/observability patterns re-read). The session-27 commit
  re-audited file-by-file (the products seam + island + page wiring +
  the 18 unit + 5 E2E contracts) — all hold.
- **The Round-28 live battery, part 1 (the audit):** the pixel sweep's
  FIRST run measured **home 59.95% (471,434 px) — OUT OF BAND** (7 other
  routes in-band) → the round-26 drift playbook invoked → the full
  investigation (§2.1) → **verdict: a transient cold-boot paint/phase
  artifact, NOT drift** (4 independent re-measurements all 0.00%; the
  active slide identical on both sites; the h1 computed styles
  identical; the CTAs all `/shop`; the shop inventories identical). The
  **28th mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks —
  panel 288px / bg rgb(251,250,249), nav flex gap-4 mt-8, 5 links
  239×44 at 18px/500 with identical hrefs; the Electronics deep-link +
  auto-close passed). The standing watches clean (typeahead — the
  reference fires ZERO search requests; carousel cadence 5000ms; the
  SEO layer — 17-URL sitemap, robots, JSON-LD, offers.price 299.99
  USD). The console census 24 routes + 11 admin surfaces (the payments
  ×4 + products-filter ×4 variants) CLEAN.

## 2. Audit results

### 2.1 THE PROCESS FINDING — the sweep's transient out-of-band reading (SWEEP-DIAG-1, L37)

The diff-band localizer read rows 109–607 (the entire hero region below
the 108px header; 471,434 px ≈ the hero's 976×499) — the IDENTICAL
signature to round-26's real drift. The investigation:

1. **The active-slide probe**: the active hero img is IDENTICAL on both
   sites (`7cfe01108_generated_076a6d07.png`, y=109, 976×499) and the
   h1's computed styles are identical (48px/700/48px, white) — a
   sweep-replica capture diffed **0.00% (16 px)**.
2. **The interleaved replica** (the sweep's exact sequence, the active
   slide recorded at shot time): 3/3 runs **0.00% (6 px)**.
3. **The sweep re-run** (the SAME script, unmodified): home **0%
   (6 px) — ALL ROUTES AT BASELINE**.
4. **The content inventories**: the CTAs all `/shop` (3/3 both sites),
   the hero copy identical, the shop img inventory identical (12 imgs,
   same order).

**Root cause:** the first battery was the cold first-boot run — fresh
browser contexts, cold DNS/TLS to `media.base44.com`, a
freshly-booted standalone server. `networkidle` + the 1000ms settle
guarantees network quiet, not paint completion of a cold-fetched
remote PNG; one side captured unpainted (or mid-flip). **The systemic
gap:** the sweep had NO instrument distinguishing drift from artifact.
**The fix (§3.4):** the sweep now records the hero phase at capture
time (the active slide's src hash tail + its paint state on BOTH
sides, every home capture) — a NOT-PAINTED flag or a differing tail
beside an out-of-band number = artifact (re-measure); identical
painted phases + a persistent diff = drift (run the playbook). Lesson
**L37**, validated live on the final build.

### 2.2 THE PRIMARY FINDING — the dashboard's missing triage entry point (DASH-ALERT-1)

The refund-needed family (sessions 25/26) — a succeeded payment with no
placed order, money the store captured and must refund — is the
operator's most actionable signal, but it lived ONLY behind
`/admin/payments?family=refund-needed`. The dashboard (the console's
entry point) rendered four KPI stat cards + Recent Orders with no trace
of triage work existing: an operator opening the console had to already
know the family filter exists AND navigate to the payments surface to
discover the work.

### 2.3 Verified-healthy (no action)

The session-27 products filters (static re-audit + the E2E baseline
re-ran them green). The session-26 hero/header content pins + the
payments date-range filter (the E2E baseline re-ran their tests green;
the live A/B battery confirmed parity). The 28th mobile-nav token
parity. The `.env` / `.env.example` / db-path contracts (the `.env`
rewritten this round from the `.env.example` contract — byte-equivalent
coverage; no new env plumbing). The SEO/a11y/CWV/INP standing gates —
all green in the baseline re-run.

## 3. The TDD execution trail

1. **RED (unit)** — 4 `refundNeededAlert` contracts appended to
   `src/lib/admin-payments.test.ts` (invisible at 0; the singular label
   at 1 with the family deep-link; the plural label at N; the href =
   the family Select's own value): the function missing → the import
   fails → **4 failed / 34 passed** — RED for the right reason.
2. **RED (E2E)** — the alert test in `admin.spec.ts`'s dashboard
   describe (the alert row visible with the seeded count "1 payment
   needs refund attention" + "Review payments" → the family filter →
   the fixture row): **1 failed** against the unmodified page (the
   alert row does not exist).
3. **GREEN §3.1 (the seam)** — `refundNeededAlert(count)` in
   `src/lib/admin-payments.ts` (the module the family already lives
   in): the discriminated-union return (`{ visible: false }` |
   `{ visible: true; label; href }`), the singular/plural forms, the
   href constant. **38/38 unit.** One GREEN-phase correction caught by
   tsc: the 4th test's union access needed the narrowing guard.
4. **GREEN §3.2 (the wiring)** — the dashboard page: TWO bounded
   queries (the placed-intent input set — orders holding a Stripe
   intent, select-only — + `db.stripeEvent.count`) composed through
   **the SAME seam the payments family filter uses**
   (`buildAdminPaymentWhere({ family: "refund-needed" },
   placedIntentIds)`) — the dashboard stat and the payments list can
   never disagree. The alert row (between the stat grid and Recent
   Orders — an action item, not a KPI): the card anatomy with the
   `border-destructive/30` accent + the triangle chip
   (`bg-destructive/10`), "Payment review needed" (foreground,
   semibold) + the seam's label (muted) + the "Review payments"
   outline Button deep-linking the family. **Icon-only destructive
   accent** — destructive TEXT measures ~3.9:1 on the card and would
   grow the pinned a11y census count.
5. **GREEN §3.3 (the E2E)** — the alert test green through the rebuilt
   standalone (the E2E-serves-the-build lesson); the full admin spec
   **28/28**.
6. **The a11y admin gate re-run GREEN with the pin UNCHANGED** — the
   dashboard census stays {color-contrast} × 8 (the contrast-safe
   design held; no recalibration — the plan's contingency documented
   as moot, the session-27 precedent).
7. **Mutation efficacy ×3** (each reverted, verified byte-exact against
   the pre-mutation backups — one md5 `570171f9…`/`1a40c885…` pair
   across all three reverts): (1) **M1** the seam's visibility gate
   inverted (`count < 0`) → the calm-state unit contract FAILS (the
   alert would render at count 0 — only the unit layer can pin it, the
   e2e fixture set always counts 1); (2) **M2** the pluralization
   dropped (always "payments need") → the singular-form unit contract
   FAILS; (3) **M3** the page passes an EMPTY placed-intent set → the
   count reads 2 (every succeeded event) → the E2E integration guard
   FAILS ("1 payment needs refund attention" not found) — the page
   wiring's own efficacy proof, verified through a rebuild + the
   targeted E2E.
8. **Full gate** — lint 0/0 · tsc clean · **230/230 unit+integration
   (+4)** · build exit 0 (25 routes) · **231/231 E2E (+1), two
   consecutive full runs on the FINAL code (7.5m + 7.5m, zero
   failures)**.
9. **GREEN §3.4 (the instrumentation)** — `sweep-session28.mjs` records
   the hero phase at capture time; the instrumented sweep ran clean on
   the final build: `home 0% (6 px) [hero ref=1237b9a1afec(painted)
   clone=1237b9a1afec(painted)]` — the drift signal is now
   self-diagnosing.

## 4. The live A/B verification (round 28, post-change)

- **The pixel sweep (the instrumented form):** ALL 8 ROUTES AT THE
  BASELINE BAND — home 0% (6 px, both sides painted on the same slide),
  shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%, checkout 0.01%,
  account 0%, login 0.28% — the admin-only change touches no parity
  surface (the design intent).
- **The 28th mobile-nav verification (re-run post-change):** all 10
  checks PASS — the drawer is unaffected.
- **The standing watches:** typeahead — the reference fires ZERO search
  requests; the carousel cadence stable at 5000ms; the SEO layer
  re-verified (17-URL sitemap, robots, JSON-LD, offers.price 299.99
  USD).
- **The console census:** 24 routes + 11 admin surfaces (payments ×4 +
  products filters ×4) — ZERO console errors/pageerrors.
- **Screenshots 151–155** (the dashboard alert live — the entry point
  with the alert row + the seeded count; the deep-link proof — Review
  payments → the refund-needed family with the fixture row; the
  L37-instrumented sweep panel; the unit gate; the E2E gate): **VLM
  5/5 PASS** (152's first FAIL was my description's error — it
  described the UNFILTERED family Select while the deep-link correctly
  lands the "Refund needed" filter; re-verified with the corrected
  description — the session-26 lesson repeat; the transient SDK
  reverted, package.json + bun.lock md5-restored).

## 5. The deliverable

**DASH-ALERT-1 (ADR-036) + SWEEP-DIAG-1 (L37)**:

- **The dashboard's refund-needed alert** — the console's entry point
  now surfaces the payments family's most actionable signal: TWO
  bounded queries (the placed-intent input set + the count) composed
  through the SAME seam the payments family filter uses (a divergent
  count between the dashboard stat and the payments list is
  structurally impossible); the pure `refundNeededAlert` presentation
  contract (the calm state at 0 — only the unit layer can pin it; the
  singular/plural labels; the family deep-link href); the alert row
  with the icon-only destructive accent (the a11y census pin stays 8)
  and the "Review payments" deep-link.
- **The sweep's hero-phase instrumentation** — the drift signal is now
  self-diagnosing: a NOT-PAINTED flag or a differing slide tail beside
  an out-of-band number = artifact (re-measure); identical painted
  phases + a persistent diff = drift (run the playbook).

**Gate at ship:** lint 0/0 · tsc clean · 230/230 unit+integration
(+4) · build exit 0 (25 routes) · 231/231 E2E (+1) = **461 total** —
two consecutive full runs on the FINAL code.

## 6. Suggested next steps

- Provide Stripe test-mode keys (`sk_test`/`pk_test` + a webhook
  endpoint) to exercise the full Payment Element flow live — the
  integration gates cover the webhook contract, and the payments
  surface + the NEW dashboard alert will react to REAL events (the
  alert count derives from the same seam — live refund-needed events
  surface at login).
- Wire an email provider to activate the verification/reset delivery
  (the console.info seams are ready).
- With the alert stat live, the next observability graduation is
  EMAIL/SLACK notification on new refund-needed events (a cron/worker
  query — the seam is already composable) or the order-detail
  refund-trail rendering (the deterministic-failure events already
  record the context).
