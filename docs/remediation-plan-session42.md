# Remediation Plan — Session 42 (Round 42): CSP-DEV-EVAL-1 — The Dev-Mode CSP `unsafe-eval` Carve-Out (the React Dev-Mode Requirement)

**Date:** 2026-10-11 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `3594796` (the session-41 ship `6fb7860` + the user's session_82 narrative log)
**Status at audit start:** 604-test gate (344 unit+integration + 260 E2E), PAD v1.41 (header micro-drift: still reads v1.40/session-40), SKILL v1.41.0 — lint 0/0 · tsc clean · 344/344 unit+integration (21 files) · build exit 0 · the full E2E baseline re-run **260/260 (8.5m, foreground)** verified pre-change.

## 0. The round's mandate

The user's standing round instruction (the full audit/parity workflow with the mobile-nav + Tailwind v4 watches; the `.env`/db-root contract — verified: `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root, the env-shadowing trap neutralized by a fresh hard-link convergence, inode 529174 at both `db/custom.db` paths, `/api/health` returns `db: true`; the professional Stripe integration verification — demo mode rests green without keys, the standing credential gates unchanged; the vitest + playwright suites — both verified with the `skills/` exclusion in all four configs; the TDD remediation plan; the screenshots; the `.env.example` — verified current, this round adds NO env plumbing; the docs; and the main-only push via the SSH wrapper). No Stripe test-mode keys or email credentials were provided (the two standing credential-gated candidates stay gated), so the round's deliverable is audit-derived.

**Workspace state this round:** RESET — fresh `git clone https://github.com/nordeim/ecommerce-store.git` at `3594796` (main). The environment rebuilt: `bun install` (475 packages, lockfile-pinned — next@16.4.0, react@19.3.0) · Playwright Chromium v1243 installed · `cp .env.example .env` · `bun run db:setup` (the seed landed at the SHADOW path `/home/z/my-project/db/custom.db` — the injected shell `DATABASE_URL` wins, the documented trap) · the hard-link convergence applied (`ln -f` — inode 529174 at BOTH `db/custom.db` paths; `tests/db-path.test.ts` 15/15 on the standing link).

## 1. Baseline verification (state at audit start)

- **Fresh clone at `3594796`** — the working tree clean; the repo `skills/` folder exclusion re-verified in all four configs (tsconfig `exclude`, eslint `ignores`, vitest `include` — `src/**` + `tests/**` only, playwright `testDir` — `./tests/e2e`).
- Environment contracts: `.env` carries `DATABASE_URL="file:../db/custom.db"` · `db/` at the repo root (the hard link, inode 529174 both paths) · `tests/db-path.test.ts` 15/15.
- Baseline gate: lint 0/0 · tsc clean · **344/344 unit+integration (21 files)** · build exit 0 · **the full E2E baseline re-run 260/260 (8.5m, foreground — the L26/L27 lesson)** — the documented session-81/82 ship state verified pre-change.
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd** (the RED-GREEN-REFACTOR discipline), **agent-browser** (the live reference walk — via the established Playwright-form battery scripts), **clone-app-pat-pro** (the parity methodology), **code-review-checklist + code-quality-standards** (the 12-category/six-axis lenses).
- **The Round-42 live battery (the audit's parity layer, against the production standalone on :3000 — the exact shipped artifact):** the paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, both sides painted on slide `1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%, checkout 0.01%, account 0%, login 0.28% — byte-identical to the documented round-41 baselines). **The 43rd mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500 with identical hrefs; the Electronics deep-link + auto-close). The standing watches clean (typeahead: the reference fires ZERO search requests; carousel ~5000ms cadence; the SEO layer: 17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD). The console census **24 routes + 11 admin + the round-41 date-window family (3 routes) CLEAN** — the census script extended this round to cover ADR-048's surfaces (`?from=/to=`, the combined filter, the inverted pair).
- **The battery-protocol environment finding (first-hand, this workspace):** `fuser` is NOT installed here — `fuser -k 3000/tcp 2>/dev/null` silently no-ops, and a stale `next dev` from the first sweep attempt shadowed :3000 through three battery runs (the sweep read pdp 0.9% / login 0.84% "out of band" — the delta was the Next dev-tools "01 Issue" badge painting ~101×36px at the bottom-left of every dev-mode viewport). The round-39 stale-server lesson, mechanized: `scripts/battery-runner.sh` now kills by `ss -tlnp` PID parse + pattern kill (portable), boots the battery server (dev or the production standalone), runs ONE battery script, and tears down — all within a single invocation. Re-run against the TRUE production standalone: every route back at the documented baseline.

## 2. Audit results

### 2.1 The candidate triage (session-81's "suggested next" list)

1. **The customer surfaces' E2E pin density (RE-DEFERRED):** a test-hardening sweep — no user-facing defect; the round's budget goes to the measured dev-mode defect below. Remains the natural next audit sweep.
2. **The `take: 100` pagination ceiling (RE-DEFERRED — unchanged):** the seed fixture is 4 orders; the date-range window (ADR-048) is the reach-past tool; server-side pagination deferred until fixture scale demands it.
3. **The rate-limiter store migration (RE-DEFERRED — the PAD's open Medium, unchanged):** correct for single-instance SQLite.
4. **The credential-gated items (UNCHANGED):** Stripe test-mode keys and an email provider — no credentials provided this round.
5. **The PAD header micro-drift (NOTED, repaired in the docs duty):** the header still reads "v1.40 / session-40" while the revision table carries the 1.41 row — the same class as round-41's missed SKILL v1.40.0 header bump; repaired to v1.42/session-42 this round.

### 2.2 THE PRIMARY FINDING — the dev-mode CSP blocks React's documented dev-mode `eval()` requirement (CSP-DEV-EVAL-1)

The session-14 CSP (ADR-022) ships `script-src 'self' 'nonce-…' 'strict-dynamic'` — correct for production, but React's dev builds require `eval()` (the Turbopack-compiled RSC client bundled by next@16.4.0 runs `checkEvalAvailabilityOnceDev` — a `(0, eval)("null")` availability probe that logs `console.error("eval() is not supported in this environment. … React requires eval() in development mode for various debugging features like reconstructing callstacks from a different environment. React will never use eval() in production mode")` when the CSP blocks it). The measured gap, first-hand:

- **100% deterministic in dev mode.** 12/12 loads across 4 routes (`/login`, `/`, `/shop`, `/cart`), every reload — the probe fires on every dev page load. The `nextjs-portal` shadow DOM then paints the dev-tools "01 Issue" badge (`[data-next-badge-root]`, 101×36px at 20,712 — measured) over the bottom-left of every dev-mode viewport.
- **The census discipline is un-runnable against dev mode.** The standing census asserts ZERO console errors; against `bun run dev` (the README's documented primary workflow) all 38 census routes report the eval error. No prior round caught it because the batteries always ran against the production standalone (the exact-shipped-artifact discipline) — where the probe does not exist (`react-server-dom-turbopack-client.browser.production.js` carries no `checkEvalAvailabilityOnceDev` — verified in node_modules; production is unaffected, the E2E gate 260/260 green).
- **React's dev debugging features are disabled.** The blocked eval disables callstack reconstruction — degraded dev DX for every future contributor.
- **The canonical fix is documented.** Next.js's own CSP guidance: development requires `'unsafe-eval'` in `script-src`; production must stay strict (React never evals in production — the probe's own message says so).

**Why this is the round's deliverable (the judgment call, made):** it is a real, first-hand-measured, 100%-reproducible defect in the documented primary workflow (`bun run dev`); the fix is the canonical Next-documented carve-out (dev-only `'unsafe-eval'`); production is byte-identical by construction (the session-14 E2E pins stay green — the strongest form of parity safety); and it ships a pure seam (`src/lib/csp.ts`) extracted from the proxy — the session-35 shared-seam precedent — making the CSP construction unit-testable for the first time (the current pins are E2E-only).

### 2.3 The seam extraction (the session-35 precedent, applied)

`src/proxy.ts`'s inline CSP construction (the 10-directive array + the two Stripe mutations) moves to **`src/lib/csp.ts`** — a new pure seam (Prisma-free, Next-free, node-dependency-free):

- `buildCsp({ nonce, isDev, stripeConfigured }): string` — the full directive set in the pinned order, with `script-src` composed from the parts: `'self' 'nonce-…' 'strict-dynamic'` + `'unsafe-eval'` when `isDev` + `https://js.stripe.com` when `stripeConfigured`. Production strings byte-identical to the session-14/session-22 forms (the E2E smoke pins the proof); the dev string's ONLY delta is the `'unsafe-eval'` token.
- `proxy.ts` composes it with `isDev: process.env.NODE_ENV !== "production"` (the dev server sets `development`; the standalone server + the E2E webServer set `production` — deterministic in every documented mode).

### 2.4 E2E impact census

**CONTAINED.** The touched production surface: the response header construction in `src/proxy.ts` (behavior-identical in production). No fixtures, no schema, no env, no config, no parity surface. The existing CSP E2E pins (the smoke spec's per-request nonce + the every-script-carries-the-nonce plumbing) hold unchanged; the smoke spec gains ONE negative pin — the production CSP must NOT contain `'unsafe-eval'` (the guard against the carve-out leaking into production). The dev-mode carve-out is provable at the unit layer (the seam's byte-exact pins) + the new standing dev-census battery script (post-fix: zero console errors against `bun run dev`).

## 3. The TDD plan

### 3.1 RED — the new pins, written first, failing for the right reasons

1. **`src/lib/csp.test.ts`** (the new seam's pins — module-does-not-exist failures): the production CSP byte-exact (the session-14 form, nonce interpolated); the dev CSP = the production form + `'unsafe-eval'` as the script-src's fourth token (the ONLY delta); the dev+stripe form (both tokens, the pinned order); the prod+stripe form (the session-22 form, NO unsafe-eval); the nonce plumbing (the nonce lands in script-src and nowhere else); the directive order (the 10 directives joined `"; "`, frame-src appended when stripe); the Stripe connect-src swap; two nonces never collide (the caller's minting contract).
2. **`tests/e2e/smoke.spec.ts`** (the negative pin): the production CSP does NOT contain `'unsafe-eval'` — the production-strictness guard.

**RED verified:** the unit layer fails on the missing module (every pin); the E2E negative pin PASSES pre-change (production is already strict — it is a REGRESSION guard, pinned green by design; the RED discipline lives in the unit layer, which fails for the right reason: the seam does not exist).

### 3.2 GREEN — the fix order

1. **`src/lib/csp.ts`** — the new pure seam (§2.3), with the module-header contract.
2. **`src/proxy.ts` refactored to compose it** — the inline construction deleted; `buildCsp({ nonce, isDev: process.env.NODE_ENV !== "production", stripeConfigured: resolveStripeConfig(...).serverConfigured })`. The production behavior byte-identical (the E2E smoke pins re-run green — the refactor proof).
3. The verifier re-runs: the unit layer green; the E2E smoke family green.

### 3.3 The mutation-style efficacy spot-checks ×3 (each caught, then byte-exact reverted — md5-verified at every step)

- **M1 (the carve-out):** the dev branch dropped (`isDev` ignored, `'unsafe-eval'` never emitted) → the dev unit pins fail (the dev string no longer contains the token).
- **M2 (the production guard):** the carve-out made unconditional (`'unsafe-eval'` always emitted) → the PROD unit pin fails (byte-exact string now carries the token) AND the E2E negative pin fails on the rebuilt artifact (the session-36 lesson: rebuild for every E2E proof).
- **M3 (the stripe composition):** the stripe host token emitted BEFORE `'unsafe-eval'` in dev+stripe mode → the dev+stripe order pin fails (the byte-exact form).

### 3.4 The full gate (the regression proof)

lint (0/0) · typecheck · the FULL unit layer (344 + the csp pins) · build · the FULL E2E × 2 consecutive runs on the final code (260 + the negative pin, each run — the L26/L27 lesson: foreground).

## 4. Execution order

1. **RED:** write the unit pins + the E2E negative pin; run and record the failures (§3.1).
2. **GREEN:** the seam first; the proxy refactor second (the E2E smoke pins re-run green before anything else changes).
3. **The verifier re-runs:** unit green · E2E green.
4. **Mutations ×3** (§3.3 — each caught + byte-exact revert).
5. **Full gate:** lint · typecheck · unit · build · the FULL E2E × 2 consecutive runs.

## 5. Post-change battery + screenshots

- **The dev-mode proof (the deliverable's own surface):** the NEW standing `scripts/census-dev-session42.mjs` — the census route walk against `bun run dev` asserting ZERO console errors post-fix (38/38 clean expected; pre-fix it was 38/38 dirty — the before/after is the round's proof).
- The paired pixel sweep re-run (all 8 routes — the CSP change must be pixel-INVISIBLE in production; the baseline band must hold exactly).
- The 44th mobile-nav verification's post-change re-run (token-exact parity must hold).
- The watches + census re-run (the kill-by-port discipline via the fixed runner — portable, no fuser dependency).
- **Screenshots 221–225** (probe-first, single invocation, VLM 5/5): home (the standing anchor, :3001 production standalone); the DEV server's /login post-fix (the full viewport including the bottom-left corner where the badge used to paint — probe: no `[data-next-badge-root]`, zero console errors); the dev bottom-left close-up at 2x (the badge's former position, clean); the production /login (the nonce-pipeline surface, visually unchanged — the production CSP strict); the mobile nav open (the standing watch surface).

## 6. Docs duty (this round's deliverable + the round's own records)

The PAD **v1.42** (the header micro-drift repaired — v1.40→v1.42, Last Updated → session-42; ADR-049 + the ADR-022 addendum; the §3.2 tree's `csp.ts` row + §12's row; §8.1/§8.4's counts; the revision row) · SKILL **v1.42.0** (the lib inventory 28→29 + the CSP dev carve-out note + Appendix C → session42) · AGENTS.md (the test-count rows + the CSP rule) · CLAUDE.md (the session-42 contract + the counts) · README (the Testing table + the gate row) · `docs/session_83.md` (the round narrative) · the worklog S42 entry · this plan's sign-offs · the drift watch recalibrated (ADR 48→49) and re-run GREEN · `.env.example` verified current (the round adds NO env plumbing — NODE_ENV is the runtime's own variable, not app config).

## Sign-offs (completed at execution)

- [x] RED phase verified failing per-family (the unit pins: 9/9 failing on the missing module — the seam does not exist; the E2E negative pin: green by design — the regression guard, pinned as its own test block)
- [x] GREEN — the seam + the proxy refactor (the E2E smoke pins green through the refactor — 21/21 then 22/22 with the negative pin; 9/9 csp pins; 353/353 unit)
- [x] Mutations ×3 caught + byte-exact reverts (md5 a418eea4ff12b46a756996429bd5ef65 verified at every step: M1 the dev branch dropped → exactly the 2 dev pins; M2 the carve-out unconditional → 4 unit pins + the E2E negative pin on the REBUILT artifact; M3 the stripe-before-dev order → exactly the order pin)
- [x] Full gate × 2 consecutive runs on the final code (614 total: 353 unit + 261 E2E — 8.5m + 8.4m)
- [x] Post-change battery (sweep 8/8 at baseline — byte-identical to pre-change · the 44th mobile-nav token-exact — the 43rd + 44th in one round · watches + census 24+11+3 clean · the NEW dev-census 24/24 CLEAN — the deliverable's proof: pre-fix 38/38 dirty)
- [x] Screenshots 221–225 captured + VLM 5/5 (probe-first; one capture correction — the dev server's first-compile raced the 222 shot, the retry wrapper fixed it; one description correction — the 221 nav described from memory instead of as-is)
- [x] Docs aligned (PAD v1.42 incl. the header repair + the ADR-022 addendum + the §8.1 smoke-row pre-existing drift, SKILL v1.42.0 incl. the missing ADR-048 table row repaired, AGENTS, CLAUDE, README, the verifier's ADR recalibration 48→49 — the drift watch GREEN 25/25, session_83.md, the worklog S42 entry); committed to main; pushed via the SSH wrapper
