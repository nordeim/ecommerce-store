# CLAUDE.md

IMPORTANT: File is read fresh for every conversation. Be brief and practical.

## 1. Core Identity & Purpose

**LUXE Store** (`package.json` name: `luxe-store`) is a production-grade e-commerce storefront with an admin console — a self-hosted clone of the reference app at `fuzzy-lumina-style-hub.base44.app`, rebuilt as a single Next.js application with real persistence. It is maintained as a solo/agent-driven project (repo `nordeim/ecommerce-store`). The defining technical decision: **visual parity with a Tailwind v3 reference app, delivered on Tailwind v4 via pinned design tokens**, with the reference's mock/demo behavior replaced by database-backed commerce (cart, wishlist, orders, auth) — a functional superset.

## 2. Foundational Principles — The Meticulous Six-Phase Workflow

1. **ANALYZE** — Read the affected files completely; reproduce any failure before changing code; re-measure the reference when visual parity is in question (computed styles, not screenshots).
2. **PLAN** — Structure the change as vertical slices (one seam, one test, one implementation). Present the plan for confirmation before large refactors.
3. **VALIDATE** — Confirm the plan against acceptance criteria and the constraints below before implementing.
4. **IMPLEMENT** — Modular, typed, Zod-validated mutations; server-re-derived money; no client-trusted prices.
5. **VERIFY** — Run the gate: `bun run lint && bun run typecheck && bun run test && bun run build && bun run test:e2e`. All green or explicitly reported.
6. **DELIVER** — Conventional Commits, docs updated (this file + AGENTS.md + PAD when architecture changes).

Project-specific principles: never weaken a trap-log pin to make something pass; never delete a test to ship; superset features must not change the resting visual of parity surfaces.

## 3. Implementation Standards

### TypeScript (strict)
- No `any` — use `unknown` + narrowing. No `@ts-ignore`.
- `interface` for object shapes; `type` for unions. Early returns over nesting.
- Server actions return `ActionResult<T>` (defined in `src/lib/actions/auth.ts`) — never throw across the action boundary.

### Next.js 16 (App Router)
- Server Components by default; `"use client"` only for interactive islands (store chrome, checkout wizard, account tabs, admin rows).
- **Route groups own the chrome**: `app/layout.tsx` is a minimal shell; `app/(storefront)/layout.tsx` carries the shopper chrome + store hydration; `app/(auth)/` renders login/register/forgot-password standalone (no header/footer — reference parity), each as a server `page.tsx` owning `Metadata` + a `*-form.tsx` client island; the root `not-found.tsx` is the reference's chrome-less platform 404 (v3 slate palette, pinned). Unknown product slugs render an in-chrome "Product not found" block.
- `params`/`searchParams`/`cookies()`/`headers()` are **async** — always `await`.
- Server Actions for all UI mutations; route handlers only for `/api/health`, `/api/search`, `/api/newsletter`.
- `export const dynamic = "force-dynamic"` on every DB-touching page/handler.
- Standalone output (`output: "standalone"`); `allowedDevOrigins` covers `127.0.0.1`.

### Tailwind CSS 4 (CSS-first)
- **No `tailwind.config.*`** — all tokens live in `src/app/globals.css` under `@theme inline` as full `hsl()` literals.
- The v3→v4 trap log (AGENTS.md + `docs/Tailwind-V4-Validation-Report.md`) is binding: pinned shadow scale, pinned radius scale, arbitrary hero gradient, no `space-y-*` + `mt-*` mixes in the mobile nav.
- No arbitrary `text-[13px]`-style one-offs; extend the theme instead.

### Data
- Prisma + SQLite (`db/custom.db`, schema-relative `file:../db/custom.db` — the resolution contract in `src/lib/db-path.ts` is test-pinned; don't inline it).
- **Catalog order is a parity contract**: `Product.sortOrder` = the reference's array position (1:1); seed `createdAt` is staggered by array position (drives "Newest" = reverse array order); "Top Rated" ties break by sortOrder. Do not reorder the seed without re-measuring the reference.
- **Money is a parity contract**: flat shipping below the $100 threshold is **$9.99** (`FLAT_SHIPPING_CENTS = 999`, unit-pinned); seeded demo orders store their own totals.
- **Auth forms are a parity contract (ADR-010/011)**: register collects exactly [Email, Password, Confirm Password] (no Name — the action derives a display name from the email local part via `deriveDisplayName`); password inputs show the `••••••••` placeholder (8-char minimum, no complexity rule); all three auth screens share the reference anatomy — header block OUTSIDE the card, `h-12` icon-led inputs, line-and-label "or" divider, tinted error BOX (`div.mb-4.p-3.rounded-lg.bg-destructive/10`) as the card's first child; forms rely on NATIVE `type=email` validation (no `noValidate`); error copy pinned ("Invalid email or password", "A user with this email already exists", "Passwords do not match"). `/forgot-password` is anti-enumeration (same neutral confirmation for every email, rate-limited 5/15min, no email sent — `console.info` seam). **Email verification (ADR-011)**: the reference gates registration behind a 6-digit "Verify your email" screen and blocks unverified logins — the clone ships the full machinery env-gated behind `AUTH_REQUIRE_EMAIL_VERIFICATION` (default OFF; no email provider is wired, codes log at the seam; E2E drives it via the seeded `unverified@example.com` fixture, code `123456`).
- **Toasts are part of the interaction contract (ADR-011)**: cart adds and wishlist ADDS toast "«name» added to cart!" / "… added to wishlist!" (dark bottom-right `ToastViewport`, CircleCheckBig accent, 3000ms, stacks); NO toast on wishlist remove. The region is `pointer-events-none` + `aria-live=polite` (registered divergences).
- **Wishlist hearts are a color contract (session-5)**: ACTIVE hearts are `fill-destructive text-destructive` (red rgb(239,67,67)) on both the PDP buy-panel heart (`h-5 w-5`, button `h-10 px-8` — 82px) and the card hearts; card hearts are MUTED inactive (`h-4 w-4 transition-colors text-muted-foreground`). The home page frames its sections with two `shrink-0 bg-border h-[1px] w-full max-w-7xl mx-auto` hairlines (after features, after New Arrivals). The reference's wishlist is cosmetic (no persistence, no entity fetch) — the clone's DB-backed wishlist is the superset.
- **Client store re-syncs from server truth (ADR-012)**: when a `router.refresh()` delivers fresh `initialCart`/`initialUser`/`initialWishlistIds` props, `StoreProvider` re-syncs via adjust-state-during-render (the "last seen props" in STATE, not a ref — the React Compiler `refs` rule forbids ref access during render). Found as CHECKOUT-BADGE-1: the header badge kept the stale cart count after order placement until a manual reload.
- **Cart steppers post DELTAS** (`adjustQuantity(itemId, ±1)` → `adjustCartItemAction` → transactional `changeQuantityBy`); remove is its own action. The old absolute-quantity API lost updates when two rapid clicks raced one re-render. Cart mutations resolve the guest token from the cookie (pinned by `guest-cart.spec.ts`).
- **Stock is server-enforced (ADR-013, session-6)**: cart adds/steppers CLAMP increases at the product's current stock (pure seam `clampToStock` in `src/lib/cart-quantity.ts`; decreases always pass; no reject — parity surfaces show no new error states); `placeOrderAction` re-reads stock per line INSIDE the transaction, rejects overselling with a customer-safe message ("Sorry, «name» only has N left in stock. Please update your quantity."), and decrements stock atomically with the order. The seed upsert restores `stock: 25` per run; `prisma/dev-cleanup.ts` restores it on the dev DB.
- **Redirect-after-login (ADR-014, session-6 + session-7)**: `/account` and `/admin*` gate guests to `/login?redirect=<their OWN path>` (admin sub-pages carry their full path — `/admin/orders`, `/admin/products`, `/admin/orders/<id>`); the login page (DYNAMIC — it reads `searchParams`) passes the target into the form island, which honors only `validateRedirectPath`-sanctioned same-origin relative paths (protocol-relative, backslash, scheme-bearing, bare-root, and oversized values fall through to `/account`).
- **The admin order-detail view (ADR-015, session-7)**: `/admin/orders/[id]` (admin-gated) renders the customer block, the parsed shipping-address snapshot, the OrderItem snapshots, and the chronological **OrderEvent timeline** — the audit trail `placeOrderAction`/`updateOrderStatusAction` write finally has a surface. Order numbers deep-link to it from the admin orders list and the dashboard's Recent Orders. Read-only (status changes stay on the list row's Select). Admin pages wrap in `<div className="flex-1">`, never a nested `<main>` (one landmark per page — the storefront layout owns `<main>`).
- **The admin orders list is URL-deep-linkable filterable (session-13, ADMIN-SEARCH-1, ADR-021)**: `/admin/orders` takes `?status=` (validated against the four canonical combobox statuses — invalid values fall through to the unfiltered list) and `?q=` (number OR email `contains`). Pure seam `src/lib/admin-orders.ts` (unit-pinned: 12 tests); the filter island mirrors `ShopFilters` (merged params via `router.push`); the count line makes the `take: 100` bound visible; the empty state offers "Clear all filters". Zero parity risk (admin-only surface). Pinned by 3 admin-spec E2E tests.
- **PDP document.title = humanized slug** ("Wireless Headphones | Lumina", not the product name — for every slug INCLUDING unknown ones, session-7; the in-chrome not-found block is unchanged); the h1 keeps the full name. The Reviews tab's empty panel is `div.text-center.py-10`; the Shipping tab is plain `p` elements with a literal `✓` prefix. The favicon follows the remote-CDN parity pattern (`metadata.icons` → the reference's media.base44.com logo, session-7).
- PDP "You May Also Like" = ALL same-category products excluding self (no cap/fill); shop chips appear for category + search only.
- **Auth field spacing is a computed-geometry contract (session-8, trap 8)**: label→input visual gap = 11px (3px inline strut + 8px margin) on every auth field — the input wrappers carry `mt-2` because v4's `space-y-2` margin is INERT on the inline `<label>` (v3 landed it on the block sibling). Pinned by `auth.spec.ts` (login/register/forgot gaps).
- **Account geometry contracts (session-8, corrected session-9)**: tablist→panel gap 24px (the Tabs root carries NO `space-y-*`; the TabsContent base `mt-6` supplies it); the profile form uses the reference's field pattern — INLINE `Label` + `Input className="mt-1.5"` (labels are 18px natural line boxes, NOT `mb-2 block`); the profile form is a FIELDS GRID (`grid grid-cols-1 sm:grid-cols-2 gap-4`) with the Save button OUTSIDE it as a flow child carrying `mt-4` — fit-content on every viewport (session-8's in-grid `sm:col-span-2 sm:w-fit` button stretched 308px-wide on mobile vs the reference's 127px; desktop computed values had coincided). Pinned by `account.spec.ts` (desktop + the session-9 mobile describe).
- **Account Orders row anatomy (session-9, ACCOUNT-ORDER-ROW-1)**: container `space-y-4` (16px); row `flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-secondary/30 rounded-xl gap-3` (tinted fill, NO border, stacks on mobile); order number `font-semibold`; total `font-bold`; status badge = the reference's button-class pill (`rounded-full` + shadow) with STATUS_STYLES: delivered → `bg-primary text-primary-foreground`, in_transit → `bg-secondary text-secondary-foreground` (unmeasured statuses default secondary). Pinned by `account.spec.ts`.
- **Social/PWA head layer (session-9, METADATA-OG-1)**: every route's head is built by `pageMetadata()` in `src/lib/metadata.ts` (og:title = document title; og:description = "«Page» on Lumina. " + SITE_DESC on static pages, plain SITE_DESC on home/PDP/404; og:image = the site LOGO site-wide; og:url canonical WITH the query — shop uses `generateMetadata`); the PDP renders its twitter tags via React-19-hoisted `<meta>` elements because the Metadata API cannot express twitter title/description/image WITHOUT card/url (Next force-defaults `twitter:card` when the typed twitter field has images). Root layout: `appleWebApp` PWA metas (Next itself emits `mobile-web-app-capable` — do not duplicate). Pinned by `metadata.test.ts` + smoke spec.
- **Shop sort trigger width (session-9, SORT-W-1)**: `w-[150px]` (the clone's old `w-[170px]` was the single arbitrary-width drift in the global sweep). Pinned by `storefront-parity.spec.ts`.
- **Hero h1 line-height follows the v3 cascade (session-10, HERO-LH-1, trap 10)**: the class string is byte-identical to the reference's (`…text-3xl sm:text-4xl lg:text-5xl… leading-tight`) plus two cascade pins — `sm:leading-[2.5rem] lg:leading-none` — because v3 lets the responsive text utilities re-override the base leading at ≥640/≥1024 (40px/48px) while v4 lets `leading-tight` win everywhere (45/60px). Line-heights are 37.5/40/48px at <640/640–1023/≥1024. Pinned by `storefront-parity.spec.ts`.
- **Hover semantics are v3 (session-10, HOVER-GATE-1, trap 11)**: `globals.css` carries `@custom-variant hover (&:hover);` — v4.3's default gates every hover-family utility (plain `hover:*`, `group-hover:*`, breakpoint compounds) behind `@media (hover: hover)`, which kills all hover styling in touch/hybrid contexts where the reference (v3) still renders it. Never re-add the gate. v4's `scale-*` sets the CSS `scale` property (not `transform`) — hovered-card assertions read `getComputedStyle(img).scale`. Pinned by the storefront-parity touch-context spec (iPhone-14 context, `(hover: hover)` false, card img `scale: 1.05` + title `rgb(230, 107, 26)`).
- **Hero inactive slides are inert (session-11, A11Y-FOCUS-1)**: the carousel's inactive slides carry `aria-hidden` AND `inert` (media slide + text block) — `aria-hidden` alone left the invisible slides' CTA links tabbable (Tab from the active CTA landed on "Explore"/"Browse"; the reference's DOM-swap exposes only the active CTA). Tab order now matches the reference exactly: CTA → prev → next → dots. Pinned by the storefront-parity spec.
- **Typography is FILE parity (session-11, traps 12–13)**: the body carries NO `antialiased` (the shadcn v4 starter default; the reference computes `-webkit-font-smoothing: auto`), and the site font is the reference's EXACT Google-served woff2 self-hosted at `public/fonts/plus-jakarta-sans.woff2` + a plain `@font-face` (family "Plus Jakarta Sans", `font-weight: 200 800`, `display: swap`) — next/font's repackaged copy strips the `prep` hinting table and rasterizes differently (halo on every glyph; pixel diffs 1–4.8%). `--font-sans: "Plus Jakarta Sans", sans-serif` (the reference's exact computed stack; no next/font variable, no "Fallback" companion face). Pinned by the storefront-parity font spec (faces/stack/canvas 1009px/27,348-byte file).
- **PDP visual contracts (session-8)**: star rating = flat 5-star row (`flex items-center gap-1`), floor(rating) amber + rest `text-border` (no half-stars/rounding — 4.8 renders 4+1); breadcrumb = `gap-2 mb-8` (no flex-wrap — the PDP's whole vertical rhythm hangs off it); feature bar + PDP feature row icons = lucide `shield` + `rotate-ccw` (not shield-check/refresh-cw); search-dropdown categories render lowercase. Unknown-route 404 titles follow `notFoundPageTitle` (last letter-bearing segment, humanized — `/foo/bar-baz` → "Bar Baz | Lumina", `/12345` → plain "Lumina"), rendered by the `[...notFound]` catch-all through the shared `Platform404` component.
- **A11y-hard contracts (session-12, ADR-020):** exactly ONE `<main>` per page — the (storefront) layout owns it; every content page (admin + account/checkout/success/wishlist) wraps in `div.flex-1`, never a nested `<main>` (the session-1 nested mains survived eleven rounds invisible to computed-style audits; the axe differential exposed them). ARIA labels never land on role-less divs (axe `aria-prohibited-attr`): the toast viewport is a nameless `aria-live=polite` region; the star-rating row is `role="img"` + `aria-label`. Security headers ship via `next.config.ts` `headers()`: the reference's three (referrer-policy / nosniff / HSTS — HTTP no-op per RFC 6797 §7.2) + `X-Frame-Options: DENY` superset. All pinned by the storefront-parity + smoke specs.
- **CSP ships via the proxy nonce pipeline (session-14, ADR-022, SEC-CSP-1):** `src/proxy.ts` (Next 16's renamed middleware convention) mints a per-request nonce and sets the CSP on both the request headers (Next nonces its scripts from it) and the response (browser enforcement). Directive set pinned to the measured footprint — sole image host `media.base44.com`, self-hosted font, same-origin connect; `style-src 'unsafe-inline'` as framework insurance; NO `upgrade-insecure-requests` (breaks plain-HTTP localhost). `/register` + `/forgot-password` are `force-dynamic` (per-request nonces need per-request rendering; they were the only static HTML pages). Pinned by the smoke spec: header + directive census, nonce per-request uniqueness, and EVERY SSR script nonced on / and /register. The full E2E suite is the hydration regression net — a broken nonce pipeline fails it loudly (inputs wiped, actions dead).
- **The a11y parity profile is a regression-pinned standing gate (session-15, ADR-023, A11Y-GATE-1):** `tests/e2e/accessibility.spec.ts` runs self-hosted axe-core (pinned devDependency) on home/shop/PDP/cart/account/login after a scrolled-reveal pass and asserts the census is EXACTLY `{color-contrast}` with pinned node counts (28/23/14/8/8/3 — byte-identical to the reference's; the shared parity trait). Any other rule firing is a regression; mutation-proven (a re-introduced `aria-label` on the toast viewport fails as `aria-prohibited-attr`). The gate runs on every `test:e2e` — session-12's manual differential is now permanent.
- **The a11y gate spans BOTH viewports + the admin console (session-16, ADR-024, A11Y-GATE-2):** the same spec's `a11y mobile gate` describe (`test.use` with `devices["iPhone 14"]`, `defaultBrowserType` stripped — test.use rejects it inside a describe) pins the SAME 28/23/14/8/8/3 at 390px (the mobile census is byte-identical to the desktop's — the identity is the contract), and the `a11y admin gate` describe (one `adminLogin(browser)` in `beforeAll`) pins the admin QUALITY census {color-contrast} at 8/7/7/7 (dashboard/orders/products/order-detail via the ORD-2026-001 link). Rationale: an `lg:hidden` element is `display:none` at desktop → axe skips it → a mobile-only defect passes the desktop gate forever. Dual-mutation-proven (mobile-only unlabeled menu button fails ONLY the mobile tests; unlabeled admin eye buttons fail the admin test).
- **The CWV standing gate pins performance budgets (session-17, ADR-025, PERF-GATE-1):** `tests/e2e/performance.spec.ts` measures home/shop/PDP (LCP + CLS via pre-paint-registered PerformanceObservers, element identity captured at entry time) and asserts LCP ≤ 2500ms, CLS ≤ 0.03, and LCP-element identity through scale floors (the largest paint is the route's primary imagery: IMG ≥ 400,000/50,000/200,000 px²). A QUALITY gate, not parity — the multi-route CWV differential (round-17) measured the clone 2–4.5× faster than the reference on the byte-identical LCP elements with CLS ≤ 0.0011. Dual-mutation-proven (a hidden hero img fails only the identity pin; a late-injected banner fails only the CLS pin at 0.104). The measurement reads AUTHENTICATED state (the reference auth-gates every route for anonymous visitors — measured; anonymous contexts render the login screen on the requested URL).
- Integer cents for all money; format only at display (`formatCents`).
- SQLite has no enums — String columns + Zod union validation at the boundary.
- Seed is idempotent (natural-key upserts); demo fixtures mirror the reference account page.

## 4. Development Workflow

### Environment Setup

```bash
bun install          # bun is the package manager for this repo
bun run db:setup     # prisma db push + seed (idempotent)
bun run dev          # http://localhost:3000
```

Demo accounts (seeded): `john@example.com` / `Demo1234!` (order history) · `admin@luxestore.com` / `Admin1234!` (admin console).

### Build Commands

| Command | Purpose |
|---|---|
| `bun run dev` | Dev server, port 3000, logs to `dev.log` |
| `bun run build` | Production standalone build (`.next/standalone`) |
| `bun run start` | Run the standalone production server |
| `bun run lint` | ESLint 9 flat config — must be 0/0 |
| `bun run typecheck` | `tsc --noEmit` — must be 0 errors |
| `bun run test` | Vitest unit suite (100 tests) |
| `bun run test:e2e` | Playwright E2E (169 tests incl. the setup login + the desktop/mobile/admin a11y gates + the CWV budget gate; requires `bun run build` first — never `bunx next build`, which skips the standalone static copies and kills hydration) |
| `bun run db:setup` | `db push` + seed |
| `bun run db:reset` | `prisma migrate reset` |

## 5. Testing Strategy

**Pyramid:** Vitest unit (pure domain seams, co-located `*.test.ts`) → Playwright E2E (production standalone server on :3100, isolated `db/e2e.db`, real UI flows).

- Unit layer: `src/lib/*.test.ts` + `tests/db-path.test.ts` — money math (incl. the $9.99 flat-rate pin), passwords, Zod schemas (incl. nameless-register + display-name derivation), rate limiter, DB-path resolution, cart delta-quantity + stock clamping, slug humanization, email-verification codes, redirect-path validation, admin-order filter parsing/where-building (session-13). TDD red→green→refactor; bug fixes get a failing regression test first.
- E2E layer: `tests/e2e/*.spec.ts` — smoke (incl. the standalone 404 + product-not-found + standalone auth screens + per-route titles), storefront-parity (computed-style gate incl. hero-dot geometry + feature-bar cards + footer Join/separator + home section dividers + PDP heart px-8 geometry), catalog-parity (array order, sort semantics, ratings, descriptions, related-products membership), cart (incl. the no-auto-open drawer pin + $9.99 shipping + toasts + transactional steppers), checkout (incl. the "No items in cart" empty state + the post-order badge re-sync), account (profile icon avatar, highlighted default address, Change-Password section), auth (form contract incl. the error BOX + native validation, nameless registration, forgot-password anti-enumeration, redirect-after-login + open-redirect rejection), wishlist (incl. add/remove toast asymmetry + heart color states), search (incl. active-filter chips + empty state), mobile navigation, guest-cart (cookie-token path, opts out of storageState), guest-checkout (cookie-cart → order end-to-end, opts out of storageState), stock (admin-context stock control; stepper clamp; overselling rejection; placement decrement), verify-email (fixture-driven happy path + attempts + login gate), admin (guest gating with per-page redirect targets, dashboard stats, order-detail items/shipping/timeline, combobox status transitions landing in the timeline, visibility toggle enforced on /shop, **URL-deep-linkable order filters — status + number/email search + empty state + Clear, session-13**), **accessibility (session-15's standing axe gate — census exactly {color-contrast} + pinned counts, self-hosted axe-core injection; session-16's A11Y-GATE-2 extension — the SAME pins re-asserted at iPhone 14 + the admin QUALITY census 8/7/7/7 on the four console surfaces)**, **performance (session-17's PERF-GATE-1 standing CWV budget gate — LCP ≤ 2500ms + CLS ≤ 0.03 + LCP-element identity floors on home/shop/PDP, pre-paint PerformanceObservers, dual-mutation-proven)**. `auth.setup.ts` signs in once (rate limiter) and shares storageState; `auth.spec.ts` + `guest-cart.spec.ts` + `guest-checkout.spec.ts` + `verify-email.spec.ts` + `admin.spec.ts`'s guest test opt out for logged-out flows. `global-setup.ts` pushes/seeds/resets the e2e DB every run (restoring the unverified fixture AND the canonical order set — non-canonical orders and demo-order status_changed events are deleted so runs stay isolated). `openCartDrawer`/`adminLogin` (helpers.ts) are the reference-mirroring way to open the drawer / enter the console.
- E2E gotchas pinned in AGENTS.md: wait for hydration (`networkidle`) before filling client-island forms after a full `goto` (pre-hydration input gets wiped by React's DOM adoption); the checkout wizard remounts fresh on every entry (refill after re-entering); the admin stock form's Save is async (wait ~800ms before asserting persisted state).
- Assert behavior through the UI/API, never internals; scope selectors to `main` on chrome pages (footer text collisions); auth screens have NO `main` landmark — use page-level selectors and the error BOX locator (`div.mb-4.p-3.rounded-lg`) for inline errors. Close dialogs before asserting on header chrome (Radix `aria-hidden`); the drawer hides the header badge while open — assert the drawer's own totals. Toast assertions wait out the enter spring (~450ms) with ±2px tolerance.

## 6. Code Quality Standards

- `bun run lint` and `bun run typecheck` are gates, not suggestions. React Compiler lints are ON (`react-hooks/set-state-in-effect` is an error): use the adjust-state-during-render pattern instead of `useEffect` state sync.
- No `console.log` in committed code (`console.error` with a `[tag]` prefix for caught failures is the pattern).

## 7. Git & Version Control

- **main only** — short-lived branches are acceptable for humans, but agent pushes target `main` via `docs/ssh_git_wrapper_v3.py` (see `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`; key never enters the repo).
- Conventional Commits, atomic units (`feat: …`, `fix: …`, `test: …`, `docs: …`).
- Never commit: `.env`, `db/*.db`, `dev.log`, `server.log`, `tests/e2e/.auth/`, `test-results/`.

## 8. Error Handling & Debugging

- Server actions catch, log with context (`console.error("[actionName]", e)`), and return customer-safe `INTERNAL`-style messages — internals never leak to the client.
- `/api/health` selects 1 + reports db status; use it first when the server misbehaves.
- Debug order: `dev.log`/`server.log` → `bun run typecheck` → the relevant spec with `bunx playwright test <spec> --debug`.
- E2E failures write traces to `test-results/` — `bunx playwright show-trace <zip>`.

## 9. Communication & Documentation

- Explain why, not just what; state assumptions explicitly.
- Architectural decisions and their rationale live in `Project_Architecture_Document.md` (ADRs). Agent-facing cheat-sheet: `AGENTS.md`. Update both when the architecture moves.

## 10. Project-Specific Standards

### Architecture
Single Next.js app with route groups: `src/app/layout.tsx` (minimal shell — fonts, metadata, the CDN favicon link) · `src/app/(storefront)/` (chrome + all shopper pages: home, shop, PDP, cart [server page + `cart-client.tsx` island], checkout, wishlist, account, admin [dashboard, orders + `orders/[id]` detail, products]) · `src/app/(auth)/` (standalone login/register/forgot-password/verify-email + the shared `auth-error.tsx` box) · root `not-found.tsx` + the `[...notFound]` catch-all (chrome-less platform 404 — the catch-all adds the reference's humanized-path title, session-8) · `src/app/api/` (3 route handlers) + sitemap/robots. `src/components/{ui,store,account,checkout}` · `src/lib` (domains + actions) · `prisma` (schema + seeds) · `tests` (vitest + playwright). Import direction: app → components → lib → db. `src/lib/db.ts` is server-only — never import it from a `"use client"` file. 23 routes; the build script is fresh-clone-safe (`mkdir -p public` + committed `public/.gitkeep`).

### API / Action Design
Mutations: server actions with Zod + `ActionResult<T>`. Reads: RSC direct Prisma queries. Route handlers: GET `/api/search?q&limit` (429-limited), POST `/api/newsletter` (idempotent upsert), GET `/api/health`.

### Database / Data Layer
13 models (User/Session/Category/Product/Cart/CartItem/Wishlist/WishlistItem/Address/Order/OrderItem/OrderEvent/NewsletterSubscriber). Guest identity = signed-cookie tokens merged into user rows on login — cart MUTATIONS resolve the guest token from the cookie (a session-4 bug fix; passing `undefined` minted a new cart per guest add). Order numbers `ORD-YYYY-NNN` (count-based, single-writer SQLite). `User` carries the email-verification columns (`emailVerified`, `verificationCodeHash`, `verificationAttempts`, `verificationExpiresAt`).

### Environment Variables

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | SQLite location, schema-relative `file:` URL | `file:../db/custom.db` |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata/sitemap/robots | `http://localhost:3000` |
| `AUTH_SECRET` | HMAC secret for session cookie integrity (required in prod) | `openssl rand -hex 32` |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | Gate registration behind the 6-digit "Verify your email" flow (requires an email provider — codes currently log at the `console.info` seam) | `""` (off) |

## Success Metrics

You are successful when: the gate is green end-to-end; E2E parity specs still pin the reference's computed styles; new features ship with tests at the same seam; and the trap log grows (documented) instead of being worked around.
