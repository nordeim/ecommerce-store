# Session 18 Log — Round-10 Differential Audit + Remediation

**Date:** 2026-10-08 · **Agent:** Super Z (review/build) · **Branch:** `main`
**Baseline:** `e150118` (session-9 ship `56262f7` + the remotely-added `docs/session_17.md`)

## Timeline

1. `git pull` brought `docs/session_17.md` (the previous continuation
   round's narrative log); reviewed all root docs + `docs/session_16.md` +
   `docs/remediation-plan-session9.md` + `worklog.md` — everything current
   through session-9 (PAD v1.9, SKILL v1.9.0, the 224-test gate).
   Environment intact (`.env` with `DATABASE_URL="file:../db/custom.db"`,
   `db/` at repo root, hard-link convergence still live at inode 303519).
2. **Baseline gate:** lint 0/0 · tsc clean · 88/88 unit · build exit 0 (23
   routes) · 136/136 E2E = 224 — exactly the documented session-9 ship
   state.
3. **Round-10 live A/B audit** (agent-browser sessions `ref` + `clone`,
   the clone served by the **production standalone server** on :3000 per
   the session-9 OOM lesson; both sessions authenticated once — the ref via
   the operator account, the clone via the demo user):
   - **Mobile nav (10th standing verification):** iPhone 14 both sites —
     the Sheet panel class string is byte-identical, pad 24px, gap 16px,
     bg `rgb(251, 250, 249)`, all 5 links byte-identical (239×44, 18px/500,
     `display:block`). **No Tailwind v4 regression.** (Also censused both
     sheet headers: Close button + nav only — NO logo on either site; the
     clone's sr-only H2 title is the a11y superset.)
   - **Tablet viewport band (the round's primary new surface):** 639 / 640
     / 768 / 1024 px probes on both sites — shop grid column flips
     (2→3→3→4 at the same widths, identical card widths), profile fields
     grid (1→2 cols at 640, Save 127px fit-content at every width), Orders
     rows (column→row at 640, identical row widths), PDP layout
     (side-by-side only at 1024), auth card (448px constant), header
     (hamburger at 768 both). **All identical except the hero h1 (below).**
   - **Text-metric census:** per-route (fontSize, lineHeight) digests on
     home / shop / PDP / account — identical on shop/PDP/account; home
     differs ONLY in the hero h1 (48/48 vs 48/60 — the finding) plus the
     expected all-slides-in-DOM count deltas.
   - **Focus-state audit:** dismissed after re-measurement — both sites
     use the same shadcn focus classes (read live from the ref's DOM),
     render the same 1px #e66b1a ring, and carry the same global
     `outline-color: ring/50` base rule (the ref spells the token
     `--ring: 24 80% 50%`, the clone `--color-ring: hsl(24 80% 50%)` —
     the same orange). First-probe "gaps" were programmatic-focus and
     style-recalc-race artifacts.
   - **Reference drift watch:** the typeahead still fires ZERO requests on
     the reference (fetch/XHR monkey-patch probe) — the clone's typeahead
     remains the registered superset. Placeholders identical.
   - **Pixel diffs:** desktop 1024 — shop 0.29 / PDP 0.54 / account 0.29;
     tablet 768 — shop 0.39 / PDP 0.39 / account 0.40 / cart 0.40 / login
     0.27 — all sub-threshold. Home measured 2.58% pre-fix → 0.30%
     post-fix (see below).
   - **Findings (2, both engine-level v3↔v4 divergences with live-measured
     evidence from BOTH sites):**
     - **HERO-LH-1 (trap 10):** the hero h1's class string is
       byte-identical on both sites
       (`…text-3xl sm:text-4xl lg:text-5xl… leading-tight`), yet the
       reference renders 40px/48px line-heights at ≥640/≥1024 while the
       clone rendered 45/60px — v3 emits responsive text utilities in
       media layers AFTER base utilities so they re-override `leading-tight`
       (its 1.25 loses); v4's sort order lets the base leading win at
       every width. Every hero slide's text block measured +12px (the
       2-line Spring slide +24px: 268 vs 244px).
     - **HOVER-GATE-1 (trap 11):** Tailwind 4.3 registers its default
       `hover` variant with an `@media (hover: hover)` wrapper (verified
       in `dist/lib.mjs`) — EVERY hover-family utility (plain `hover:*`,
       `group-hover:*`, breakpoint compounds) goes inert in touch/hybrid
       contexts. Live-proved both ways in touch-emulated sessions
       (`(hover: hover)` false): the reference's nav link flips to
       foreground and its card img scales 1.05 with the hovered title
       primary; the gated clone rendered NONE of it (`:hover` matching,
       rules inert). Invisible to desktop-only audits — nine rounds
       missed it because a real mouse makes the media query match.
4. **Remediation plan** (`docs/remediation-plan-session10.md`): findings +
   evidence + validated seams (the codebase sweep found exactly ONE
   `leading-*` + responsive-`text-*` coexistence — the hero h1; the
   hover-gate fix is variant-level, zero component files) + TDD plan +
   sign-off criteria. Checked off after execution.
5. **TDD RED:** 2 new E2E tests in `storefront-parity.spec.ts` — the
   37.5/40/48px line-height cascade at 630/768/1024, and the touch-context
   hover proof (iPhone-14 context, `(hover: hover)` asserted false, card
   img `scale: 1.05` + title `rgb(230, 107, 26)`). Both failed for the
   right reasons (`45px` where 40 was expected; `transform: none` —
   which also surfaced that v4's `scale-*` sets the CSS **`scale`**
   property, not `transform`; the assertion was corrected to the v4
   spelling of the same visual result).
6. **TDD GREEN:**
   - T1 (HOVER-GATE-1): `@custom-variant hover (&:hover);` in
     `globals.css` — one line restoring v3 semantics for the whole hover
     family (the `group-hover` compound composes on top, keeping v4's own
     selector shape). Post-build verification: ZERO `@media (hover:hover)`
     blocks remain in the served CSS.
   - T2 (HERO-LH-1): the hero h1 gains `sm:leading-[2.5rem] lg:leading-none`
     (the exact v3 companion values — 40px = the 4xl line-height, 48px =
     the 5xl's 1).
7. **Gate at ship:** lint 0/0 · tsc clean · 88/88 unit · build exit 0 (23
   routes) · **138/138 E2E = 226 total** (was 224; +2 E2E, none removed) —
   **two consecutive full runs** for determinism.
8. **Live re-verification** (`scripts/verify-session10.ts`): **7/7 green** —
   the three line-height values, the touch-context hover state (scale 1.05
   + primary title + `(hover: hover)` false), the chrome hover census (18
   hover-styled elements), and zero media gates in the served CSS.
9. **Pixel re-diff:** home 2.58% → **0.30%** (the hero band collapsed).
10. **Screenshots:** 6 new (58–63, captured by the persisted
    `scripts/capture-session10.ts` — 61 is the touch-context hover proof
    shot, 63 the 10th mobile-nav verification; VLM-verified **6/6** from
    the scratch dir; the one initial VLM "FAIL" on 63 was a bad
    description — the reference's sheet has NO logo either, re-verified
    live on both sheets) → 63 total. `.env.example` verified current (both
    fixes are CSS-level — no new env plumbing).
11. **Docs:** AGENTS.md (traps 10 + 11 with the v4 `scale`-property note),
    CLAUDE.md (session-10 contracts, 138 E2E), README.md (226 tests, 10th
    mobile-nav verification, the two new parity gates), PAD v1.10 (ADR-018,
    test matrix, 2 Resolved rows), SKILL v1.10.0 (pitfalls 33–34), this
    session log, the worklog.

## Key decisions

- **The hover un-gate is one CSS line, not a component sweep** — the
  variant definition composes through every hover-family utility, so no
  component file changes and the resting visual is untouched. The
  alternative (overriding `group-hover` alone) was rejected: plain
  `hover:*` utilities are gated through the same variant definition.
- **v3's sticky-hover-on-tap behavior is accepted as parity** — the
  reference exhibits it (v3 semantics), so the clone keeps it; documented
  in ADR-018's consequences.
- **The hero pins are computed-parity-over-class-parity** (the trap-8
  precedent): the class string carries two utilities the reference's DOM
  doesn't, but the rendered geometry matches the reference at every
  breakpoint.
- **The hover test asserts `getComputedStyle(img).scale`**, not
  `transform` — v4's `scale-*` sets the CSS `scale` property; the same
  visual result in the v4 spelling. Documented in AGENTS trap 11 so future
  specs don't re-trip on it.

`docs/remediation-plan-session10.md` records the full audit trail.

## Suggested next steps

Round-11 candidates: wire a real email provider to activate the
verification gate (ADR-011), Stripe Payment Element (ADR-007's documented
next step), admin order filtering/search, a Lighthouse/axe accessibility
pass, or a print/reduced-motion media audit (the next unaudited CSS
surface). Tell me which to pick up and I'll start the next round.
