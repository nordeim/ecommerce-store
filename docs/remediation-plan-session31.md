# Remediation Plan — Session 31 (Round 31): The Guest Order Confirmation Token (GUEST-TOKEN-1, ADR-039)

**Date:** 2026-10-10 · **Agent:** Super Z · **Branch:** `main`
**Baseline:** `c5fe4fe` (the session-30 ship `7f7952f` + the user's session-60 narrative log)
**Status at audit start:** 475-test gate (242 unit+integration + 233 E2E), PAD v1.30, SKILL v1.30.0 — lint 0/0 · tsc clean · 242/242 unit+integration · build exit 0 (25 routes) · the full E2E baseline re-run **233/233 (7.6m, foreground)** verified on the freshly-cloned workspace.

## 0. The round's mandate

The user's standing round instruction (the professional Stripe integration
verification, the full audit/parity workflow with the mobile-nav +
Tailwind v4 watches, the `.env`/db-root contract, the vitest + playwright
suites, the TDD remediation plan, the screenshots, the `.env.example`,
the docs, and the main-only push). No Stripe test-mode keys or email
credentials were provided (the two standing credential-gated candidates
stay gated), so the round's deliverable is audit-derived — the pattern
of rounds 27–30.

**Tech-stack patterns input:** the user directed the Scandi Haven repo
(`https://github.com/nordeim/scandihaven.git`) as the reference for
patterns. Its audit (AGENTS/CLAUDE/PAD/SKILL +
`packages/commerce/src/checkout-service.ts` et al.) was reviewed for this
round. Findings: LUXE's Stripe machinery already meets or exceeds the
Scandi patterns on the payment-path fundamentals (idempotency key
composition including the shipping hash — strictly better than Scandi's
`cart:id:total`; the in-tx dedup row; the intent-anchor placement
idempotency; the failure classification; the refund-needed observability
family — beyond Scandi's stubbed `charge.refunded`). The round therefore
adopts the *checkout-experience* gaps Scandi surfaces: the guest-order
enumeration hardening (Scandi never renders order details to a bare
number), the checkout `noindex` belt-and-suspenders (its FR-512), and
the autoComplete-attributes checkout hygiene.

## 1. Baseline verification (state at audit start)

- **Workspace RESET (fresh clone)** — the sandbox had been wiped;
  `git clone https://github.com/nordeim/ecommerce-store.git` at `c5fe4fe`.
  The environment rebuilt per the documented contracts: `bun install`
  (475 packages) · `.env` created from `.env.example` carrying the repo
  contract `DATABASE_URL="file:../db/custom.db"` · `db/` at the repo
  root · `bun run db:setup` (push + idempotent seed: 6 categories, 12
  products, 4 users, 3 orders, 3 hero slides) · **the session-21
  hard-link convergence recreated** (inode 264240 at BOTH
  `db/custom.db` and `/home/z/my-project/db/custom.db` — the
  env-shadowing trap neutralized: the shell injects
  `file:/home/z/my-project/db/custom.db`, both paths are ONE file).
- Baseline gate: lint 0/0 · tsc clean · **242/242 unit+integration (15
  files)** · build exit 0 (25 routes, standalone present) · **the full
  E2E baseline re-run 233/233 (7.6m, foreground — the L26/L27 lesson)** —
  the documented session-30 ship state verified pre-change.
- **The repo-included `skills/` folder is excluded from checking, testing
  and compilation** — re-verified in all four configs: `tsconfig.json`
  `exclude: ["node_modules", "skills"]`, `eslint.config.mjs` ignores
  `"skills"`, `vitest.config.ts` includes only `src/**/*.test.ts` +
  `tests/**/*.test.ts`, `playwright.config.ts` `testDir: "./tests/e2e"`.
  (The cloned `scandihaven` repo lives OUTSIDE the ecommerce-store repo
  at `/home/z/my-project/scandihaven` — never type-checked, linted,
  tested or committed.)
- Skills consulted (from the repo `skills/skills-catalog.md`, 218
  cataloged): **e-commerce-nextjs16-monorepo** (the Scandi master skill —
  checkout UX + payment patterns), **agent-browser** (the live reference
  walk), **clone-app-pat-pro** (the parity methodology), **tdd**
  (red-green-refactor; the failing regression test first), plus the
  repo's own `ecommerce-store_SKILL.md` §4.2 (the Tailwind v4 trap log)
  and `docs/Tailwind-V4-Validation-Report.md`.
- **The Round-31 live battery (the audit):** the paired pixel sweep
  **ALL 8 ROUTES AT BASELINE** (home 0% [6 px, both sides painted on the
  same slide `1237b9a1afec`]; shop 0.05%, pdp 0.34%, cart 0.01%,
  wishlist 0%, checkout 0.01%, account 0%, login 0.28%). **The 31st
  mobile-nav verification: TOKEN-EXACT PARITY** (all 10 checks — panel
  288px / bg rgb(251,250,249), nav flex gap-4 mt-8, 5 links 239×44 at
  18px/500 with identical hrefs `/`, `/shop`,
  `/shop?category=electronics|clothing|accessories`; the Electronics
  deep-link + auto-close passed; the reference measured live at the
  same values via agent-browser). The standing watches clean (typeahead
  — the reference fires ZERO search requests; carousel cadence
  [3753, 8752, 13750] ≈ 5000ms stable; the SEO layer — 17-URL sitemap,
  robots, JSON-LD, offers.price 299.99 USD). The console census 24
  routes + 11 admin surfaces CLEAN. The hero content re-measured live
  (HERO-DRIFT-1 watch): the reference carousel still rotates Spring
  Collection 2026 / Tech Essentials / Home & Comfort with the same
  media tails + `/shop` CTA hrefs — no content drift.
- **The Stripe integration audit (the round's focus area):** the full
  machinery re-read file-by-file — `stripe-config.ts` (the sentinel
  mirror), `stripe.ts` (the lazy SDK singleton), `stripe-payment.ts`
  (the pure seams: idempotency keys, params, placement verification,
  failure classification, the REASON-TRAIL vocabulary),
  `actions/stripe.ts` (the mint), `actions/checkout.ts` (verify-then-
  place + the in-tx stock re-check + the P2002 anchor resolution),
  `api/stripe/webhook/route.ts` (the H4d backstop), `stripe-pay.tsx`
  (the Payment Element island with the brand-token appearance + `/pure`
  loader), `checkout-flow.tsx` (the wizard). Verified healthy and
  consistent with ADR-030..038 — the integration is professional-grade
  and env-gated OFF by honest design (no keys provided; "set-me"
  placeholders are NOT configuration). The two real checkout-experience
  gaps found are BELOW (§2.1–§2.3).

## 2. Audit results

### 2.1 THE PRIMARY FINDING — guest order details leak to anyone who enumerates sequential order numbers (GUEST-TOKEN-1)

`/checkout/success` gates its detailed confirmation (order number,
email, line items, total) with:

```ts
// src/app/(storefront)/checkout/success/page.tsx
const visible = order && (!order.userId || order.userId === user?.id);
```

`!order.userId` is TRUE for every GUEST order — and guest orders are a
first-class flow (guest checkout is E2E-pinned since session-6). Order
numbers are sequential and guessable by construction (`ORD-YYYY-NNN`,
count-based, zero-padded to 3). **Verified live (the exploit probe,
`scripts/guest-order-enumeration-probe.mjs`):** a fresh anonymous
context — no cookies, no session — visiting
`/checkout/success?order=ORD-2026-004` (a guest order placed moments
earlier by a "victim") renders the victim's email address, the
purchased item, and the total. Anyone on the internet can walk
`ORD-2026-001..NNN` and harvest guest PII (emails + purchase
histories). High-end stores never do this — Shopify gates guest order
status behind a per-order secret key in the URL; Amazon uses
account-scoped order views exclusively.

The success page is a **superset surface** (the reference always renders
its empty cart; the confirmation page is clone-only), so the fix is
free to change it without parity implications.

**The fix (the Shopify pattern):** the placement action signs the order
number with an HMAC (keyed by the existing `AUTH_SECRET`), returns the
token with the order number, the wizard redirects with
`?order=X&t=<token>`, and the success page renders details only for
(a) the signed-in owner (`order.userId === user?.id`) or (b) a valid
token. Everyone else — including anonymous enumerators AND signed-in
non-owners — gets the existing generic "Your order has been placed."
block (which already exists as the `visible === falsy` branch).

### 2.2 CHECKOUT-SEO-1 — `/checkout` and `/checkout/success` carry no `noindex`

`robots.txt` disallows `/checkout` (crawl-blocked) and the sitemap
excludes it — but neither page's head carries a robots meta. A
crawl-blocked URL can still be indexed through inbound links ("Indexed,
though blocked by robots.txt" in Search Console). The Scandi pattern
(FR-512) and high-end practice: `noindex` metadata ON the page itself,
belt-and-suspenders with the robots.txt disallow. Both pages are
superset surfaces — the head change cannot disturb any parity pin.

### 2.3 CHECKOUT-AC-1 — the shipping step's inputs lack `autoComplete` attributes

The mock card fields correctly carry `autoComplete="cc-number|cc-exp|
cc-csc"` (session-15, AUTO-1 family), but the shipping step's seven
inputs (First Name, Last Name, Email, Address, City, State, ZIP) carry
NONE. Browser autofill — the single biggest checkout-conversion lever
(after payment method count) — keys off these tokens; without them,
Chrome/Safari cannot reliably fill a saved address, and a11y tooling
flags the missing field purposes (WCAG 1.3.5 Identify Input Purpose).
The reference's checkout renders only "No items in cart" (its cart is a
mock), so the wizard is a superset surface — free to fix. The Scandi
checkout carries the full set ("autoComplete attributes on every
field", its audit R-series).

### 2.4 Verified-healthy (no action)

- The mobile navigation: TOKEN-EXACT parity (31st verification) — the
  Tailwind v4 trap-log discipline holds (flex `gap-4` stacking, no
  `space-y-*`; the `@custom-variant hover` override; the pinned tokens).
- The Stripe machinery end-to-end (§1) — including the webhook H4d
  shape, the failure classification, and the admin observability family.
- The vitest + playwright configuration layer: `vitest.config.ts`
  (node env, src+tests include, `@` alias — Playwright specs never
  double-picked-up) and `playwright.config.ts` (prod standalone server,
  isolated e2e.db, storageState setup project, workers:1) are
  professional-grade and green — the user's "add vitest and playwright
  test suite by modifying the respective config files" instruction is
  satisfied by the existing configuration (verified this round; no
  modifications required — the suites run 242 + 233 green).
- The `.env` / db-root contract: `.env` carries
  `DATABASE_URL="file:../db/custom.db"`, `db/custom.db` lives at the
  repo root, `src/lib/db-path.ts` resolves the schema-relative URL, and
  `tests/db-path.test.ts` pins the contract (15 tests green).
- The catalog order, money math, auth anatomy, header geometry, a11y
  census pins, CWV budgets, sitemap census — all green in the baseline.

## 3. Fix design (validated against the codebase)

### 3.1 The pure token seam — `src/lib/order-view-token.ts` (NEW)

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

// Domain-separated HMAC: the success page's guest-order view token
// (GUEST-TOKEN-1). Signs `order-view:<number>` with the same secret
// resolution as the session cookie (AUTH_SECRET, dev fallback) — a
// fresh key per deployment, never derivable from the sequential
// order number itself.
function resolveSecret(secret?: string): string {
  return secret ?? process.env.AUTH_SECRET ?? "insecure-dev-only-secret-change-me";
}

export function signOrderViewToken(orderNumber: string, secret?: string): string {
  return createHmac("sha256", resolveSecret(secret))
    .update(`order-view:${orderNumber}`)
    .digest("base64url")
    .slice(0, 22); // 132 bits — url-safe, no padding
}

export function verifyOrderViewToken(orderNumber: string, token: string, secret?: string): boolean {
  const expected = signOrderViewToken(orderNumber, secret);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b); // constant-time
}
```

Design constraints (validated):
- **Pure + SDK-free** (node:crypto only) — unit-pinnable in the node
  environment, the repo's established seam pattern (`stripe-payment.ts`).
- **The optional `secret` parameter** is the test seam (the
  `rate-limit.ts` `now()` pattern) — tests inject known keys; production
  resolves `AUTH_SECRET` exactly like `src/lib/auth.ts` (line 16) with
  the same documented dev fallback.
- **Domain separation** (`order-view:` prefix): a token can never be
  confused with a session-cookie signature, and vice versa.
- **No expiry** (the Shopify-key posture): the token gates a
  confirmation page that shows exactly what the customer already saw;
  a bookmarked link should keep working. The order-number uniqueness +
  the HMAC is the security boundary.
- **Server-only**: imports node:crypto — never imported from a client
  component (mirrors `stripe-payment.ts`'s warning header).

### 3.2 The action returns the token — `src/lib/actions/checkout.ts`

The success payload widens from `{ orderNumber }` to
`{ orderNumber, viewToken }` (additive — every existing consumer reads
`orderNumber` only, verified by grep: `checkout-flow.tsx:67` +
`stripe-pay.tsx` type annotations):

- The happy path (line 202): `return { ok: true, data: { orderNumber, viewToken: signOrderViewToken(orderNumber) } };`
- **The P2002 already-placed branch (line 217) — the critical one:** a
  guest double-submit resolves to the EXISTING order's number; the token
  must be minted for that same number or the retry's redirect would
  render the generic block (a false "lost" order):
  `return { ok: true, data: { orderNumber: existing.number, viewToken: signOrderViewToken(existing.number) } };`

### 3.3 The redirect carries the token — `src/components/checkout/checkout-flow.tsx`

Line 67 becomes:

```ts
router.push(`/checkout/success?order=${encodeURIComponent(state.data.orderNumber)}&t=${encodeURIComponent(state.data.viewToken)}`);
```

Both the mock path (step 3) and the Stripe path (`StripeCheckout`'s
`formAction` → the same `useActionState`) redirect through this single
effect — one change covers both flows. The `stripe-pay.tsx` type
annotations widen to `ActionResult<{ orderNumber: string; viewToken: string }>` (type-only).

### 3.4 The success page gate — `src/app/(storefront)/checkout/success/page.tsx`

```ts
const token = Array.isArray(params.t) ? params.t[0] : params.t;
const order = ...; // unchanged lookup
const ownerView = !!order && !!user && order.userId === user.id;
const tokenView = !!order && typeof token === "string" && verifyOrderViewToken(order.number, token);
const visible = order && (ownerView || tokenView);
```

- Signed-in owners keep their view with NO token in the URL (the
  authenticated E2E flow — `checkout.spec.ts` — stays green unchanged).
- Guests get the token via the redirect (the guest E2E flow —
  `guest-checkout.spec.ts` — stays green: it asserts the
  "Your order ORD-… has been placed" copy + the email, which render
  under the token).
- Anonymous enumerators AND signed-in non-owners (a real privacy fix —
  today ANY signed-in user can read ANY guest order) get the generic
  block.
- The `role`/landmark structure is untouched (the storefront-parity
  single-main check on `/checkout/success` stays green).

### 3.5 CHECKOUT-SEO-1 — the `noindex` option, `src/lib/metadata.ts` + the two pages

`pageMetadata` grows an option (validated: the function returns a plain
`Metadata`; adding `robots` is additive and renders
`<meta name="robots" content="noindex, nofollow">` on exactly the pages
that opt in):

```ts
/** Emit robots noindex (checkout-family pages; belt-and-suspenders with robots.txt). */
noindex?: boolean;
// …in the return:
...(noindex ? { robots: { index: false, follow: false } } : {}),
```

`/checkout` and `/checkout/success` pass `noindex: true`. Every other
page's head is byte-identical (the option defaults off).

### 3.6 CHECKOUT-AC-1 — autoComplete on the shipping step, `src/components/checkout/checkout-flow.tsx`

| Field | autoComplete |
|---|---|
| First Name | `given-name` |
| Last Name | `family-name` |
| Email | `email` |
| Address | `street-address` |
| City | `address-level2` |
| State | `address-level1` |
| ZIP | `postal-code` |

Additive attributes on a superset surface — zero computed-style impact
(`autoComplete` renders no styles).

### 3.7 The tests (TDD — RED first)

**Unit (new `src/lib/order-view-token.test.ts`, ~8 tests):**
roundtrip (sign→verify true); wrong token false; token for order A does
not verify order B (cross-order); tampered character false; truncated
token false (length guard); injected-secret determinism (same secret →
same token; different secret → different token — the AUTH_SECRET is
load-bearing); the domain-separation prefix (a session-cookie-shaped
HMAC of the same number does not verify); output shape (base64url
alphabet, 22 chars).

**E2E regression (extend `tests/e2e/guest-checkout.spec.ts` +1 test):**
the enumeration scenario, end-to-end — a guest places an order (capturing
the success URL with its token), then a FRESH anonymous context visits
the bare `/checkout/success?order=<number>` and gets the generic block:
the victim email is NOT in the DOM, the items/total are NOT rendered,
"Your order has been placed." IS rendered; and the tokened URL (from
the guest's own context) still renders the full details.

**E2E noindex (extend `tests/e2e/seo.spec.ts` +1 test):** `/checkout`
and `/checkout/success` heads carry
`<meta name="robots" content="noindex, nofollow">` (and the existing
robots.txt disallow assertions stay).

**E2E autoComplete (extend `tests/e2e/checkout.spec.ts` +1 test):** the
seven shipping inputs carry their `autocomplete` attributes (WCAG 1.3.5
field-purpose contract).

**A11y pin confirmation:** the checkout-family surfaces are NOT in the
standing axe census pins (home/shop/PDP/cart/account/login + admin) —
the generic-vs-detailed confirmation swap changes no census-counted
surface. The full E2E run re-verifies.

### 3.8 Mutation efficacy plan ×3

1. **The gate mutation:** revert `visible` to `!order.userId ||
   order.userId === user?.id` → the enumeration E2E regression must go
   RED (the victim email reappears under the bare number).
2. **The token-seam mutation:** drop the `order-view:` domain prefix →
   the domain-separation unit test must go RED.
3. **The noindex mutation:** remove the `noindex` spread from
   `pageMetadata` → the seo E2E noindex test must go RED.

Each mutation is caught by the RIGHT layer, then reverted byte-exact
(md5-verified).

## 4. Execution checklist (TDD)

1. **RED:** write `order-view-token.test.ts` (8 contracts) + the three
   E2E extensions; run them — the unit file fails on the missing
   module; the E2e enumeration test fails (the leak renders); the
   noindex + autoComplete tests fail (absent attributes). All fail for
   the RIGHT reasons.
2. **GREEN:** §3.1 → §3.6 in order (seam → action → redirect → gate →
   metadata → autoComplete).
3. **Targeted runs:** `bunx vitest run src/lib/order-view-token.test.ts`
   → the unit layer; `bunx playwright test tests/e2e/guest-checkout.spec.ts
   tests/e2e/seo.spec.ts tests/e2e/checkout.spec.ts` → the three touched
   specs; `bunx vitest run` → the full unit layer (no collateral).
4. **Full gate:** `bun run lint && bun run typecheck && bun run test &&
   bun run build && bun run test:e2e` — then a SECOND consecutive full
   E2E run on the final code (the ship discipline).
5. **Post-change battery:** the paired pixel sweep re-run (all 8 routes
   must stay at baseline — the touched surfaces are head attributes +
   a superset page), the 32nd mobile-nav token-exact verification, the
   watches + census.
6. **Screenshots:** the remediated app on the dev server — the
   confirmation page with the token (guest flow, details visible), the
   bare-number enumeration view (generic block — the fix visible), the
   checkout wizard shipping step, the admin payments surface, and the
   home page — saved as `docs/screenshots/166-*.png` … `170-*.png`.
7. **Docs:** AGENTS.md (the round summary + the new trap entries if
   any), CLAUDE.md (the session-31 contract + counts), README.md (the
   feature table row + privacy note), PAD v1.31 (ADR-039 + the §4.2
   shipping 599→999 correction + the §8.4 count refresh + the §5.1
   self-hosted-font correction + the §6.1 CSP row correction),
   SKILL v1.31.0, `docs/session_61.md`, the worklog S31 entry, and this
   plan's sign-offs. `.env.example` re-verified (no new env plumbing —
   the token keys off the existing AUTH_SECRET).
8. **Push:** single conventional commit to `main` via
   `docs/ssh_git_wrapper_v3.py --remote git@github.com:nordeim/ecommerce-store.git`
   (the wrapper DEFAULTS to task-management — the session-59 lesson),
   then the key shred + remote-verification.

## 5. Sign-offs (checked on completion)

- [x] RED: the 8 unit contracts + 3 E2E extensions fail for the right reasons
- [x] GREEN: §3.1–§3.6 implemented, targeted runs green
- [x] Mutations ×3 caught + byte-exact reverts (md5s recorded)
- [x] Full gate green: lint 0/0 · tsc clean · 250/250 unit+integration · build exit 0 · E2E 236/236 ×2 consecutive
- [x] Post-change battery: sweep at baseline (all 8 routes) · mobile-nav token-exact verification · watches + census clean
- [x] Screenshots 166–170 captured + VLM-verified (5/5 PASS)
- [x] Docs updated (AGENTS, CLAUDE, README, PAD v1.31/ADR-039, SKILL v1.31.0, session_61, worklog, plan sign-offs)
- [x] `.env.example` verified current (no new env plumbing — the token keys off AUTH_SECRET)
- [x] Committed to `main` + pushed via the SSH wrapper (remote verified, key shredded)
