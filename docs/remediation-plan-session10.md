# Remediation Plan — Session 10 Review (Round-10 Differential Audit)

**Date:** 2026-10-08
**Repo:** `nordeim/ecommerce-store` (branch `main`, baseline `e150118` — the
session-9 ship state `56262f7` plus the remotely-added `docs/session_17.md`
log)
**Author:** Review/build agent (Super Z)
**Scope:** Live differential audit (round 10) of the LUXE Store clone against
the reference (`fuzzy-lumina-style-hub.base44.app`). Nine prior rounds closed
the catalog, cart, checkout, auth, account, PDP, admin, computed-geometry and
mobile-geometry + social-metadata gaps (224-test gate). Round 10 targets:
(a) the standing user priorities — mobile navigation (10th verification,
Tailwind v4 watch) and reference drift on pinned surfaces; (b) **the tablet
viewport band (639/640/768/1024 px)** — never audited before, and trap 9's
lesson ("desktop computed parity does not prove mobile parity") applies with
equal force to the `sm:`/`md:`/`lg:` flip points; (c) **interaction-state
parity** — focus and hover styling (never audited; sessions 1–9 pinned only
resting states); (d) a **text-metric census** (fontSize/line-height digests
per route) to catch any remaining v3↔v4 engine-level metric drift. The
`skills/` folder is excluded from code checking, testing and compilation per
the operating contract.

**Method:** Baseline gate (224/224 green, exactly the documented session-9
ship state) → agent-browser sessions (`ref` = production reference logged in
as the operator account, `clone` = production standalone server on :3000
running the current build; dev server avoided per the session-9 OOM lesson)
with DOM / computed styles as ground truth; breakpoint-flip probes at
639/640/768/1024 on shop grid, profile grid, order rows, PDP layout, hero,
auth card; per-route text-metric digests; focus-state probes (programmatic +
real Tab); hover probes under a **touch-emulated context**
(`matchMedia('(hover:hover)')` false — the decisive condition); paired
screenshot pixel-diffs at 1024 and 768 across the key routes. Every finding
carries live-measured evidence from both sites.

---

## 1. Baseline verification (state at audit start)

| Gate | Result |
|---|---|
| `bun run lint` | 0 errors, 0 warnings |
| `bun run typecheck` | clean |
| `bun run test` (Vitest) | 88/88 passed |
| `bun run build` | exit 0, 23 routes |
| `bun run test:e2e` (Playwright) | 136/136 passed (224 total) |
| DB contract | `db/custom.db` at repo root; hard-link convergence live (inode 303519); canonical state (12 products / 3 demo orders / 3 users; cart + wishlist empty) |
| Docs | AGENTS/CLAUDE/README/PAD v1.9/SKILL v1.9.0 all current through session-9 (224-test gate) |

## 2. Audit results

### Verified at parity this round (no action required)

- **Mobile navigation menu (10th standing verification):** iPhone 14 on both
  sites: the Sheet panel class string is byte-identical
  (`fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out …
  inset-y-0 left-0 h-full border-r … w-72 sm:max-w-sm`), pad 24px, gap 16px,
  bg `rgb(251, 250, 249)`, all 5 links byte-identical (text + hrefs incl. the
  category deep-links) at 239×44, 18px/500, `display:block`.
  **No Tailwind v4 regression (10th consecutive).**
- **Tablet viewport band (the round's primary new surface):** at 639 / 640 /
  768 / 1024 px — shop product grid columns (1→2→3→3→4 col flips at the same
  widths with identical card widths: 181/181/224/224/226px); account profile
  fields grid (`grid-cols-1 sm:grid-cols-2 gap-4` — 1 col at 639, 2 cols at
  640+; Save button 127px fit-content `mt-16px` parent-DIV/FORM flow child at
  every width); account Orders rows (`flex-col sm:flex-row` — column stacked
  at 639, row at 640+; identical row widths 557/542/670/926px); PDP layout
  (single-column through 768, side-by-side only at 1024; img 607/592/720/456px,
  h1 24→30px at 640); auth card (448px, h1 30/36 at every width); header
  (hamburger + hidden nav links at 768 on both; nav engages at ≥ the same
  breakpoint).
- **Text-metric census (fontSize/line-height digests):** home / shop / PDP /
  account — the (fs, lh) multisets are IDENTICAL on both sites except the
  hero h1 finding below (the only true drift: `48px/48px` vs `48px/60px`;
  the +2/+3 count deltas on home are the clone's all-slides-in-DOM
  structure, an expected, invisible difference — the inactive slides are
  `opacity-0`).
- **Focus states:** ref and clone use the same machinery — the same
  shadcn-style `focus-visible:ring-1 focus-visible:ring-ring` classes on
  styled Buttons (verified by reading the ref's live class strings), a 1px
  #e66b1a ring on form controls (identical computed box-shadow chains; the
  0px-spread offset layer is invisible on both), the same global
  `outline-color: ring/50` base-layer rule on both (the ref keeps it as
  `--ring: 24 80% 50%`, the clone as `--color-ring: hsl(24 80% 50%)` — the
  v4 CSS-first spelling of the same token), and unstyled elements (carousel
  dots on both) riding the UA default outline tinted by that rule. The
  apparent gaps in the first probes (programmatic-focus artifacts + a
  style-recalc race in the measurement) were re-measured and dismissed.
- **Search typeahead (reference drift watch):** the reference's typeahead
  still fires ZERO network requests on input (verified by monkey-patching
  fetch/XHR and typing) — gone since session-9. The clone's live typeahead
  remains the registered superset; submit flows match.
- **Placeholders:** search input `::placeholder` = `rgb(111, 111, 123)` / 400
  on both sites.
- **Pixel-diffs:** desktop 1024 — shop 0.29%, PDP 0.54%, account 0.29%
  (sub-threshold); home 2.58% = the documented hero-slide timing divergence
  (the carousel renders different active slides at capture time; slide copy,
  order, cycle and per-slide geometry verified identical). Tablet 768 — shop
  0.39%, PDP 0.39%, account 0.40%, cart 0.40%, login 0.27% — all
  sub-threshold.

### Findings (2, each with live-measured evidence from BOTH sites)

#### F1 — HOVER-GATE-1 · Tailwind v4 gates every hover-family variant behind `@media (hover: hover)` (trap 11)

The reference app (Tailwind v3) emits `:hover` rules **unconditionally**: any
context where an element matches `:hover` — including touch/hybrid devices
and emulated mobile contexts — renders the hover styling. The clone (Tailwind
v4.3.3) emits its hover-family utilities (plain `hover:*`, `group-hover:*`,
and breakpoint-compounds like `lg:hover:*`) **wrapped in
`@media (hover: hover)`**, so they are inert whenever the pointer cannot
hover.

**Live A/B evidence (both sessions set to a touch-emulated context where
`matchMedia('(hover: hover)').matches === false`):**

| Probe | Reference (v3) | Clone (v4.3.3) |
|---|---|---|
| Header `Home` nav link hovered (`hover:text-foreground`) | `:hover` matches → color `rgb(23, 23, 28)` (effect APPLIES) | `:hover` matches → color stays `rgb(111, 111, 123)` (effect DEAD) |
| Product card hovered (`group-hover:scale-105` + `group-hover:text-primary`) | img `matrix(1.05, …)`, hovered h3 `rgb(230, 107, 26)` (APPLIES) | img `transform: none`, h3 stays `rgb(23, 23, 28)` (DEAD) |
| Emitted CSS | plain `:hover` rules (v3) | `@media (hover: hover) { … }` blocks wrapping the `group-hover:*` / compound rules (verified in the served stylesheet; the minified single-line CSS hides the wrapper from naive greps) |

**Blast radius (live `group-hover:` sites, 7):** header nav underline
(`group-hover:w-full`), product-card image scale (`group-hover:scale-105`),
product-card quick-add slide (`group-hover:translate-y-0`), product-card
title color (`group-hover:text-primary`), category-card icon bg + color
(`group-hover:bg-primary/10` + `group-hover:text-primary`), home section CTA
arrow (`group-hover:translate-x-1`) — plus every plain `hover:*` utility in
the chrome (buttons, links, footer, steppers). On desktop with a mouse,
`(hover: hover)` matches and everything works — the gap is invisible to
desktop-only audits (the reason nine rounds missed it).

**Root cause (Tailwind 4.3.3 source, `dist/lib.mjs`):** the default `hover`
variant is registered as
`static("hover", c => { c.nodes = ["&:hover", ["@media", "(hover: hover)", c.nodes]] })`
— the media wrapper is part of the variant itself, and the `group-hover`
compound composes on top of it. This is an intentional v4 a11y default
(avoid sticky hover states on touch) but it is **not the reference's engine
behavior**, and this repo's contract is v3 visual semantics delivered on v4
via pins.

**Fix:** override the variant in `src/app/globals.css` next to the existing
`@custom-variant dark`:

```css
@custom-variant hover (&:hover);
```

One line restores v3 semantics for the entire hover family: plain `hover:*`
becomes a bare `&:hover`, and `group-hover:*` (the compound of `group` +
`hover`) composes without the media wrapper while keeping v4's own selector
shape (`&:is(:where(.group):hover *)`). No component file changes; no theme
token changes; the resting visual is untouched (hover states only render
while an element is actually hovered).

#### F2 — HERO-LH-1 · the hero h1 line-height rides the v3 cascade that v4 changed (trap 10)

The hero h1 carries `text-3xl sm:text-4xl lg:text-5xl font-bold text-white
mb-3 leading-tight` — **a byte-identical class string on both sites** (read
live from the reference DOM) — but renders different line-heights:

| Viewport | Ref fs/lh | Clone fs/lh |
|---|---|---|
| < 640 (text-3xl, 30px) | 30 / **37.5** (leading-tight wins) | 30 / 37.5 ✓ |
| ≥ 640 (sm:text-4xl, 36px) | 36 / **40** (the responsive rule's own line-height re-wins) | 36 / **45** ✗ |
| ≥ 1024 (lg:text-5xl, 48px) | 48 / **48** (same) | 48 / **60** ✗ |

**Root cause (v3↔v4 cascade, trap 10):** in v3, responsive variants are
emitted in their media-query layers AFTER all base utilities, so
`sm:text-4xl` / `lg:text-5xl` (which carry their own line-heights — 2.5rem /
1) **re-override** the base `leading-tight` at ≥640/≥1024; only below 640
does `leading-tight` (1.25) beat `text-3xl`'s default (36px → 37.5px). In
v4's sort order the base `leading-*` utility wins at every width, so the
clone keeps 1.25 (45/60px). Measured consequence: every slide's text block
is +12px taller (the 2-line Spring Collection slide +24px: 268 vs 244px) —
the slides are absolutely positioned and vertically centered inside the
`h-[50vh] sm:h-[55vh] lg:h-[65vh]` container, so the block grows
symmetrically and the drift is subtle at rest, but the h1's box and the
block's centered position measurably differ from the reference on every
slide at ≥640px. This is the same class of engine drift as trap 8
(`space-y` margins) — identical classes, different cascade.

**Fix:** pin the responsive line-heights explicitly on the clone's h1
(`src/components/store/hero-carousel.tsx:95`):

```
text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight sm:leading-[2.5rem] lg:leading-none
```

- base: `leading-tight` → 37.5px (unchanged, already matches)
- `sm:leading-[2.5rem]` → 40px = exactly v3/v4's own 4xl companion value
- `lg:leading-none` → 48px = exactly v3/v4's own 5xl companion value (1)

The arbitrary value is a parity pin in the family of `w-[150px]` (session-9)
and `h-[50vh]` — pinned by a spec, not guesswork.

## 3. TDD plan

**RED (new failing tests):**

1. `tests/e2e/storefront-parity.spec.ts` — "hero h1 line-height follows the
   reference's v3 cascade (trap 10)": at 1024 → `line-height: 48px`; at 768
   → `40px`; at 630 → `37.5px` (three viewport flips against the live h1).
2. `tests/e2e/storefront-parity.spec.ts` — "hover effects are not
   media-gated (trap 11)": a fresh **iPhone 14 context** (mobile emulation
   makes `(hover: hover)` false, the decisive condition), hover the first
   product card via real mouse events, assert the card image's computed
   transform is `matrix(1.05, 0, 0, 1.05, 0, 0)` and the hovered title
   flips to `rgb(230, 107, 26)` — the exact live-measured reference values.

**GREEN:**

- T1 (HOVER-GATE-1): add `@custom-variant hover (&:hover);` to
  `src/app/globals.css` (one line; no component changes).
- T2 (HERO-LH-1): add `sm:leading-[2.5rem] lg:leading-none` to the hero h1
  class string with the trap-10 comment.

**Regression safety:** the hover un-gate only makes rules apply in MORE
contexts (they already applied whenever `(hover: hover)` matched); the
resting visual is untouched. The hero pin changes only the h1's line box
toward the reference's measured values. Neither touches a pinned trap from
sessions 1–9; the full 224-test gate re-runs green plus the 2 new tests.

## 4. Sign-off criteria

- [x] Baseline gate green at audit start (224/224, exactly the documented ship state)
- [x] Round-10 audit complete: mobile nav 10th verification byte-exact; tablet band, text-metric census, focus states, placeholders, typeahead drift all verified
- [x] Findings live-measured on BOTH sites with root causes traced to the engine (v4.3.3 source for trap 11, v3 media-layer cascade for trap 10)
- [x] RED tests written and confirmed failing for the right reasons (60px/45px line-heights; `transform: none` in the touch context)
- [x] GREEN: one CSS line + one class-string pin; unit layer unaffected (no new unit seams — both fixes are CSS-level, pinned at the E2E layer)
- [x] Full gate green: lint 0/0 · typecheck clean · 88/88 unit · build 23 routes · 138/138 E2E (226 total)
- [x] Live re-verification against the production server (line-heights at 3 widths; hover matrix + title color in the touch context)
- [x] Pixel re-diffs of the affected routes sub-threshold; hero band reduced
- [x] Screenshots captured + VLM-verified under `docs/screenshots/`
- [x] Docs updated: AGENTS.md (traps 10–11), CLAUDE.md, README.md, PAD v1.10 (ADR-018), SKILL v1.10.0, session log, worklog
- [x] `.env.example` verified current (no new env plumbing)
- [x] Committed on `main` and pushed via the SSH wrapper
