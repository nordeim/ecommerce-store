# AGENTS.md — LUXE Store

Production e-commerce storefront + admin console: Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS 4 (CSS-first) · Prisma 6 + SQLite · Radix/shadcn-style UI · Vitest + Playwright.

## Commands

| Task | Command |
|---|---|
| Install | `bun install` |
| Dev server | `bun run dev` (port 3000; logs tee'd to `dev.log`) |
| DB setup (push + seed, idempotent) | `bun run db:setup` |
| DB push only | `bun run db:push` |
| Seed only | `bun run db:seed` |
| Lint | `bun run lint` (ESLint 9 flat config — must exit 0) |
| Typecheck | `bun run typecheck` |
| Unit tests | `bun run test` (Vitest, node env) |
| Single unit test | `bunx vitest run src/lib/money.test.ts` |
| Production build | `bun run build` (standalone output) |
| E2E (needs `bun run build` first) | `bun run test:e2e` |
| Single E2E spec | `bunx playwright test tests/e2e/cart.spec.ts` |
| Clean check order | `bun run lint && bun run typecheck && bun run test && bun run build && bun run test:e2e` |

**Use bun, not npm/yarn.** The seed and E2E global-setup execute TS directly via `bun` (fall back to `npx tsx` only if bun is missing).

## Environment shadowing (sandbox trap)

Bun loads `.env` walking UP parent directories, and any `DATABASE_URL` already
present in the process environment (a shell export, a CI inject, a parent
`.env`) **wins over the repo `.env`** — Next and Prisma never override existing
process env. Symptom: `db/custom.db` never appears at the repo root, or stale
rows survive "fresh" reseeds (the file being written is elsewhere). Diagnose
with `bun -e "console.log(process.env.DATABASE_URL)"` from the repo root. In
managed sandboxes, keep every path converged on the repo DB (e.g. a hard link
from the injected location) — the repo contract itself is test-pinned in
`tests/db-path.test.ts`.

## Database

- SQLite at **`db/custom.db`** (repo root, git-ignored). `DATABASE_URL="file:../db/custom.db"` is **schema-relative** — it resolves against `prisma/schema.prisma` exactly like the Prisma CLI, so push/seed/build/runtime all open ONE file regardless of CWD. The runtime resolution lives in `src/lib/db-path.ts` and is pinned by `tests/db-path.test.ts` — do not "simplify" it.
- E2E uses its own `db/e2e.db` (`DATABASE_URL="file:../db/e2e.db"` in playwright.config.ts) pushed + seeded + **reset** by `tests/e2e/global-setup.ts` (which runs `prisma/e2e-reset.ts` to clear carts/wishlists/spec users — cart specs assert absolute counts).
- Money is **integer cents everywhere**. `toFixed`/`Intl` only at display via `formatCents` (`src/lib/money.ts`).
- SQLite has no enums — `User.role` / `Order.status` / etc. are Strings validated by Zod schemas in `src/lib/validation.ts`. Keep that contract.

## Architecture rules

- **Route groups own the chrome.** `src/app/layout.tsx` is a minimal shell
  (html/body/font/metadata). `src/app/(storefront)/layout.tsx` carries the
  shopper chrome + `StoreProvider` hydration; `src/app/(auth)/` renders
  login/register/forgot-password standalone (reference parity: no
  header/footer) — each route is a server `page.tsx` (owns `Metadata`:
  "Login"/"Register"/"Forgot Password", built via the shared
  `pageMetadata()` builder — session-9, METADATA-OG-1) delegating to a
  `*-form.tsx` client island; the root
  `not-found.tsx` is the reference's chrome-less platform 404 (slate palette,
  pinned). Unknown PRODUCT slugs render an in-chrome "Product not found"
  block instead (`product/[slug]/page.tsx`).
- **RSC by default.** Pages under `src/app/` are server components querying Prisma directly. `"use client"` only for interactive islands (`src/components/store/*`, `checkout-flow`, `account-tabs`).
- **Catalog order is a parity contract.** `Product.sortOrder` mirrors the reference's product array position 1:1 (measured live 2026-10-07: headphones, watch, tee, speaker, planter, shoes, serum, blanket, sunglasses, mat, pad, pajama). "Featured" = sortOrder asc; "Top Rated" = `[{rating: desc}, {sortOrder: asc}]` (Prisma ties are otherwise undefined); "Newest" = createdAt desc with the seed's staggered createdAt (array position 1 = oldest). Home's On Sale section = first 4 `isOnSale` products in array order. Changing seed order requires re-measuring the reference. The home page frames its product sections with TWO hairline dividers (`shrink-0 bg-border h-[1px] w-full max-w-7xl mx-auto`) — after the feature bar and between New Arrivals and On Sale (measured live + session-0 recon; session-5).
- **Money is a parity contract (ADR-011).** Flat shipping below the $100 threshold is **$9.99** (`FLAT_SHIPPING_CENTS = 999` in `src/lib/money.ts`, unit-pinned) — measured live at $34.99 and $79.99 subtotals; Free at/above $100. The seeded demo orders store their own totals and are unaffected.
- **Wishlist hearts are a color contract (session-5).** The reference's ACTIVE heart is `fill-destructive text-destructive` — RED rgb(239,67,67) — on both the PDP buy-panel heart and the product-card hearts (NOT primary orange). The CARD heart is MUTED inactive (`h-4 w-4 transition-colors text-muted-foreground`, rgb(111,111,123)); the PDP buy-panel heart is `h-5 w-5` with NO color class (foreground) and its button is `h-10 px-8` (82px — px-4 lets the flex-1 ATC absorb 32px). The reference's wishlist itself is COSMETIC (heart toggles fire no network call and its wishlist page never fetches entities — always "Your wishlist is empty"); the clone's DB-backed wishlist is the superset. The ATC + heart svgs carry `h-5 w-5` (rendered 16px via the Button `[&_svg]:size-4` base on both sites). Mobile note: px-8 exactly reproduces the reference's iPhone-14 action row, whose heart is clipped ~35px past the viewport (scrollWidth 425 on 390px) — parity, not a defect.
- **Toast subsystem (session-4).** Successful cart adds and wishlist ADDS toast "«name» added to cart!" / "… added to wishlist!" in the reference's dark bottom-right box (`ToastViewport` — `fixed bottom-6 right-6 z-[100]`, `bg-foreground text-background px-4 py-3 rounded-xl shadow-2xl`, CircleCheckBig `text-primary`, 3000ms lifetime, stacks without dedupe; NO toast on wishlist remove — all measured live). Enter/exit are CSS approximations of the reference's JS spring (`@starting-style` + bouncy bezier in `globals.css`). The region is `pointer-events-none` and `aria-live=polite` (registered divergences: the reference's toasts are inert-on-click; click-through keeps drawer-Checkout clicks deterministic).
- **Auth parity contract (ADR-010 + ADR-011).** The register form has exactly
  [Email, Password, Confirm Password] — the reference collects NO name;
  `registerAction` derives the display name from the email local part
  (`deriveDisplayName` in `src/lib/validation.ts`; `john.doe@x` → "John Doe";
  `User.name` stays required in Prisma). Password inputs carry the
  `••••••••` placeholder; password minimum is 8 chars with NO complexity
  rule (measured live). All three auth screens share the reference anatomy:
  header block OUTSIDE the card (primary tile + `text-3xl` h1 + sub — LogIn /
  UserPlus / Mail icons), `border-border` card, h-12 icon-led inputs,
  line-and-label "or" divider, and the tinted error BOX
  (`div.mb-4.p-3.rounded-lg.bg-destructive/10.text-destructive.text-sm`,
  first child of the card above the form). Auth forms carry NO `noValidate` —
  the reference relies on native `type=email` validation. Error copy is
  pinned: "Invalid email or password", "A user with this email already
  exists", "Passwords do not match".
  `/forgot-password` is a real anti-enumeration action: Zod email,
  rate-limited 5/15min, ALWAYS the same neutral confirmation (the user lookup
  only feeds a `console.info` seam — never the response); no email is sent
  yet. **Email verification (ADR-011)**: the reference gates registration
  behind a 6-digit "Verify your email" screen and blocks unverified logins
  ("Please verify your email before logging in. Check your email for the
  verification code."). The clone ships the full machinery env-gated behind
  `AUTH_REQUIRE_EMAIL_VERIFICATION` (default OFF — no email provider is
  wired; codes log at the `console.info` seam; flipping the flag without one
  would lock out every new user). The screen + `verifyEmailAction` work
  regardless of the gate; E2E drives them via the seeded
  `unverified@example.com` fixture (code 123456, restored by e2e-reset).
- **PDP visual contracts (session-8):** the star rating row is the
  reference's FLAT form — exactly 5 direct `Star` svgs in
  `flex items-center gap-1`, `floor(rating)` amber
  (`fill-amber-400 text-amber-400`) + the rest `text-border`; NO rounding,
  NO half-stars, NO track/overlay spans (4.8 renders 4 amber + 1 gray).
  The breadcrumb is `flex items-center gap-2 text-sm
  text-muted-foreground mb-8` (NO flex-wrap — the whole PDP's vertical
  rhythm hangs off the 32px margin). The feature bar AND the PDP feature
  row use lucide `shield` (Secure Payment) and `rotate-ccw` (30-Day
  Returns) — NOT shield-check/refresh-cw (measured live; truck and
  headphones were already right). Search-dropdown suggestion categories
  render LOWERCASE ("electronics"), unlike the capitalized badges
  elsewhere.
- **PDP related products = ALL same-category products excluding self** in
  array (sortOrder) order — no cap, no cross-category fill (measured live:
  headphones → speaker + pad only). Shop active-filter chips render for
  category (plain name) and search (quoted term) ONLY — price/sort never
  chip; clicking a chip deep-links to the URL minus that param. The PDP
  document.title is the **humanized slug** ("Wireless Headphones | Lumina"),
  NOT the product name — for EVERY slug, including unknown ones (session-7,
  TITLE-NF-1: the reference's SPA titles `/product/anything` as the
  humanized path; the in-chrome not-found BLOCK is unchanged). The h1 keeps
  the full name. **Unknown ROUTES (not just product slugs) follow the same
  title rule (session-8, TITLE-404-1):** the `[...notFound]` catch-all
  titles the page from the LAST path segment containing a letter, humanized
  (`/foo/bar-baz` → "Bar Baz | Lumina", `/products/42` → "Products",
  `/12345` → plain "Lumina" via `title.absolute`), rendering the identical
  platform-404 UI — the shared component is
  `src/components/store/platform-404.tsx` and the rule lives in
  `notFoundPageTitle` (`src/lib/format.ts`, unit-pinned). The Reviews tab's
  empty panel is `div.text-center.py-10`; the Shipping tab is plain `p`
  elements with a literal `✓` prefix (NO icons — only the Description tab's
  Key Features uses lucide checks).
- **Cart mutations resolve the guest token from the cookie** (`src/lib/cart.ts`).
  The mutation seam (`addItem`/`changeQuantityBy`/`removeItem`) reads
  `cookies().get(CART_COOKIE)` and passes the token to `resolveCartRow` —
  passing `undefined` silently minted a new cart per guest add and made
  guest steppers read as empty (the session-4 live-audit bug; pinned by
  `tests/e2e/guest-cart.spec.ts`, which opts out of storageState).
- **Stock is enforced SERVER-side, silently clamped in the cart and rejected
  at placement (ADR-013, session-6).** The PDP UI caps the stepper at stock
  (`buy-panel.tsx`); the server does too: `addItem`/`changeQuantityBy` clamp
  increases at the product's current stock (never reject — no error state on
  parity surfaces; decreases/deletes always pass; the pure seam is
  `clampToStock` in `src/lib/cart-quantity.ts`). `placeOrderAction` re-reads
  every line's stock INSIDE the transaction and rejects overselling with a
  customer-safe message ("Sorry, «name» only has N left in stock. …"), then
  decrements stock atomically with the order write. Seeded demo orders are
  fixtures (never decremented); the seed upsert restores `stock: 25` on
  every `db:setup`/global-setup run; `prisma/dev-cleanup.ts` restores 25 on
  the dev DB. Pinned by `tests/e2e/stock.spec.ts` (which also drives the
  admin stock form — the admin console's first E2E coverage).
- **Redirect-after-login (ADR-014, session-6 + session-7 REDIRECT-2):**
  `/account` and `/admin*` gate anonymous visitors to
  `/login?redirect=<their OWN path>` — the admin SUB-pages carry their full
  path (`/admin/orders`, `/admin/products`, `/admin/orders/<id>`), not the
  dashboard shortcut; the login server page passes the param into the form
  island, which only honors a `validateRedirectPath`-validated same-origin
  relative path (open-redirect payloads fall through to `/account`).
  `/login` is therefore a DYNAMIC route (was static). Pinned by
  `tests/e2e/auth.spec.ts` + `admin.spec.ts`.
- **The admin order-detail view (ADR-015, session-7)** renders what the
  mutations write but no prior surface showed: `/admin/orders/[id]`
  (admin-gated like every `/admin*` route) shows the customer block
  (email, placed date, payment method + card last4), the parsed JSON
  shipping-address snapshot, the OrderItem snapshots (image/name/unit
  price/quantity/line total), and the **OrderEvent timeline** (chronological;
  `placed` → "Order placed", `status_changed` → "Status changed" with the
  `old → new by actor` note). Order numbers link to it from the admin
  orders list AND the dashboard's Recent Orders. Unknown ids render an
  in-admin "Order not found" block. Read-only — status changes stay on the
  list row's Select (one mutation seam). Pinned by `tests/e2e/admin.spec.ts`.
- **The admin orders list is URL-deep-linkable filterable (session-13,
  ADMIN-SEARCH-1):** `/admin/orders` takes `?status=` (validated against
  the four canonical combobox statuses — anything else falls through to
  the unfiltered list, never an error) and `?q=` (SQLite `contains` on
  order number OR customer email — the two identifiers a customer
  relays). The pure seam is `src/lib/admin-orders.ts`
  (`parseAdminOrderFilters` + `buildAdminOrderWhere`, unit-pinned; the
  shop's parser stayed page-local for reference-parity reasons, the
  admin surface is a superset so it gets the lib seam). The filter
  island (`admin-order-filters.tsx`) mirrors `ShopFilters` (merged
  params via `router.push`, the adjust-during-render input sync). The
  count line ("N orders" / "100+ of N orders") makes the `take: 100`
  bound visible; the empty state offers "Clear all filters". Zero
  parity risk — no storefront surface is touched. Pinned by
  `tests/e2e/admin.spec.ts` (3 tests: status deep-link, number/email
  search, empty state + Clear).
- **One `<main>` landmark per page (session-7, MAIN-NEST-1; extended session-12):** the admin AND shopper content pages (account, checkout ×2 code paths, checkout/success, wishlist ×2 code paths) wrap their content in `<div className="flex-1">` — NOT `<main>` — because the `(storefront)` layout already renders the `<main>`; a nested pair is invalid HTML, trips axe's landmark rules, and confuses AT landmark navigation. The session-1 originals shipped nested mains on those four routes for eleven rounds — invisible to every computed-style audit because `locator("main")` chains dedupe shared descendants; the axe differential (session-12) exposed them. The inner `flex-1` is layout-inert either way (the parent main is not a flex container).
- **ARIA labels never land on role-less divs (session-12, A11Y-ARIA-1/2).** `aria-label` on a plain `<div>` (role=generic) is prohibited by ARIA 1.2+ (axe `aria-prohibited-attr`): the toast viewport is a NAMELESS `aria-live="polite"` region (a live region announces its content, not its name; the reference's container carries no aria attributes at all), and the PDP star-rating row is `role="img"` + `aria-label="Rated X out of 5"` (the canonical glyph-row pattern — role=img allows naming). Pinned by the storefront-parity spec.
- **Security headers ship in `next.config.ts` `headers()` (session-12, SEC-HEADERS-1):** Referrer-Policy `strict-origin-when-cross-origin`, X-Content-Type-Options `nosniff`, Strict-Transport-Security `max-age=31536000` (the reference's live-measured baseline; HSTS over HTTP is a spec no-op per RFC 6797 §7.2), plus X-Frame-Options `DENY` (superset). CSP deferred (needs nonce plumbing). Pinned by the smoke spec.
- **Content-Security-Policy ships via the proxy nonce pipeline (session-14, SEC-CSP-1, ADR-022):** `src/proxy.ts` (Next 16's renamed middleware convention — `middleware.ts` is deprecated) mints a per-request nonce, sets the CSP on the REQUEST headers (Next extracts it via `getScriptNonceFromHeader` and nonces every bootstrap/flight script) and the RESPONSE (browser enforcement). Directives are pinned to the codebase's measured footprint: `default-src 'self'`; `script-src 'self' 'nonce-…' 'strict-dynamic'`; `style-src 'self' 'unsafe-inline'` (framework insurance — the app itself ships zero inline styles); `img-src 'self' https://media.base44.com data:` (the sole art/favicon CDN); `font-src 'self'` (the self-hosted woff2); `connect-src 'self'`; `frame-ancestors 'none'`; `object-src/base-uri/form-action 'self'`. **No `upgrade-insecure-requests`** — the app runs on plain-HTTP localhost in dev/E2E and that directive would rewrite same-origin subresources to https. Per-request nonces require per-request rendering: `/register` and `/forgot-password` carry `export const dynamic = "force-dynamic"` (the only static HTML pages; `/_not-found` is unreachable — nothing calls `notFound()`). Pinned by the smoke spec (header + directive census + nonce uniqueness + every SSR script nonced on / and /register).
- **The a11y parity profile is regression-pinned by a standing E2E gate (session-15, A11Y-GATE-1, ADR-023):** `tests/e2e/accessibility.spec.ts` injects the SELF-HOSTED axe-core build (pinned `4.14.0` devDependency; `page.addScriptTag` — DevTools-protocol injection, exempt from the page CSP) after a scrolled-reveal pass (content at `opacity: 0` until scrolled is SKIPPED by axe — the session-12 whileInView trap) and asserts (a) the violation census is EXACTLY `{color-contrast}` on home/shop/PDP/cart/account/login — any other rule firing (button-name, label, landmarks, aria-prohibited-attr, …) is a REGRESSION against the aria superset / the session-12 fixes; (b) the color-contrast node counts equal the parity pins (28/23/14/8/8/3 — byte-identical to the reference's live-measured counts; the shared parity trait, NOT a defect to fix). Mutation-proven: a re-introduced `aria-label` on the toast viewport fails the gate as `aria-prohibited-attr`.
- **The a11y gate covers BOTH viewports and the admin console (session-16, A11Y-GATE-2, ADR-024):** the same spec carries an `a11y mobile gate` describe (`test.use({ ...devices["iPhone 14"] })` with its `defaultBrowserType` STRIPPED — `test.use` rejects it inside a describe because it forces a new worker; the project's storageState still applies, so the demo user is authed at 390px) pinning the SAME 28/23/14/8/8/3 (the mobile census is byte-identical to the desktop's, live-measured both sites + E2E-calibrated — that identity IS the contract; a viewport divergence is flagged like a drift), and an `a11y admin gate` describe (`adminLogin(browser)` once in `beforeAll`, the admin.spec pattern — 3 admin logins/run stays inside the 10/15min bucket) pinning the QUALITY census {color-contrast} at 8/7/7/7 on the four console surfaces (dashboard/orders/products/order-detail, the detail reached via the `ORD-2026-001` link — the e2e.db cuid is not hardcodable). The structural-blindness rationale: an element hidden at desktop (`lg:hidden`) is `display:none` → axe SKIPS it at 1280×720 → a mobile-only defect passes the desktop gate forever. Dual-mutation-proven: removing the mobile menu button's aria-label fails ONLY the mobile tests (desktop stays green — the proof); removing the eye buttons' aria-labels fails the admin products test (`button-name(12)`).
- **A plain `div` with `aria-label` does NOT trip axe's aria-prohibited-attr (session-16 lesson):** the session-12 defect fired because the toast viewport carries `aria-live="polite"` — aria-label on a LIVE REGION is prohibited ARIA. The same label on a plain role-less div (no aria-live) is NOT flagged by axe 4.14 under the wcag2x tag set. When engineering a mutation for the prohibited-attr class, target a live region (or use the button-name class: any icon-only button whose aria-label is dropped). The eye buttons on the admin product rows are the registered admin-surface mutation target.
- **The CWV standing gate pins LCP/CLS budgets + LCP-element identity (session-17, ADR-025, PERF-GATE-1):** `tests/e2e/performance.spec.ts` measures home/shop/PDP with PerformanceObservers registered via `page.addInitScript` (PRE-PAINT — post-load registration misses buffered entries; the observers capture the element tag + geometry at ENTRY TIME because a DOM-swap carousel replaces elements), reads after `networkidle` + `document.fonts.ready` + a short settle, and asserts three pin families: LCP ≤ 2500ms (measured 168–460ms under E2E conditions — 6–15x headroom; catches paint-blocking regressions), CLS ≤ 0.03 (measured 0.0006–0.0011; round-13's long-window 0.0213 stays inside — the unsized-media class lands at 0.1+), and LCP-element identity THROUGH SCALE (the largest paint is an IMG at ≥ the calibrated floor: hero 400,000 / card 50,000 / product 200,000 px² — a lazy or broken hero moves the LCP to text, which the floors exclude by scale). The budgets are a QUALITY gate (the reference's slower SPA numbers are not a parity target — same distinction as the admin axe census). Dual-mutation-proven: a `hidden` hero img fails ONLY the identity pin (LCP budget stays green — the budget alone cannot see the defect class); a late-injected 160px banner (900ms post-hydration, the consent-bar/ads class) fails ONLY the CLS pin at 0.104.
- **PDP image-container growth is invisible at desktop (session-17 lesson, L27):** the PDP's 2-column grid makes the buy-panel column the taller one — an unsized image container's post-load growth (the classic unsized-media CLS defect) is ABSORBED with zero element movement at ≥1024px. The same defect at mobile (stacked 1-col layout) shifts the whole buy panel — the A11Y-GATE-2 structural-blindness story, now for CLS. The registered mobile-CWV mutation target is the PDP `aspect-square` container + the img's `h-full`. Also measured: the reference AUTH-GATES every route for anonymous visitors (it renders the login screen client-side ON the requested URL) — CWV/pixel differentials must measure AUTHENTICATED state on both sites; round-13's hero-image LCP (1576ms) reproduces only under authentication.
- **Server processes can outlive their build directory (session-15 lesson):** a standalone server keeps serving after `bun run build` replaces `.next/standalone` — the stale manifest requests chunks whose hashes changed → every `/_next/static/chunks/*.js` 500s → the browser refuses them (CSP MIME check) → hydration dies while SSR still renders. Symptom: `getByLabel` times out on a form whose labels exist in `curl` HTML. In the sandbox `lsof`/`fuser`/`ps` show NO owning PID — find it via `/proc/net/tcp` (port hex → socket inode → scan `/proc/*/fd` for `socket:[inode]`) and `kill` that PID, then reboot the server on the CURRENT build. Also: pick a FRESH port when a stale server can't be killed — the E2E suite takes `E2E_PORT`.
- **Steppers post DELTAS, not absolutes** (ADR-011): the drawer and /cart
  steppers call `adjustQuantity(itemId, ±1)`; the server applies them inside
  `db.$transaction` (`changeQuantityBy`) so rapid clicks each land exactly
  once. The old absolute API lost updates when two clicks raced one
  re-render. Remove is its own action (`removeCartItemAction`).
- **Hero carousel inactive slides are INERT (session-11, A11Y-FOCUS-1).** The clone keeps all 3 slides in the DOM (the documented crossfade divergence); inactive slides carry `aria-hidden` AND `inert` (`src/components/store/hero-carousel.tsx` — both the media slide and the text block). `aria-hidden` alone leaves the inactive slides' CTA links in the TAB ORDER (live-measured: Tab from the active CTA landed on the invisible "Explore"/"Browse" anchors — a WCAG 2.4.3 defect; the reference's DOM-swap has only one CTA at a time). With `inert`, the tab order is exactly the reference's: CTA -> prev -> next -> dots. The auto-advance edge case matches too (a slide going inert while focused blurs to body — the same observable as the reference's DOM removal). Pinned by the storefront-parity spec.
- **Deliberate divergences (superset behavior, do not "fix"):** the mobile nav auto-closes on navigation (the reference's Sheet stays open — verified live twice, a demo quirk); the hero carousel pauses on hover (the reference keeps cycling — verified live 11s); the Settings tab keeps a Session/Log out card (the reference has NO logout anywhere); the newsletter form shows a real confirmation (the reference's submit is a no-op); `/cart` renders real contents (the reference hardcodes its empty state); the checkout wizard writes real orders (the reference's checkout cannot see its own cart); the reference's WISHLIST is cosmetic (heart toggles fire no network call, its wishlist page never fetches entities and always shows the empty state — the clone's DB-backed wishlist is the superset); shop filters/sort are URL-deep-linkable (the reference's SPA never updates the URL); the drawer keeps aria-labels + disabled-minus (the reference's stepper buttons are unlabeled); the footer's Shop-column links deep-link category filters (the reference's all point at plain `/shop` — its header links DO filter); the toast region is pointer-events-none + a NAMELESS aria-live=polite (the reference's toasts are inert on click AND unlabeled); the toast spring is a CSS approximation; the PDP rating row keeps its labeled role=img (the reference's is unlabeled); X-Frame-Options ships as the superset over the reference's three headers; `/verify-email` is titled "Verify Email | Lumina" (the reference keeps the SPA's stale "Register | Lumina"); verification is env-gated off by default (the reference always gates — no email provider is wired here); the "Continue with Google" buttons are visual-only (the reference's launch a real base44-platform Google OAuth flow — wiring real OAuth needs credentials that don't exist for a self-hosted clone; registered session-5).
- **Server actions are the only mutation seam** (`src/lib/actions/*.ts`): every action Zod-parses input and returns `ActionResult<T>` (`{ ok: true, data } | { ok: false, error: { message, fieldErrors? } }`). Never throw across the boundary.
- Route-handler whitelist: `/api/health`, `/api/search` (typeahead), `/api/newsletter`. Adding more needs a reason.
- Client commerce state lives in ONE place: `StoreProvider` (`src/components/store/store-provider.tsx`) — hydrated from the server on layout render, re-derived after every mutation. Totals are always server truth. The provider's state SURVIVES client-side navigation inside the `(storefront)` group — logout must call `setUser(null)` explicitly (the header otherwise keeps the logged-in icon). When a `router.refresh()` delivers fresh `initialCart`/`initialUser`/`initialWishlistIds` props (new object identities from a server layout re-render), the provider re-syncs its state via the adjust-state-during-render pattern (session-5, CHECKOUT-BADGE-1: the header badge previously kept the stale cart count after order placement until a manual reload). The "last seen props" live in STATE, not a ref — the React Compiler `react-hooks/refs` rule forbids ref access during render.
- Adding to cart NEVER opens the cart drawer (reference parity, E2E-pinned) — the badge bumps; the drawer opens only via the header cart button. The drawer item row is reference-exact (E2E-pinned): plain truncated h4 name, bold unit price, gap-2 stepper+trash, right-side line total, border-separated rows, `text-primary` "Free", `font-bold text-lg` total.
- Cart/wishlist identity = cookie token (guest) merged into the user row on login (`src/lib/cart.ts`, `src/lib/wishlist.ts`). Reads never mint rows (a Server Component render cannot set cookies).

## Testing quirks

- Vitest matches `*.test.ts` only; Playwright matches `tests/e2e/*.spec.ts` — no double-pickup.
- Playwright boots the **production standalone server** on port 3100 with the e2e DB. Build before `test:e2e` or the webServer times out.
- The login action is rate-limited (10/15min/IP+email) and the password-reset action 5/15min — that's why `auth.setup.ts` logs in ONCE and saves `tests/e2e/.auth/user.json` as storageState. Don't add per-test logins.
- Register specs do NOT fill a Name field (the reference form has none — the action derives it); register specs must use a fresh random email per run (`e2e-<ts>@example.com`) because the e2e-reset clears only `e2e-*` spec users.
- The stock spec logs in as the seeded ADMIN through a second browser
  context (`adminLogin(browser)` — now shared from `helpers.ts`) — the admin
  email draws from its own rate-limit bucket, so it coexists with the
  demo-user setup login. Its `setStock` helper clicks the admin form's Save
  then WAITS (~800ms + reload) before asserting — the server action +
  `router.refresh()` land asynchronously and a reload that races the write
  reads stale truth.
- **admin.spec.ts (session-7)** shares ONE admin login across the file
  (`beforeAll`) to stay inside the login rate-limit bucket (the stock
  spec's two logins share it). Selector contracts: scope stat-label
  assertions to `div.grid.grid-cols-2` (the header also carries an
  "Orders" link — strict-mode trap); scope order rows via the combobox's
  stable aria-label (`Change status for ORD-2026-001`) +
  `div.rounded-xl` filter, and assert the badge via the row's
  `div.rounded-full` (the Select trigger also displays the status text);
  the status test RESTORES the canonical status afterward. **Run-to-run
  isolation:** `prisma/e2e-reset.ts` now deletes non-canonical orders and
  demo-order `status_changed` events every run — spec-placed orders
  otherwise accumulate across runs (the e2e DB file persists) and push the
  demo fixtures out of the dashboard's take:5 Recent Orders list while
  piling duplicate timeline events (both broke the first accumulation-run
  of this very spec).
- **Client-island hydration races (session-6 lesson, hit twice):** after a
  FULL page load (`page.goto`) of a client-island page (checkout wizard,
  login form), values typed before React hydrates get WIPED by React's
  adoption of the server DOM — the action then never fires or the Continue
  button never enables. Wait for `page.waitForLoadState("networkidle")`
  after `goto` before filling. Also: the checkout wizard REMOUNTS fresh on
  every navigation into `/checkout` (step 1, empty address fields) — specs
  that re-enter checkout must refill the form.
- `guest-cart.spec.ts` and `guest-checkout.spec.ts` opt OUT of storageState (`test.use({ storageState: { cookies: [], origins: [] } })`) — they are the only specs exercising the cookie-token cart path (the latter end-to-end through a guest order placement); every other cart/wishlist/checkout spec runs authenticated.
- **Non-retrying probes race client navigations (session-13 verify-script
  lesson):** `waitForURL` resolves the moment `router.push` updates the
  address bar — the RSC payload (and the re-rendered DOM) lands AFTER it.
  An immediate `isVisible()` check therefore reads the PREVIOUS page
  state. Live-verification scripts must use retrying `expect(…)`
  assertions (same as the specs); `isVisible()` is only safe on
  server-rendered content or after an explicit settle. Same family as the
  paired-pixel-capture rule: client-island routes need networkidle + a
  settle in A/B sweeps (the round-13 account capture measured 22% on a
  mid-hydration frame; the settled re-capture read the 0.34% baseline).
- **Paired-capture host consistency (session-14 lesson, corrects the
  round-13 artifact diagnosis):** cookies do NOT cross hosts —
  `localhost:3000` and `127.0.0.1:3000` are DIFFERENT cookie jars. A
  login performed on localhost followed by a sweep against 127.0.0.1
  silently renders every authed surface as its GUEST state (/account
  guest-gates to /login) — producing the exact 22.08% account pixel-diff
  artifact that round-13 misattributed to a "mid-hydration frame" (the
  byte-stable diff number was the giveaway: a hydration race produces
  frame variance, a guest redirect is deterministic). Rule: **pick ONE
  host for the whole audit lifecycle, and verify `location.pathname` (not
  just a cookie presence) immediately before authed captures.** The
  agent-browser `eval "location.pathname"` output is JSON-quoted
  (`"/login"` ≠ `/login` in shell string comparison — strip the quotes or
  compare against the quoted form).
- The verify-email happy path consumes the seeded `unverified@example.com` fixture (code `123456`); `prisma/e2e-reset.ts` restores its unverified state + code every run, so specs can rely on it.
- Toast specs: assert position only after the enter spring settles (~450ms) and with ±2px tolerance (the reference's own live values oscillate mid-spring); `getByText("… added to cart!")` resolves to the toast ITEM itself — do not climb to the parent (that's the region).
- Drawer specs cannot assert the header badge while the Radix dialog is open (aria-hidden hides it from the role tree) — assert the drawer's own totals instead.
- **Never build with `bunx next build` (session-12 audit lesson):** the repo's
  `bun run build` wrapper is the ONLY correct build — its `cp -r .next/static`
  + `cp -r public` steps populate `.next/standalone`, which the raw
  `next build` does NOT do. Running the raw command regenerates a standalone
  tree whose static chunks all serve the HTML 200 fallback — every
  `/_next/static/chunks/*.js` request returns markup, the browser throws
  `Unexpected token '<'` pageerrors, hydration never lands, and the whole
  E2E suite fails at setup with inputs wiped after fill. The failure mode
  looks like an app bug but is purely a build-artifact one; re-run
  `bun run build` and it disappears.
- Address-tab specs target the card via the `p` chain (`card >> p`), not `getByText("Home")` — the label span was removed for parity.
- Login credentials for dev/E2E: `john@example.com` / `Demo1234!` (demo user, seeded order history) and `admin@luxestore.com` / `Admin1234!` (admin role).
- Selector gotchas baked into the specs: the footer carries an "Email address" input and a "New York, NY 10001" text that collide with naive `getByLabel`/`getByText` — scope to `getByRole("main")`. The auth screens have NO `main` landmark and NO footer (reference parity) — use page-level selectors there, and target the card's error via the box locator `div.mb-4.p-3.rounded-lg` (session-4; the old `p[role=alert]` form is gone). Radix `aria-hidden`s the page chrome while a dialog is open — close drawers before asserting on the header. Specs that inspect drawer contents open it via `openCartDrawer` (helpers.ts). Wishlist-heart specs use STATE-STABLE locators — the aria-label flips "Add … to wishlist" ↔ "Remove … from wishlist" on toggle, so a name anchored to "Add …" stops matching the moment the toggle lands ("element not found" IS the success signal); match `/«Product» (from|to) wishlist/` instead (session-5). PDP action-row assertions scope to `main .flex.items-center.gap-4.mb-4` — the related-products cards below carry their own wishlist/ATC buttons. The post-order header badge asserts `getByRole("button", { name: "Cart", exact: true })` — exact, because "Cart, N items" contains "Cart" (session-5, CHECKOUT-BADGE-1).
- Dev-DB hygiene after live-audit/manual testing: `bun prisma/dev-cleanup.ts` removes stray orders (anything not in the seed's canonical set), test subscribers, wishlist/cart residue, and (session-7) demo-order `status_changed` events + canonical statuses left by live status-transition testing — targeted deletes, NOT `migrate reset` (which would break the sandbox hard-link contract). The seed is upsert-only and never deletes.

## Tailwind v4 trap log (violations here silently break visual parity)

The reference app was built on Tailwind v3; this port runs v4. Pinned in `src/app/globals.css`:

1. **Colors**: theme values must be FULL `hsl(...)` literals under `@theme inline` — bare `H S% L%` triplets resolve to transparent.
2. **`--shadow-sm` is pinned** to v3's `0 1px 2px 0 rgb(0 0 0 / 0.05)` — v4 moved the scale up a notch.
3. **The radius scale is pinned** (`--radius-xl: .75rem; --radius-2xl: 1rem; --radius-3xl: 1.5rem`) — v4 shifted named radii up a notch too (v4 `2xl` = 20px ≠ reference 16px). Measured pins: card `rounded-2xl` = 16px, button `rounded-xl` = 12px, input `rounded-md` = 10px.
4. **Hero overlay uses the arbitrary `bg-[linear-gradient(...)]`** — v4 interpolates `bg-gradient-to-r` in oklab.
5. **Mobile nav stacks links with flex `gap-4`, never `space-y-*`** — a `space-y-*` panel with `mt-*` children renders different heights on v4 (v4's `:where()` drops specificity).
6. Alpha utilities (`bg-background/80`, `border-border/50`) serialize as `lab(...)` in Chrome instead of v3's `rgba(...)` — same paint, different notation. The parity specs accept both.
7. **The slate palette is pinned to v3 hexes** (`--color-slate-50…800` in `@theme inline`) — v4 redefines the palette in oklch and several steps (e.g. slate-300) drift ~3/255 per channel. The reference's platform 404 is built on v3 slate; the pin keeps it byte-identical.
8. **`space-y-*` never carries the spacing of an inline first child (session-8, SPACE-Y-INLINE-1).** v4 emits `:where(.space-y-N > :not(:last-child)) { margin-block-end }` — margin lands on the NON-LAST child, which is INERT when that child is inline (a bare `<label>`); v3 emitted `margin-top` on FOLLOWING siblings (block-level — always effective). The auth forms lost 8px per `Label + input-wrapper` field. The fix pattern: keep `space-y-2` on the wrapper (DOM parity) and give the block input wrapper `mt-2` (computed parity — the reference's input wrapper measures `margin-top: 8px`). Same engine rule, second face (SPACE-TABS-1): a Tabs root with `space-y-6` + TabsContent `mt-2` renders 24+8=32px on v4 vs v3's 24px (v3's higher-specificity selector REPLACED the panel's own margin instead of stacking) — the account Tabs therefore carries NO `space-y-*`; its TabsContent base `mt-6` supplies the reference's 24px gap alone (margins against an `inline-flex` TabsList do not collapse). Third face (ACCOUNT-BTN-1, superseded by trap 9): session-8 integrated the Save button INTO the fields grid (`gap-4` spacing, `mt-4` forbidden) — desktop computed parity that broke on mobile; session-9 restored the reference's actual anatomy (button OUTSIDE the grid with `mt-4`, see trap 9). `space-y-reverse` is used nowhere and unsupported by these pins.
9. **Grid items STRETCH by default — `sm:w-fit` masks mobile drift (session-9, ACCOUNT-BTN-W-1).** A button placed as a child of `grid grid-cols-1 sm:grid-cols-2` renders full-width below 640px even with `sm:col-span-2 sm:w-fit` (the arbitrary width only engages at ≥640px), and grid `gap-4` can coincide with the reference's flow spacing on desktop — session-8's desktop-only audit passed while mobile measured 308px vs the reference's 127px. The reference's anatomy is the button OUTSIDE the grid as a flow child carrying `mt-4` (fit-content on EVERY viewport). Rule: **audit mobile viewports separately — desktop computed parity does not transitively prove mobile parity.** Pinned by the account mobile describe in `account.spec.ts`.
10. **A base `leading-*` utility beats responsive `text-*` line-heights on v4 (session-10, HERO-LH-1).** The hero h1's class string is byte-identical on both sites (`…text-3xl sm:text-4xl lg:text-5xl… leading-tight`), but v3 emits responsive variants in media layers AFTER base utilities, so `sm:text-4xl`/`lg:text-5xl` re-override `leading-tight` with their own line-heights (40px / 48px) at ≥640/≥1024; v4's sort order lets the base `leading-tight` (1.25 → 45/60px) win at EVERY width. The hero h1 carries `sm:leading-[2.5rem] lg:leading-none` to pin the v3 cascade values (the same engine class as trap 8 — identical classes, different cascade). Rule: **whenever a base `leading-*` coexists with responsive `text-*` sizes, pin the responsive line-heights explicitly.** Pinned by the storefront-parity spec (37.5/40/48px at 630/768/1024).
11. **v4.3 gates every hover-family variant behind `@media (hover: hover)` (session-10, HOVER-GATE-1).** The default `hover` variant is registered (Tailwind `dist/lib.mjs`) as `["&:hover", ["@media", "(hover: hover)", …]]` — plain `hover:*`, `group-hover:*` and breakpoint compounds all become inert in touch/hybrid contexts where `(hover: hover)` fails, while the v3-built reference renders its hover effects whenever `:hover` matches (live-measured both ways: ref nav link → foreground + card img scale(1.05) + primary title with the media query false; a gated build renders none of it). `globals.css` overrides it with `@custom-variant hover (&:hover);` — one line restores v3 semantics for the whole family (the `group-hover` compound composes on top of it, keeping v4's own `:is(:where(.group):hover *)` selector shape). The gate is INVISIBLE to desktop-only audits (the media matches with a mouse) — that is how nine rounds missed it. Rule: **audit interaction states in a touch-emulated context; never re-add the gate.** Note: v4's `scale-*` sets the CSS **`scale` property** (not `transform`) — parity assertions on hovered cards read `getComputedStyle(img).scale` ("1.05"), not `transform`. Pinned by the storefront-parity touch-context spec.
12. **The shadcn v4 starter's body `antialiased` is a typography divergence (session-11, FONT-SMOOTH-1).** The starter globals.css/layout ship `-webkit-font-smoothing: antialiased` (grayscale AA); the reference computes `auto` (subpixel LCD AA — darker text strokes). Invisible to content/computed-font censuses (family/fs/fw identical) and to HEADLESS pixel diffs (headless Chromium can't do subpixel AA — both settings render the same there — it only manifests in real browsers). Rule: **headless screenshots cannot validate font-smoothing parity; assert the computed property, and watch starter-template defaults that the reference's template doesn't carry.** Pinned by the storefront-parity smoothing spec (body computes `auto`, zero `antialiased` rules in the served CSS).
13. **next/font's repackaged woff2 rasterizes differently than the file it downloaded (session-11, FONT-FILE-1).** next/font subsets/repackages Google's woff2 and STRIPS the `prep` table (the TrueType hinting pre-program): advances, outlines, kerning, gvar all stay byte-identical, but glyph rasterization changes — a halo on every letter (VLM-verified), 1-4.8% text-band pixel diffs on every route, and canvas measureText 1013px vs the reference's 1009px for the same string. Fix: the site font is a self-hosted copy of the reference's EXACT Google-served file (`public/fonts/plus-jakarta-sans.woff2`, md5-pinned, declared as a plain `@font-face { font-family: "Plus Jakarta Sans"; font-weight: 200 800; src: url("/fonts/…") }` in globals.css); the next/font import/variable is GONE (`--font-sans: "Plus Jakarta Sans", sans-serif` — the reference's exact stack, no "Fallback" companion face). Pixel diffs collapsed to 0.23-0.60% (the session-10 baseline). Rule: **font parity is FILE parity — if the reference serves a font file, self-host that exact file; never trust a repackaging pipeline to preserve rasterization.** Pinned by the storefront-parity font spec (faces/stack/canvas-width/byte-length).

Computed-style parity is enforced by `tests/e2e/storefront-parity.spec.ts` — values were measured live on the reference. If you change theme tokens, re-measure, don't guess.

## Conventions

- Import alias `@/*` → `src/*`. Components PascalCase; routes kebab-case.
- **The site font is a self-hosted copy of the reference's exact woff2** (session-11, trap 13): `public/fonts/plus-jakarta-sans.woff2` + a plain `@font-face` in `globals.css` (family "Plus Jakarta Sans", `font-weight: 200 800`, `font-display: swap`); NO next/font import remains and the body carries NO `antialiased` (trap 12). `--font-sans: "Plus Jakarta Sans", sans-serif` is the reference's exact computed stack. Product art is remote (`media.base44.com`, `images.unoptimized`) — plain `<img>` tags are used for reference parity; ESLint does not flag them in this repo. The **favicon follows the same remote-CDN parity pattern** (session-7, FAVICON-1): `metadata.icons` in the root layout points at the reference's CDN logo — measured live; `/favicon.ico` itself stays 404 (the reference's is a platform 302). Pinned by the smoke spec.
- **The social/PWA head layer is a parity contract (session-9, METADATA-OG-1).** Every route builds its head via `pageMetadata()` (`src/lib/metadata.ts`, unit-pinned): og:title = document title, og:description = "«Page» on Lumina. " + SITE_DESC on static pages (plain SITE_DESC on home/PDP/404), og:image = the site LOGO (site-wide, even on the PDP), og:url canonical with the QUERY preserved (shop uses `generateMetadata` for this), twitter:url rides in `other` (no typed key). **Next engine constraints learned the hard way:** (1) the twitter resolver force-defaults `twitter:card` whenever the typed twitter field carries images — every non-PDP route wants exactly that, so `card` is deliberately omitted; (2) `appleWebApp.capable` auto-emits `mobile-web-app-capable` — never also hand-emit it via `other` (duplicate tag); (3) the PDP's card-less shape (twitter title/description/image but NEITHER card NOR url) is inexpressible via the Metadata API — the PDP page body carries React-19-hoisted `<meta>` elements for it (plain `<meta name="twitter:…">` in the RSC tree hoists into `<head>`). Pinned by the smoke spec + `metadata.test.ts`.
- Product images live on the reference app's public media CDN by design (pixel parity); swap to owned assets via `prisma/seed.ts` before rebranding.
- `next.config.ts` sets `allowedDevOrigins: ["127.0.0.1", "localhost"]` — Next 16's dev-origin protection otherwise blocks chunk loads on `127.0.0.1` (unhydrated page). `devIndicators: false` keeps the dev "N" badge out of UI screenshots.
- Conventional Commits; never commit `.env`, `db/*.db`, `dev.log`, `tests/e2e/.auth/`.
- **The build script is fresh-clone-safe (session-7, BUILD-1):** `mkdir -p public`
  precedes the standalone copies, and `public/.gitkeep` is committed — a
  bare `git clone` + `bun install` + `bun run build` exits 0 (the directory
  was previously an untracked local artifact; every fresh clone failed at
  `cp -r public`).
- **Dependencies are pruned to what `src/` imports (session-7, DEPS-1):**
  `z-ai-web-dev-sdk`, `zustand`, `@radix-ui/react-toast`,
  `@radix-ui/react-alert-dialog`, `@radix-ui/react-popover`, and
  `tailwindcss-animate` were removed (zero imports; the toast viewport is
  custom per ADR-011 and `tw-animate-css` is the v4 animation import).
  Re-verify with a grep before re-adding any of them.
- **`src/proxy.ts` is the ONLY middleware-proxied file (session-14):**
  Next 16 deprecated the `middleware` filename in favor of `proxy` (same
  NextRequest/NextResponse/matcher API; the exported function is named
  `proxy`). The repo ships the current convention — a `middleware.ts`
  beside it would double-handle requests. The file exists to mint the
  CSP nonce (ADR-022); route logic does NOT belong there (it runs before
  every document request).
