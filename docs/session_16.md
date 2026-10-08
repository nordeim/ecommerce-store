# Session 16 Log — Round-9 Differential Audit + Remediation

**Date:** 2026-10-08 · **Agent:** Super Z (review/build) · **Branch:** `main`
**Baseline:** `d8a5677` (session-8 ship `7744390` + the remotely-added `docs/session_15.md`)

## Timeline

1. `git pull` brought `docs/session_15.md`; reviewed all root docs +
   `docs/session_14.md` + `docs/remediation-plan-session8.md` + `worklog.md`
   — everything current through session-8 (PAD v1.8, SKILL v1.8.0, the
   210-test gate). Environment intact (`.env` with
   `DATABASE_URL="file:../db/custom.db"`, `db/` at repo root, hard-link
   convergence still live).
2. **Baseline gate:** lint 0/0 · tsc clean · 82/82 unit · build exit 0 (23
   routes) · 128/128 E2E = 210 — exactly the documented session-8 ship
   state.
3. **Round-9 live A/B audit** (agent-browser sessions `ref` + `clone`):
   - Tooling notes: the agent-browser element-locator injection triggers a
     React **hydration mismatch** on client-island pages (it stamps
     `data-agent-browser-located` before React adopts the DOM → React
     remounts and wipes filled forms — a tool artifact, not a codebase
     bug; E2E stayed green throughout). Interactive flows were driven
     via `eval` only, and auth state was loaded by **minting a session
     cookie directly** (login POST is rate-limited 10/IP/15min — the
     audit burned several attempts before switching). Dev-server OOM
     kills (2 GB RSS in the 4 GB sandbox) during full-page mobile
     captures → capture runs moved to the **production standalone
     server** (and the final gate re-run in this continuation killed
     `next dev` first).
   - **Mobile nav (9th standing verification):** iPhone 14 both sites —
     overlay `[role=dialog]` 288×844 @ (0,0), nav wrapper
     `flex flex-col gap-4 mt-8`, all 5 links byte-identical.
     **No Tailwind v4 regression.**
   - **First deep mobile sweep (7 routes):** m-home 0.71%, m-shop 0.82%,
     m-pdp 0.87%, m-cart 0.67% (after `prisma/dev-cleanup.ts` cleared a
     leftover cart item — the DB, not the UI, was drifted), m-login
     0.51%, m-wishlist 0.72%, m-account **2.87%** → finding below.
   - **Desktop re-verification:** all 15 routes ≤ 0.68% except the
     documented divergences (shop-sort 34% URL-deep-link superset; home
     1.89% hero-carousel slide timing — the slide ORDER, initial resting
     slide, and arrow/dot chrome were re-verified identical; an early
     "hero arrows dead" reading was a measurement artifact — the
     active-slide opacity proved the arrows work).
   - **Search:** the reference's live typeahead no longer renders (no
     XHR, no dropdown, real key events, fresh login) — the reference app
     itself changed since the session-8 measurement; the clone's
     typeahead remains the registered superset. The submit flow
     (icon → bar → query → `/shop?search=q`) is identical.
   - **Admin:** the reference has NO admin routes (all 404) — the
     clone's console remains the registered superset.
   - **Findings (4):** ACCOUNT-BTN-W-1 (profile Save button 308px
     full-width on mobile vs the reference's 127px fit-content —
     session-8's in-grid `sm:col-span-2 sm:w-fit` button passed
     desktop-only audits), METADATA-OG-1 (the reference renders a full
     OpenGraph/Twitter/PWA head set on every route — decoded across 10
     live probes incl. the query-preserving og:url and the PDP's
     card-less twitter shape — the clone had none of it),
     ACCOUNT-ORDER-ROW-1 (bordered hover rows + emerald/amber chips +
     12px gaps vs the reference's tinted border-less pill-badge rows at
     16px, stacking on mobile), SORT-W-1 (sort trigger 170px vs 150px —
     the single drift in a global arbitrary-width sweep).
4. Wrote `docs/remediation-plan-session9.md` (findings with live-measured
   evidence from both sites, seams validated against the codebase, TDD
   plan, sign-off criteria).
5. **TDD RED:** 6 unit tests (`metadata.test.ts` — module absent) + 8
   E2E tests (account mobile describe, order-row anatomy, sort width,
   smoke head-metas) — all failing for the right reasons (308px, 170px,
   bordered row, no og tags).
6. **TDD GREEN:**
   - T1 ACCOUNT-BTN-W-1: the profile form restructured to the
     reference's anatomy — fields grid + the Save button OUTSIDE it as a
     flow child with `mt-4` (fit-content every viewport; **trap #9**
     enters the log: grid items stretch by default, `sm:w-fit` only
     engages ≥640px, and grid `gap-4` COINCIDES with flow spacing on
     desktop — desktop computed parity does not prove mobile parity).
   - T2 SORT-W-1: `w-[150px]`.
   - T3 ACCOUNT-ORDER-ROW-1: reference row anatomy ported
     (`bg-secondary/30` tint, no border, `rounded-full` pill badges,
     `font-semibold` number / `font-bold` total, `space-y-4` container,
     mobile stacking; `STATUS_STYLES` remapped to the two measured
     variants).
   - T4 METADATA-OG-1: new `src/lib/metadata.ts` (`SITE_DESCRIPTION`,
     `OG_IMAGE_URL`, `pageMetadata()` builder) applied to home (bare
     "Lumina", plain description), shop (`generateMetadata` preserving
     the query in og:url), cart, wishlist, account, checkout, success,
     login, register, forgot-password, verify-email, PDP (plain
     description, humanized-slug og:title, LOGO og:image), and the
     `[...notFound]` catch-all; root layout gains the SITE_DESC
     description + `appleWebApp` PWA metas. **Three Next-engine
     constraints discovered en route** (each verified against the
     resolver source and confirmed empirically): the twitter resolver
     force-defaults `twitter:card` when the typed twitter field carries
     images; `appleWebApp.capable` auto-emits `mobile-web-app-capable`
     (hand-emitting a duplicate via `other` produced a doubled tag);
     the PDP's card-less shape (twitter title/description/image with
     NEITHER card NOR url) is inexpressible via the Metadata API — the
     PDP page body carries **React-19-hoisted `<meta name="twitter:…">`
     elements** (the only route needing the exception; `twitter:url`
     rides in `other` everywhere).
7. **Full suite green: 88 unit + 136 E2E = 224 total** (was 210; +6 unit,
   +8 E2E, none removed). Two consecutive 136/136 runs in the working
   session; the continuation session re-ran the whole gate clean (lint
   0/0 · tsc clean · 88/88 · build OK · 136/136 in 3.9m after stopping
   `next dev` — dev + E2E + captures together exceed the 4 GB sandbox).
8. **Live re-verification** (`scripts/verify-session9.ts`): **12/12
   green** — Save button 127px @ iPhone 14, sort trigger 150px, order
   row geometry/badges/weights/gaps, and the head metas on 5 routes,
   all matching the reference values.
9. **Pixel re-diffs:** account 0.21%, m-account **0.65%** (was 2.87%),
   shop 0.24%, m-shop 0.71% — the mobile band gone.
10. **Screenshots:** 6 new (52-account-profile-form-flow-button,
    53-account-orders-reference-anatomy, 54-shop-filter-row-150px,
    55-mobile-account-fit-content-save, 56-mobile-orders-stacked-rows,
    57-pdp-remediated — captured by the persisted
    `scripts/capture-session9.ts`, with 57 as a FULL-PAGE mobile shot
    (the PDP runs past the 844px fold); VLM-verified **6/6 PASS** from
    the scratch-dir harness) → 57 total.
11. **Docs:** AGENTS.md (trap log #9 + the metadata-layer/engine contract
    bullet + trap 8's third-face correction), CLAUDE.md (session-9
    contracts incl. the corrected account geometry, order-row anatomy,
    metadata layer, 88/136 counts), README.md (224 tests, the SEO row
    upgraded to the full head layer, 9th mobile-nav verification), PAD
    v1.9 (ADR-017, §8.1 25-file/224-test matrix, §8.4 checklist, §11
    four Resolved rows), SKILL.md v1.9.0 (pitfalls 31-32, doc
    references), plan checked off, this session log, `worklog.md`.
    `.env.example` verified current (`NEXT_PUBLIC_SITE_URL` already
    documented — the metadata layer adds no new env plumbing).
12. Hygiene: one-off reference-probe scripts removed (kept
    `verify-session9.ts` + `capture-session9.ts` per repo convention);
    commit + SSH push via `docs/ssh_git_wrapper_v3.py` to
    `git@github.com:nordeim/ecommerce-store.git` (main).

## Result

- **4 findings closed:** ACCOUNT-BTN-W-1 (trap #9 — the mobile
  grid-stretch break), METADATA-OG-1 (the complete social/PWA head
  layer, unit + E2E pinned), ACCOUNT-ORDER-ROW-1 (reference row
  anatomy), SORT-W-1.
- **Gate at ship:** lint 0/0 · tsc clean · 88/88 unit · build OK (23
  routes) · **136/136 E2E = 224 total** (was 210; re-confirmed clean in
  the continuation session).
- Every route now carries the reference's OpenGraph/Twitter/PWA head
  set (link previews, SEO, PWA metas); the mobile account surface sits
  at pixel parity; the Orders tab matches the reference's visual
  language; mobile nav holds at byte-exact parity across 9 consecutive
  verifications.
- `docs/remediation-plan-session9.md` records the full audit trail.

## Suggested next steps

Round-10 candidates: wire a real email provider to activate the
verification gate (ADR-011), Stripe Payment Element (ADR-007's
documented next step), admin order filtering/search, or a
performance/accessibility audit pass (Lighthouse, axe) on the parity
surfaces. Tell me which to pick up and I'll start the next round.
