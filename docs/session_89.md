# Session 89 — Round 45: ACCOUNT-VALIDATION-1 — The Account Family's Validation Paths + the Address Edit/Default Flows ("The Pin-Density Sweep's Third Catch")

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

**Workspace state.** RESET this round — fresh `git clone` at `7015951`
(the session-44 ship `1763a50` + the user's session_88 narrative log);
the environment rebuilt from scratch: `bun install` (475 packages,
lockfile-pinned), `cp .env.example .env`, `bun run db:setup` (seeded at
the SHADOW path — the injected shell `DATABASE_URL` wins, the documented
env-shadowing trap), the hard-link convergence applied (inode 397471 at
BOTH `db/custom.db` paths; `tests/db-path.test.ts` 15/15), and the
Playwright Chromium v1243 cache reinstalled. The repo `skills/`
exclusion re-verified in all four configs.

**Baseline gate.** lint 0/0 · tsc clean · **353/353 unit+integration
(22 files)** · build exit 0 · the full E2E baseline re-run **277/277
(9.3m, foreground — the L26/L27 lesson)**. The documented session-87/88
ship state verified pre-change; the round-40 drift watch re-run **ALL
FAMILIES GREEN** at audit start.

**The docs review.** AGENTS.md, CLAUDE.md, README, PAD v1.44, SKILL
v1.44.0, session_87/88, remediation-plan-session44, the worklog S44 —
the repo is 45 remediation rounds deep, 630 tests, every contract
cross-validated. The skills catalog mapped: tdd (the gate-round
convention: calibration → pins → mutation-style efficacy proofs),
agent-browser (the live reference walk), clone-app-pat-pro (the parity
methodology — the reference measured live, the DOM probe as ground
truth), code-review-and-audit (the lenses).

**The Round-45 live battery (pre-change, the production standalone on
:3000 via `scripts/battery-runner.sh prod` — the exact shipped
artifact).** The paired pixel sweep **ALL 8 ROUTES AT BASELINE BAND**
(home 0% [6 px, both sides painted on slide `1237b9a1afec`]; shop
0.05%, pdp 0.34%, cart 0.01%, wishlist 0%, checkout 0.01%, account 0%,
login 0.28% — byte-identical to the documented round-42/43/44
baselines). **The 49th mobile-nav verification: TOKEN-EXACT PARITY**
(all 10 checks). The standing watches clean (typeahead: the reference
fires ZERO search requests; carousel ~5000ms cadence; the SEO layer:
17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD). The console
census 24 routes + 11 admin + the date-window family CLEAN. **The dev
census 24/24 CLEAN** (ADR-049 verified working first-hand).

**The candidate triage (session-87's "suggested next" list):** the
account family's validation paths **CHOSEN** — the pin-density sweep's
third installment (the auth error-state density re-deferred as the
thinner candidate — it becomes the sweep's fourth installment). The
sweep's method applied: the account island's behaviors enumerated
(`account-tabs.tsx` + the three server actions + the Zod dialect read
line-by-line) and cross-checked against the E2E layer — account.spec
pins the family's RESTING anatomy + the add happy path, but the address
form's VALIDATION surface (the field-level errors under the street/zip
inputs, the form-level `role="alert"` first-issue line), the ENTIRE
edit flow (the `key={id}` prefill → change → the card updates), the
default-address exclusivity (the `updateMany` flip), the Cancel
collapse, the profile email-taken error + the "Profile updated." line,
and the password form's short/mismatch errors + the "Password updated."
line + the rotation itself have ZERO pins. The take-100 ceiling
RE-DEFERRED; the rate-limiter store RE-DEFERRED; the credential-gated
items UNCHANGED (no Stripe test-mode keys or email provider provided).
The recent-changes audit (session-44's diff `023e32f..1763a50`): ZERO
production code touched — CLEAN.

**THE PRIMARY FINDING.** The account family's validation + edit/default
surface is the family's thinnest coverage — the account's
money-adjacent data integrity (addresses feed checkout; the password
form is the security boundary) had zero E2E pins on its entire
validation contract. The reference relationship measured live (the
probes `scripts/account-validation-probe-r45[a/b].mjs` — login →
/account → the tab walk with a full-network POST watch): the reference
renders the SAME resting anatomy (the four tabs; the Default-badged
"John Doe / 123 Main Street / New York, NY 10001" card; the Add New
outline + Edit ghost buttons; the prefilled Profile form; the
three-field Change Password form) but every mutation affordance is
**INERT** — Add New opens NO form (0 forms, 0 dialogs; the only input
left on the page is the footer's newsletter field), Edit changes
nothing, Profile "Save Changes" fires ZERO network POSTs with no
validation copy, and Settings "Update Password" with a short new
password fires ZERO POSTs — no client or server validation exists
anywhere in the family. The Base44 account family is a **fully cosmetic
mock** — every clone behavior (the form that opens, the Zod gates, the
field errors, the real writes, the edit loop, the exclusivity, the
rotation) is a SUPERSET behavior. Zero parity risk by construction.

**THE DELIVERABLE (ACCOUNT-VALIDATION-1)** — 10 E2E pins + the
[cleanup] fixture-restore test, ZERO production code changes:

- **`tests/e2e/acct-validation.spec.ts`** — P1 the address ZIP gate +
  its recovery (the "Enter a valid ZIP code" field error → the fixed
  save → the card appears + the form collapses); P2 the two-level shape
  errors (the form-level alert renders the FIRST issue "Full name is
  required" while the street's own field error renders under its
  input); P3 the default-address exclusivity (a checked "Set as default
  address" moves the badge — the seeded card loses it); P4 the edit
  loop (Edit → the form opens PREFILLED via `key={id}` +
  `defaultValue` → the changed city reaches the card); P5 the Cancel
  collapse (no write); P6 the profile email-taken field error ("Email
  already in use"); P7 the "Profile updated." status line; P8 the short
  new-password field error ("New password must be at least 8
  characters" — the noValidate form's server-side gate); P9 the
  mismatch field error ("Passwords do not match"); P10 the rotation
  (change → "Password updated." → the OLD password proven dead THROUGH
  the change form itself — `scryptVerify` against the stored hash,
  consuming none of the login endpoint's 10/15min rate-limit budget →
  the in-spec restore) + the [cleanup] test restoring the seeded
  card's canonical fields + default badge.
- **`prisma/e2e-reset.ts`** — TWO fixture restores (the established
  phone-restore/resetuser patterns): the demo address's canonical
  fields + `isDefault`, and the demo `passwordHash` merged into the
  existing user update. Plus the dev-cleanup address guard (the dev-DB
  twin) for the capture/battery residue.

**The round's own honest moments (three):** (1) the first P1/P2 run
FAILED on a first-hand discovery — **React 19 resets action-submitted
forms' uncontrolled inputs to `defaultValue` after EVERY submission
(success OR failure)** — the recovery fills had to re-fill the WHOLE
form (the failure snapshot showed Full Name back to "John Doe", the
street empty, the stale ZIP error persisting because native
`required` blocked the second submit); (2) the first FULL-gate run
failed 286/288 — the spec was initially named `account-validation.
spec.ts`, which sorts BEFORE `account.spec.ts` (`'-'` < `'.'` in
ASCII), and its added cards broke account.spec's single-card
strict-mode resting pins (four Edit buttons; the duplicated "New York,
NY 10001" text) — the fix was the RENAME to `acct-validation.spec.ts`
(`'acct' > 'account'` — new specs never modify existing pins) plus the
strict-mode hygiene rule (no added card may duplicate a seeded
fixture's text coordinates); (3) the VLM verification needed one
description correction on 237 (the VLM again read the Street/ZIP
PLACEHOLDERS as typed values — the recurring round-44 lesson; the DOM
probe is the ground truth).

**Mutations ×3, each caught at the E2E layer on the REBUILT artifact
(the session-36 lesson), byte-exact reverts (md5-verified at every
step):** M1 the address ZIP regex loosened (`/^.*$/`) → **exactly P1**
(the "abcde" save succeeds — no field error); M2 the `updateMany`
isDefault flip deleted from `saveAddressAction` → **exactly P3** (the
seeded card keeps its badge — two defaults); M3 the edit form's city
`defaultValue` dropped → **exactly P4 + the cleanup test's prefill
assertion** (both assert the prefill contract).

**Full gate:** lint 0/0 · tsc clean · 353/353 unit (22 files) · build
0 · **the FULL E2E 288/288 (9.5m) + 288/288 (9.4m) × 2 consecutive
runs on the final code — 641 total** (up from 630: +11 E2E).

**Post-change battery:** the sweep re-run ALL 8 ROUTES AT BASELINE
(byte-identical — a test-only round is pixel-invisible by requirement);
the **50th mobile-nav verification** re-run TOKEN-EXACT (the 49th and
50th in one round — pre- and post-change).

**Screenshots 236–240** (probe-first, single invocation, the production
standalone on :3001 — a FRESH process; the address residue cleaned by
the new dev-cleanup address guard): the addresses tab resting anatomy
(the standing round anchor — the Default-badged seeded card); the
address form's INVALID state (the ZIP error under the input + the
form-level alert — the inputs EMPTY per the React-19 reset, the error
lines the proof); the default exclusivity (the new card Default-badged
+ highlighted, the seeded card badge-less); the edit form PREFILLED
(every value + the checked default checkbox); the password form's
field error (the short-password line under the input). **VLM 5/5
PASS** after the 237 placeholder correction.

**Docs:** PAD **v1.45** (§8.1's acct-validation row + Total
45/641/353+288; §8.4's checklist 288; §3.2's tree 22 specs + the
acct-validation entry; the v1.45 revision row), SKILL **v1.45.0** (the
version + lesson 050 + Appendix C → session45), AGENTS (the
account-validation bullet), CLAUDE (288 + the validation family),
README (the 641 row + the Testing table + the mobile-nav 50 row), the
verifier's spec-count recalibration 21→22 (the drift watch re-run ALL
FAMILIES GREEN), this log, the worklog S45 entry, the plan's sign-offs.
`.env.example` verified current (no env plumbing).

## Round 45 shipped ✅
**Session complete** — the baseline 630-test gate verified on the
rebuilt workspace (fresh clone + the hard-link convergence + the
Chromium cache); the Round-45 battery (sweep + the 49th mobile-nav +
watches + census + dev-census) all clean pre-change and re-verified
post-change. **The deliverable: ACCOUNT-VALIDATION-1** — the account
family's validation paths + the address edit/default flows' E2E pin
family, the customer-surfaces pin-density sweep's third installment: 10
pins + the cleanup restore (the three address-gate pins with recovery,
the two-level error contract, the exclusivity, the edit loop, the
Cancel, the profile email-taken + success line, the password
short/mismatch + the rotation). **Gate: 641 tests** (353 unit + 288
E2E × 2 consecutive runs), triple-mutation-proven at the E2E layer
(each on the rebuilt artifact, byte-exact reverts), sweep at baseline,
the 49th + 50th mobile-nav token-exact, VLM 5/5.
**New lessons:** (1) React 19 resets action-submitted forms'
uncontrolled inputs to defaultValue after EVERY submission — success or
failure — a recovery pin must re-fill the whole form (the invalid-state
captures show empty inputs + the error lines); (2) name specs for file
order — `acct-` sorts AFTER `account.` in ASCII, keeping account.spec's
single-card resting strict-mode pins pristine (new specs never modify
existing pins), and no added fixture may duplicate a seeded fixture's
text coordinates; (3) the reference's account family is FULLY COSMETIC
(Add New opens no form, Edit inert, zero POSTs on both save paths) —
every clone validation pin is a superset pin by construction; (4) the
rotation is provable THROUGH the change form (scryptVerify against the
stored hash) without consuming the login endpoint's rate-limit budget.
**Suggested next:** the sweep's fourth installment — the auth family's
error-state density (the short-password box path via the register
form's fieldErrors fallback + the pending states) or the search
family's empty/error states; the credential-gated items remain (Stripe
test-mode keys — the refund SDK path live; an email provider — the
guest-order merge-back). Just send the next round instruction when
ready.
