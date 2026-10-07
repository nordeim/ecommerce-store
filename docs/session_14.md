# Session 14 Log — Round-8 Differential Audit + Remediation

**Date:** 2026-10-08 · **Agent:** Super Z (review/build) · **Branch:** `main`
**Baseline:** `272c804` (session-7 work complete + session_13.md log)

## Timeline

1. Workspace had been reset — fresh `git clone` (2823 files). Reviewed all
   root docs + `docs/session_12.md` + `docs/remediation-plan-session7.md` +
   `worklog.md` + `docs/session_13.md` — everything current through
   session-7 (PAD v1.7, SKILL v1.7.0, 194-test gate).
2. Environment setup: `.env` (`DATABASE_URL="file:../db/custom.db"`), the
   sandbox env-shadowing trap re-converged via hard link (injected
   `/home/z/my-project/db/custom.db` ↔ repo `db/custom.db`, inode 303519),
   `bun install`, `db:setup` (12 products / 3 demo orders / 3 users).
3. **Baseline gate:** lint 0/0 · tsc clean · 76/76 unit · build exit 0 (22
   routes) · 118/118 E2E — exactly the documented session-7 ship state
   (194 total). Reviewed the scandihaven reference repo's skills catalog
   (clone-app-pat-pro, agent-browser, tdd, tailwind-patterns) and the
   repo's own `skills/nextjs16-tailwind4` mobile-nav debugging taxonomy
   before the audit.
4. **Round-8 live A/B audit** (agent-browser sessions `ref` + `clone`,
   iPhone 14 + 1440×900, paired screenshots + pixel diffs on 15 routes):
   - **Mobile nav (8th standing verification):** overlay 288×844 @ (0,0),
     nav `flex flex-col gap-4 mt-8`, 5 byte-identical links — parity
     holds; **no Tailwind v4 regression**. Menu-stays-open reference
     quirk re-confirmed; clone navigates + auto-closes (registered
     divergence). A UI-driven sort re-check proved the shop order
     semantics still match (the `?sort=` pixel diff is the documented
     URL-deep-link superset).
   - **Drift re-check:** home structure, catalog (all 12 products
     byte-identical), shop cards/selects, PDP image/buy-panel/tabs,
     drawer, account tabs/addresses, 404 body, wishlist/cart/checkout
     empty states — all at parity.
   - **Findings (8):** SPACE-Y-INLINE-1 (v4 trap: `space-y-*` margin
     inert on inline `<label>` first children — auth forms lost 8px per
     field; register card 490 vs 514px), SPACE-TABS-1 (account Tabs
     32px vs 24px), LABEL-BLOCK-1 (profile form labels block+mb-2 vs
     the reference's inline + input mt-6px), STAR-RATE-1 (PDP star row:
     track/overlay + round-up + gap-0.5 vs flat floor() + gap-1),
     BREADCRUMB-1 (PDP breadcrumb gap-1.5/mb-6 vs gap-2/mb-8 — an 8px
     page-wide cascade), ICON-DRIFT-1 (feature bar + PDP row:
     shield-check/refresh-cw vs shield/rotate-ccw), TITLE-404-1
     (unknown routes titled "Lumina" vs the reference's humanized-path
     rule — decoded across 12 live probes), SEARCH-CASE-1 (typeahead
     category casing).
5. Wrote `docs/remediation-plan-session8.md` (issue inventory with
   live-measured evidence from both sites, dependency sweeps —
   StarRating's single callsite, no spec pins on the affected geometry,
   catch-all route-conflict analysis, the rejected global space-y
   override with its blast-radius reasoning) and validated every seam
   against the codebase.
6. **TDD RED:** 6 new unit tests (5 failing — `notFoundPageTitle` absent,
   underscore split absent) + 10 new E2E assertions (all failing with
   the drifted values in the error messages: gap 3px, panel 32px,
   display "block", margin 0px, star gap 2px/10 svgs/5 amber, breadcrumb
   24px, wrong icon classes, title "Lumina", capitalized category).
7. **TDD GREEN:** `mt-2` on the five auth input wrappers (SPACE-Y-INLINE-1,
   trap #8 documented); account Tabs root drops `space-y-6` (SPACE-TABS-1
   — deeper than planned: the TabsContent base `mt-6` stacked to 48px
   with the naive fix; base alone supplies the reference's 24px);
   profile labels → inline + `Input mt-1.5` (LABEL-BLOCK-1); star-rating
   rewritten flat/floor (STAR-RATE-1); breadcrumb `gap-2 mb-8` (BREADCRUMB-1);
   `Shield`/`RotateCcw` swaps (ICON-DRIFT-1); `[...notFound]` catch-all +
   shared `Platform404` + `notFoundPageTitle()` + `humanizeSlug` `[-_]`
   split (TITLE-404-1, routes 22→23); typeahead category lowercase
   (SEARCH-CASE-1).
8. **ACCOUNT-BTN-1 (found during the post-fix pixel diff):** the profile
   Save button's `mt-4` stacked with the form grid's `gap-4` (32px vs the
   reference's 16px, pushing the card + footer 16px low) — `mt-4` dropped
   and pinned by a new spec test.
9. **Full suite green: 82 unit + 128 E2E = 210 total** (was 194; +6 unit,
   +10 E2E, none removed). Run three times post-fix (127/127 ×2, then
   128/128 ×2 after the button pin) — determinism proven.
10. **Live re-verification** (`scripts/verify-session8.ts`): **14/14
    green** — every fixed surface re-measured against the same live
    reference values, including the 8th mobile-nav standing verification.
    Pixel-diff deltas: register 2.89%→0.17%, login 1.79%→0.17%, forgot
    1.32%→0.07%, PDP 8.71%→0.48%, PDP-serum 12.17%→0.70%, account
    31.7%→0.23% (remaining bands: hero-slide snapshot timing +
    sub-threshold font antialiasing; cart/checkout/sort diffs are the
    documented superset divergences).
11. **Screenshots:** 6 new (46-pdp-star-row-parity, 47-register-field-
    spacing, 48-404-humanized-title, 49-account-profile-geometry,
    50-feature-bar-glyphs, 51-mobile-nav-8th-verification — VLM-verified
    6/6 PASS; the VLM harness ran from a scratch dir so the pruned
    z-ai-web-dev-sdk dependency never re-enters the repo) → 51 total.
12. **Docs:** AGENTS.md (trap log #8 with all three faces + the PDP visual
    + 404-title contracts), CLAUDE.md (210 counts, session-8 contracts,
    23 routes, the catch-all), README.md (210 tests, enriched feature +
    testing rows), PAD v1.8 (ADR-016 full record, §8.1 24-file/210-test
    table, §8.4 checklist, §11 three Resolved rows), SKILL.md (bug row
    30, ADR index through 016, quick-reference rows), plan checked off
    with outcome notes, this session log. `.env.example` verified current
    (no new env plumbing — all four vars match `process.env` usage).

## Result

- **9 findings closed:** SPACE-Y-INLINE-1 (trap #8 — the v4
  `space-y`/inline-label engine trap, fixed surgically), SPACE-TABS-1,
  LABEL-BLOCK-1, ACCOUNT-BTN-1 (found during GREEN), STAR-RATE-1,
  BREADCRUMB-1, ICON-DRIFT-1, TITLE-404-1, SEARCH-CASE-1.
- **Gate at ship:** lint 0/0 · tsc clean · 82/82 unit · build OK (23
  routes) · **128/128 E2E = 210 total** (was 194; deterministic across
  consecutive runs).
- The clone's form-field geometry now sits at computed parity with the
  reference on every auth/account/PDP surface; unknown routes title
  themselves exactly like the reference's SPA; the trap log grew by the
  most subtle v4 engine trap yet documented.
- `docs/remediation-plan-session8.md` records the full audit trail.

## Suggested next steps

Round-9 candidates: wire a real email provider to activate the
verification gate (ADR-011), Stripe Payment Element (ADR-007's documented
next step), or admin order filtering/search. Tell me which to pick up and
I'll start the next round.
