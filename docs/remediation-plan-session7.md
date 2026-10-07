# Remediation Plan — Session 7 Review (Round-7 Differential Audit)

**Date:** 2026-10-07/08
**Repo:** `nordeim/ecommerce-store` (branch `main`, baseline `44f1558`)
**Author:** Review/build agent (Super Z)
**Scope:** Live differential audit (round 7) of the LUXE Store clone against the
reference (`fuzzy-lumina-style-hub.base44.app`). Six prior rounds have closed
every known visual-parity gap and hardened the superset (stock enforcement,
redirect-after-login). Round 7 shifted weight to: (a) the standing user
priorities — mobile navigation (6th verification, Tailwind v4 watch) and
reference drift on all pinned surfaces; (b) **fresh-clone reproducibility**
(a fresh `git clone` was this session's starting point — and its gate failed);
(c) the PAD §11 round-7 candidates (admin order-detail view + admin E2E
expansion). The `skills/` folder is excluded from code checking, testing and
compilation per the operating contract.

**Method:** Fresh clone → full verification gate → agent-browser sessions
(`ref` = production reference logged in as the operator account, `clone` =
local dev server on the current commit) with DOM/computed styles as ground
truth. Superset sweeps: admin console (dashboard/orders/products), newsletter
API idempotency + validation, isActive enforcement audit (grep across shop,
home, PDP, search, sitemap).

---

## 1. Baseline verification (state at audit start)

| Gate | Result |
|---|---|
| `bun run lint` | 0 errors, 0 warnings |
| `bun run typecheck` | clean |
| `bun run test` (Vitest) | 76/76 passed |
| `bun run build` | **21 routes compile, but script exits 1** — `cp: cannot stat 'public'` (BUILD-1) |
| `bun run test:e2e` (Playwright) | 112/112 passed (188 total) |
| DB contract | `db/custom.db` at repo root; sandbox-injected `DATABASE_URL=/home/z/my-project/db/custom.db` converged via hard link (inode 305049); canonical state (12 products, 3 demo orders) |
| Docs | AGENTS/CLAUDE/README/PAD v1.6/SKILL v1.6.0 all current through session-6 (188-test gate) |

## 2. Audit results

### Verified at parity this round (no action required)

- **Mobile navigation menu (6th re-verification, standing user priority):**
  overlay `fixed z-50 gap-4 bg-background p-6 shadow-lg … inset-y-0 left-0
  h-full border-r … w-72 sm:max-w-sm` — 288×844 @ (0,0) on both sites, nav
  wrapper `flex flex-col gap-4 mt-8`, all 5 links byte-identical (text +
  hrefs). The v4 trap-log #5 pin holds; **no Tailwind v4 regression** anywhere
  in the mobile sweep. Reference quirk re-confirmed: its menu stays OPEN after
  a nav-link click; the clone auto-closes (registered superset divergence).
- **Home (drift re-check):** `main > DIV` wrapper with 8 children, identical
  classes and order (hero, features, divider, Trending, Categories, New
  Arrivals, divider, On Sale); both `shrink-0 bg-border h-[1px] w-full
  max-w-7xl mx-auto` dividers present.
- **Shop (drift re-check):** h1 "All Products", 24 product links, identical
  order (first 3 + last 2 spot-checked byte-identical).
- **PDP (drift re-check):** `document.title` "Wireless Headphones | Lumina"
  (humanized slug), h1, $299.99 price, Description/Reviews (234)/Shipping
  tabs, related products (speaker + pad) — all identical.
- **Login (drift re-check):** title/h1/inputs/buttons identical (the clone's
  4 extra `hidden` inputs are Next.js server-action plumbing — invisible).
- **In-chrome "Product not found" block (unknown slug):** wrapper
  `max-w-7xl mx-auto px-4 py-20 text-center`, h2 `text-2xl font-bold mb-4`
  "Product not found", "Back to Shop" primary button — identical anatomy.
- **Newsletter API:** idempotent (repeat subscribe → same neutral success),
  invalid email → `Enter a valid email address`.
- **Admin console (superset):** dashboard stats + recent orders render; orders
  list with inline status Select; products page stock forms. No horizontal
  overflow at 390px (round-6 verified; unchanged).

### Superset verification (no action required)

- `isActive` is enforced on every read surface (grep audit): shop, home
  (trending/new/sale), PDP (+related), `/api/search`, sitemap.xml. The admin
  visibility toggle is wired end-to-end.
- `updateOrderStatusAction` writes `OrderEvent` rows (`status_changed`) with
  an old→new + actor note; `placeOrderAction` writes the `placed` event —
  the data for a timeline exists (but is rendered nowhere — ADMIN-DETAIL-1).

## 3. Issue inventory

### BUILD-1 — Fresh clone fails `bun run build` (missing `public/`)
- **Severity:** High (the repo's own verification gate is unrunnable from a
  fresh clone — reproducibility)
- **Evidence (live, 2026-10-07):** `git clone` → `bun install` → `bun run
  db:setup` → `bun run build` compiles all 21 routes then exits 1:
  `cp: cannot stat 'public': No such file or directory`. `git ls-files |
  grep ^public/` → 0 files: the directory was never committed; prior sessions
  had it only as an untracked local artifact. `next build` itself succeeds —
  only the standalone-assembly `cp` step fails — but the gate checks the
  script's exit code.
- **Design decisions:**
  - Commit `public/.gitkeep` so the directory exists in the repo (future
    static assets have a home; the standalone copy step always has a source).
  - Harden the build script: `mkdir -p public` before the copies — the gate
    then passes even if a checkout loses the empty dir (git cannot
    distinguish an empty dir, so the .gitkeep is the repo-side belt).
  - No route/config changes; standalone output unaffected.

### FAVICON-1 — No favicon (reference serves one)
- **Severity:** Low (polish/parity: browser tab icon; every page load 404s
  `/favicon.ico`)
- **Evidence (live):** the reference injects `<link rel="icon"
  href="https://media.base44.com/images/public/69d296f5d1237b9a1afec899/76cff797e_logo.png">`
  (its `/favicon.ico` 302s to the same logo). The clone serves no icon link
  and 404s `/favicon.ico`.
- **Design decisions:**
  - Add `metadata.icons` to the root layout pointing at the reference CDN
    logo — the repo's established remote-CDN pixel-parity pattern (product
    imagery already lives on `media.base44.com` by design). Zero binary
    files, byte-identical icon.
  - `/favicon.ico` itself stays 404 (the reference's is a platform 302 — an
    SPA artifact; the `<link rel=icon>` is what browsers honor).
  - Pinned by an E2E assertion (icon link present with the exact href).

### TITLE-NF-1 — PDP not-found `document.title` diverges from the reference
- **Severity:** Low (parity on a reachable surface: bad deep links)
- **Evidence (live):** for `/product/wireless-noise-cancelling-headphones`
  (unknown slug) the reference titles the page **"Wireless Noise Cancelling
  Headphones | Lumina"** (humanized slug — its SPA derives metadata from the
  URL regardless of resolution); the clone titles it **"Product Not Found |
  Lumina"**. The in-chrome not-found BLOCK itself is at parity (verified
  above) — only the title differs.
- **Design decisions:**
  - `generateMetadata` in `product/[slug]/page.tsx` returns
    `humanizeSlug(slug)` unconditionally (the existing seam in
    `src/lib/format.ts`); the page body keeps the not-found branch.
  - The smoke spec's existing not-found assertions (block anatomy, Back to
    Shop) stay; a title assertion is added.

### ADMIN-DETAIL-1 — No order-detail view; OrderEvent timeline rendered nowhere
- **Severity:** Low (superset completeness — PAD §11 round-7 candidate; the
  audit trail exists only in the DB)
- **Evidence (code + live):** `OrderEvent` rows are written by
  `placeOrderAction` (`placed`) and `updateOrderStatusAction`
  (`status_changed`, note `old → new by actor`), but `grep OrderEvent
  src/app src/components` → zero renders. The admin orders page links
  nowhere except "← Admin"; order lines, the JSON shipping-address
  snapshot, payment method and cardLast4 are displayed on no admin surface.
- **Design decisions:**
  - New server page `/admin/orders/[id]` (admin-gated like every `/admin*`
    route: anonymous → `/login?redirect=…`, non-admin → `/`):
    - Header: order number, status badge, total, customer email, placed
      date, payment method (+ card last4 when present).
    - Shipping address card: the parsed JSON snapshot (name, street, city,
      state, zip) — read-only.
    - Line items table: image snapshot, name snapshot, unit price, quantity,
      line total.
    - **Timeline card**: every `OrderEvent` in chronological order (icon +
      type + note + timestamp) — the round-7 candidate delivered.
    - Unknown order id → a small in-admin "Order not found" block (not the
      platform 404 — the admin is an in-chrome superset surface).
  - Link the order number on the admin orders list (`AdminOrderRow`) and the
    dashboard's Recent Orders rows to the detail page (`Link` wrapping the
    number; the row keeps its inline status Select — the existing seam).
  - Read-only page (status changes stay on the list row's Select — one
    mutation seam, no duplication); pure superset surface, no parity
    constraint, styling follows the admin console's existing card system.

### ADMIN-COV-2 — Admin console E2E coverage is stock-form-only
- **Severity:** Medium (test debt — PAD §11 round-7 candidate; regressions in
  admin mutations beyond stock would not fail CI)
- **Evidence:** only `stock.spec.ts` drives the admin (its `adminLogin`
  helper + async Save wait); dashboard stats, the order-status combobox, and
  the visibility toggle have zero E2E coverage.
- **Fix:** new `tests/e2e/admin.spec.ts` (reusing the stock spec's
  `adminLogin` pattern — second browser context, own rate-limit bucket):
  1. guest gating: `/admin` (no session) → `/login?redirect=/admin` (a
     storageState opt-out test at the top, mirroring guest-cart's pattern).
  2. dashboard renders: "Admin Dashboard" h1, the four stat cards
     (Revenue/Orders/Products/Customers), Recent Orders list.
  3. order-status transition: open `/admin/orders`, change ORD-2026-001's
     status via the combobox, assert the badge updates; open the order's
     detail page and assert the timeline shows a `status_changed` event
     naming the transition (drives ADMIN-DETAIL-1's UI too). Restore the
     original status afterward (leave the shared e2e DB canonical).
  4. visibility toggle: hide a product on `/admin/products`, assert it
     disappears from `/shop`, re-show it, assert it returns.
  5. order-detail page: renders number/items/timeline for a seeded order.
- Stock-form coverage stays in `stock.spec.ts` (no duplication).

### REDIRECT-2 — Admin sub-pages gate guests with the dashboard's path, not their own
- **Severity:** Medium (superset UX; the session-6 ADR-014 spec said "every
  `/admin*` page gates to `/login?redirect=<their path>`" — the
  implementation hardcoded `/admin` on all three pages)
- **Evidence (E2E, found by this round's new admin.spec.ts during RED):** a
  guest on `/admin/orders` (or `/admin/products`) is sent to
  `/login?redirect=/admin` — after login they land on the dashboard, not
  the orders/products page they wanted. `/admin` itself and `/account`
  carry their own paths correctly.
- **Design decisions:** each admin page redirects with its OWN path
  (`/login?redirect=/admin/orders`, `.../admin/products`); the new
  order-detail page follows the same rule with its full dynamic path.
  `validateRedirectPath` already accepts these shapes (leading-slash,
  same-origin, multi-segment) — unit-pinned since session-6; no validator
  change needed.

### DEPS-1 — Six unused dependencies in package.json
- **Severity:** Low (hygiene; install surface + audit surface)
- **Evidence (grep across `src/`):** `z-ai-web-dev-sdk` (0 imports),
  `zustand` (0), `@radix-ui/react-toast` (0 — the toast viewport is custom,
  ADR-011), `@radix-ui/react-alert-dialog` (0), `@radix-ui/react-popover`
  (0), `tailwindcss-animate` (0 — globals.css imports `tw-animate-css`, the
  v4 replacement). All other deps have live imports (react-dialog,
  -label, -select, -tabs, -slot, -radio-group, cva, tailwind-merge,
  lucide-react).
- **Fix:** remove the six from `package.json`, regenerate `bun.lock`
  (`bun install`), re-run the gate. Zero behavioral change (no imports
  exist); follows the DEAD-1 precedent (dead-code removal).

## 4. Dependency sweeps (validated before writing this plan)

- No E2E spec pins the absence of a favicon/icon link (grep: `favicon|icon`
  in specs → only Radix/lucide matches); adding `metadata.icons` cannot break
  the parity suite (it adds a `<link>` in `<head>`, which the specs never
  assert on).
- `storefront-parity.spec.ts` asserts computed styles on BODY-level
  surfaces; a head link is invisible to it.
- The smoke spec asserts the not-found page's BLOCK copy but not its title
  (grep: `Product not found` → block assertions only) — TITLE-NF-1's change
  (title only) is unpinned; the new assertion is additive.
- `product/[slug]/page.tsx` currently computes metadata with a found-branch
  humanized title and a not-found fallback ("Product Not Found"); the h1 and
  in-chrome block are untouched by the change.
- `/admin/orders/[id]` introduces the first dynamic segment under
  `/admin/orders` — no route collision (the list page is `/admin/orders`
  itself); route count 21 → 22 (docs updated).
- `AdminOrderRow`'s number `<p>` becomes a `Link` — the stock spec and no
  other spec asserts on that `<p>` (grep: specs target `Save`, stock inputs,
  statuses via combobox labels only).
- The admin status-combobox E2E mutates shared e2e-DB state (ORD-2026-001
  status) — the spec restores the original status at the end (and
  `e2e-reset.ts` clears transient state per run anyway; seeded demo orders
  are upserted with their canonical statuses every run).
- The visibility-toggle E2E hides a product then re-shows it; even if a run
  aborts mid-test, the next run's global-setup reseed restores `isActive:
  true` (upsert).
- Removing the six deps: `bun.lock` regenerated; `next build` does not type-
  check (ignoreBuildErrors) but `tsc`/lint/vitest/playwright all pass without
  the packages (no imports). `prisma` stays (CLI + client are used).
- `mkdir -p public` in the build script is POSIX-portable and idempotent;
  CI/CD doc (§9.4) references the same five commands — unchanged.

## 5. TDD execution plan

| # | Task | Test first (RED) | Implementation (GREEN) |
|---|---|---|---|
| T1 | BUILD-1 | Reproduced live (build exit 1 on the fresh clone — the session's own starting state) | `mkdir -p public` in the build script + commit `public/.gitkeep`; verify with `rm -rf public && bun run build` passing |
| T2 | FAVICON-1 | E2E (smoke): head carries `link[rel=icon]` with the exact CDN href — fails pre-fix (no link) | `metadata.icons` in `src/app/layout.tsx` |
| T3 | TITLE-NF-1 | E2E (smoke): `document.title` of an unknown PDP slug equals the humanized slug + " \| Lumina" — fails pre-fix | `generateMetadata` humanizes unconditionally in `product/[slug]/page.tsx` |
| T4 | ADMIN-DETAIL-1 | E2E (new admin.spec.ts §5): `/admin/orders/<seeded id>` renders number, a line item, and the placed event — fails pre-fix (404) | New `src/app/(storefront)/admin/orders/[id]/page.tsx` + number links in `AdminOrderRow` + dashboard recent orders |
| T5 | ADMIN-COV-2 | New `tests/e2e/admin.spec.ts` (gating + dashboard + combobox transition + visibility toggle + detail page) — gating/dashboard/toggle pin current-good behavior (pass pre-fix where behavior exists); combobox timeline assertion lands with T4 | — |
| T6 | DEPS-1 | (n/a — pure removal; the gate is the test) | Remove 6 deps from `package.json`; `bun install`; gate re-run |
| T7 | Gate + docs + ship | Full gate; live re-verification; screenshots (41-44); AGENTS/CLAUDE/README/PAD v1.7/SKILL v1.7.0 updates; plan check-off; session log; worklog; commit + SSH push | — |

## 6. Sign-off criteria — ALL MET

- [x] All RED tests verified failing for the right reasons before fixes
      (smoke title — received "Product Not Found | Lumina"; smoke favicon —
      no link; admin order-detail — no route/link; admin guest gating —
      REDIRECT-2 surfaced as a real gap at the sub-page assertion;
      dashboard + visibility tests written as additive pins)
- [x] Full gate green: lint 0/0 · tsc clean · 76/76 unit · **build exit 0**
      (22 routes) · **118/118 E2E = 194 total** (was 188; +1 smoke, +5
      admin, none removed) — **run twice consecutively** to prove
      run-to-run determinism after the e2e-reset isolation fix
- [x] Fresh-clone simulation: `rm -rf public && bun run build` exits 0
- [x] Live re-verification (dev server, `scripts/verify-session7.ts`):
      favicon link present with the exact CDN href; unknown-slug title =
      humanized slug + the in-chrome block intact; guest /admin/orders →
      /login?redirect=/admin/orders; order-detail renders h1/shipping/
      placed event/line items; a live status transition lands in the
      timeline; status restored afterward
- [x] Screenshots (VLM-verified) under `docs/screenshots/`: 42 (order
      detail + timeline), 43 (orders list linked), 44 (PDP not-found
      title), 45 (dashboard) → 45 total
- [x] Docs updated: AGENTS.md (favicon + title + redirect + order-detail +
      one-main contracts; admin.spec selector quirks; e2e-reset isolation;
      build + deps conventions), CLAUDE.md (counts 194, ADR-015 bullets,
      spec list, 22 routes), README.md (194 tests, admin feature row,
      hierarchy, testing table), PAD v1.7 (ADR-015, §8.1 24-file/194-test
      table, §8.4 checklist, §11 three Resolved rows), SKILL v1.7.0
      (§9 rows 26-29, ADR index through 015); `.env.example` verified
      current (no new env plumbing — all four vars match `process.env`
      usage exactly)
- [x] Commit to main; SSH wrapper push; remote ref verified

## 7. Outcome notes

- **T1 (BUILD-1):** `public/.gitkeep` committed + `mkdir -p public`
  prepended to the build script's copy step. Verified both ways: the
  session's own fresh clone (build exited 1 at baseline → 0 after) and the
  deliberate `rm -rf public && bun run build` simulation.
- **T2 (FAVICON-1):** `metadata.icons` in the root layout → the reference's
  CDN logo URL (the repo's remote-CDN pixel-parity pattern; zero binaries).
  Pinned by a new smoke test asserting the exact href. `/favicon.ico`
  deliberately stays 404 (the reference's is a platform 302).
- **T3 (TITLE-NF-1):** PDP `generateMetadata` returns `humanizeSlug(slug)`
  unconditionally; the in-chrome not-found block is untouched. The smoke
  not-found test now asserts the title.
- **T4 (ADMIN-DETAIL-1):** `/admin/orders/[id]` (read-only, admin-gated,
  full-path guest redirect) renders the customer block, shipping snapshot,
  item snapshots, and the chronological OrderEvent timeline; order numbers
  deep-link from the list rows and the dashboard's Recent Orders; unknown
  ids render an in-admin not-found block. ADR-015 records the design.
- **T5 (ADMIN-COV-2):** `tests/e2e/admin.spec.ts` — guest gating (opt-out
  context), dashboard stats (scoped to the stats grid — the header
  "Orders" link is a strict-mode trap), order-detail content, combobox
  status transition landing in the timeline (with restore), visibility
  toggle enforced on /shop. `adminLogin` promoted to `helpers.ts` (shared
  with stock.spec.ts; one login per file via beforeAll — rate-limit
  friendly).
- **REDIRECT-2 (found during RED, not in the original plan):** the admin
  sub-pages' guest redirects now carry their own full paths
  (`/admin/orders`, `/admin/products`); the new detail route follows the
  same rule. The E2E guest test caught it — exactly the coverage gap
  ADMIN-COV-2 was filed against.
- **MAIN-NEST-1 (found during live verification):** every admin page had a
  nested `<main>` inside the storefront layout's `<main>` (invalid HTML;
  pre-existing). All four admin pages now wrap in
  `<div className="flex-1">` — one landmark per page, owned by the layout.
- **Run-to-run isolation (found during GREEN):** the first post-fix full
  run failed the dashboard + timeline tests — spec-placed orders from
  PRIOR runs had accumulated in the persisted `db/e2e.db` (placedAt=now),
  pushing the demo fixtures out of the dashboard's take:5 Recent Orders
  while duplicate status_changed events tripped strict mode.
  `prisma/e2e-reset.ts` now deletes non-canonical orders + demo-order
  status_changed events and restores canonical statuses every run;
  `prisma/dev-cleanup.ts` mirrors this for the dev DB (plus demo-timeline
  cleanup). Proven by two consecutive 118/118 runs.
- **DEPS-1:** six zero-import dependencies removed
  (`z-ai-web-dev-sdk`, `zustand`, `@radix-ui/react-toast`,
  `@radix-ui/react-alert-dialog`, `@radix-ui/react-popover`,
  `tailwindcss-animate`); `bun.lock` regenerated; gate green.
- **Test bugs fixed during GREEN (not code bugs):** the guest-gating regex
  expected percent-encoded redirect params (the address bar keeps raw
  slashes); the stat-label loop hit the header "Orders" link (strict mode)
  → scoped to the stats grid; dev-mode live-verification needed a
  settle-and-retry login pattern (repo-file edits under a running
  `next dev` trigger Fast Refresh reloads mid-fill — documented as SKILL
  row 29).
- **Live-verification tooling:** `scripts/verify-session7.ts` +
  `scripts/capture-session7.ts` added (Playwright-driven, direct
  connection — the session-6 proxy lesson applied).
