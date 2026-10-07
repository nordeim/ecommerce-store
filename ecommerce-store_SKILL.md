---
name: ecommerce-store
description: >
  Comprehensive engineering skill for the LUXE Store codebase — a
  production-grade Next.js 16 e-commerce clone of a Tailwind v3 reference
  app, delivered on Tailwind v4 via a pinned token system with Prisma/SQLite
  persistence. Use when extending, debugging, testing, onboarding onto, or
  replicating this architecture.
version: 1.0.0
last_updated: "2026-10-07"
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
> `docs/remediation-plan-session1.md` (post-push audit).

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
| `(storefront)` | chrome + StoreProvider hydration | home, `shop/`, `product/[slug]/`, `cart/`, `checkout/` (+success), `wishlist/`, `account/`, `admin/` |
| `(auth)` | `min-h-screen flex items-center justify-center bg-background px-4` | `login/`, `register/` — standalone cards, no chrome |

Consequences: login/register are statically prerendered; unknown PRODUCT
slugs render an in-chrome "Product not found" block (`product/[slug]/page.tsx`)
while unknown ROUTES hit the chrome-less 404; the StoreProvider instance
survives client navigation inside `(storefront)` — logout MUST call
`setUser(null)` (§6).

### 5.3 Component inventory (46 tsx in src; 23 `"use client"`)

| Directory | Contents |
|---|---|
| `src/components/ui/` | shadcn-style primitives with the reference's exact class strings: button, badge, input, label, separator, select, sheet, tabs, radio-group, toast |
| `src/components/store/` | announcement-bar, header (nav + cart badge + account icon), search-bar (typeahead combobox), mobile-nav (left Sheet w-72), cart-drawer (right Sheet), product-card, hero-carousel, category-showcase, footer, star-rating, store-provider |
| `src/components/account/` | account-tabs (4 tabs, useActionState forms), admin rows |
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
- **Seed** (`prisma/seed.ts`, 424 lines): idempotent natural-key upserts —
  6 categories, 12 products (the reference catalog: names, prices, ratings,
  badges, sort), 3 demo orders pinned to the reference account page
  (ORD-2026-001 $349.98 delivered · 002 $189.00 in transit · 003 $524.97
  delivered — 003's total is pinned; line items sum to 524.98), demo user +
  admin user, 3 hero slides, demo address.
- **Product imagery** loads from the reference's public CDN
  (`media.base44.com`, `images.unoptimized: true`, plain `<img>` for
  byte-parity). Swap to owned assets in the seed before rebranding.
- **Adding a product** = 3 steps: 1) append to `PRODUCTS` in `prisma/seed.ts`
  (slug, name, cents, image URL, flags); 2) `bun run db:setup`; 3) no code
  changes — PLP/PDP/home sections are all query-driven.
- **Guest identity:** carts/wishlists key on signed 192-bit cookie tokens
  (`luxe_cart`, `luxe_wishlist`); login MERGES the guest row into the user
  row (quantity-max union) inside the login action; reads never mint rows.

## 8. Accessibility Implementation

- Radix primitives carry the ARIA weight (Dialog/Sheet, Select, Tabs,
  RadioGroup) — do not hand-roll equivalents.
- Every icon-only button has an `aria-label` (cart button: `Cart, N items`;
  hamburger: `Open navigation menu`; hearts: `Add/Remove X to/from wishlist`;
  steppers: `Increase/Decrease quantity`).
- The mobile nav Sheet traps focus; Escape and backdrop dismiss; nav links
  auto-close on navigation (E2E-pinned).
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
| 6 | `getByRole("alert")` resolves to 2 elements | Next route announcer also has role=alert | Target `p[role=alert]` |
| 7 | Header assertions fail while a dialog is open | Radix `aria-hidden`s the page chrome | Close the dialog before asserting on the header |
| 8 | E2E login fails mid-suite with 429 | Login action rate-limited (10/15min/IP+email) | ONE login in `auth.setup.ts` → storageState; never per-test logins |
| 9 | Cart counts drift between specs | Shared e2e SQLite file | `clearCartViaDrawer` in beforeEach; global reset in `global-setup.ts` |
| 10 | `db/custom.db` never appears at repo root; stale rows survive reseeds | Parent `.env` / shell env shadows the repo `.env` (Bun walks up; process env wins) | Converge all paths on the repo DB; diagnose with `bun -e "console.log(process.env.DATABASE_URL)"` |
| 11 | Escape "does nothing" in drawer tests | Escape fired before the async drawer mounted | `await dialog.waitFor({state:"visible"})` first |
| 12 | Unhydrated page / native form fallbacks on 127.0.0.1 | Next 16 dev-origin protection | `allowedDevOrigins` in next.config (already set) |
| 13 | Login page flashes logged-out header before redirect | — | Auth pages render chrome-less (ADR-008); nothing to flash |

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
bun run test          # 45 unit tests pass
bun run build         # compiles; 19 routes
bun run test:e2e      # 62 tests pass (requires the build)
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

### 15.5 The drawer interaction (reference-parity)

```ts
// add: badge only
await addToCart(productId, quantity);
// inspect drawer: open it the way a reference user does
await openCartDrawer(page); // tests/e2e/helpers.ts — header cart button
```

### 15.6 Logout (state-survival-aware)

```ts
await logoutAction();
setUser(null);        // the provider outlives client-side navigation
router.refresh();
router.push("/");
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

// ❌ bare role=alert query        ✅ p[role=alert]
getByRole("alert")                page.locator("p[role=alert]")

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
| `src/app/globals.css` | ALL design tokens + the 7 trap-log pins |
| `src/app/(storefront)/layout.tsx` | chrome + StoreProvider hydration |
| `src/app/not-found.tsx` | chrome-less platform 404 (slate, quoted path) |
| `src/components/store/store-provider.tsx` | the client state seam |
| `src/lib/db-path.ts` | schema-relative SQLite URL contract (test-pinned) |
| `src/lib/actions/*.ts` | every mutation (ActionResult + Zod) |
| `src/lib/money.ts` | integer-cents helpers |
| `prisma/seed.ts` | the reference catalog + demo fixtures |
| `tests/e2e/storefront-parity.spec.ts` | the computed-style parity gate |
| `tests/e2e/helpers.ts` | openCartDrawer / clearCartViaDrawer |
| `docs/remediation-plan-session1.md` | the post-push audit this skill distills |
