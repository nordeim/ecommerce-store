# Remediation Plan — Session 27 (Round 27): The Console Trifecta Completion — Products Search/Filter (ADMIN-PRODUCTS-1) + Docs Alignment

**Date:** 2026-10-09 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `dad3197` (the session-26 ship `b94c8f2` + the user's session-52 log commits)
**Status at audit start:** 433-test gate (208 unit+integration + 225 E2E), PAD v1.26, SKILL v1.26.0 — lint 0/0 · tsc clean · 208/208 unit+integration · build exit 0 (25 routes) · **the full E2E baseline re-run 225/225 (7.2m)** verified on the pulled workspace.

## 0. The round's mandate

The user's standing round instruction (the professional Stripe integration
verification, the full audit/parity workflow with the mobile-nav +
Tailwind v4 watches, the `.env`/db-root contract, the vitest + playwright
suites, the TDD remediation plan, the screenshots, the `.env.example`,
the docs, and the main-only push). The session-51 suggested-next-steps
(naming the Stripe test-mode keys and the email provider) are NOT
actionable without credentials — the round's superset candidate is
therefore the payment-ops/console family's remaining gap, chosen by the
round's own audit: **the products console list is the last of the three
console LIST surfaces with no search/filter treatment** (orders got
session-13's ADMIN-SEARCH-1; payments got sessions 24–26's PAY-OPS-1/2/3
— products still renders a bare take-everything list).

## 1. Baseline verification (state at audit start)

- Workspace NOT reset — `git pull` fast-forwarded `b94c8f2..dad3197`
  (only `docs/session_52.md`, the user's session-log narrative, in two
  "update session log" commits). `.env` carries the repo contract
  `DATABASE_URL="file:../db/custom.db"`; the env-shadowing trap live as
  documented (the shell's injected `DATABASE_URL` resolves to the SAME
  inode); the session-21 hard-link convergence INTACT (inode 395370 at
  BOTH `db/custom.db` paths, verified).
- Baseline gate: lint 0/0 · tsc clean · 208/208 unit+integration (14
  files) · build exit 0 (25 routes) · **the full E2E baseline re-run
  225/225 (7.2m, foreground — the sandbox reaps detached runs between
  tool calls, the L26 lesson extended to the E2E baseline itself)** —
  the documented session-26 ship state verified pre-change.
- Skills mapped from `skills/skills-catalog.md`: the standing set
  (agent-browser, tdd, clone-app-pat-pro) +
  **e-commerce-nextjs16-monorepo** (the round's primary — its
  admin-console/catalog-ops patterns re-read; the ADMIN-SEARCH-1 family
  is the repo's own established precedent). The session-26 commit
  re-audited file-by-file (the hero slides, the header row, the
  payments seam/island/page, the new pins) — all hold.
- **The Round-27 live battery** (single invocation, the :3000 production
  server on the final build): the pixel sweep ALL 8 ROUTES AT THE
  BASELINE BAND — home 0% (6 px), shop 0.05%, pdp 0.34%, cart 0.01%,
  wishlist 0%, checkout 0.01%, account 0%, login 0.28% — **NO new
  reference drift** (the session-26 content pins hold against the live
  reference); the **27th mobile-nav verification: TOKEN-EXACT PARITY**
  (all 10 checks — panel 288px / bg rgb(251,250,249), nav flex gap-4
  mt-8, 5 links 239×44 at 18px/500 with identical hrefs; the
  Electronics deep-link + auto-close passed); the standing watches
  clean (typeahead — the reference fires ZERO search requests; carousel
  cadence ~5000ms; the SEO layer — 17-URL sitemap, robots, JSON-LD,
  offers.price 299.99 USD); the console census 24 routes + 7 admin
  surfaces CLEAN.

## 2. Audit results

### 2.1 THE PRIMARY FINDING — the products console list gap (ADMIN-PRODUCTS-1)

`/admin/products` renders a bare `findMany` (all 12 products, sortOrder
asc) with no search, no filters, no count line, and no guided empty
state — while its two sibling LIST surfaces both carry the
URL-deep-linkable treatment:

| Surface | Search | Select filters | Count line | Empty state | Session |
|---|---|---|---|---|---|
| `/admin/orders` | `?q=` (number/email) | `?status=` (4 canonical) | "N orders" / "100+ of N" | guided + Clear | 13 (ADMIN-SEARCH-1) |
| `/admin/payments` | `?q=` (intent/event id) | `?family=` (4 canonical) + `?from=/to=` dates | same pattern | guided + Clear | 24/25/26 (PAY-OPS-1/2/3) |
| `/admin/products` | — | — | — | — (never empty: 12 rows) | **none** |

An operator managing the catalog asks exactly the questions the other
two surfaces already answer: "find the planter" (name/slug search),
"which products are in Electronics?" (category), "which products did I
hide?" (visibility). The row's own eye toggle (the visibility
management seam, session-6/7) has no list-level answer for its own
state. The catalog is demonstrable with the seeded set: 12 products
across 6 categories (electronics 3, sports 2, beauty 1, accessories 2,
clothing 2, home-living 2 — the natural-key-upserted seed, measured
from `prisma/seed.ts`).

### 2.2 The secondary finding — stale doc counts (DOCS-ALIGN-1)

The session-26 doc updates touched the contract sections but left
stale counts in the reference tables (verified by grep this round):

- `CLAUDE.md` §4 Build Commands: "Vitest unit + integration suite
  (**198** tests)" and "Playwright E2E (**217** tests …)" — the true
  gate is 208/225 (433 total, the session-26 ship).
- `README.md` §Architecture: "Prisma … **13 models**" and the
  mobile-nav row: "**25 consecutive** live verifications … the 25th
  rendered byte-identical to the 13th–24th" — the schema carries 15
  models (StripeEvent, session-22; NewsletterSubscriber) and the
  standing verification count is now 27.
- `Project_Architecture_Document.md` §12 Key Files: "prisma/schema.prisma
  | ~190 | **13 models**" — same staleness.

None of these are behavior defects (the code and the tests agree); they
are alignment debt in the operator-facing reference tables — the class
the user's standing instruction targets ("update the relevant
documentation to ensure alignment with the remediated codebase").

### 2.3 Verified-healthy (no action)

The session-26 drift remediation (the hero slide-3 image + the three
plain-`/shop` CTAs + the gap-1 cluster + the three-child mobile row) —
re-verified against the LIVE reference this round (the sweep + the
pins; no new drift). The payments date-range filter (PAY-OPS-3) —
holds (the E2E baseline re-ran its 4 date tests green). The 27th
mobile-nav token parity — holds. The `.env` / `.env.example` / db-path
contracts — current (no new env plumbing this round). The SEO/a11y/
CWV/INP standing gates — all green in the baseline re-run.

## 3. Fix design (validated against the codebase)

### 3.1 The pure seam `src/lib/admin-products.ts` (new file)

- `parseAdminProductFilters(params, categorySlugs)` — the raw
  searchParams record + the canonical category slug set (the PAGE
  fetches the slugs from the DB in the same query that feeds the
  island's Select options — the set is pure INPUT like
  `placedIntentIds`, never a Prisma import): `q` trimmed (undefined
  when empty), `category` validated against the passed set (anything
  else drops — a bad deep-link renders the unfiltered list, never an
  error), `visibility` validated against the two canonical values
  (`active` / `hidden`). Array params take their first value.
- `buildAdminProductWhere(filters)` — the composable-AND composition
  (the session-26 refactor's pattern): each active dimension
  contributes ONE element — `q` → `{ OR: [{ name: { contains } }, {
  slug: { contains } }] }` (the two identifiers an operator relays);
  `category` → `{ category: { slug } }` (Prisma's relation filter —
  no id mapping needed); `visibility` → `{ isActive: true/false }`.
  One element renders bare; two or more AND together; no filters →
  `{}`. Unit-pinned at the seam (the admin-orders/admin-payments
  precedent: the shop's parser stays page-local for parity reasons,
  the admin surfaces get the lib seam).
- `ADMIN_PRODUCT_VISIBILITY_OPTIONS` exported for the island's Select
  (All / Active / Hidden).

### 3.2 The filter island `src/components/account/admin-product-filters.tsx` (new file)

Mirrors `AdminPaymentFilters`/`AdminOrderFilters` (the ADMIN-SEARCH-1
anatomy): the Search-led q form (placeholder "Search by name or
slug...", `aria-label="Search products"`), the category Select
(`w-[150px]`, "All Categories" + the fetched options — value slug,
label name), the visibility Select ("All" / "Active" / "Hidden"), and
the conditional Clear button (`hasFilters` = any of the three active).
Select changes and form submits push MERGED params via `router.push`
in the CANONICAL order (category, q, visibility — the props are the
PRE-navigation state, so a Select change would otherwise append its
key last: the session-26 URL-order lesson applied from the start); the
input re-syncs from the URL with the adjust-during-render pattern.

### 3.3 The page wiring `src/app/(storefront)/admin/products/page.tsx`

- Fetch `db.category.findMany({ orderBy: { sortOrder: "asc" } })` (the
  island's options + the parser's validation set — one query).
- `await searchParams` → `parseAdminProductFilters(params, slugs)` →
  `buildAdminPaymentWhere`-style where → the SAME `findMany` (orderBy
  sortOrder asc, `include: { category: true }`) + `db.product.count({
  where })` and the unfiltered total for the count line.
- The count line: "12 products" unfiltered / "3 of 12 products"
  filtered (the honest filtered-of-total shape — the products list
  carries no take bound, so no "100+" form).
- The guided empty state (the family's copy shape): "No products match
  your filters." + the "Clear all filters" affordance (the island's
  Clear — `hasFilters` is active by construction when the state is
  empty-but-filtered).
- The sr-only h2 ("Products list", session-25's A11Y-HEADING-1) stays;
  the island renders above the card; the rows/stock/eye seams are
  untouched. Zero parity risk — admin-only surface.

### 3.4 The tests

**Unit** (`src/lib/admin-products.test.ts`, ~+12): the parse — q
trimmed/kept, empty q → undefined, array params, category validated
(valid kept / invalid dropped / not-in-passed-set dropped), visibility
validated (active/hidden kept, invalid dropped), all-bad → empty
filters; the where — q-only bare OR, category-only bare relation,
visibility-only bare isActive, q+category AND-of-2, category+visibility
AND-of-2, q+category+visibility AND-of-3, no filters `{}`.

**E2E** (`tests/e2e/admin.spec.ts`, +6): the q deep-link
(`?q=headphone` → exactly the Wireless Headphones row + "1 of 12
products"); the category deep-link (`?category=electronics` → 3 rows +
"3 of 12 products"); the visibility deep-link (toggle Ceramic Planter
hidden via the row's eye → `?visibility=hidden` → exactly 1 row →
restore the toggle — the canonical-state-restore pattern, the seed's
upsert re-restores `isActive: true` every global-setup as the
run-to-run backstop); the combined shape (`?category=electronics&q=
speaker` → 1 row); the empty state + Clear (`?q=zzzzz` → "No products
match" + Clear → the full 12); the bad deep-link fall-through
(`?category=not-a-slug` → 12 rows, the family contract).

**A11y pin evolution** (documented, the session-25 precedent): the
admin gate's products census pin ({color-contrast} × 7) is
re-calibrated on the GREEN code via the standalone axe probe if the
island adds contrast-flagged nodes (the search placeholder/Select
trigger family) — node-enumerated, never guessed.

### 3.5 The docs

AGENTS.md (the ADMIN-PRODUCTS-1 contract), CLAUDE.md (the session-27
contract + **the stale Build Commands counts corrected: 198→208,
217→225**), README.md (the products-console row + **the 13→15 models
correction + the 25→27 consecutive-verifications correction**), PAD
v1.27 (ADR-035 + the revision row + **the Key Files 13→15 models
correction**), `ecommerce-store_SKILL.md` v1.27.0 (the ADR-035 index
entry), `docs/session_53.md`, the worklog, this plan's sign-offs
after the push.

## 4. TDD plan

1. **RED (unit)** — write `src/lib/admin-products.test.ts` first; the
   module does not exist → the import fails → RED for the right
   reason (the seam-missing class, the sessions 13/24 precedent).
2. **RED (E2E)** — add the 6 products-filter tests to `admin.spec.ts`;
   verify they fail against the current code for the RIGHT reasons
   (the page ignores `?q/?category/?visibility` → all 12 rows render;
   the empty state does not exist).
3. **GREEN** — §3.1 the seam → §3.2 the island → §3.3 the page
   wiring, in that order. Full unit green; the targeted admin spec
   green; the a11y admin gate green (recalibrate the products pin if
   the probe shows new nodes — document the evolution).
4. **Mutation efficacy (×3, each reverted, verified byte-exact
   against pre-mutation backups):**
   - **M1** the q OR element reduced to name-only → the unit where
     test (slug-only match) FAILS.
   - **M2** the category validation dropped (any string kept) → the
     unit bad-category parse test FAILS (the E2E fall-through is
     behaviorally identical — the seam owns the contract, the
     session-24 documented precedent).
   - **M3** the visibility clause dropped from the where → the
     visibility E2E test FAILS (all 12 rows render).
5. **Full gate** — `bun run lint && bun run typecheck && bun run test
   && bun run build && bun run test:e2e` — two consecutive full E2E
   runs on the FINAL code (foreground runs — the detached-launch
   reaping lesson).
6. **Live re-verification** — the single-invocation battery on the
   :3000 production server (the rebuilt standalone): the pixel sweep
   (all 8 routes in-band), the console census extended with the
   products-filter variants (`?q=`, `?category=`, `?visibility=`),
   the standing watches.
7. **Screenshots 146-150** — the products filter surface live (the q
   deep-link, the category deep-link, the visibility deep-link), the
   unit gate, the E2E gate. VLM-verified.
8. **Docs** — §3.5; `.env.example` verified current (no new env
   plumbing this round).

## 5. Sign-off criteria

- [x] Baseline gate green at audit start (lint 0/0 · tsc clean ·
      208/208 unit+integration · build exit 0 · the full E2E baseline
      re-run 225/225 pre-change)
- [x] The Round-27 live battery GREEN at audit start (the sweep
      in-band — no new drift; the 27th mobile-nav token parity; the
      watches + census clean)
- [x] ADMIN-PRODUCTS-1 shipped: `?q=` + `?category=` + `?visibility=`
      deep-linkable filters on the products console list with an
      honest count line + a guided empty state; unit + E2E pinned
- [x] Mutation efficacy ×3, each reverted
- [x] RED → GREEN documented for every new test
- [x] Full gate green ×2 consecutive full E2E runs on the FINAL code;
      the total test count grows 433 → ~451 (no test removed or
      weakened)
- [x] Live re-verification: the battery re-run post-change; the
      products filter variants added to the console census
- [x] Screenshots 146-150 under `docs/screenshots/` + VLM-verified
- [x] Docs updated (AGENTS/CLAUDE/README/PAD v1.27/SKILL v1.27.0/
      session_53/worklog) **incl. the DOCS-ALIGN-1 stale-count
      corrections**; `.env.example` verified current
- [x] Committed on `main` + pushed via the SSH wrapper (remote
      verified; the operator key shredded)
