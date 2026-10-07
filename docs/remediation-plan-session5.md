# Remediation Plan — Session 5 Review (Round-5 Differential Audit)

**Date:** 2026-10-07
**Repo:** `nordeim/ecommerce-store` (branch `main`, baseline `fba0259`)
**Author:** Review/build agent (Super Z)
**Scope:** Live differential audit (round 5) of the LUXE Store clone against the
reference (`fuzzy-lumina-style-hub.base44.app`), targeting the surfaces prior
sessions had not yet A/B-verified at DOM level: the PDP buy-panel action-row
buttons, wishlist heart color states across surfaces, home-page section
dividers, the full checkout-wizard happy path end-to-end (superset), the admin
console's mutation paths (superset), a 4th mobile-navigation re-verification,
mobile overflow sweeps of PDP/wishlist/account/checkout/shop, and a
reference-drift re-check of previously pinned surfaces. The `skills/` folder
is excluded from code checking, testing and compilation per the operating
contract.

**Method:** Both sites driven side-by-side with agent-browser (sessions `ref`
= production reference logged in as the operator account, `clone` = local dev
server on the current commit, plus an `admin` session on the clone),
DOM/computed styles as ground truth, VLM cross-checks (home-page comparison),
session-0 recon HTML as the drift oracle, full verification gate re-run at
audit start.

---

## 1. Baseline verification (state at audit start)

| Gate | Result |
|---|---|
| `bun run lint` | 0 errors, 0 warnings |
| `bun run typecheck` | clean |
| `bun run test` (Vitest) | 66/66 passed |
| `bun run build` | compiles, 21 routes |
| `bun run test:e2e` (Playwright) | 104/104 passed |
| DB contract | `db/custom.db` at repo root (hard link converged, inode 274771); `.env` = `file:../db/custom.db` |
| Docs | AGENTS/CLAUDE/README/PAD v1.4/SKILL v1.4.0 all current through session-4 (170-test gate) |

## 2. Audit results

### Verified at parity this round (no action required)

- **Mobile navigation menu (4th re-verification, standing user priority):**
  dialog `fixed z-50 gap-4 bg-background p-6 …` 288×844 @ (0,0) on both sites,
  nav wrapper `flex flex-col gap-4 mt-8`, all 5 links byte-identical (text +
  hrefs). The v4 trap-log #5 pin holds.
- **Mobile overflow sweep (iPhone 14):** `/wishlist`, `/account`, `/checkout`,
  `/shop` — `scrollWidth == clientWidth == 390` on BOTH sites (no horizontal
  overflow anywhere except the PDP action row, see PDP-ACTION-1).
- **Hero carousel:** identical 3-slide set (Spring Collection 2026 / Tech
  Essentials / Home & Comfort), auto-cycling measured live on the reference.
- **Announcement bar:** "Free shipping on orders over $100 • 30-day returns"
  — byte-identical.
- **Shop page:** 24 product anchors, identical grid classes.
- **Account:** h1 "My Account" + the 4 tabs identical; the new
  `ORD-2026-004` order placed during this audit appears in the orders tab.
- **PDP tabs + related:** tab labels and "You May Also Like" identical.
- **PDP buy-panel info column:** byte-identical structure (category p, h1,
  rating row, price row, description, feature badges, `h-[1px]` divider,
  action row, trust grid `grid grid-cols-3 gap-3 mt-4`).
- **Shop card heart BUTTON (inactive):** identical classes, 36×36, same
  position.
- **`--destructive` token:** `rgb(239, 67, 67)` on both.
- **Stepper + ATC button classes:** identical (`p-3` stepper buttons, ATC
  `h-10 px-8 flex-1 rounded-xl gap-2`).
- **Checkout wizard (superset, functional):** full 3-step flow driven live —
  shipping form → payment (card + PayPal toggle) → review → order placement →
  `/checkout/success?order=ORD-2026-004` with correct copy, item summary and
  $89.98 total ($79.99 + $9.99 shipping); order visible in account history and
  the admin console.
- **Admin console (superset, functional):** dashboard stat cards (Revenue
  $1,153.93 incl. the live-placed order), per-product stock editing forms,
  order-status combobox — a status change (Processing → In Transit) persisted
  across reload.
- **Search typeahead (superset):** "head" query returns the headphones row
  (image + name + price).
- **Newsletter (superset):** submit shows "Thanks for subscribing!".
- **Reference wishlist is cosmetic:** toggling hearts on the reference (PDP or
  shop cards) fires NO network request and the wishlist page issues no entity
  fetch and stays "Your wishlist is empty" (also empty in the session-0 recon
  capture). The clone's DB-backed wishlist remains the documented superset —
  only the heart VISUAL states need matching (below).

### Reference quirks registered (divergences, do not "fix")

- **Google OAuth button:** the reference's "Continue with Google" redirects to
  a real Google OAuth flow (base44 platform, client_id 185178814199-…); the
  clone renders the identical button as a visual-only `type="button"` — wiring
  real OAuth requires credentials that do not exist for a self-hosted clone.
  Register in AGENTS.md divergence list.
- **Reference wishlist non-persistence** (above): clone superset, register.
- **Reference mobile PDP overflow:** the reference's action row (stepper 130 +
  gap + ATC ~165 + gap + heart 82) exceeds the 390px iPhone 14 viewport by
  ~35px (`scrollWidth` 425) — the heart is clipped at the right edge and the
  page scrolls horizontally. Matching the reference's `px-8` heart (PDP-ACTION-1)
  intentionally reproduces this exact resting mobile visual (parity, not a
  defect to diverge from).

## 3. Issue inventory

### HOME-DIVIDER-1 — Home page is missing the two section dividers
- **Severity:** Medium (layout rhythm visibly differs between sections)
- **Evidence (live + recon, 2026-10-07):** the reference's home main wrapper
  renders TWO `div.shrink-0.bg-border.h-[1px].w-full.max-w-7xl.mx-auto`
  elements: after the feature bar (before "Trending Now") and after "New
  Arrivals" (before "On Sale"). Verified live (dividerCount 2 vs clone 0) AND
  in the session-0 recon `html-02-home.html` (2 occurrences) — a long-missed
  gap, not drift. Both are 1280px wide, 1px tall, no vertical margin (the
  py-12/py-16 section paddings create the rhythm).
- **Fix:** insert the two divider divs in `src/app/(storefront)/page.tsx`.

### PDP-ACTION-1 — Buy-panel wishlist heart button is px-4, not px-8
- **Severity:** Medium (wrong button width; ATC width off by 32px on desktop)
- **Evidence (live):** reference heart = `h-10 px-8 rounded-xl` (82px wide,
  40px tall) with `svg.lucide-heart h-5 w-5`; clone = `h-10 px-4` (50px) with
  `h-4 w-4`. Reference ATC icon = `lucide-shopping-bag h-5 w-5`; clone =
  `h-4 w-4`. Rendered icons are 16×16 on both (the Button base
  `[&_svg]:size-4` wins) — the class change is DOM parity only. Desktop row
  (584px): reference heart 82 / ATC 340; clone heart 50 / ATC 372 (flex-1
  absorbs the delta). Mobile (390px): reference row overflows 35px (heart
  clipped); clone overflows 2.5px — matching px-8 reproduces the reference
  exactly.
- **Fix:** `src/components/store/buy-panel.tsx` — heart `px-8`, heart svg
  `h-5 w-5`, ATC svg `h-5 w-5`.

### HEART-COLOR-1 — Active wishlist hearts are orange, not red
- **Severity:** Medium (wrong color on a state users see constantly)
- **Evidence (live):** reference ACTIVE heart (measured on both the PDP
  buy-panel and a shop product card, after toggling): svg class
  `fill-destructive text-destructive`, computed color `rgb(239, 67, 67)`
  (red). Clone active: `fill-primary` (+ `text-primary` on PDP) = orange
  `#E66B1A`. Files: `buy-panel.tsx:72`, `product-card.tsx:74`.
- **Fix:** swap the active classes to `fill-destructive text-destructive` at
  both seams.

### HEART-COLOR-2 — Shop card inactive heart renders dark instead of muted
- **Severity:** Low
- **Evidence (live):** reference inactive card heart svg =
  `h-4 w-4 transition-colors text-muted-foreground`, computed color
  `rgb(111, 111, 123)`; clone = `h-4 w-4` (no color class), computed
  `rgb(23, 23, 28)` (foreground). The PDP heart correctly renders foreground
  on both (no color class there) — only the CARD heart carries
  `text-muted-foreground`.
- **Fix:** `product-card.tsx:74` — inactive gains
  `transition-colors text-muted-foreground`; active replaces them with
  `fill-destructive text-destructive` (tailwind-merge resolves the text-color
  conflict in favor of the latter, matching the reference's active class list
  exactly).

### CHECKOUT-BADGE-1 — Stale cart badge after placing an order
- **Severity:** High (functional correctness of the superset checkout)
- **Evidence (live):** after the 3-step wizard places an order and redirects
  to `/checkout/success`, the header badge still reads "Cart, 1 items" until
  a manual reload; after reload it reads "Cart" (server truth — the cart WAS
  cleared). Root cause: `checkout-flow.tsx` calls `router.refresh()` +
  `router.push(...)`; the refreshed layout delivers new `initialCart` props
  to `StoreProvider`, but `useState(initialCart)` only reads the initial
  value on first render — the provider's state never re-syncs from props.
  Class-wide: ANY server-side cart mutation followed by a refresh would show
  a stale badge.
- **Fix:** `src/components/store/store-provider.tsx` — the
  adjust-state-during-render pattern (React docs; already the repo's lint
  policy for prop-synced state): keep a ref of the last-seen
  `initialCart`/`initialUser`/`initialWishlistIds`; when a prop identity
  changes during render, update the ref and `setState` to the new server
  truth. Server truth wins; client-optimistic updates are unaffected (they
  land via action responses, then the next refresh re-delivers the same
  truth).

## 4. Dependency sweeps (validated before writing this plan)

- No E2E/unit test pins the heart button width, `px-4`, `fill-primary`, or
  the absence of home dividers (grepped `tests/` for `px-4`, `fill-primary`,
  `divider`, `h-\[1px\]` — the only hits are the PDP buy-panel's own
  `h-[1px]` divider, unrelated).
- `product-card.tsx` is the single card-heart seam (shop, home sections,
  wishlist page, related products all render `ProductCard`).
- The wishlist E2E suite toggles hearts but asserts only badge/toast/row
  state — no color assertions to update.
- The checkout specs place orders but never assert the header badge
  post-order — the new regression is additive.
- `AGENTS.md`/`CLAUDE.md`/README/PAD/SKILL heart + divider mentions: none
  exist today (these surfaces were never documented as pinned) — docs gain
  the new contracts.
- StoreProvider consumers: `setUser` is called by the login/logout flows;
  adding render-phase re-sync does not interfere (user prop changes only on
  refresh after login/logout server-side, which is exactly when the header
  SHOULD re-sync).

## 5. TDD execution plan

| # | Task | Test first (RED) | Implementation (GREEN) |
|---|---|---|---|
| T1 | Home dividers | storefront-parity: exactly 2 dividers `shrink-0 bg-border h-[1px] w-full max-w-7xl mx-auto`; child #3 of the main wrapper is a divider (after hero + features); a divider sits between New Arrivals and On Sale | Insert the 2 dividers in `page.tsx` |
| T2 | PDP action-row geometry | storefront-parity: PDP heart button has class `px-8`, width 82; heart + ATC svgs carry `h-5 w-5` | `buy-panel.tsx` class changes |
| T3 | Heart color states | wishlist spec: PDP inactive heart = foreground color; PDP active heart class `fill-destructive text-destructive` + computed `rgb(239, 67, 67)`; card inactive heart class `text-muted-foreground` + computed `rgb(111, 111, 123)`; card active heart `fill-destructive text-destructive` | `buy-panel.tsx` + `product-card.tsx` fill/color classes |
| T4 | Badge regression | checkout spec: after order placement lands on success, the header cart button's accessible name is exactly "Cart" (no count) WITHOUT a reload | StoreProvider adjust-state-during-render re-sync |
| T5 | Gate + docs | full gate re-run; AGENTS/CLAUDE/README/PAD/SKILL updates; plan check-off; session log; worklog; screenshots | — |

## 6. Sign-off criteria — ALL MET

- [x] All RED tests written and verified failing on the pre-fix build
      (4 failing: divider count 6≠8 · heart px-4≠px-8 · heart fill-primary
      ≠fill-destructive · stale badge "Cart, 1 items"; all for the right
      assertions — one locator bug fixed during RED: the PDP heart locator
      matched related-product card hearts, re-scoped to the action row)
- [x] All GREEN — full gate: lint 0/0 · tsc clean · 66/66 unit · build OK
      (21 routes) · **107/107 E2E = 173 total** (was 170)
- [x] Live A/B re-verification: home dividers byte-exact (both at
      y=940/y=2561, 1280×1); PDP action row identical (heart 82px
      `h-10 px-8`, ATC 340px, svgs `h-5 w-5`, stepper 130px); card hearts
      muted `rgb(111,111,123)` on both; active heart red `rgb(239,67,67)`;
      mobile PDP overflow exact parity (scrollWidth 425, heart right 425
      on iPhone 14 on BOTH); checkout badge reads exactly "Cart" after
      live order placement (ORD-2026-005) with no reload
- [x] Divergence register updated (Google OAuth visual-only, reference
      wishlist cosmetic, mobile PDP overflow parity note) — AGENTS.md
      divergence list + PAD ADR-012 consequences
- [x] Docs + screenshots + worklog updated; commit to main; SSH wrapper
      push

## 7. Outcome notes

- **T1 dividers:** 2 divs inserted in `src/app/(storefront)/page.tsx`
  (after `FeatureBar`, between New Arrivals and On Sale). Live A/B: both
  sites render them at identical positions/dimensions.
- **T2 heart geometry:** `buy-panel.tsx` heart `px-4`→`px-8`, heart svg
  `h-4 w-4`→`h-5 w-5`, ATC svg `h-4 w-4`→`h-5 w-5`. Desktop ATC
  372→340px (flex-1 no longer absorbs the 32px).
- **T3 heart colors:** active = `fill-destructive text-destructive` at
  both seams; card inactive gains `transition-colors
  text-muted-foreground` (tailwind-merge drops the muted class when
  destructive lands — matching the reference's active class list
  exactly). The card heart BUTTON's `text-primary` (active branch)
  removed — the reference button carries no color class.
- **T4 StoreProvider:** initial ref-based "last props" guard failed the
  repo's React Compiler `react-hooks/refs` lint (no ref access during
  render) — rewritten with STATE-based guards (`lastServerCart`/
  `lastServerUser`/`lastServerWishlistIds`), the documented
  adjust-state-during-render pattern. Live-verified via a full dev-server
  order placement.
- **Extra tooling:** `prisma/dev-cleanup.ts` added — returns the DEV db
  to canonical seeded state after live-audit testing (targeted deletes,
  never `migrate reset`, which would break the sandbox hard-link).
- **Test-bug fixes during GREEN (not code bugs):** the wishlist
  heart-color spec's locator was anchored to "Add …" (orphaned on
  successful toggle — "element not found" IS the success signal);
  re-anchored to `/«Product» (from|to) wishlist/`. The divider spec's
  constructed CSS selector (`.h-[1px]`) was invalid — unescaped brackets;
  switched to `:scope > *` nth-child.
- **VLM cross-check:** home comparison confirmed both separators present
  at the same positions post-fix; the reference's below-fold sections
  render empty in ITS full-page captures (lazy-load artifact — DOM
  comparison is the ground truth).
