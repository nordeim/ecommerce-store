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
  login/register standalone (reference parity: no header/footer); the root
  `not-found.tsx` is the reference's chrome-less platform 404 (slate palette,
  pinned). Unknown PRODUCT slugs render an in-chrome "Product not found"
  block instead (`product/[slug]/page.tsx`).
- **RSC by default.** Pages under `src/app/` are server components querying Prisma directly. `"use client"` only for interactive islands (`src/components/store/*`, `checkout-flow`, `account-tabs`).
- **Server actions are the only mutation seam** (`src/lib/actions/*.ts`): every action Zod-parses input and returns `ActionResult<T>` (`{ ok: true, data } | { ok: false, error: { message, fieldErrors? } }`). Never throw across the boundary.
- Route-handler whitelist: `/api/health`, `/api/search` (typeahead), `/api/newsletter`. Adding more needs a reason.
- Client commerce state lives in ONE place: `StoreProvider` (`src/components/store/store-provider.tsx`) — hydrated from the server on layout render, re-derived after every mutation. Totals are always server truth. The provider's state SURVIVES client-side navigation inside the `(storefront)` group — logout must call `setUser(null)` explicitly (the header otherwise keeps the logged-in icon).
- Adding to cart NEVER opens the cart drawer (reference parity, E2E-pinned) — the badge bumps; the drawer opens only via the header cart button.
- Cart/wishlist identity = cookie token (guest) merged into the user row on login (`src/lib/cart.ts`, `src/lib/wishlist.ts`). Reads never mint rows (a Server Component render cannot set cookies).

## Testing quirks

- Vitest matches `*.test.ts` only; Playwright matches `tests/e2e/*.spec.ts` — no double-pickup.
- Playwright boots the **production standalone server** on port 3100 with the e2e DB. Build before `test:e2e` or the webServer times out.
- The login action is rate-limited (10/15min/IP+email) — that's why `auth.setup.ts` logs in ONCE and saves `tests/e2e/.auth/user.json` as storageState. Don't add per-test logins.
- Login credentials for dev/E2E: `john@example.com` / `Demo1234!` (demo user, seeded order history) and `admin@luxestore.com` / `Admin1234!` (admin role).
- Selector gotchas baked into the specs: the footer carries an "Email address" input and a "New York, NY 10001" text that collide with naive `getByLabel`/`getByText` — scope to `getByRole("main")`. The auth screens have NO `main` landmark and NO footer (reference parity) — use page-level selectors there, and target the card's error via `p[role=alert]` (Next's route announcer also carries `role=alert`). Radix `aria-hidden`s the page chrome while a dialog is open — close drawers before asserting on the header. Specs that inspect drawer contents open it via `openCartDrawer` (helpers.ts).

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
