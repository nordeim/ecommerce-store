# Remediation Plan — Session 6 Review (Round-6 Differential Audit)

**Date:** 2026-10-07
**Repo:** `nordeim/ecommerce-store` (branch `main`, baseline `f4204d9`)
**Author:** Review/build agent (Super Z)
**Scope:** Live differential audit (round 6) of the LUXE Store clone against the
reference (`fuzzy-lumina-style-hub.base44.app`). With five prior rounds having
closed every known visual-parity gap, round 6 shifted weight toward the
**superset's production correctness** (the clone's value over the demo
reference) while re-verifying the standing user priorities: mobile navigation
(5th verification) and reference drift on all pinned surfaces. The `skills/`
folder is excluded from code checking, testing and compilation per the
operating contract.

**Method:** Both sites driven side-by-side with agent-browser (sessions `ref`
= production reference logged in as the operator account, `clone` = local dev
server on the current commit, plus `admin` and `guest` sessions on the clone),
DOM/computed styles as ground truth, VLM cross-checks, full verification gate
re-run at audit start. Live functional sweeps: card checkout, PayPal checkout,
guest checkout (cookie cart → order), admin console mutations + mobile sweep,
account orders, wishlist, SEO endpoints.

---

## 1. Baseline verification (state at audit start)

| Gate | Result |
|---|---|
| `bun run lint` | 0 errors, 0 warnings |
| `bun run typecheck` | clean |
| `bun run test` (Vitest) | 66/66 passed |
| `bun run build` | compiles, 21 routes |
| `bun run test:e2e` (Playwright) | 107/107 passed (173 total) |
| DB contract | `db/custom.db` at repo root (hard link converged, inode 274771); `.env` = `file:../db/custom.db`; canonical state (12 products, 3 demo orders) |
| Docs | AGENTS/CLAUDE/README/PAD v1.5/SKILL v1.5.0 all current through session-5 (173-test gate) |

## 2. Audit results

### Verified at parity this round (no action required)

- **Mobile navigation menu (5th re-verification, standing user priority):**
  dialog `fixed z-50 gap-4 bg-background p-6 … inset-y-0 left-0 h-full
  border-r … sm:max-w-sm w-72` — 288×844 @ (0,0) on both sites, nav wrapper
  `flex flex-col gap-4 mt-8`, all 5 links byte-identical (text + hrefs). The
  v4 trap-log #5 pin holds; no Tailwind v4 regression detected anywhere in
  the mobile sweeps.
- **Home (drift re-check):** main wrapper has 8 children on both sites with
  identical classes — hero, features, divider, Trending, Categories, New
  Arrivals, divider, On Sale. Both `shrink-0 bg-border h-[1px] w-full
  max-w-7xl mx-auto` dividers present (session-5 fix holds).
- **Shop (drift re-check):** h1 "All Products", 12 cards, byte-identical
  product order (the catalog-order contract).
- **PDP (drift re-check):** h1/price/tabs/`document.title` identical on
  vitamin-c-serum (incl. the empty related-products set — sole Beauty
  product, reference rule).
- **Login screen (drift re-check):** h1, input types + placeholders, button
  set identical. (The clone's 4 extra `hidden` inputs are Next.js
  server-action plumbing — invisible, no visual impact.)
- **Reference checkout:** still permanently renders "No items in cart" even
  after adding an item in the same SPA session (documented demo quirk; the
  clone's working checkout is the superset).
- **Recon note:** `recon/23-order-success.png` from session 0 is actually a
  homepage capture — the reference's success page has never been reachable;
  the clone's success page remains a documented superset surface.

### Superset functional verification (no action required)

- **Checkout wizard (card):** ORD-2026-004 placed live ($199.99); success
  page copy/structure complete; header badge reads exactly "Cart" after
  placement with no reload (session-5 CHECKOUT-BADGE-1 fix holds live).
- **Checkout wizard (PayPal):** card fields hidden when PayPal selected;
  ORD-2026-005 placed ($179.98 = 2 × $89.99, free shipping ≥ $100).
- **Guest checkout:** ORD-2026-006 placed end-to-end from a cookie cart
  (guest@example.com), visible in the admin console; "View Orders" from the
  success page gates to /login.
- **Admin console:** stats reflect live orders; orders list shows guest +
  user orders; products page stock forms + visibility toggles render; no
  horizontal overflow at iPhone 14 (390/390) on all three admin pages.
- **Account orders tab:** all orders with correct status badges/totals.
- **Wishlist page:** renders a saved item correctly, no overflow.
- **SEO/ops:** sitemap.xml, robots.txt (production-correct superset
  disallows), /api/health, 404 all working.
- **Tooling note (not a defect):** a sticky-header overlap observed while
  driving the payment step was reproduced as reference behavior too (parity)
  — it only manifests when a script scrolls an element under the sticky
  header; real-user flows are unaffected.

## 3. Issue inventory

### STOCK-1 — Stock is neither validated nor decremented at order placement
- **Severity:** High (functional correctness of the superset: overselling is
  possible; admin stock numbers never move)
- **Evidence (live + code, 2026-10-07):** `placeOrderAction`
  (`src/lib/actions/checkout.ts`) validates payment/cart but never reads
  `Product.stock`; nothing in the transaction decrements it. `addItem`
  (`src/lib/cart.ts:157`) and `changeQuantityBy` (:196) accept any quantity
  (cap 99) regardless of stock. Only the PDP UI enforces stock
  (`buy-panel.tsx`: plus disabled at `min(99, stock)`, ATC disabled when
  sold out) — the server trusts the client. Consequences: (1) a cart
  assembled before an admin drops stock can still be checked out
  (overselling a sold-out product); (2) stock never decrements, so the
  admin's stock numbers are operationally meaningless.
- **Design decisions (parity-preserving):**
  - `addItem`/`changeQuantityBy` **clamp** to available stock (silently cap)
    — a hard reject would surface error states the reference never shows on
    parity surfaces; the clamp matches the PDP's own disabled-plus behavior.
  - `placeOrderAction` **rejects** inside the transaction if any line's
    quantity exceeds stock, with a customer-safe message naming the product
    and remaining units; otherwise it **decrements** each product's stock in
    the same transaction (atomic with order creation).
  - Seeded demo orders are fixtures (created directly by the seed, not via
    the action) — unaffected.
  - The E2E global-setup re-runs the seed each run, which restores `stock:
    25` on every product upsert — per-run decrements cannot exhaust stock
    across specs (specs order ≤ ~10 units/run/product).
  - No new UI: the reference has no stock/availability UI, so none is added
    (resting visual of parity surfaces unchanged).

### REDIRECT-1 — No redirect-after-login (guests lose their intent)
- **Severity:** Medium (superset UX; standard e-commerce pattern)
- **Evidence (live):** a guest on the order-success page clicking "View
  Orders" lands on `/account`, which redirects to bare `/login`; after
  logging in, the login form always pushes `/account`
  (`login-form.tsx:30`). The intended destination is lost.
- **Design decisions:**
  - New pure helper `validateRedirectPath` in `src/lib/validation.ts`:
    accepts only same-origin relative paths (must start with `/`, must not
    start with `//` or `/\`, no `protocol:` scheme, length ≤ 512) — the
    open-redirect hardening pattern used by the scandihaven reference stack.
  - `/account` and `/admin` guest redirects become
    `/login?redirect=<their own path>`.
  - The login **server page** reads `searchParams` and passes a
    `redirectTo` prop into the client island (keeps the client island
    presentational; no `useSearchParams` Suspense churn). `/login` becomes
    a dynamic route as a result (was `○` static, becomes `ƒ`) — acceptable
    for an auth page; docs updated.
  - After a successful login the form pushes the validated target (fallback
    `/account`). Register keeps its current post-signup landing (`/
    account`, or `/verify-email` when the gate is on).
- **Fix files:** `src/lib/validation.ts` (+ tests), `src/app/(storefront)/
  account/page.tsx`, `src/app/(storefront)/admin/page.tsx`, `src/app/(auth)/
  login/page.tsx`, `src/app/(auth)/login/login-form.tsx`.

### DEAD-1 — Dead server-action stub (`subscribeNewsletterAction`)
- **Severity:** Low (hygiene)
- **Evidence:** `src/lib/actions/checkout.ts:132` exports
  `subscribeNewsletterAction`, an always-error stub with zero call sites
  (grep confirms only the definition). The newsletter is a route handler by
  design (`/api/newsletter`); the stub contradicts the repo's own
  route-handler whitelist documentation.
- **Fix:** delete the stub.

### GUEST-CHECKOUT-COV — Guest checkout has no E2E coverage
- **Severity:** Medium (test debt; the session-4 guest-cart bug hid for
  three rounds precisely because all cart/checkout specs ran authenticated)
- **Evidence:** every checkout spec runs under the shared storageState;
  only `guest-cart.spec.ts` opts out, and it stops at cart mechanics.
- **Fix:** new `tests/e2e/guest-checkout.spec.ts` (storageState opt-out):
  guest PDP add → `/checkout` (no auth) → PayPal path (fewest fields) →
  place order → success page shows the order number + line item + total →
  header badge cleared. Drives the cookie-cart → order seam end-to-end.

## 4. Dependency sweeps (validated before writing this plan)

- No E2E/unit test pins stock behavior (no spec references `stock`); no
  spec drives the admin console at all (admin has zero E2E coverage —
  noted as a round-7 candidate, out of scope here).
- `updateProductStockAction` (admin) is the only writer of `Product.stock`
  today; the seed upsert re-writes `stock: 25` on every `db:setup` /
  global-setup run (restores dev/e2e state; safe with decrements).
- Checkout specs assert totals/confirmations — unaffected by clamping
  (spec quantities ≤ 3 << stock 25).
- `/login` appears as `○ /login` (static) in the build output; no spec or
  doc pins its static-ness (smoke spec checks title/anatomy only). README
  PAD references to route counts stay 21.
- `login-form.tsx` currently hard-codes `router.push("/account")`; the
  auth.setup storageState login bypasses the form (calls the action
  directly? — no: it drives the real form; the setup lands on `/account`
  and saves state — the redirect param defaults keep that flow identical
  when absent).
- `validateRedirectPath` fits `src/lib/validation.ts`'s existing pure-function
  pattern (Zod + helpers, unit-tested) — no new dependency.
- Removing `subscribeNewsletterAction` breaks nothing (zero imports).

## 5. TDD execution plan

| # | Task | Test first (RED) | Implementation (GREEN) |
|---|---|---|---|
| T1 | Stock clamp on cart mutations | Unit (`src/lib/cart-quantity.test.ts` style): a pure `clampToStock` seam — cart add + stepper clamp at available stock, 0-stock adds rejected to 0 | `addItem` reads product.stock, clamps quantity (existing-line update + create paths); `changeQuantityBy` clamps inside its transaction |
| T2 | Stock validation + decrement at placement | E2E (`checkout.spec.ts` + unit where practical): insufficient stock → order rejected with "only has N left" message, cart intact; adequate stock → order places AND stock decrements (verify via a follow-up add or the admin seam where practical) | `placeOrderAction`: inside `db.$transaction`, re-read each line's product stock, reject overselling lines, `update` decrement per line |
| T3 | Redirect-after-login | Unit: `validateRedirectPath` accepts `/account`, `/admin`, `/shop?x=1`; rejects `//evil.com`, `/\evil`, `https://evil.com`, ``, undefined, overlong | Wire `?redirect=` through account/admin guest redirects + login page/form; push validated target after login |
| T4 | Dead-code removal | (n/a — pure deletion; lint/typecheck gate) | Delete `subscribeNewsletterAction` |
| T5 | Guest-checkout E2E | New spec (RED against nothing — it must pass once written; it pins current-good behavior + T2's decrement) | — |
| T6 | Gate + docs + ship | full gate re-run; AGENTS/CLAUDE/README/PAD/SKILL updates; plan check-off; session log; worklog; screenshots | — |

## 6. Sign-off criteria — ALL MET

- [x] All RED tests verified failing for the right reasons before fixes
      (10 unit — `clampToStock`/`validateRedirectPath` not yet defined;
      2 E2E stock assertions — the clamp missing and the rejection
      missing; guest-checkout + redirect-honoring tests written as
      additive pins)
- [x] Full gate green: lint 0/0 · tsc clean · **76/76 unit · build OK
      (21 routes; `/login` now dynamic) · 112/112 E2E = 188 total**
      (was 173; +10 unit, +5 E2E, none removed)
- [x] Live re-verification (dev server, Playwright-driven —
      `scripts/verify-session6.ts`): guest `/account` →
      `/login?redirect=/account` → login lands on `/account`; the
      `//evil.com` payload is ignored; a live order placement
      (ORD-2026-004) decremented Linen Throw Blanket stock 25 → 24
- [x] Docs updated (AGENTS/CLAUDE/README/PAD v1.6 incl. ADR-013/ADR-014,
      SKILL v1.6.0 rows 22-25 + L14-L15); worklog + session log; 4
      VLM-verified screenshots (37-40) → 40 total
- [x] Commit to main; SSH wrapper push; remote verified

## 7. Outcome notes

- **T1 stock clamp (STOCK-1a):** new pure seam `clampToStock` in
  `src/lib/cart-quantity.ts` (only increases cap; decreases/deletes pass;
  an existing line never drops below its current quantity). `addItem`
  clamps new AND existing lines (a sold-out add clamps to 0 and is
  skipped); `changeQuantityBy` re-reads stock INSIDE its transaction so
  mid-session admin drops are honored.
- **T2 placement enforcement (STOCK-1b):** `placeOrderAction` validates
  every line inside the placement transaction (customer-safe
  `StockRejectedError` → "Sorry, «name» only has N left in stock. Please
  update your quantity.") and decrements each product atomically with the
  order write. Dead stub `subscribeNewsletterAction` removed in the same
  file (DEAD-1). The unused `order` binding in the transaction was left
  as-is (pre-existing shape, lint-clean).
- **T3 redirect-after-login (REDIRECT-1):** `validateRedirectPath` in
  `src/lib/validation.ts` (same-origin relative paths only — rejects
  protocol-relative, backslash, scheme-bearing, bare-root, oversized);
  `/account` + all three `/admin*` pages gate to
  `/login?redirect=<path>`; the login page reads `searchParams` (route
  now dynamic) and the form island pushes the validated target.
- **T4 (DEAD-1):** stub deleted; zero call sites existed.
- **T5 guest-checkout E2E (GUEST-CHECKOUT-COV):** new
  `guest-checkout.spec.ts` drives cookie-cart → 3-step wizard → order →
  success → gated View Orders, storageState opted out.
- **Test bugs fixed during GREEN (not code bugs):** the stock spec's
  admin login originally waited for `**/admin` (the form lands everyone
  on `/account` — navigate explicitly); drawer money assertions switched
  to unique strings (the line total equals the subtotal at 2 units —
  strict-mode collisions); the second checkout entry needed a full refill
  (the wizard remounts fresh — lesson L14, AGENTS.md testing quirks);
  `setStock` waits ~800ms after Save before reloading (the action +
  router.refresh() land asynchronously).
- **Live-verification tooling:** `scripts/verify-session6.ts` (Playwright
  against the dev server) and `scripts/capture-session6.ts` (screenshot
  capture) added under `scripts/`. Note for future sessions: some
  agent-browser sessions route through the sandbox preview proxy, and
  Next 16's Server Actions origin check aborts those POSTs
  (`x-forwarded-host` mismatch) — drive server-action flows with
  Playwright (direct connection) instead; GET-level checks are unaffected.
- **`prisma/dev-cleanup.ts` extended:** restores `stock: 25` on every
  product (placements decrement now).
