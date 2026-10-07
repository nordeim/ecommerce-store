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
| `bun run test` | Vitest unit suite (45 tests) |
| `bun run test:e2e` | Playwright E2E (58 tests; requires `bun run build` first) |
| `bun run db:setup` | `db push` + seed |
| `bun run db:reset` | `prisma migrate reset` |

## 5. Testing Strategy

**Pyramid:** Vitest unit (pure domain seams, co-located `*.test.ts`) → Playwright E2E (production standalone server on :3100, isolated `db/e2e.db`, real UI flows).

- Unit layer: `src/lib/*.test.ts` + `tests/db-path.test.ts` — money math, password hashing, Zod schemas, rate limiter, DB-path resolution. TDD red→green→refactor; bug fixes get a failing regression test first.
- E2E layer: `tests/e2e/*.spec.ts` — smoke, storefront-parity (computed-style gate), cart, checkout, account, auth, wishlist, search, mobile-navigation. `auth.setup.ts` signs in once (rate limiter) and shares storageState; `auth.spec.ts` opts out for logged-out flows. `global-setup.ts` pushes/seeds/resets the e2e DB every run.
- Assert behavior through the UI/API, never internals; scope selectors to `main` (footer text collisions); close dialogs before asserting on header chrome (Radix `aria-hidden`).

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
Single Next.js app. `src/app` (RSC pages + 3 route handlers) · `src/components/{ui,store,account,checkout}` · `src/lib` (domains + actions) · `prisma` (schema + seeds) · `tests` (vitest + playwright). Import direction: app → components → lib → db. `src/lib/db.ts` is server-only — never import it from a `"use client"` file.

### API / Action Design
Mutations: server actions with Zod + `ActionResult<T>`. Reads: RSC direct Prisma queries. Route handlers: GET `/api/search?q&limit` (429-limited), POST `/api/newsletter` (idempotent upsert), GET `/api/health`.

### Database / Data Layer
13 models (User/Session/Category/Product/Cart/CartItem/Wishlist/WishlistItem/Address/Order/OrderItem/OrderEvent/NewsletterSubscriber). Guest identity = signed-cookie tokens merged into user rows on login. Order numbers `ORD-YYYY-NNN` (count-based, single-writer SQLite).

### Environment Variables

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | SQLite location, schema-relative `file:` URL | `file:../db/custom.db` |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata/sitemap/robots | `http://localhost:3000` |
| `AUTH_SECRET` | HMAC secret for session cookie integrity (required in prod) | `openssl rand -hex 32` |

## Success Metrics

You are successful when: the gate is green end-to-end; E2E parity specs still pin the reference's computed styles; new features ship with tests at the same seam; and the trap log grows (documented) instead of being worked around.
