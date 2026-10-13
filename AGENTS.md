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
| Unit tests (watch) | `bun run test:watch` |
| Single unit test | `bunx vitest run src/lib/money.test.ts` |
| Production build | `bun run build` (standalone output) |
| Production start | `bun run start` (standalone server on :3000; logs tee'd to `server.log`) |
| Prisma generate (client only) | `bun run db:generate` |
| Prisma migrate dev | `bun run db:migrate` |
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
  login/register/forgot-password/verify-email/reset-password standalone
  (five members; reference parity: no
  header/footer) — each route is a server `page.tsx` (owns `Metadata`:
  "Login"/"Register"/"Forgot Password", built via the shared
  `pageMetadata()` builder — session-9, METADATA-OG-1) delegating to a
  `*-form.tsx` client island; the root
  `not-found.tsx` is the reference's chrome-less platform 404 (slate palette,
  pinned). Unknown PRODUCT slugs render an in-chrome "Product not found"
  block instead (`product/[slug]/page.tsx`).
- **RSC by default.** Pages under `src/app/` are server components querying Prisma directly. `"use client"` only for interactive islands (`src/components/store/*`, `checkout-flow`, `account-tabs`).
- **Catalog order is a parity contract.** `Product.sortOrder` mirrors the reference's product array position 1:1 (measured live 2026-10-07: headphones, watch, tee, speaker, planter, shoes, serum, blanket, sunglasses, mat, pad, pajama). "Featured" = sortOrder asc; "Top Rated" = `[{rating: desc}, {sortOrder: asc}]` (Prisma ties are otherwise undefined); "Newest" = createdAt desc with the seed's staggered createdAt (array position 1 = oldest). Home's On Sale section = first 4 `isOnSale` products in array order. Changing seed order requires re-measuring the reference. The home page frames its product sections with TWO hairline dividers (`shrink-0 bg-border h-[1px] w-full max-w-7xl mx-auto`) — after the feature bar and between New Arrivals and On Sale (measured live + session-0 recon; session-5).
- **Money is a parity contract (ADR-011).** Flat shipping below the $100 threshold is **$9.99** (`FLAT_SHIPPING_CENTS = 999` in `src/lib/money.ts`, unit-pinned) — measured live at $34.99 and $79.99 subtotals; Free at/above $100. The seeded demo orders store their own totals and are unaffected.
- **Wishlist hearts are a color contract (session-5).** The reference's ACTIVE heart is `fill-destructive text-destructive` — RED rgb(239,67,67) — on both the PDP buy-panel heart and the product-card hearts (NOT primary orange). The CARD heart is MUTED inactive (`h-4 w-4 transition-colors text-muted-foreground`, rgb(111,111,123)); the PDP buy-panel heart is `h-5 w-5` with NO color class (foreground) and its button is `h-10 px-8` (82px — px-4 lets the flex-1 ATC absorb 32px). The reference's wishlist itself is COSMETIC (heart toggles fire no network call and its wishlist page never fetches entities — always "Your wishlist is empty"); the clone's DB-backed wishlist is the superset. The ATC + heart svgs carry `h-5 w-5` (rendered 16px via the Button `[&_svg]:size-4` base on both sites). Mobile note: px-8 exactly reproduces the reference's iPhone-14 action row, whose heart is clipped ~35px past the viewport (scrollWidth 425 on 390px) — parity, not a defect.
- **Toast subsystem (session-4).** Successful cart adds and wishlist ADDS toast "«name» added to cart!" / "… added to wishlist!" in the reference's dark bottom-right box (`ToastViewport` — `fixed bottom-6 right-6 z-[100]`, `bg-foreground text-background px-4 py-3 rounded-xl shadow-2xl`, CircleCheckBig `text-primary`, 3000ms lifetime, stacks without dedupe; NO toast on wishlist remove — all measured live). Enter/exit are CSS approximations of the reference's JS spring (`@starting-style` + bouncy bezier in `globals.css`). The region is `pointer-events-none` and `aria-live=polite` (registered divergences: the reference's toasts are inert-on-click; click-through keeps drawer-Checkout clicks deterministic).
- **The newsletter funnel is the DB-backed superset of the reference's inert footer form (session-43, NEWSLETTER-E2E-1).** The footer's "Stay Updated" column renders the reference's measured resting anatomy (the h3, "Subscribe for exclusive offers and new arrivals.", placeholder "Your email", the 32px small Join button, "By subscribing, you agree to our Privacy Policy." — measured live 2026-10-11: the reference's input is a BARE text input and its Join click is fully INERT — zero network calls, no status line, no toast; the Base44 cosmetic mock). The clone's island (`NewsletterForm`) carries the superset attrs (`type=email` + `required` + `aria-label="Email address"`), posts to `/api/newsletter` (Zod `newsletterSchema` — the copy-pinned "Enter a valid email address"; rate-limited 10/10min/IP via the shared `rateLimit` seam — the gate runs BEFORE body parsing, so every POST counts; idempotent `NewsletterSubscriber` upsert), and renders the inline `role="status"` line ("Thanks for subscribing!" in `text-background/70` / the error copy in `text-red-300`). Pinned by `tests/e2e/newsletter.spec.ts` (7 pins: the anatomy, the UI success state, the idempotent re-subscribe — the upsert guard, the invalid-email 400, the bad-body 400 — an EMPTY POST body is the honest drive: playwright JSON-quotes string `data`, a first-hand lesson, the 200 shape, and the 429 + Retry-After burst — LAST in the spec, it EXHAUSTS the shared in-memory budget; deterministic because workers:1, only this spec POSTs the endpoint, and each E2E run boots a fresh server). `prisma/e2e-reset.ts` clears the table (no seeded fixtures — clear-all; the run-to-run isolation contract).
- **The checkout validation paths + the edit-back navigation are the E2E-pinned superset contract (session-44, CHECKOUT-VALIDATION-1).** Measured live (the drawer-path probe `scripts/checkout-validation-probe-r44[e/f].mjs`, 2026-10-11): the reference's step-1 "Continue to Payment" is NEVER disabled (resting and every invalid state — the Base44 mock has NO gate), its card input does NO formatting (raw digits stay raw; "1228" stays "1228"), its step-2 → Back → step-1 RESETS the form, and its step-3 carries NO summary cards and NO Edit affordances — the clone's gates, formatters, preservation, and Edit affordances are therefore ALL superset behaviors. The island (`checkout-flow.tsx`) gates step 1 on the email regex + the ZIP `^\d{5}(-\d{4})?$` shape + the address ≥3/city ≥2/state ≥2 floors, gates step 2 on the 13–19-digit card + MM/YY + 3–4-digit CVC, formats the card number into 4-digit groups and the expiry with the slash AS THE CUSTOMER TYPES, keeps ONE React state across the steps (Back/Edit preserve every value; an edited address reaches the review), and renders the step-3 Shipping Address + Payment cards with Edit buttons. Pinned by `tests/e2e/checkout-validation.spec.ts` (9 pins: P1 the email gate + recovery, P2 the ZIP shape + ZIP+4, P3 the length floors, P4 the card grouping typed raw, P5 the expiry slash, P6 the card floor, P7 the step-2 Back preservation + the card's round trip, P8 the Shipping card + Edit + the edited city reaching the review, P9 the Payment Edit preservation + the three-way round trip) — triple-mutation-proven (M1 the email regex loosened → exactly P1; M2 the formatter returns raw → exactly P4+P7+P9; M3 the Back resets state → exactly P7+P9). The demo user's defaults prefill First/Last/Email at /checkout (the server passes the session user's fields — specs fill only the address block). Probe lesson: the REFERENCE's header cart button is ICON-ONLY (its accessible name is the badge count) — a `/cart/i` role-name regex matches the PDP's "Add to Cart" instead; the portable selector is the header button carrying the shopping-bag svg (the helpers.ts `openCartDrawer` form).
- **The account family's validation paths + the address edit/default flows are the E2E-pinned superset contract (session-45, ACCOUNT-VALIDATION-1).** Measured live (the probes `scripts/account-validation-probe-r45[a/b].mjs`, 2026-10-12 — a full-network POST watch): the reference's account family is FULLY COSMETIC — Add New opens NO form (0 forms/0 dialogs after the click; the card list unchanged), Edit is inert, Profile "Save Changes" and Settings "Update Password" fire ZERO network calls and render no validation copy anywhere (the Base44 mock) — the clone's address form (which OPENS), its Zod gates, its field-level error `<p>`s under the street/zip/email/password inputs, its form-level `role="alert"` first-issue line, its `role="status"` success lines, its real writes, its `key={id}` edit loop (the `defaultValue` prefill), and its default-address exclusivity (the `updateMany` flip when "Set as default address" is checked) are therefore ALL superset behaviors. The mutations live server-side (`saveAddressAction`/`updateProfileAction`/`changePasswordAction` + `addressSchema`/`profileSchema`/`passwordChangeSchema` in `src/lib/validation.ts`). Pinned by `tests/e2e/acct-validation.spec.ts` (10 pins + a [cleanup] fixture-restore test: P1 the ZIP gate + recovery, P2 the two-level shape errors (the alert's first issue + the street field error), P3 the default exclusivity (exactly one badge), P4 the edit loop (prefill → change → the card updates), P5 the Cancel collapse, P6 the profile email-taken field error, P7 the "Profile updated." status line, P8 the short new-password field error, P9 the mismatch field error, P10 the rotation — the old hash proven dead THROUGH the change form (`scryptVerify` against the stored hash), consuming none of the login endpoint's 10/15min rate-limit budget, then the in-spec restore) — triple-mutation-proven (M1 the ZIP regex loosened → exactly P1; M2 the `updateMany` flip deleted → exactly P3; M3 the edit city prefill dropped → exactly P4 + the cleanup test's prefill assertion). Naming/ordering contract: the spec is `acct-validation.spec.ts` because ASCII `acct-` sorts AFTER `account.` — account.spec's single-card resting strict-mode pins (one Edit button, one "New York, NY 10001" text) must never see this spec's added cards, and NEW SPECS NEVER MODIFY EXISTING PINS; the [cleanup] test + the e2e-reset restores (the demo address's canonical fields + `isDefault`; the demo `passwordHash`) keep the fixtures canonical, and no added card may duplicate a seeded fixture's text coordinates (strict-mode hygiene). React-19 contract (the round's first-hand lesson): action-submitted forms RESET their uncontrolled inputs to `defaultValue` after EVERY submission (success OR failure) — the invalid-state captures show empty inputs + the error lines, and a recovery pin must re-fill the whole form.
- **The search family's behavioral contract is the E2E-pinned contract with THREE reference-measured/defect-proven fixes (session-46, SEARCH-BEHAVIOR-1).** Measured live (the probes `scripts/search-behavior-probe-r46[a/a2/b].mjs`, 2026-10-12 — login-gated, full-network watch): the reference's search dropdown fires ZERO search requests while typing (no typeahead, no loading line, no popover — the clone's typeahead + `/api/search` are pure SUPERSET surfaces; the reference exposes no JSON search API), the reference PRESERVES the typed query across close/reopen (measured: value "serum" after toggle-close + reopen), its toggle button CLOSES the open panel (the second click), its empty submit does NOT navigate, its typed + Enter submits navigate to `/shop?search=`, and its results page renders "2 products found" (the plural template) with case-insensitive matching. The round's three production fixes: (1) the query preservation — the old adjust-during-render reset block removed from `search-bar.tsx` (the reference's measured behavior; the cached popover re-appears on reopen as the superset detail); (2) the toggle-close — the header's search button flips the panel state (`setSearchOpen(!searchOpen)` + `aria-expanded`; the old open-only onClick was a measured divergence); (3) THE CLIP FIX — the strip's session-8-era `overflow-hidden` had clipped the typeahead popover to a 4px sliver (the superset feature was VISUALLY INVISIBLE for 38 rounds while `toBeVisible()` stayed green — Playwright's visibility check is CLIPPING-BLIND, a non-zero bounding box passes; the VLM screenshot verification caught it). The `overflow-hidden` never served the slide-in animation (it clips the element's CONTENT, not the transformed element itself) — removed, the resting pixels are unchanged (the panel renders nothing when closed). Pinned by `tests/e2e/srch-behavior.spec.ts` (12 pins: P1 the deferred-route "Searching…" loading line + the suggestion transition; P2 the no-match calm state; P3 the query preservation; P4 the toggle-close; P5 the empty-submit no-op; P6 the Enter submit; P7 the case-insensitive typeahead; P8 the API limit boundary (11 → 400, 10 → 200); P9 the results-page plural; P10 the results-page case-insensitivity; P11 the 60/min/IP 429 + Retry-After burst — LAST, it exhausts the budget; P12 the popover NON-CLIPPING — a REAL `elementsFromPoint` hit-test at the row's center, the honest visibility check Playwright cannot fake) — quintuple-mutation-proven (M1 the reset restored → exactly P3; M2 the loading clause dropped → exactly P1; M3 the empty-guard deleted → exactly P5; M4 the toggle reverted → exactly P4; M5 the overflow-hidden restored → exactly P12). Naming contract: `srch-` sorts AFTER `search.` AND `smoke.` in ASCII — the 429 pin exhausts the /api/search budget and no spec after it in file order touches the endpoint.
- **The auth family's error-state density is the E2E-pinned contract with TWO reference-measured parity fixes + one registered divergence (session-47, AUTH-ERROR-1).** Measured live (the probes `scripts/auth-error-probe-r47.mjs` + `r47d2.mjs`, 2026-10-12 — full-network watch) + the Zod ground truth (`scripts/zod-groundtruth-r47.mjs`): the reference shows "Passwords do not match" whenever the mismatch condition is true — for short+mismatch AND 129-char+mismatch (the MISMATCH-FIRST rule); its four in-flight pending labels read "Logging in..." / "Creating account..." / "Sending..." / "Resetting..." — THREE ASCII DOTS, `disabled=true` during flight (held-POST routes are the way to catch the window); it blocks malformed emails natively (`type=email`, no `noValidate`) with ZERO action posts; it has NO login rate-limit copy after 11 wrong attempts (the clone's "Too many attempts. Try again in Ns." is a SUPERSET); and it rejects passwords over 72 BYTES with a Base44/bcrypt platform leak ("password cannot be longer than 72 bytes, truncate manually if necessary (e.g. my_password[:72])") — the REGISTERED DELIBERATE DIVERGENCE: the clone keeps its scrypt-appropriate 128-char rule with Zod 3's default copy ("String must contain at most 128 character(s)"), pinned as-is. The round's two production fixes: (1) THE MISMATCH-FIRST PRIORITY — Zod 3 runs the object-level `.refine` even when the base shape fails, so `issues[0]` is always the shape's password issue; `registerAction`'s error assembly now prefers the `confirmPassword` issue (short+mismatch and 129+mismatch both read "Passwords do not match"); (2) THE ASCII-DOTS PENDING LABELS — all four auth islands' labels restored from the U+2026 ellipsis (three dots, the reference's measured form). Pinned by `tests/e2e/autherr-states.spec.ts` (11 pins: P1 the short+match length copy; P2 the short+MISMATCH priority (the honest RED); P3/P4 the register/login native-email blocks (ZERO posts — the request counter is the teeth, the box copy alone cannot distinguish a client-side block from a server-side one); P5-P7 the login/register/forgot pending labels (the label + the disabled state during the hold, the post-release boxes); P8 the reset form's client-first mismatch (ZERO posts); P9 the 129-char boundary (the registered divergence); P10 the reset pending label; P11 the login rate-limit exhausted copy — LAST, 10 wrong submits on the dedicated nonexistent `rl-429-r47@example.com` then the 11th) — quintuple-mutation-proven (M1 the preference removed → exactly P2; M2 the login label reverted → exactly P5; M3 the register label reverted → exactly P6; M4 the reset client-check deleted → exactly P8; M5 min 8→3 → exactly P1). Naming contract: `autherr-` sorts AFTER `auth.` in ASCII ('e' 101 > '.' 46) — new specs never modify existing pins. THE ROUND'S RACE LESSON: an expect on text IDENTICAL across loop iterations resolves instantly on the PREVIOUS response's box — it is NOT a response sync point; a click can then land in the post-response reset window and the native `required` blocks the submit, stalling the loop one POST short. Sync each iteration on the response's own TRANSITIONS: the pending flag's return (`toBeEnabled`) + the React-19 input reset (`toHaveValue("")` — the L38 lesson). Never quote an ellipsis in a label assertion without checking the reference's dots: ASCII "..." vs U+2026 "…" is a customer-visible copy divergence.

- **The checkout family's payment-step states are the E2E-pinned contract with THREE reference-measured parity fixes (session-48, CHECKOUT-PAYSTEP-1).** The step-2/3 surfaces are INTERACTION-GATED — the resting pixel sweep captures /checkout at step 1 only — so the clone's session-1 build liberties (the conditional card-block hide, the full-orange + accent selected styling, the tinted card-fields box) survived 47 rounds unseen. Measured live across seven probes (`scripts/checkout-paystep-probe-r48[.mjs,b,c,d,e,f,g]`, 2026-10-12 — login-gated, the drawer path): the reference's "Review Order" is NEVER disabled (the Base44 mock has no gate — the clone's `cardValid` gate is the registered superset, as session-44 established for step 1); its CVC/expiry/card inputs do NO formatting, carry NO caps, and are PLACEHOLDER-ONLY (no accessible labels — placeholder-based locators are the portable form; the clone's `<Label>` elements are a superset); its CARD FIELDS STAY VISIBLE under PayPal selection (bbox + elementsFromPoint hit-test verified — the clone unmounted them); its selected option's border swaps to `border-primary/30` (the theme orange at 30% alpha) with NO background tint (its option boxes: `flex items-center space-x-3 p-4 rounded-xl border border-border hover:border-primary/30 transition-colors`); its card fields sit in an UNSTYLED container (no bg/border/radius/padding); its step-3 → Back RESETS the payment (the clone's preservation is session-44's registered superset); and its Place Order reads "Place Order — \$299.99" (the em-dash + the cart total — label parity). The round's three production fixes: (1) THE CARD-BLOCK VISIBILITY — the `{payment.method === "card" && ...}` conditional removed + the three card inputs' `required` dropped (the reference's Review advances with empty visible fields; the island's `cardValid` gate stays the single card-path enforcement; the server already gated its card checks on `paymentMethod === "card"`); (2) THE SELECTED OPTION'S STYLING — `border-primary/30`, no `bg-accent`, + the `hover:border-primary/30` token; (3) THE CARD FIELDS' CONTAINER — the `p-4 rounded-xl bg-secondary/40` box dropped, the grid layout kept (the measured geometry is identical: full-width card number, Expiry+CVC side by side). Pinned by `tests/e2e/paystep-states.spec.ts` (11 pins: P1 the card fields still rendered under PayPal — the elementsFromPoint hit-test, the honest visibility check; P2 the PayPal+empty-card advance (the required-drop proof — a restored `required` stalls it, the M2 teeth); P3 the CVC gate paths; P4 the CVC formatter; P5 the 19-digit ceiling; P6 the selected /30 border + no tint (the canvas pixel-pipeline comparison); P7 the unselected stone border; P8 the unstyled container; P9 the method-toggle preservation; P10 the step-3 Back preservation (the reference resets — the superset); P11 the Place Order label + lock) — quintuple-mutation-proven (M1 the conditional restored → P1 + P10; M2 the required restored → exactly P2; M3 the styling reverted → exactly P6; M4 the container restored → exactly P8; M5 the CVC cap 4→6 → exactly P4). Naming contract: `paystep-` sorts between `newsletter` and `performance` in ASCII. THE ROUND'S THREE LESSONS: (1) a mid-transition computed-style read catches the INTERPOLATED color — the 150ms transition-colors window measured alpha 0.513 where the settled target is 0.3; wait for the transition to settle before asserting; (2) Tailwind v4 compiles /30 alpha tokens to a `lab()` color layer — the computed serialization differs from the reference's rgba form while the COLOR is identical; the honest comparison runs both through the canvas pixel pipeline (fillStyle + getImageData) to sRGB bytes with a ±2-per-channel tolerance; (3) a label-level style dump can mislead when the BOX is a parent div — the reference's option boxes wrap the radio + label, so the `<label>` measures "unstyled" while the rendered row is boxed; cross-check the computed-style dump with the VLM descriptions and reconcile with an ancestor-chain probe before concluding a divergence.

- **The quantity-stepper boundary states are the E2E-pinned contract with THREE reference-measured parity fixes + one platform-rule fix (session-49, CART-STEPPER-1).** The stepper boundary surfaces are INTERACTION-GATED (the pixel sweep never opens the drawer; the PDP's resting disabled-minus at opacity 0.4 sat inside the pdp route's noise band), and the session-2 comment ("production-correct extras the reference lacks: disabled minus at qty 1") was a build-liberty ASSUMPTION from before the pin-density methodology existed — the reference's actual boundary behavior had never been measured. Measured live across four probes (`scripts/stepper-probe-r49[.mjs,b,d].mjs` + `stepper-clone-r49c.mjs`, 2026-10-12 — login-gated, the drawer path, content-scoped): the reference's PDP minus at qty 1 is ENABLED (opacity 1, cursor pointer) and its click is a NO-OP (the qty stays 1); its DRAWER minus at qty 1 is ENABLED and its click REMOVES the line ("Cart (1)" → "Cart (0)" → the empty state — doubly measured); its stepper plus has NO cap in any reachable range (the clone's stock/99 ceiling is the registered superset); its steppers carry NO aria-labels (the clone's are the accessibility superset); and its stepper anatomy is byte-identical to the clone's (`p-3 hover:bg-secondary transition-colors rounded-l-xl` / `p-1.5 … rounded-l-lg`, the containers at radius 12px, the qty spans `px-5 font-medium min-w-[3rem]` / `px-3 text-sm font-medium min-w-[2rem]`). The round's four production fixes: (1) THE PDP MINUS FLOOR — the `disabled={quantity <= 1}` + the `disabled:opacity-40` token dropped from `buy-panel.tsx` (the `Math.max(1, q - 1)` clamp IS the reference's no-op); (2) THE DRAWER DECREMENT-TO-REMOVE — the same drop in `cart-drawer.tsx` (the -1 delta flows to `changeQuantityBy`, where `nextQuantity(1, -1) = 0` is the DELETE signal — the session-4/6 seams, already unit-pinned; ZERO server changes); (3) THE /CART CONSISTENCY — the same drop in `cart-client.tsx` (the reference's /cart is the hardcoded empty state — pure superset; one design language: the drawer and /cart both decrement-to-remove); (4) THE PLATFORM CURSOR RULE — the reference's Base44 platform CSS gives EVERY `<button>` `cursor: pointer` (the complete census: 17/17 PDP, 33/33 home, the auth submits, AND a synthetic bare `<button>` appended to the DOM — probe `r49d`), while Tailwind v4.3.3's preflight sets NO button cursor; fixed with `@layer base { button { cursor: pointer; } }` in `globals.css` (explicit utilities like `disabled:cursor-not-allowed` keep winning via class specificity). Pinned by `tests/e2e/qty-stepper.spec.ts` (12 pins: P1 the PDP minus enabled at full opacity; P2 the no-op click; P3 the PDP anatomy byte-exact; P4 the drawer minus enabled; P5 the drawer minus-at-1 REMOVES the item (Cart (0) + the empty state + Start Shopping); P6 the qty-2 decrement; P7 the drawer anatomy; P8 the PDP plus's stock ceiling via the admin seam (setStock 2 → enabled at 1, disabled at opacity 0.4 at 2; restore 25); P9 the /cart enabled + removal; P10 the /cart qty-2 decrement; P11 the PDP boundary walk; P12 the cursor census — every button on the PDP computes pointer) — sextuple-mutation-proven (M1 the PDP disabled restored → P1+P2+P3+P11 — the disabled attr also blocks the click-based pins, an honest four-pin catch; M2 the drawer disabled restored → P4+P5+P7; M3 the /cart disabled restored → exactly P9; M4 the delete signal suppressed → P5+P9 + the unit layer; M5 the no-op clamp removed → exactly P2+P11; M6 the cursor rule removed → P1+P4+P12). Naming contract: `qty-` sorts after `paystep-states`/`performance` and before `search` in ASCII (p < q < s). THE ROUND'S THREE LESSONS: (1) a `[role=dialog]` evaluate matches the Radix OVERLAY — the first portal element, button-less; scope DOM dumps to the element carrying the CONTENT (the one matching `/Cart \(\d+\)/`), the round-48 label-vs-box lesson generalized to portal layers; (2) the VLM described the ENABLED minus as "disabled (dimmed/faded)" — world knowledge over pixels (steppers typically dim the minus at qty 1); the reconciliation captured the reference's OWN stepper element and the pixel zones are BYTE-IDENTICAL (minus zone darkest 79 / sub120 20 / avg 245 on BOTH sites — the 16px single-stroke glyph simply renders lighter than the plus); the VLM description is a cross-check, never the ground truth, and a cross-site pixel-zone comparison is the definitive settlement; (3) live-audit probes that run against the dev DB through the production standalone MUST run `bun prisma/dev-cleanup.ts` afterward — the r49c probe left a cart item in the demo user's cart and the post-change sweep flagged /cart 12.36% + /checkout 47.11% out-of-band (dev-DB residue, not a code regression; the cleanup restored the 8/8 baseline — the sweep's alarm IS the hygiene check working).
- **The shop filter bar's interaction states are the E2E-pinned contract with ONE reference-measured parity fix + the drift register (session-50, SHOP-FILTERS-1).** The filter bar's interaction states are INTERACTION-GATED (the resting pixel sweep renders /shop unfiltered — the Clear never renders, the popovers never open, the buckets never activate), so the session-2-era custom Clear button survived 49 green rounds unseen. Measured live across four probes (`scripts/shopfilter-probe-r50[.mjs,b,c].mjs` + `shopfilter-clone-r50d.mjs`, 2026-10-12 — login-gated, index-locators): ONE parity divergence — the Clear button (the reference's = the shadcn ghost/sm anatomy: 32px/12px/10px-radius/foreground/hover:bg-accent/the X at h-3 w-3 rendered 16px via `[&_svg]:size-4`; the clone's was a custom 36px/14px/square/muted string) — fixed in `shop-filters.tsx` with the reference's BYTE-EXACT class string on a plain button (NOT the Button component: the clone's `button.tsx` base carries `rounded-md text-sm` — a vintage divergence + a text-sm/text-xs conflict). The parity confirmations: the four price buckets' sets byte-identical both sides; the popover geometry byte-identical (radius 10px, start-aligned, 4px gap, content-sized); the Radix accent pair; the keyboard contract; the 7 category options; the 5 price labels; the count line. THE DRIFT REGISTER (session-50): the reference's active-filter CHIP ROW IS GONE (session-3 measured it live — today's anchor dump proves the absence; the clone keeps its chips as the registered superset — never weaken a pin to follow a drift), its deep-linked `?sort=`/`?price=` params are DEAD (featured order + 12 products regardless, while the UI paths work), it writes the URL ONLY on the header search submit, and its filter triggers/input carry NO aria-labels (the clone's are the a11y superset). Pinned by `tests/e2e/shopfilter-states.spec.ts` (12 pins, sextuple-mutation-proven).
- **The PDP buy-panel's action family is the E2E-pinned FULLY-PARITY contract — the sweep's first zero-divergence family (session-52, BUY-PANEL-1).** The action row's four zones (the stepper container + minus/plus, the qty span, the ATC Button, the outline-heart Button) were measured live on BOTH sides across seven probes (buypanel-clone-r52a/f + buypanel-probe-r52b/c/d/e/g — the last LOGGED-OUT for the auth buttons): the geometry byte-identical (stepper 130x42, heart 82x40, ATC the flex-1 absorber = row - 130 - 82 - 32), the ATC's full anatomy (bg primary, radius 12, 14px/500, gap 8, the bare-`shadow` visible pair — v4's bare `shadow` KEPT v3's value; only the named steps below it shifted, and the globals.css --shadow-sm pin covers those), the ATC hover /90, the heart's outline anatomy + hover, the stepper hovers (secondary rgb(242,240,237)), the qty span, and the focus rings (ring-1 ring-ring = the primary orange 1px on both buttons). **THE ACCENT PAIR: --color-accent = hsl(24 80% 96%) (rgb(253,243,237)) + --color-accent-foreground = hsl(24 80% 30%) (rgb(138,64,15)) — measured at the heart hover, the home feature tiles, the category tiles, and the Radix Select item highlight (P6/P11/P12).** SIX VINTAGE/ENGINE REGISTERS (rendered-identical — do NOT chase): (1) py-2 — the clone's defaultVariants.size ships `h-9 px-4 py-2`, so h-10 buttons compute padding 8px 32px vs the reference's 0px 32px (the reference's Button has NO defaultVariants.size and its own call sites are inconsistent: the login submit carries px-4 py-2, the heart nothing); (2) gap-2 — the reference's base carries it, the clone's does not (inert: single-child buttons or explicit gap classes); (3) v4's 4-vs-2 zero shadow layers; (4) v4's longer transition-colors list; (5) lab() alpha serialization; (6) the transparent-outline vs outline-none invisible pair. The PDP carries THREE heart populations (the buy-panel heart + the related-cards' hearts + the wishlist page's) — scope every read to the action row's own subtree, never a page-wide `.last()` (the r52 same-element-collision trap). Pinned by `tests/e2e/buypanel-states.spec.ts` (13 pins — P1 the structural geometry; P2/P3/P4 the ATC anatomy/hover/ring; P5/P6/P13 the heart anatomy/hover/ring; P7/P8 the stepper container/hovers; P9 the span; P10 the 0.15s durations; P11/P12 the accent tokens at rest), octuple-mutation-proven.
- **The hero carousel's dot/arrow family is the E2E-pinned FULLY-PARITY contract — the sweep's second zero-divergence family (session-53, HERO-NAV-1).** The arrows and dots were measured live on BOTH sides across seven probes (hero-clone-r53a/b/f + hero-probe-r53c/d/e — the last on both sides via the HERO_PROBE_MODE env): the arrow class string and BOTH dot class strings BYTE-IDENTICAL (`absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors` + `h-2 rounded-full transition-all duration-300 w-8 bg-white` / `w-2 bg-white/50`); the geometry (40×40, inset 16px both sides, center offset 0, svg 20×20; the active dot 32×8 solid white, inactive 8×8 white/50, the row gap 8px / bottom-6 24px / centered); the REAL-mouse hover → white/30 and the no-hover negative on the dots; the 5000ms auto-advance cadence (the reference's re-query-polled deltas 5009/5007); the wrap-around both directions. **THE GLOBAL-RULE DISCOVERY: the arrows' focus indication is the global `* { outline-ring/50 }` base rule (outline auto 1px, the primary orange at 50%) — IDENTICALLY on both sides, the first family whose focus indication is the global rule rather than component utilities.** FIVE SUPERSET behaviors (deliberate, pinned as the clone's own contract): the 700ms crossfade + text rise (the reference swaps slides in the DOM with transition 0s — an instant cut), the hover-pause (the reference does NOT pause on dwell), the dot-click timer restart (the clone's flip lands ~5s after the click; the reference's landed 403ms — no restart), the arrows' aria-labels, the dots' aria-labels + aria-current (the reference carries NONE). SEVEN registers (lab()/oklab(); v4's STANDALONE translate property vs v3's matrix — assert centering structurally; the radius serialization; the transition list; the swap-vs-crossfade architecture; the pause + restart; the a11y gap). **THE TRUSTED-EVENT DISCIPLINE: dispatchEvent'd MouseEvents activate NEITHER :hover NOR React's onMouseEnter — interaction-gated reads need page.hover()/page.mouse.move() (the r53a false-alarm lesson); and the reference swaps slides in the DOM — re-query every poll, never hold element references across a swapping DOM (the r53c staleness lesson).** Pinned by `tests/e2e/heronav-states.spec.ts` (14 pins — P1/P2/P3/P4/P5 the arrows' geometry/anatomy/hover/focus/duration; P6/P7/P8/P9/P10 the dots' active/inactive/row/morph/no-hover; P11 the crossfade; P12 the wrap; P13 the hover-pause; P14 the aria superset), octuple-mutation-proven (M8 the honest BEHAVIORAL catch — the pause handler dropped → exactly P13).

- **The footer's interaction family + the announcement bar are the E2E-pinned contract — the sweep's twelfth installment (session-54, FOOTER-ANN-1), with ONE reference-measured fix.** THE ANNOUNCEMENT BAR IS STATIC ON BOTH SIDES (the prior session's "scroll-marquee" was speculation — 0 element children, animation none, zero keyframes, a 6s positional poll reading [0,0], byte-identical class string `bg-primary text-primary-foreground text-center py-1.5 text-xs font-medium tracking-wide`, every computed value equal: 28px, 12px/500, ls 0.3px, py 6/6) — the sweep's third zero-divergence family; pinned at rest + the anti-marquee negative (footer-states P1/P2). THE FOOTER: 18 of 20 calibrated rows byte-identical (the block, the container, the 4×278 grid at gap 40, the 3 h3s `font-semibold text-sm uppercase tracking-wider mb-4`, the 7 Shop links + 5 Company spans on the shared /60 hover token, the blurb, the contact rows, the hairline, the bottom-row container, the copyright, the mobile collapse); THE ONE DIVERGENCE (fixed): the bottom-row policy spans — the reference carries `text-xs text-background/40 hover:text-background/60 cursor-pointer transition-colors` on EACH span (hover /60) over a bare `flex gap-6` parent, while the clone carried the resting tokens on the parent and `hover:text-background` (FULL) on the spans — THE INHERITED-TOKEN TRAP: the resting paint is identical through inheritance (the sweep and a naive resting read both see parity); only the interaction-gated computed read sees the divergence. REGISTERS: the clone's `?category=` href superset (the reference's 7 links all point to plain /shop), the `mt-auto` sticky-footer superset, lab()/oklab(), the v4 transition list, the reference's `transition: 0s all` no-op, the space-y-3 LI-margin rhythm (never assert ul row-gap).** Pinned by `tests/e2e/footer-states.spec.ts` (14 pins — P1/P2 the announcement bar's resting + the static negative; P3-P9 the footer's structural + hover layers; P10/P11 THE FIX's structural + behavioral pins; P12-P14 the contact/blurb/mobile contracts), octuple-mutation-proven (M1 → P10+P11 the honest pair — the fix's own regression; M7 → P1+P14 — the mobile height catch).

- **The header's icon-button family is the E2E-pinned FULLY-PARITY contract — the sweep's thirteenth installment and FOURTH fully-parity family (session-55, HEADER-ICONS-1), with ONE superset-layer fix.** The four ghost icon buttons (search/heart-wishlist/bag-cart/user-account) were measured live on BOTH sides across six probes (headericons-probe-r55a/b/d reference + headericons-clone-r55c/e/f clone): every computed value identical on the interaction axis — the buttons at 844/884/924/964 each 36×36 in the `flex items-center gap-1` cluster (156w); the svgs BYTE-IDENTICAL (`lucide lucide-X h-5 w-5`) and rendering **16px COMPUTED on BOTH engines** (the Button base's `[&_svg]:size-4` descendant utility beats the svg's own h-5 w-5 — pin the class string AND the computed, they can diverge); the resting computed (transparent, rgb(23,23,28), radius 10px, 0.15s, pointer); the REAL-mouse hover accent pair rgb(253,243,237)/rgb(138,64,15) on all four; the tab order identical INCLUDING the Link-wrapped heart/user DOUBLE-ENTRY. **THE PER-ELEMENT-TYPE FOCUS INDICATION (the r53 global-rule discovery extended): the A wrappers (logo/heart/user links) take the global `* { outline-ring/50 }` rule (outline auto 1px) while the shadcn BUTTONS' own focus-visible utilities WIN on the buttons — outline none (v4; v3's 2px-transparent paints nothing either) + the orange 1px ring layer in the box-shadow (the 2-vs-4 layer count is the standing register).** TWO SUPERSETS pinned as the clone's own contract: the aria layer (Search + aria-haspopup + aria-expanded, Wishlist, Cart, My account — the reference carries NONE) and the count-aware bag badge (the reference NEVER paints a counter; the clone's 16×16 primary pill at `-top-1 -right-2`, white 10px/600, min-w 16, rounded-full). THE ONE FIX (the round's honest RED, in the superset layer): the cart aria's pluralization — `Cart, 1 items` → the ternary `=== 1 ? "item" : "items"` (the repo's own convention at the shop filters), with the 23-locator alignment sweep across 9 spec files (intent-preserving). REGISTERS: the `relative` placement (the reference carries it on search/heart/bag with NO positioned children — rendered-identical; the clone carries it only on the bag where the badge lives), the standing gap-2 Button vintage, the logo-A trailing space, the invisible-outline engine pair, the ring layer count, lab()/rgba(). **THE PROBE DISCIPLINES: never click before a tab-walk (a click sets focus and the sequence starts mid-page — park the pointer); cross-page client state does not propagate (reload after a cross-page mutation before reading another page's store); scope the PDP's add-to-cart with .first() (the buy panel + the related-products quick-add both match).** Pinned by `tests/e2e/headericons-states.spec.ts` (14 pins — P1/P2 the geometry + cluster; P3 the svg class + computed 16px; P4/P5 the resting + hover; P6/P7 the per-element-type focus; P8 the tab order; P9-P13 the aria + badge supersets + THE FIX; P14 the mobile cluster), octuple-mutation-proven (M1 → exactly P11 the fix's own regression; M7 the svg class mutated with the computed UNCHANGED → exactly P3 — the class pin's independent value; M8 → P1+P2+P14 the honest triple).
- **The toast's enter/exit animation states are the E2E-pinned contract — the sweep's fourteenth installment, the RESTING anatomy its FIFTH fully-parity family, with TWO animation-layer fixes (session-56, TOAST-ANIM-1).** The resting anatomy measured IDENTICAL on both sides (the region `fixed bottom-6 right-6 z-[100] flex flex-col gap-2` + the clone's deliberate pointer-events-none; the item `bg-foreground text-background px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-medium max-w-xs` with the full computed set — bg rgb(23,23,28), radius 12px, padding 12px 16px, font 14px/500, gap 8px, maxW 320px, 320×64; the CircleCheckBig svg 16px rgb(230,107,26)). The reference's framer-motion spring measured live (r56a/b): the enter from-pose `translateY(20px) scale(0.95)` opacity 0 — crossing 0 at ~119ms, overshooting to -2.41px at ~169ms, settling at ~302ms; the exit trigger at ~3000ms, the target `translateY(-10px) scale(0.95)` opacity 0, fading EASE-OUT (o=0.31 at +150ms, 0.001 at +266ms, the transform overshooting to -11.2 then settling -10). THE TWO FIXES (globals.css): the @starting-style from-pose 16px/0.96 → **20px/0.95** (the measured pose — the session-4 approximation was calibrated before live measurement) and the exit timing-function ease-in `cubic-bezier(0.4,0,1,1)` → **`cubic-bezier(0.25,0.46,0.45,0.94)`** (the easeOutQuad fit — the old ease-in was DIRECTION-INVERTED: mid-exit the clone lingered 24 opacity points above the reference). FIVE REGISTERS: the JS-spring vs CSS-bezier architecture (the early slope, the opacity arrival 118 vs ~290ms, the exit's -11.2 transform overshoot, the split spring rates); the pointer-events-none region (the reference computes auto); the unmount 3401 vs 3317ms; the overshoot magnitude -1.94 vs -2.41 (sub-perceptual); the `toast-item` hook class. THE PROBE DISCIPLINES (lesson 060): every in-page sampler HARD-BOUNDED (an unbounded rAF loop outlives the toast and matches a different fixed bottom-right element — L72); the CSSOM walk matches rules by TEXT (every CSSStyleRule carries a truthy empty .cssRules in modern Chromium — L73); POLL for in-page markers after a click, never read eagerly (the click resolves ~30ms BEFORE the React commit — the t0-null reads the wall-clock origin; L74); mid-animation captures use the FREEZE technique (probe the live state, freeze at the probed values, capture, restore — a screenshot rasterizes 100-250ms after the call — L75); translucency is UNPROVABLE from a static image (the VLM settlement is the relative side-by-side with the pixel blend as the record — L76).
- **The product card's hover family is the E2E-pinned contract with ONE reference-measured parity fix + the engine-spelling register (session-51, CARD-HOVER-1).** The card's hover states are INTERACTION-GATED (the resting pixel sweep captures /shop with NO hover), AND the one resting-visible divergence — the heart's `backdrop-blur-sm` — is SUB-TOLERANCE on photographic content (a 4px-vs-8px gaussian behind a 36px disc shifts pixels under the sweep's 12-per-channel threshold), so it survived 50 green rounds unseen by every pixel instrument: Tailwind v4 RENAMED the blur scale (v3's sm 4px became v4's sm 8px; xs=4px added) — the clone rendered blur(8px) against the reference's measured blur(4px). Fixed by the globals.css v3 blur pin (`--blur-sm: 4px` — trap log #8, the `--shadow-sm` pin's exact pattern): the class strings stay byte-exact on both sides while the computed value returns site-wide; md (12px) and xl (24px) are unchanged by v4 (verified live: the header 24px, the hero badge + arrows 12px). The parity confirmations across five probes (`scripts/cardhover-probe-r51[.mjs,b,d].mjs` + `cardhover-clone-r51[c,e].mjs` + the browser-canvas pixel differ `pix-diff-r51.mjs`): the container's shadow lift (the visible shadow-xl pair byte-identical — v4 prefixes zero-layers, the ring/inset vars), the zoom (v3 matrix(1.05) vs v4's `scale` spelling — the HOVER-GATE-1 register), the title foreground→primary at 0.15s, the addbar hidden/revealed (v3 translateY 56px vs v4's `translate: 0px 100%` — the same offset), the Add button's full anatomy, the heart's states, the badges, the info block; the hovered-card cross-side diff 0.129% vs the resting 0.109% — the fix's blur difference is SUB-TOLERANCE, so the computed probe is the only instrument that sees it (the r48 lesson inverted: pixels settle engine SPELLING; computed styles settle sub-tolerance VALUES). Pinned by `tests/e2e/cardhover-states.spec.ts` (12 pins, sextuple-mutation-proven).
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
- **PDP visual contracts (session-8):** the star rating row is the
  reference's FLAT form — exactly 5 direct `Star` svgs in
  `flex items-center gap-1`, `floor(rating)` amber
  (`fill-amber-400 text-amber-400`) + the rest `text-border`; NO rounding,
  NO half-stars, NO track/overlay spans (4.8 renders 4 amber + 1 gray).
  The breadcrumb is `flex items-center gap-2 text-sm
  text-muted-foreground mb-8` (NO flex-wrap — the whole PDP's vertical
  rhythm hangs off the 32px margin). The feature bar AND the PDP feature
  row use lucide `shield` (Secure Payment) and `rotate-ccw` (30-Day
  Returns) — NOT shield-check/refresh-cw (measured live; truck and
  headphones were already right). Search-dropdown suggestion categories
  render LOWERCASE ("electronics"), unlike the capitalized badges
  elsewhere.
- **PDP related products = ALL same-category products excluding self** in
  array (sortOrder) order — no cap, no cross-category fill (measured live:
  headphones → speaker + pad only). Shop active-filter chips render for
  category (plain name) and search (quoted term) ONLY — price/sort never
  chip; clicking a chip deep-links to the URL minus that param. The PDP
  document.title is the **humanized slug** ("Wireless Headphones | Lumina"),
  NOT the product name — for EVERY slug, including unknown ones (session-7,
  TITLE-NF-1: the reference's SPA titles `/product/anything` as the
  humanized path; the in-chrome not-found BLOCK is unchanged). The h1 keeps
  the full name. **Unknown ROUTES (not just product slugs) follow the same
  title rule (session-8, TITLE-404-1):** the `[...notFound]` catch-all
  titles the page from the LAST path segment containing a letter, humanized
  (`/foo/bar-baz` → "Bar Baz | Lumina", `/products/42` → "Products",
  `/12345` → plain "Lumina" via `title.absolute`), rendering the identical
  platform-404 UI — the shared component is
  `src/components/store/platform-404.tsx` and the rule lives in
  `notFoundPageTitle` (`src/lib/format.ts`, unit-pinned). The Reviews tab's
  empty panel is `div.text-center.py-10`; the Shipping tab is plain `p`
  elements with a literal `✓` prefix (NO icons — only the Description tab's
  Key Features uses lucide checks).
- **Cart mutations resolve the guest token from the cookie** (`src/lib/cart.ts`).
  The mutation seam (`addItem`/`changeQuantityBy`/`removeItem`) reads
  `cookies().get(CART_COOKIE)` and passes the token to `resolveCartRow` —
  passing `undefined` silently minted a new cart per guest add and made
  guest steppers read as empty (the session-4 live-audit bug; pinned by
  `tests/e2e/guest-cart.spec.ts`, which opts out of storageState).
- **Stock is enforced SERVER-side, silently clamped in the cart and rejected
  at placement (ADR-013, session-6).** The PDP UI caps the stepper at stock
  (`buy-panel.tsx`); the server does too: `addItem`/`changeQuantityBy` clamp
  increases at the product's current stock (never reject — no error state on
  parity surfaces; decreases/deletes always pass; the pure seam is
  `clampToStock` in `src/lib/cart-quantity.ts`). `placeOrderAction` re-reads
  every line's stock INSIDE the transaction and rejects overselling with a
  customer-safe message ("Sorry, «name» only has N left in stock. …"), then
  decrements stock atomically with the order write. Seeded demo orders are
  fixtures (never decremented); the seed upsert restores `stock: 25` on
  every `db:setup`/global-setup run; `prisma/dev-cleanup.ts` restores 25 on
  the dev DB. Pinned by `tests/e2e/stock.spec.ts` (which also drives the
  admin stock form — the admin console's first E2E coverage).
- **Redirect-after-login (ADR-014, session-6 + session-7 REDIRECT-2):**
  `/account` and `/admin*` gate anonymous visitors to
  `/login?redirect=<their OWN path>` — the admin SUB-pages carry their full
  path (`/admin/orders`, `/admin/products`, `/admin/orders/<id>`), not the
  dashboard shortcut; the login server page passes the param into the form
  island, which only honors a `validateRedirectPath`-validated same-origin
  relative path (open-redirect payloads fall through to `/account`).
  `/login` is therefore a DYNAMIC route (was static). Pinned by
  `tests/e2e/auth.spec.ts` + `admin.spec.ts`.
- **The admin order-detail view (ADR-015, session-7)** renders what the
  mutations write but no prior surface showed: `/admin/orders/[id]`
  (admin-gated like every `/admin*` route) shows the customer block
  (email, placed date, payment method + card last4), the parsed JSON
  shipping-address snapshot, the OrderItem snapshots (image/name/unit
  price/quantity/line total), and the **OrderEvent timeline** (chronological;
  `placed` → "Order placed", `status_changed` → "Status changed" with the
  `old → new by actor` note). Order numbers link to it from the admin
  orders list AND the dashboard's Recent Orders. Unknown ids render an
  in-admin "Order not found" block. Read-only — status changes stay on the
  list row's Select (one mutation seam). Pinned by `tests/e2e/admin.spec.ts`.
- **The admin orders list is URL-deep-linkable filterable (session-13,
  ADMIN-SEARCH-1 + session-41, ORDER-WINDOW-1):** `/admin/orders` takes
  `?status=` (validated against the four canonical combobox statuses —
  anything else falls through to the unfiltered list, never an error),
  `?q=` (SQLite `contains` on order number OR customer email — the two
  identifiers a customer relays), and `?from=`/`?to=` (session-41: the
  strict YYYY-MM-DD date-range window on `placedAt` at UTC day
  boundaries — the PAY-OPS-3 treatment applied to the orders surface,
  the only LIST surface without a time dimension and the take-100
  ceiling's reach-past tool; an inverted pair drops together, bad
  bounds fall through, never an error). The pure seam is
  `src/lib/admin-orders.ts` (`parseAdminOrderFilters` +
  `buildAdminOrderWhere`, unit-pinned — 24 tests at session-41; the
  day-bound validation + boundary math compose the SHARED seam
  `src/lib/day-bounds.ts` (parseDayBound + utcDayBounds), extracted
  from admin-payments' private helpers — the session-35
  formatTimelineDate precedent; the payments seam composes the same
  module with zero behavior change, its 54 pins the proof). The filter
  island (`admin-order-filters.tsx`) mirrors `ShopFilters` + the
  payments bar's date group (merged params via `router.push`, the
  adjust-during-render input sync, the canonical re-emission order
  status/q/from/to). The count line ("N orders" / "100+ of N orders")
  makes the `take: 100` bound visible; the empty state offers "Clear
  all filters". Zero parity risk — no storefront surface is touched.
  Pinned by `tests/e2e/admin.spec.ts` (session-13's 3 + the session-41
  date family: the deep-linkable range, from-only/to-only, the status
  composition, the merged-params push, the inverted/bad-bound
  fall-throughs).
- **The admin payment-ops surface (session-24, PAY-OPS-1, ADR-032;
  refined session-25, PAY-OPS-2, ADR-033):**
  `/admin/payments` renders the `StripeEvent` log — the webhook
  backstop's write path (sessions 22/23) finally has its read surface.
  Every event's OUTCOME derives from DB state via
  `resolvePaymentEventOutcome` (`src/lib/admin-payments.ts`, unit-pinned):
  a `payment_intent.succeeded` with a linked order → the order number
  deep-linked to `/admin/orders/[id]`; succeeded with NO order → the
  destructive "No order — refund via Stripe dashboard" line (exactly the
  deterministic-failure family the webhook records + 200s per ADR-031 —
  the signal an operator must act on); `payment_intent.payment_failed` →
  "Payment failed"; anything else → "Ignored". The URL-deep-linkable
  filters mirror the orders surface (`?family=` validated against
  succeeded/failed/refund-needed/other — bad values fall through; `?q=`
  on paymentIntentId OR eventId contains); the count line keeps the
  `take: 100` bound visible. **The refund-needed family (session-25,
  PAY-OPS-2a)** is the operator's most actionable signal as a
  first-class filter: `buildAdminPaymentWhere(filters,
  placedIntentIds)` — a pure seam whose second parameter (default `[]`)
  is the placed-intent set the page fetches in ONE bounded query when
  the family is active (`succeeded` AND `paymentIntentId NOT IN placed
  OR paymentIntentId IS NULL`); the family+q combination keeps the
  type+notIn group intact inside one AND element. **The amount column
  (PAY-OPS-2b):** `StripeEvent.amount Int?` (integer minor units,
  nullable) — the webhook persists `data.object.amount` at both write
  sites (recordEvent + the in-tx insert), and the rows render the
  magnitude beside the outcome via `formatCents` ("how much needs
  refunding?"). **The intent-column honesty (PAY-OPS-2c):**
  `stripeEventIntentId(object)` = `payment_intent ?? object.id` —
  charge-family deliveries record the REAL intent id (a charge is not
  an intent), keeping the surface's q-search truthful for the charge
  family. A one-line Stripe configuration status ("demo mode" vs
  "configured", from `resolveStripeConfig`) renders as operator context
  — the R10-2 customer-copy rule does not apply to the console. The
  demo fixtures: `ORD-2026-003` is the Stripe-paid demo order
  (`pi_demo_fixture_003` + `paymentStatus: "paid"` — the order-detail
  Charge row's seeded instance) + the canonical FOUR-event set
  (`evt_demo_fixture_s/f/r` with amounts 52497/8999/7999, and
  `evt_demo_fixture_n` — succeeded → `pi_demo_fixture_006` with NO
  linked order + amount 14900, the refund-needed family's seeded
  instance), seeded idempotently and restored by `prisma/e2e-reset.ts`
  every run (the run-to-run isolation contract). The dashboard's quick
  actions gained the Payments button. Zero parity risk — admin-only
  surface. Pinned by 9 `admin.spec.ts` tests (guest gating with intent,
  role contract, fixture outcomes, family deep-link, q search, empty
  state + Clear, the order deep-link, the refund-needed family + the
  combined AND shape, the amount rendering) + the a11y admin gate's
  payments test ({color-contrast} × 9, E2E-calibrated — the fourth
  fixture's destructive line, the same app-wide class,
  node-enumerated) + the best-practice census test (below).
- **The payments date-range filter (session-26, PAY-OPS-3, ADR-034):**
  `/admin/payments` takes `?from=` / `?to=` — strict `YYYY-MM-DD` bounds
  (the seam's `parseDateBound`: a shape regex + a Date round-trip —
  `2026-02-30` normalizes to March 2, month 13 parses NaN; a bad bound
  falls through to `undefined` so a bad deep-link renders the unfiltered
  list, never an error; `from > to` drops the pair — lexicographic order
  IS chronological for validated strings, and equal dates are a valid
  single-day range). `buildAdminPaymentWhere` composes ONE `receivedAt`
  clause — `gte` the UTC day boundary of `from` (`T00:00:00.000Z`),
  `lt` the day AFTER `to` (exclusive — `to`'s whole day is in range;
  either bound may stand alone) — via the composable-AND refactor: each
  active dimension (family / q / dates) contributes one AND element, one
  element renders bare (every pre-session-26 single-filter shape
  byte-identical — the session-25 unit pins held unchanged), two or more
  AND together. The island (`admin-payment-filters.tsx`) gains two
  URL-controlled `<Input type="date">` bounds (aria-labels "From date"
  / "To date", CalendarRange-led); a change pushes MERGED params in the
  CANONICAL order (family, q, from, to — the island's props are the
  PRE-navigation state, so a Select change on a date-filtered URL would
  otherwise append family last: an unstable deep-link order);
  `hasFilters` includes the dates so Clear shows. The fixture set's
  staggered `receivedAt` dates (2026-02-20/21/22/23) make the filter
  demonstrable with the seeded set — no schema change. Zero parity
  risk — admin-only surface. Pinned by 10 unit + 4 E2E tests (the
  deep-link pair, the open-ended from bound, the family+date combined
  shape, the merged-params push).
- **The admin products list is URL-deep-linkable filterable (session-27,
  ADMIN-PRODUCTS-1, ADR-035 — the console trifecta's completion):**
  `/admin/products` takes `?q=` (name OR slug `contains` — the two
  identifiers an operator relays), `?category=` (validated against the
  slug set the PAGE fetches from the DB and passes to the seam as PURE
  INPUT — the placedIntentIds precedent; the seam never imports Prisma
  and never hard-codes the catalog, so a future category validates the
  day it is seeded), and `?visibility=` (validated `active`/`hidden` —
  the eye-toggle seam's list-level answer: "which products did I
  hide?"). Bad deep-link values fall through to the unfiltered list,
  never an error (the family contract). The pure seam is
  `src/lib/admin-products.ts` (`parseAdminProductFilters(params,
  categorySlugs)` + `buildAdminProductWhere` — the composable-AND
  composition: each dimension one element, one element renders bare;
  the category element is Prisma's relation filter `{ category: { slug
  } }`, no id mapping needed). The island
  (`admin-product-filters.tsx`) mirrors the payments/orders bars
  (merged params via `router.push` in the CANONICAL order — category,
  q, visibility; the adjust-during-render input sync); the count line
  reports the filtered-of-total ("3 of 12 products" — the products
  list carries no take bound, so no "100+" form); the guided empty
  state offers "Clear all filters". Zero parity risk — admin-only
  surface. Pinned by 18 unit + 5 E2E tests. The a11y admin gate's
  products census pin is UNCHANGED by the island ({color-contrast} × 7
  — re-run green post-change, no recalibration needed).
- **The dashboard surfaces the refund-needed count as an alert stat
  (session-28, DASH-ALERT-1, ADR-036 — the observability graduation):**
  `/admin` (the console's entry point) runs TWO bounded queries — the
  placed-intent input set (orders holding a Stripe intent,
  select-only) + `db.stripeEvent.count` — and composes the count with
  **the SAME seam the payments family filter uses**
  (`buildAdminPaymentWhere({ family: "refund-needed" },
  placedIntentIds)` from `src/lib/admin-payments.ts`): the dashboard
  stat and the payments list can NEVER disagree (a divergent count is
  structurally impossible, not just untested — the seam is the single
  source of both). The presentation contract is the pure
  `refundNeededAlert(count)` (unit-pinned: `{ visible: false }` at 0 —
  the honest calm state, alert fatigue is the failure mode a
  permanent zero-row invites; the singular/plural labels "1 payment
  needs refund attention"/"N payments need…"; the href exactly the
  family Select's own value). The alert row renders between the stat
  grid and Recent Orders (an action item, not a KPI — it does not
  join the 4-card grid) with an ICON-ONLY destructive accent
  (`border-destructive/30` + the triangle chip — NO
  destructive-colored TEXT: it measures ~3.9:1 on the card and would
  grow the admin a11y census's pinned color-contrast count) and a
  "Review payments" outline Button deep-linking to
  `/admin/payments?family=refund-needed`. Only this unit layer pins
  the calm state — the e2e fixture set always counts 1
  (`evt_demo_fixture_n`, deterministically restored per run). Zero
  parity risk — admin-only surface. Pinned by 4 unit + 1 E2E test;
  the a11y admin gate's dashboard census pin UNCHANGED at 8 (re-run
  green post-change, no recalibration).
- **The Stripe-paid order's detail renders its payment-event trail
  (session-29, REFUND-TRAIL-1, ADR-037 — the order side of the payments
  deep link):** `/admin/orders/[id]` for an order holding a
  `stripePaymentIntentId` runs ONE bounded query on the exact linkage
  the payments outcome resolver uses (`db.stripeEvent.findMany({
  where: { paymentIntentId: order.stripePaymentIntentId } }, receivedAt
  asc)) and composes the rows through the pure `orderPaymentTrail` seam
  in `src/lib/admin-payments.ts` (the payments data family — the module
  boundary follows the data, the session-28 dashboard precedent). The
  seam maps each row with `paymentEventLabel` (the operator vocabulary:
  `payment_intent.succeeded` → "Payment captured", `charge.refunded` →
  "Refunded", `payment_intent.payment_failed` → "Payment failed";
  unknown types pass through RAW — the parse family's fall-through
  philosophy) and owns the calm state: an EMPTY set → `{ visible:
  false }` — an order with no Stripe intent renders NO card (also what
  keeps the a11y order-detail census pin at 7: the census page is a
  non-Stripe order). The card sits between Items and the Timeline (the
  two chronological trails read together) with the console's card
  anatomy and the payments surface's row shape — foreground + muted
  text only, NO destructive accent. The seeded ORD-2026-003 ↔
  `pi_demo_fixture_003` ↔ `evt_demo_fixture_s` ($524.97) is the
  deterministic E2E target. Zero parity risk — admin-only surface.
  Pinned by 5 unit + 1 E2E test; the a11y admin gate's order-detail
  census pin UNCHANGED at 7 (re-run green post-change, no
  recalibration).
- **The webhook persists the deterministic-failure REASON on the
  StripeEvent row (session-30, REASON-TRAIL-1, ADR-038 — the
  refund-needed family's WHY):** `StripeEvent.failureReason String?`
  (nullable canonical code — null = no reason known: pre-session-30
  rows, the failed/ignored recordings, the client-path-precedence
  recording, and the SUCCESSFUL in-tx insert, which writes none by
  construction). The webhook's FOUR permanent-classification write
  sites pass their code through `recordEvent(evt, reason)` —
  metadata-unusable / cart-unavailable / amount-mismatch / stock-short
  — the vocabulary exported as `STRIPE_FAILURE_REASON` from
  `src/lib/stripe-payment.ts` (the single source the write side and
  the read side share; no stringly-typed drift). The read side is the
  pure `paymentFailureReasonView(reason)` seam in
  `src/lib/admin-payments.ts`: null → `{ visible: false }` (the honest
  calm state — the refundNeededAlert precedent); the four canonical
  codes → the operator copy ("Reason: amount mismatch vs cart total" /
  "…insufficient stock at placement" / "…payment metadata unusable" /
  "…cart unavailable at placement"); an unknown code → the RAW
  passthrough (the parse family's fall-through philosophy). The
  payments page composes BOTH gates (`outcome.kind ===
  "refund-needed"` AND the view's `visible`) so a placed row can
  structurally never render a reason; the line renders under the
  destructive outcome in the row's OWN muted pair (`text-xs
  text-muted-foreground` — the timestamp vocabulary, zero new color
  pairs: the a11y payments census pin stays 9). NEVER a derivation
  input — the refund-needed family still derives from DB state (type +
  no linked order); the reason column is enrichment, never truth. The
  seeded `evt_demo_fixture_n` carries `failureReason:
  "amount-mismatch"` (the coherent story for a $149.00 succeeded
  intent with NO order), restored idempotently by seed + e2e-reset.
  Zero parity risk — admin-only surface. Pinned by 6 unit + 1
  integration test (the write sites drive the REAL handler with
  HMAC-signed events against the scratch DB) + 1 E2E test (the reason
  line scoped to the fixture row + the calm state: exactly ONE reason
  line on the unfiltered list); the a11y admin gate's payments census
  pin UNCHANGED at 9 (re-run green post-change, no recalibration).
- **The console LIST pages' heading order is valid (session-25,
  A11Y-HEADING-1):** the three console list pages (orders/products/
  payments) each carry an `sr-only` h2 labelling their list region
  ("Orders list" / "Products list" / "Payment event list") — the page's
  heading order is h1 → h2 → (the empty-state h3 / the footer's h3
  columns), resolving the session-24 documented family observation
  (the lone h1 → the footer's h3, best-practice-tagged and outside the
  WCAG `runOnly` set). The a11y admin gate pins the best-practice
  census on the three list pages as EXACTLY EMPTY. The storefront
  pages keep the reference's own heading shape — parity, untouched
  (the reference's a11y tree is the parity trait there).
- **One `<main>` landmark per page (session-7, MAIN-NEST-1; extended session-12):** the admin AND shopper content pages (account, checkout ×2 code paths, checkout/success, wishlist ×2 code paths) wrap their content in `<div className="flex-1">` — NOT `<main>` — because the `(storefront)` layout already renders the `<main>`; a nested pair is invalid HTML, trips axe's landmark rules, and confuses AT landmark navigation. The session-1 originals shipped nested mains on those four routes for eleven rounds — invisible to every computed-style audit because `locator("main")` chains dedupe shared descendants; the axe differential (session-12) exposed them. The inner `flex-1` is layout-inert either way (the parent main is not a flex container).
- **ARIA labels never land on role-less divs (session-12, A11Y-ARIA-1/2).** `aria-label` on a plain `<div>` (role=generic) is prohibited by ARIA 1.2+ (axe `aria-prohibited-attr`): the toast viewport is a NAMELESS `aria-live="polite"` region (a live region announces its content, not its name; the reference's container carries no aria attributes at all), and the PDP star-rating row is `role="img"` + `aria-label="Rated X out of 5"` (the canonical glyph-row pattern — role=img allows naming). Pinned by the storefront-parity spec.
- **Security headers ship in `next.config.ts` `headers()` (session-12, SEC-HEADERS-1):** Referrer-Policy `strict-origin-when-cross-origin`, X-Content-Type-Options `nosniff`, Strict-Transport-Security `max-age=31536000` (the reference's live-measured baseline; HSTS over HTTP is a spec no-op per RFC 6797 §7.2), plus X-Frame-Options `DENY` (superset). CSP deferred (needs nonce plumbing) — SUPERSEDED next bullet by the session-14 nonce pipeline (SEC-CSP-1, ADR-022). Pinned by the smoke spec.
- **Content-Security-Policy ships via the proxy nonce pipeline (session-14, SEC-CSP-1, ADR-022):** `src/proxy.ts` (Next 16's renamed middleware convention — `middleware.ts` is deprecated) mints a per-request nonce, sets the CSP on the REQUEST headers (Next extracts it via `getScriptNonceFromHeader` and nonces every bootstrap/flight script) and the RESPONSE (browser enforcement). Directives are pinned to the codebase's measured footprint: `default-src 'self'`; `script-src 'self' 'nonce-…' 'strict-dynamic'`; `style-src 'self' 'unsafe-inline'` (framework insurance — the app itself ships zero inline styles); `img-src 'self' https://media.base44.com data:` (the sole art/favicon CDN); `font-src 'self'` (the self-hosted woff2); `connect-src 'self'`; `frame-ancestors 'none'`; `object-src/base-uri/form-action 'self'`. **No `upgrade-insecure-requests`** — the app runs on plain-HTTP localhost in dev/E2E and that directive would rewrite same-origin subresources to https. Per-request nonces require per-request rendering: `/register`, `/forgot-password`, and `/reset-password` carry `export const dynamic = "force-dynamic"` (the only static HTML pages; `/_not-found` is unreachable — nothing calls `notFound()`). When Stripe keys are configured the CSP CONDITIONALLY EXPANDS (session-22, in `src/proxy.ts`): `https://js.stripe.com` joins `script-src` and `https://api.stripe.com` joins `connect-src` — the payment Element's iframe/script origins, added only when the feature is on. **DEV MODE carries `'unsafe-eval'` in `script-src` (session-42, CSP-DEV-EVAL-1, ADR-049)** — React's dev builds require eval() for callstack reconstruction; without the token the Turbopack RSC client's `checkEvalAvailabilityOnceDev` probe logs a console error on EVERY dev page load (measured 100% deterministic — 38/38 census routes dirty) and the Next dev-tools "01 Issue" badge paints the bottom-left of every dev viewport. The construction lives in the pure seam `src/lib/csp.ts` (`buildCsp`); production NEVER carries the token (byte-identical to the session-14 pin, negatively pinned in the smoke spec; the standing dev-census battery `scripts/census-dev-session42.mjs` asserts the clean dev console). Pinned by the smoke spec (header + directive census + nonce uniqueness + every SSR script nonced on / and /register + the production no-unsafe-eval negative).
- **The a11y parity profile is regression-pinned by a standing E2E gate (session-15, A11Y-GATE-1, ADR-023):** `tests/e2e/accessibility.spec.ts` injects the SELF-HOSTED axe-core build (pinned `4.14.0` devDependency; `page.addScriptTag` — DevTools-protocol injection, exempt from the page CSP) after a scrolled-reveal pass (content at `opacity: 0` until scrolled is SKIPPED by axe — the session-12 whileInView trap) and asserts (a) the violation census is EXACTLY `{color-contrast}` on home/shop/PDP/cart/account/login — later rounds extended the same gate family in place: the admin QUALITY census (session-16), the auth screens (session-19), the mobile viewport re-assertions (session-16), and the customer order-detail census pin 8 (session-34); any other rule firing (button-name, label, landmarks, aria-prohibited-attr, …) is a REGRESSION against the aria superset / the session-12 fixes; (b) the color-contrast node counts equal the parity pins (28/23/14/8/8/3 — byte-identical to the reference's live-measured counts; the shared parity trait, NOT a defect to fix). Mutation-proven: a re-introduced `aria-label` on the toast viewport fails the gate as `aria-prohibited-attr`.
- **The a11y gate covers BOTH viewports and the admin console (session-16, A11Y-GATE-2, ADR-024):** the same spec carries an `a11y mobile gate` describe (`test.use({ ...devices["iPhone 14"] })` with its `defaultBrowserType` STRIPPED — `test.use` rejects it inside a describe because it forces a new worker; the project's storageState still applies, so the demo user is authed at 390px) pinning the SAME 28/23/14/8/8/3 (the mobile census is byte-identical to the desktop's, live-measured both sites + E2E-calibrated — that identity IS the contract; a viewport divergence is flagged like a drift), and an `a11y admin gate` describe (`adminLogin(browser)` once in `beforeAll`, the admin.spec pattern — 3 admin logins/run stays inside the 10/15min bucket) pinning the QUALITY census {color-contrast} at 8/7/7/7 on the four console surfaces (dashboard/orders/products/order-detail, the detail reached via the `ORD-2026-001` link — the e2e.db cuid is not hardcodable). The structural-blindness rationale: an element hidden at desktop (`lg:hidden`) is `display:none` → axe SKIPS it at 1280×720 → a mobile-only defect passes the desktop gate forever. Dual-mutation-proven: removing the mobile menu button's aria-label fails ONLY the mobile tests (desktop stays green — the proof); removing the eye buttons' aria-labels fails the admin products test (`button-name(12)`).
- **A plain `div` with `aria-label` does NOT trip axe's aria-prohibited-attr (session-16 lesson):** the session-12 defect fired because the toast viewport carries `aria-live="polite"` — aria-label on a LIVE REGION is prohibited ARIA. The same label on a plain role-less div (no aria-live) is NOT flagged by axe 4.14 under the wcag2x tag set. When engineering a mutation for the prohibited-attr class, target a live region (or use the button-name class: any icon-only button whose aria-label is dropped). The eye buttons on the admin product rows are the registered admin-surface mutation target.
- **The axe gate covers the WHOLE auth family (session-19, ADR-027, A11Y-GATE-3; extended session-20):** `tests/e2e/accessibility.spec.ts`'s `a11y auth screens gate` describe pins register / forgot-password / verify-email / reset-password (BOTH states) — ten tests = 5 screen-states × 2 viewports, each in an ANONYMOUS context (the auth screens render standalone for anon visitors; zero rate-limit impact). register + forgot-password carry PARITY pins ({color-contrast} × 2 — the round-19 live differential measured both sites byte-identical at both viewports); verify-email carries a QUALITY pin (× 1 — the reference has NO standalone route: its `/verify-email` renders the client-side platform 404, its verify screen is a state INSIDE the register flow, so the clone's standalone screen is a SUPERSET surface — the admin-gate precedent); reset-password's two states carry PARITY pins ({color-contrast} × 1 at both viewports, both states — the reference's route measured live this round; the with-token state uses the e2e fixture). The counts are viewport-invariant (live-measured + E2E-calibrated identical). Dual-mutation-proven: removing the verify-email collector's `aria-label` fails ONLY the verify-email tests with `label(1)`; the register label-association mutation below fails ONLY the register tests; the reset-password Confirm-Password mutation (htmlFor + placeholder removed, L29-aware) fails ONLY the reset-password (token) tests at both viewports.
- **axe's `label` rule accepts a non-empty PLACEHOLDER as a last-resort name source (session-19 lesson, L29):** the rule's `any` checks include `non-empty-placeholder` — the auth screens' password inputs carry the reference-parity `placeholder="••••••••"`, which MASKS every label-association defect (a removed `<Label htmlFor>` reads as green). Two consequences: (1) mutations in the label-association class on placeholder-carrying inputs must ALSO remove the placeholder or they never bite (the session-19 mutation-2 design revision); (2) the placeholder is the LAST line of name-defense on those inputs — the visible `<Label htmlFor>` association remains the primary contract, but a regression that drops it will NOT be caught by axe while the placeholder survives. Inputs whose ONLY name source is an aria-label (the verify-email collector) have no such mask — those defects surface immediately.
- **`/reset-password` is a REAL parity route — the auth family's fifth member (session-20, ADR-028, RESET-ROUTE-1):** discovered via the reference's OWN sitemap (it lists `/reset-password`, which the clone's catch-all answered with the platform 404). Both states measured live: no token → the "Invalid reset link" screen (triangle-alert icon tile, h1 + sub, the card's explanatory copy, the "Request a new link" → `/forgot-password` link); any token → the "New password" form (lock tile, h1 "New password", sub "Enter your new password below", TWO icon-led h-12 password inputs — `Label htmlFor` "New Password"/"Confirm Password", `••••••••` placeholders, `autocomplete="new-password"` — and the `w-full h-12` "Reset password" button). A bogus token on submit surfaces the tinted error box with "Invalid or expired reset token" (measured); mismatched passwords surface "Passwords do not match" CLIENT-SIDE FIRST (measured: the match check precedes the server's token check). The head set is the static-page pattern with **og:url PRESERVING the token query** (measured: `/reset-password?token=x` → generateMetadata from searchParams — the `/shop?category=x` precedent). The token machinery follows the ADR-010/011 posture: `PasswordResetToken` rows indexed by the token's SHA-256 (the Session-token pattern — **scrypt's per-call random salt makes it unusable as a lookup key**, L31), 30-min TTL, single-use (deleted on success), one active token per user, the reset LINK logged at the `console.info` email seam; a successful reset deletes EVERY session for the user (the standard security behavior — the reference's post-success state is unmeasurable, registered superset) and routes to `/login` (no auto-login). Pinned by `tests/e2e/auth.spec.ts` (4 tests: both states, the error copy, and the full flow — new password works, old fails, sessions die) + the axe gate below. The e2e-reset fixture seeds `resetuser@example.com` (`Reset1234!`) + the deterministic token `reset-fixture-token` (john@example.com untouched — the login rate limit is keyed per IP+email).
- **The SEO layer is regression-pinned by a standing E2E gate (session-20, ADR-028, SEO-GATE-1):** `tests/e2e/seo.spec.ts` pins `/sitemap.xml` (200 + `application/xml`; exactly 17 `<loc>` URLs in the e2e seed = 5 curated static routes with the pinned priorities/changefreqs + ALL 12 active product URLs with `lastmod`) and `/robots.txt` (200 + `text/plain`; the rule block: `User-Agent: *`, `Allow: /`, `Disallow: /admin /account /checkout /api`, the sitemap link). The origin is the documented fallback (`http://localhost:3000` — the E2E server runs with `NEXT_PUBLIC_SITE_URL` unset; pinning the fallback also pins the "set it in production" contract). The SEO superset itself is REGISTERED DIVERGENCE: the reference's platform sitemap lists 10 app routes incl. PRIVATE ones (`/account`, `/checkout`, `/cart`) at 0.8/weekly with ZERO product URLs; the clone's curation is SEO-correct (public routes + every product, private families robots-disallowed). `/reset-password` is NOT added to the sitemap (utility-page curation — forgot-password likewise absent). Quad-mutation-proven: a dropped product URL, a dropped robots rule, and a corrupted JSON-LD price each fail exactly their pin.
- **Structured data ships as JSON-LD data blocks — the SEO superset's missing member (session-20, ADR-028, JSON-LD-1):** Organization + WebSite nodes on home, Product (with `offers.price` as schema.org DECIMAL USD — `product.price / 100`, NOT integer cents — `priceCurrency`, `availability` from live stock, and `aggregateRating` when rating > 0) on the PDP; unknown slugs carry NO Product node. Data blocks (`script[type="application/ld+json"]`) are NON-executable — CSP-exempt per the spec (script-src governs execution), rendering-neutral (display:none, pixel sweep + md5 continuity proven). **Render them OUTSIDE any pinned child list** — the home wrapper div's child list is a parity contract (the session-5 divider test counts exactly 8), so the scripts are fragment siblings, not div children (L30-adjacent: the same placement discipline kept the storefront-parity spec green).
- **Inline `<script>` elements inside a reconciled subtree interact with Radix Presence cleanup — and with Playwright strict-mode locators (session-20 lesson, L30):** the drawer's exit animation leaves its portal CONTENT in the DOM for ~500ms (animationend 137→487ms; a re-animation fires on the /cart hydration commit) — an unscoped `getByRole("link", {name})` matches BOTH the page's link AND the exiting drawer's link when the assertion lands in that window. The behavior is byte-identical to the baseline (measured on both builds); the test's TIMING (what ran before it) decides whether the race fires — assert intent-precisely by scoping to the region (`getByRole("main").getByRole(...)`) on any post-navigation assertion that could race a portal's exit. Bisection discipline when a suite-only failure appears: A/B the SAME spec list (not the whole suite — the pre-sequence IS the timing variable), and remember `reuseExistingServer: true` can serve a stale pre-rebuild build (the L25 :3100 variant).
- **High-entropy tokens are indexed by DETERMINISTIC sha256, never scrypt (session-20 lesson, L31):** a scrypt hash carries a per-call random salt — the same input yields a DIFFERENT digest every call, so `findUnique({ where: { tokenHash: scryptHash(token) } })` can NEVER match a stored row (the live failure: every reset "Invalid or expired reset token"). The codebase convention is `src/lib/auth.ts`'s `tokenHash()` (sha256 hex) for 256-bit random values — deterministic for lookups, infeasible to invert; scrypt stays for LOW-entropy passwords (where the salt defends against dictionary attacks). Mirror the Session pattern for any new token class.
- **The smoke nonce test skips script DATA BLOCKS (session-20 refinement to SEC-CSP-1):** the "every script carries the nonce" assertion skips tags whose `type` is non-executable (e.g. `application/ld+json`) — data blocks never execute (CSP script-src governs execution), cannot kill hydration, and carry no nonce by design. Executable scripts (no type / module / text/javascript) keep the strict pin; the PDP joined the pinned route list (a JSON-LD carrier).
- **The CWV standing gate pins LCP/CLS budgets + LCP-element identity (session-17, ADR-025, PERF-GATE-1):** `tests/e2e/performance.spec.ts` measures home/shop/PDP with PerformanceObservers registered via `page.addInitScript` (PRE-PAINT — post-load registration misses buffered entries; the observers capture the element tag + geometry at ENTRY TIME because a DOM-swap carousel replaces elements), reads after `networkidle` + `document.fonts.ready` + a short settle, and asserts three pin families: LCP ≤ 2500ms (measured 168–460ms under E2E conditions — 6–15x headroom; catches paint-blocking regressions), CLS ≤ 0.03 (measured 0.0006–0.0011; round-13's long-window 0.0213 stays inside — the unsized-media class lands at 0.1+), and LCP-element identity THROUGH SCALE (the largest paint is an IMG at ≥ the calibrated floor: hero 400,000 / card 50,000 / product 200,000 px² — a lazy or broken hero moves the LCP to text, which the floors exclude by scale). The budgets are a QUALITY gate (the reference's slower SPA numbers are not a parity target — same distinction as the admin axe census). Dual-mutation-proven: a `hidden` hero img fails ONLY the identity pin (LCP budget stays green — the budget alone cannot see the defect class); a late-injected 160px banner (900ms post-hydration, the consent-bar/ads class) fails ONLY the CLS pin at 0.104.
- **The CWV gate ALSO runs at the mobile viewport (session-18, ADR-026, PERF-GATE-2):** the same spec's `CWV mobile gate` describe re-asserts the SAME three pin families at `devices["iPhone 14"]` (with `defaultBrowserType` stripped — the A11Y-GATE-2 `test.use` lesson) with MOBILE-scale identity floors (hero 79,000 / card 19,000 / product 85,000 px² — calibrated at the device viewport; the storageState applies, so the demo user is authed at 390px). **`devices["iPhone 14"]` is 390×664, not 844** — the Playwright device viewport is the physical screen MINUS browser chrome; `50vh` resolves to 332px, so the mobile hero paints at 118,856 px². e.size is CSS-pixel area — DPR 3 does NOT multiply it. The mobile gate is triple-mutation-proven: a mobile-only hero-img hide (CSS `@media ≤640px`) fails ONLY the mobile identity pin while ALL desktop tests stay green (the structural-blindness proof — a mobile-only defect passes the desktop gate forever); a late-injected banner fails the mobile CLS pin at 0.2088 (proportionally larger than desktop's 0.1098 — the same 160px is a bigger viewport fraction at 390px); the L27 PDP unsized image fails the mobile CLS pin at 0.3776 while the desktop PDP stays green (the 2-col grid absorbs the growth — the stacked 1-col mobile layout shifts the buy panel 358px).
- **PDP image-container growth is invisible at desktop (session-17 lesson, L27; refined session-18):** the PDP's 2-column grid makes the buy-panel column the taller one — an unsized image container's post-load growth (the classic unsized-media CLS defect) is ABSORBED with zero element movement at ≥1024px. The same defect at mobile (stacked 1-col layout) shifts the whole buy panel — the A11Y-GATE-2 structural-blindness story, now for CLS. The registered mobile-CWV mutation target is the PDP `aspect-square` container + the img's `h-full`. Also measured: the reference AUTH-GATES every route for anonymous visitors (it renders the login screen client-side ON the requested URL) — CWV/pixel differentials must measure AUTHENTICATED state on both sites; round-13's hero-image LCP (1576ms) reproduces only under authentication.
- **The unsized-media CLS defect class is CDN-timing-dependent (session-18 lesson, L28):** a WARM CDN context (a login-first flow warms media.base44.com via the header logo) lets an unreserved image size itself before the first rendered frame → ZERO layout-shift entries (the defect reads as CLS 0.0000 and is invisible); a COLD context (fresh, direct goto — every Playwright per-test context is network-isolated) reliably produced the 0.30+ shift in 3/3 runs, sometimes landing BEFORE FCP — Chrome's raw layout-shift API reports pre-FCP entries (the raw-sum observer catches them; the official field CLS / web-vitals library filters them). Rules: mutation proofs for the CLS pin family prefer the DETERMINISTIC late-injected banner; the PDP container is the TIMING-CONDITIONAL target (deterministic under E2E cold-context conditions); when measuring CLS by hand, cold the context or you may measure nothing.
- **The INP standing gate pins interaction latency (session-21, ADR-029, PERF-GATE-3):** `tests/e2e/performance.spec.ts`'s `INP interaction gate` + `INP mobile gate` describes drive a scripted 5-surface protocol (PDP add-to-cart · PDP wishlist heart · search typing · drawer stepper · carousel next) with TRUSTED Playwright clicks, collect `PerformanceObserver(type "event", buffered, durationThreshold: 0)` entries registered pre-load via `addInitScript`, group by `interactionId`, and assert per-surface INP ≤ 200ms (the Google "good" line; measured 16–72ms — the round-21 differential's architecture-level finding: the clone's SERVER-ACTION mutations paint as fast as the reference's CLIENT-STATE mutations, 16–48ms both sites both viewports). The tests run in GUEST contexts (`storageState` opt-out — the zero-e2e.db-pollution design: the guest cart/wishlist live in the context's cookie token and die with the test; `wishlist.spec` sorts AFTER `performance.spec`, so an authed protocol that toggles the PDP heart would break its count assertions). Dual-mutation-proven: a 400ms synchronous busy-wait in the stepper handler fails ONLY the drawer-stepper tests (432/416ms); the same in the carousel's next handler fails ONLY carousel-next (456/448ms) — everything else green both times. Structural locators (the reference's icon-only buttons are unlabeled — the a11y superset): `header button:has(svg.lucide-search)` / `:has(svg.lucide-shopping-bag)`; the PDP heart = the action row's LAST button; the drawer "+" = `[role="dialog"] div.gap-2 button:has(svg.lucide-plus)`.
- **Synthetic `evaluate(() => el.click())` generates ZERO interaction entries (session-21 lesson, L32):** `interactionId` only attaches to input events dispatched through the browser input pipeline (CDP `Input.dispatchMouseEvent` / trusted keyboard events) — Playwright locator clicks and `keyboard.type` are trusted; a DOM `.click()` from `page.evaluate` is NOT. An INP (or any event-timing) protocol must use trusted clicks; the first round-21 draft measured "0 interactions everywhere" until this was diagnosed. Rule: **when a measurement reads empty, check WHO dispatched the event before suspecting the observer.**
- **The event-timing observer's default durationThreshold hides fast interactions (session-21 lesson, L33):** `observe({type: "event"})` defaults `durationThreshold` to 16ms — sub-16ms interactions NEVER surface as entries. The collector pins `durationThreshold: 0` (the web-vitals-library approach). TS note: the DOM lib's `PerformanceObserverInit` lacks the field — cast the options object. Rule: **any PerformanceObserver protocol must pin its threshold explicitly; the default is a silent filter.**
- **Server processes can outlive their build directory (session-15 lesson):** a standalone server keeps serving after `bun run build` replaces `.next/standalone` — the stale manifest requests chunks whose hashes changed → every `/_next/static/chunks/*.js` 500s → the browser refuses them (CSP MIME check) → hydration dies while SSR still renders. Symptom: `getByLabel` times out on a form whose labels exist in `curl` HTML. In the sandbox `lsof`/`fuser`/`ps` show NO owning PID — find it via `/proc/net/tcp` (port hex → socket inode → scan `/proc/*/fd` for `socket:[inode]`) and `kill` that PID, then reboot the server on the CURRENT build. Also: pick a FRESH port when a stale server can't be killed — the E2E suite takes `E2E_PORT`.
- **Steppers post DELTAS, not absolutes** (ADR-011): the drawer and /cart
  steppers call `adjustQuantity(itemId, ±1)`; the server applies them inside
  `db.$transaction` (`changeQuantityBy`) so rapid clicks each land exactly
  once. The old absolute API lost updates when two clicks raced one
  re-render. Remove is its own action (`removeCartItemAction`).
- **Hero carousel inactive slides are INERT (session-11, A11Y-FOCUS-1).** The clone keeps all 3 slides in the DOM (the documented crossfade divergence); inactive slides carry `aria-hidden` AND `inert` (`src/components/store/hero-carousel.tsx` — both the media slide and the text block). `aria-hidden` alone leaves the inactive slides' CTA links in the TAB ORDER (live-measured: Tab from the active CTA landed on the invisible "Explore"/"Browse" anchors — a WCAG 2.4.3 defect; the reference's DOM-swap has only one CTA at a time). With `inert`, the tab order is exactly the reference's: CTA -> prev -> next -> dots. The auto-advance edge case matches too (a slide going inert while focused blurs to body — the same observable as the reference's DOM removal). Pinned by the storefront-parity spec.
- **The hero slide MEDIA + CTA targets are pinned content contracts (session-26, HERO-DRIFT-1, ADR-034).** The reference site silently regenerated its slide-3 image ("Home & Comfort" now serves `19ea6418a_generated_c69d9eaa.png` — the old `54a27de93…` is now the reference's headphones PRODUCT image) and re-pointed its slide-2/3 CTAs from category-filtered `/shop?category=…` (the session-1 measurements) to plain `/shop` (all three CTAs, live-measured twice per slide, authenticated). The 13-round pixel-sweep band held throughout the drift — computed-style pins are content-agnostic, and NO gate pinned slide images or CTA hrefs; the manual sweep (home 62.07% out-of-band) caught what the gates could not. The round re-pinned the truth: all 3 slide img srcs by hash tail (`7cfe01108…` / `f0ae76854…` / `19ea6418a…`) + all 3 CTA hrefs to `/shop` — the hero-content test reads the crossfade DOM directly (inactive slides are aria-hidden+inert, invisible to role queries, but queryable via DOM traversal). Post-fix the sweep reads home 0% (6 px). **Systemic lesson: reference CONTENT drifts (media, link targets) invisibly to computed-style gates — pin parity-surface content observables, keep the paired pixel sweep in every round's protocol, and when a route goes out-of-band: diff-band-localize, then live-measure BOTH sites before touching code.**
- **The storefront header row is a three-child justify-between contract (session-26, HEADER-DRIFT-1).** Live-measured on the reference at 1024×768: the icon cluster (search/heart/bag/user) is `flex items-center gap-1` (4px gaps — a 156px cluster), which lands the row's justify-between arithmetic at nav x=270 (row 976 − children 660 = 316; half 158); the clone's old `gap-2` (168px cluster) sat the nav 6px left. At 390×664 the reference row carries THREE direct children — the menu button (16–52), the bare logo link (91–179), the icon cluster (218–374) — NOT a (menu+logo) `gap-4` wrapper (the clone's old structure sat the logo 23px left of the reference's on every mobile page). `src/components/store/header.tsx`: the menu Button and the Logo are DIRECT children of the `flex items-center justify-between h-16` row (at desktop the menu is `display:none` — absent from flex layout, so [logo, nav, cluster] is unchanged); the icon cluster is `gap-1`. Pinned by the storefront-parity header-geometry tests: the cluster's computed `column-gap: 4px` + width 156 at 1024, and the three-child distribution (logo x=91 + cluster x=218) at 390 — the mobile row is located via the banner's LUXE logo link (the Main nav is `display:none` at 390, invisible to role queries — the locator lesson).
- **Deliberate divergences (superset behavior, do not "fix"):** the mobile nav auto-closes on navigation (the reference's Sheet stays open — verified live twice, a demo quirk); the hero carousel pauses on hover (the reference keeps cycling — verified live 11s); the Settings tab keeps a Session/Log out card (the reference has NO logout anywhere); the newsletter form shows a real confirmation (the reference's submit is a no-op); `/cart` renders real contents (the reference hardcodes its empty state); the checkout wizard writes real orders (the reference's checkout cannot see its own cart); the reference's WISHLIST is cosmetic (heart toggles fire no network call, its wishlist page never fetches entities and always shows the empty state — the clone's DB-backed wishlist is the superset); shop filters/sort are URL-deep-linkable (the reference's SPA never updates the URL); the drawer keeps aria-labels + disabled-minus (the reference's stepper buttons are unlabeled); the footer's Shop-column links deep-link category filters (the reference's all point at plain `/shop` — its header links DO filter); the toast region is pointer-events-none + a NAMELESS aria-live=polite (the reference's toasts are inert on click AND unlabeled); the toast spring is a CSS approximation; the PDP rating row keeps its labeled role=img (the reference's is unlabeled); the account history rows' order numbers are LINKS to the customer order-detail route (session-34, CUSTOMER-ORDER-DETAIL-1 — the reference's hardcoded rows link nowhere; the `<p>` keeps `font-semibold` and the anchor inherits color/decoration via the preflight, so the resting visual is byte-identical — the zero-visual-delta superset pattern); the customer detail renders the order timeline the operator vocabulary can never leak into (session-35, CUSTOMER-TIMELINE-1 — the reference has no timeline anywhere; the OrderEvent notes carry operator attribution, the customer rows structurally have no note field); the confirmation's "View Orders" deep-links the owner to the placed order's detail while the non-owner paths keep the generic `/account` (session-35, CHECKOUT-DEEPLINK-1 — an href is invisible at rest); X-Frame-Options ships as the superset over the reference's three headers; `/verify-email` is titled "Verify Email | Lumina" (the reference keeps the SPA's stale "Register | Lumina"); verification is env-gated off by default (the reference always gates — no email provider is wired here); the "Continue with Google" buttons are visual-only (the reference's launch a real base44-platform Google OAuth flow — wiring real OAuth needs credentials that don't exist for a self-hosted clone; registered session-5).
- **Server actions are the only mutation seam** (`src/lib/actions/*.ts`): every action Zod-parses input and returns `ActionResult<T>` (`{ ok: true, data } | { ok: false, error: { message, fieldErrors? } }`). Never throw across the boundary.
- Route-handler whitelist: `/api/health`, `/api/search` (typeahead), `/api/newsletter`, `/api/stripe/webhook` (session-22, PAY-STRIPE-1 — Stripe's async delivery channel for payment events; the documented reason: the backstop for a payment captured while the client died between confirm and placement). Adding more needs a reason.
- **Stripe payment is env-gated OFF by default (session-22, PAY-STRIPE-1, ADR-030; hardened session-23, PAY-STRIPE-2, ADR-031).** With no `STRIPE_SECRET_KEY` the checkout renders the reference's EXACT 3-step mock wizard (the resting visual — pixel-sweep-pinned at 0.35% baseline, the checkout/guest-checkout specs unchanged). With real keys, step 2+3 collapse into the one-page "Payment & Review" island (`src/components/checkout/stripe-pay.tsx`): a themed Payment Element (SAQ-A — card data never touches the app; the iframe gets the site tokens via the `appearance` variables — the theme orange #e66b1a, the pinned v3 12px radius, Plus Jakarta Sans), a server-minted PaymentIntent (`createPaymentIntentAction` — amount re-derived from the DB cart, deterministic `cart:total:shippingHash` idempotency key, shipping snapshot in metadata for the webhook), and confirm-then-place (`placeOrderAction` re-RETRIEVES the intent and verifies status/amount/currency OUTSIDE the SQLite tx; `Order.stripePaymentIntentId` UNIQUE = the placement idempotency anchor — a retried submit maps to the already-placed order number via `isIntentAnchorP2002`, which checks the P2002 TARGET so a `number`-race falls to the honest retry copy). The webhook (`/api/stripe/webhook`) verifies the raw-body signature (300s), no-ops when the order exists, and places from the intent metadata on the orphaned-payment path. **The H4d/L9 rule (PAY-STRIPE-2, hard-won in the reference skill): the `StripeEvent` dedup row commits INSIDE the placement transaction** — a TRANSIENT failure (tx error, a P2002 on `number`) rolls it back and answers 500 so Stripe retries and the retry re-places (the session-22 shape — row committed pre-tx + 200 on every failure — permanently orphaned captured payments); DETERMINISTIC failures (amount mismatch, stock-short via the `STOCK_SHORT:` marker) record the event + 200 + the ops refund trail (a retry could never succeed). The failure policy is the `classifyWebhookPlacementError` seam (duplicate | permanent | transient — unit-pinned), and the whole backstop path is integration-pinned (`tests/stripe-webhook.integration.test.ts`: 18 tests driving the REAL route handler with REAL HMAC-signed events against a scratch `db/webhook-test.db` — no network, no keys; includes the H4d recovery proof via Proxy-wrapped real-tx fault injection). The config seam is ONE truth table shared server/client (`src/lib/stripe-config.ts` — client-safe, zero node imports; "set-me" placeholders are NOT configuration, the L16/R8-1 mirror). The pure seams are unit-pinned in `src/lib/stripe-payment.test.ts` (67 tests); the unconfigured contract is E2E-pinned (`tests/e2e/stripe.spec.ts`: parity anchors, ZERO Stripe network traffic incl. a reload under the listener, no operator vocabulary in the DOM, the 400-on-bad-signature webhook). A failed intent mint renders a "Try again" affordance (session-23; unconfigured resting visual untouched). PayPal stays the reference's demo option on both paths (a real provider is a separate integration).
- Client commerce state lives in ONE place: `StoreProvider` (`src/components/store/store-provider.tsx`) — hydrated from the server on layout render, re-derived after every mutation. Totals are always server truth. The provider's state SURVIVES client-side navigation inside the `(storefront)` group — logout must call `setUser(null)` explicitly (the header otherwise keeps the logged-in icon). When a `router.refresh()` delivers fresh `initialCart`/`initialUser`/`initialWishlistIds` props (new object identities from a server layout re-render), the provider re-syncs its state via the adjust-state-during-render pattern (session-5, CHECKOUT-BADGE-1: the header badge previously kept the stale cart count after order placement until a manual reload). The "last seen props" live in STATE, not a ref — the React Compiler `react-hooks/refs` rule forbids ref access during render.
- Adding to cart NEVER opens the cart drawer (reference parity, E2E-pinned) — the badge bumps; the drawer opens only via the header cart button. The drawer item row is reference-exact (E2E-pinned): plain truncated h4 name, bold unit price, gap-2 stepper+trash, right-side line total, border-separated rows, `text-primary` "Free", `font-bold text-lg` total.
- Cart/wishlist identity = cookie token (guest) merged into the user row on login (`src/lib/cart.ts`, `src/lib/wishlist.ts`). Reads never mint rows (a Server Component render cannot set cookies).

## Testing quirks

- Vitest matches `*.test.ts` only; Playwright matches `tests/e2e/*.spec.ts` — no double-pickup.
- Playwright boots the **production standalone server** on port 3100 with the e2e DB. Build before `test:e2e` or the webServer times out.
- The login action is rate-limited (10/15min/IP+email) and the password-reset action 5/15min — that's why `auth.setup.ts` logs in ONCE and saves `tests/e2e/.auth/user.json` as storageState. Don't add per-test logins.
- Register specs do NOT fill a Name field (the reference form has none — the action derives it); register specs must use a fresh random email per run (`e2e-<ts>@example.com`) because the e2e-reset clears only `e2e-*` spec users.
- The stock spec logs in as the seeded ADMIN through a second browser
  context (`adminLogin(browser)` — now shared from `helpers.ts`) — the admin
  email draws from its own rate-limit bucket, so it coexists with the
  demo-user setup login. Its `setStock` helper clicks the admin form's Save
  then WAITS (~800ms + reload) before asserting — the server action +
  `router.refresh()` land asynchronously and a reload that races the write
  reads stale truth.
- **admin.spec.ts (session-7)** shares ONE admin login across the file
  (`beforeAll`) to stay inside the login rate-limit bucket (the stock
  spec's two logins share it). Selector contracts: scope stat-label
  assertions to `div.grid.grid-cols-2` (the header also carries an
  "Orders" link — strict-mode trap); scope order rows via the combobox's
  stable aria-label (`Change status for ORD-2026-001`) +
  `div.rounded-xl` filter, and assert the badge via the row's
  `div.rounded-full` (the Select trigger also displays the status text);
  the status test RESTORES the canonical status afterward. **Run-to-run
  isolation:** `prisma/e2e-reset.ts` now deletes non-canonical orders and
  demo-order `status_changed` events every run — spec-placed orders
  otherwise accumulate across runs (the e2e DB file persists) and push the
  demo fixtures out of the dashboard's take:5 Recent Orders list while
  piling duplicate timeline events (both broke the first accumulation-run
  of this very spec).
- **Client-island hydration races (session-6 lesson, hit twice):** after a
  FULL page load (`page.goto`) of a client-island page (checkout wizard,
  login form), values typed before React hydrates get WIPED by React's
  adoption of the server DOM — the action then never fires or the Continue
  button never enables. Wait for `page.waitForLoadState("networkidle")`
  after `goto` before filling. Also: the checkout wizard REMOUNTS fresh on
  every navigation into `/checkout` (step 1, empty address fields) — specs
  that re-enter checkout must refill the form.
- `guest-cart.spec.ts` and `guest-checkout.spec.ts` opt OUT of storageState (`test.use({ storageState: { cookies: [], origins: [] } })`) — they are the only specs exercising the cookie-token cart path (the latter end-to-end through a guest order placement); every other cart/wishlist/checkout spec runs authenticated.
- **Non-retrying probes race client navigations (session-13 verify-script
  lesson):** `waitForURL` resolves the moment `router.push` updates the
  address bar — the RSC payload (and the re-rendered DOM) lands AFTER it.
  An immediate `isVisible()` check therefore reads the PREVIOUS page
  state. Live-verification scripts must use retrying `expect(…)`
  assertions (same as the specs); `isVisible()` is only safe on
  server-rendered content or after an explicit settle. Same family as the
  paired-pixel-capture rule: client-island routes need networkidle + a
  settle in A/B sweeps (the round-13 account capture measured 22% on a
  mid-hydration frame; the settled re-capture read the 0.34% baseline).
- **Paired-capture host consistency (session-14 lesson, corrects the
  round-13 artifact diagnosis):** cookies do NOT cross hosts —
  `localhost:3000` and `127.0.0.1:3000` are DIFFERENT cookie jars. A
  login performed on localhost followed by a sweep against 127.0.0.1
  silently renders every authed surface as its GUEST state (/account
  guest-gates to /login) — producing the exact 22.08% account pixel-diff
  artifact that round-13 misattributed to a "mid-hydration frame" (the
  byte-stable diff number was the giveaway: a hydration race produces
  frame variance, a guest redirect is deterministic). Rule: **pick ONE
  host for the whole audit lifecycle, and verify `location.pathname` (not
  just a cookie presence) immediately before authed captures.** The
  agent-browser `eval "location.pathname"` output is JSON-quoted
  (`"/login"` ≠ `/login` in shell string comparison — strip the quotes or
  compare against the quoted form).
- The verify-email happy path consumes the seeded `unverified@example.com` fixture (code `123456`); `prisma/e2e-reset.ts` restores its unverified state + code every run, so specs can rely on it.
- Toast specs: assert position only after the enter spring settles (~450ms) and with ±2px tolerance (the reference's own live values oscillate mid-spring); `getByText("… added to cart!")` resolves to the toast ITEM itself — do not climb to the parent (that's the region).
- Drawer specs cannot assert the header badge while the Radix dialog is open (aria-hidden hides it from the role tree) — assert the drawer's own totals instead.
- **Never build with `bunx next build` (session-12 audit lesson):** the repo's
  `bun run build` wrapper is the ONLY correct build — its `cp -r .next/static`
  + `cp -r public` steps populate `.next/standalone`, which the raw
  `next build` does NOT do. Running the raw command regenerates a standalone
  tree whose static chunks all serve the HTML 200 fallback — every
  `/_next/static/chunks/*.js` request returns markup, the browser throws
  `Unexpected token '<'` pageerrors, hydration never lands, and the whole
  E2E suite fails at setup with inputs wiped after fill. The failure mode
  looks like an app bug but is purely a build-artifact one; re-run
  `bun run build` and it disappears.
- Address-tab specs target the card via the `p` chain (`card >> p`), not `getByText("Home")` — the label span was removed for parity.
- Login credentials for dev/E2E: `john@example.com` / `Demo1234!` (demo user, seeded order history) and `admin@luxestore.com` / `Admin1234!` (admin role).
- Selector gotchas baked into the specs: the footer carries an "Email address" input and a "New York, NY 10001" text that collide with naive `getByLabel`/`getByText` — scope to `getByRole("main")`. The auth screens have NO `main` landmark and NO footer (reference parity) — use page-level selectors there, and target the card's error via the box locator `div.mb-4.p-3.rounded-lg` (session-4; the old `p[role=alert]` form is gone). Radix `aria-hidden`s the page chrome while a dialog is open — close drawers before asserting on the header. Specs that inspect drawer contents open it via `openCartDrawer` (helpers.ts). Wishlist-heart specs use STATE-STABLE locators — the aria-label flips "Add … to wishlist" ↔ "Remove … from wishlist" on toggle, so a name anchored to "Add …" stops matching the moment the toggle lands ("element not found" IS the success signal); match `/«Product» (from|to) wishlist/` instead (session-5). PDP action-row assertions scope to `main .flex.items-center.gap-4.mb-4` — the related-products cards below carry their own wishlist/ATC buttons. The post-order header badge asserts `getByRole("button", { name: "Cart", exact: true })` — exact, because "Cart, N items" contains "Cart" (session-5, CHECKOUT-BADGE-1).
- Dev-DB hygiene after live-audit/manual testing: `bun prisma/dev-cleanup.ts` removes stray orders (anything not in the seed's canonical set), test subscribers, wishlist/cart residue, and (session-7) demo-order `status_changed` events + canonical statuses left by live status-transition testing — targeted deletes, NOT `migrate reset` (which would break the sandbox hard-link contract). The seed is upsert-only and never deletes.

## Tailwind v4 trap log (violations here silently break visual parity)

The reference app was built on Tailwind v3; this port runs v4. Pinned in `src/app/globals.css`:

1. **Colors**: theme values must be FULL `hsl(...)` literals under `@theme inline` — bare `H S% L%` triplets resolve to transparent.
2. **`--shadow-sm` is pinned** to v3's `0 1px 2px 0 rgb(0 0 0 / 0.05)` — v4 moved the scale up a notch.
3. **The radius scale is pinned** (`--radius-xl: .75rem; --radius-2xl: 1rem; --radius-3xl: 1.5rem`) — v4 shifted named radii up a notch too (v4 `2xl` = 20px ≠ reference 16px). Measured pins: card `rounded-2xl` = 16px, button `rounded-xl` = 12px, input `rounded-md` = 10px.
4. **Hero overlay uses the arbitrary `bg-[linear-gradient(...)]`** — v4 interpolates `bg-gradient-to-r` in oklab.
5. **Mobile nav stacks links with flex `gap-4`, never `space-y-*`** — a `space-y-*` panel with `mt-*` children renders different heights on v4 (v4's `:where()` drops specificity).
6. Alpha utilities (`bg-background/80`, `border-border/50`) serialize as `lab(...)` in Chrome instead of v3's `rgba(...)` — same paint, different notation. The parity specs accept both.
7. **The slate palette is pinned to v3 hexes** (`--color-slate-50…800` in `@theme inline`) — v4 redefines the palette in oklch and several steps (e.g. slate-300) drift ~3/255 per channel. The reference's platform 404 is built on v3 slate; the pin keeps it byte-identical.
8. **`space-y-*` never carries the spacing of an inline first child (session-8, SPACE-Y-INLINE-1).** v4 emits `:where(.space-y-N > :not(:last-child)) { margin-block-end }` — margin lands on the NON-LAST child, which is INERT when that child is inline (a bare `<label>`); v3 emitted `margin-top` on FOLLOWING siblings (block-level — always effective). The auth forms lost 8px per `Label + input-wrapper` field. The fix pattern: keep `space-y-2` on the wrapper (DOM parity) and give the block input wrapper `mt-2` (computed parity — the reference's input wrapper measures `margin-top: 8px`). Same engine rule, second face (SPACE-TABS-1): a Tabs root with `space-y-6` + TabsContent `mt-2` renders 24+8=32px on v4 vs v3's 24px (v3's higher-specificity selector REPLACED the panel's own margin instead of stacking) — the account Tabs therefore carries NO `space-y-*`; its TabsContent base `mt-6` supplies the reference's 24px gap alone (margins against an `inline-flex` TabsList do not collapse). Third face (ACCOUNT-BTN-1, superseded by trap 9): session-8 integrated the Save button INTO the fields grid (`gap-4` spacing, `mt-4` forbidden) — desktop computed parity that broke on mobile; session-9 restored the reference's actual anatomy (button OUTSIDE the grid with `mt-4`, see trap 9). `space-y-reverse` is used nowhere and unsupported by these pins.
9. **Grid items STRETCH by default — `sm:w-fit` masks mobile drift (session-9, ACCOUNT-BTN-W-1).** A button placed as a child of `grid grid-cols-1 sm:grid-cols-2` renders full-width below 640px even with `sm:col-span-2 sm:w-fit` (the arbitrary width only engages at ≥640px), and grid `gap-4` can coincide with the reference's flow spacing on desktop — session-8's desktop-only audit passed while mobile measured 308px vs the reference's 127px. The reference's anatomy is the button OUTSIDE the grid as a flow child carrying `mt-4` (fit-content on EVERY viewport). Rule: **audit mobile viewports separately — desktop computed parity does not transitively prove mobile parity.** Pinned by the account mobile describe in `account.spec.ts`.
10. **A base `leading-*` utility beats responsive `text-*` line-heights on v4 (session-10, HERO-LH-1).** The hero h1's class string is byte-identical on both sites (`…text-3xl sm:text-4xl lg:text-5xl… leading-tight`), but v3 emits responsive variants in media layers AFTER base utilities, so `sm:text-4xl`/`lg:text-5xl` re-override `leading-tight` with their own line-heights (40px / 48px) at ≥640/≥1024; v4's sort order lets the base `leading-tight` (1.25 → 45/60px) win at EVERY width. The hero h1 carries `sm:leading-[2.5rem] lg:leading-none` to pin the v3 cascade values (the same engine class as trap 8 — identical classes, different cascade). Rule: **whenever a base `leading-*` coexists with responsive `text-*` sizes, pin the responsive line-heights explicitly.** Pinned by the storefront-parity spec (37.5/40/48px at 630/768/1024).
11. **v4.3 gates every hover-family variant behind `@media (hover: hover)` (session-10, HOVER-GATE-1).** The default `hover` variant is registered (Tailwind `dist/lib.mjs`) as `["&:hover", ["@media", "(hover: hover)", …]]` — plain `hover:*`, `group-hover:*` and breakpoint compounds all become inert in touch/hybrid contexts where `(hover: hover)` fails, while the v3-built reference renders its hover effects whenever `:hover` matches (live-measured both ways: ref nav link → foreground + card img scale(1.05) + primary title with the media query false; a gated build renders none of it). `globals.css` overrides it with `@custom-variant hover (&:hover);` — one line restores v3 semantics for the whole family (the `group-hover` compound composes on top of it, keeping v4's own `:is(:where(.group):hover *)` selector shape). The gate is INVISIBLE to desktop-only audits (the media matches with a mouse) — that is how nine rounds missed it. Rule: **audit interaction states in a touch-emulated context; never re-add the gate.** Note: v4's `scale-*` sets the CSS **`scale` property** (not `transform`) — parity assertions on hovered cards read `getComputedStyle(img).scale` ("1.05"), not `transform`. Pinned by the storefront-parity touch-context spec.
12. **The shadcn v4 starter's body `antialiased` is a typography divergence (session-11, FONT-SMOOTH-1).** The starter globals.css/layout ship `-webkit-font-smoothing: antialiased` (grayscale AA); the reference computes `auto` (subpixel LCD AA — darker text strokes). Invisible to content/computed-font censuses (family/fs/fw identical) and to HEADLESS pixel diffs (headless Chromium can't do subpixel AA — both settings render the same there — it only manifests in real browsers). Rule: **headless screenshots cannot validate font-smoothing parity; assert the computed property, and watch starter-template defaults that the reference's template doesn't carry.** Pinned by the storefront-parity smoothing spec (body computes `auto`, zero `antialiased` rules in the served CSS).
13. **next/font's repackaged woff2 rasterizes differently than the file it downloaded (session-11, FONT-FILE-1).** next/font subsets/repackages Google's woff2 and STRIPS the `prep` table (the TrueType hinting pre-program): advances, outlines, kerning, gvar all stay byte-identical, but glyph rasterization changes — a halo on every letter (VLM-verified), 1-4.8% text-band pixel diffs on every route, and canvas measureText 1013px vs the reference's 1009px for the same string. Fix: the site font is a self-hosted copy of the reference's EXACT Google-served file (`public/fonts/plus-jakarta-sans.woff2`, md5-pinned, declared as a plain `@font-face { font-family: "Plus Jakarta Sans"; font-weight: 200 800; src: url("/fonts/…") }` in globals.css); the next/font import/variable is GONE (`--font-sans: "Plus Jakarta Sans", sans-serif` — the reference's exact stack, no "Fallback" companion face). Pixel diffs collapsed to 0.23-0.60% (the session-10 baseline). Rule: **font parity is FILE parity — if the reference serves a font file, self-host that exact file; never trust a repackaging pipeline to preserve rasterization.** Pinned by the storefront-parity font spec (faces/stack/canvas-width/byte-length).
14. **`@stripe/stripe-js`'s DEFAULT entry eagerly injects js.stripe.com on EVERY page that bundles it (session-22, L34, PAY-STRIPE-1).** The default module (`dist/index.mjs`) runs `Promise.resolve().then(() => getStripePromise())` AT MODULE SCOPE — importing `loadStripe` from "@stripe/stripe-js" fires a third-party request to `js.stripe.com/<release-train>/stripe.js` (v10's train = `endive`) on the FIRST page whose client bundle evaluates the module, unconfigured or not (measured live: the script tag in /checkout's DOM pre-hydration-step). The `/pure` entry (`@stripe/stripe-js/pure`) is the LAZY loader — it fetches ONLY when `loadStripe(pk)` is actually called. Rule: **client-bundled SDK loaders must use the /pure entry (or an equivalent lazy form) whenever the feature is env-gated — an eager default entry turns "off" into a lie (network-wise) on every parity surface.** Detection discipline: the request listener must be attached BEFORE the navigation that loads the island chunk (the E2E "zero Stripe traffic" test reloads under the listener — a plain flow from a beforeEach-loaded page reads false-green). Pinned by `tests/e2e/stripe.spec.ts`.

- **Guest order confirmations are token-gated (session-31, GUEST-TOKEN-1,
  ADR-039).** A sequential, guessable public id (`ORD-YYYY-NNN`) is NEVER a
  sufficient capability token for reading PII: `/checkout/success` renders
  details only for the signed-in owner or the holder of the HMAC view token
  the placement redirect carries (`?order=X&t=…` — `src/lib/order-view-token.ts`,
  domain-separated, keyed by `AUTH_SECRET`, constant-time compare). The
  pre-fix gate (`!order.userId`) leaked every guest order's email/items/
  total to any visitor walking the number space — a live-verified exploit
  (`scripts/guest-order-enumeration-probe.mjs`). The action returns the
  token at BOTH success sites (the happy path AND the P2002 already-placed
  resolution — a retried guest submit must still render its confirmation).
  The same discipline applies to ANY future "view by public id" surface:
  sequential ids need a per-row secret or an ownership check.
- **The refund loop closes in-app (session-32, REFUND-ACTION-1, ADR-040).**
  Two halves, one contract: (a) `refundOrderAction`
  (`src/lib/actions/admin.ts`) — the console's first money ACTION: an
  admin-gated, eligibility-guarded refund of a Stripe-paid order
  (`stripe.refunds.create` with the intent-scoped idempotency key
  `refund:<intentId>` — one full refund per intent, replay-safe); demo
  mode (no keys) refuses with the honest operator copy ("Stripe is not
  configured — refund via the Stripe dashboard."). The RENDER GATE and
  the ACTION GUARD compose the SAME pure seam — `refundEligibility` in
  `src/lib/admin-payments.ts` (intent + `paymentStatus === "paid"`;
  fulfillment status is orthogonal — a cancelled-but-paid order is
  exactly the refund case) — the DASH-ALERT-1 shared-seam rule. (b) The
  webhook's `charge.refunded` branch (`api/stripe/webhook/route.ts`) is
  the SINGLE WRITER of refund state on the order: after the eventId
  fast-path dedup, a FULL refund (Stripe's `refunded` boolean) commits
  the dedup row + `paymentStatus: "refunded"` + a first-class
  `payment_refunded` OrderEvent in ONE transaction (the H4d/L9 rule
  applied to the reflection — a row committed before a failed reflection
  would orphan the delivery); a PARTIAL refund writes the timeline note
  only; no linked order (or a non-paid order) records standalone —
  today's behavior. The action NEVER writes refund state (no optimistic
  local truth — the webhook's delivery is the truth). The order detail's
  Refund control is a two-step inline confirm (the GitHub
  destructive-action pattern — no dialog dependency) with the
  ICON-ONLY destructive accent (`border-destructive/30` + RotateCcw —
  no destructive TEXT, the ~3.9:1 census lesson); the refunded Charge
  branch renders "Refunded (Stripe)" in muted (the census page
  ORD-2026-001 carries `paymentStatus: null` — the row, the button, and
  the branch never render there; the a11y order-detail census pin stays
  7 by construction). Pinned by 15 unit (eligibility ×5 + reflection ×5
  + key ×3 + schema ×2) + 4 integration (full/reflection, re-delivery,
  orphan, partial — the real handler, HMAC-signed) + 2 E2E (the
  two-step confirm + demo refusal; the no-intent calm state).
- **The money state is mirrored onto the CUSTOMER surfaces (session-33,
  CUSTOMER-MONEY-1, ADR-041).** The payments family built every operator
  surface for the refund state; the customer half composes ONE pure seam
  module — `src/lib/order-money-state.ts` (Prisma-free;
  `formatCents` from `./money` is a pure-to-pure import, the
  admin-payments precedent): (a) the account order-history row renders
  `orderRefundLineView(paymentStatus, totalCents)` — visible ONLY on
  `paymentStatus === "refunded"` ("Refunded · $X returned"; a full
  refund — partials keep `paid`, so the state implies the amount), a
  muted `text-sm text-muted-foreground` line under the date in the
  row's left block; history NEVER shows a paid line (every order in
  history was paid — a permanent paid line is noise, the DASH-ALERT-1
  alert-fatigue lesson) and non-refunded rows keep the reference's exact
  anatomy (the calm state — `{ visible: false }` renders no DOM delta);
  (b) the checkout confirmation composes
  `confirmationMoneyLineView(paymentStatus)` — the paid wording
  byte-exact from session-22 ("Payment received — charged by Stripe."),
  the refunded state carrying the customer-safe copy ("Payment refunded
  — the amount has been returned to your original payment method." —
  the R10-2 rule: no operator vocabulary); the confirmation-sent line's
  mb rhythm keys off the line's visibility. The E2E fixture:
  `ORD-2026-004` (john's fourth order — 1× Ceramic Planter Set $79.99
  matching `evt_demo_fixture_r`'s amount exactly, status `cancelled`
  (the refundEligibility design's own example in its post-refund resting
  state), `paymentStatus "refunded"` + intent `pi_demo_fixture_005`
  linking the EXISTING evt_demo_fixture_r — its orphan story graduated
  to the linked shape; the payments surface's row is unaffected
  (charge.refunded stays "Ignored", the four-event set and every count
  pin unchanged), placedAt 18 minutes before the refund event's
  receivedAt, and a `payment_refunded` OrderEvent (the reflection's
  note format) — restored idempotently by the seed's paid-columns update
  pattern + the e2e-reset/dev-cleanup guards. The admin orders count
  line moved to "4 orders" (the delivered/in_transit filter pins
  unchanged — 004 is cancelled). Pinned by 9 unit + 2 E2E (the history
  line + the calm rows; the refunded confirmation + the
  branch-exclusivity no-paid-vocabulary pin), triple-mutation-proven.
- **The customer order-detail read surface (session-34,
  CUSTOMER-ORDER-DETAIL-1, ADR-042).** The customer's per-order view is
  `/account/orders/[id]` — the DATABASE id (the admin-detail convention;
  never the public number), a server page in the `(storefront)` group
  (the full chrome, the single-`<main>` contract, `dynamic =
  "force-dynamic"`), `pageMetadata({ title: "Order Details", path:
  "/account" })` + `robots: { index: false, follow: false }` (the
  CHECKOUT-SEO-1 belt-and-suspenders — the robots.txt `/account`
  disallow covers it; a disallow cannot prevent indexing of linked
  URLs). **The gate is the GUEST-TOKEN-1 discipline**: anonymous → the
  REDIRECT-1 pattern carrying the exact path; a signed-in non-owner, an
  unknown id, and a guest order (`userId` null — its confirmation
  carries the HMAC view token) ALL render the same generic in-chrome
  "Order not found" block — existence is never confirmed to a
  non-owner, and the platform 404 stays reserved for unknown routes.
  The read surface is the customer-safe subset of the operator detail
  (ADR-015) in the account family's design language: the header (the
  ghost "← Orders" back link, the number h1, the STATUS pill, the
  total), the Payment card (`Card ···· 4242` + the placed date + the
  money state through `confirmationMoneyLineView` — the per-order read
  vocabulary: the paid wording byte-exact from session-22, the refunded
  copy customer-safe, demo-path null → nothing), the Shipping Address
  card (the parsed JSON snapshot), and the Items card (the snapshot rows
  + the Subtotal/Shipping/Total block). NO OrderEvent timeline — the
  events carry operator attribution ("by admin" — the R10-2 rule). The
  status vocabulary lives in `src/lib/order-status.ts` (the seam
  extraction: `STATUS_STYLES`/`STATUS_LABELS` were module-level consts
  in the `"use client"` account-tabs — plain-object exports of a client
  module are CLIENT REFERENCES, not importable values from server
  components; the pure seam lets both consumers share one source — the
  module boundary follows the data) + `formatOrderDate` (the account
  family's short date — E2E-pinned via both consumers; NOT unit-pinned
  to a calendar day: a fixed UTC instant renders different local days
  under different runner TZs). The affordance: the history rows' order
  numbers are `<Link>`s to the route (the admin-console precedent —
  "order numbers link to it") — the `<p>` KEEPS `font-semibold` and the
  anchor inherits color/decoration via the Tailwind v4 preflight
  (`a { color: inherit; text-decoration: inherit }`), so the resting
  visual is byte-identical (the zero-visual-delta superset pattern, the
  footer-deep-link precedent). Pinned by 7 unit (the seam: the
  delivered primary-variant + shadow class string, the
  secondary-variant trio, the four labels, the unknown-status
  fall-through, the date shape) + 6 E2E (the link + the URL shape, the
  full read surface + the calm money state, the refunded detail, the
  owner gate via a second-context admin login, the anonymous redirect
  with intent, the a11y QUALITY census {color-contrast} × 8 on the new
  route), triple-mutation-proven (the gate inversion caught at E2E ×4;
  the weakened seam caught at unit AND the session-9 anatomy E2E — the
  seam feeds the history pills too; the consumer's drifted money copy
  caught by the exact-text pin).
- **The customer-safe order timeline + the confirmation deep-link
  (session-35, CUSTOMER-TIMELINE-1 / CHECKOUT-DEEPLINK-1, ADR-043).**
  The order's STORY now renders for the customer through the
  operator→customer vocabulary mapping seam `src/lib/order-timeline.ts`:
  `customerOrderTimeline(events)` maps OrderEvent rows to `{ key, type,
  label, at }` — `placed` → "Order placed"; `status_changed` → the note
  parsed the parse-family way (`"{old} → {new} by {actor}"` → the new
  status slug → composed through the session-34 `STATUS_LABELS` seam →
  "Status updated to In Transit"; malformed/null notes fall through to
  "Status updated"); `payment_succeeded` → "Payment received"
  (session-22's wording); `payment_failed` → "Payment failed";
  `payment_refunded` → "Payment refunded"; unknown types → the raw type
  (the `paymentEventLabel` raw-passthrough precedent). **The operator note
  is STRUCTURALLY absent from the row type — the leak is impossible, not
  filtered** (R10-2: the notes carry "by admin@…" attribution and
  operator vocabulary; the admin detail renders them under ADR-015, the
  customer detail never does). The Timeline card renders on
  `/account/orders/[id]` after the Items card (the account family's card
  language over the admin's `<ol>` row anatomy; the icons are
  presentation — Package/Truck/CreditCard/RotateCcw/History default);
  `formatTimelineDate(iso)` (the admin detail's exact en-US shape — the
  two inline admin copies refactored to the seam, zero behavior delta)
  renders the timestamps. The SEED carries the fixtures: status_changed
  events with the admin action's EXACT note format (the attribution is
  the point — the E2E pins the no-leak property against real notes),
  deterministic ids (`evt-ord1-transit`, …) preserved across e2e-reset
  by the FIXTURE_EVENT_IDS pattern (`SEEDED_ORDER_EVENT_IDS` — the
  combobox spec's per-run events are wiped, the canonical story survives
  every reset), and the placed events' `createdAt` converged to
  `placedAt` (pre-session-35 dbs carried seed-time stamps that sorted the
  placed row AFTER the transitions — the convergence block is
  idempotent, the session-33 restore-columns precedent). The companion
  affordance: the confirmation's "View Orders" deep-links to
  `/account/orders/${order.id}` for the OWNER only — the guest token
  view and the generic view keep `/account` (a guest order's detail
  route renders the not-found block for everyone but the token, the
  GUEST-TOKEN-1 discipline; the href is the only delta — the
  zero-visual-delta superset pattern). Pinned by 17 unit (the six
  canonical labels, the unknown-status raw passthrough, the malformed /
  null-note fall-throughs, the unknown-type passthrough, the asc
  ordering, the key/at passthrough, the structural no-note pin, the
  `formatTimelineDate` shape) + 4 E2E (the 001 timeline + the no-leak
  pins, the 004 money-story order, the owner's deep-linked
  confirmation, the non-owner href guard — the guard is green before
  AND after by design: it catches the deep-link leaking to the
  non-owner paths), triple-mutation-proven (the consumer bypass caught
  at E2E ×2 — the seam's unit pins stay green because the SEAM is
  unmolested, the consumer is the defect; the STATUS_LABELS composition
  caught at unit ×3 AND E2E ×2; the reverted deep-link caught at E2E,
  the guard holding the inverse). The lint contract restored to 0/0
  (the round-34 capture script's unused expression → a statement).

- **The order tracking affordance — "where's my order?" (session-36,
  ORDER-TRACKING-1, ADR-044).** The customer order-surfaces arc
  (ADR-041 money → ADR-042 detail → ADR-043 timeline) rendered the
  order's money state, resting state, and story — but "Status updated
  to In Transit" stranded the customer at words with no actionable
  answer. The schema gains `Order.carrier String?` +
  `Order.trackingNumber String?` (additive nullable columns — the
  paymentStatus precedent; null = not set = the calm state): the
  columns are the order's RESTING tracking state (rendered from the
  row like `cardLast4`, NEVER derived from events). The pure seam
  `orderTrackingView(carrier, trackingNumber)` in
  `src/lib/order-tracking.ts` (a discriminated union — the
  order-money-state precedent: the calm state carries NO fields)
  composes the read row: the canonical carrier map (`ups | fedex |
  usps | dhl` → the label + the public tracking URL with the code
  `encodeURIComponent`-substituted), a case-insensitive +
  whitespace-trimmed key match ("UPS"/"ups"/" ups " link identically),
  an UNKNOWN carrier → the raw label + `href: null` (the raw
  passthrough — the number still renders, just not linked), null /
  empty / whitespace in EITHER field → `{ visible: false }`. The write
  path is `setOrderTrackingAction` (`src/lib/actions/admin.ts`):
  admin-gated, `trackingSchema`-validated (carrier trim 1–40, number
  trim 4–64 — every major carrier's shape), the no-op guard (the
  IDENTICAL pair is ok with NO event write — the status-action
  precedent), overwrite semantics (a different pair replaces the
  columns and appends the event — corrections are auditable), and the
  `tracking_added` OrderEvent whose note carries the operator
  attribution ("«carrier» «number» set by «actor»" — the console
  renders it, the customer timeline NEVER does). The timeline seam
  maps `tracking_added` → "Tracking added" (the note structurally
  absent from the row type — R10-2); the customer detail's icon map
  uses `PackageCheck`. The SURFACES: the admin detail's Shipping card
  gains the "Current: …" read row + the `AdminTrackingForm` island
  (carrier + tracking-number inputs + "Save tracking" — the stock-form
  anatomy, pre-filled with the current columns); the customer detail's
  Shipping card gains the Tracking line ("«carrier» · «number»", the
  number an external anchor `target="_blank"
  rel="noopener noreferrer"` in `text-primary` when the href composes,
  plain text for unknown carriers; the calm state renders NOTHING —
  the alert-fatigue rule). The fixtures: ORD-2026-002 (in-transit)
  carries `UPS` + `1Z999AA10123456784` + the `evt-ord2-tracking`
  event (deterministic id, preserved by the e2e-reset's
  `SEEDED_ORDER_EVENT_IDS` + `tracking_added` joining the wiped types;
  the seed's convergence update restores the columns the paid-columns
  way; ORD-2026-003's per-run admin-E2E write is cleared by the
  reset). Zero parity risk — every touched surface is superset-only.
  Pinned by 12 unit (the seam: the four canonical URLs, the encoded
  substitution, the case-insensitive trim match, the raw passthrough,
  the pair contract, the calm states; the timeline's tracking_added
  label) + 2 E2E (the admin write → the read row + the attributed
  timeline event; the customer tracking line + the UPS href + the
  3-row story + the no-leak pin + the ORD-2026-001 calm state),
  triple-mutation-proven (M1 the href composition dropped → unit ×6
  AND the E2E anchor pin; M2 the consumer's calm-state gate broken →
  the E2E calm pin while the seam's unit pins stay green — the
  consumer is the defect; M3 the timeline case dropped → the unit pin
  AND the E2E label pin).
- **The customer-facing delivery estimate (session-37, DELIVERY-WINDOW-1,
  ADR-045):** the order-surfaces arc answered "where is it" (session-36's
  tracking link) but never stated the PROMISE — "when will it arrive?"
  had no in-app answer: the confirmation ended at "Order Confirmed", the
  detail's header ended at the status pill. The estimate composes from
  `Order.status` + `Order.placedAt` ONLY (no schema change, no fixtures —
  the session-71 framing). The pure seam is `src/lib/delivery-window.ts`
  (`deliveryWindowView(status, placedAt)` — a discriminated union, the
  calm branch carries NO fields): the standard-shipping window
  `placedAt + 3` to `+ 7` calendar days (`DELIVERY_WINDOW_MIN_DAYS = 3` /
  `DELIVERY_WINDOW_MAX_DAYS = 7`, exported + unit-pinned — the
  FLAT_SHIPPING_CENTS precedent: the quoted bounds ARE the contract);
  visible ONLY for the promise states (`processing`, `in_transit`);
  `delivered` → calm (delivered IS the answer — a past window is noise),
  `cancelled` → calm (no promise — the alert-fatigue rule), unknown →
  calm (the parse-family fallthrough). **The date math is
  UTC-deterministic** (`timeZone: "UTC"` in every format call): a fixed
  instant renders the same window on any runner TZ (the formatOrderDate
  lesson — the worker TZ is not a contract), so the unit layer pins
  exact strings AND the E2E pins the seeded fixture's window exactly.
  The format is the professional compressed window — same-month
  "Mar 18 – 22, 2026", cross-month "Mar 31 – Apr 4, 2026", cross-year
  "Dec 31, 2026 – Jan 4, 2027" (both years when they differ). The two
  surfaces: the customer detail's header block (the estimate line UNDER
  the order number/status row — the Amazon pattern; the header row moves
  inside a `mb-8` wrapper so the CALM state renders byte-identically to
  the pre-session-37 layout) and the confirmation's muted line stack
  (the estimate — WHEN — before the money line — HOW MUCH; the mb
  rhythm composes off which lines render, the session-33
  refunded-confirmation rendering preserved byte-exactly). The admin
  console is untouched (the estimate is a customer promise, not operator
  data). Zero parity risk — both surfaces are superset-only. Pinned by
  8 unit (the calm states ×3, the two promise states, the cross-month +
  cross-year formats, the bounds constants) + 2 E2E (the ORD-2026-002
  exact window + the 001/004 calm states; the fresh confirmation's
  prefix + date SHAPE — the moving-date honesty, a fresh order's
  placedAt is NOW), triple-mutation-proven (M1 the seam's MAX bound
  mutated 7→5 → unit ×5 AND the E2E exact pin, the artifact rebuilt for
  the E2E proof; M2 the detail's calm gate broken → the E2E calm pins
  with the seam's unit pins green — the consumer is the defect; M3 the
  confirmation's line dropped → the checkout E2E while both other
  layers stay green — the second consumer is the defect).
- **The business-day delivery window (session-38, DELIVERY-WINDOW-2,
  ADR-046):** the session-37 window counted CALENDAR days — on the seeded
  fixture itself the amateur form was visible: ORD-2026-002 (placed
  Sunday 2026-03-15) quoted "Mar 18 – 22, 2026", a max bound ON A SUNDAY,
  a day the standard carrier tier does not deliver. Every high-end store
  quotes business days (the Amazon/Shopify form: "3-7 business days")
  because the carrier SLA is Mon–Fri. The refinement is contained to the
  seam (`src/lib/delivery-window.ts`) — the ONLY production change of the
  round; both surfaces (`/account/orders/[id]`, `/checkout/success`) call
  `deliveryWindowView` unchanged (zero consumer churn, zero schema
  change, zero fixtures — the lightest refinement form). The math:
  `addBusinessDays(placedAt, n)` steps forward in fixed 24h UTC
  increments counting Mon–Fri days (`isBusinessDay` — UTC weekday 1–5;
  UTC has no DST, so the weekday a step lands on is exact — the
  UTC-determinism discipline extends to the stepper); `from =
  addBusinessDays(placedAt, 3)`, `to = addBusinessDays(placedAt, 7)`.
  Holidays deliberately NOT modeled (jurisdiction-specific; the standard
  store quote is Mon–Fri — documented in the seam). The constants are
  renamed for honesty: `DELIVERY_WINDOW_MIN_BUSINESS_DAYS = 3` /
  `DELIVERY_WINDOW_MAX_BUSINESS_DAYS = 7` (the old `*_DAYS` names would
  mislead the next reader — the tdd skill's REFACTOR step: green,
  behavior-neutral, the full unit layer re-run). The verified windows:
  ORD-2026-002 (Sunday-placed) → "Mar 18 – 24, 2026"; the Saturday
  instant → "Apr 1 – 7, 2026" (the format branch moves to same-month);
  the Monday cross-year instant → "Dec 31, 2026 – Jan 6, 2027"; a
  Friday placement → "Mar 25 – 31, 2026" (the tightest interaction —
  both bounds straddle TWO weekends). The seeded-story coherence holds
  in the honest unit: ORD-2026-001 placed Sat 2026-03-28, delivered Thu
  2026-04-02 = 4 business days — inside the window. The unit layer adds
  the never-a-weekend-bound PROPERTY pin (a 14-placement-day sweep,
  parsing the seam's three text formats back into UTC dates, asserting
  both bounds' weekday ∈ Mon–Fri — the guard against off-by-one
  regressions across ALL placements, not just the chosen instants).
  Zero parity risk — doubly superset-only (the reference carries NO
  estimate on ANY surface: verified live this round — the reference PDP
  has no delivery date, the reference orders link nowhere, the
  reference confirmation is the mock). Pinned by 10 unit (the calm ×3,
  the promise states' 5 exact windows, the property pin, the bounds
  constants) + the 2 E2E (the ORD-2026-002 exact window updated to
  "Mar 18 – 24, 2026" + the calm states; the confirmation's SHAPE pin
  — unchanged, the moving-date honesty), triple-mutation-proven (M1
  the regression-to-calendar mutation — the weekend check dropped from
  the stepper → unit ×6 AND the E2E exact pin at both layers; M2 the
  MAX bound mutated 7→5 → unit ×6 AND the E2E ("Mar 18 – 20"), the
  artifact rebuilt; M3 the MIN bound mutated 3→2 → unit ×6 AND the E2E
  ("Mar 17 – 24"), the artifact rebuilt).
- **The carrier-holiday delivery window (session-39, DELIVERY-WINDOW-3,
  ADR-047):** the session-38 window counted Mon–Fri but was holiday-blind
  — on the 2026 calendar itself a Fri 2026-12-18 placement's +7 bound IS
  Christmas Day, and a Fri 2026-11-20 placement's +7 bound IS
  Thanksgiving; the independent full-year oracle counts 10 placements of
  2026 whose window lands a bound on a carrier holiday. The refinement
  makes the quote the honest carrier-aware form. THE STORE-CONFIG
  DECISION (the candidate's open question, made and documented in the
  seam): the store's implicit jurisdiction is the US (USD prices, the
  $9.99 flat US shipping tier, the State/ZIP address form), so the
  calendar is the standard US carrier set — the SIX dates New Year's Day
  (Jan 1), Memorial Day (last Monday of May), Independence Day (Jul 4),
  Labor Day (first Monday of September), Thanksgiving (4th Thursday of
  November), Christmas Day (Dec 25) — the UPS/FedEx ground-tier
  no-delivery set, NOT the USPS retail-closure set (MLK/Presidents'/
  Columbus/Veterans/Juneteenth are post-office closures the standard
  carriers deliver). EXACT-DATE POLICY: a fixed-date holiday falling on
  a weekend is already skipped by the weekday rule — no observed-day
  shift (Jul 4, 2026 is a Saturday; the standard carriers run normal
  Friday service — pinned by the Jul-4 policy pin, green through RED and
  GREEN, which an observed-day model would fail). The implementation is
  contained to the seam (`src/lib/delivery-window.ts` — the ONLY
  production change): `carrierHolidaysForYear(year)` (exported — the
  six-date table as `{ name, iso }[]`, UTC calendar arithmetic, the
  pinned contract), `isDeliverableDay = isBusinessDay &&
  !isCarrierHoliday` (the stepper's counting predicate — the honest
  `addDeliverableDays` rename landed WITH the behavior change), the
  per-step year resolution (a window crossing Dec 31 picks up the next
  year's table — pinned by the double-holiday pin: placed Tue
  2026-12-22 → "Dec 28, 2026 – Jan 4, 2027", crossing BOTH Christmas
  and New Year's). The unit layer pins: the 2026 + 2027 table oracles
  (HAND-COMPUTED expected values — never derive the expectations from
  the seam's own calendar), per-holiday exact windows (Thanksgiving week
  → "Nov 30 – Dec 4, 2026"; Christmas week → "Dec 24 – 31, 2026";
  Memorial Day → "May 27 – Jun 2, 2026" — also the cross-month
  exact-string pin; Labor Day → "Sep 9 – 15, 2026"), the UPDATED
  cross-year pin (placed Mon 2026-12-28 → "Dec 31, 2026 – Jan 7, 2027"
  — the +7 bound steps past Fri Jan 1, 2027), and the full-year
  property sweep (365 placements of 2026 parsed back from the three
  text formats, both bounds asserted Mon–Fri AND not a carrier holiday
  — the holiday-blind math fails it on 10 placements). The E2E layer:
  ZERO pin churn (the seeded fixtures are March-placed, holiday-free —
  the ORD-2026-002 exact pin "Mar 18 – 24, 2026" HOLDS; the
  confirmation's SHAPE regex holds) — the round's documented known
  limitation: the E2E layer has no holiday-exercising pin (re-dating
  the fixtures would churn every spec's pins for one refinement; live
  orders place at NOW), so the holiday math is UNIT-layer-proven
  (triple-mutation: M1 the holiday check dropped → the 6 holiday-encoding
  pins + the sweep; M2 Thanksgiving 4th→3rd Thursday → both table
  oracles + the pin + the sweep; M3 Christmas Dec 25→26 → both oracles +
  the Christmas-week + double-holiday pins + the sweep). Zero parity
  risk — doubly superset-only (the reference carries no estimate on any
  surface — the round-38 live verification, unchanged surfaces).

Computed-style parity is enforced by `tests/e2e/storefront-parity.spec.ts` — values were measured live on the reference. If you change theme tokens, re-measure, don't guess.

## Conventions

- Import alias `@/*` → `src/*`. Components PascalCase; routes kebab-case.
- **The site font is a self-hosted copy of the reference's exact woff2** (session-11, trap 13): `public/fonts/plus-jakarta-sans.woff2` + a plain `@font-face` in `globals.css` (family "Plus Jakarta Sans", `font-weight: 200 800`, `font-display: swap`); NO next/font import remains and the body carries NO `antialiased` (trap 12). `--font-sans: "Plus Jakarta Sans", sans-serif` is the reference's exact computed stack. Product art is remote (`media.base44.com`, `images.unoptimized`) — plain `<img>` tags are used for reference parity; ESLint does not flag them in this repo. The **favicon follows the same remote-CDN parity pattern** (session-7, FAVICON-1): `metadata.icons` in the root layout points at the reference's CDN logo — measured live; `/favicon.ico` itself stays 404 (the reference's is a platform 302). Pinned by the smoke spec.
- **The social/PWA head layer is a parity contract (session-9, METADATA-OG-1).** Every route builds its head via `pageMetadata()` (`src/lib/metadata.ts`, unit-pinned): og:title = document title, og:description = "«Page» on Lumina. " + SITE_DESC on static pages (plain SITE_DESC on home/PDP/404), og:image = the site LOGO (site-wide, even on the PDP), og:url canonical with the QUERY preserved (shop uses `generateMetadata` for this), twitter:url rides in `other` (no typed key). **Next engine constraints learned the hard way:** (1) the twitter resolver force-defaults `twitter:card` whenever the typed twitter field carries images — every non-PDP route wants exactly that, so `card` is deliberately omitted; (2) `appleWebApp.capable` auto-emits `mobile-web-app-capable` — never also hand-emit it via `other` (duplicate tag); (3) the PDP's card-less shape (twitter title/description/image but NEITHER card NOR url) is inexpressible via the Metadata API — the PDP page body carries React-19-hoisted `<meta>` elements for it (plain `<meta name="twitter:…">` in the RSC tree hoists into `<head>`). Pinned by the smoke spec + `metadata.test.ts`.
- Product images live on the reference app's public media CDN by design (pixel parity); swap to owned assets via `prisma/seed.ts` before rebranding.
- `next.config.ts` sets `allowedDevOrigins: ["127.0.0.1", "localhost"]` — Next 16's dev-origin protection otherwise blocks chunk loads on `127.0.0.1` (unhydrated page). `devIndicators: false` keeps the dev "N" badge out of UI screenshots.
- Conventional Commits; never commit `.env`, `db/*.db`, `dev.log`, `tests/e2e/.auth/`.
- **The build script is fresh-clone-safe (session-7, BUILD-1):** `mkdir -p public`
  precedes the standalone copies, and `public/.gitkeep` is committed — a
  bare `git clone` + `bun install` + `bun run build` exits 0 (the directory
  was previously an untracked local artifact; every fresh clone failed at
  `cp -r public`).
- **Dependencies are pruned to what `src/` imports (session-7, DEPS-1):**
  `zustand`, `@radix-ui/react-toast`, `@radix-ui/react-alert-dialog`,
  `@radix-ui/react-popover`, and `tailwindcss-animate` were removed (zero
  imports; the toast viewport is custom per ADR-011 and `tw-animate-css` is
  the v4 animation import). Re-verify with a grep before re-adding any of
  them. **`z-ai-web-dev-sdk` is a declared DEV dependency (session-56, the
  fresh-clone discovery): the VLM verification script family
  (`scripts/vlm-*.mjs`, r53-r56) imports it — it rode the old workspace's
  node_modules as an undeclared leftover for three rounds and the fresh
  clone broke; `bun add -d z-ai-web-dev-sdk` declared it properly. It is
  NEVER imported by `src/` — keep it dev-only.
- **`src/proxy.ts` is the ONLY middleware-proxied file (session-14):**
  Next 16 deprecated the `middleware` filename in favor of `proxy` (same
  NextRequest/NextResponse/matcher API; the exported function is named
  `proxy`). The repo ships the current convention — a `middleware.ts`
  beside it would double-handle requests. The file exists to mint the
  CSP nonce (ADR-022); route logic does NOT belong there (it runs before
  every document request).
