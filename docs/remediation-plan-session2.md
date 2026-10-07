# Remediation Plan — Session 2 Review (Post-Push Audit)

**Date:** 2026-10-07
**Repo:** `nordeim/ecommerce-store` (branch `main`, baseline `5090b22`)
**Author:** Review/build agent (Super Z)
**Scope:** Post-push differential audit of the LUXE Store clone against the live
reference (`fuzzy-lumina-style-hub.base44.app`), focused on the surfaces NOT
covered by the session-1 remediation: catalog ordering/sort semantics, PDP
content data, and the cart drawer item row. The `skills/` folder is excluded
from code checking, testing and compilation per the operating contract.

**Method:** Live differential testing — both sites driven side-by-side with
agent-browser (two sessions: `ref` = production reference, `clone` = local dev
server), DOM/computed styles as ground truth, VLM cross-checks for
screenshot-level diffs, full verification gate re-run at audit start.

---

## 1. Baseline verification (state at audit start)

| Gate | Result |
|---|---|
| `bun run lint` | 0 errors, 0 warnings |
| `bun run typecheck` | clean |
| `bun run test` (Vitest) | 45/45 passed |
| `bun run build` | compiles, 19 routes |
| `bun run test:e2e` (Playwright) | 62/62 passed |
| DB contract | `db/custom.db` at repo root (hard-linked with the sandbox-injected path — inode shared); `.env` = `file:../db/custom.db` |
| Test suites | Vitest 5 + Playwright 1.63 configured and green (45 unit + 62 E2E) |

Confirmed parity surfaces (live A/B this session): home structure (h1, 4
sections, feature bar, 22 product anchors, bg `rgb(251,250,249)`, font),
Trending + New Arrivals membership, shop filters (All Categories / All Prices /
Featured), search bar + submit → `/shop?search=…` with `Results for "…"` h1,
account dashboard (4 tabs, 3 seeded orders byte-exact), footer (bg, links,
copy), wishlist empty state, chrome-less 404 (copy + quoted path byte-exact),
standalone login/register, mobile menu panel (288px left Sheet, 5 links, same
bg + class string, Escape dismissal), cart-drawer resting behavior (no
auto-open on add; 448px right Sheet; Cart (N) heading; Checkout/View Cart
actions).

## 2. Issue inventory

### PARITY-9 — Shop default ("Featured") order does not match the reference array order
- **Severity:** High (catalog ordering is visible on every shop visit)
- **Evidence:** Reference `/shop` default order (live, 2026-10-07):
  `wireless-headphones, leather-watch, organic-cotton-tee, smart-speaker,
  ceramic-planter, running-shoes, vitamin-c-serum, linen-blanket,
  titanium-sunglasses, yoga-mat, charging-pad, silk-pajama`.
  Clone order groups trending products first (sortOrder 1-4 = trending,
  5-7 new arrivals, 8+ the rest). The clone's seed `sortOrder` was authored
  per merchandising group, not per reference array position.
- **Knock-on:** the home **On Sale** section membership. The reference's On
  Sale = first 4 `onSale` products **in array order** → `[headphones,
  organic-cotton-tee, smart-speaker, running-shoes]`. The clone shows
  `[headphones, smart-speaker, running-shoes, vitamin-c-serum]` (missing
  organic-cotton-tee — the 8th unique home card on the reference is absent
  from the clone's home).
- **Fix:** reassign `sortOrder` in `prisma/seed.ts` to the reference array
  order (1…12). This simultaneously fixes Featured order, the On Sale
  membership, and provides the tie-break for Top Rated (PARITY-11).

### PARITY-10 — Sort dropdown lists "Newest" before "Top Rated"
- **Severity:** Low (visual, dropdown order)
- **Evidence:** Reference options: `Featured, Price: Low to High, Price: High
  to Low, Top Rated, Newest`. Clone (`src/components/store/shop-filters.tsx`
  `SORT_OPTIONS`): `…, Newest, Top Rated`.
- **Fix:** swap the last two entries.

### PARITY-11 — "Newest" sort produces the wrong order; "Top Rated" tie-break undefined
- **Severity:** Medium
- **Evidence:**
  - Reference "Newest" = **exact reverse of the array order** (live):
    `silk-pajama, charging-pad, yoga-mat, …, wireless-headphones`. The
    reference's client-side sort is array-position based.
  - Clone "Newest" = `createdAt desc`, but every seeded product shares the
    same `createdAt` (seed doesn't set it; `@default(now())`), so the order
    falls back to an arbitrary secondary order (id desc) — currently
    `charging-pad, yoga-mat, linen-blanket, …` ≠ reference.
  - Reference "Top Rated" = **stable sort by rating desc on the array order**
    (verified live: `planter, pajama, headphones, serum, mat, speaker,
    blanket, watch, shoes, tee, sunglasses, pad` — matches rating-desc with
    array-order tie-break once the corrected ratings land, see DATA-1).
    Prisma's single-key `orderBy` does not guarantee tie order.
- **Fix:**
  1. Seed a staggered `createdAt` (array position 1 = oldest … 12 = newest)
     so `createdAt desc` = reference reverse order deterministically.
  2. Shop page `orderBy` for `rating` becomes an array:
     `[{ rating: "desc" }, { sortOrder: "asc" }]` (tie-break = array order).

### DATA-1 — Three products carry wrong rating / reviewCount
- **Severity:** Medium (visible on PDP + Reviews tab + Top Rated order)
- **Evidence (live reference vs clone seed):**
  | Product | Reference | Clone seed |
  |---|---|---|
  | ceramic-planter | **4.9 (87)** | 4.7 (203) |
  | linen-blanket | **4.7 (145)** | 4.8 (167) |
  | yoga-mat | **4.8 (267)** | 4.6 (341) |
  The other 9 products match. The drift also explains why the clone's Top
  Rated sort can never reproduce the reference order.
- **Fix:** update the seed values; re-seed.

### DATA-2 — Eleven of twelve product descriptions differ from the reference
- **Severity:** Medium (PDP Description tab is a parity surface)
- **Evidence:** Full 12-product PDP diff (live, both sites). Only
  `wireless-headphones` matches. E.g. reference `ceramic-planter`:
  "Set of 3 handcrafted ceramic planters in varying sizes. Perfect for
  succulents and herbs." vs clone: "Set of three hand-glazed stoneware
  planters with drainage holes and matching trays." The clone descriptions
  were paraphrased at build time instead of transcribed.
- **Fix:** replace all 11 descriptions in the seed with the exact reference
  text (captured live; full list in §4/T4).

### PARITY-12 — Cart drawer item row and summary structure differ from the reference
- **Severity:** Medium (the drawer is a high-traffic surface; row layout is
  visibly different)
- **Evidence:** Reference drawer DOM (live, verbatim):
  - Scroll area: `flex-1 overflow-y-auto -mx-6 px-6` with rows
    `flex gap-3 py-4 border-b border-border/50` (border-separated rows).
  - Item: image `h-20 w-20 rounded-xl bg-secondary/30 shrink-0` (NOT a link);
    name `<h4 class="text-sm font-medium truncate">` (NOT a link, single-line
    truncate); unit price `<p class="text-sm font-bold mt-1">`;
    stepper row `flex items-center gap-2 mt-2` (trash immediately after the
    stepper, `p-1.5`), qty span `min-w-[2rem]`; right-side line total
    `<p class="text-sm font-bold shrink-0">`.
  - Summary: `pt-4 space-y-3` with `Separator` elements between
    Subtotal/Shipping and before Total; Shipping value "Free" carries
    `text-primary`; Total value `font-bold text-lg`; Checkout anchor
    `h-10 px-8 w-full rounded-xl`.
  - Clone (`src/components/store/cart-drawer.tsx`): gap-4 rows without
    borders; name is a `Link` with `line-clamp-2 font-semibold`; price
    `text-muted-foreground mt-0.5`; stepper row `justify-between` (trash at
    far right, `p-2`); qty `min-w-[2.25rem]`; **no line total**; summary
    `border-t pt-4 gap-1.5` without separators; "Free" not `text-primary`;
    scroll area `-mx-2 px-2 mt-4`.
- **Fix:** rewrite the item row + summary to the reference DOM. Keep the
  clone's functional extras (aria-labels, disabled minus at qty 1, image
  links are dropped for parity — reference image is not a link).
- **Note:** the clone's drawer keeps production-correct accessibility
  (aria-labels on stepper/remove buttons) — the reference's unlabeled buttons
  are an a11y regression we do not replicate.

### BEHAVIOR-1 — Mobile menu stays open after link navigation (reference quirk)
- **Severity:** Informational — deliberate divergence (superset)
- **Evidence:** Reference (live, verified twice): tapping a menu link
  navigates but the Sheet REMAINS open (`data-state=open`, backdrop still
  dimming the page — measured page-zone brightness 45.8 vs 248.6 in the
  panel). The user must dismiss manually. Clone: menu closes on navigation
  (E2E-pinned).
- **Decision:** keep the clone's auto-close. It is the production-correct
  behavior; the reference's stay-open is a demo quirk. Document as a known
  deliberate divergence (same class as the real /cart page vs the
  reference's hardcoded empty cart).

### REPO-4 — `/cart` page item rows lack the line total (consistency follow-up)
- **Severity:** Low (superset surface — the reference's /cart always renders
  its empty state, so there is no reference counterpart)
- **Evidence:** With PARITY-12 adding line totals to the drawer, the
  full-page cart (clone-only surface) should mirror the same row anatomy.
- **Fix:** align the /cart page rows with the new drawer row (line total,
  same typography), keeping its larger 24px imagery (page context).

## 3. Remediation ToDo list (execution order)

TDD applies to every code change: red → green, one vertical slice at a time
(tdd skill: test at the public seam, never internals). E2E specs are the
seams for page behavior; the suite boots the production build on the
isolated e2e DB (`db/e2e.db`).

- [ ] **T1 (PARITY-9)** — RED: extend `tests/e2e/smoke.spec.ts` (or a new
  `tests/e2e/catalog-order.spec.ts`) with: (a) `/shop` default card order =
  the 12-slug reference sequence; (b) home On Sale section = `[headphones,
  organic-cotton-tee, smart-speaker, running-shoes]`. GREEN: reassign
  `sortOrder` 1-12 in `prisma/seed.ts` to the reference array order.
- [ ] **T2 (PARITY-10 + PARITY-11)** — RED: E2E asserting the sort dropdown
  option order (`Top Rated` before `Newest`) and the "Newest" result order =
  reverse of the Featured sequence; unit-level check not applicable (seed
  data). GREEN: swap `SORT_OPTIONS` entries; add staggered `createdAt` to
  the seed products; change the shop page's `rating` orderBy to
  `[{ rating: "desc" }, { sortOrder: "asc" }]`.
- [ ] **T3 (DATA-1)** — RED: E2E on `/product/ceramic-planter`,
  `/product/linen-blanket`, `/product/yoga-mat` asserting `4.9 (87
  reviews)`, `4.7 (145 reviews)`, `4.8 (267 reviews)` + Reviews tab labels.
  GREEN: update the three rating/reviewCount pairs in the seed.
- [ ] **T4 (DATA-2)** — RED: E2E (or extend the PDP spec) asserting the
  reference description strings on 2-3 representative PDPs. GREEN: replace
  the 11 drifted descriptions in the seed with the exact reference text.
- [ ] **T5 (PARITY-12)** — RED: extend `tests/e2e/cart.spec.ts` with a
  drawer-row structure test: line total visible (`$299.99` ×2 for qty 1),
  item name is a truncated heading (not a 2-line link), unit price bold,
  border-separated rows, "Free" shipping in the primary color (computed
  style). GREEN: rewrite the drawer item row + summary to the reference DOM.
- [ ] **T6 (REPO-4)** — Align `/cart` page rows (line total + drawer
  typography); E2E: line total visible on the full-page cart.
- [ ] **T7 (BEHAVIOR-1 doc)** — AGENTS.md + README.md: document the
  deliberate mobile-menu divergence (auto-close = superset; reference
  stays open) next to the other documented divergences.
- [ ] **T8 (docs)** — Update `AGENTS.md`, `CLAUDE.md`, `README.md`,
  `Project_Architecture_Document.md` for: catalog-order contract (sortOrder
  = reference array position), staggered createdAt, sort tie-break rule,
  drawer row anatomy, test-count changes, this remediation doc.
- [ ] **T9 (SKILL)** — Refresh `ecommerce-store_SKILL.md` (sections touched
  by the changes: data contracts, drawer anatomy, sort semantics, test
  inventory) per `skills/to-distill-project-into-skill`.
- [ ] **T10 (screenshots)** — Re-capture affected `docs/screenshots/`:
  shop (featured order), shop sorted (newest), home (On Sale section), PDP
  (ceramic-planter), cart drawer with item (new row), /cart page with item.
- [ ] **T11 (gate + ship)** — Full gate
  (`lint && typecheck && test && build && test:e2e`), conventional commit on
  `main`, SSH-wrapper push per
  `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`, key shredded after.

## 4. Reference ground-truth data (captured live 2026-10-07)

**Array order (Featured), 1→12:** wireless-headphones, leather-watch,
organic-cotton-tee, smart-speaker, ceramic-planter, running-shoes,
vitamin-c-serum, linen-blanket, titanium-sunglasses, yoga-mat, charging-pad,
silk-pajama.

**Corrected ratings/reviews:** ceramic-planter 4.9/87, linen-blanket 4.7/145,
yoga-mat 4.8/267 (all others verified unchanged).

**Exact reference descriptions:**
- leather-watch: "Elegant minimalist watch with genuine Italian leather strap and sapphire crystal glass."
- organic-cotton-tee: "Ultra-soft organic cotton t-shirt with a relaxed oversized fit. Sustainably sourced."
- smart-speaker: "Room-filling sound with smart assistant integration. Control your smart home devices with your voice."
- ceramic-planter: "Set of 3 handcrafted ceramic planters in varying sizes. Perfect for succulents and herbs."
- running-shoes: "Lightweight and responsive running shoes with energy-return technology and breathable mesh."
- vitamin-c-serum: "Brightening vitamin C serum with hyaluronic acid. Reduces dark spots for a radiant glow."
- linen-blanket: "Luxuriously soft linen throw blanket, naturally temperature-regulating and machine washable."
- titanium-sunglasses: "Ultra-lightweight titanium frame sunglasses with polarized lenses and UV400 protection."
- yoga-mat: "Extra-thick premium yoga mat with alignment lines and non-slip surface."
- charging-pad: "Fast wireless charging pad compatible with all Qi-enabled devices with LED indicator."
- silk-pajama: "Pure mulberry silk pajama set for ultimate comfort and luxury. Gift box included."

**Top Rated expected order (post-fix):** planter, pajama, headphones, serum,
mat, speaker, blanket, watch, shoes, tee, sunglasses, pad.
**Newest expected order (post-fix):** reverse of the array order.

## 5. Validation of this plan against the codebase

- `sortOrder` consumers audited: home page (trending/new/sale queries), shop
  page (featured + category filter default), admin product list — all
  orderBy `sortOrder asc`; the new values change only the ORDER, no
  membership (trending/new/sale flags untouched, verified against the
  reference's sections post-fix).
- E2E dependency sweep: no spec asserts the current (wrong) order, ratings,
  or descriptions; `.first()` card assumptions resolve to
  wireless-headphones in both old and new order; cart/checkout specs
  navigate to explicit PDPs; drawer specs target roles/text, not classes.
- The seed is idempotent via natural-key upserts; adding `createdAt` to the
  upsert `data` makes re-seeds converge (update path sets it explicitly).
- Prisma `orderBy` accepts arrays — the shop page's `Record<string, string>`
  map must become a `Prisma.ProductOrderByWithRelationInput[]`.
- Risks: (a) e2e-reset.ts wipes transient state only — seed changes need
  `db:setup` on the dev DB and a fresh e2e push (global-setup does this);
  (b) the drawer rewrite must keep `StoreProvider` wiring (updateQuantity
  item ids) — structure only, no data-flow change.

## 6. Sign-off criteria

1. Full gate green (lint 0/0, tsc clean, unit suite, production build, E2E
   suite — counts may grow, never shrink coverage).
2. Live A/B re-verification: shop Featured/Top Rated/Newest orders, home On
   Sale membership, the three PDP ratings, sample descriptions, and the
   drawer row (computed styles) all match the reference.
3. Docs + SKILL.md updated; screenshots refreshed for changed surfaces.
4. Single-branch (`main`) history; pushed and remote-verified via the SSH
   wrapper; operator key shredded.
