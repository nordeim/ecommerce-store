---
name: ecommerce-store
description: >
  Comprehensive engineering skill for the LUXE Store codebase — a
  production-grade Next.js 16 e-commerce clone of a Tailwind v3 reference
  app, delivered on Tailwind v4 via a pinned token system with Prisma/SQLite
  persistence. Use when extending, debugging, testing, onboarding onto, or
  replicating this architecture.
version: 1.17.0
last_updated: "2026-10-08"
tags:
  - e-commerce
  - nextjs
  - app-router
  - tailwind-v4
  - prisma
  - sqlite
  - visual-parity
  - testing
---

# ecommerce-store_SKILL.md — LUXE Store

> **How to use this document:** Sections are self-contained; read §2 + §5
> before touching code, §4 + §19 before touching styles, §9 + §10 when
> something is broken, §11 before pushing. Every claim below is verifiable
> against a specific file or command — paths are absolute from the repo root.
> Companion docs: `AGENTS.md` (agent cheat-sheet), `CLAUDE.md` (workflow),
> `Project_Architecture_Document.md` (PAD — ADRs and rationale),
> `docs/Tailwind-V4-Validation-Report.md` (trap log detail),
> `docs/remediation-plan-session1.md` … `session10.md` (post-push audits).

---

## Table of Contents

1. [Project Identity & Design Philosophy](#1-project-identity--design-philosophy)
2. [Tech Stack & Environment](#2-tech-stack--environment)
3. [Bootstrapping & Configuration](#3-bootstrapping--configuration)
4. [The Design System (Code-First)](#4-the-design-system-code-first)
5. [Component Architecture & Patterns](#5-component-architecture--patterns)
6. [Client State Deep Dive (StoreProvider)](#6-client-state-deep-dive-storeprovider)
7. [Content & Data Management](#7-content--data-management)
8. [Accessibility Implementation](#8-accessibility-implementation)
9. [Anti-Patterns & Common Bugs](#9-anti-patterns--common-bugs)
10. [Debugging Guide](#10-debugging-guide)
11. [Pre-Ship Checklist](#11-pre-ship-checklist)
12. [Lessons Learnt & How to Avoid Them](#12-lessons-learnt--how-to-avoid-them)
13. [Pitfalls to Avoid](#13-pitfalls-to-avoid)
14. [Best Practices](#14-best-practices)
15. [Coding Patterns](#15-coding-patterns)
16. [Coding Anti-Patterns](#16-coding-anti-patterns)
17. [Responsive Breakpoint Reference](#17-responsive-breakpoint-reference)
18. [Z-Index Layer Map](#18-z-index-layer-map)
19. [Color Reference (Complete)](#19-color-reference-complete)
20. [TypeScript Interface Reference](#20-typescript-interface-reference)
- [Appendix A: ADR Index](#appendix-a-adr-index)
- [Appendix B: The Meticulous Workflow](#appendix-b-the-meticulous-workflow)
- [Appendix C: Quick Reference Card](#appendix-c-quick-reference-card)

---

## 1. Project Identity & Design Philosophy

**One sentence:** LUXE Store is a self-hosted, database-backed clone of the
reference storefront `fuzzy-lumina-style-hub.base44.app` — every surface the
reference renders is reproduced at computed-style parity, and every demo/mock
behavior is replaced by real persistence (accounts, carts, wishlists,
checkout, order history, admin console).

**Design thesis:** "warm minimal commerce" — a light `#FBFAF9` paper
background, ink text, one saturated terracotta-orange primary used sparingly
(announcement bar, CTAs, badges, active hearts), generous 7xl-max content
column, soft 12–16px radii, and a single accent font (Plus Jakarta Sans)
carrying the whole typographic identity. Nothing else competes.

**Non-negotiable rules:**
- The reference's RESTING VISUALS are law: computed styles (colors, radii,
  shadows, geometry), not screenshots, are the acceptance gate
  (`tests/e2e/storefront-parity.spec.ts`).
- Superset features (real cart, admin console, checkout success page) must
  not change the resting visual of any parity surface.
- Edge states mirror the reference exactly, even when "uglier": the platform
  404 is the reference's slate-gray screen (NOT the warm theme), auth screens
  carry no chrome, the empty checkout says "No items in cart" with a bare
  h1 + default button.
- Interaction parity counts: adding to cart bumps the badge only (no drawer
  auto-open); the drawer opens exclusively via the header cart button.

**CTA hierarchy:** primary orange pill (announcement → hero → cards →
checkout); outline secondary everywhere else; text links for tertiary
navigation. Destructive red is reserved for discount badges and remove
actions.

**Anti-generic mandate:** no purple/blue gradients, no glassmorphism cards,
no drop shadows heavier than the pinned v3 `shadow-sm`, no 8px+ border
radii on buttons (the reference is 12px `rounded-xl`), no icon-only buttons
without aria-labels, no Inter/Roboto (Plus Jakarta Sans or nothing).

## 2. Tech Stack & Environment

Verified against the lockfile (`bun pm ls`, 2026-10-07):

| Layer | Technology | Version | Critical Note |
|---|---|---|---|
| Framework | next | 16.4.0 | App Router ONLY; `output: "standalone"`; proxy-less; async `params`/`cookies()` |
| UI runtime | react / react-dom | 19.3.0 | Compiler lints ON — `react-hooks/set-state-in-effect` is an ERROR |
| Language | typescript | 5.9.3 | `strict`; `tsc --noEmit` is the gate (build has `ignoreBuildErrors` from the scaffold) |
| Styling | tailwindcss + @tailwindcss/postcss | 4.3.3 | CSS-first `@theme inline`; NO tailwind.config.*; v3-parity pins are load-bearing (§4) |
| UI primitives | @radix-ui/react-* (dialog, select, tabs, popover, label, radio-group, alert-dialog, toast, slot) | 1.x–2.x | shadcn-style wrappers in `src/components/ui/` |
| Variants | class-variance-authority 0.7.1 + clsx + tailwind-merge 3.3.1 | — | `cn()` helper in `src/lib/utils.ts` |
| Icons | lucide-react | 0.525.0 | Exact reference icon set (`lucide-shopping-bag`, `lucide-menu`, …) |
| ORM | prisma + @prisma/client | 6.19.3 | SQLite provider; 13 models; `db push` (no migrations dir) |
| Database | SQLite | — | `db/custom.db` (dev) / `db/e2e.db` (E2E); single-writer |
| Validation | zod | 3.25.76 | Actions + route handlers + test fixtures |
| Unit tests | vitest | 5.0.3 | node env; `*.test.ts` only |
| E2E tests | @playwright/test | 1.63.0 | Chromium; production standalone server on :3100 |
| Runtime/PM | bun | ≥1.3 | Runs TS directly (seed, global-setup); `bun run` scripts |

**Environment variables (3 — see `.env.example`):**

| Variable | Purpose | Default/dev |
|---|---|---|
| `DATABASE_URL` | SQLite location, schema-relative `file:` URL | `file:../db/custom.db` |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata/sitemap/robots | `http://localhost:3000` |
| `AUTH_SECRET` | HMAC secret for the session cookie (REQUIRED in prod) | insecure dev constant |

**⚠ Environment shadowing:** Bun loads `.env` walking UP parent directories,
and a `DATABASE_URL` already in the process environment (shell export, CI
inject, parent `.env`) WINS over the repo `.env`. Symptom: repo-root
`db/custom.db` never appears / stale rows survive reseeds. Diagnose:
`bun -e "console.log(process.env.DATABASE_URL)"` from the repo root.

## 3. Bootstrapping & Configuration

```bash
git clone git@github.com:nordeim/ecommerce-store.git && cd ecommerce-store
bun install
cp .env.example .env        # DATABASE_URL="file:../db/custom.db"
bun run db:setup            # prisma db push + idempotent seed
bun run dev                 # http://localhost:3000 (logs tee'd to dev.log)
```

Demo accounts (seeded): `john@example.com` / `Demo1234!` (order history) ·
`admin@luxestore.com` / `Admin1234!` (admin console at `/admin`).

**Configuration files (what each pins):**

| File | Role |
|---|---|
| `next.config.ts` | `output: "standalone"`; `outputFileTracingRoot` pinned to the repo (parent-workspace safety); `allowedDevOrigins: ["127.0.0.1","localhost"]` (Next 16 dev-origin protection); `devIndicators: false` (clean screenshots); `images.unoptimized` + `remotePatterns: media.base44.com` |
| `tsconfig.json` | strict; alias `@/*` → `src/*` |
| `eslint.config.mjs` | ESLint 9 flat; `next/core-web-vitals` + `next/typescript`; `@next/next/no-img-element` OFF (reference parity uses plain `<img>` for CDN art) |
| `vitest.config.ts` | `include: ["src/**/*.test.ts", "tests/**/*.test.ts"]`, node env, `@` alias — never picks up Playwright `*.spec.ts` |
| `playwright.config.ts` | 1 worker (shared SQLite file); setup project (single login → storageState); webServer = standalone build on :3100 with `DATABASE_URL=file:../db/e2e.db` |
| `postcss.config.mjs` | `@tailwindcss/postcss` only |
| `components.json` | shadcn-style registration (aliases for `ui/`) |

**Commands:** `dev` · `build` (build + assemble standalone) · `start` ·
`lint` · `typecheck` · `test` · `test:e2e` · `db:push` · `db:seed` ·
`db:setup` (push + seed) · `db:reset`.

## 4. The Design System (Code-First)

All tokens live in `src/app/globals.css` under `@theme inline` — there is no
Tailwind config file. The values were MEASURED on the live reference
(2026-10-07), not chosen.

### 4.1 Theme tokens

```css
--color-background: hsl(30 25% 98%);        /* #FBFAF9 page paper   */
--color-foreground: hsl(240 10% 10%);       /* #17171C ink + footer */
--color-card: hsl(0 0% 100%);
--color-primary: hsl(24 80% 50%);           /* #E66B1A terracotta   */
--color-primary-foreground: hsl(0 0% 100%);
--color-secondary: hsl(30 15% 94%);         /* chips, placeholders  */
--color-muted-foreground: hsl(240 5% 46%);  /* #6F6F7B secondary tx */
--color-accent: hsl(24 80% 96%);
--color-accent-foreground: hsl(24 80% 30%);
--color-destructive: hsl(0 84% 60%);        /* discount badges      */
--color-border: hsl(30 15% 90%);            /* hairlines            */
--color-ring: hsl(24 80% 50%);
```

### 4.2 The v3-parity pin system (the trap log — violations silently break parity)

The reference compiles Tailwind v3 classes; this port runs v4. Same class
strings, DIFFERENT engine → seven measured differences, all pinned in
`globals.css`:

1. **Colors** — theme values must be FULL `hsl(...)` literals; bare
   `H S% L%` triplets resolve to transparent under `@theme inline`.
2. **`--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)`** — v4 moved the shadow
   scale up a notch.
3. **Radius scale pinned** — `--radius-xl: .75rem; --radius-2xl: 1rem;
   --radius-3xl: 1.5rem` (v4 `2xl`=20px ≠ reference 16px). Measured: card
   `rounded-2xl`=16px, button `rounded-xl`=12px, input `rounded-md`=10px.
4. **Hero overlay** uses the arbitrary `bg-[linear-gradient(...)]` sRGB form —
   v4 interpolates `bg-gradient-to-r` in oklab.
5. **Mobile nav stacks with flex `gap-4`, never `space-y-*` + `mt-*`** — v4's
   `:where()` drops specificity and renders different row heights.
6. **Alpha utilities** (`bg-background/80`) serialize as `lab(...)` in Chrome
   vs v3's `rgba(...)` — same paint, different notation; parity specs accept
   both.
7. **Slate palette pinned to v3 hexes** (`--color-slate-50…800`) — v4's
   oklch palette drifts ~3/255 per channel on some steps (slate-300); the
   platform 404 is built on v3 slate and must stay byte-identical.
8. **`space-y-*` never carries the spacing of an inline first child**
   (session-8, SPACE-Y-INLINE-1). v4 emits
   `:where(.space-y-N > :not(:last-child)) { margin-block-end }` — the
   margin lands on the NON-LAST child and is INERT when that child is
   inline (a bare shadcn `<label>`); v3 emitted `margin-top` on
   FOLLOWING block siblings (always effective). Fix pattern: keep
   `space-y-2` on the wrapper and give the block input wrapper `mt-2`.
   Same engine, other faces: a Tabs root must NOT carry `space-y-*`
   (the TabsContent base `mt-6` supplies the 24px reference gap), and a
   button inside a `gap-4` grid must NOT add `mt-4` (the gap is already
   the reference's 16px).

### 4.3 Typography & motion

- **Plus Jakarta Sans** (weights 400–800) via `next/font/google`
  (`--font-jakarta`), applied through `--font-sans`. No other family.
- Scale: `text-xs`(12) chips → `text-sm`(14) body/nav → `text-2xl`(24) card
  headings/auth titles → `text-3xl`(30) PDP price/page titles →
  `text-7xl`(72) the 404 numeral.
- Rating stars: `fill-amber-400 text-amber-400`, single star + number +
  `(count)` — NOT a 5-star row.
- Motion budget: hover zooms 500ms, card Add-to-Cart slide-up 300ms, Sheet
  slide 500ms open / 300ms close, `transition-colors` 150–200ms elsewhere.
  No spring physics, no parallax.

## 5. Component Architecture & Patterns

### 5.1 Layers (Golden Rule: imports point downward only)

```
app (routes) → components (ui/store/account/checkout) → lib (domains+actions) → db (Prisma)
```

- **Layer 0 Data:** `src/lib/db.ts` — the ONLY Prisma instantiation
  (globalThis HMR-safe singleton); sets `process.env.DATABASE_URL` via
  `src/lib/db-path.ts` at import time. Never import from a client file.
- **Layer 1 Domains:** `src/lib/{auth,password,cart,wishlist,money,validation,rate-limit}.ts`
  — server modules, no React imports.
- **Layer 2 Mutations:** `src/lib/actions/*.ts` — the ONLY write seam
  (`"use server"` + Zod + `ActionResult<T>`).
- **Layer 3 Rendering:** RSC pages + client islands.
- **Layer 4 Chrome:** `src/app/(storefront)/layout.tsx` owns header/footer/
  overlays and server-hydrates `StoreProvider`; the ROOT layout stays
  chrome-free (ADR-008).

### 5.2 Route groups (URL-neutral)

| Group | Layout | Contains |
|---|---|---|
| — (root) | `src/app/layout.tsx` — html/body/font/metadata ONLY | `not-found.tsx` (chrome-less platform 404), `api/*`, `sitemap.ts`, `robots.ts` |
| `(storefront)` | chrome + StoreProvider hydration | home, `shop/`, `product/[slug]/`, `cart/` (server page owning "Cart | Lumina" + `cart-client.tsx` island), `checkout/` (+success), `wishlist/`, `account/`, `admin/` |
| `(auth)` | `min-h-screen flex items-center justify-center bg-background px-4` | `login/`, `register/`, `forgot-password/`, `verify-email/` — standalone cards, no chrome. Each route = server `page.tsx` (owns `Metadata`; root template appends "\| Lumina") + a `*-form.tsx` client island; the tinted error BOX (`auth-error.tsx`) is shared by all four screens |

Consequences: the auth routes are statically prerendered; unknown PRODUCT
slugs render an in-chrome "Product not found" block (`product/[slug]/page.tsx`)
while unknown ROUTES hit the chrome-less 404; the StoreProvider instance
survives client navigation inside `(storefront)` — logout MUST call
`setUser(null)` (§6).

### 5.3 Component inventory (55 tsx in src; 26 `"use client"`)

| Directory | Contents |
|---|---|
| `src/components/ui/` | shadcn-style primitives with the reference's exact class strings: button, badge, input, label, separator, select, sheet, tabs, radio-group, toast |
| `src/components/store/` | announcement-bar, header (nav + cart badge + account icon), search-bar (typeahead combobox), mobile-nav (left Sheet w-72), cart-drawer (right Sheet, delta steppers), product-card (toast on add), buy-panel (toast on add), hero-carousel, category-showcase (feature bar as bordered cards), footer, star-rating, store-provider (cart/wishlist/user + toast queue), toast-viewport |
| `src/components/account/` | account-tabs (4 tabs, useActionState forms; reference anatomy: User-icon avatar, highlighted default address card, Change Password/Notifications sections + Session superset), admin rows |
| `src/components/checkout/` | checkout-flow (3-step wizard client island) |

### 5.4 Server/client decision tree

- Needs an event handler / browser API / animation → `"use client"` island;
  everything else stays RSC.
- Client islands receive SERIALIZED data (DTOs), never Prisma objects.
- A page is `export const dynamic = "force-dynamic"` if it reads cookies/DB;
  auth pages are static by construction.

## 6. Client State Deep Dive (StoreProvider)

`src/components/store/store-provider.tsx` — the SINGLE client commerce seam.
There are no custom hooks; one context covers all state:

- **Server-truth domain state:** `cart: CartDto`, `user: SessionUser | null`,
  `wishlist: Set<string>`, `hydrated: boolean`. Initialized from server
  props (SSR payload) at mount, then re-fetched on mount
  (`getCartAction` / `getWishlistIdsAction` / `currentUserAction`), and
  re-derived after every mutation (`addToCart`, `updateQuantity`,
  `toggleWishlist` set the server's response, never optimistic local math).
- **UI state:** `cartOpen`, `mobileNavOpen`, `searchOpen` + setters — so any
  surface (card, PDP, header) can open the overlays.
- **`setUser`** — exposed specifically for logout: the provider instance
  survives client-side navigation inside the `(storefront)` group, so the
  logout handler must clear the user explicitly or the header keeps the
  logged-in icon (found by the route-group refactor, E2E-pinned).
- **Consumed via `useStore()`** which throws outside the provider (auth
  pages and the 404 render without it — never import store-dependent chrome
  there).

## 7. Content & Data Management

- **13 Prisma models** (`prisma/schema.prisma`, 175 lines): User, Session,
  Category, Product, Cart, CartItem, Wishlist, WishlistItem, Address, Order,
  OrderItem, OrderEvent, NewsletterSubscriber. Money = INTEGER CENTS
  everywhere; "enums" (role/status/type) = String + Zod unions (SQLite has
  no enums).
- **Seed** (`prisma/seed.ts`): idempotent natural-key upserts — 6 categories,
  12 products (the reference catalog transcribed verbatim: names, prices,
  ratings, review counts, badges, descriptions), 3 demo orders pinned to the
  reference account page (ORD-2026-001 $349.98 delivered · 002 $189.00 in
  transit · 003 $524.97 delivered — 003's total is pinned; line items sum to
  524.98), demo user + admin user, 3 hero slides, demo address.
- **Catalog order is a parity contract (ADR-009):** `Product.sortOrder`
  mirrors the reference's array position 1:1 (headphones=1, watch=2, tee=3,
  speaker=4, planter=5, shoes=6, serum=7, blanket=8, sunglasses=9, mat=10,
  pad=11, pajama=12); the seed staggers `createdAt` by the same position
  (position 1 = oldest) so "Newest" = `createdAt desc` = reverse array
  order; "Top Rated" = `[{rating: desc}, {sortOrder: asc}]` (Prisma ties
  are otherwise undefined). Home's On Sale = first 4 `isOnSale` products in
  array order. E2E-pinned by `tests/e2e/catalog-parity.spec.ts`.
- **Auth forms are a parity contract (ADR-010/011):** register collects exactly
  [Email, Password, Confirm Password] — the reference has NO Name field;
  `registerSchema.name` is optional and `registerAction` derives the display
  name from the email local part (`deriveDisplayName`, `src/lib/validation.ts`:
  `john.doe@x` → "John Doe"; `User.name` stays required in Prisma). Password
  inputs carry the `••••••••` placeholder (8-char minimum, no complexity
  rule — measured). All auth screens share the reference anatomy: header
  tile OUTSIDE the card, `h-12` icon-led inputs, "or" line-and-label divider,
  and the tinted error BOX (`src/app/(auth)/auth-error.tsx`:
  `div.mb-4.p-3.rounded-lg.bg-destructive/10.text-destructive.text-sm`, first
  child of the card) — NO `noValidate` (native `type=email` validation is
  the reference's contract). Error copy pinned: "Invalid email or password",
  "A user with this email already exists", "Passwords do not match".
  `/forgot-password` runs `requestPasswordResetAction`: Zod email,
  rate-limited 5/15min/IP+email, anti-enumeration (the user lookup feeds
  only a `console.info` seam — never the response; every submit shows the
  same neutral confirmation). E2E-pinned by `tests/e2e/auth.spec.ts`.
- **Email verification (ADR-011, env-gated):** the reference gates
  registration behind a 6-digit "Verify your email" screen and blocks
  unverified logins ("Please verify your email before logging in. Check your
  email for the verification code."). The clone ships the full machinery —
  `User.emailVerified` + `verificationHash`/`verificationExpiresAt`/
  `verificationAttempts`, `/verify-email` route,
  `verifyEmailAction`/`resendVerificationAction`, 5-attempt budget, 15-min
  TTL, scrypt-hashed codes — gated behind `AUTH_REQUIRE_EMAIL_VERIFICATION`
  (default OFF: no email provider is wired; codes log at the seam; an
  always-on gate would lock out every new user). E2E drives the flow via the
  seeded `unverified@example.com` fixture (code `123456`, restored by
  `prisma/e2e-reset.ts` every run).
- **Money is a parity contract (ADR-011):** flat shipping below $100 is
  **$9.99** (`FLAT_SHIPPING_CENTS = 999` in `src/lib/money.ts`, unit-pinned);
  Free at/above. Seeded demo orders store their own totals — unaffected.
- **PDP related products = ALL same-category products excluding self**, in
  array (sortOrder) order — no cap, no cross-category fill (measured live:
  headphones → speaker + pad; planter → blanket; sunglasses → watch). Shop
  active-filter chips render for category (plain name) and search (quoted
  term) ONLY — price/sort never chip; each chip deep-links to the URL minus
  that param.
- **Product imagery** loads from the reference's public CDN
  (`media.base44.com`, `images.unoptimized: true`, plain `<img>` for
  byte-parity). Swap to owned assets in the seed before rebranding.
- **Adding a product** = 3 steps: 1) append to `PRODUCTS` in `prisma/seed.ts`
  (slug, name, cents, image URL, flags); 2) `bun run db:setup`; 3) no code
  changes — PLP/PDP/home sections are all query-driven.
- **Guest identity:** carts/wishlists key on signed 192-bit cookie tokens
  (`luxe_cart`, `luxe_wishlist`); login MERGES the guest row into the user
  row (quantity-max union) inside the login action; reads never mint rows.
  Cart MUTATIONS resolve the guest token from the cookie inside the action
  (`src/lib/cart.ts`) — passing `undefined` silently minted a NEW cart per
  guest add and made guest steppers read as empty (the session-4 latent
  bug; pinned by `tests/e2e/guest-cart.spec.ts`, which opts out of
  storageState).
- **Steppers post DELTAS (ADR-011):** `adjustQuantity(itemId, ±1)` →
  `adjustCartItemAction` → transactional `changeQuantityBy` — rapid clicks
  each land exactly once; the old absolute API computed `item.quantity + 1`
  from stale render state and lost updates when two clicks raced one
  re-render. Remove is its own action (`removeCartItemAction`).
- **Toast subsystem (ADR-011):** cart adds + wishlist ADDS toast
  "«name» added to cart!" / "… added to wishlist!" via `notify` in
  StoreProvider → `ToastViewport` (`fixed bottom-6 right-6 z-[100]`, dark
  box, CircleCheckBig accent, 3000 ms, stacks without dedupe); wishlist
  REMOVE is silent. Region is `pointer-events-none` + `aria-live=polite`
  (registered divergences: reference toasts are inert on click; the spring
  is a CSS `@starting-style` approximation).
- **Wishlist hearts are a color contract (session-5, ADR-012):** ACTIVE
  hearts are `fill-destructive text-destructive` (red rgb(239,67,67)) on
  BOTH the PDP buy-panel heart and the product-card hearts — NOT primary
  orange. The card heart is muted inactive (`h-4 w-4 transition-colors
  text-muted-foreground`, rgb(111,111,123)); the PDP heart is `h-5 w-5`
  foreground-inactive with an `h-10 px-8` button (82px — px-4 lets the
  flex-1 ATC absorb 32px; ATC + heart svgs carry `h-5 w-5`, rendered 16px
  by the Button `[&_svg]:size-4` base on both sites). Mobile: px-8
  reproduces the reference's iPhone-14 row exactly — its heart is clipped
  ~35px past the 390px viewport (scrollWidth 425); that's parity, not a
  bug to fix. The reference's wishlist is COSMETIC (toggles fire no
  network call; its wishlist page never fetches entities) — the clone's
  DB-backed wishlist is the superset.
- **Home section dividers (session-5):** the home page frames its product
  sections with TWO `shrink-0 bg-border h-[1px] w-full max-w-7xl mx-auto`
  hairlines — after the feature bar and between New Arrivals and On Sale
  (measured live + present in the session-0 recon HTML; missed for four
  rounds because full-page screenshots lazy-load the reference's
  below-fold sections — DOM comparison is the ground truth).
- **StoreProvider re-syncs from server truth (ADR-012):** when a
  `router.refresh()` delivers changed `initialCart`/`initialUser`/
  `initialWishlistIds` prop identities, the provider re-syncs via
  adjust-state-during-render — "last seen props" in STATE, not a ref (the
  React Compiler `refs` rule forbids ref access during render). Found as
  CHECKOUT-BADGE-1: the header badge kept the stale cart count after order
  placement until a manual reload (the refresh DID deliver an empty cart
  prop; the state just never re-read it).

## 8. Accessibility Implementation

- Radix primitives carry the ARIA weight (Dialog/Sheet, Select, Tabs,
  RadioGroup) — do not hand-roll equivalents.
- Every icon-only button has an `aria-label` (cart button: `Cart, N items`;
  hamburger: `Open navigation menu`; hearts: `Add/Remove X to/from wishlist`;
  steppers: `Increase/Decrease quantity`).
- The mobile nav Sheet traps focus; Escape and backdrop dismiss; nav links
  auto-close on navigation (E2E-pinned). Deliberate divergence: the
  reference's Sheet STAYS OPEN after link navigation (verified live twice —
  a demo quirk); the clone keeps the production-correct auto-close. Do not
  "fix" this back to the reference behavior.
- Form errors surface in `p[role=alert]` (red `text-destructive`).
  ⚠ Next's route announcer ALSO carries `role=alert` — scope selectors with
  `p[role=alert]`, not bare `getByRole("alert")`.
- Auth screens and the 404 have NO `main` landmark (reference parity — the
  reference platform renders them outside the app shell). Storefront pages
  all have `<main class="flex-1">`.
- Touch targets: cart/wishlist/menu buttons ≥ 36–44px. Contrast:
  `muted-foreground` was AA-darkened vs the reference's raw value.

## 9. Anti-Patterns & Common Bugs

| # | Symptom | Root Cause | Fix |
|---|---|---|---|
| 1 | Cards/buttons render 4px "off" radii; shadows feel heavier | Tailwind v4 shifted BOTH scales one notch | Restore the `@theme` pins (§4.2 items 2–3); never "fix" them to v4 defaults |
| 2 | Theme colors invisible (transparent) | Bare `H S% L%` triplet under `@theme inline` | Use full `hsl(...)` literals |
| 3 | Drawer opens on every add (reference doesn't) | `setCartOpen(true)` left in an add handler | Add → badge only; drawer opens via header button (E2E-pinned) |
| 4 | Header keeps "My account" after logout | StoreProvider state survives client nav inside the route group | Call `setUser(null)` in the logout handler |
| 5 | E2E can't find "Email" label / "New York" text | Footer carries colliding inputs/text | Scope selectors to `getByRole("main")` on chrome pages |
| 6 | `getByRole("alert")` resolves to 2 elements | Next route announcer also has role=alert | Auth errors target the BOX locator `div.mb-4.p-3.rounded-lg` (session-4; the `p[role=alert]` form is gone) |
| 7 | Header assertions fail while a dialog is open | Radix `aria-hidden`s the page chrome | Close the dialog before asserting on the header |
| 8 | E2E login fails mid-suite with 429 | Login action rate-limited (10/15min/IP+email) | ONE login in `auth.setup.ts` → storageState; never per-test logins |
| 9 | Cart counts drift between specs | Shared e2e SQLite file | `clearCartViaDrawer` in beforeEach; global reset in `global-setup.ts` |
| 10 | `db/custom.db` never appears at repo root; stale rows survive reseeds | Parent `.env` / shell env shadows the repo `.env` (Bun walks up; process env wins) | Converge all paths on the repo DB; diagnose with `bun -e "console.log(process.env.DATABASE_URL)"` |
| 11 | Escape "does nothing" in drawer tests | Escape fired before the async drawer mounted | `await dialog.waitFor({state:"visible"})` first |
| 12 | Unhydrated page / native form fallbacks on 127.0.0.1 | Next 16 dev-origin protection | `allowedDevOrigins` in next.config (already set) |
| 13 | Login page flashes logged-out header before redirect | — | Auth pages render chrome-less (ADR-008); nothing to flash |
| 14 | Register E2E fails on `getByLabel("Name")` | The reference register form has NO Name field (ADR-010) | Don't fill one — the action derives the name; use a fresh `e2e-<ts>@example.com` email (the reset only clears `e2e-*`/`logout-*`/`mismatch-*` users) |
| 15 | Live audit reads the wrong hero slide / hidden tab panel | Inactive slides stay in the DOM (`opacity-0`); Radix keeps all tab panels mounted | Filter by `checkVisibility()` / query the VISIBLE panel (`[data-state=active]`) |
| 16 | Guest cart empties / each add starts fresh | Cart mutation passed `undefined` as the guest token — every add minted a new cart | Mutations read `cookies().get(CART_COOKIE)` (ADR-011); `guest-cart.spec.ts` pins it |
| 17 | Rapid stepper clicks land as +1 instead of +2 | Stepper posted ABSOLUTE qty computed from stale render state (lost-update race) | Post deltas: `adjustQuantity(itemId, ±1)` → transactional `changeQuantityBy` |
| 18 | Toast assertions flake (position off by 1–2 px; toast gone at 3.1 s) | Enter spring still in flight; the poll ate the 3 s window | Wait ~450 ms for the spring, ±2 px tolerance; settle-then-measure for lifetime |
| 19 | Header badge keeps the old count after placing an order | `useState(initialCart)` never re-reads the fresh prop a `router.refresh()` delivers | Adjust-state-during-render re-sync in StoreProvider (ADR-012); checkout spec asserts exact-name "Cart" |
| 20 | Wishlist-heart spec fails with "element not found" right after a successful toggle | The aria-label flipped Add→Remove, orphaning a state-anchored locator | State-stable locators: `/«Product» (from|to) wishlist/` or `aria-pressed` |
| 21 | PDP spec hits the related-products heart/ATC instead of the buy panel's | Cards below the buy panel carry the same button roles | Scope to `main .flex.items-center.gap-4.mb-4` (the action row) |
| 22 | Form fills silently wiped on a client-island page (button never enables, action never fires) | Values typed before React hydration get reset when React adopts the server DOM | `page.waitForLoadState("networkidle")` after every full `goto` into a client island (checkout wizard, login form) |
| 23 | Checkout spec re-enters the wizard and clicks Continue immediately | The wizard REMOUNTS fresh on every navigation into `/checkout` — step 1, empty fields | Refill the shipping/payment form after re-entering checkout |
| 24 | Admin stock form Save appears to lose the write | The server action + `router.refresh()` land asynchronously; a racing reload reads stale truth | Wait ~800ms after Save, then reload + assert the input value |
| 25 | Orders keep succeeding against products the admin just zeroed | Nothing server-side validated stock (UI-only enforcement) | ADR-013: `clampToStock` on cart mutations + in-transaction rejection + atomic decrement at placement (`stock.spec.ts`) |
| 26 | Fresh `git clone` + `bun run build` exits 1 (`cp: cannot stat 'public'`) | `public/` existed only as an untracked local artifact — never committed | `mkdir -p public` in the build script + committed `public/.gitkeep` (session-7 BUILD-1) |
| 27 | Admin spec passes on run 1, fails on run 2 ("ORD-2026-001" missing from Recent Orders; duplicate timeline notes trip strict mode) | Spec-placed orders ACCUMULATE in the persisted `db/e2e.db`; new orders (placedAt=now) push demo fixtures (placedAt=Mar 2026) out of take:5 lists while status_changed events pile onto demo timelines | `e2e-reset.ts` deletes non-canonical orders + demo-order `status_changed` events every run (session-7); assert canonical fixtures only after a reset |
| 28 | `locator("main")` strict-mode violation on admin pages | Every admin page nested its own `<main>` inside the storefront layout's `<main>` (two landmarks — invalid HTML) | Admin pages wrap in `<div className="flex-1">`; ONE `<main>` per page, owned by the layout (session-7 MAIN-NEST-1) |
| 29 | Dev-mode live-verification login never navigates (no POST in dev.log) | Writing/editing scripts INSIDE the repo while `next dev` runs triggers Fast Refresh full reloads mid-fill — React's DOM adoption wipes the form values (and `networkidle` never fires under the HMR websocket) | Settle the server after repo-file edits; wait for the input + a beat, retry the submit once; drive Server-Action flows with Playwright (direct), not through the sandbox proxy |
| 30 | Auth/register cards render 8px SHORT per field (register card 490px vs the reference's 514px); account panel 32px below the tablist; PDP everything 8px low | Tailwind v4 trap 8: `space-y-*` emits `margin-block-end` on NON-LAST children — inert on inline `<label>` first children (v3 landed `margin-top` on following blocks); same engine stacks Tabs `space-y-6` + panel `mt-2`; breadcrumb `mb-6` ≠ `mb-8` | Give the block input wrapper `mt-2` (keep `space-y-2` on the wrapper — computed parity, DOM parity); Tabs roots carry NO `space-y-*` (base `mt-6` supplies 24px); measure label rects + computed margins on BOTH sites before "fixing" spacing (session-8, ADR-016) |
| 31 | Profile Save button passes the DESKTOP audit (127px, 16px below the fields) yet renders 308px full-width on iPhone 14 | Tailwind v4 trap 9 + a CSS universal: grid items STRETCH by default — `sm:col-span-2 sm:w-fit` only constrains width at ≥640px, and grid `gap-4` COINCIDES with the reference's flow spacing on desktop (session-8's fix masked the mobile break) | Reproduce the reference's actual anatomy — button OUTSIDE the grid as a flow child with `mt-4` (fit-content every viewport); audit mobile viewports SEPARATELY (desktop computed parity ≠ mobile parity) (session-9, ADR-017) |
| 32 | PDP `<head>` shows `twitter:card` (or a duplicate `mobile-web-app-capable`, or derived duplicate twitter tags) no matter how the Metadata object omits them | Next's metadata ENGINE fills gaps: the twitter resolver force-defaults `card` when the typed twitter field carries images; `openGraph` presence derives a twitter layer; `appleWebApp.capable` auto-emits `mobile-web-app-capable` | Use the typed twitter field for every route that WANTS the card (omit `card` deliberately); `twitter:url` rides in `other`; the card-less PDP shape is inexpressible via the Metadata API — render plain `<meta name="twitter:…">` in the page body (React 19 hoists them into `<head>`) (session-9, ADR-017) |

## 10. Debugging Guide

| Symptom | First move |
|---|---|
| Any route 500s | `tail -50 dev.log` (grep `⨯`); `/api/health` for DB sanity |
| DB "table does not exist" | Wrong file opened — check `DATABASE_URL` resolution (§2 shadowing); re-run `bun run db:setup` |
| Style drift | `tests/e2e/storefront-parity.spec.ts` — it prints expected vs received computed styles; re-measure the reference before changing any pin |
| E2E failure | `bunx playwright show-trace test-results/<failed>/trace.zip`; traces retained on failure |
| E2E webServer timeout | Run `bun run build` first (Playwright boots the standalone build) |
| Action returns `INTERNAL` | Server logged the real error with a `[tag]` — check terminal/dev.log |
| Hydration mismatch | Almost always a `useState(initialized-from-prop)` or time-dependent render — hydrate via effect or key the component |
| Prisma "already exists" on seed | Seed is idempotent upserts — this means a schema/unique-key drift; inspect `schema.prisma` vs the failing model |

## 11. Pre-Ship Checklist

```bash
bun run lint          # 0 errors, 0 warnings
bun run typecheck     # 0 errors
bun run test          # 66 unit tests pass
bun run build         # compiles; 21 routes
bun run test:e2e      # 107 tests pass (106 spec + the setup login; requires the build)
```

Then:
- [ ] No new `console.log` (`console.error("[tag]", e)` is the pattern)
- [ ] No secrets staged: `git status` + `.gitignore` covers `.env`, `db/*.db`, `dev.log`, `tests/e2e/.auth/`
- [ ] Parity surfaces untouched, OR re-measured against the live reference and the parity spec updated in the same commit
- [ ] New pages assigned to the correct route group (chrome vs chrome-less)
- [ ] Conventional Commit on `main` only; push via `docs/ssh_git_wrapper_v3.py` (see `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`)

## 12. Lessons Learnt & How to Avoid Them

1. **Measure, don't eyeball (L1).** Every "looks close" judgment during the
   build hid a measurable delta (radii +4px, shadow notch, 1-cent order
   total, star-row vs single-star). Computed styles + DOM are ground truth.
2. **The engine is part of the design system (L2).** Porting v3 classes onto
   v4 without pins produced silent drift on THREE axes (shadows, radii,
   gradients) plus a palette drift found later (slate). Assume engine
   migrations move every default.
3. **Vacuous tests lie (L3).** The logout E2E passed pre-refactor because the
   store was stale-logged-OUT (never re-hydrated), not because logout
   worked. A passing test proves its assertion, not the feature — assert
   the OBSERVABLE (the header link), not an intermediate.
4. **Route structure is a parity surface (L4).** The reference's auth screens
   and 404 live OUTSIDE its app shell; matching them required restructuring
   layouts (ADR-008), not restyling components.
5. **Environment beats configuration (L5).** A shell-injected `DATABASE_URL`
   shadowed every `.env` in the repo for a whole session. Diagnose env
   questions empirically (`bun -e ...`), never by reading config alone.
6. **Shared-state test suites need reset discipline (L6).** One SQLite e2e
   file + one worker + per-spec cart clears + a global reset = deterministic
   counts; any shortcut reintroduces order-dependence.
7. **Interaction parity is parity (L7).** "Superset" licenses ADDING
   capabilities, not changing resting behaviors — the auto-opening drawer
   was a superset feature that still had to go because the reference rests
   differently.
8. **Measure the VISIBLE state, not the DOM (L8).** The hero's inactive
   slides stay mounted (opacity-0) and Radix keeps all tab panels in the
   DOM — a naive `querySelector("h1")` reads slide 1 forever and
   "proves" a working carousel is broken. Filter by `checkVisibility()` /
   `[data-state=active]` before concluding anything about animated or
   tabbed surfaces.
9. **Security patterns can be parity requirements (L9).** The reference's
   forgot-password copy is deliberately neutral — replicating the SCREEN
   without the anti-enumeration/rate-limit behavior would be a visual clone
   with a security hole. When a reference surface encodes a security
   posture, port the posture, not just the pixels (ADR-010).
10. **Post deltas, not absolutes (L10).** A stepper that sends
    `currentQuantity + 1` from render state loses updates the moment two
    clicks land inside one re-render frame — the E2E suite passed for
    months because single-click flows never race. Server-authoritative
    increments (`±1` applied inside a transaction) are immune AND simpler
    than optimistic locking (ADR-011).
11. **Test the paths your tests don't run (L11).** Every cart/wishlist E2E
    ran authenticated, so the guest-token mutation path shipped broken
    (each guest add minted a new cart) across three remediation rounds.
    Coverage follows the flows you actually exercise — guest-cart.spec.ts
    (storageState opt-out) now pins the cookie path forever.
12. **useState props are initial values only (L12).** A `router.refresh()`
    re-renders the layout server-side and delivers fresh props — but
    `useState(initialCart)` never re-reads them, so every
    server-mutation-followed-by-refresh shows stale client state (the
    post-order cart badge). Re-sync in render with a state-based
    "last seen props" guard, NOT a ref (React Compiler `refs` rule) and
    NOT an effect (`set-state-in-effect` is an error) (ADR-012).
13. **Locator names that describe state will orphan you (L13).** A
    Playwright locator anchored to "Add … to wishlist" stops matching the
    instant the toggle succeeds (the label flips to "Remove …") — the
    failure reads "element not found" which looks like the bug, not the
    success. Match state-stable patterns (`/«Product» (from|to) wishlist/`)
    or assert on `aria-pressed` instead.

14. **Hydrate before you type (L14).** On a full page load of a
    client-island page, input values set before React hydrates are wiped
    when React adopts the server DOM — the spec then hangs on a forever-
    disabled Continue button. `waitForLoadState("networkidle")` after
    `goto` is the cheap vaccine; the checkout wizard additionally remounts
    fresh (step 1, empty fields) on every entry into `/checkout`.

15. **Enforce invariants at the deepest seam that can still affect the
    outcome (L15).** The stock contract is enforced three times — PDP UI
    (stepper cap), cart mutations (server clamp), placement (in-transaction
    rejection + atomic decrement) — because each layer catches what the
    ones above cannot (API callers, mid-session stock drops). The
    session-4 guest-cart bug hid for three rounds because only one seam
    had coverage; `stock.spec.ts` and `guest-checkout.spec.ts` exist so no
    seam is untested again.

16. **Font parity is FILE parity (L16).** next/font's repackaged woff2
    byte-compared IDENTICAL to the reference's Google-served file on every
    table that affects layout (hmtx advances, glyf outlines, GPOS kerning,
    gvar deltas) — yet rendered measurably different (canvas 1013 vs 1009;
    a VLM-visible "halo" on every glyph; 1–4.8% text-band pixel diffs)
    because the repackaging pipeline STRIPS the `prep` hinting table.
    When a reference serves a font file, self-host that exact file under
    the same declared family name; never trust a subsetting pipeline to
    preserve rasterization. And remember `-webkit-font-smoothing` is
    invisible to headless screenshots (no subpixel AA there) — assert the
    computed property instead.

17. **aria-hidden does not remove descendants from the tab order (L17).**
    The hero carousel's invisible slides were correctly `aria-hidden` and
    `opacity-0`, yet Tab from the active CTA landed on the invisible
    "Explore"/"Browse" anchors (a WCAG 2.4.3 defect the reference's
    DOM-swap structure cannot have). `inert` is the complete fix (tab
    order + a11y tree, whole subtree). Audit keyboard navigation with a
    real Tab-walk census — AT-facing properties do not govern focus.

18. **Run an automated axe differential — computed-style parity cannot
    see invalid ARIA or landmark structure (L18).** Eleven rounds of
    computed-style parity never noticed that four shopper pages rendered
    a NESTED `<main>` (Playwright `locator("main")` chains dedupe shared
    descendants, so every spec kept passing) or that `aria-label` sat on
    role-less divs (prohibited by ARIA 1.2+, axe `aria-prohibited-attr`).
    Inject the SAME axe-core version into both sites and diff the
    violation sets rule-by-rule. Guard the interpretation: the reference
    gates its product sections behind framer-motion `whileInView`
    wrappers (`opacity: 0` until scrolled) — axe SKIPS invisible text, so
    scroll the page incrementally before reading the scan (the ref's
    contrast count jumped 7 -> 28 after a full reveal, exactly matching
    the clone). A shared violation is PARITY (do not "fix" the reference's
    own contrast traits — that breaks visual parity); a clone-only
    violation is the finding.

19. **The raw `next build` is not the repo's build (L19).** Running
    `bunx next build` regenerates `.next/standalone` WITHOUT the
    `cp -r .next/static` + `cp -r public` steps the `bun run build` wrapper
    performs — every static chunk then serves the HTML 200 fallback,
    every page throws `Unexpected token '<'`, and hydration never lands
    (fills wiped, actions dead, E2E setup fails). It looks exactly like an
    app regression but is a build artifact. Always build through the
    wrapper; if the suite fails at login with empty inputs, check the
    chunk MIME types first.

20. **Non-retrying assertions race client-side navigations (L20).**
    `waitForURL` resolves the moment `router.push` paints the address
    bar — the RSC payload and the re-rendered DOM land AFTER it. An
    immediate `isVisible()` probe in a live-verification script then
    reads the PREVIOUS page state and reports a false failure (the
    session-13 verify script failed its empty-state checks exactly this
    way while the debug probe with a settle delay passed). Use retrying
    `expect(...).toBeVisible()` assertions in verify scripts (same as
    the specs). The same family bites paired pixel captures: a
    client-island route captured on a fixed 3s timer can land
    mid-hydration and diff 22% (the settled re-capture read the 0.34%
    baseline) — wait for networkidle plus a settle on island routes.

21. **Mirror the repo's own conventions when extending a superset
    surface (L21).** The admin orders filter bar (session-13) reuses the
    storefront's filter pattern (URL-deep-linkable params, merged
    `router.push` navigation, the adjust-during-render input sync, a
    count line, a guided empty state) instead of inventing a new one.
    When a feature gap appears on a superset surface, first ask "where
    has this repo already solved this?" — one mental model, one URL
    shape, and the new surface inherits every hard-won lesson the
    existing one carries (hydration races, deep-link semantics, the
    e2e-reset contract). Extract the parser as a pure lib seam for
    unit pinning where reference parity does NOT hold the code
    page-local (the shop's parser stayed page-local precisely because
    its shape is a measured reference contract).

22. **Cookie jars are per-host; a login on `localhost` does not carry to
    `127.0.0.1` (L22, corrects the round-13 account-artifact diagnosis).**
    A paired A/B sweep that logs in on one host and captures on the
    other silently renders every authed surface as its GUEST state
    (/account guest-gates to /login) — producing the byte-stable 22.08%
    account pixel-diff that round-13 misattributed to a "mid-hydration
    frame" (the giveaway: a hydration race produces frame variance; a
    guest redirect is deterministic — the same 173,614 differing pixels
    every run). The fix discipline: pick ONE host for the whole audit
    lifecycle; verify `location.pathname` (JSON-quoted in agent-browser
    eval output — compare against the quoted form) immediately before
    authed captures; and when a suspiciously large diff appears on an
    auth-gated route, check WHERE the page actually is before
    re-capturing. The session-14 CSP round hit it three times before the
    pattern surfaced (the sweep script's auth guard silently passed on a
    quote mismatch). Related family: `agent-browser set device` can
    reset the browser context — after any device/viewport change,
    re-verify auth before trusting authed measurements.

23. **Next 16 deprecated `middleware.ts` for `proxy.ts` (L23, session-14
    CSP round).** The middleware file convention emits a build warning
    ("The middleware file convention is deprecated. Please use proxy
    instead") — same NextRequest/NextResponse/matcher API, but the file
    is `src/proxy.ts` and the exported function is named `proxy` (or a
    default export). The CSP nonce pipeline ships on the current
    convention. The nonce mechanism itself: the proxy sets the CSP on
    the REQUEST headers (Next parses it via
    `getScriptNonceFromHeader` and nonces every bootstrap/flight
    script) AND on the response (browser enforcement). Per-request
    nonces require per-request rendering — any statically-prerendered
    page needs `export const dynamic = "force-dynamic"` or its scripts
    ship un-nonced and CSP blocks them (the reason the two static auth
    screens opted out). The brick risk everyone fears is real but
    testable: the full E2E suite is the hydration regression net — the
    register/login form-fill specs fail loudly on the first un-nonced
    script.

24. **A standing gate is only proven once it has failed — mutation-check
    new gates (L24, session-15 a11y round).** Converting a manual audit
    into an automated gate (the session-12 axe differential →
    `tests/e2e/accessibility.spec.ts`) has a silent-failure risk: a gate
    that asserts the wrong thing passes forever while protecting nothing.
    The discipline: (1) run the zero-violation form of the assertion
    first (RED) so the baseline profile is a DELIBERATE contract — the
    shared color-contrast parity trait failing the zero-violation form
    documents that the pin is a parity decision, not an oversight; (2)
    MUTATION-CHECK the gate: temporarily re-introduce a real past defect
    (the session-12 `aria-label`-on-role-less-div class) and watch the
    gate FAIL (aria-prohibited-attr in the census) before trusting it;
    (3) calibrate pinned counts under the gate's OWN runtime conditions
    (the E2E server, viewport, and DB — 28/23/14/8/8/3 held, but only
    after an explicit calibration run proved it).

25. **A standalone server outlives its build directory; sandbox servers
    hide from lsof/ps (L25, session-15).** After `bun run build` replaces
    `.next/standalone`, a still-running server keeps serving SSR from its
    cached manifest but every `/_next/static/chunks/*.js` request 500s
    (the hashed filenames changed on disk) — the browser refuses the
    500-body "scripts" (CSP MIME check), hydration dies, and `getByLabel`
    times out on forms whose labels exist in the curl HTML. Worse, in the
    managed sandbox the server process is INVISIBLE to `lsof`/`fuser`/
    `ps` (no owning PID). The recovery: walk `/proc/net/tcp` for the
    port's hex → LISTEN socket inode → scan `/proc/*/fd` for
    `socket:[inode]` → `kill` that PID → reboot the server on the current
    build. When the PID can't be found, run on a FRESH port instead —
    the E2E suite parameterizes via `E2E_PORT`. Rule: after ANY rebuild,
    restart the audit server before trusting live probes.

26. **Desktop-only a11y gates are structurally blind to mobile-only
    defects; a plain-div aria-label is not the prohibited-attr mutation
    you think it is (L26, session-16 a11y round).** Extending the axe
    gate to `devices["iPhone 14"]` surfaced two methodological facts.
    (1) An element hidden at desktop (`lg:hidden`) is `display:none` at
    1280×720 → axe SKIPS it → a defect that only renders at 390px passes
    a desktop-only gate forever — the mutation that proves this (drop
    the mobile menu button's aria-label) fails ONLY the mobile tests
    while the desktop gate stays green; engineer viewport-specific
    mutations when you add viewport-specific gates, or you have proven
    nothing about the extension. Playwright mechanics:
    `test.use({ ...devices["iPhone 14"] })` inside a describe REJECTS the
    descriptor's `defaultBrowserType` (it forces a new worker) — strip
    it; the project's storageState still applies at 390px. (2) The
    session-12 prohibited-attr defect fired because the toast viewport
    carries `aria-live="polite"` (aria-label on a LIVE REGION is
    prohibited ARIA); the same label on a plain role-less div with no
    aria-live does NOT trip axe 4.14 under the wcag2x tag set — for
    mutation checks, target a live region or an icon-only button
    (button-name) instead.
27. **CWV gates need pre-paint observers, entry-time element geometry,
    and mutations that match the defect class — and the reference
    auth-gates everything (L27, session-17 performance round).** Three
    facts from building PERF-GATE-1. (1) PerformanceObservers must be
    registered via `page.addInitScript` (pre-paint) — post-load
    registration misses buffered LCP entries; and the element tag +
    geometry must be captured INSIDE the observer callback, because a
    DOM-swap carousel replaces the elements your query would re-find.
    (2) A CLS mutation must GUARANTEE a post-FCP shift: an unsized image
    container in a 2-column grid where the sibling column is taller
    produces ZERO movement at desktop (the growth is absorbed) — the
    late-injected banner (setTimeout post-hydration, unreserved, in the
    flow) is the deterministic mutation; the unsized-image class needs
    the MOBILE stacked layout to bite (the L26 blindness story, now for
    CLS). (3) The reference renders the LOGIN screen client-side ON any
    requested URL for anonymous contexts — CWV/pixel differentials
    against it must measure AUTHENTICATED state, or you are benchmarking
    the login form (the H1 "Welcome back" will appear as the LCP element
    on every route).

## 13. Pitfalls to Avoid

- **Don't** rewrite class strings to v4 equivalents "for cleanliness" — the
  DOM class parity with the reference is deliberate; pin tokens instead.
- **Don't** put DB imports or server actions outside the `lib` layers; a
  client component must never import `@/lib/db`.
- **Don't** mint cart/wishlist rows in Server Component reads (renders cannot
  set cookies); creation happens only in mutation contexts.
- **Don't** trust client-sent prices/quantities at the action boundary —
  re-derive totals from the DB cart (ADR-007).
- **Don't** add per-test logins (rate limiter) or parallel E2E workers
  (single SQLite file).
- **Don't** use `space-y-*` + `mt-*` together in the mobile nav (trap 5).
- **Don't** scope selectors to `main` on auth screens or the 404 — there is
  no `main` there.
- **Don't** "reset" the DB by deleting one path when multiple paths point at
  the same logical DB (hard links/injected envs) — reseed instead.
- **Don't** use `text-amber-400` star rows or 5-star displays — the reference
  renders one star + numeric rating.
- **Don't** create REST mutation routes; server actions are the only seam
  (3-endpoint route whitelist).
- **Don't** re-add the `@media (hover: hover)` gate on hover variants or
  remove `@custom-variant hover (&:hover);` from `globals.css` (trap 11) —
  the reference is a v3 app; hover effects must render in touch/hybrid
  contexts, and parity assertions read `getComputedStyle(img).scale` (v4's
  `scale-*` sets the `scale` property, not `transform`).
- **Don't** pair a base `leading-*` with responsive `text-*` sizes without
  pinning the responsive line-heights (trap 10) — v4's sort order lets the
  base leading win at every width; v3's media layers re-override it. The
  hero h1 carries `sm:leading-[2.5rem] lg:leading-none`.
- **Don't** add `antialiased` (or any `-webkit-font-smoothing` override) to
  the body (trap 12) — the reference computes `auto` (subpixel LCD AA);
  headless screenshots cannot catch this divergence, so it is pinned as a
  computed-style assertion.
- **Don't** re-introduce `next/font` for the site font (trap 13) — its
  repackaged woff2 strips the `prep` hinting table and rasterizes away
  from the reference's file. The font is `public/fonts/plus-jakarta-sans.
  woff2` + a plain `@font-face` in globals.css; `--font-sans` is the
  reference's exact two-entry stack.
- **Don't** rely on `aria-hidden` alone for hidden-but-in-DOM interactive
  content (A11Y-FOCUS-1) — pair it with `inert` so focus order matches the
  reference's DOM-swap behavior (hero inactive slides are the pinned
  example).

## 14. Best Practices

- One vertical slice per change: failing test → implementation → gate.
- Actions: Zod-parse first, `ActionResult<T>` out, `console.error("[tag]")`
  for caught failures, customer-safe `INTERNAL` messages.
- Money: integer cents to the display boundary; format ONLY via
  `formatCents` (`src/lib/money.ts`).
- Identity: cookie token → merge at login; `getCart/getWishlist` read-only.
- Styling: extend `@theme`, never arbitrary one-off values (the 404's slate
  block is a pinned exception, documented).
- Tests: unit for pure seams (money/password/validation/rate-limit/db-path),
  E2E for flows; spec names describe user-visible behavior.
- Docs: update AGENTS.md/CLAUDE.md/PAD in the same commit as the
  architectural change; grow the trap log, never work around it.

## 15. Coding Patterns

### 15.1 The ActionResult envelope (`src/lib/actions/auth.ts`)

```ts
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; fieldErrors?: Record<string, string> } };
```

### 15.2 Server action shape (every mutation in `src/lib/actions/*.ts`)

```ts
export async function someAction(input: unknown): Promise<ActionResult<Thing>> {
  const parsed = schema.safeParse(input);          // 1. Zod at the boundary
  if (!parsed.success) {
    return { ok: false, error: { message: "...", fieldErrors: zFieldErrors(parsed.error) } };
  }
  try {
    const data = await domainOperation(parsed.data); // 2. domain layer
    revalidatePath("/wherever");                     // 3. targeted revalidation
    return { ok: true, data };
  } catch (e) {
    console.error("[someAction]", e);                // 4. tag + never throw
    return { ok: false, error: { message: "Something went wrong. Please try again." } };
  }
}
```

### 15.3 Money (`src/lib/money.ts`)

```ts
formatCents(29999)          // "$299.99"
discountPercent(29999, 39999) // 25  (for -25% badges)
```

### 15.4 DB URL resolution contract (`src/lib/db-path.ts`, test-pinned)

`DATABASE_URL="file:../db/custom.db"` resolves against the directory owning
`prisma/schema.prisma` (walk up from CWD), so CLI/build/runtime all open
`<repo>/db/custom.db`. Absolute `file:` and non-SQLite URLs pass through.

### 15.5 The drawer interaction & anatomy (reference-parity)

```ts
// add: badge only
await addToCart(productId, quantity);
// inspect drawer: open it the way a reference user does
await openCartDrawer(page); // tests/e2e/helpers.ts — header cart button
```

Item-row anatomy (captured live, E2E-pinned): border-separated rows
(`flex gap-3 py-4 border-b border-border/50`), plain truncated `h4` name
(not a link), bold unit price (`text-sm font-bold mt-1`), `gap-2`
stepper+trash row, right-side line total (`text-sm font-bold shrink-0`),
summary `pt-4 space-y-3` with Separators, `text-primary` "Free",
`font-bold text-lg` total. Production extras kept over the reference:
aria-labels, disabled minus at qty 1.

### 15.6 Logout (state-survival-aware)

```ts
await logoutAction();
setUser(null);        // the provider outlives client-side navigation
router.refresh();
router.push("/");
```

### 15.7 Auth forms (reference contract, ADR-010/011)

```ts
// Register: 3 fields only — no Name (the reference collects none)
const parsed = registerSchema.safeParse({
  name: formData.get("name") || undefined,   // optional
  email: formData.get("email"),
  password: formData.get("password"),
  confirmPassword: formData.get("confirmPassword"),
});
const name = parsed.data.name ?? deriveDisplayName(email);
// "john.doe@x.com" → "John Doe"; "e2e-42@x.com" → "E2e 42"

// Password reset: anti-enumeration — NEVER reveal account existence
const rl = rateLimit(`pwreset:${ip}:${email}`, 5, 15 * 60 * 1000);
if (!rl.ok) return { ok: false, error: { message: "Too many reset requests…" } };
const user = await db.user.findUnique({ where: { email }, select: { id: true } });
console.info(`[password-reset] requested for ${user ? "known" : "unknown"} account ${email}`);
return { ok: true, data: null };   // same neutral copy for every email
```

Error presentation: the shared BOX (`src/app/(auth)/auth-error.tsx`) renders
`div.mb-4.p-3.rounded-lg.bg-destructive/10.text-destructive.text-sm` as the
card's first child — plain red text is a parity break. Forms carry NO
`noValidate`; native `type=email` validation is the reference contract.

### 15.8 Toasts + delta steppers (ADR-011)

```ts
// Toast: fire from the mutation call site, not the server
await addToCart(product.id);
notify(`${product.name} added to cart!`);   // StoreProvider queues it
// ToastViewport renders the stack: dark box, CircleCheckBig accent,
// 3000 ms lifetime, pointer-events-none + aria-live region.

// Stepper: post the DELTA, let the server apply it transactionally
// ❌ updateQuantity(item.id, item.quantity + 1)   // stale-render race
await adjustQuantity(item.id, +1);               // → changeQuantityBy
```

## 16. Coding Anti-Patterns

```tsx
// ❌ client-trusted totals        ✅ server re-derivation
const total = items.reduce(...)   const res = await placeOrderAction(payload);

// ❌ optimistic cart math         ✅ server response is the new state
setCart(prev => ...)              setCart(res.data)

// ❌ throw across the seam        ✅ ActionResult
throw new Error("oops")           return { ok: false, error: { message } }

// ❌ space-y + mt in mobile nav  ✅ flex gap-4 stack

// ❌ bare role=alert query        ✅ the auth error BOX
getByRole("alert")                page.locator("div.mb-4.p-3.rounded-lg")

// ❌ absolute stepper qty          ✅ post the delta
updateQuantity(id, qty + 1)       adjustQuantity(id, +1) // transactional

// ❌ per-test logins              ✅ one setup login + storageState
```

## 17. Responsive Breakpoint Reference

Tailwind defaults (identical v3/v4): `sm` 640 · `md` 768 · `lg` 1024 ·
`xl` 1280. Behavioral switch points:

| Breakpoint | Header | Nav | Grids |
|---|---|---|---|
| < 768 (`base`) | hamburger + search + wishlist + cart + account icons; mobile nav = LEFT Sheet w-72 | hidden | cards 2-col (home/shop), PDP stacks |
| ≥ 768 (`md`) | full logo + nav links + icons | Home Shop Electronics Clothing Accessories | — |
| ≥ 1024 (`lg`) | — | — | PDP 2-col (gallery/buy box), cart 2-col (rows/summary), checkout wizard + sticky summary |

## 18. Z-Index Layer Map

| Layer | z | Owner |
|---|---|---|
| Content | auto | pages |
| Sticky header | `z-50` | `(storefront)/layout.tsx` header |
| Overlays (Sheet backdrop+panel) | Radix portal, effectively above header | mobile-nav (left), cart-drawer (right) |
| Search dropdown | portal above header | search-bar |
| Route announcer | Next-managed | platform |

Rules: only the header uses an explicit `z-50`; overlays ride Radix portals
(no hand-rolled z wars); never raise content above a portal.

## 19. Color Reference (Complete)

| Token / class | Value | Renders | Usage |
|---|---|---|---|
| `background` | `hsl(30 25% 98%)` | #FBFAF9 | page bg |
| `foreground` | `hsl(240 10% 10%)` | #17171C | text + footer bg |
| `primary` | `hsl(24 80% 50%)` | #E66B1A | announcement, CTAs, badges, active hearts |
| `secondary` | `hsl(30 15% 94%)` | #F0EDE8 | chips, image placeholders |
| `muted-foreground` | `hsl(240 5% 46%)` | #6F6F7B | secondary text |
| `destructive` | `hsl(0 84% 60%)` | #EF4444 | discount badges, errors |
| `border` | `hsl(30 15% 90%)` | #E5E0DA | hairlines |
| `amber-400` | default | #FBBF24 | the rating star |
| `slate-50/200/300/500/600/700/800` | pinned v3 hexes | #F8FAFC / #E2E8F0 / #CBD5E1 / #64748B / #475569 / #334155 / #1E293B | platform 404 ONLY |
| `bg-white` | default | #FFFFFF | cards, auth card, 404 button |

## 20. TypeScript Interface Reference

Key public types (all in `src/lib/*`, imported by components as DTOs):

```ts
// src/lib/auth.ts
type SessionUser = { id: string; email: string; name: string | null;
  firstName: string | null; lastName: string | null; role: string };

// src/lib/cart.ts
type CartDto = { items: CartItemDto[]; itemCount: number;
  subtotal: number; shipping: number; total: number };   // integer cents
type CartItemDto = { id: string; productId: string; slug: string; name: string;
  image: string; price: number; quantity: number; lineTotal: number };

// src/lib/actions/auth.ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; fieldErrors?: Record<string, string> } };

// src/components/store/product-card.tsx
type ProductCardData = { id: string; slug: string; name: string;
  categoryName: string; price: number; compareAtPrice: number | null;
  rating: number; reviewCount: number; badge: string | null; image: string;
  isOnSale?: boolean };

// src/components/account/account-tabs.tsx
type OrderRow = { id: string; number: string; placedAt: string;
  itemCount: number; status: string; total: number };
type AddressRow = { id: string; label: string; /* … */ };
```

Prisma model surface (13): User · Session · Category · Product · Cart ·
CartItem · Wishlist · WishlistItem · Address · Order · OrderItem · OrderEvent
· NewsletterSubscriber — see `prisma/schema.prisma`.

---

## Appendix A: ADR Index

Full records with context/rationale/consequences in
`Project_Architecture_Document.md` §1.3:

| ADR | Decision |
|---|---|
| 001 | Single Next.js app (no monorepo, no separate admin app) |
| 002 | SQLite via Prisma, schema-relative `file:` URL |
| 003 | Cookie-token guest identity merging into user rows |
| 004 | Server actions as the only mutation seam; 3-endpoint route whitelist |
| 005 | Tailwind v4 with pinned v3 token geometry (the trap-log system) |
| 006 | scrypt + DB-backed sessions over JWT |
| 007 | Checkout = client wizard over one transactional server action |
| 008 | Route-group chrome split (minimal root layout, standalone auth/404) |
| 009 | Catalog order as a parity contract (sortOrder = reference array position, staggered createdAt, rating tie-break) |
| 010 | Auth parity contract (nameless registration + derived display name, anti-enumeration password reset) |
| 011 | Money & interaction parity round ($9.99 flat shipping, toast subsystem, transactional delta steppers, cookie-token cart mutations, env-gated email verification) |
| 012 | Client store re-syncs from server truth on refresh (adjust-state-during-render) |
| 013 | Server-side stock enforcement (clamp in cart, reject + decrement at placement) |
| 014 | Redirect-after-login with validated same-origin targets (per-page paths on admin sub-pages) |
| 015 | Admin order-detail view rendering the OrderEvent timeline + fresh-clone build reproducibility + admin E2E expansion (session-7 operational set) |
| 016 | Computed-geometry parity round — v4 `space-y` inline-margin trap (auth field spacing, account tab/label/button geometry), flat floor() PDP stars, gap-2/mb-8 breadcrumb, reference feature glyphs, humanized-path unknown-route titles |
| 017 | Mobile-geometry + social-metadata parity round (out-of-grid fit-content Save button, order-row anatomy, pageMetadata OG/Twitter/PWA layer, sort trigger width) |
| 018 | Interaction-engine parity round — v4.3 hover-variant `@media (hover: hover)` gate un-gated via `@custom-variant`, hero h1 line-height v3 cascade pins |
| 019 | Typography + keyboard-a11y parity round — self-hosted exact-reference woff2 (FILE parity), subpixel smoothing, inert hero slides |
| 020 | axe-core differential a11y round — single `<main>` landmarks, valid ARIA labels (nameless live region, role=img rating row), security headers |
| 021 | URL-deep-linkable admin order filters — status + number/email search, count line, guided empty state (the ShopFilters pattern applied to the console) |
| 022 | Nonce-based Content-Security-Policy via `src/proxy.ts` (the Next 16 proxy convention) — per-request nonces, `strict-dynamic` scripts, directive set pinned to the measured footprint, static auth screens force-dynamic'd |
| 023 | The self-hosted axe-core standing E2E gate — the manual a11y differential converted to a permanent regression pin (census exactly {color-contrast} + reference-identical counts, mutation-proven) |
| 024 | The a11y gate extended to both viewports + the admin console — the SAME pins re-asserted at iPhone 14 (mobile census byte-identical to the desktop's) + the admin QUALITY census 8/7/7/7; dual-mutation-proven |
| 025 | The standing Core Web Vitals budget gate (PERF-GATE-1) — LCP ≤ 2500ms + CLS ≤ 0.03 + LCP-element identity floors on home/shop/PDP; pre-paint PerformanceObservers; E2E-condition-calibrated; dual-mutation-proven (a hidden hero img fails only the identity pin, a late-injected banner fails only the CLS pin) |

## Appendix B: The Meticulous Workflow

1. **ANALYZE** — read the affected files completely; reproduce the failure;
   re-measure the reference when parity is in question.
2. **PLAN** — vertical slices (one seam, one test, one implementation).
3. **VALIDATE** — confirm the plan against acceptance criteria + constraints.
4. **IMPLEMENT** — modular, typed, Zod-validated mutations; server-derived money.
5. **VERIFY** — the full gate (§11), all green or explicitly reported.
6. **DELIVER** — Conventional Commits on `main`; update AGENTS/CLAUDE/PAD
   in the same change; grow the trap log.

## Appendix C: Quick Reference Card

```bash
bun run dev                  # :3000, logs → dev.log
bun run db:setup             # push + idempotent seed
bun run lint && bun run typecheck && bun run test && bun run build && bun run test:e2e
bunx playwright test tests/e2e/cart.spec.ts          # one spec
bunx vitest run src/lib/money.test.ts                # one unit file
bun -e "console.log(process.env.DATABASE_URL)"       # env-shadowing probe
curl localhost:3000/api/health                        # {"ok":true,"db":true}
```

| Path | What |
|---|---|
| `src/app/globals.css` | ALL design tokens + the 8 trap-log pins |
| `src/app/(storefront)/layout.tsx` | chrome + StoreProvider hydration |
| `src/app/not-found.tsx` + `src/app/[...notFound]/page.tsx` | chrome-less platform 404 (slate, quoted path) + the catch-all that titles unknown routes from the humanized path |
| `src/components/store/store-provider.tsx` | the client state seam |
| `src/lib/db-path.ts` | schema-relative SQLite URL contract (test-pinned) |
| `src/lib/actions/*.ts` | every mutation (ActionResult + Zod) |
| `src/lib/money.ts` | integer-cents helpers |
| `prisma/seed.ts` | the reference catalog + demo fixtures |
| `tests/e2e/storefront-parity.spec.ts` | the computed-style parity gate |
| `tests/e2e/helpers.ts` | openCartDrawer / clearCartViaDrawer |
| `docs/remediation-plan-session1.md` … `session10.md` | the post-push audits this skill distills (latest: session-10) |
