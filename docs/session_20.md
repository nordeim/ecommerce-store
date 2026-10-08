# Session 20 Log — Round-11 Differential Audit + Remediation

**Date:** 2026-10-08 · **Agent:** Super Z (review/build) · **Branch:** `main`
**Baseline:** `f9becf4` (session-10 ship `297d018` + the remotely-added
`docs/session_19.md`)

## Timeline

1. `git pull` brought `docs/session_19.md` (the previous continuation
   round's narrative log); reviewed all root docs + `docs/session_18.md` +
   `docs/remediation-plan-session10.md` + `worklog.md` — everything current
   through session-10 (PAD v1.10, SKILL v1.10.0, the 226-test gate).
   Environment intact (`.env` `DATABASE_URL="file:../db/custom.db"`, `db/`
   at repo root, hard-link convergence live at inode 303519).
2. **Baseline gate:** lint 0/0 · tsc clean · 88/88 unit · build exit 0 (23
   routes) · 138/138 E2E = 226 — exactly the documented session-10 ship
   state.
3. **Round-11 live A/B audit** (agent-browser sessions `ref` + `clone`, the
   clone served by the production standalone server on :3000; both sessions
   authenticated; session state saved to files before device emulation):
   - **Mobile nav (11th standing verification):** iPhone 14 both sites —
     the Sheet panel class string is byte-identical, pad 24px, gap 16px, bg
     `rgb(251, 250, 249)`, nav `flex flex-col gap-4 mt-8`, all 5 links
     byte-identical (239×44, 18px/500). **No Tailwind v4 regression.**
   - **Media-preference sweep (the round's primary new surface):**
     `prefers-reduced-motion: reduce` — both sites still animate (the
     clone's 300ms CSS toast transitions and the reference's
     framer-motion JS springs both ignore the preference — parity);
     `prefers-color-scheme: dark` — neither site responds (parity); print
     emulation — computed surfaces identical (the only diff is the
     documented alpha-notation trap 6); transition-duration censuses
     identical.
   - **A11y-semantics census** (home/shop/PDP/login): landmarks, heading
     order, img-alt coverage (0 missing on either site), and `lang`
     identical; the clone labels every button/input (ref: 21/17/10
     unlabeled buttons — the documented aria superset); the "4 unlabeled
     inputs" on /login are Next server-action hidden inputs, not
     AT-exposed.
   - **Carousel rotation re-measured with a corrected probe** (slide
     aria-hidden/opacity census over 17.5s): the clone cycles Spring →
     Tech → Home at the same ~5s cadence as the reference — earlier
     "stuck" readings were probe artifacts (`querySelector("h1")` always
     returns the FIRST slide's h1; the dot probe matched the prev/next
     buttons).
   - **Reference drift watch:** the typeahead still fires ZERO requests on
     the reference; the clone's fires on open + type (superset, working).
     Content censuses identical on account/shop/PDP/cart (the account's
     Phone field exists on both sites).
   - **Pixel diffs @1024:** ELEVATED vs the session-10 baseline (home 1.62
     / shop 2.50 / PDP 4.81 / account 1.81 / cart 2.46 / login 0.90%) —
     which became the round's biggest investigation (below). An initial
     17.6% account diff was an audit artifact (storageState cookie signed
     with the E2E server's AUTH_SECRET, rejected by the audit server's
     guest gate — re-measured after a fresh login).
   - **Findings (3, each with live-measured evidence from BOTH sites):**
     - **A11Y-FOCUS-1:** the clone's all-slides-in-DOM hero carousel keeps
       the inactive slides' CTA links in the TAB ORDER — `aria-hidden`
       does not remove descendants from tab focus. Live-measured: Tab from
       the active CTA lands on the invisible "Explore"/"Browse" anchors;
       the reference (DOM-swap) has exactly one CTA at a time. A WCAG
       2.4.3 defect and a tab-order divergence.
     - **FONT-SMOOTH-1 (trap 12):** the clone's body computed
       `-webkit-font-smoothing: antialiased` (the shadcn v4 starter
       default, present since the first port) while the reference computes
       `auto` (subpixel LCD AA). Invisible to content/computed-font
       censuses AND to headless pixel diffs (headless Chromium cannot do
       subpixel AA) — manifests only in real browsers.
     - **FONT-FILE-1 (trap 13, found during F2's remediation):** after the
       smoothing fix the elevated text-band pixel diffs SURVIVED, forcing
       a font-file investigation. The reference serves Google's
       `plusjakartasans/v12` variable woff2 (27,348 B — an initial
       "kartasans" reading was a 55-char URL-slice artifact); fontTools
       proved the clone's next/font copy byte-identical on hmtx/glyf/
       GPOS/GSUB/GDEF/gvar/HVAR/MVAR — but with NO `prep` table (the
       TrueType hinting pre-program, stripped by next/font's subsetting).
       Canvas metrics: 1009px (ref) vs 1013px (clone); the VLM described
       "a halo around the letters" on every text element of the diff
       overlay while the side-by-side comparison found "no other visual
       differences".
4. **Remediation plan** (`docs/remediation-plan-session11.md`): findings +
   evidence + validated seams + TDD plan + sign-off criteria; checked off
   after execution (F3 appended when it surfaced during remediation).
5. **TDD RED:** 3 new E2E tests in `storefront-parity.spec.ts` — the hero
   tab-order proof (focus the active CTA, Tab, assert the next stop is the
   prev-arrow BUTTON, never an anchor inside an aria-hidden slide), the
   body-smoothing pin (`auto`), and the font-file contract (exactly one
   loaded face, the reference's exact stack, canvas 1009±2px, the 27,348-
   byte file served). All failed for the right reasons (`inHiddenSlide:
   true`; `antialiased`; fallback face + padded stack + 1013 + 404).
6. **TDD GREEN:**
   - T1 (A11Y-FOCUS-1): `inert={i !== index}` on both inactive slide
     containers in `hero-carousel.tsx` (media slide + text block).
   - T2 (FONT-SMOOTH-1): `antialiased` removed from the body `@apply` and
     the layout body className.
   - T3 (FONT-FILE-1): the reference's exact woff2 self-hosted at
     `public/fonts/plus-jakarta-sans.woff2` + a plain `@font-face`
     (family "Plus Jakarta Sans", `font-weight: 200 800`, `display:
     swap`); `--font-sans: "Plus Jakarta Sans", sans-serif` (the
     reference's exact computed stack); the next/font import/variable
     removed from the root layout.
7. **Gate at ship:** lint 0/0 · tsc clean · 88/88 unit · build exit 0 (23
   routes) · **141/141 E2E = 229 total** (was 226; +3 E2E, none removed) —
   **two consecutive full runs** for determinism.
8. **Live re-verification** (`scripts/verify-session11.ts`): **14/14
   green** — smoothing `auto` on 4 routes + zero `antialiased` rules in
   the served CSS; the tab order (next stop = prev-arrow; walk Previous →
   Next → dots 1-3 → section content); the inert census (6/6 slide
   containers); the hero/body pins intact; the font contract (single face
   `Plus Jakarta Sans 200 800`, exact stack, canvas 1009, file served
   27,348 B).
9. **Pixel re-diff:** **collapsed to the session-10 baseline** — home 0.31
   / shop 0.34 / PDP 0.60 / account 0.31 / cart 0.31 / login 0.23% (from
   1.62 / 2.50 / 4.81 / 1.81 / 2.46 / 0.90).
10. **Screenshots:** 6 new (64–69, captured by the persisted
    `scripts/capture-session11.ts` — 64–67 the typography-parity surfaces,
    68 the tab-order proof with the focus ring on the hero prev-arrow, 69
    the 11th mobile-nav verification; VLM-verified 6/6 from the scratch
    dir — the one initial "FAIL" on 64 was a description error, the
    reference's Shop Now button is orange, not white) → 69 total.
    `.env.example` verified current (the font is a static asset — no new
    env plumbing).
11. **Docs:** AGENTS.md (traps 12 + 13, the hero-inert contract, the
    self-hosted-font convention), CLAUDE.md (session-11 contracts, 141
    E2E), README.md (229 tests, 11th mobile-nav verification, the new
    parity gates), PAD v1.11 (ADR-019, test matrix, 2 Resolved rows),
    SKILL v1.11.0 (L16–L17, 3 new pitfalls), this session log, the
    worklog.

## Key decisions

- **Font parity is FILE parity** — the only way to guarantee identical
  rasterization is to serve the reference's exact bytes; advance widths
  are byte-identical between the two files, so the swap is layout-neutral
  by construction (no reflow possible, no geometry spec can shift). The
  committed 27 KB binary becomes a standing drift-watch item.
- **The smoothing fix stands on its own even though headless pixel diffs
  cannot see it** — the computed contract is what is pinned (`auto` on
  both sites); real-browser rendering follows the engine.
- **`inert` over `tabIndex={-1}`** — inert covers the whole subtree (any
  future focusable inside an inactive slide is covered) and matches the
  reference's DOM-swap observable even in the auto-advance edge case
  (focus falls to body both ways).
- **Probe lessons recorded** (session_19's style): `querySelector("h1")`
  samples the FIRST slide's h1 on an all-slides-in-DOM carousel —
  rotation must be measured via the slide containers' aria-hidden/opacity
  state; 55-char URL slices can turn `plusjakartasans` into `kartasans`.

`docs/remediation-plan-session11.md` records the full audit trail.

## Suggested next steps

Round-12 candidates: a full Lighthouse/axe accessibility pass (the a11y
tree is now differential-audited; automate the regression watch), admin
order filtering/search, a print stylesheet parity decision (both sites
currently print-unstyled — a superset opportunity, not a parity gap),
wiring a real email provider to activate the ADR-011 verification gate,
or Stripe Payment Element (ADR-007's documented next step). Tell me which
to pick up and I'll start the next round.
