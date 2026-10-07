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
- **PDP document.title = humanized slug** ("Wireless Headphones | Lumina", not the product name); the h1 keeps the full name. The Reviews tab's empty panel is `div.text-center.py-10`; the Shipping tab is plain `p` elements with a literal `✓` prefix.
- PDP "You May Also Like" = ALL same-category products excluding self (no cap/fill); shop chips appear for category + search only.
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
| `bun run test` | Vitest unit suite (66 tests) |
| `bun run test:e2e` | Playwright E2E (107 tests incl. the setup login; requires `bun run build` first) |
| `bun run db:setup` | `db push` + seed |
| `bun run db:reset` | `prisma migrate reset` |

## 5. Testing Strategy

**Pyramid:** Vitest unit (pure domain seams, co-located `*.test.ts`) → Playwright E2E (production standalone server on :3100, isolated `db/e2e.db`, real UI flows).

- Unit layer: `src/lib/*.test.ts` + `tests/db-path.test.ts` — money math (incl. the $9.99 flat-rate pin), passwords, Zod schemas (incl. nameless-register + display-name derivation), rate limiter, DB-path resolution, cart delta-quantity, slug humanization, email-verification codes. TDD red→green→refactor; bug fixes get a failing regression test first.
- E2E layer: `tests/e2e/*.spec.ts` — smoke (incl. the standalone 404 + product-not-found + standalone auth screens + per-route titles), storefront-parity (computed-style gate incl. hero-dot geometry + feature-bar cards + footer Join/separator + home section dividers + PDP heart px-8 geometry), catalog-parity (array order, sort semantics, ratings, descriptions, related-products membership), cart (incl. the no-auto-open drawer pin + $9.99 shipping + toasts + transactional steppers), checkout (incl. the "No items in cart" empty state + the post-order badge re-sync), account (profile icon avatar, highlighted default address, Change-Password section), auth (form contract incl. the error BOX + native validation, nameless registration, forgot-password anti-enumeration), wishlist (incl. add/remove toast asymmetry + heart color states), search (incl. active-filter chips + empty state), mobile navigation, guest-cart (cookie-token path, opts out of storageState), verify-email (fixture-driven happy path + attempts + login gate). `auth.setup.ts` signs in once (rate limiter) and shares storageState; `auth.spec.ts` + `guest-cart.spec.ts` + `verify-email.spec.ts` opt out for logged-out flows. `global-setup.ts` pushes/seeds/resets the e2e DB every run (restoring the unverified fixture). `openCartDrawer` (helpers.ts) is the reference-mirroring way to open the drawer.
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
Single Next.js app with route groups: `src/app/layout.tsx` (minimal shell) · `src/app/(storefront)/` (chrome + all shopper pages: home, shop, PDP, cart [server page + `cart-client.tsx` island], checkout, wishlist, account, admin) · `src/app/(auth)/` (standalone login/register/forgot-password/verify-email + the shared `auth-error.tsx` box) · root `not-found.tsx` (chrome-less platform 404) · `src/app/api/` (3 route handlers) + sitemap/robots. `src/components/{ui,store,account,checkout}` · `src/lib` (domains + actions) · `prisma` (schema + seeds) · `tests` (vitest + playwright). Import direction: app → components → lib → db. `src/lib/db.ts` is server-only — never import it from a `"use client"` file.

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
