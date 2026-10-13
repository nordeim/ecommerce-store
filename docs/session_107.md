# Session 107 — Round 54: FOOTER-ANN-1 — The Footer's Interaction Family + the Announcement-Bar Static-Parity Closure: The Policy-Span Hover Divergence (the Honest RED), the Sweep's Third Zero-Divergence Family (the Marquee That Never Existed), and the Inherited-Token + Regex-Hole Lessons (the Sweep's Twelfth Installment)

The standing round instruction: refresh the workspace (a PULL round —
`git pull` fast-forwarded `a9360f8..dda6f33`, the user's session_106
narrative log, docs only), review the docs, validate against the codebase,
audit with the repo skills (the `skills/` folder excluded from
checking/testing/compilation — re-verified in all four configs), achieve
parity with the live reference (the agent-browser walk + the sweep battery),
pay particular attention to the mobile navigation (the Tailwind v4 trap
log), keep the Stripe integration professional (demo mode rests green
without keys — the standing credential gates unchanged), keep the vitest +
playwright suites healthy, write + validate + execute a TDD remediation
plan, capture dev-server screenshots, update the docs, and push to main via
the SSH wrapper.

**Workspace state.** PULL (not a reset): the environment intact — `.env`
(`DATABASE_URL="file:../db/custom.db"`), the hard-link DB convergence at
inode 263859 at BOTH paths, `node_modules`, the Playwright Chromium cache.
The `skills/` exclusion re-verified in all four configs (tsconfig exclude
line 41; vitest include allowlist; playwright testDir; eslint ignores).

**Baseline gate.** lint 0/0 (after ONE drive-by cleanup — the r53 capture
script's `el && el.blur()` no-unused-expressions warning at
scripts/capture-heronav-r53.mjs:102, rewritten as `if (el) el.blur()`; a
scripts/ file, zero production surface) · tsc clean · **353/353
unit+integration (22 files)** · build exit 0 · the full E2E baseline re-run
**all green — 384 chromium + the setup logins, four FILE-list invocations
(a–c 188 [5.6m] / c–m 41 [2.2m] / n–s 77 [3.7m] / s–z 82 [2.3m] —
byte-identical to the documented round-53 ship split)** — ZERO flakes.

**The Round-54 live battery (pre-change, the production standalone on :3000
via `scripts/battery-runner.sh prod`).** The paired pixel sweep **ALL 8
ROUTES AT BASELINE BAND** (home 0% [6 px, slide `1237b9a1afec` painted both
sides]; shop 0.05%, pdp 0.34%, cart 0.01%, wishlist 0% [9 px], checkout
0.01%, account 0% [9 px], login 0.28% — byte-identical to the documented
round-42..53 baselines). **The 67th mobile-nav verification: TOKEN-EXACT
PARITY** (all 10 checks). The standing watches clean (typeahead: the
reference fires ZERO search requests; carousel ~5000ms cadence; the SEO
layer: 17-URL sitemap, robots, JSON-LD, offers.price 299.99 USD). The
console census 24 routes + 11 admin CLEAN.

**The candidate triage (session-105's "suggested next" list):** the
announcement bar's "scroll-marquee behavior" SETTLED BY MEASUREMENT FIRST
(the r54a probe — the marquee does not exist; see below), the footer's
interaction family **CHOSEN** — the sweep's twelfth installment (the account
order-detail RE-DEFERRED the fourth time — 27 pins + the session-34/45
detail rounds; the credential-gated items UNCHANGED — no Stripe keys or
email credentials provided this round).

**THE FIRST HEADLINE — THE ANNOUNCEMENT BAR IS STATIC (the sweep's THIRD
ZERO-DIVERGENCE FAMILY).** The session-105 "scroll-marquee" suggestion was
SPECULATION. The r54a probe (reference, login-gated): the bar is a STATIC
single-text-node strip — `childCount: 0`, `animation: none`, ZERO
marquee/scroll keyframes in the document stylesheets, the 6s re-query
positional poll reads `innerX range [0, 0] — STATIC`, no hover behavior
(cursor auto), `white-space: normal`, `overflow: visible`. The class string
is **BYTE-IDENTICAL to the clone's**
(`bg-primary text-primary-foreground text-center py-1.5 text-xs font-medium
tracking-wide`) and every computed value matches (28px, 12px/500, ls 0.3px,
py 6/6, bg rgb(230,107,26), color white, text-center). The family closes as
the sweep's third zero-divergence family (after r52's buy-panel and r53's
heronav) — its unpinned resting values now first-time pinned (P1) + the
anti-marquee negative (P2).

**THE SECOND HEADLINE — THE POLICY-SPAN HOVER DIVERGENCE (the round's
honest RED).** The calibration (FOUR probes — announcement-probe-r54a +
footer-probe-r54b + footer-probe-r54d (reference, login-gated) +
footer-clone-r54c (clone, via the battery runner), live, the DOM dumps +
computed styles + REAL-mouse hovers as the ground truth): the footer is
NEAR-parity — **18 of 20 calibrated rows byte-identical or
rendered-identical** (the footer block `bg-foreground text-background`; the
container `max-w-7xl mx-auto px-4 sm:px-6 py-16`; the grid
`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10` at 4×278px/gap 40;
the 3 h3s `font-semibold text-sm uppercase tracking-wider mb-4` at
14px/600/uppercase/0.7px/mb 16; the 7 Shop links `text-sm text-background/60
hover:text-background transition-colors` with the REAL-mouse hover /60 →
full + the 0.15s duration BOTH sides; the 5 Company spans + cursor-pointer
+ their hover → full; the blurb `text-sm text-background/60 leading-relaxed
mb-6`; the contact `flex flex-col gap-2 text-sm text-background/60` with
16×16 icons; the hairline `shrink-0 h-[1px] w-full my-10 bg-background/10`;
the bottom-row container `flex flex-col sm:flex-row justify-between
items-center gap-4`; the copyright `text-xs text-background/40`; the mobile
collapse — 1 column, the bottom row column-direction gap 16, both sides) —
**the ONE divergence: the bottom-row policy spans.** The reference carries
`text-xs text-background/40 hover:text-background/60 cursor-pointer
transition-colors` on EACH span over a bare `flex gap-6` parent — the hover
target **/60** (measured live: rgba(251,250,249,0.4) → rgba(251,250,249,0.6));
the clone carried the resting tokens on the PARENT
(`flex gap-6 text-xs text-background/40`) and only
`hover:text-background` on the spans — the hover target **FULL** (measured
live: lab(/0.4) → rgb(251,250,249)).

**THE INHERITED-TOKEN TRAP (the round's structural lesson):** the resting
paint is IDENTICAL through inheritance — the /40 12px renders the same
whether the tokens live on the parent or the span — so the resting pixel
sweep AND a naive resting computed read BOTH see parity; only the
INTERACTION-GATED computed read sees the divergence. The same structural
finding as rounds 47–53, in its purest form: a divergence that hides behind
a resting-identical inheritance chain.

**THE DELIVERABLE (FOOTER-ANN-1)** — the honest-RED round form (the r51
pattern):

- **THE FIX (`src/components/store/footer.tsx`, the bottom row):** the
  parent `flex gap-6 text-xs text-background/40` → `flex gap-6`; each span
  → the reference's per-span class with the /60 hover target. The resting
  paint UNCHANGED (the computed /40 12px moves from inheritance to the
  span's own tokens — the sweep verified byte-identical post-change); the
  hover target /40 → FULL ⇒ /40 → **/60**.
- **`tests/e2e/footer-states.spec.ts`** — 14 pins: P1 the announcement
  bar's full resting contract (the closure's anchor); P2 the STATIC
  negative (0 children, animation none — the anti-marquee pin closing the
  session-105 speculation permanently); P3 the footer anatomy (structural —
  the block, the container, the 4×278 grid); P4 the heading typography; P5
  the Shop links' resting + the clone's category-filter href inventory (the
  SUPERSET contract — the reference's 7 hrefs all point to plain /shop);
  P6 the Shop-link hover (REAL mouse → full, 0.15s); P7 the Company spans;
  P8 the Company-span hover; P9 the bottom row + copyright; P10 the policy
  spans' per-span placement (THE FIX's structural pin); P11 the policy hover
  /40 → /60 NOT full (THE FIX's behavioral pin); P12 the contact block; P13
  the blurb + hairline; P14 the mobile collapse + the bar's 28px at 390px.
- **The honest RED verified:** P10 + P11 FAILED against the pre-fix
  artifact (P11 read the full `rgb(251, 250, 249)` — exactly the calibrated
  divergence); the other 12 pins green. The fix turned the spec 15/15 green
  (14 pins + the setup login) with zero collateral.

**Mutations ×8, each caught at the E2E layer on the REBUILT artifact (the
session-36 lesson), byte-exact reverts (md5-verified at every step; the
final state matches the pristine md5s — footer `ca8c5c98…`,
announcement-bar `95083947…`):** M1 the fix reverted (the hover target /60 →
full, Privacy) → **exactly P10+P11** (the honest pair — the fix's own
regression caught by both the class pin and the behavioral pin); M2 the
per-span placement stripped (Cookie) → **exactly P10** (the surgical
placement catch — P11's Privacy untouched); M3 the Shop-link hover removed
→ **P5+P6** (the honest pair); M4 the Shop-link resting /60 → /50 →
**P5+P6**; M5 the heading tracking-wider dropped → **exactly P4**; M6 the
grid lg:grid-cols-4 → 3 → **exactly P3**; M7 the announcement bar py-1.5 →
py-1 → **P1+P14** (the honest pair — the mobile height check catches it
too); M8 the policy cursor-pointer dropped → **exactly P10**.

**Full gate:** lint 0/0 · tsc clean · 353/353 unit (22 files) · build 0 ·
**the FULL E2E 398 + 398 × 2 consecutive runs on the final code (each run
as four FILE-list invocations: a–c 202 [5.9m — footer-states joined the a–c
group], c–m 41 [2.2m], n–s 77 [3.7m], s–z 82 [2.4m]) — 751 per run (353
unit + 398 E2E)**.

**Post-change battery:** the sweep re-run **ALL 8 ROUTES AT BASELINE
byte-identical** (the fix is hover-only; the resting computed moved from
inheritance to the span's own tokens with the SAME values — as predicted);
the **68th mobile-nav verification** re-run TOKEN-EXACT (the 67th and 68th
in one round); the watches + census clean.

**Screenshots 281-285** (probe-first, single invocation, the production
standalone on :3001 — a FRESH process, ZERO DB mutations by construction):
the footer at rest (the full 4-col block — grid 4×278 gap 40, the policy
class already the fixed per-span form); the Shop link hovered (the /60 →
full lift — the probe read `rgb(251, 250, 249)`); the policy span hovered
(**THE FIX'S PROOF — the probe read `lab(98.3283 0.212789 0.603545 / 0.6)`,
the /60 target**); the announcement bar (28px, static, animation none — the
closure's anchor); the mobile footer at 390px (the 1-col collapse + the
bottom-row column + the bar's 28px). **VLM 3/5 direct + 1
recaptured-corrected + 1 zoom-instrument:** 283's first description error
(my own — it named the copyright, which sat OUTSIDE the 640px crop; the
pixel settle recaptured with the full bottom row and the corrected
description passed); **282 disputed twice at the full crop** (the VLM read
the hovered link "the same dim color" — the pixel settlement measured the
glyph cores p95 234 vs the resting neighbor's 150, delta 84: the hover WAS
rendered) and **PASSED on a 3x-enlarged crop** built from the EXISTING
capture — the VLM 14px-glyph limit: give the instrument a fair zoom before
settling by pixels.

**The round's honest moments (four):** (1) **THE REGEX-HOLE CENSUS** —
r54b's policy-span census filtered `/policy/i`, which MISSED "Terms of
Service" (the bottom row read `policyCount: 2` — a false inventory); the
r54d structure probe re-read the full child inventory and found all 3 spans.
Never content-filter a census by a regex the content itself can violate;
enumerate the children. (2) **THE INHERITED-TOKEN TRAP** — the divergence
hid behind a resting-identical inheritance chain for 53 rounds: the parent
carried the tokens, the spans carried the hover, and every resting
instrument saw parity. Hover-gate every color probe in a family where
tokens can live on a parent. (3) **THE SPECULATIVE-BEHAVIOR CLOSURE** — the
session-105 "scroll-marquee" was a hypothesis, not a fact; 20 minutes of
probing closed it before a phantom feature got planned. A prior session's
"suggested next" is measured, never assumed. (4) **THE VLM 14PX-GLYPH
LIMIT** — 282's alpha-lift at 14px text is below the VLM's perceptual floor
at a 420×260 crop; the zoom crop (3× nearest-neighbor from the existing
PNG, no re-run) is the fair-instrument step BEFORE the pixel settlement.

**Docs:** PAD **v1.54** (the v1.54 revision row; §8.1's footer-states row +
the Total row 54/751/353+398; §8.4's checklist 398/31 files; §3.2's tree 31
specs + the footer-states entry + 54 plans), SKILL **v1.54.0** (the version;
the line-31 session pointer; §11's counts 353/398; Appendix C → session54 +
**lesson 058** — L64 the regex-hole census, L65 the inherited-token trap,
L66 the speculative-behavior closure, L67 the VLM 14px-glyph zoom), AGENTS
(the footer bullet + the registers), CLAUDE (the E2E row's family + 398),
README (the 751 row + the footer family + the Testing table's 398 + the
mobile-nav 67/68 row + the File Hierarchy's 31/398), the verifier's
spec-count recalibration 30→31 — **the drift watch re-run ALL FAMILIES
GREEN**, this log, the worklog S54 entry, the plan's sign-offs;
`.env.example` verified current (no env plumbing this round).

## Round 54 shipped ✅
**Session complete** — the baseline 737-test gate verified on the pulled
workspace; the Round-54 battery (sweep + the 67th mobile-nav + watches +
census) all clean pre-change and re-verified post-change.
**The deliverable: FOOTER-ANN-1** — the footer's interaction family, the
customer-surfaces pin-density sweep's twelfth installment: the sweep's
**THIRD ZERO-DIVERGENCE FAMILY** (the announcement bar — the marquee never
existed; static both sides, byte-identical classes, every computed value
equal, now pinned at rest + the anti-marquee negative) + the footer's
**ONE honest fix** (the bottom-row policy spans' hover /40 → /60 with the
per-span class placement — the inherited-token trap: a divergence that hid
behind a resting-identical inheritance chain for 53 rounds) + the
category-href superset pinned + the 14-pin spec.
**Gate: 751 tests per run** (353 unit + 398 E2E × 2 consecutive runs),
octuple-mutation-proven (M1 → P10+P11 the honest pair; M7 → P1+P14 the
mobile catch), sweep at baseline byte-identical, the 67th + 68th mobile-nav
token-exact, VLM 3/5 direct + 1 recaptured + 1 zoom-instrument (281-285).
**New lessons:** (1) the regex-hole census — enumerate the children, never
content-filter; (2) the inherited-token trap — hover-gate every color probe
where tokens can live on a parent; (3) the speculative-behavior closure —
measure a prior session's "suggested next" before planning it; (4) the VLM
14px-glyph limit — the 3× zoom crop from the existing capture before the
pixel settlement.
**Suggested next:** the sweep's thirteenth installment (the header's
icon-button states — the heart/bag counters' hover/focus corners; the
toast's enter/exit animation states; the account order-detail's final deep
corners), or the standing credential-gated items (Stripe test-mode keys —
the refund SDK path live; an email provider — the guest-order merge-back).
Just send the next round instruction when ready.
