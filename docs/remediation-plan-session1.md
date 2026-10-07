# Remediation Plan — Session 1 Review (Post-Push Audit)

**Date:** 2026-10-07
**Repo:** `nordeim/ecommerce-store` (branch `main`, baseline `289df91`)
**Author:** Review/build agent (Super Z)
**Scope:** Post-push audit of the LUXE Store clone against the live reference
(`fuzzy-lumina-style-hub.base44.app`), plus repo hygiene. The `skills/` folder
is excluded from code checking, testing and compilation per the operating
contract.

**Method:** Live differential testing — both sites driven side-by-side with
agent-browser (two sessions: `ref` = production reference, `clone` = local dev
server), computed styles + DOM as ground truth (clone-app-pat-pro
methodology), VLM cross-checks for pixel-level diffs, full verification gate
re-run (lint / typecheck / 45 unit / build / 58 E2E — all green at audit
start).

---

## 1. Baseline verification (state at audit start)

| Gate | Result |
|---|---|
| `bun run lint` | 0 errors, 0 warnings |
| `bun run typecheck` | clean |
| `bun run test` (Vitest) | 45/45 passed |
| `bun run build` | compiles, 19 routes |
| `bun run test:e2e` (Playwright) | 58/58 passed |
| Mobile navigation menu | Parity verified live: left Sheet, w-72 (288 px), same five links, navigate-and-close, Escape dismissal — matches reference exactly |
| Tailwind v4 trap log | All six pins intact in `src/app/globals.css`; parity spec green |

Confirmed parity surfaces (live A/B): home sections & footer, shop grid
(12 products, same filters), PDP (tabs, related, price), account dashboard
(4 tabs, 3 seeded orders with matching dates/statuses/totals), hero slide 1
image URL, body background `rgb(251, 250, 249)`.

## 2. Issue inventory

### PARITY-1 — Cart drawer auto-opens on add-to-cart (reference does not)
- **Severity:** Medium (interaction parity)
- **Evidence:** Reference PDP + card add → header badge bump only, no dialog
  (verified twice, 2026-10-07). Clone: `src/components/store/buy-panel.tsx:49`
  and `src/components/store/product-card.tsx:81` both call
  `setCartOpen(true)` on success → drawer opens.
- **Reference behavior to match:** add updates the badge; the drawer opens
  ONLY via the header cart icon (which the reference does open — verified).

### PARITY-2 — Checkout empty state has wrong copy and extra ornamentation
- **Severity:** Low-Medium (visual parity)
- **Evidence:** Reference `/checkout` with empty cart renders exactly:
  `<div class="max-w-7xl mx-auto px-4 py-20 text-center"><h1 class="text-2xl font-bold mb-4">No items in cart</h1><a class="…default h-9 px-4 button…" href="/shop">Continue Shopping</a></div>`
  — no icon circle, no paragraph, default button size.
- **Clone:** `src/app/checkout/page.tsx:20-35` renders an icon circle +
  "Your cart is empty" + "Add some items before checking out." +
  `h-10 px-8 rounded-xl` button. All four details diverge.

### PARITY-3 — 404 page: clone is themed, reference is the base44 standalone slate screen
- **Severity:** Medium (visual parity)
- **Evidence:** Reference unknown route renders a chrome-less full page:
  `min-h-screen flex items-center justify-center p-6 bg-slate-50`,
  `404` in `text-7xl font-light text-slate-300`, an `h-0.5 w-16 bg-slate-200`
  divider, `Page Not Found` (`text-2xl font-medium text-slate-800`), copy
  `The page "<path>" could not be found in this application.`
  (`text-slate-600`, path quoted in `font-medium text-slate-700`), and a
  white/slate outline `Go Home` button with an icon. No site header/footer.
- **Clone:** `src/app/not-found.tsx` is a LUXE-themed block rendered inside
  the site chrome (header/footer), with different copy.
- **Fix approach:** route-group refactor — minimal root layout, chrome moved
  into `app/(storefront)/layout.tsx`, so the root `not-found.tsx` renders
  chrome-less. `not-found.tsx` becomes a client component (uses
  `usePathname` for the quoted path).

### PARITY-4 — Unknown product slug: reference shows an in-chrome "Product not found" block
- **Severity:** Low-Medium (visual parity)
- **Evidence:** Reference `/product/nonexistent-xyz` (in-chrome):
  `<div class="max-w-7xl mx-auto px-4 py-20 text-center"><h2 class="text-2xl font-bold mb-4">Product not found</h2><a class="…default button…" href="/shop">Back to Shop</a></div>`
- **Clone:** `src/app/product/[slug]/page.tsx` calls `notFound()` → the themed
  404. Should render the minimal in-chrome block instead (h2, default button).

### PARITY-5 — `/login` and `/register` render with site chrome; the reference renders them standalone
- **Severity:** Medium (visual parity)
- **Evidence:** Reference `/login` + `/register` have NO header/footer:
  wrapper `min-h-screen flex items-center justify-center bg-background px-4`
  with a `w-full max-w-md` card. Clone renders both inside the root layout
  chrome.
- **Fix approach:** same route-group refactor as PARITY-3 — `app/(auth)/`
  group with a chrome-less layout for login/register.
- **Note:** reference `/checkout/success` does not exist (the reference
  redirects home after order placement); the clone's success page is a
  documented superset and keeps the storefront chrome.

### ENV-1 — Sandbox DB location hijack (environment, not repo code)
- **Severity:** High for this workspace (resolved); no repo defect
- **Evidence:** The sandbox injects `DATABASE_URL=file:/home/z/my-project/db/custom.db`
  into every shell invocation (baked at workspace init, re-injected per
  command; shell `unset` does not persist). This shadowed the repo `.env`
  (bun/Next never override existing process env), so the effective dev DB
  was the workspace-root file, NOT `<repo>/db/custom.db`. Symptom: a stale
  session-1 test order (`ORD-2026-000004`, 6-digit format) survived
  "fresh" reseeds; `db/custom.db` was absent from the repo root.
- **Resolution (sandbox-only):** `/home/z/my-project/db/custom.db` is now a
  hard link to `<repo>/db/custom.db` (same inode — verified), the workspace
  `.env` points at the repo path, and a clean reseed was performed
  (3 reference orders only). Repo code, `.env`, and `src/lib/db-path.ts`
  are contract-correct for fresh clones (test-pinned).
- **Follow-up:** document the failure mode in AGENTS.md (trap log) so future
  sessions recognize it; do NOT "reset" the DB by `rm`-ing one path only.

### REPO-1 — `.env.example` is stale (ORBITAL scaffold branding)
- **Severity:** Medium (onboarding correctness; user explicitly requested a
  working `.env.example` matching the codebase)
- **Evidence:** Header says "ORBITAL — environment configuration", offers a
  PostgreSQL example, references `db:push && db:seed` commands that differ
  from the actual scripts, and does not document `AUTH_SECRET`'s fallback
  behavior accurately for this app.

### REPO-2 — `vitest.config.ts` header comment describes the old tutor app
- **Severity:** Low (documentation-in-code drift)
- **Evidence:** Comment lists "router, clarify questions, plan sanitizer,
  check-in mapping" as the seams — the actual seams are money, password,
  validation, rate-limit, db-path.

### REPO-3 — Stale `project-management_SKILL.md` at repo root
- **Severity:** Low (repo hygiene / doc alignment)
- **Evidence:** 42 KB skill document for the previous scaffold project
  (tutor/task app), tracked in git, contradicting the repo's current purpose.
  It is superseded by the new `ecommerce-store_SKILL.md`.

### POLISH-1 — Next.js dev-mode indicator pollutes screenshots
- **Severity:** Low (dev-only cosmetics)
- **Evidence:** The floating "N" dev-tools button appears bottom-left in dev
  screenshots (VLM flagged it during mobile-menu comparison). Production is
  unaffected.
- **Fix:** `devIndicators: false` in `next.config.ts` (supported in Next 16).

## 3. Remediation ToDo list (execution order)

TDD applies to every code change: red → green, one vertical slice at a time
(tdd skill: test at the public seam, never internals; no horizontal slicing).
E2E specs are the seams for page behavior; the suite boots the production
build on the isolated e2e DB.

- [ ] **T1 (PARITY-1)** — Pin the reference behavior first (red):
  add `tests/e2e/cart.spec.ts` case "adding to cart does not auto-open the
  drawer (reference parity)" — add from PDP, expect dialog NOT visible,
  badge = 1. Update the 5 existing cart specs + checkout spec usage to open
  the drawer via the header cart button (mirroring the reference user path)
  before asserting drawer contents. Then remove `setCartOpen(true)` from
  `buy-panel.tsx` and `product-card.tsx` (green).
- [ ] **T2 (PARITY-2)** — Rewrite the checkout empty state to the reference
  DOM: `max-w-7xl mx-auto px-4 py-20 text-center`, h1 `No items in cart`
  (`text-2xl font-bold mb-4`), default Button → `/shop` `Continue Shopping`;
  remove icon + paragraph. Add an E2E assertion (checkout spec: empty cart →
  "No items in cart" heading, no cart-icon circle).
- [ ] **T3 (PARITY-3 + PARITY-5)** — Route-group refactor:
  - `app/layout.tsx` → html/body/font/metadata only.
  - `app/(storefront)/layout.tsx` → current chrome + StoreProvider + server
    hydration; move `page.tsx`, `shop/`, `product/`, `cart/`, `checkout/`,
    `wishlist/`, `account/`, `admin/` into the group (URLs unchanged).
  - `app/(auth)/layout.tsx` → chrome-less `min-h-screen flex items-center
    justify-center bg-background px-4` wrapper; move `login/`, `register/`.
  - `app/not-found.tsx` → client component, standalone slate 404 replicating
    the reference DOM (7xl light 404, divider, quoted path via
    `usePathname`, slate outline Go Home button), no chrome.
  - Keep `api/`, `robots.ts`, `sitemap.ts` at root (no chrome by design).
  - E2E: update smoke 404 spec (assert heading + no header element), add
    auth-chrome spec (login/register have no header/footer).
- [ ] **T4 (PARITY-4)** — Product page: replace `notFound()` with the
  in-chrome minimal block (h2 `Product not found` mb-4 + default Button
  `Back to Shop` → `/shop`). E2E: unknown slug renders the block with
  header still present.
- [ ] **T5 (REPO-1)** — Rewrite `.env.example` to match the codebase exactly
  (LUXE branding, the three variables, db-path contract note, db:setup
  commands, AUTH_SECRET generation guidance).
- [ ] **T6 (REPO-2)** — Update the `vitest.config.ts` header comment to the
  real seams.
- [ ] **T7 (REPO-3)** — `git rm project-management_SKILL.md` (stale scaffold
  artifact, superseded by `ecommerce-store_SKILL.md`).
- [ ] **T8 (POLISH-1)** — `devIndicators: false` in `next.config.ts`; verify
  dev server renders without the floating indicator; production unchanged.
- [ ] **T9 (ENV-1 doc)** — AGENTS.md: add trap-log entry for parent-env /
  parent-`.env` shadowing of `DATABASE_URL` (bun walks up; shell-injected
  vars win over `.env`), including the symptom (repo-root `db/custom.db`
  never created / stale rows surviving reseeds) and the sandbox hard-link
  resolution.
- [ ] **T10 (docs)** — Update `AGENTS.md`, `CLAUDE.md`, `README.md`,
  `Project_Architecture_Document.md` for: route-group structure, 404/auth
  behavior, drawer interaction change, `.env.example`, test-count changes,
  new `ecommerce-store_SKILL.md`, this remediation doc.
- [ ] **T11 (SKILL)** — Create `ecommerce-store_SKILL.md` at repo root via
  `skills/to-distill-project-into-skill` (six-phase distillation; 20
  sections + appendices; verified against the codebase — exact versions,
  counts, tokens).
- [ ] **T12 (screenshots)** — Re-capture `docs/screenshots/` from the
  remediated dev server: home, shop, PDP, cart drawer (opened via header
  icon), mobile home + mobile nav menu, standalone login + register,
  account dashboard + orders, checkout, checkout empty state, standalone
  404, product-not-found, admin dashboard + orders.
- [ ] **T13 (gate + ship)** — Full gate
  (`lint && typecheck && test && build && test:e2e`), conventional commit(s)
  on `main`, SSH-wrapper push per
  `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`, key shredded after.

## 4. Validation of this plan against the codebase

- Every file:line cited above re-verified at audit time (buy-panel.tsx:49,
  product-card.tsx:81, checkout/page.tsx:20-35, not-found.tsx, product/
  [slug]/page.tsx notFound() call, vitest.config.ts comment, tracked
  project-management_SKILL.md).
- Route-group refactor feasibility verified: login/register pages are
  `"use client"` with no `useStore` dependency → chrome-less group is safe;
  all other pages render within chrome today by construction.
- Reference DOM strings captured live (2026-10-07) and quoted verbatim
  above; no values are guessed.
- Risks: (a) route-group move touches many files mechanically — mitigated by
  `git mv` + full gate; (b) E2E spec updates must keep the rate-limiter
  constraints (single login via storageState) — no new logins introduced.

## 5. Sign-off criteria

1. Full gate green (lint 0/0, tsc clean, unit suite, production build, E2E
   suite — counts may grow, never shrink coverage).
2. Live A/B re-verification of every PARITY item against the reference.
3. Docs + `.env.example` + SKILL.md committed; screenshots refreshed.
4. Single-branch (`main`) history; pushed and remote-verified via the SSH
   wrapper; operator key shredded.
