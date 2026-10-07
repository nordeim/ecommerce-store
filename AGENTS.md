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
  "Login"/"Register"/"Forgot Password") delegating to a `*-form.tsx` client
  island; the root
  `not-found.tsx` is the reference's chrome-less platform 404 (slate palette,
  pinned). Unknown PRODUCT slugs render an in-chrome "Product not found"
  block instead (`product/[slug]/page.tsx`).
- **RSC by default.** Pages under `src/app/` are server components querying Prisma directly. `"use client"` only for interactive islands (`src/components/store/*`, `checkout-flow`, `account-tabs`).
- **Catalog order is a parity contract.** `Product.sortOrder` mirrors the reference's product array position 1:1 (measured live 2026-10-07: headphones, watch, tee, speaker, planter, shoes, serum, blanket, sunglasses, mat, pad, pajama). "Featured" = sortOrder asc; "Top Rated" = `[{rating: desc}, {sortOrder: asc}]` (Prisma ties are otherwise undefined); "Newest" = createdAt desc with the seed's staggered createdAt (array position 1 = oldest). Home's On Sale section = first 4 `isOnSale` products in array order. Changing seed order requires re-measuring the reference.
- **Money is a parity contract (ADR-011).** Flat shipping below the $100 threshold is **$9.99** (`FLAT_SHIPPING_CENTS = 999` in `src/lib/money.ts`, unit-pinned) — measured live at $34.99 and $79.99 subtotals; Free at/above $100. The seeded demo orders store their own totals and are unaffected.
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
- **PDP related products = ALL same-category products excluding self** in
  array (sortOrder) order — no cap, no cross-category fill (measured live:
  headphones → speaker + pad only). Shop active-filter chips render for
  category (plain name) and search (quoted term) ONLY — price/sort never
  chip; clicking a chip deep-links to the URL minus that param. The PDP
  document.title is the **humanized slug** ("Wireless Headphones | Lumina"),
  NOT the product name (measured live across all 11 slugs); the h1 keeps
  the full name. The Reviews tab's empty panel is `div.text-center.py-10`;
  the Shipping tab is plain `p` elements with a literal `✓` prefix (NO
  icons — only the Description tab's Key Features uses lucide checks).
- **Cart mutations resolve the guest token from the cookie** (`src/lib/cart.ts`).
  The mutation seam (`addItem`/`changeQuantityBy`/`removeItem`) reads
  `cookies().get(CART_COOKIE)` and passes the token to `resolveCartRow` —
  passing `undefined` silently minted a new cart per guest add and made
  guest steppers read as empty (the session-4 live-audit bug; pinned by
  `tests/e2e/guest-cart.spec.ts`, which opts out of storageState).
- **Steppers post DELTAS, not absolutes** (ADR-011): the drawer and /cart
  steppers call `adjustQuantity(itemId, ±1)`; the server applies them inside
  `db.$transaction` (`changeQuantityBy`) so rapid clicks each land exactly
  once. The old absolute API lost updates when two clicks raced one
  re-render. Remove is its own action (`removeCartItemAction`).
- **Deliberate divergences (superset behavior, do not "fix"):** the mobile nav auto-closes on navigation (the reference's Sheet stays open — verified live twice, a demo quirk); the hero carousel pauses on hover (the reference keeps cycling — verified live 11s); the Settings tab keeps a Session/Log out card (the reference has NO logout anywhere); the newsletter form shows a real confirmation (the reference's submit is a no-op); `/cart` renders real contents (the reference hardcodes its empty state); the checkout wizard writes real orders (the reference's checkout cannot see its own cart); shop filters/sort are URL-deep-linkable (the reference's SPA never updates the URL); the drawer keeps aria-labels + disabled-minus (the reference's stepper buttons are unlabeled); the footer's Shop-column links deep-link category filters (the reference's all point at plain `/shop` — its header links DO filter); the toast region is pointer-events-none + aria-live (the reference's toasts are inert on click); the toast spring is a CSS approximation; `/verify-email` is titled "Verify Email | Lumina" (the reference keeps the SPA's stale "Register | Lumina"); verification is env-gated off by default (the reference always gates — no email provider is wired here).
- **Server actions are the only mutation seam** (`src/lib/actions/*.ts`): every action Zod-parses input and returns `ActionResult<T>` (`{ ok: true, data } | { ok: false, error: { message, fieldErrors? } }`). Never throw across the boundary.
- Route-handler whitelist: `/api/health`, `/api/search` (typeahead), `/api/newsletter`. Adding more needs a reason.
- Client commerce state lives in ONE place: `StoreProvider` (`src/components/store/store-provider.tsx`) — hydrated from the server on layout render, re-derived after every mutation. Totals are always server truth. The provider's state SURVIVES client-side navigation inside the `(storefront)` group — logout must call `setUser(null)` explicitly (the header otherwise keeps the logged-in icon).
- Adding to cart NEVER opens the cart drawer (reference parity, E2E-pinned) — the badge bumps; the drawer opens only via the header cart button. The drawer item row is reference-exact (E2E-pinned): plain truncated h4 name, bold unit price, gap-2 stepper+trash, right-side line total, border-separated rows, `text-primary` "Free", `font-bold text-lg` total.
- Cart/wishlist identity = cookie token (guest) merged into the user row on login (`src/lib/cart.ts`, `src/lib/wishlist.ts`). Reads never mint rows (a Server Component render cannot set cookies).

## Testing quirks

- Vitest matches `*.test.ts` only; Playwright matches `tests/e2e/*.spec.ts` — no double-pickup.
- Playwright boots the **production standalone server** on port 3100 with the e2e DB. Build before `test:e2e` or the webServer times out.
- The login action is rate-limited (10/15min/IP+email) and the password-reset action 5/15min — that's why `auth.setup.ts` logs in ONCE and saves `tests/e2e/.auth/user.json` as storageState. Don't add per-test logins.
- Register specs do NOT fill a Name field (the reference form has none — the action derives it); register specs must use a fresh random email per run (`e2e-<ts>@example.com`) because the e2e-reset clears only `e2e-*` spec users.
- `guest-cart.spec.ts` opts OUT of storageState (`test.use({ storageState: { cookies: [], origins: [] } })`) — it is the only spec exercising the cookie-token cart path; every other cart/wishlist spec runs authenticated.
- The verify-email happy path consumes the seeded `unverified@example.com` fixture (code `123456`); `prisma/e2e-reset.ts` restores its unverified state + code every run, so specs can rely on it.
- Toast specs: assert position only after the enter spring settles (~450ms) and with ±2px tolerance (the reference's own live values oscillate mid-spring); `getByText("… added to cart!")` resolves to the toast ITEM itself — do not climb to the parent (that's the region).
- Drawer specs cannot assert the header badge while the Radix dialog is open (aria-hidden hides it from the role tree) — assert the drawer's own totals instead.
- Address-tab specs target the card via the `p` chain (`card >> p`), not `getByText("Home")` — the label span was removed for parity.
- Login credentials for dev/E2E: `john@example.com` / `Demo1234!` (demo user, seeded order history) and `admin@luxestore.com` / `Admin1234!` (admin role).
- Selector gotchas baked into the specs: the footer carries an "Email address" input and a "New York, NY 10001" text that collide with naive `getByLabel`/`getByText` — scope to `getByRole("main")`. The auth screens have NO `main` landmark and NO footer (reference parity) — use page-level selectors there, and target the card's error via the box locator `div.mb-4.p-3.rounded-lg` (session-4; the old `p[role=alert]` form is gone). Radix `aria-hidden`s the page chrome while a dialog is open — close drawers before asserting on the header. Specs that inspect drawer contents open it via `openCartDrawer` (helpers.ts).

## Tailwind v4 trap log (violations here silently break visual parity)

The reference app was built on Tailwind v3; this port runs v4. Pinned in `src/app/globals.css`:

1. **Colors**: theme values must be FULL `hsl(...)` literals under `@theme inline` — bare `H S% L%` triplets resolve to transparent.
2. **`--shadow-sm` is pinned** to v3's `0 1px 2px 0 rgb(0 0 0 / 0.05)` — v4 moved the scale up a notch.
3. **The radius scale is pinned** (`--radius-xl: .75rem; --radius-2xl: 1rem; --radius-3xl: 1.5rem`) — v4 shifted named radii up a notch too (v4 `2xl` = 20px ≠ reference 16px). Measured pins: card `rounded-2xl` = 16px, button `rounded-xl` = 12px, input `rounded-md` = 10px.
4. **Hero overlay uses the arbitrary `bg-[linear-gradient(...)]`** — v4 interpolates `bg-gradient-to-r` in oklab.
5. **Mobile nav stacks links with flex `gap-4`, never `space-y-*`** — a `space-y-*` panel with `mt-*` children renders different heights on v4 (v4's `:where()` drops specificity).
6. Alpha utilities (`bg-background/80`, `border-border/50`) serialize as `lab(...)` in Chrome instead of v3's `rgba(...)` — same paint, different notation. The parity specs accept both.
7. **The slate palette is pinned to v3 hexes** (`--color-slate-50…800` in `@theme inline`) — v4 redefines the palette in oklch and several steps (e.g. slate-300) drift ~3/255 per channel. The reference's platform 404 is built on v3 slate; the pin keeps it byte-identical.

Computed-style parity is enforced by `tests/e2e/storefront-parity.spec.ts` — values were measured live on the reference. If you change theme tokens, re-measure, don't guess.

## Conventions

- Import alias `@/*` → `src/*`. Components PascalCase; routes kebab-case.
- `next/font/google` (Plus Jakarta Sans via `--font-jakarta`); product art is remote (`media.base44.com`, `images.unoptimized`) — plain `<img>` tags are used for reference parity; ESLint does not flag them in this repo.
- Product images live on the reference app's public media CDN by design (pixel parity); swap to owned assets via `prisma/seed.ts` before rebranding.
- `next.config.ts` sets `allowedDevOrigins: ["127.0.0.1", "localhost"]` — Next 16's dev-origin protection otherwise blocks chunk loads on `127.0.0.1` (unhydrated page). `devIndicators: false` keeps the dev "N" badge out of UI screenshots.
- Conventional Commits; never commit `.env`, `db/*.db`, `dev.log`, `tests/e2e/.auth/`.
