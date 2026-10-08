I'll start by refreshing my understanding of the workspace state — reading the worklog, session docs, and checking git status to see exactly where the last session left off.
The repo has a commit `56262f7` for session-9 remediation already committed. Let me read the latest worklog entries and the session docs mentioned (session_16, session_17, remediation-plan-session9).
Now let me do a `git pull` to refresh and check whether `docs/session_17.md` exists on the remote (it's mentioned in the task but not in the local docs listing).
A new commit `e150118` came in with `docs/session_17.md` — a previous continuation round left a log. Let me read it carefully along with the remediation plan status.
`session_17.md` documents Round 9's completion — shipped as commit `56262f7` + log commit `e150118`, 224-test gate, all verified. Current HEAD is `e150118`, tree clean. Now I'm starting **Round 10 (session-10)**. Let me set up the TODO plan and verify the environment + baseline gates.
Environment intact — `.env` correct, DB hardlink convergence live (inode 303519), deps in place, no dev server running. Running the baseline gate now (fast gates first).
88/88 unit tests pass. Now the production build, then E2E.
Build clean — 23 routes. Now the E2E gate (foreground, no dev server per OOM lessons from prior sessions).
**Baseline gate fully green**: lint 0/0 · tsc clean · 88/88 unit · build 23 routes · 136/136 E2E = **224 tests** — exactly the documented session-9 ship state. Now let me re-read the core contract docs (AGENTS/CLAUDE) to refresh invariants before the Round-10 audit.
I have the full contract picture refreshed. Now let me check the existing audit tooling from prior sessions (scripts/ convention) and set up the Round-10 audit infrastructure.
That script belongs to a different project. Let me check this repo's own verify-session9.ts convention.
Now I understand the audit infrastructure conventions. Let me load the agent-browser skill for the live differential audit.
Now let me start the production server for the audit (per session-9's OOM lesson — dev server gets killed during captures). Let me check how the E2E config boots it first.
Server is healthy. Now let me open the reference site and log in (one clean login — rate limits are per-IP).
Reference logged in. Now the clone session.
Both sessions authenticated. Now the **mobile nav 10th verification**. First, save cookies (per session-9 lesson: `set device` resets the context), then emulate iPhone 14 on both.
Reference uses localStorage auth (no cookies). Let me save full session state for both before device emulation.
Reference mobile nav census complete. Now the clone's mobile nav — set device, load state, open menu.
**✅ Mobile nav 10th verification: BYTE-EXACT PARITY** — identical panel classes, padding 24px, gap 16px, 5 identical links (w=239, h=44, fs=18px, fw=500). No Tailwind v4 regression.

Now the Round-10 deep-audit focus: **the tablet viewport band (640/768/1024px)** — the unaudited middle band where trap #9's lesson applies (desktop+mobile parity doesn't prove intermediate widths). Let me close the panels and find the nav breakpoint on both.
At 768px the ref shows BOTH hamburger AND nav links. Now the clone at 768:
Both show hamburger at 768 — but are the nav links actually visible (or just in DOM)? Let me verify visibility precisely on both.
Identical nav behavior at 768 (both hide links, show hamburger). Now systematic tablet sweep — shop grid columns at 640/768/1024 on both sites:
Shop grid identical across the tablet band. Now the account surfaces at the `sm:` boundary (640/639/768) — where session-9's grid and order-row changes engage:
Profile grid parity across the band. Now the Orders tab rows at the sm: boundary:
Orders rows identical too. Now the PDP layout across the band:
PDP identical. Now home hero + sections across the band:
Home shows hero height drift at ≥640 (ref 188/244 vs clone 193/268). Let me investigate — this may be slide-content timing or a real layout difference:
The hero container is `h-[50vh] sm:h-[55vh] lg:h-[65vh]` with absolute slides — my "heroH" measured the ACTIVE slide's text block (timing-dependent). Let me compare ALL slides' text blocks per-slide index (timing-independent):
The clone renders all 3 slides' text blocks. The ref swaps in-DOM per active slide. Let me sample the ref's rotation over time to learn its slide order and copy:
Ref cycles: Spring Collection 2026 → Tech Essentials → Home & Comfort (matches clone's DOM order cyclically). The same-slide text-block heights differed (ref "Home & Comfort"=196 vs clone=208). Let me click through slides deterministically on both and compare per-slide copy + geometry:
**Finding: HERO-TB-H-1** — slide copy identical, but text-block heights differ (ref 196/196/244 vs clone 208/208/268). Let me diff the internal structure element-by-element:
**ROOT CAUSE: HERO-LH-1** — the hero h1 line-height: ref **48px (1.0)** vs clone **60px (1.25)**, same 48px font. Everything else in the slide matches. Let me inspect the clone's hero source:
The clone's h1 has `leading-tight` (1.25); the ref measures 1.0 at 48px. Let me check the ref's line-height at smaller breakpoints to decode the full pattern:
The ref's lh pattern (37.5/40/48) matches v3 per-size defaults except at 3xl. Let me re-measure the ref at 639 carefully (carousel might have been mid-swap):
Confirmed stable. Let me read the ref's actual h1 className to decode the exact classes:
**Root cause decoded — trap #10 (v3↔v4 line-height cascade)**: The ref's h1 className is IDENTICAL to the clone's (`...mb-3 leading-tight`), but on v3 the responsive `sm:text-4xl`/`lg:text-5xl` rules (in media queries, emitted after base utilities) re-override `leading-tight` with their own line-heights (40px/48px); on v4 the base `leading-tight` wins at ALL widths (45/60px). Same classes, different cascade!

Let me sweep the codebase for other elements with this pattern (`leading-*` + responsive `text-*` on the same node):
Only one instance in the whole codebase — blast radius contained to the hero h1. Let me double-check for arbitrary-size variants too:
All other `leading-*` sites are non-responsive — contained. Continuing the tablet sweep: cart, checkout, auth at 639/768:
Carts match (both empty resting state). Now auth at tablet widths:
Auth identical. Now the systematic **text-metrics census** at desktop 1024 — collecting every visible text element's (fontSize, lineHeight) digest on key pages of both sites to catch any remaining v3/v4 metric drift:
Home digest confirms: the only true drift is the hero h1 (48/60 vs 48/48); the +2 counts are the clone's all-slides-in-DOM structure (expected). Now shop + PDP censuses:
Shop and PDP digests **identical**. Account next:
Account identical. Now checking **focus-visible ring states** on key interactive elements (a11y + visual state parity):
**FINDING — FOCUS-RING-1**: ref's sort select shows `outline solid 2px` + primary-color ring on focus; clone shows none. But programmatic `.focus()` may not trigger `:focus-visible`. Let me verify with real keyboard navigation (Tab):
Let me record the full tab sequence with focus styles on both sites side-by-side:
Synthetic keydowns don't move focus. Let me verify the ref's global focus machinery (accent-color + custom rules) and the clone's real Tab focus:
**Key discovery**: the ref's global base layer sets `outline-color: hsl(var(--ring) / .5)` on `*` — and its `--ring` resolves to the primary orange. Let me compare both sites' `--ring` token values and the clone's focus machinery:
The clone's `--color-ring` = #e66b1a — same orange, same global `outline-ring/50` rule. The divergence is in per-component focus styling. Let me read the clone's Select trigger:
Clone's Select uses `focus:ring-1` (newer shadcn pattern); ref measured a 2px ring + offset (v3 pattern). Let me verify input focus states on both — this dimension was never audited in sessions 1-9:
**FOCUS-INPUT-1 confirmed**: ref shows a 1px primary ring on plain `:focus` (mouse clicks); clone's ring only engages on `:focus-visible` (keyboard). Let me verify the clone's keyboard-focus rendering with real Tab:
The clone's password input shows NO ring even on real keyboard focus. Let me inspect the input component source:
The rendered login input is MISSING the focus-visible classes entirely — the login form overrides them. Let me check:
The class was truncated in my earlier read (120 chars). Let me re-measure the focused input's full state:
`:focus-visible` matches but NO ring renders — the utility CSS may be missing from the build! Let me check the actual stylesheet content:
The rules exist in CSS but don't render. Let me inspect the CSS variable resolution on the live element:
The clone's ring DOES render (the earlier read raced the style recalc). Let me nail the ref's exact focus-state mechanics:
Input focus parity is effectively identical (1px primary ring, offset layer invisible at 0px). Now the definitive Select-trigger comparison with focus-visible state:
Focus states are near-identical on form controls. Let me check the ref's plain-button focus machinery (its Button showed UA outlines, no ring):
The ref's styled Buttons have the SAME focus classes as the clone's. The earlier UA-outline button was an unstyled element (carousel dots). Let me check the clone's carousel dots:
Focus states: **dismissed** — both sites use identical focus patterns (same Button classes, same 1px ring on form controls, same global outline-tint rule; the apparent diff was a measurement artifact). The dots on both are unstyled buttons riding UA outlines.

Now the reference-drift re-check (typeahead) and a hover-state probe:
False positive (product card ATC wrapper). Let me check via network requests instead:
Typeahead confirmed still absent on ref (0 requests) — clone's remains the documented superset. Let me check what hover states are already pinned, then run the a11y/alt-text census:
No hover checks pinned. Let me live-compare the two most visible hover surfaces — product cards (image scale + title color):
Ref hover: card img scales 1.05, hovered h3 turns primary orange, others stay foreground. Now the clone:
Hover worked on ref but NOT on clone. Let me check what element sits at that point on the clone:
`matchMedia('(hover:hover)')` = **false** on the clone — leftover touch emulation from the earlier `set device`. Tailwind v4 gates `group-hover:` behind `@media (hover:hover)`. Let me check the ref's state and reset the clone's emulation properly:
Both sessions have `(hover:hover)=false`, yet the **ref's hover effects still worked** while the clone's didn't. Let me confirm the v4 media gate in the clone's emitted CSS:
No media gate in the emitted CSS — the rules are plain `:is(:where(.group):hover *)`. So why didn't the img scale? Let me probe the selector directly:
The selector matches but `--tw-scale-x` stays 1. Let me check if the `group-hover:scale-105` rule actually EXISTS in the emitted CSS:
The media queries use `(hover:hover)` without space — my earlier grep missed them! Let me find the enclosing block for the scale rule:
**CONFIRMED — Trap #11**: v4 emits `hover:`/`group-hover:` variants inside `@media (hover:hover)` blocks (invisible in line-greps of minified CSS). The ref (v3, ungated) applies hover effects whenever `:hover` matches. Let me quantify the blast radius:
Plain `hover:` rules are UNGATED; only `group-hover:`/compound variants sit in `(hover:hover)` blocks. Let me check the repo's globals.css for custom variant definitions:
Seven live `group-hover` sites — all parity-relevant (card scale, title color, quick-add slide, nav underline, category icon, arrow). Now let me check the Tailwind version and prior pixel-diff infrastructure:
`sharp` is available. Let me capture paired screenshots at 1024 for the key routes and pixel-diff them as the catch-all:
Desktop diffs: shop 0.29%, PDP 0.54%, account 0.29% (sub-threshold ✓); home 2.58% = the documented hero-timing divergence. Now the 768 tablet-band pixel pass:
The captures silently failed. Let me debug one capture directly:
Tablet band: **all routes sub-threshold (0.27–0.40%)**. The audit is complete with two findings. Let me verify the exact Tailwind version to design the hover-gate fix precisely:
Tailwind 4.3's `hover` wraps declarations in a **nested** `@media (hover:hover)`. Let me find the `group` variant registration:
The mechanism is subtle — let me settle it empirically: test a **plain** `hover:` element (primary button) on the clone in this touch context:
**Definitive**: the clone's plain `hover:text-foreground` does NOT apply even while `:hover` matches — ALL v4 hover-family variants are media-gated. Let me confirm the ref's opposite behavior on its own nav link:
**Trap #11 confirmed with live A/B evidence**: ref's `hover:text-foreground` applies in touch context (23,23,28); clone's stays muted. This affects EVERY hover-styled element. Let me run two final spot-checks (::placeholder + a functional checkout flow), then close the audit:
Audit complete — two solid findings. Now writing the remediation plan. First, let me validate the test seams (how existing specs create ad-hoc browser contexts, and the storefront-parity structure):
Let me check the session-9 plan's structure to match the convention:
Now writing the Round-10 remediation plan:
Now TDD RED. Let me view the end of the parity spec to place the new tests:
Now stop the audit server (free memory for E2E) and run the RED phase — the two new tests must fail for the right reasons:
**RED confirmed for the right reasons**: expected 40px (ref), got 45px (v4 trap signature); hover transform stayed `none` (media gate). Now GREEN — implementing both fixes:
Now T2 — the hero h1 leading pins:
Both fixes in. Rebuild and run the GREEN check:
Hero test GREEN. Hover test still failing — let me check why:
Let me verify the emitted CSS after the fix — did the custom variant un-gate group-hover?
CSS fix confirmed (0 media gates, group-hover ungated). The failure must be the hover mechanics in the touch context. Let me debug:
`:hover` matches but the rule still doesn't apply. Let me verify the 3100 server actually serves the NEW ungated CSS:
The CSS is fixed — but v4's `scale-105` sets the CSS **`scale` property**, not `transform`! My assertion checked the wrong property. Let me verify:
**Fix works**: `scale: 1.05`, h3 = orange, all under `hvq: false`. The test asserted v3's `transform` spelling — v4 uses the `scale` property. Updating the test:
**GREEN complete** — 24/24 parity tests pass including both new pins. Now the full gate:
138/138 E2E. Running once more for the determinism proof (repo convention):
Two consecutive 138/138 runs — determinism proven. Now the live re-verification script (repo convention):
The last check used a weak heuristic (first header link = logo, no hover class). Let me fix it to count hover utilities across the chrome:
**Live verification 7/7 green.** Now pixel re-diffs of affected routes (hero fix affects home; hover fix is rest-invisible):
**Home diff 2.58% → 0.30%** — the hero fix collapsed the band. Now the delivery screenshots (r10-8) — writing the persisted capture script per repo convention:
All 6 captured. Now VLM verification per repo convention:
5/6 — the mobile-nav shot may be missing the logo. Let me check both the code and the reference's sheet header:
The ref's sheet has NO logo either — just a Close button + nav (my VLM description was wrong, not the code). Let me verify the clone's sheet structure matches, then fix the description:
Clone's sheet = ref's sheet (Close button + nav; the H2 is sr-only a11y superset). The VLM description was wrong. Fixing it and re-verifying:
**6/6 VLM-verified.** Now the docs updates. First, checking repo state:
Now CLAUDE.md — updating test counts and adding session-10 contracts:
Now README.md:
Now the PAD — v1.10 changelog + ADR-018:
Now the PAD's test matrix and Known Issues rows:
Let me verify the parity spec test count for the matrix:
The 24th is the setup dependency — parity spec itself has 23. Fixing:
Now the Known Issues rows:
Now the SKILL doc:
Now writing the session_18.md log:
Now appending the Round-10 entry to the repo worklog:
Now final pre-commit hygiene — `.env.example` verification and git status:
Let me check the SKILL doc's remediation-plan references (a stale-ref bug in a prior session):
All ignored. Now let me review the SSH wrapper instructions before committing:
The push procedure is clear. Now committing on main:
Commit `297d018` on main. Now the push — key to a 0600 temp file outside the repo, dry-run first:
Dry-run clean (fast-forward `e150118..297d018`). Executing the real push:
Push verified — remote main @ `297d018` == local HEAD. Fixing the shred script bug (key still on disk):
Round 10 (session-10) is complete and shipped ✅ — commit `297d018` on `main`, pushed via the SSH wrapper, remote verified, key shredded.

**What this round delivered:**
- **Two new Tailwind v4 engine traps found and fixed** (both live-measured on the reference AND the clone with identical evidence conditions):
  - **Trap 11 (hover media-gate):** v4.3 wraps every hover-family utility in `@media (hover: hover)` — all hover effects were dead in touch/hybrid contexts while the v3 reference still rendered them. One line (`@custom-variant hover (&:hover);` in globals.css) restored v3 semantics; zero component changes.
  - **Trap 10 (line-height cascade):** the hero h1's class string is byte-identical to the reference's, yet rendered 45/60px vs the reference's 40/48px at ≥640/≥1024. Pinned with `sm:leading-[2.5rem] lg:leading-none`; home pixel diff 2.58% → 0.30%.
- **Mobile nav: byte-exact parity for the 10th consecutive verification** — no v4 regression.
- **First tablet-band sweep (639/640/768/1024)** + focus-state audit + text-metric censuses — everything else verified identical (all pixel diffs 0.27–0.54%).
- **Gate: 226 tests** (88 unit + 138 E2E, two consecutive full runs), live re-verification 7/7, screenshots 58–63 VLM-verified 6/6, all docs updated (PAD v1.10/ADR-018, SKILL v1.10.0, AGENTS traps log, session_18).

**Suggested next:** round-11 candidates — wiring a real email provider (activates the ADR-011 verification gate), Stripe Payment Element, admin order filtering/search, a Lighthouse/axe accessibility pass, or a print/reduced-motion media audit (the last unaudited CSS surface). Say the word, or just say "review again" for another differential audit.
