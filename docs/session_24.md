# Session 24 Log — Round-13 Core Web Vitals Differential + Admin Order Filters

**Date:** 2026-10-08 · **Agent:** Super Z (review/build) · **Branch:** `main`
**Baseline:** `e736d4a` (the session-12 ship `10a535c` + the
remotely-added `docs/session_23.md` narrative)

## Timeline

1. `git pull` brought `docs/session_23.md` (the session-12 round
   narrative, added remotely); reviewed all root docs +
   `docs/session_22.md` + `docs/remediation-plan-session12.md` +
   `worklog.md` — everything current through session-12 (PAD v1.12,
   SKILL v1.12.0, the 233-test gate, 13 traps). Environment intact:
   `.env` `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root,
   hard-link convergence live at inode 303519 (the injected sandbox
   `DATABASE_URL` still shadows the repo value — the documented, pinned
   sandbox contract); the four session-12 fixes verified in code (the
   nameless toast region, `role="img"` rating row, zero nested
   `<main>`, the `headers()` block in next.config.ts).
2. **Baseline gate:** lint 0/0 · tsc clean · 88/88 unit · build exit 0 (23
   routes, via the repo wrapper) · 145/145 E2E = **233** — exactly the
   documented session-12 ship state, one run.
3. **Round-13 live A/B audit** (agent-browser sessions `ref` + `clone`,
   the clone served by the production standalone server on :3000; both
   sessions authenticated; state saved to files before device
   emulation):
   - **Mobile nav (13th standing verification):** iPhone 14 both sites —
     the Sheet panel class string matches token-for-token (the only
     difference is the attribute ORDER of the last two utilities, which
     does not affect the cascade), pad 24px, gap 16px, bg
     `rgb(251,250,249)`, nav `flex flex-col gap-4 mt-8` (gap 16,
     margin-top 32), all 5 links byte-identical (239×44, 18px/500,
     block, same hrefs). Functional check: "Electronics" deep-links to
     `/shop?category=electronics` and the sheet auto-closes (the
     documented superset). **No Tailwind v4 regression (13th
     consecutive).**
   - **The round's primary new surface — the Core Web Vitals
     differential:** the LCP ELEMENT is byte-identical on both sites
     (the hero CDN image, 487,024px², `IMG.w-full h-full object-cover` —
     a session-0 image-parity confirmation); **the clone paints it at
     252ms vs the reference's 1576ms — 6.3× faster on the identical
     asset** (SSR DOM vs the SPA's bootstrap-then-render-then-fetch);
     the clone's LCP == FCP (412ms on the same load). **CLS:
     0.0213 = 0.0213 — byte-identical layout stability** (both far
     under 0.1). TTFB 160 vs 256ms (localhost vs remote — recorded,
     not claimed); DOM nodes 631 vs 599 (the clone's +32 = the inert
     hero slides — the documented crossfade divergence). FCP 412 vs
     856ms.
   - **Keyboard focus-order walk (home header):** identical Tab
     sequences on both sites (LUXE logo → Home → Shop → Electronics →
     Clothing → Accessories → search → wishlist); the clone's controls
     are labeled where the reference's are not (the documented aria
     superset).
   - **Reference drift watch:** home product-card census (11 cards:
     names, prices, order) byte-identical; account text + input values
     identical (John Doe / john@example.com / +1 (555) 123-4567); the
     reference's typeahead still fires ZERO search network requests
     (probe caught only an analytics batch + `/entities/User/me` —
     local filtering; the clone's `/api/search` stays the registered
     superset); the hero carousel advances at exactly 5.0s intervals on
     both sites (the corrected dot probe: the active dot is `w-8
     bg-white`, not the `bg-white/50` the first probe matched — the
     first probe's "stuck" reading was a selector artifact, the
     session-11 lesson again).
   - **Console-error census (the routes session-12 did not walk):**
     `/checkout`, `/wishlist`, `/verify-email`, `/admin/products`,
     `/admin/orders` — ZERO pageerrors/console errors. Admin gating
     re-verified (a logged-in non-admin bounces from `/admin/orders`).
   - **Pixel diffs @1024 (8 routes — wishlist + checkout added):** home
     0.35 / shop 0.34 / PDP 0.63 / cart 0.34 / login 0.27 / wishlist
     0.34 / checkout 0.35 / **account 0.34 after a settled re-capture**
     — all at the baseline band. **Audit artifact recorded:** the first
     sweep's account capture measured 22.08% — a mid-hydration frame
     (client-island route + fixed 3s settle racing React's DOM
     adoption); the settled re-capture (networkidle + 4s) read the
     0.34% baseline. Lesson recorded in AGENTS testing quirks + SKILL
     L20: client-island routes need networkidle + a settle in paired
     pixel captures.
   - **Zero parity defects; no reference drift.** The round's finding is
     the functional-superset gap ADMIN-SEARCH-1 (the session-22
     nominated candidate): the admin orders list rendered a flat
     `take: 100` list with no search, no status filter, and a silent
     truncation.
4. **Remediation plan** (`docs/remediation-plan-session13.md`): the
   audit record + the ADMIN-SEARCH-1 fix design, validated against the
   codebase (the shop's filter conventions read in source:
   `ShopFilters`' merged-param `router.push` pattern, the
   `parseSearchParams` shape, `admin.spec.ts`'s login-sharing + row
   scoping conventions, the ORDER_STATUSES contract in
   `src/lib/actions/admin.ts`, the canonical seed orders 001 delivered /
   002 in_transit / 003 delivered).
5. **TDD RED:** 12 unit tests (`src/lib/admin-orders.test.ts` — parse
   validation incl. case-sensitive status contract + array-param
   shapes; where-building incl. the OR contains branches; the
   status-options-vs-combobox contract) — failed for the right reason
   (module missing). 3 E2E tests in `admin.spec.ts` (status deep-link +
   count line + row filtering; number + email search; empty state +
   Clear) — all failed for the right reasons (the "3 orders" count
   line / "Filter by status" combobox / "Search orders" input absent;
   the later failures were the shared-page timeout cascade).
6. **TDD GREEN:** the pure seam `src/lib/admin-orders.ts`
   (`parseAdminOrderFilters` + `buildAdminOrderWhere` +
   `ADMIN_ORDER_STATUS_OPTIONS`); the client island
   `src/components/account/admin-order-filters.tsx` (mirrors
   ShopFilters: search form + status Select + Clear, merged params via
   `router.push`, adjust-during-render input sync); the page wiring
   (`/admin/orders` reads searchParams, applies the where to both
   `findMany` and `count`, renders the filter bar, a "N orders" /
   "100+ of N orders" count line, and the "No orders match your
   filters" empty state with a Clear-all-filters way out). Added
   `waitForLoadState("networkidle")` after each goto in the new E2E
   tests (the documented client-island hydration convention).
7. **Gate at ship:** lint 0/0 · tsc clean · **100/100 unit** · build
   exit 0 (23 routes) · **148/148 E2E = 248 total** (was 233; +12
   unit + 3 E2E, none removed) — **two consecutive full E2E runs**
   for determinism.
8. **Live re-verification** (`scripts/verify-session13.ts`): **11/11
   green** — the filter bar renders; status filter deep-links
   (?status=delivered → 2 orders, the in_transit row hidden; direct
   deep-link lands in the same state); an INVALID status deep-link
   falls back to the unfiltered list; q=001 → 1 order; q=john@ (the
   email OR branch) → 3; combined q+status → the empty state heading +
   the Clear-all-filters way out; Clear → the unfiltered 3-order list;
   the order detail remains reachable. **Verify-script lesson
   recorded (SKILL L20):** the first version used non-retrying
   `isVisible()` checks right after `waitForURL` — they read the
   PREVIOUS page (router.push paints the URL before the RSC payload
   lands) and reported false failures; the retrying-`expect` rewrite
   went 11/11 (a debug probe with an explicit settle had already
   proven the feature worked).
9. **Screenshots:** 5 new (76–80, captured by the persisted
   `scripts/capture-session13.ts` — 76 the filter bar over the
   unfiltered list, 77 the status filter applied, 78 the search
   filter applied, 79 the combined-filter empty state, 80 the 13th
   mobile-nav verification) → 80 total. VLM-verified **5/5** from the
   `vlm-check` scratch dir (the sdk never enters the repo).
   `.env.example` verified current — no new env plumbing (filters are
   URL params).
10. **Docs:** AGENTS.md (the admin-orders filter contract + the
    non-retrying-probe/pixel-settle lesson), CLAUDE.md (the session-13
    contract, 100 unit / 148 E2E), README.md (248 tests, the admin
    feature row, 13th mobile-nav verification), PAD v1.13 (ADR-021,
    revision row, the Known-Issues Resolved row, test matrix 248),
    SKILL v1.13.0 (L20–L21 + the ADR-index completion 017–021), this
    session log, the worklog.

## Key decisions

- **Zero parity defects → the round ships a superset feature.** The
  audit's job is to find work; this round it found none on parity
  surfaces, so the session-22-nominated operational gap (admin order
  filters) took the slot. The choice followed risk: CSP-with-nonce
  (also nominated) bricks hydration system-wide if the pipeline is
  wrong; the admin feature touches zero parity surfaces.
- **Mirror the repo's own conventions** (SKILL L21): the filter bar is
  `ShopFilters` applied to the console — URL shape, navigation
  semantics, count line, empty state, e2e contracts all inherited from
  the storefront's battle-tested pattern.
- **The pure seam gets the lib treatment** (`src/lib/admin-orders.ts`,
  12 unit tests) because the admin surface is a superset with no
  reference-parity constraint holding the parser page-local (the
  shop's parser stays page-local precisely because its URL shape is a
  measured reference contract).
- **Case-sensitive status validation** (invalid `?status=` falls
  through to the unfiltered list, never an error) — a bad deep-link
  renders the honest default instead of a dead end; pinned by unit
  tests + the live verification.
- **CWV interpretation discipline:** TTFB was recorded but NOT claimed
  (localhost vs remote); LCP was claimed because the LCP ELEMENT is
  byte-identical on both sites (same CDN asset, same rendered size) —
  only the paint timing differs, and that is architecture. CLS at
  0.0213 = 0.0213 is the strongest parity signal (identical layout
  stability).
- **Probe lessons recorded:** the active carousel dot is `w-8
  bg-white` (a `bg-white` selector matches BOTH dot states — the
  session-11 "stuck carousel" false reading, reproduced and avoided);
  paired pixel captures on client-island routes need networkidle + a
  settle (the 22% account artifact); verify scripts need retrying
  `expect` assertions after client navigations.

`docs/remediation-plan-session13.md` records the full audit trail.

## Suggested next steps

Round-14 candidates: a meaningful CSP with nonce plumbing (the
documented SEC-HEADERS follow-up — now the only remaining nominated
security item), server-side pagination for the orders list (if scale
ever demands it), wiring an email provider to activate the ADR-011
verification gate, Stripe Payment Element (ADR-007's documented next
step), or the self-hosted axe differential as a standing E2E check.
Tell me which to pick up and I'll start the next round.
