# Remediation Plan — Session 20 Review (Round-20 SEO + Auth-Completion)

**Date:** 2026-10-09
**Repo:** `nordeim/ecommerce-store` (branch `main`, baseline `5aad157` — the
session-19 ship `3cc091e` + the sign-off `5aad157`)
**Author:** Review/build agent (Super Z)
**Scope:** Live differential audit (round 20) of the LUXE Store clone against
the reference (`fuzzy-lumina-style-hub.base44.app`). Nineteen prior rounds
closed the catalog, cart, checkout, auth, account, PDP, admin,
computed-geometry, mobile-geometry, social-metadata, interaction-engine,
typography/keyboard, axe-a11y/security-header, CWV/admin-filter,
delivery-layer/CSP, standing-axe-gate, mobile/admin-gate, CWV-gate,
mobile-CWV-gate, and auth-screens-gate gaps (278-test gate). Round 20 targets:
(a) the standing user priorities — mobile navigation (20th verification,
Tailwind v4 watch) and reference drift on pinned surfaces; (b) the standing
drift watches (8-route pixel sweep, typeahead, carousel); (c) **the round's
primary new surface — the SEO/SITEMAP differential** (the user's standing
instruction this round: "Check for Sitemap implementation and SEO
optimization") and the findings it drives. The `skills/` folder is excluded
from code checking, testing and compilation per the operating contract.

**Method:** Baseline gate (278/278 green, exactly the documented session-19
ship state) → agent-browser sessions (`ref` = production reference logged in
as the operator account, `clone` = production standalone server on :3000,
ONE host — localhost — for the whole clone lifecycle per L22; states saved
before device emulation) + the paired pixel sweep re-run +
`scripts/axe-diff-session20.mjs` (the SAME axe-core 4.14.0 build injected on
both sites, the scrolled-reveal pass per the session-12 trap, anonymous
contexts at desktop AND iPhone 14). Every conclusion carries live-measured
evidence from both sites.

---

## 1. Baseline verification (state at audit start)

| Gate | Result |
|---|---|
| `bun run lint` | 0 errors, 0 warnings |
| `bun run typecheck` | clean |
| `bun run test` (Vitest) | 100/100 passed |
| `bun run build` (the repo wrapper — never raw `next build`) | exit 0, 23 routes, zero deprecation warnings |
| `bun run test:e2e` (Playwright) | 178/178 passed (278 total) |
| DB contract | `db/custom.db` at repo root (fresh `db:setup` run with the repo URL inline); hard-link convergence live at the env-shadowed sandbox path (inode 172496, both paths — the documented L-environment contract; `tests/db-path.test.ts` 15/15 green) |
| Docs | AGENTS/CLAUDE/README/PAD v1.19/SKILL v1.19.0 all current through session-19 (278-test gate, ADR-027, 29 lessons); the session-19 deliverables verified in code (the 6-test auth-screens describe + the persisted diff/calibrate/capture scripts) |
| Env | `.env` recreated from `.env.example` (`DATABASE_URL="file:../db/custom.db"`; the shell-exported sandbox `DATABASE_URL` shadows the repo file — the hard link converges both paths on ONE file); `.env.example` byte-identical to the shipped state |
| Stale servers | none live at audit start (the `/proc/net/tcp` socket-inode walk scanned :3000/:3100 clean); the round's :3000 server detached via the double-fork orphan pattern (the sandbox reaps plain background processes between commands) |

## 2. Audit results

### Verified at parity this round (no action required)

- **Mobile navigation menu (20th standing verification):** iPhone 14 on both
  sites (agent-browser device emulation, 390×844, DPR 3, hover:false): the
  Sheet panel class string matches token-for-token (modulo attribute order),
  pad 24px, bg `rgb(251, 250, 249)`, w-72 (288px), nav `flex flex-col gap-4
  mt-8` (gap 16px, margin-top 32px), all 5 links identical (text + hrefs
  incl. the category deep-links) at 239×44, 18px/500, `display:block`.
  **No Tailwind v4 regression (20th consecutive verification).** Functional
  check: clicking "Electronics" navigates to `/shop?category=electronics`
  and the sheet auto-closes (the registered superset behavior).
- **Pixel diffs @1024 (standing drift re-check, 8 routes):** home 0.34 /
  shop 0.38 / PDP 0.68 / cart 0.34 / wishlist 0.34 / checkout 0.35 /
  account 0.34 / login 0.28 — ALL at the documented baseline band,
  byte-identical to the session-15/16/17/18/19 numbers. No drift.
- **Typeahead drift watch:** typing "headphones" into the reference's
  search (fetch + XHR instrumented, search expanded via its icon button)
  fires ZERO search network requests — the clone's `/api/search` remains
  the registered superset.
- **Carousel cadence watch:** with the pointer off the hero, both sites
  flip slides at the same ~5.0s cadence (reference 5000/5000ms; clone
  5000/5003ms — the first shorter interval on each side is the mid-cycle
  entry artifact of the probe's start).

### The round's primary new surface — the SEO/SITEMAP differential

The first SEO-layer differential (the user's standing round instruction):
sitemap.xml, robots.txt, the metadata layer, and structured data, measured
on BOTH sites:

| Surface | Reference | Clone | Verdict |
|---|---|---|---|
| /sitemap.xml | 200, `application/xml`, 10 URLs — every app route incl. PRIVATE ones (`/account`, `/checkout`, `/cart`) at priority 0.8 / weekly, **ZERO product URLs** (the base44 platform auto-generates from the route list) | 200, `application/xml`, 17 URLs — 5 curated public routes (priorities 1/0.9/0.3/0.2/0.2) + **all 12 active product URLs** with `lastModified` (0.8/weekly) | Clone = SEO SUPERSET (products indexable; private routes excluded) |
| /robots.txt | `User-agent: * / Allow: /` + sitemap link (allow-all) | Allow `/` + `Disallow: /admin, /account, /checkout, /api` + sitemap link | Clone = SEO-superior (private families excluded) |
| Per-route metadata | Full OpenGraph/Twitter/PWA head set | Full set via `pageMetadata()` (ADR-017) + the PDP's React-19-hoisted card-less shape | Parity (pinned in smoke.spec since session-9) |
| Structured data (JSON-LD) | **NONE** (SPA, no schema.org markup) | **NONE** | Gap → F3 |
| `/reset-password` route | **REAL route** — 2 states + error + full head set | **platform 404** (the clone does not ship the route) | **PARITY GAP → F1** |

#### F1 — RESET-ROUTE-1 · the reference ships a real `/reset-password` route; the clone 404s

Discovered via the reference's OWN sitemap (it lists `/reset-password`,
which the clone's catch-all answers with the platform 404). Measured live
on the reference (2026-10-09, anonymous contexts, both viewports):

- **No token** (`/reset-password`): the "Invalid reset link" screen —
  `div.w-full.max-w-md` > header block OUTSIDE the card
  (`text-center mb-10`: `w-14 h-14 rounded-2xl bg-primary mb-4` tile with
  the lucide `triangle-alert` icon `w-7 h-7 text-primary-foreground`, h1
  `text-3xl font-bold tracking-tight text-foreground` "Invalid reset
  link", sub `text-muted-foreground mt-2` "This password reset link is
  missing or invalid") + the card
  (`bg-card rounded-2xl shadow-sm border border-border p-8`) with
  `p.text-sm.text-foreground.text-center` "The link you used appears to be
  incomplete. Please request a new password reset email." + the below-card
  `p.text-center.text-sm.text-muted-foreground.mt-6` with the
  `text-primary font-medium hover:underline` link "Request a new link" →
  `/forgot-password`. NO `main` landmark (the auth-family anatomy).
- **With token** (`/reset-password?token=«anything»`): the "New password"
  form — the same anatomy with the lucide `lock` tile icon, h1 "New
  password", sub "Enter your new password below"; the card carries
  `form.space-y-4` with TWO icon-led h-12 password fields (labels "New
  Password" for=`password` + "Confirm Password" for=`confirm`; lucide
  `lock` input icons; `pl-10 h-12` inputs, `placeholder="••••••••"`,
  `autocomplete="new-password"`, required) + the
  `w-full h-12 font-medium` primary button "Reset password".
- **Invalid token submit:** the family's tinted error BOX
  (`div.mb-4.p-3.rounded-lg.bg-destructive/10.text-destructive.text-sm`,
  first child of the card above the form): "Invalid or expired reset
  token" (measured with a bogus token).
- **Client-side validation fires FIRST:** mismatched passwords with a
  bogus token surface "Passwords do not match" (the register copy) — the
  match check precedes the server's token check.
- **Head set:** title "Reset Password | Lumina", the STATIC-page
  description pattern ("Reset Password on Lumina. «SITE_DESC»"), the full
  OG/Twitter/PWA set, and **og:url preserves the token query** (measured:
  `/reset-password?token=test123`).
- **Axe census (both states, both viewports):** `{color-contrast}` × 1 on
  the reference (`scripts/axe-diff-session20.mjs`); the clone's 404
  happens to carry the same count (coincidental — the gap is documented
  by the route's absence, not the census).

The clone's `/forgot-password` (ADR-010) is the anti-enumeration REQUEST
flow with the `console.info` email seam — but the reset LANDING route (the
other half of the flow) does not exist. This is the auth family's missing
member: login, register, forgot-password, and verify-email are all parity
or superset surfaces; reset-password 404s.

#### F2 — SEO-GATE-1 · the sitemap/robots layer has zero regression pins

The clone's sitemap.ts + robots.ts implement the SEO superset, but NO test
pins them (the smoke spec pins per-route metadata since session-9; the
sitemap/robots files were never covered). A route/schema refactor could
silently: drop the product URLs from the sitemap (the SEO superset's core
value — SEO parity with a generic 5-route sitemap), break the robots
disallow rules (exposing private families), or break the XML serving
(content-type). The A11Y-GATE-2 structural-blindness story, now for the
SEO layer: the implementation exists but nothing prevents its silent
regression.

#### F3 — JSON-LD-1 · no structured data on either site (the SEO superset's missing member)

Neither site ships schema.org structured data (the reference is a base44
SPA — no JSON-LD; the clone never added it). For a production-ready
e-commerce SEO superset, the two highest-value surfaces are: **Product
schema on the PDP** (name/image/description/offers.price/priceCurrency/
availability — the rich-results surface that makes the 12 product URLs
eligible for price/rating snippets) and **Organization + WebSite on the
home** (site identity). Both are invisible data blocks
(`script[type="application/ld+json"]`) — rendering-neutral by construction
(CSP-exempt per the spec: data blocks are not executable and not subject
to script-src; the smoke nonce test needs a refinement to skip
non-executable script types).

### Findings summary

**One parity defect (F1) + two gate/superset gaps (F2/F3).** The round
ships all three: the missing route (parity), the standing SEO gate
(F2), and the structured-data layer (F3) — one audit surface, three
deliverables, the session-9 social-metadata precedent.

---

## 3. Fix design (validated against the codebase)

### Part A — the `/reset-password` parity route (RESET-ROUTE-1)

1. **Prisma — `PasswordResetToken` model** (the Session pattern; NOT
   fields-on-User like the verification code — the reset link carries only
   the token, so the lookup must be keyed by the token hash):
   `id`, `tokenHash String @unique` (scrypt hash of the URL token),
   `userId String` (FK → User, cascade), `expiresAt DateTime`,
   `createdAt DateTime @default(now())`. Single-use enforced by deleting
   the row on success. Single active token per user (the request flow
   deletes prior rows first — re-request replaces).
2. **`src/lib/reset-token.ts`** (the verification.ts pattern): the token
   generator (32 random bytes → base64url, `randomBytes`), TTL
   (30 minutes — the standard reset window; the reference's window is
   unmeasurable, registered as the chosen contract), the copy constants
   ("Invalid or expired reset token" — measured; the no-token screen copy
   lives with the island). Unit tests for the format + TTL + copy
   (the verification.test.ts pattern).
3. **`src/lib/actions/auth.ts`:**
   - `requestPasswordResetAction` (extended): when the user exists,
     replace their reset tokens with a fresh one (hash stored, TTL set)
     and log the RESET LINK at the existing `console.info` seam
     (`[password-reset] link for «email»: /reset-password?token=«token»`
     — the email-provider plug-in point; anti-enumeration response
     UNCHANGED: same neutral confirmation, the DB write is invisible).
   - `resetPasswordAction` (new): Zod (`token`, `password` ≥ 8 — the
     register contract, `confirmPassword`), lookup by `scryptHash(token)`
     against `tokenHash`, reject expired/unknown with the measured copy
     "Invalid or expired reset token", then (transactional): update the
     password hash, DELETE the token row, **DELETE all the user's
     Sessions** (the standard security behavior — a reset invalidates
     every active session; the reference's post-success behavior is
     unmeasurable without a real email, registered as the superset
     decision), return ok → the island routes to `/login`.
   - Rate limit: the request flow keeps the existing 5/15min/IP+email
     pin; the reset submit is token-gated (unknown tokens are rejected
     before any user write).
4. **`src/app/(auth)/reset-password/page.tsx`** (the auth-family page
   pattern): `force-dynamic` (per-request CSP nonces + searchParams),
   metadata via `pageMetadata({ title: "Reset Password", path })` where
   path preserves the token query (the `/shop?category=x` og:url
   precedent — measured on the reference), reads `searchParams.token`,
   delegates to the island.
5. **`src/app/(auth)/reset-password/reset-password-form.tsx`** (the
   client island): token present → the "New password" form state; token
   absent → the "Invalid reset link" state — both exactly the measured
   anatomy (icon tiles, h-12 icon-led inputs with `••••••••` placeholders
   + `autocomplete="new-password"`, `Label htmlFor` associations — the
   L29 discipline keeps the placeholder as the LAST name defense, the
   visible label the primary; the tinted `AuthErrorBox`; the
   "Request a new link" → `/forgot-password` link). Client-side match
   check FIRST (measured: fires before the token check), success →
   `router.push("/login")`.
6. **`prisma/e2e-reset.ts`:** upsert the dedicated fixture user
   `resetuser@example.com` (password `Reset1234!` — the
   unverified@example.com precedent; john@example.com untouched so the
   demo/storageState budget is unaffected) + a fixture token row
   (`reset-fixture-token` hashed) for it; clear stale token rows.
7. **sitemap.ts:** `/reset-password` NOT added (utility-page curation —
   forgot-password is likewise absent; the divergence from the reference's
   platform list-everything sitemap is registered).

### Part B — the SEO standing gate (SEO-GATE-1) + structured data (JSON-LD-1)

1. **`tests/e2e/seo.spec.ts`** (new spec, anonymous + request contexts —
   the smoke.spec pattern):
   - `/sitemap.xml` (request): 200; `content-type: application/xml`;
     exactly 17 `<loc>` URLs in the e2e seed state (5 static + 12
     product); the static set pinned (order + priority + changefreq:
     `/`=1/daily, `/shop`=0.9/daily, `/wishlist`=0.3/monthly,
     `/login`=0.2/yearly, `/register`=0.2/yearly); every product URL
     (`/product/«slug»` for the 12 seeded slugs) carries priority 0.8,
     changefreq weekly, and a `lastmod`; the origin is the documented
     fallback (`http://localhost:3000` — the E2E server runs with
     NEXT_PUBLIC_SITE_URL unset; pinning the fallback also pins the
     "set it in production" contract).
   - `/robots.txt` (request): 200; `text/plain`; the pinned rule block —
     `User-Agent: *`, `Allow: /`, `Disallow: /admin`, `Disallow:
     /account`, `Disallow: /checkout`, `Disallow: /api`, `Sitemap:
     http://localhost:3000/sitemap.xml`.
   - **JSON-LD (page contexts):** the home page carries a parseable
     `script[type="application/ld+json"]` with an Organization node
     (`@type`, `name` "Lumina", `url`) and a WebSite node; the PDP
     carries a Product node with `name` (the product name), `image`
     (the product image), `offers.price` (the product price in DOLLARS —
     the schema.org contract is decimal USD, not integer cents),
     `offers.priceCurrency` "USD", and `offers.availability`
     InStock/OutOfStock reflecting the product's stock; unknown slugs
     carry NO Product node (the not-found block is not a product).
2. **App code — the JSON-LD layer** (rendering-neutral data blocks,
   rendered in the body flow next to the existing social metas —
   `display:none` by construction):
   - Home (`src/app/(storefront)/page.tsx`): Organization + WebSite.
   - PDP (`src/app/(storefront)/product/[slug]/page.tsx`): Product with
     offers (price via `formatCents`-equivalent cents→decimal
     conversion — reuse the money lib's exact semantics) +
     `aggregateRating` when `rating > 0` (ratingValue/reviewCount from
     the seeded rating).
3. **`tests/e2e/smoke.spec.ts` — the nonce-test refinement:** the
   "every script carries the nonce" assertion skips script tags whose
   `type` is a data block (`type="application/ld+json"` — non-executable,
   CSP-exempt per the spec: data blocks are not subject to script-src and
   cannot kill hydration). Executable scripts (no type / module / text
   -javascript) keep the strict nonce pin. This is a documented test
   refinement, not a weakening: data blocks cannot execute.

### Part C — the a11y gate extension (A11Y-GATE-3 family)

`tests/e2e/accessibility.spec.ts`: +4 tests in the auth-screens family —
the reset-password route's TWO states (no-token + with-token via the
fixture token) × two viewports (desktop 1280×720 + iPhone 14), anonymous
contexts, the same `runAxe` helper + census shape. Pins: `{color-contrast}`
× 1 at both viewports in both states (the live differential's measured
reference census; E2E-calibrated before pinning — the screens are
anonymous + DB-independent except the token row, which the fixture
provides deterministically).

### Part D — auth.spec extension (the route's behavior contract)

`tests/e2e/auth.spec.ts` (the logged-out surface's home): +5 tests —
- the no-token state renders the measured copy ("Invalid reset link" h1,
  the card copy, the "Request a new link" link → `/forgot-password`);
- the with-token state (fixture token) renders the form with BOTH
  `Label htmlFor` associations + `••••••••` placeholders +
  `autocomplete="new-password"` + the "Reset password" button;
- a bogus token + matching passwords submit surfaces the tinted error box
  with the measured copy "Invalid or expired reset token";
- the full reset flow: the fixture token + a new password → success →
  `/login` → login as `resetuser@example.com` with the NEW password lands
  on `/account`, the OLD password no longer works ("Invalid email or
  password" — the pinned copy), and the user's pre-reset session cookie
  is invalidated (the /account gate redirects to /login — the
  session-invalidation pin);
- the document title "Reset Password | Lumina" + og:url preserves the
  token query (the measured reference behavior).

### Gate math

Unit: +3–4 (reset-token lib) → ~104. E2E: +4 (axe) +5 (auth) +6 (seo)
= +15 → 193. **Total: 278 → ~297** (none removed). Two consecutive full
E2E runs for determinism (the L25 stale-server discipline: kill the :3100
calibration server before each run).

### Efficacy proofs (mutations, one at a time, revert, GREEN re-run)

- **Mutation 1 (the sitemap contract):** filter one product slug out of
  the sitemap query → the seo spec's product-URL pin fails (17 → 16
  URLs); revert.
- **Mutation 2 (the robots contract):** drop the `/account` disallow →
  the robots pin fails; revert.
- **Mutation 3 (the JSON-LD price):** corrupt the offers price (cents
  passed as the decimal) → the Product-schema price pin fails; revert.
- **Mutation 4 (the axe gate, the L26/L29 discipline):** remove the New
  Password input's `Label htmlFor` AND its `••••••••` placeholder (L29:
  the placeholder masks the association defect alone) → the
  reset-password axe tests fail with the `label` rule at both viewports
  while the other auth screens stay green; revert.

### Live re-verification

The pixel sweep re-run (the JSON-LD blocks must be rendering-neutral —
all 8 routes at the baseline band) + the 20th mobile-nav screenshot
compared by md5 against the 13th–19th (rendering continuity across the
route + JSON-LD additions).

## 4. TDD plan

**RED:** every new test written against the not-yet-built surfaces first:
the auth.spec reset tests fail on the 404 page; the seo.spec tests fail
on the missing JSON-LD nodes; the axe reset tests fail on the 404 census
(the 404's {color-contrast}(1) may coincide — the RED runs with the
zero-tolerance form first (census `[]`, count 0) so the failures carry
the right payload); the reset-token lib tests fail on the missing module.

**GREEN:** the calibrated pins + the implementation (the route, the
action, the schema, the JSON-LD layer, the fixtures).

**Efficacy:** the four mutations above, run once, one at a time, verified
by failure REASON, reverted, GREEN re-run.

**Gate:** the full suite (`lint && typecheck && test && build && test:e2e`)
— two consecutive full E2E runs (kill the :3100 calibration server first).

## 5. Sign-off criteria

- [x] Baseline gate green at audit start (278/278, exactly the documented ship state)
- [x] Round-20 audit complete: mobile nav 20th verification; 8-route pixel drift re-check; typeahead + carousel watches; the SEO/sitemap differential (both sites) incl. the /reset-password route discovery
- [x] The parity gap confirmed and fixed: /reset-password ships both measured states + the error behavior + the head set (og:url query-preserving)
- [x] The token machinery: sha256-indexed single-use tokens (L31 — the live correction), 30-min TTL, session invalidation on reset, anti-enumeration preserved (the request response unchanged)
- [x] The SEO standing gate: sitemap pins (17 URLs, static set, product set with lastmod) + robots pins (the rule block)
- [x] The JSON-LD layer: Organization + WebSite on home, Product (with offers + aggregateRating) on the PDP — rendering-neutral (pixel sweep + md5 continuity proofs)
- [x] The smoke nonce test refined (data blocks skipped — documented CSP exemption)
- [x] The axe gate extended: +4 reset-password tests (2 states × 2 viewports), E2E-calibrated, mutation-proven (the L29-aware mutation)
- [x] RED → GREEN for every addition, failed-first documented
- [x] Full gate green: lint 0/0 · typecheck clean · unit green (+the new lib tests) · build 23 routes · E2E green incl. the +15 new tests — two consecutive full runs
- [x] Live re-verification: pixel sweep at the identical baseline numbers; the 20th mobile-nav screenshot byte-identical (md5) to the 13th–19th
- [x] Screenshots captured under `docs/screenshots/` (111–115) + VLM-verified
- [x] Docs updated: AGENTS.md, CLAUDE.md, README.md, PAD v1.20 (ADR-028 + revision row + Known-Issues Resolved rows), SKILL v1.20.0, session log (session_38), worklog
- [x] `.env.example` verified current (no new env plumbing — the token seam reuses the existing console.info contract)
- [x] Committed on `main` and pushed via the SSH wrapper (final step — checked off in the session log after the push lands)
