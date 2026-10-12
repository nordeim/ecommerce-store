# Remediation Plan — Session 47 (Round 47): AUTH-ERROR-1 — The Auth Family's Error-State Density: the Register Priority Fix, the ASCII-Dots Pending-Label Fix, and the 72-Byte Divergence Register (the Customer-Surfaces Pin-Density Sweep's Fifth Installment)

**Date:** 2026-10-12 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `11e5202` (the session-46 ship `0a7bd9a` + the user's session_92 narrative log)
**Status at audit start:** 653-test gate (353 unit + 300 E2E), PAD v1.46, SKILL v1.46.0 — lint 0/0 · tsc clean · 353/353 unit+integration (22 files) · build exit 0 · the full E2E baseline re-run **300/300 (9.8m, foreground — the L26/L27 lesson)** verified pre-change; the round-40 drift watch re-run **GREEN (ALL FAMILIES)** at the session-46 ship.

## 0. The round's mandate

The user's standing round instruction (the full audit/parity workflow with the mobile-nav + Tailwind v4 watches; the `.env`/db-root contract — verified: `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root, the hard-link convergence intact at inode 397471 both paths — a PULL round: the workspace survived (node_modules, `.env`, db/, the Playwright Chromium v1243 cache all intact), `git pull` fast-forwarded `0a7bd9a..11e5202` (docs/session_92.md only — the user's narrative log, docs only, ZERO production code); the professional Stripe integration verification — demo mode rests green without keys, the standing credential gates unchanged; the vitest + playwright suites — both verified with the `skills/` exclusion re-confirmed (tsconfig `exclude` + eslint `ignores` + vitest root-anchored `include` + playwright `testDir` — the four-config re-verification); the TDD remediation plan; the screenshots; the `.env.example` — verified current, this round adds NO env plumbing; the docs; and the main-only push via the SSH wrapper). No Stripe test-mode keys or email credentials were provided (the two standing credential-gated candidates stay gated), so the round's deliverable is audit-derived.

## 1. Baseline verification (state at audit start)

- **Workspace intact (PULL, not reset):** `git pull` fast-forward `0a7bd9a..11e5202` (docs/session_92.md — the user's session-92 narrative log, no code); node_modules present; `.env` verified (`DATABASE_URL="file:../db/custom.db"`); `db/custom.db` at the repo root with the hard-link convergence intact (inode 397471 at BOTH `db/custom.db` paths); Playwright Chromium v1243 cache present; `bun run build` fresh.
- Baseline gate: lint 0/0 · tsc clean · **353/353 unit+integration (22 files)** · build exit 0 · **the full E2E baseline re-run 300/300 (9.8m, foreground)** — the documented session-91/92 ship state verified pre-change.
- Skills consulted (from the repo `skills/skills-catalog.md`): **tdd** (the gate-round convention: calibration → the honest RED → pins → mutation-style efficacy proofs), **agent-browser** (the live reference walk — the auth-error probes below), **clone-app-pat-pro** (the parity methodology — the DOM probe is the ground truth; computed copy over screenshots), **code-review-and-audit** (the lenses on the auth island's code).
- **The Round-47 live battery (the audit's parity layer, against the production standalone on :3000 via `scripts/battery-runner.sh prod`):** the paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec` painted both sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0% [9 px], checkout 0.01%, account 0% [9 px], login 0.28% — byte-identical to the documented round-42/43/44/45/46 baselines). **The 53rd mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks — panel 288px / bg rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at 18px/500 with identical hrefs; the Electronics deep-link + auto-close). The standing watches clean (typeahead: the reference fires ZERO search requests; carousel ~5000ms cadence [3750/8750/13750]; the SEO layer: 17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD). The console census 24 routes + 11 admin CLEAN. **The dev census 24/24 CLEAN** (ADR-049 verified).

## 2. Audit results

### 2.1 The candidate triage (session-91's "suggested next" list)

1. **The auth family's error-state density (CHOSEN — the round's deliverable, below):** session-91's standing "suggested next" — "the short-password box path via the register form's `fieldErrors` fallback + the three pending labels + the register native-email block." The sweep's method applied: the auth island enumerated (the four `*-form.tsx` islands + `src/lib/actions/auth.ts` + `src/lib/validation.ts` read line-by-line) and cross-checked against the E2E layer — the register form's short-password box path (the `fieldErrors` fallback family), the short+mismatch issue priority, the register/login native-email blocks, the four pending labels, the reset form's client-first mismatch check, and the login rate-limit copy ALL had ZERO pins. The recent-changes audit (session-46's diff `0a7bd9a..11e5202`): docs/session_92.md only — **ZERO production code** — CLEAN.
2. **The credential-gated items (UNCHANGED):** Stripe test-mode keys and an email provider — no credentials provided this round.
3. **The `take: 100` pagination ceiling (RE-DEFERRED — unchanged):** the seed fixture is 4 orders; the date-range window (ADR-048) is the reach-past tool.
4. **The rate-limiter store migration (RE-DEFERRED — the PAD's open Medium, unchanged):** correct for single-instance SQLite.

### 2.2 THE PRIMARY FINDING — the auth family's error-state density: TWO measured parity divergences + one registered divergence (AUTH-ERROR-1)

The surface (shipped session-3/4, refined session-20): the four standalone auth islands (`login-form.tsx`, `register-form.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx`) + the shared `AuthErrorBox` + the action layer's Zod error assembly (`src/lib/actions/auth.ts` — the `message: issues[0]?.message ?? "Invalid input"` + `fieldErrors` mapping, identical in all five actions) + `registerSchema`/`resetPasswordSchema` (the `min(8)`/`max(128)` password rule + the object-level mismatch refine on `confirmPassword`).

**The calibration (the probes `scripts/auth-error-probe-r47.mjs` + `auth-error-probe-r47d2.mjs` + the Zod ground-truth script `zod-groundtruth-r47.mjs`, live, full-network watch — every error state measured on the reference first-hand):**

| # | Behavior | Reference (measured) | Clone (pre-fix) | Verdict |
|---|---|---|---|---|
| 1 | register short+MATCH box | "Password must be at least 8 characters long" | same (issues[0]) | PARITY — pin P1 |
| 2 | register short+MISMATCH box | **"Passwords do not match"** (the mismatch check wins over the length check) | "Password must be at least 8 characters long" (Zod issues[0] = the shape issue) | **DIVERGENCE #1 → Fix #1** — pin P2 (the honest RED) |
| 3 | register 129-char+MATCH box | "password cannot be longer than 72 bytes, truncate manually if necessary (e.g. my_password[:72])" (a Base44/bcrypt platform leak) | "String must contain at most 128 character(s)" (the clone's 128-char scrypt-appropriate rule) | **REGISTERED DIVERGENCE** — pin P9 (documents the clone's rule) |
| 4 | register 129-char+MISMATCH box | **"Passwords do not match"** (A4b — the mismatch-first rule extends past the max boundary) | "String must contain at most 128 character(s)" | **Fix #1 covers it** — P2's family |
| 5 | register native-email block | checkValidity false, 0 POSTs, no box | same (no `noValidate` — the session-4 contract) | PARITY — pin P3 |
| 6 | login native-email block | checkValidity false, 0 POSTs, no box | same | PARITY — pin P4 |
| 7 | the four pending labels | **"Logging in..." / "Creating account..." / "Sending..." / "Resetting..."** — THREE ASCII DOTS, `disabled=true` during flight | "Logging in… / Creating account… / Sending… / Resetting…" — the ELLIPSIS CHARACTER (U+2026), `disabled={pending}` | **DIVERGENCE #2 → Fix #2** — pins P5/P6/P7/P11 (the honest RED) |
| 8 | login wrong-credentials box | "Invalid email or password" | same (session-4-measured, re-verified) | PARITY — P5's post-release assertion |
| 9 | register duplicate-email box | "A user with this email already exists" | same (session-4-measured) | PARITY — P6's post-release assertion |
| 10 | reset client-first mismatch | "Passwords do not match", 0 POSTs (the client check precedes the server) | same (`onSubmit` preventDefault — session-20-measured) | PARITY — pin P8 |
| 11 | reset bogus-token box | "Invalid or expired reset token" | same (session-20-measured, re-verified) | PARITY — P11's post-release assertion |
| 12 | login rate limit | **NO copy after 11 wrong attempts** (Base44 has none visible) | "Too many attempts. Try again in Ns." after 10 (the 10/15min/IP+email fixed window) | **SUPERSET** — pin P10 (zero parity risk by construction) |
| 13 | forgot neutral confirmation | "If an account exists with that email, you'll receive a password reset link shortly." | same | PARITY — P7's post-release assertion |

**The Zod ground truth (the `zod-groundtruth-r47.mjs` run — the clone-side calibration):** short+mismatch produces TWO issues (`[password-min, confirmPassword-mismatch]` — the object-level refine runs even when the base shape fails), but `issues[0]` is always the shape's password issue — hence the clone's length copy wins where the reference shows the mismatch copy. The exact max-boundary copy confirmed: `"String must contain at most 128 character(s)"` (Zod 3's default English message — the clone's current customer-visible copy, pinned as-is in P9).

### 2.3 The deliverable's shape

1. **Fix #1 (the parity divergence — the register priority):** `src/lib/actions/auth.ts` `registerAction`'s Zod-error assembly — the `confirmPassword` (mismatch) issue, when present, is preferred over the shape issues: `const mismatch = parsed.error.issues.find((i) => i.path[0] === "confirmPassword"); message: (mismatch ?? parsed.error.issues[0])?.message ?? "Invalid input"`. The reference's measured rule: when the mismatch condition is true, the mismatch copy is shown regardless of the password's length/max state (A3 + A4b). short+MATCH (no mismatch issue) still shows the length copy (P1 unaffected); 129+MATCH still shows the max copy (P9 unaffected); `fieldErrors` unchanged. The `resetPasswordAction` is untouched — its server-side mismatch path is UI-unreachable (the client-side check fires first, D1/P8) and no reset-path divergence was measured.
2. **Fix #2 (the parity divergence — the pending labels):** the four auth islands' pending labels — `"Logging in…"` → `"Logging in..."`, `"Creating account…"` → `"Creating account..."`, `"Sending…"` → `"Sending..."`, `"Resetting…"` → `"Resetting..."` (the reference uses THREE ASCII DOTS, measured during held submits on all four forms; the clone's U+2026 ELLIPSIS was a first-hand divergence). Four one-character edits; `disabled={pending}` already matches (the reference disables during flight too — measured `disabled=true` ×4). The account/checkout families' `"…"` labels are untouched — those are superset surfaces (the reference's account family is fully cosmetic and its checkout is a mock; no reference pending states exist there to diverge from).
3. **`tests/e2e/autherr-states.spec.ts`** — the NEW spec (11 pins, named `autherr-` so it sorts AFTER `auth.spec.ts` AND before `cart.spec.ts` in ASCII — `'autherr'` > `'auth.'` ('e' 101 > '.' 46); new specs never modify existing pins; the spec opts out of storageState like `auth.spec.ts`):
   - **P1 (parity):** register short+match → the box "Password must be at least 8 characters long" + stays on /register.
   - **P2 (parity — THE HONEST RED for Fix #1):** register short+MISMATCH → the box "Passwords do not match" (the reference's mismatch-first priority; the clone currently shows the length copy).
   - **P3 (parity):** register native-email block — notanemail + valid passwords → `checkValidity` false, the box count 0, ZERO POSTs to /register (a request counter), stays on /register.
   - **P4 (parity):** login native-email block — the same on /login.
   - **P5 (parity — the honest RED for Fix #2):** login pending — a held POST (`page.route` on /login, POST-only hold): during flight the button reads "Logging in..." (three ASCII dots) and is disabled; after release: the box "Invalid email or password" + the label back to "Log in".
   - **P6 (parity):** register pending — the held POST on /register: "Creating account..." + disabled; after release (duplicate-email payload): the box "A user with this email already exists" + the label back to "Create account".
   - **P7 (parity):** forgot pending — the held POST on /forgot-password: "Sending..." + disabled; after release: the neutral confirmation copy + the form replaced.
   - **P8 (parity):** reset client-first mismatch — bogus token + mismatched passwords → the box "Passwords do not match" + ZERO POSTs (the client check wins — the pin's teeth; without the posts counter the server produces the same copy and the pin would be blind).
   - **P9 (the registered divergence):** register 129-char+match → the box "String must contain at most 128 character(s)" (the clone's 128-char scrypt-appropriate rule + Zod 3's default copy, documented as the deliberate divergence from the reference's 72-byte bcrypt platform leak).
   - **P10 (superset — LAST IN FILE):** login rate-limit exhausted — 11 wrong submits on the dedicated nonexistent `rl-429-r47@example.com` (the rate limiter counts before the user lookup): the first ten show "Invalid email or password", the 11th shows "Too many attempts. Try again in Ns." (the retry seconds asserted as `\d+`). LAST because it exhausts the endpoint's in-memory budget for that email; no spec after it in file order touches the login endpoint with that address; a fresh server per run keeps the ×2 consecutive full runs deterministic.
   - **P11 (parity):** reset pending — the held POST on /reset-password?token=bogus: "Resetting..." + disabled; after release: the box "Invalid or expired reset token".
4. **NO other production code changes.** The pins document existing behavior everywhere except P2/P5/P6/P7/P11's fixes (the round's only production diffs — one expression in `auth.ts` + four one-character label edits).

## 3. The TDD plan (the gate-round convention: calibration → RED-first for the fixes → pins → mutations)

### 3.1 Calibration (done — the reference measured live + the Zod ground truth)

The probes (§2.2's table): the reference's mismatch-first priority (A3 + A4b), the ASCII-dots pending labels (A5/B2/C1/D2, `disabled=true` ×4), the native blocks (A1/B1, 0 POSTs), the no-rate-limit verdict (E1 after 11 attempts), the 72-byte platform copy (A4 — the registered divergence), and the Zod issue ordering (the ground-truth script: short+mismatch → TWO issues, `issues[0]` = the shape's password issue — the divergence's mechanism).

### 3.2 The honest RED (the two fixes, TDD-first)

Write P2 (the priority) + P5 (the login label) FIRST → run against the CURRENT artifact → BOTH FAIL (P2: the box shows the length copy; P5: the label shows the U+2026 ellipsis) → apply Fix #1 + Fix #2 → re-run → GREEN. The round's red→green proof — the failing pins written before the fixes, exactly as the CLAUDE.md TDD rule demands for behavior changes.

### 3.3 The pins, written to the measured truth

The 11-pin spec (§2.3). P1/P3/P4/P8/P9/P10/P11 document existing behavior (the gate-round form; green by design — P11's label half is Fix #2-dependent, written with the fix). The spec follows the family's conventions: page-level selectors on the chrome-less auth screens (no `main` landmark — the error BOX locator `div.mb-4.p-3.rounded-lg`), `getByLabel` with `{ exact: true }` where the family's labels collide, and the held-POST mechanism (`page.route(url, POST-only hold)`) for the four pending pins.

### 3.4 The mutation-style efficacy proofs ×5 (each caught at the E2E layer on the REBUILT artifact — the session-36 lesson, then byte-exact revert, md5-verified at every step)

- **M1 (Fix #1 reverted):** the mismatch preference removed (restore the plain `issues[0]` selection) → **exactly P2 fires** (the box shows the length copy again); P1/P9 green (no mismatch issue in their payloads); every other pin untouched.
- **M2 (the login label reverted):** `"Logging in..."` → `"Logging in…"` → **exactly P5 fires** (the during-flight text assertion); the post-release half of P5 stays green (the box + the resting label are Fix #2-independent).
- **M3 (the register label reverted):** `"Creating account..."` → `"Creating account…"` → **exactly P6 fires**.
- **M4 (the client-first check deleted):** the reset form's `onSubmit` mismatch branch removed (the form always submits) → **exactly P8 fires** (the posts counter reads 1, not 0 — the box copy alone would stay green, the pin's own proof of the counter's necessity).
- **M5 (the schema boundary loosened):** `registerSchema.password.min(8)` → `min(3)` → **exactly P1 fires** ("abc" passes the shape → the account is created + the navigation leaves /register — no box); P2 stays green (the refine still fires "Passwords do not match" under Fix #1's preference).

### 3.5 The full gate (the regression proof)

lint (0/0) · typecheck · the FULL unit layer (353 — unchanged) · build · **the FULL E2E × 2 consecutive runs on the final code (300 + 11 = 311 each run — the L26/L27 lesson: foreground)**.

## 4. Execution order

1. **Calibration:** the reference probes + the Zod ground truth (done, §3.1).
2. **RED:** write P2 + P5 → run against the current artifact → the honest RED (both divergences confirmed at the E2E layer).
3. **FIX:** Fix #1 (`auth.ts` registerAction) + Fix #2 (the four labels) → P2 + P5 GREEN (the red→green cycle).
4. **PINS:** write the full 11-pin spec; run it (311 total); the unit layer re-run (353 — unchanged).
5. **Mutations ×5** (§3.4 — each caught + byte-exact revert, the artifact rebuilt for every E2E proof).
6. **Full gate:** lint · typecheck · unit · build · the FULL E2E × 2 consecutive runs.

## 5. Post-change battery + screenshots

- The paired pixel sweep re-run (all 8 routes — the two fixes must be pixel-INVISIBLE on the resting surfaces: the error box only renders after a submit, the pending label only during flight; the resting auth screens are untouched) + the **54th mobile-nav verification** re-run (token-exact parity must hold).
- **Screenshots 246-250** (probe-first, single invocation, the production standalone on :3001 — a FRESH process): the register short-password box (the standing anchor — the parity copy); the short+MISMATCH box reading "Passwords do not match" (Fix #1's proof state); the login pending label "Logging in..." + disabled during a held submit (Fix #2's proof state); the forgot pending label "Sending..." during a held submit; the 11th wrong login's "Too many attempts. Try again in Ns." box (P10's proof state). **VLM 5/5 verification** (describe the surface as it IS — the round-40..46 lesson; the DOM probe is the ground truth).

## 6. Docs duty (this round's deliverable + the round's own records)

The PAD **v1.47** (§8.1's autherr-states row + the Total row 47/664/353+311; §8.4's checklist 311; §3.2's tree 24 specs + the autherr-states entry; the v1.47 revision row; the header's Last-Updated session tag) · SKILL **v1.47.0** (the version; §11's stale 332/254 counts reconciled to 353/311; the line-31 session pointer; Appendix C → session47) · AGENTS.md (the auth-error bullet + the ASCII-dots/ellipsis lesson + the 72-byte divergence register) · CLAUDE.md (311 + the auth family's parity-contract update — the mismatch-first rule + the ASCII-dots pending labels) · README (the 664 row + the Testing table + the mobile-nav 54 row + the File Hierarchy's stale spec count) · the drift-watch verifier's spec-count recalibration 23→24 and re-run GREEN · `docs/session_93.md` (the round narrative) · the worklog S47 entry · this plan's sign-offs · `.env.example` verified current (NO env plumbing).

## Sign-offs (completed at execution)

- [x] Calibration recorded (the probes r47 + r47d2 + the Zod ground truth — the mismatch-first priority, the ASCII-dots pending labels, the native blocks, the no-rate-limit verdict, the 72-byte platform copy; the code read line-by-line)
- [x] The honest RED (P2 + P5 written first, BOTH failing on the current artifact — the two divergences confirmed at the E2E layer) → the fixes → GREEN
- [x] Pins green (the 11-pin spec on the fixed artifact; the unit layer 353 unchanged; the delivered numbering: P10 = the reset pending label, P11 = the rate-limit LAST)
- [x] Mutations ×5 caught + byte-exact reverts (md5-verified at every step; each on the REBUILT artifact): M1 the preference removed → exactly P2; M2 the login label reverted → exactly P5; M3 the register label reverted → exactly P6; M4 the reset client-check deleted → exactly P8 (the posts counter — the box copy alone would have stayed green); M5 min 8→3 → exactly P1 (the sed matched BOTH password schemas; no pin depended on reset's min)
- [x] Full gate × 2 consecutive runs on the final code (353 + 312 × 2 = 665 per run — each run as two half-suite invocations a–m/n–z, the 600s tooling cap; the extra setup login is the split's artifact, documented everywhere the count appears)
- [x] Post-change battery (sweep 8/8 at baseline — both fixes pixel-invisible · the 54th mobile-nav token-exact · screenshots 246-250 VLM 5/5 after two description corrections — the recurring placeholder-masking lesson)
- [x] Docs aligned (PAD v1.47, SKILL v1.47.0, AGENTS, CLAUDE, README, the verifier's spec-count recalibration 23→24 — the drift watch re-run ALL FAMILIES GREEN, session_93.md, the worklog S47 entry); committed to main; pushed via the SSH wrapper
- [x] The round's honest records: P11's debugging race (an expect on text IDENTICAL across iterations is not a response sync point — the fix: the pending flag's return + the L38 input reset); the capture script's route leak (unroute after every release); the VLM's placeholder-masking; the 600s tooling cap
