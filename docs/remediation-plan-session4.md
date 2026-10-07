# Remediation Plan — Session 4 Review (Round-4 Differential Audit)

**Date:** 2026-10-07
**Repo:** `nordeim/ecommerce-store` (branch `main`, baseline `2134652` / `f985358`)
**Author:** Review/build agent (Super Z)
**Scope:** Live differential audit (round 4) of the LUXE Store clone against the
reference (`fuzzy-lumina-style-hub.base44.app`), targeting surfaces no prior
session had A/B-verified at DOM level: per-route document titles, PDP tab
PANEL contents, shipping-cost policy, footer chrome anatomy, the add-to-cart
toast subsystem, auth error presentation, the home feature bar, native form
validation, plus a tablet-width (768px) sweep and the standing mobile-menu
re-verification. The `skills/` folder is excluded from code checking, testing
and compilation per the operating contract.

**Method:** Both sites driven side-by-side with agent-browser (two sessions:
`ref` = production reference, `clone` = local dev server on the current
commit), DOM/computed styles as ground truth, VLM cross-checks (tablet home
comparison caught FEATURES-1), full verification gate re-run at audit start
(lint 0/0 · tsc clean · 52 unit · build OK · 88 E2E — matched documented
status; one transient E2E flake in the cart stepper test exposed CART-RACE-1,
root-caused below).

---

## 1. Baseline verification (state at audit start)

| Gate | Result |
|---|---|
| `bun run lint` | 0 errors, 0 warnings |
| `bun run typecheck` | clean |
| `bun run test` (Vitest) | 52/52 passed |
| `bun run build` | compiles, 20 routes |
| `bun run test:e2e` (Playwright) | 88/88 passed (1 transient flake in run 1 — see §2 CART-RACE-1; isolated re-run + full re-run both green) |
| DB contract | `db/custom.db` at repo root (hard-linked with the sandbox-injected path, shared inode 274771); `.env` = `file:../db/custom.db`; `.env.example` current |
| Test suites | Vitest 5 + Playwright 1.63 configured and green |

### Verified at parity this round (no action required)

- **Mobile navigation menu (3rd re-verification, standing user priority):**
  panel 288×844 @ (0,0) on both sites, nav wrapper `flex flex-col gap-4 mt-8`
  (v4 trap-log #5 pin holds), link classes byte-identical, sr-only delta (2 vs
  1) remains the documented a11y superset.
- **Per-route titles:** `/` "Lumina" · `/shop` "Shop | Lumina" · `/wishlist`
  "Wishlist | Lumina" · `/checkout` "Checkout | Lumina" · `/account` "Account
  | Lumina" · auth routes (session 3) — all matching.
- **PDP Description tab:** byte-identical panel (prose wrapper, muted p,
  `Key Features` h3, ul with lucide-check icons).
- **PDP breadcrumbs:** identical first-main-child structure and text
  (Home / Shop / category / product name).
- **Category cards + grid:** identical classes (`p-6 rounded-2xl bg-card
  border …` card, `h-14 w-14 rounded-2xl` tile, `grid-cols-2 sm:grid-cols-3
  lg:grid-cols-6 gap-4`).
- **Trending/New/On-Sale grids:** identical `gap-4 sm:gap-6` wrappers.
- **Header nav hrefs:** identical (category deep-links on both).
- **Account Orders tab:** identical order history (ORD-2026-001 $349.98
  Delivered · 002 $189.00 In Transit · 003 $524.97 Delivered) — seeded order
  totals unaffected by the shipping-constant fix.
- **Tablet sweep (768×1024):** no horizontal overflow on home/shop/PDP/cart/
  wishlist on either site; feature/category/grid column counts match.
- **Reference checkout:** re-confirmed hardcoded to "No items in cart" even
  with a live drawer cart — the clone's 3-step wizard remains a pure superset.
- **Reference search:** input strip only (recon + live); the clone's typeahead
  popover remains the documented superset.
- **Footer brand/contact/Company/Stay-Updated columns:** identical structure
  and copy.

## 2. Issue inventory

### SHIP-1 — Flat shipping below the free threshold is $5.99; reference charges $9.99
- **Severity:** High (wrong money on every below-$100 cart, drawer + checkout)
- **Evidence (live, 2026-10-07):** Reference drawer: $34.99 cart → Shipping
  **$9.99**, Total $44.98; $79.99 cart → Shipping **$9.99**, Total $89.98;
  $299.99 cart → Shipping **Free**. Clone: $79.99 cart → Shipping $5.99,
  Total $85.98. Rule on both: free at/above $100 (announcement bar), flat
  below — only the flat amount differs.
- **Fix:** `FLAT_SHIPPING_CENTS` 599 → 999 in `src/lib/money.ts` (the single
  consumed constant — `shippingForSubtotal` drives drawer, `/cart`, checkout
  review). Update the pinned unit test; README's "flat `$5.99`" mention.

### TOAST-1 — The reference has an add-to-cart / add-to-wishlist toast subsystem; the clone has none
- **Severity:** High (a whole interaction-surface family missing)
- **Evidence (live):** Region persists in the reference DOM as
  `div.fixed.bottom-6.right-6.z-[100].flex.flex-col.gap-2` (empty between
  toasts). Toast item: `bg-foreground text-background px-4 py-3 rounded-xl
  shadow-2xl flex items-center gap-2 text-sm font-medium max-w-xs` containing
  lucide `CircleCheckBig` `h-4 w-4 text-primary shrink-0` + text
  `«Product name» added to cart!` (PDP buy panel AND shop/product cards) and
  `«Product name» added to wishlist!` (wishlist ADD only — removing shows NO
  toast, verified). Timing: **3000ms** auto-dismiss (measured 3.35s end-to-end
  incl. render). Enter animation: spring from `opacity: 0; transform:
  translateY(16px) scale(0.96)` → `opacity: 1; transform: none` (overshoot
  sampled to -2.1px). Exit: rise to `translateY(-10px) scale(0.95)` then
  unmount (~350ms). Rapid adds STACK without dedupe (2 toasts observed).
- **Fix:** `StoreProvider` gains `toasts` + `notify(message)` (id-sequence,
  3000ms auto-dismiss); a `ToastViewport` client component renders the
  reference-exact region + items with a CSS spring approximation (enter
  `cubic-bezier(0.34, 1.56, 0.64, 1)` ~300ms; exit rise+fade ~350ms).
  Call sites push toasts on success: `product-card.tsx` + `buy-panel.tsx`
  (cart add, wishlist add). **`pointer-events-none` on the region** — the
  reference's toasts are not interactive (click does nothing, verified), and
  click-through prevents the fixed overlay from eating drawer-Checkout clicks;
  registered as a deliberate divergence. `aria-live="polite"` on the region =
  a11y superset (documented).

### FEATURES-1 — Home feature bar items are not the reference's bordered cards
- **Severity:** High (resting visual diff on the home page, all viewports —
  caught by the VLM tablet sweep; missed by three prior audit rounds)
- **Evidence (live, computed):** Reference grid `grid grid-cols-2
  lg:grid-cols-4 gap-4`; item `flex flex-col items-center text-center p-6
  rounded-2xl bg-card border border-border/50` (computed bg `rgb(255,255,255)`,
  border 1px, radius 16px, padding 24px); icon tile `h-12 w-12 rounded-2xl
  bg-accent flex items-center justify-center mb-3` with icon `h-5 w-5
  text-primary`; heading `text-sm font-semibold mb-1`; copy
  `text-xs text-muted-foreground`. Clone: bare items (`gap-3`, no card),
  `rounded-full` icon tiles, `text-accent-foreground` icons, grid `gap-6`.
  Feature texts and lucide icons (Truck/ShieldCheck/RefreshCw/Headphones)
  already match.
- **Fix:** restyle `FeatureBar` in `src/components/store/category-card.tsx`
  to the reference anatomy (card item, rounded-2xl tile + `mb-3`, icon
  `text-primary`, h3 `mb-1`, grid `gap-4`).

### CART-RACE-1 — Quantity stepper lost-update race (found via the E2E flake)
- **Severity:** High (real production data-integrity bug under latency)
- **Evidence:** `updateQuantity(item.id, item.quantity + 1)` computes the
  ABSOLUTE target from the current render's state. Two rapid clicks before
  the first server response re-renders both send the same value (e.g. 1+1=2
  twice) — the second overwrites the first: quantity 2 instead of 3, wrong
  totals. Reproduced as a flaky E2E failure under 10-worker parallel load
  (cart.spec.ts:95 — `$104.97` expected, race yields the 2× total). The
  server action `updateItem` sets an absolute quantity, so nothing dedupes.
- **Fix:** delta-based mutation — new `changeQuantityBy(userId, itemId,
  delta)` in `src/lib/cart.ts` reading current quantity and applying the delta
  INSIDE `db.$transaction` (SQLite single-writer serializes it; delete when
  the result ≤ 0), new `adjustCartItemAction(itemId, delta)` +
  `removeCartItemAction(itemId)` server actions, provider
  `adjustQuantity(itemId, ±1)` / `removeItem(itemId)`; steppers in
  `cart-drawer.tsx` + `/cart` page switch to deltas. E2E hardened with an
  intermediate assertion between the two clicks (2 × $34.99 = $69.98) so the
  mutations are serialized by assertion. The old absolute
  `updateCartItemAction` is retired (all call sites were steppers/remove).

### AUTH-VERIFY-1 — The reference gates registration behind email verification; the clone has none
- **Severity:** High (a whole auth step + login gate missing)
- **Evidence (live):** Registering on the reference does NOT create a session —
  it renders a **verify-email screen** and login is blocked until the code is
  confirmed. Screen spec (captured live): same `(auth)` family wrapper
  (`min-h-screen flex items-center justify-center bg-background px-4` >
  `w-full max-w-md`); header `text-center mb-10` with the primary tile
  (`w-14 h-14 rounded-2xl bg-primary` + lucide `Mail` `w-7 h-7`) + h1
  `text-3xl font-bold tracking-tight` "Verify your email" + sub
  `text-muted-foreground mt-2` "We sent a code to «email»"; card
  `bg-card rounded-2xl shadow-sm border border-border p-8` with a 6-slot OTP
  input (visual boxes `relative flex h-9 w-9 items-center justify-center
  border-y border-r border-input text-sm shadow-sm transition-all
  first:rounded-l-md first:border-l last:rounded-r-md` over a hidden
  `autocomplete="one-time-code" inputmode="numeric" maxlength="6"` input),
  a primary `w-full h-12 font-medium` "Verify" button (disabled until 6
  digits), and `p.text-center.text-sm.text-muted-foreground.mt-4` "Didn't
  receive the code? " + `button.text-primary.font-medium.hover:underline`
  "Resend". Wrong code → alert box "Invalid verification code. N attempts
  remaining." (attempt-limited). Unverified login → box "Please verify your
  email before logging in. Check your email for the verification code."
  Password policy verified: min 8 chars, NO complexity requirement (clone
  matches). Reference title on the screen stays "Register | Lumina" (SPA
  artifact — the clone will title it "Verify Email | Lumina", registered as a
  divergence).
- **Fix (env-gated parity machinery):** Prisma `User.emailVerified Boolean
  @default(false)` (+ seed marks demo users verified); `AUTH_REQUIRE_EMAIL_
  VERIFICATION` env flag (**default off** — no email infra exists; default-off
  keeps registration usable, matching the clone's established console-seam
  posture from ADR-010's reset flow); new `/verify-email` route
  (reference-exact screen, server wrapper + client form); `registerAction`
  under the flag creates an unverified user + hashed 6-digit code (15-min
  expiry, 5 attempts, `console.info` seam) and returns
  `{ verificationRequired: true }` (no session); `verifyEmailAction(email,
  code)` verifies + creates the session; `resendVerificationAction` (rate
  limited); `loginAction` blocks unverified logins with the reference copy.
  E2E: the verify screen's happy path is testable without the flag via a
  seeded unverified fixture + deterministic code; register-under-flag
  behavior is unit-tested.

### TITLE-1 — `/cart` page has no title metadata
- **Severity:** Low
- **Evidence:** clone `/cart` document.title = "Lumina"; reference = "Cart |
  Lumina".
- **Fix:** `export const metadata: Metadata = { title: "Cart" }` on the cart
  page.

### TITLE-2 — PDP title uses the full product name; reference uses the humanized slug
- **Severity:** Medium (every PDP)
- **Evidence (live, all 11 products):** reference title = slug split on `-`,
  title-cased, + " | Lumina" — wireless-headphones → "Wireless Headphones |
  Lumina" (h1 stays "Wireless Noise-Cancelling Headphones"); yoga-mat → "Yoga
  Mat | Lumina"; vitamin-c-serum → "Vitamin C Serum | Lumina"; etc. Clone
  uses `product.name` for both title and og title.
- **Fix:** `generateMetadata` in `product/[slug]/page.tsx` derives the title
  from the slug (`humanizeSlug` helper — split `-`, capitalize words; the
  catalog is ASCII so `toLocaleUpperCase`-style casing suffices). Unknown
  products keep the current "Product Not Found" fallback.

### PDP-TABS-1 — Reviews empty panel missing the reference wrapper
- **Severity:** Low
- **Evidence:** reference: `div.text-center.py-10.text-muted-foreground` >
  bare `p` "Customer reviews coming soon." Clone: bare
  `p.text-muted-foreground` (left-aligned, no padding).
- **Fix:** wrap in the reference div.

### PDP-TABS-2 — Shipping tab structure differs
- **Severity:** Low
- **Evidence:** reference: `div.space-y-3.text-muted-foreground` with four
  plain `p` elements prefixed by a literal `✓` character ("✓ Free standard
  shipping on orders over $100" …). Clone: `ul.space-y-2` + `li.flex
  items-center gap-2` + lucide Check icons. (The Description tab's Key
  Features list DOES use lucide checks on the reference — verified identical;
  only the Shipping tab is plain text.)
- **Fix:** re-render the Shipping panel as the reference's plain-`p` list.

### FOOT-1 — Newsletter "Join" button size
- **Severity:** Medium (visible on every page — footer is global chrome)
- **Evidence (computed):** reference Join = 32px tall · 12px font · 12px
  horizontal padding (`h-8 rounded-md px-3 text-xs shrink-0`); clone = 36px ·
  14px · 16px (default Button size).
- **Fix:** `size="sm"` Button variant for Join (exact class match).

### FOOT-2 — Footer bottom separator rhythm
- **Severity:** Medium
- **Evidence (computed):** reference = 1px separator (`h-[1px] w-full my-10
  bg-background/10`, role=none) between the grid and a plain
  `flex flex-col sm:flex-row justify-between items-center gap-4` row (40px /
  1px / 40px). Clone = the row itself carries `border-t border-background/10
  mt-12 pt-8` (48px / border / 32px).
- **Fix:** restore the separator div + plain row (reference anatomy).

### AUTH-ERR — Auth error presentation + register duplicate copy
- **Severity:** Medium
- **Evidence (live):** every reference auth error renders as
  `div.mb-4.p-3.rounded-lg.bg-destructive/10.text-destructive.text-sm` as a
  DIRECT CHILD OF THE CARD (above the form, `mb-4` spacing): login invalid →
  "Invalid email or password"; register duplicate email → **"A user with this
  email already exists"**; register mismatch → "Passwords do not match".
  Clone: login = `p[role=alert].text-sm.text-destructive` (copy ✓); register
  = `p.text-xs.text-destructive` with copy "Email already registered" for
  duplicates (copy ✗).
- **Fix:** shared `AuthErrorBox` (reference classes, no role attribute — the
  reference has none) rendered as the card's first child in all three auth
  forms; server copy for duplicate registration → "A user with this email
  already exists" (update the Zod message + any unit tests); mismatch and
  login errors flow through the same box.

### FP-VALID-1 — Clone auth forms bypass native validation
- **Severity:** Low
- **Evidence:** all three clone auth forms set `noValidate`; the reference
  relies on native `type=email` validation (browser bubble blocks submit —
  verified: malformed email never reaches the server on the reference, while
  the clone submits and returns a Zod error).
- **Fix:** drop `noValidate` from login/register/forgot-password forms (the
  account page's Change-Password form is a superset surface — untouched).
  Rewrite the "invalid email is rejected with a field error" E2E test to the
  native-validation contract (invalid input blocks submission; no server
  confirmation copy appears).

## 3. Deliberate divergences confirmed this round (document, do not "fix")

1. **Footer Shop-column links deep-link category filters** — the reference's
   footer links all point at plain `/shop`; the clone's use
   `/shop?category=…` (consistent with the reference's own HEADER links and
   the registered URL-sync family).
2. **Toast region `pointer-events-none`** — reference toasts are inert on
   click (verified); click-through prevents the fixed overlay from
   intercepting drawer-Checkout clicks and keeps E2E deterministic.
3. **Toast spring approximated in CSS** — the reference uses a JS spring
   (~overshoot -2.1px enter / -10px exit); the clone approximates with
   `cubic-bezier(0.34, 1.56, 0.64, 1)` enter + rise/fade exit. Same geometry,
   not the same integrator.
4. **Toast region `aria-live="polite"`** — a11y superset (the reference has
   no live region).
5. **Auth error box without `role="alert"`** — reference-faithful; the
   account Settings error keeps its own superset affordances.

## 4. Remediation ToDo list (execution order)

TDD applies to every code change: red → green, one vertical slice at a time.
E2E specs run against the production standalone build on `db/e2e.db`.

- [x] **T1 (SHIP-1)** — DONE: `money.test.ts` flat-rate pin updated to 999
  (10 tests, all green); `cart.spec.ts` gained the below-threshold drawer
  case (serum $34.99 → Shipping $9.99 / Total $44.98).
- [x] **T2 (TOAST-1)** — DONE: toast cases in cart + wishlist specs (copy,
  dark box anatomy, 3 s lifetime via settle-and-measure, stacking, silence
  on wishlist remove). GREEN: `notify` in StoreProvider + `ToastViewport`
  (`src/components/store/toast-viewport.tsx`) + call sites in
  product-card/buy-panel; enter/exit via `@starting-style` + bouncy bezier
  in `globals.css`.
- [x] **T3 (FEATURES-1)** — DONE: computed-style assertions (bg 255,255,255,
  border 1px, radius 16px, padding 24px; grid gap 16px — serializes as a
  single "16px" value). GREEN: FeatureBar restyled to bordered cards with
  rounded-2xl icon tiles.
- [x] **T4 (CART-RACE-1)** — DONE: unit tests for `nextQuantity` in
  `src/lib/cart-quantity.test.ts` (delta apply, delete at ≤ 0, clamping) +
  E2E intermediate assertion ($69.98 between the two clicks). GREEN:
  transactional `changeQuantityBy` + `adjustCartItemAction`/
  `removeCartItemAction` + provider `adjustQuantity`/`removeItem` + both
  stepper call sites (drawer + /cart).
- [x] **T5 (TITLE-1/2)** — DONE: smoke assertions for /cart + 3 humanized-slug
  PDP titles. GREEN: /cart restructured as server page (metadata "Cart") +
  `cart-client.tsx` island; `humanizeSlug` in `src/lib/format.ts` wired into
  PDP `generateMetadata` (unit-tested).
- [x] **T6 (PDP-TABS-1/2)** — DONE: Reviews panel wrapped in
  `div.text-center.py-10`; Shipping panel = 4 plain `p` with literal `✓`
  (no list/icons). Pinned in the PDP spec.
- [x] **T7 (FOOT-1/2)** — DONE: Join button `size="sm"` (32px/12px — measured
  match); separator restored to div with 40px margins above/below.
  Computed-style-pinned in storefront-parity.spec.ts.
- [x] **T8 (AUTH-ERR + FP-VALID-1)** — DONE: shared `auth-error.tsx` box in
  all three auth forms; server duplicate copy changed to "A user with this
  email already exists"; `noValidate` removed (native validation pinned by
  E2E). Login/register screens additionally rebuilt to the reference's
  header-outside-card anatomy (h-12 icon-led inputs, "or" divider) — a
  structural find made while wiring the box.
- [x] **T8b (AUTH-VERIFY-1)** — DONE: `verify-email.spec.ts` (screen anatomy,
  wrong-code attempts box, fixture happy path → /account, unverified-login
  block) + unit tests (`verification.test.ts` 4, register-under-flag in
  `validation.test.ts`/auth tests). GREEN: 4 schema columns (db push),
  `unverified@example.com` fixture in seed + e2e-reset, `/verify-email`
  route + OTP form, `verifyEmailAction`/`resendVerificationAction`, login
  gating, env plumbing (.env + .env.example). Default OFF.
- [x] **T9 (docs)** — DONE: AGENTS.md (money/toast/stepper/guest-token
  contracts, divergence register, testing quirks), CLAUDE.md (contracts,
  counts 66/104, env var, selector changes), README.md (features, testing
  table, $9.99, env vars, mermaid/hierarchy), PAD v1.4 (ADR-011 full
  record, §8.1 rebuilt 21-file/170-test table, §8.2 gates, §8.4 checklist,
  §9.2 env row, §11 verification seam, §12 key files, glossary),
  ecommerce-store_SKILL.md v1.4.0 (§5.2 routes, §5.3 inventory 55/26,
  §7 contracts, §9 rows 16–18, §11 counts, §12 L10–L11, §15.7–15.8,
  ADR-011 index, appendix C), this plan checked off.
- [x] **T10 (screenshots)** — DONE: 7 new captures (27-feature-bar-cards,
  28-footer-bottom-bar, 29-toast-added-to-cart, 30-cart-drawer-shipping,
  31-product-shipping-tab, 32-login-error-box, 33-verify-email) + refreshed
  01/05/06 for the rebuilt screens → 33 total; VLM-verified key captures.
- [x] **T11 (gate + live re-verification)** — DONE: lint 0/0 · tsc clean ·
  66/66 unit · build OK · 104/104 E2E = **170 total** (was 140). Live A/B
  re-verification: drawer $9.99 shipping, toast anatomy/copy on all
  surfaces, feature bar computed styles, footer Join + separator, titles,
  PDP tabs, auth error boxes + copy, verify-email screen + full code flow,
  rapid-stepper race (3 × $34.99 = $104.97 Free). Two additional latent
  bugs found and fixed during live re-verification: guest-token cart
  mutations (guest-cart.spec.ts) and the stale-Prisma-client dev-server
  restart.
- [x] **T12 (ship)** — session log `docs/session_6.md`, worklog entries,
  conventional commit on `main`, SSH-wrapper push per
  `docs/how-to-git-push-using-ssh-wrapper_SKILL.md` (explicit `--remote`),
  key shredded, remote ref verified. (Executed by the continuation
  session.)

## 5. Validation of this plan against the codebase

- `FLAT_SHIPPING_CENTS` has exactly one consumer (`shippingForSubtotal` →
  `toDto`); no E2E asserts $5.99 or a below-threshold total (sweep of
  cart/checkout specs: all money pins are ≥ $100 carts = Free). Seeded demo
  orders store their own totals — unaffected (verified live vs reference).
- Toast wiring: `product-card.tsx` and `buy-panel.tsx` are the only
  `addToCart`/`toggleWishlist` call sites; both hold `product.name`. The
  wishlist page renders `ProductCard`, so its hearts inherit toasts. No spec
  asserts the absence of toasts; `pointer-events-none` protects the
  drawer-Checkout click path (checkout.spec's fastest add→drawer→checkout
  sequence overlaps the 3s toast window).
- Feature bar: single component (`FeatureBar` in
  `src/components/store/category-card.tsx`); no existing spec asserts its
  classes (storefront-parity covers header/footer/hero only).
- Stepper: `updateQuantity` consumers = drawer + `/cart` page steppers +
  remove (absolute 0) — all migrate to delta/remove semantics; no other
  consumer of `updateCartItemAction` exists (sweep). The E2E cart specs'
  expected totals stay valid (2 × $189 = $378 Free; 3 × $34.99 = $104.97
  Free — both above the threshold; the intermediate $69.98 assertion is
  below-threshold and gains Shipping $9.98 in the drawer summary — asserted
  as subtotal text only, which the drawer also renders).
- Titles: `/cart` page has no `metadata` export today (root default "Lumina"
  leaks); PDP `generateMetadata` currently returns `product.name` — swap to
  `humanizeSlug(params.slug)`. All 11 reference PDP titles measured; the
  catalog is ASCII-lowercase-slugs so title-casing is deterministic.
- Auth errors: login error is server-rendered state in
  `login-form.tsx`; register's client-side Zod (`p.text-xs`) and the server
  duplicate message both need the box + copy; the duplicate copy lives in
  `src/lib/validation.ts`/`actions/auth.ts` (unit tests may pin
  "Email already registered" — sweep `validation.test.ts`).
- `noValidate` appears on the three auth forms + the account Change-Password
  form; only the auth three change. The invalid-email E2E test
  (auth.spec.ts:152) currently expects the server Zod message — rewritten in
  T8 to the native contract.
- E2E dependency sweep: `auth.spec.ts:66` `p[role=alert]` locator must move
  to the box (T8); no other spec locates auth error elements; smoke's footer
  contact assertions unaffected by FOOT-1/2; storefront-parity's footer
  color assertions unaffected.

## 6. Sign-off criteria

1. Full gate green (lint 0/0, tsc clean, 52+ unit, production build, 88+ E2E
   — counts may grow, never shrink coverage).
2. Live A/B re-verification: drawer shipping at $34.99/$79.99/$299.99 carts,
   toasts (cart add, wishlist add, no-toast-on-remove, stacking, timing),
   feature bar computed styles, footer Join + separator, per-route titles,
   PDP Reviews/Shipping panels, auth error boxes + copy, rapid-stepper race.
3. Docs + SKILL.md updated; screenshots refreshed for changed surfaces.
4. Single-branch (`main`) history; pushed and remote-verified via the SSH
   wrapper; operator key shredded.
