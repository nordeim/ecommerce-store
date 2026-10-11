# Remediation Plan — Session 40 (Round 40): DOCS-ALIGN-1 — The Structural Docs Rewrites (the Tree, the ER Diagram, the Key-Files Table, and the ADR-046 Duplicate)

**Date:** 2026-10-11 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `380ea2f` (the session-39 ship `07567ba` + the user's session-77/78 narrative logs)
**Status at audit start:** 586-test gate (332 unit+integration + 254 E2E), PAD v1.39, SKILL v1.39.0 — lint 0/0 · tsc clean · 332/332 unit+integration (21 files) · build exit 0 · the full E2E baseline re-run **254/254 (8.3m, foreground)** verified on the fresh clone.

## 0. The round's mandate

The user's standing round instruction (the professional Stripe integration verification — demo mode rests green without keys, the standing credential gates unchanged; the full audit/parity workflow with the mobile-nav + Tailwind v4 watches; the `.env`/db-root contract — verified: `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root, the env-shadowing trap neutralized by the session-21 hard-link convergence, `/api/health` returns `db: true`; the vitest + playwright suites — both verified with the `skills/` exclusion in all four configs; the TDD remediation plan; the screenshots; the `.env.example` — verified current, this round adds NO env plumbing; the docs; and the main-only push via the SSH wrapper). No Stripe test-mode keys or email credentials were provided (the two standing credential-gated candidates stay gated), so the round's deliverable is audit-derived — the pattern of rounds 27–39.

**Workspace state this round:** FRESH CLONE at `380ea2f` (the sandbox was re-provisioned — `git clone` over `git pull`). The env-shadowing trap verified LIVE (the injected shell `DATABASE_URL` — `file:/home/z/my-project/db/custom.db` — wins over the repo `.env`); neutralized the session-21 way: `bun run db:setup` ran against the injected path, then the hard-link convergence put BOTH `db/custom.db` paths on one inode (134504). The Playwright browsers re-installed for the fresh sandbox (chromium-headless-shell v1243). `bun install` green (475 packages) · `bun run db:setup` idempotent (6 categories, 12 products, 4 users, 4 orders, 3 hero slides); the repo `skills/` exclusion re-verified in all four configs (tsconfig `exclude`, eslint `ignores`, vitest `include`, playwright `testDir`).

## 1. Baseline verification (state at audit start)

- **Fresh clone at `380ea2f`** — the working tree clean; the repo `skills/` folder exclusion re-verified in all four configs.
- Environment contracts: `.env` re-created from `.env.example` with `DATABASE_URL="file:../db/custom.db"` · `db/` at the repo root (the hard link in place, inode 134504 both paths) · `bun run db:setup` green and idempotent · `tests/db-path.test.ts` 15/15 on the fresh link.
- Baseline gate: lint 0/0 · tsc clean · **332/332 unit+integration (21 files)** · build exit 0 · **the full E2E baseline re-run 254/254 (8.3m, foreground — the L26/L27 lesson)** — the documented session-77/78 ship state verified pre-change.
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd** (the RED-GREEN discipline adapted to a docs round — the verification script IS the test layer, §3), **agent-browser** (the live reference walk — via the established Playwright-form battery scripts, the sessions 12–39 protocol), **clone-app-pat-pro** (the parity methodology — a docs-only round is triply parity-safe), **code-review-checklist + code-quality-standards** (the audit's 12-category/six-axis lenses — applied to the DOCS this round: every doc claim checked against the codebase the way code is checked against its contract), plus the repo's own `ecommerce-store_SKILL.md` (the doc under repair) and AGENTS.md (the fact source).
- **The Round-40 live battery (the audit):** the paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, both sides painted on slide `1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%, checkout 0.01%, account 0%, login 0.28%). **The 40th mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500 with identical hrefs; the Electronics deep-link + auto-close). The standing watches clean (typeahead: the reference fires ZERO search requests; carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11 admin surfaces CLEAN.
- **The code audit (sessions 37–39 + a general scan, the 12-category/six-axis lenses):** CLEAN — the round-39 seam (`src/lib/delivery-window.ts`) re-read line-by-line: the holiday table, the stepper predicate, the per-step year resolution, the cache, and the format branches all correct (the math is round-39-proven by the independent oracle + triple mutations; no re-derivation needed — the audit confirms the code matches its documented contract); both consumers (`/account/orders/[id]` L141, `/checkout/success` L98) compose the seam unchanged; the round-39 ship commit's file list matches its documented scope (23 files: the seam + test + checkout.spec comment + docs + 7 scripts + 5 screenshots). **No real bugs.** Four code-side COMMENT-drift micro-findings ride the round (§2.4).

## 2. Audit results

### 2.1 The candidate triage (session-77's "suggested next" list)

1. **The DOCS-ALIGN pass (CHOSEN — §2.2):** session-77's named first candidate — "the PAD's §3.2 architecture tree + §4.1 ER diagram + §12 key-files line counts remain stale (this round fixed the factual table rows; the tree/ER rewrites are a larger DOCS-ALIGN pass)". The round-40 docs audits (three parallel subagents, each fact-checked against the codebase) measured the drift far beyond the three named spots: ~36 stale spots across four docs + **one structural DEFECT the audits discovered — ADR-046 is DUPLICATED in the PAD's ledger** (§2.3).
2. **The rate-limiter store migration (DEFERRED — the PAD's open Medium, unchanged):** re-evaluated and re-deferred (no new information; correct for single-instance SQLite).
3. **The per-order shipping-method surface (DEFERRED — the session-38 parity ruling, unchanged):** the reference's checkout step 1 carries no method selector; a visible selector would change the resting visual of a checkout parity surface. Unchanged until a parity-safe design exists.
4. **The credential-gated items (UNCHANGED):** Stripe test-mode keys and an email provider — no credentials provided this round.

### 2.2 THE PRIMARY FINDING — the PAD's structural sections drifted from the codebase by 39 rounds of accretion, and the drift is now self-contradictory (DOCS-ALIGN-1)

The PAD's factual TABLES were corrected round-by-round (§8.1's per-file counts, §9.2's env table, §11's reset row — the session-39 fixes all verified current by this round's audits), but the three STRUCTURAL sections were last rewritten in the single-digit sessions and never extended. The measured drift:

- **§3.2's annotated directory tree (L499–546): ~28 of 128 `src/` files absent + 4 wrong annotations.** The entire `src/lib/actions/` directory (6 files) is undocumented despite §3.1 and §12 both referencing it; 15 of 33 non-test lib modules absent (the whole `order-*` seam family, the `admin-*` trio, the `stripe`/`stripe-config`/`stripe-payment` trio, `delivery-window`, `metadata`, `reset-token`, `utils`); 6 app-tree paths absent (`account/orders/[id]`, `admin/payments`, `reset-password/` ×2, `[...notFound]`, `api/stripe/webhook`); **`src/proxy.ts` absent while §6.1 (L675) explicitly cites it — the PAD contradicts itself**; the "3-endpoint whitelist" line (L522) is wrong (4 endpoints since session-22; §2's topology WAS fixed in session-39, §3.2 wasn't); "12 specs" vs the real 19 spec files + `helpers.ts` + the `tests/stripe-webhook.integration.test.ts` (18 tests) unlisted; `prisma/dev-cleanup.ts` unlisted.
- **§4.1's ER diagram (L585–602): 3 of 15 models absent.** `PasswordResetToken` (session-20, ADR-028), `StripeEvent` (session-22, ADR-030), `NewsletterSubscriber` (session-2) are missing from the mermaid (12 drawn of 15 — 20% of the model inventory absent), and the missing relation `User ||--o{ PasswordResetToken`. The L602 model notes predate every session-20+ schema addition: `Order.stripePaymentIntentId`/`paymentStatus` (s22), `Order.carrier`/`trackingNumber` (s36), `StripeEvent.amount`/`failureReason` (s25/s30) — 6 columns + 3 models undocumented.
- **§12's key-files table (L878–893): 12 of 14 rows understate; the real tree is ~49% larger.** Documented ≈2,607 lines vs real 3,896: `seed.ts` ~330 → **763** (2.3×), `storefront-parity.spec.ts` ~110 → **564** (5.1×), `actions/checkout.ts` ~140 → 230, `account-tabs.tsx` ~430 → 511, `schema.prisma` ~190 → 245, `globals.css` ~110 → 175, `cart.ts` ~230 → 265, `checkout-flow.tsx` ~370 → 401, `hero-carousel.tsx` ~150 → 172, `store-provider.tsx` ~200 → 220, `auth.ts` ~100 → 110, `toast-viewport.tsx` ~50 → 53 (only `db-path.ts` 107 ✓ and `mobile-navigation.spec.ts` —10 off — are close).
- **The four-doc stale-spot ledger (the audits' exact line numbers):** AGENTS.md ×7 (L413 "52 tests" → 67, L413 "11 tests" → 18, the session-log totals that read as standing coverage — L685/L789/L835; plus 3 new-behavior omissions: the CSP's conditional Stripe expansion in `src/proxy.ts` L47/L68–71, the a11y gate's silently-extended surface list, the undocumented `start`/`db:migrate`/`db:generate`/`test:watch` scripts) · CLAUDE.md ×7 (L29 (auth) "login/register/forgot-password" → the five members, L53 "24 unit tests" → 54, L86 "6 tests" → 7, L124 §5's spec list missing `seo.spec.ts` + `stripe.spec.ts`, L158 "11 tests" → 18) · README ×8 (L67 mermaid + L96–106 File Hierarchy missing `/api/stripe/webhook`, `/admin/payments`, `/account/orders/[id]`, `/reset-password`, `stripe-pay.tsx`, `buy-panel`, `shop-filters`, the integration test; L109 the 253+1 setup split; L116 "Bun ≥ 1.1" vs SKILL's "≥ 1.3") · SKILL ×14 (L120 "Environment variables (3)" → 7 + the 4-row table extension, L500 "23 routes" → 26, L272 "55 tsx / 26 use client" → 68 / 34, L189+L1331 "eight measured differences" → the 14-entry trap log, L264–279 §5.2/§5.3 inventories — `reset-password` the fifth auth route / "all five screens" / the force-dynamic rewrite (also §5.4 L287 "auth pages are static by construction" — false since ADR-022), `skeleton.tsx` not `toast.tsx` / `category-card.tsx` not `category-showcase` / `stripe-pay.tsx` / the admin filter+tracking+refund components, L317–322 "3 demo orders" → 4 + the ORD-2026-004/tracking/timeline fixtures, L1001–1002 "3-endpoint route whitelist" → 4, L850 §12's lessons numbering jumps 31 → 33 with "L32" on the item numbered 33, L110 the Radix list carries 3 uninstalled packages, L249 the 7-module lib list vs 27 modules, L693–694 "two static auth screens" → three).

**Why this is the round's deliverable (the judgment call, made):** the drift is no longer cosmetic — the PAD contradicts ITSELF (§3.2's tree vs §6.1's proxy.ts citation), the ledger carries an actual structural defect (§2.3), and the four docs' inventories misstate the codebase's shape to the next agent (the docs ARE the project's operating manual — 39 rounds of remediation have run on them). A docs-only round is triply parity-safe (zero rendering paths touched, zero schema, zero fixtures, zero E2E pin churn — the lightest possible round form), and the verification script (§3) turns the static drift into a regression-guarded contract so the structural sections cannot silently rot again.

### 2.3 THE STRUCTURAL DEFECT — ADR-046 is duplicated in the PAD's ADR ledger (the session-39 ordering fix misfired)

The session-39 docs duty claimed "the ADR-045/046 ordering slip" was fixed (the PAD v1.39 revision row + ADR-047's own (+) list). It was not: the fix MOVED a copy of the ADR-046 block to its ordered position but LEFT THE ORIGINAL in place. The ledger now reads: ADR-043 (L409) → ADR-044 (L416) → **ADR-046 (L425 — out of order)** → ADR-045 (L432) → **ADR-046 again (L438 — byte-identical duplicate, verified by `diff`)** → ADR-047 (L445), with a missing blank-line separator between ADR-045's Consequences and the duplicate's header. The ledger carries 48 ADR headers for 47 ADRs. **The fix: delete the L425–430 block (the out-of-order first copy), keep the ordered L438 copy, restore the separator.** This is the round's headline defect — the ledger is the PAD's most-load-bearing reference structure (every round cites it; the SKILL's Appendix A mirrors it).

### 2.4 The code-side micro-findings (comment drift only — zero behavior)

Four code comments lie about the code they document (found by the audits, verified first-hand):

1. `prisma/seed.ts` L6: the header says the demo fixtures are "(ORD-2026-001/002/003)" — **ORD-2026-004 has existed since session-33** (the cancelled+refunded fixture). Fix: "ORD-2026-001–004".
2. `prisma/schema.prisma` L153: `number String @unique // ORD-YYYY-NNNNNN` — the actual format is **`ORD-YYYY-NNN`** (zero-padded to 3 — `actions/checkout.ts` L37 documents it correctly, and PAD §4.2 L608 is correct too). Fix the comment.
3. `src/lib/actions/checkout.ts` L9: the module header repeats the same `ORD-YYYY-NNNNNN` wrong form. Fix the comment.
4. `prisma/schema.prisma` L205: the `OrderEvent.type` comment lists only `"placed" | "status_changed" | "payment_succeeded" | "payment_failed"` — the live vocabulary (censused across the seed, the actions, and the webhook) is six values: + **`payment_refunded`** (session-32) + **`tracking_added`** (session-36), and `order-timeline.ts`'s switch enumerates exactly these six. Fix the comment.

**Comment-only changes are behavior-neutral** (Prisma ignores schema comments when generating the client; the TS comments are not compiled). The full gate re-run ×2 (§3.5) is the proof.

### 2.5 E2E impact census

**ZERO.** The round touches no rendering path, no schema DATamodel (comments only), no fixtures, no config, no test files. All 586 tests must pass UNCHANGED — the gate is the round's regression proof (a docs round's "mutation test" is: the gate stays green while the docs change, proving the docs were never load-bearing for behavior). The battery re-run (§5) proves the artifact still renders at parity.

## 3. The TDD plan (adapted to a docs round — the verification script IS the test layer)

### 3.1 RED — `scripts/verify-docs-align-r40.mjs` (the docs-claims verifier)

A new verification script (the `verify-holiday-math-r39.mjs` precedent — an independent oracle, never reading the docs' own claims as truth) that programmatically checks the load-bearing structural claims against the codebase:

1. **The §3.2 tree check:** extract every documented `src/` path from the PAD's tree block; diff against the real `find src -type f` census; assert (a) every documented path exists, (b) every load-bearing real path is documented (the allowlist: `src/proxy.ts`, the 6 `actions/`, the 15 non-test lib modules beyond the original 12, `account/orders/[id]/page.tsx`, `admin/payments/page.tsx`, `reset-password/`, `[...notFound]/page.tsx`, `api/stripe/webhook/route.ts`, `tests/stripe-webhook.integration.test.ts`, `prisma/dev-cleanup.ts`, the e2e spec count ≥ 19).
2. **The §4.1 ER check:** parse the mermaid block's model names; assert all 15 `grep '^model'` names appear; assert the `User ||--o{ PasswordResetToken` relation is drawn.
3. **The §12 line-count check:** parse the table's `| path | ~N |` rows; `wc -l` each file; assert |real − documented| ≤ 5 per row (the table keeps "~" values honest).
4. **The ADR-ledger check:** extract `ADR-NNN` headers in order; assert strictly increasing 001→047, zero duplicates, zero gaps.
5. **The cross-doc counts:** the route-handler count = 4 (the real `src/app/api/**/route.ts` census), the env-var count = 7 (`.env.example`'s documented vars), the rate-limiter census = 7 (login 10/15, verify-resend 3/10, pwreset 5/15, checkout 10/10, stripe-intent 10/10, newsletter 10/10, search 60/1), the model count = 15, the Radix dependency list = exactly the 6 installed packages, the e2e spec count = 19, the Prisma `OrderEvent.type` comment carries all six values.

**RED:** the script fails today on every family (the tree diff ~28 missing + 2 wrong annotations; the ER 3 models + 1 relation missing; the line counts 12/14 out of tolerance; the ledger non-monotonic with a duplicate; the cross-doc counts wrong in §3.2's endpoint line + SKILL's env/route/trap/Radix/spec counts + AGENTS/CLAUDE's test counts). The RED run is recorded per-family BEFORE any doc is touched.

### 3.2 GREEN — the docs rewrites (the fix order)

1. **The PAD §3.2 tree rewrite** — the full annotated tree from the real `find src` census (L499–546), keeping the established annotation style; the `actions/` directory, the `order-*`/`admin-*`/`stripe*`/`delivery-window`/`metadata`/`reset-token` lib rows, `src/proxy.ts`, the 6 missing app paths, the 4-endpoint line, the 19-specs line, `dev-cleanup.ts`.
2. **The PAD §4.1 ER extension** — add the 3 models + the relation to the mermaid; refresh the L602 notes with the 6 post-session-20 columns.
3. **The PAD §12 refresh** — all 14 rows re-counted; add the row for `src/lib/delivery-window.ts` (the rounds-37–39 seam — the table predates it).
4. **The ADR-ledger repair** — delete the L425–430 duplicate, restore the separator (§2.3).
5. **The PAD's remaining spots** — §1.2's ghost `z-ai-web-dev-sdk` row dropped (the package was pruned in session-7's DEPS-1; neither `package.json` nor `bun.lock` carries it); ADR-004 gains a session-22 addendum (the 4th endpoint — historical ADRs stay immutable, the addendum is the honest form); §6.1's rate-limit row gains the two missing limiters; §6.2's inventory gains `reset-token.ts`, `order-view-token.ts`, `stripe.ts`/`stripe-payment.ts`; ADR-001's `src/app/admin/*` → `src/app/(storefront)/admin/*`; the revision row v1.40.
6. **AGENTS.md** — the 7 stale spots (L413 ×2 test counts; the L685/L789/L835 session-log totals restated as current file totals) + the 3 new-behavior notes (the CSP's conditional Stripe expansion; the a11y gate's surface list; the command table's `start` + `db:migrate`/`db:generate`/`test:watch`).
7. **CLAUDE.md** — the 7 stale spots (the (auth) five members at L29; the three test counts L53/L86/L158; the §5 spec list + seo/stripe).
8. **README** — the 8 spots (the mermaid's PAGES/ACTIONS/LIB boxes; the File Hierarchy's 5 route/component rows + the integration test; the 253+1 split; Bun ≥ 1.3).
9. **SKILL v1.40.0** — the 14 spots (the env table 7; the 26 routes; the 68/34 component census; the trap-log scoping; §5.2/§5.3 inventories; §7's 4 demo orders + fixtures; §13's 4-endpoint whitelist; §12's lessons renumbering; the Radix list; the lib inventory; the §5.2/§5.4 auth-route fixes; §12 L23's "three"; the commands +3).
10. **The code-side micro-fixes** (§2.4 — the four comment fixes).

**GREEN:** the verifier re-run passes every family.

### 3.3 The mutation-style efficacy spot-checks (adapted — mutate a DOC, watch the verifier catch it)

Three one-line doc mutations, each must be caught by the verifier, then byte-exact reverted (md5-verified — the tdd discipline applied to the docs layer):

- **M1:** delete one line from §3.2's tree (an `actions/` member) → the tree check must fail (the "every load-bearing path documented" direction).
- **M2:** restore the stale `~330` line count for `seed.ts` → the line-count check must fail.
- **M3:** re-insert a duplicate `ADR-046` header after ADR-045 → the ledger check must fail (the §2.3 defect class can never silently return).

### 3.4 The full gate (the regression proof — zero behavior change)

lint (0/0) · typecheck · the FULL unit layer (332 — unchanged) · build · the FULL E2E × 2 consecutive runs on the final code (254 each — unchanged; the L26/L27 lesson: foreground). Total: **586 (332 unit + 254 E2E), identical to the baseline** — the docs round's proof that nothing behavioral moved.

### 3.5 The schema-comment safety note

`prisma/schema.prisma` changes are COMMENT-ONLY (L153's format note + L205's type vocabulary). Prisma's client generator ignores comments — the generated client in `node_modules/` is byte-identical, `db push` compares the DATamodel not comments, and no migration is implied. The build + full E2E re-runs are the verification.

## 4. Execution order

1. **RED:** write + run `scripts/verify-docs-align-r40.mjs` against the CURRENT docs — record the per-family failures (the drift census).
2. **GREEN:** the ten fix batches in §3.2's order (the ADR-ledger repair first — it's the headline defect; then the three PAD structural rewrites; then the PAD's remaining spots; then AGENTS → CLAUDE → README → SKILL; then the four code-side comment fixes).
3. **The verifier re-run: GREEN per-family.**
4. **Mutations ×3** (§3.3 — each caught + byte-exact revert, md5-verified).
5. **Full gate:** lint (0/0) · typecheck · unit (332) · build · the FULL E2E × 2 consecutive runs (254 × 2) — identical to baseline.

## 5. Post-change battery + screenshots

- The paired pixel sweep re-run (all 8 routes — the standing drift watch; the round touches NO rendering path, so the baseline band must hold exactly).
- The 40th mobile-nav verification's post-change re-run (token-exact parity must hold).
- The watches + census re-run (the touched code is comments only; the census must stay clean).
- **Screenshots 211–215** (the remediated app, captured against the production standalone — the exact shipped artifact): home (the standing anchor), the customer order detail (the rounds-34–39 read surface the docs' new tree documents), the checkout confirmation surface, the admin payments console (the session-24 surface the ER diagram's `StripeEvent` now documents), and the mobile nav (the standing 40-round watch surface). The live DOM probed BEFORE the VLM run; VLM 5/5 required. No dev-DB mutations needed this round (no fixture tweaks — the surfaces rest in their seeded state).

## 6. Docs duty (this round's deliverable IS the docs — plus the round's own records)

The PAD **v1.40** (the §3.2 tree rewrite + the §4.1 ER extension + the §12 refresh + the ADR-046 duplicate repair + the §1.2/ADR-004/ADR-001/§6.1/§6.2 fixes + the revision row) · SKILL **v1.40.0** (the 14 spots) · AGENTS.md (the 7 + 3 spots) · CLAUDE.md (the 7 spots) · README (the 8 spots) · the four code-side comment fixes (§2.4) · `docs/session_79.md` (the round narrative) · the worklog S40 entry · this plan's sign-offs. `.env.example` verified current (the round adds NO env plumbing). The verifier script joins `scripts/` as a standing artifact (the future rounds' drift watch — re-runnable in seconds).

## Sign-offs (completed at execution)

- [x] RED phase verified failing per-family (5/5 families red — 22 failing
      checks: the tree 29 load-bearing paths missing + the 4-endpoint line
      + the spec count; the ER 3 models + the relation + the notes; the
      line counts 12/14 out of tolerance; the ledger 48 headers with the
      ADR-046 duplicate; the cross-doc counts)
- [x] GREEN — the ten fix batches applied (the ADR-ledger repair first,
      then the three PAD structural rewrites, the PAD's remaining spots,
      AGENTS → CLAUDE → README → SKILL, the four code-comment fixes); the
      verifier 5/5 families, 25/25 checks
- [x] Mutations ×3 caught by the verifier + byte-exact reverts (md5
      af9a1e00eef586660bfe1d4d6b1e8510 verified at every step: M1 an
      actions/ tree line deleted → 1 path missing; M2 the stale ~330 for
      seed.ts → ~330 vs 763; M3 a duplicate ADR-046 header → 48 headers,
      dupes)
- [x] Full gate × 2 consecutive runs on the final code (586 total:
      332 unit + 254 E2E — 8.4m + 8.3m — identical to baseline; the
      zero-behavior-change proof)
- [x] Post-change battery (sweep 8/8 at baseline · the 40th mobile-nav
      token-exact re-run · watches + census clean — the kill-by-port
      discipline applied before the battery, the round-39 lesson)
- [x] Screenshots 211–215 captured + VLM 5/5 (probe-first; one reality
      correction earned: the 214 description re-written from the live
      console's technical event types after the honest FAIL; the 212
      navigation re-done via the E2E-mirroring row link after the
      public-number attempt rendered the GUEST-TOKEN-1 generic block;
      dev-cleanup removed the capture's cart item)
- [x] Docs aligned (this round's deliverable: PAD v1.40, SKILL v1.40.0,
      AGENTS, CLAUDE, README, the four code-comment fixes); committed to
      main; pushed via the SSH wrapper
