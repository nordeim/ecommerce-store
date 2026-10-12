# Session 93 — Round 47: AUTH-ERROR-1 — The Auth Family's Error-State Density: the Mismatch-First Priority Fix, the ASCII-Dots Pending-Label Fix, and the 72-Byte Divergence Register (the Sweep's Fifth Installment)

The standing round instruction: refresh the workspace, review the docs,
validate against the codebase, audit with the repo skills (the `skills/`
folder excluded from checking/testing/compilation — re-verified in all
four configs), achieve parity with the live reference (the
agent-browser walk + the sweep battery), pay particular attention to the
mobile navigation (the Tailwind v4 trap log), keep the Stripe
integration professional (demo mode rests green without keys — the
standing credential gates unchanged), keep the vitest + playwright
suites healthy, write + validate + execute a TDD remediation plan,
capture dev-server screenshots, update the docs, and push to main via
the SSH wrapper.

**Workspace state.** PULL this round (not reset) — `git pull`
fast-forwarded `0a7bd9a..11e5202` (the user's session_92 narrative log,
docs only — the recent-changes audit CLEAN, zero production code); the
environment survived intact (node_modules, `.env` with
`DATABASE_URL="file:../db/custom.db"`, `db/custom.db` with the
hard-link convergence at inode 397471 both paths, the Playwright
Chromium v1243 cache). The `skills/` exclusion re-verified in all four
configs.

**Baseline gate.** lint 0/0 · tsc clean · **353/353 unit+integration
(22 files)** · build exit 0 · the full E2E baseline re-run **300/300
(9.8m, foreground — the L26/L27 lesson)**. The documented
session-91/92 ship state verified pre-change.

**The docs review.** AGENTS.md, CLAUDE.md, README, PAD v1.46, SKILL
v1.46.0, session_91/92, remediation-plan-session46, the worklog S46 —
the repo is 47 remediation rounds deep, 653 tests, every contract
cross-validated. The skills catalog mapped: tdd (the gate-round
convention — this round takes the honest RED → GREEN path for the two
parity fixes), agent-browser (the live reference walk), clone-app-pat-pro
(the parity methodology — the DOM probe is the ground truth),
code-review-and-audit (the lenses).

**The Round-47 live battery (pre-change, the production standalone on
:3000 via `scripts/battery-runner.sh prod`).** The paired pixel sweep
**ALL 8 ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec`
painted both sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0%
[9 px], checkout 0.01%, account 0% [9 px], login 0.28% — byte-identical
to the documented round-42..46 baselines). **The 53rd mobile-nav
verification: TOKEN-EXACT PARITY** (all 10 checks). The standing watches
clean (typeahead: the reference fires ZERO search requests; carousel
~5000ms; the SEO layer: 17-URL sitemap, robots, JSON-LD, offers.price
299.99 USD). The console census 24 routes + 11 admin CLEAN. **The dev
census 24/24 CLEAN** (ADR-049 verified).

**The candidate triage (session-91's "suggested next" list):** the auth
family's error-state density **CHOSEN** — the sweep's fifth installment
(the credential-gated items remain: no Stripe test-mode keys or email
provider provided). The sweep's method applied: the auth island
enumerated (the four `*-form.tsx` islands + `src/lib/actions/auth.ts` +
`src/lib/validation.ts` read line-by-line) and cross-checked against
the E2E layer — the register short-password box path (the `fieldErrors`
fallback family), the short+mismatch issue priority, the register/login
native-email blocks, the four pending labels, the reset form's
client-first mismatch check, and the login rate-limit copy ALL had
ZERO pins.

**The calibration (the probes `scripts/auth-error-probe-r47.mjs` +
`r47d2.mjs`, live, full-network watch + the Zod ground truth
`scripts/zod-groundtruth-r47.mjs`):** the reference shows "Passwords do
not match" whenever the mismatch condition is true — measured for
short+mismatch (A3) AND 129-char+mismatch (A4b) — the MISMATCH-FIRST
rule; its four in-flight pending labels read "Logging in..." /
"Creating account..." / "Sending..." / "Resetting..." — **THREE ASCII
DOTS**, `disabled=true` during flight; it blocks malformed emails
natively (`type=email`, no `noValidate`) with ZERO action posts; it has
NO login rate-limit copy after 11 wrong attempts (E1 — the clone's
"Too many attempts. Try again in Ns." is a SUPERSET); and it rejects
passwords over 72 BYTES with a Base44/bcrypt platform leak ("password
cannot be longer than 72 bytes, truncate manually if necessary (e.g.
my_password[:72])") — **the REGISTERED DELIBERATE DIVERGENCE** (the
clone keeps its scrypt-appropriate 128-char rule with Zod 3's default
copy, pinned as-is). The Zod ground truth: short+mismatch produces TWO
issues (`[password-min, confirmPassword-mismatch]` — the object-level
refine runs even when the base shape fails), but `issues[0]` is always
the shape's password issue — hence the clone showed the length copy
where the reference shows the mismatch copy: the round's Fix #1
mechanism, first-hand.

**THE DELIVERABLE (AUTH-ERROR-1)** — TWO production fixes + 11 E2E
pins:

- **Fix #1 (the parity divergence — the mismatch-first priority):**
  `src/lib/actions/auth.ts` `registerAction`'s Zod-error assembly —
  the `confirmPassword` (mismatch) issue, when present, is preferred
  over the shape issues (`const mismatch = issues.find(i =>
  i.path[0] === "confirmPassword")`; `message: (mismatch ??
  issues[0])?.message`). short+MATCH (no mismatch issue) still shows the
  length copy; 129+MATCH still shows the max copy; `fieldErrors`
  unchanged; `resetPasswordAction` untouched (its server-side mismatch
  path is UI-unreachable — the client check fires first).
- **Fix #2 (the parity divergence — the ASCII-dots pending labels):**
  the four auth islands' labels — "Logging in…" → "Logging in...",
  "Creating account…" → "Creating account...", "Sending…" →
  "Sending...", "Resetting…" → "Resetting..." (the reference measured
  THREE ASCII DOTS; the clone's U+2026 ellipsis was a first-hand
  divergence). Four one-character edits; `disabled={pending}` already
  matched. The account/checkout families' "…" labels untouched —
  superset surfaces (the reference's account family is cosmetic and its
  checkout is a mock; no reference pending states exist there).
- **`tests/e2e/autherr-states.spec.ts`** — 11 pins (named `autherr-` so
  it sorts AFTER `auth.spec.ts` in ASCII — 'e' 101 > '.' 46; the
  rate-limit pin LAST): P1 the short+match length copy; P2 the
  short+MISMATCH priority (the honest RED); P3/P4 the register/login
  native-email blocks (ZERO action posts — the request counter is the
  teeth); P5-P7 the login/register/forgot pending labels (held-POST
  routes: the label + the disabled state during flight, the
  post-release boxes); P8 the reset form's client-first mismatch (ZERO
  posts); P9 the 129-char boundary (the registered divergence); P10 the
  reset pending label; P11 the login rate-limit exhausted copy (10
  wrong submits on the dedicated nonexistent `rl-429-r47@example.com`,
  then the 11th reads "Too many attempts. Try again in Ns." — the
  reference has none after 11: a SUPERSET).

**The round's honest moments (three):** (1) **P11's debugging race** —
the first full-spec run failed with the box still reading "Invalid
email or password" at the 11th: the per-iteration expect on text
IDENTICAL across iterations resolves instantly on the PREVIOUS
response's box — it is NOT a response sync point; a click can then land
in the post-response reset window and the native `required` blocks the
submit, stalling the loop one POST short of exhaustion (the diagnostic
proved the server blocks the 11th call — the spec just never fired
it). The fix: sync each iteration on the response's own TRANSITIONS
(the pending flag's return `toBeEnabled` + the React-19 input reset
`toHaveValue("")` — the L38 lesson). (2) The capture script's
held-POST routes leaked across sections (one page, routes never
unrouted — the 250 section's first submit got re-held by the 248
route); fixed with `page.unroute` after each release — the spec never
saw it because each test gets a fresh page. (3) The VLM verification
read 3/5 — the two failures were the recurring placeholder-masking
lesson (the VLM cannot visually distinguish placeholder dots from
typed dots — descriptions now avoid claiming typed-vs-placeholder for
password fields) plus one positional-ordering error; after two
description corrections, 5/5. Also one honest tooling note: the E2E
full-suite time crossed the 600s tooling cap — each full run now
executes as two half-suite invocations (a–m, n–z; the extra setup
login per run is the split's artifact, documented everywhere the count
appears).

**Mutations ×5, each caught at the E2E layer on the REBUILT artifact
(the session-36 lesson), byte-exact reverts (md5-verified at every
step):** M1 the mismatch preference removed → **exactly P2**; M2 the
login label reverted to the ellipsis → **exactly P5**; M3 the register
label reverted → **exactly P6**; M4 the reset client-check deleted →
**exactly P8** (the posts counter — the box copy alone would have
stayed green: the server produces the same copy through the refine);
M5 `min(8)` → `min(3)` → **exactly P1** (the sed matched BOTH password
schemas — register AND reset; no pin depended on reset's min, the
proof held; both reverted byte-exact to the recorded md5s).

**Full gate:** lint 0/0 · tsc clean · 353/353 unit (22 files) · build
0 · **the FULL E2E 312 + 312 × 2 consecutive runs on the final code
(each run as two half-suite invocations: a–m 189 [6.0m] + n–z 123
[4.0m/3.9m] — the 600s tooling cap; every 429 pin self-contained per
endpoint+address, the boot/budget reset at the half boundary
deterministic) — 665 per run (353 unit + 312)**.

**Post-change battery:** the sweep re-run ALL 8 ROUTES AT BASELINE
(byte-identical — both fixes pixel-invisible: the error box renders
only after a submit, the pending label only during flight); the
**54th mobile-nav verification** re-run TOKEN-EXACT (the 53rd and 54th
in one round).

**Screenshots 246-250** (probe-first, single invocation, the production
standalone on :3001 — a FRESH process): the register short-password
box (the standing anchor — the reference-measured length copy); the
short+MISMATCH box reading "Passwords do not match" (Fix #1's proof
state); the login pending label "Logging in..." + disabled during a
held submit (Fix #2's proof state); the forgot pending label
"Sending..." during a held submit; the 11th wrong login's "Too many
attempts. Try again in 889s." box (P11's proof state). **VLM 5/5 PASS**
after two description corrections (the placeholder-masking lesson; a
positional-ordering fix).

**Docs:** PAD **v1.47** (§8.1's autherr-states row + the Total
47/665/353+312; §8.4's checklist 312; §3.2's tree 24 specs + the
autherr-states entry; the v1.47 revision row; the header's
Last-Updated session tag), SKILL **v1.47.0** (the version + §11's
stale 332/254 counts reconciled to 353/312 + the line-31 session
pointer + Appendix C → session47), AGENTS (the auth-error bullet + the
race lesson + the 72-byte divergence register), CLAUDE (the E2E
family + the ADR-010 contract refinement), README (the 665 row + the
Testing table + the mobile-nav 54 row + the File Hierarchy's stale spec
count), the verifier's spec-count recalibration 23→24 (the drift watch
re-run ALL FAMILIES GREEN), this log, the worklog S47 entry, the
plan's sign-offs. `.env.example` verified current (no env plumbing).

## Round 47 shipped ✅
**Session complete** — the baseline 653-test gate verified on the pulled
workspace; the Round-47 battery (sweep + the 53rd mobile-nav + watches +
census + dev-census) all clean pre-change and re-verified post-change.
**The deliverable: AUTH-ERROR-1** — the auth family's error-state
density, the customer-surfaces pin-density sweep's fifth installment:
TWO production fixes (the mismatch-first priority — the reference shows
"Passwords do not match" whenever the mismatch refine fires, regardless
of the password's length; the clone's Zod issues[0] always carried the
shape's password issue — and the ASCII-dots pending labels, all four
restored from the U+2026 ellipsis) + 11 pins (the error boxes, the
native blocks with ZERO-posts teeth, the held-POST pending windows, the
client-first reset check, the 129-char registered divergence, and the
rate-limit exhausted copy) + the 72-byte bcrypt platform leak REGISTERED
as the deliberate divergence.
**Gate: 665 tests per run** (353 unit + 312 E2E × 2 consecutive runs),
quintuple-mutation-proven at the E2E layer (each on the rebuilt
artifact, byte-exact reverts), sweep at baseline, the 53rd + 54th
mobile-nav token-exact, VLM 5/5.
**New lessons:** (1) an expect on text IDENTICAL across loop iterations
resolves instantly on the PREVIOUS response's box — it is NOT a
response sync point; sync on the response's own TRANSITIONS (the
pending flag's return + the L38 input reset), or a click lands in the
post-response reset window and the native `required` silently blocks
the submit; (2) never quote an ellipsis in a label assertion without
checking the reference's dots — ASCII "..." vs U+2026 "…" is a
customer-visible copy divergence; (3) Zod 3 runs the object-level
`.refine` even when the base shape fails — `issues[0]` is always the
shape's first-field issue, so any priority contract must be built
explicitly at the action layer; (4) held-POST `page.route` handlers
persist until `unroute` — fresh pages per test mask the leak, but
multi-section scripts must unroute after every release.
**Suggested next:** the sweep's sixth installment — the checkout
family's payment-step states (the card CVC/expiry empty-submit paths,
the PayPal branch's resting anatomy), or the account family's remaining
error surfaces; the credential-gated items remain (Stripe test-mode
keys — the refund SDK path live; an email provider — the guest-order
merge-back). Just send the next round instruction when ready.
