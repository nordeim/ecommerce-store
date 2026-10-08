# Remediation Plan — Session 9 Review (Round-9 Differential Audit)

**Date:** 2026-10-08
**Repo:** `nordeim/ecommerce-store` (branch `main`, baseline `d8a5677` — session-8
ship state `7744390` plus the remotely-added `docs/session_15.md` log)
**Author:** Review/build agent (Super Z)
**Scope:** Live differential audit (round 9) of the LUXE Store clone against the
reference (`fuzzy-lumina-style-hub.base44.app`). Eight prior rounds closed the
catalog, cart, checkout, auth, account, PDP, admin and computed-geometry gaps
(210-test gate). Round 9 targets: (a) the standing user priorities — mobile
navigation (9th verification, Tailwind v4 watch) and reference drift on all
pinned surfaces; (b) **first deep mobile sweep of the non-home surfaces**
(mobile button geometry across every interactive page); (c) the **social
metadata layer** (OpenGraph/Twitter/PWA head tags) — never audited before;
(d) the account Orders tab row anatomy. The `skills/` folder is excluded from
code checking, testing and compilation per the operating contract.

**Method:** Baseline gate (210/210 green, exactly the documented session-8 ship
state) → agent-browser sessions (`ref` = production reference logged in as the
operator account, `clone` = local server on the current commit) with DOM /
computed styles as ground truth, paired full-page screenshot pixel-diffs across
15 desktop routes + 7 mobile routes (iPhone 14), a global arbitrary-width
(`w-[Npx]`) drift sweep, per-route head-metadata diffs, and mobile button
measurements on every interactive surface. Every finding carries live-measured
evidence from both sites.

---

## 1. Baseline verification (state at audit start)

| Gate | Result |
|---|---|
| `bun run lint` | 0 errors, 0 warnings |
| `bun run typecheck` | clean |
| `bun run test` (Vitest) | 82/82 passed |
| `bun run build` | exit 0, 23 routes |
| `bun run test:e2e` (Playwright) | 128/128 passed (210 total) |
| DB contract | `db/custom.db` at repo root; sandbox-injected `DATABASE_URL=/home/z/my-project/db/custom.db` converged via hard link (inode 303519 — the documented env-shadowing workaround); canonical state (12 products / 3 demo orders / 3 users) |
| Docs | AGENTS/CLAUDE/README/PAD v1.8/SKILL v1.8.0 all current through session-8 (210-test gate) |

## 2. Audit results

### Verified at parity this round (no action required)

- **Mobile navigation menu (9th standing verification):** iPhone 14 on both
  sites: `[role=dialog]` 288×844 @ (0,0) with byte-identical class strings,
  nav wrapper `flex flex-col gap-4 mt-8`, all 5 links byte-identical (text +
  hrefs incl. the category deep-links). **No Tailwind v4 regression.**
- **Desktop pixel-diffs (15 routes):** every route ≤ 0.68% except the
  documented divergences — `shop-sort` (34.4%, the URL-deep-link superset; the
  reference's SPA ignores `?sort=`) and `home` (1.89%, hero-carousel slide
  timing only). The hero was re-verified structurally this round: both sites
  render the same slide ORDER ([Spring Collection, New Arrivals, Home &
  Comfort]), the same initial resting slide on fresh load ("Up to 40% Off /
  Spring Collection 2026"), and the same arrow/dot chrome (left-4/right-4
  `h-10 w-10` buttons + `bottom-6` dots). The clone's next/prev arrows WORK
  (an early "arrows dead" reading was a measurement artifact — textContent
  concatenation — the active-slide opacity tells the truth).
- **Mobile pixel-diffs (7 routes, first deep sweep):** m-home 0.71%, m-shop
  0.82%, m-pdp 0.87%, m-cart 0.67% (after `prisma/dev-cleanup.ts` cleared a
  leftover cart item), m-login 0.51%, m-wishlist 0.72% — all sub-threshold.
  m-account 2.87% → the finding below.
- **Mobile button geometry sweep** (PDP stepper/ATC/heart, shop filter row,
  cart/wishlist/checkout CTAs, account tabs): every surface byte-parity except
  the two findings below.
- **PDP tab panels:** Description / Reviews / Shipping innerHTML byte-identical
  to the reference.
- **Search submit flow:** identical (icon → bar → query → Enter/Submit →
  `/shop?search=q` → `Results for "q"`). The reference's live typeahead no
  longer renders (no XHR, no dropdown, on home or shop, with real key events
  on a freshly-logged-in session) — the reference app itself changed since the
  session-8 measurement. The clone's typeahead remains the superset
  (registered divergence, unchanged).
- **Account Orders data + Settings/Addresses tabs:** identical content and
  button geometry ("Add New" 78px, "Edit" 47px, "Update Password" 150px — the
  clone's extra "Log out" is the documented superset).
- **Admin console:** the reference has NO admin routes (`/admin`, `/dashboard`,
  `/orders`, `/products` all 404) — the clone's entire console is the
  registered superset.
- **Global arbitrary-width drift sweep** (`w-[Npx]`/`h-[Npx]` computed values,
  home/shop/PDP/cart/wishlist): one drift — SORT-W-1 below.
- **Header icons / footer / newsletter:** parity.

### Findings (each with live-measured evidence from BOTH sites)

#### F1 — ACCOUNT-BTN-W-1: profile Save button stretches full-width on mobile
- **Severity:** Medium (visible mobile-only layout break on a parity surface)
- **Evidence:** iPhone 14, `/account` Profile tab: reference "Save Changes"
  button **127px** (fit-content, flow child of the `p-6 pt-0 space-y-4` card
  content, own class ends `mt-4`); clone **308px** (grid child of
  `grid grid-cols-1 sm:grid-cols-2 gap-4` — grid items stretch by default, and
  the clone's `sm:col-span-2 sm:w-fit` only constrains width at ≥640px).
  Desktop is 127px on BOTH (the `sm:` classes mask the drift) — which is why
  session-8's desktop-only audit missed it. Mobile account pixel-diff band
  2250–2363 (2.87%).
- **Root cause:** session-8's ACCOUNT-BTN-1 fix integrated the button INTO the
  fields grid (16px via `gap-4`) instead of reproducing the reference's
  structure (button OUTSIDE the grid, `mt-4`). Desktop computed values
  coincided; mobile diverges.
- **Fix:** restructure to the reference anatomy — the form wraps a fields
  grid + the button as a flow child carrying `mt-4`:
  `<form><div class="grid grid-cols-1 sm:grid-cols-2 gap-4">fields…</div>
  <Button className="rounded-xl mt-4">…` — 16px gap on every viewport
  (single margin, no stacking), fit-content width everywhere. The v4 trap-log
  note in the comment gets corrected (the old comment documents the removed
  grid-child approach).

#### F2 — SORT-W-1: shop sort SelectTrigger is 20px wider than the reference
- **Severity:** Low (single arbitrary-value drift)
- **Evidence:** `/shop` both viewports: reference sort combobox class ends
  `w-[150px]` (computed 150px); clone `w-[170px]` (computed 170px). Category
  (`w-[160px]`) and price (`w-[150px]`) triggers already match.
- **Fix:** `src/components/store/shop-filters.tsx` line 118:
  `w-[170px]` → `w-[150px]`.

#### F3 — ACCOUNT-ORDER-ROW-1: account Orders tab row anatomy drifts
- **Severity:** Medium (whole-surface visual drift on a pinned tab)
- **Evidence:** `/account` Orders tab, reference row:
  `div.flex.flex-col.sm:flex-row.sm:items-center.justify-between.p-4.
  bg-secondary/30.rounded-xl.gap-3` (tinted fill, no border, stacks on mobile)
  wrapping `p.font-semibold` (number), a button-styled status badge
  (`inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold
  … border-transparent bg-primary text-primary-foreground shadow
  hover:bg-primary/80 rounded-full` for Delivered — measured
  rgb(230,107,26)/22px tall; `bg-secondary text-secondary-foreground
  hover:bg-secondary/80 rounded-full` for In Transit — rgb(242,240,237)), and
  `span.font-bold` (total). Container between rows: `space-y-4` (16px).
  Clone row: `flex items-center justify-between gap-4 p-4 rounded-xl border
  border-border/50 hover:border-primary/30` (bordered, hover, never stacks),
  `p.font-medium`, emerald/amber colored-chip badges, `span.font-semibold`,
  container `flex flex-col gap-3` (12px).
- **Fix:** port the reference anatomy into `account-tabs.tsx` — container
  `space-y-4`; row `flex flex-col sm:flex-row sm:items-center justify-between
  p-4 bg-secondary/30 rounded-xl gap-3`; number `font-semibold`; total
  `font-bold`; badge = the reference's button-class div with
  `STATUS_STYLES` remapped to the reference's two measured variants
  (delivered → primary, in_transit → secondary; unmeasured statuses default
  secondary — reasoned, only two variants are observable on the reference).

#### F4 — METADATA-OG-1: the social/PWA head layer is missing on every route
- **Severity:** High (link previews, SEO surface; affects every page)
- **Evidence:** the reference renders a complete per-route head set on every
  route — decoded live across 10 route probes:
  - `og:title` = the document title ("Shop | Lumina", "Login | Lumina", …;
    PDP + unknown routes use the humanized-slug title; home is plain "Lumina")
  - `og:description` = **"«Page» on Lumina. " + SITE_DESC** on static pages
    (Shop/Cart/Wishlist/Account/Checkout/Login/Register/Forgot Password);
    **plain SITE_DESC** on home, PDP and unknown routes, where
    SITE_DESC = "An elegant, high-end e-commerce destination offering curated
    essentials for a modern lifestyle."
  - `og:image` = the site logo at
    `https://media.base44.com/images/public/69d296f5d1237b9a1afec899/76cff797e_logo.png/v1/fill/w_1200,h_630/76cff797e_logo.png`
    (site-wide — the PDP also uses the LOGO, not the product image)
  - `og:url` = canonical page URL (**query preserved**: `/shop?category=electronics`
    keeps the param), `og:type` = website, `og:site_name` = Lumina
  - `twitter:title/description/image` mirror og; **`twitter:card`
    ("summary_large_image") + `twitter:url` only on static pages — the PDP
    renders NEITHER**
  - PWA metas site-wide: `mobile-web-app-capable` = yes,
    `apple-mobile-web-app-status-bar-style` = black,
    `apple-mobile-web-app-title` = Lumina
  - The clone renders NONE of these on any route except a partial PDP set
    that drifts (og:title = product NAME vs the reference's humanized slug;
    og:description = product description vs the reference's SITE_DESC;
    og:image = product image vs the reference's logo; twitter:card present
    vs absent). The clone's root `meta description` also drifts ("LUXE Store —
    curated collection…" vs the reference's SITE_DESC).
- **Fix:** add `src/lib/metadata.ts` with `SITE_DESCRIPTION`,
  `OG_IMAGE_URL` and a `pageMetadata({ title, path, plain?, twitterCard? })`
  builder that emits the complete per-route set (og + twitter via `other`
  for `twitter:url` + the prefix-description rule). Apply it to home (plain,
  bare "Lumina" title), shop (with `generateMetadata` reading `searchParams`
  to preserve the query in og:url), cart, wishlist, account, checkout,
  login, register, forgot-password, verify-email, checkout/success; PDP
  (plain description, humanized-slug og:title, logo image, NO twitter card);
  the `[...notFound]` catch-all (plain description). Root layout: description
  = SITE_DESCRIPTION + `appleWebApp` + `other.mobile-web-app-capable`.
  Admin pages keep their titles (superset surface — no reference target).

#### Registered divergences re-confirmed (documented, do not fix)
- Reference cart/checkout permanently empty vs the clone's real ones;
  `?sort=` deep-link superset; hero auto-advance timing + hover-pause;
  mobile-nav auto-close; logout card; typeahead superset (the reference's own
  typeahead no longer renders live — noted for the record); admin console
  superset; toast/PWA-adjacent niceties.

---

## 3. TDD plan (RED → GREEN per finding)

| ID | Finding | RED test (fails pre-fix) | Implementation |
|---|---|---|---|
| T1 | ACCOUNT-BTN-W-1 | account.spec.ts (new mobile-viewport describe): Save button computed width = 127px at 390×844 (pre-fix: 308px) | restructure profile form: grid(fields) + Button `mt-4` flow child |
| T2 | SORT-W-1 | storefront-parity.spec.ts: shop sort trigger computed width = 150px (pre-fix: 170px) | `w-[150px]` on the sort SelectTrigger |
| T3 | ACCOUNT-ORDER-ROW-1 | account.spec.ts: orders rows — container `space-y-4` (row gap 16px), row bg rgb(242,240,237)-family (`bg-secondary/30`), border-width 0, number font-weight 600, total font-weight 700, Delivered badge bg rgb(230,107,26), In-Transit badge bg rgb(242,240,237) (pre-fix: border 1px / weights 500+600 / emerald+amber chips / gap 12px) | port the reference row anatomy + STATUS_STYLES remap |
| T4 | METADATA-OG-1 | unit: `src/lib/metadata.test.ts` (builder rules: prefix vs plain, og:title composition, twitter card gate, og image, url building); smoke.spec.ts: rendered head metas on `/`, `/shop`, `/shop?category=electronics` (og:url query), PDP (humanized og:title, logo og:image, no twitter:card), PWA metas (pre-fix: all absent/drifting) | `src/lib/metadata.ts` + per-route metadata rewrites + root layout description/PWA |
| T5 | Gate + docs + ship | full gate two consecutive E2E runs; live re-verification of every fixed value; pixel re-diffs; screenshots (52–57) to `docs/screenshots/`; AGENTS (contract updates + mobile-grid trap note)/CLAUDE/README/PAD v1.9/SKILL v1.9.0/session_16 log; `.env.example` re-check; worklog; commit + SSH push | — |

## 4. Seams validated against the codebase (pre-implementation)

- `src/components/account/account-tabs.tsx` — the profile form (lines 152–198)
  is the ONLY profile-form occurrence; the orders rows (215–239) +
  `STATUS_STYLES` (52) are the only row renderer (the admin order list uses
  its own `admin-order-row.tsx`, untouched); no other surface imports these.
- `src/components/store/shop-filters.tsx` line 118 — the only `w-[170px]` in
  the repo; the storefront-parity spec has no existing width pin on the sort
  trigger (verified — no conflict).
- Session-8's ACCOUNT-BTN-1 pin ("Save button sits 16px below the fields")
  stays GREEN after the restructure: the button's `mt-4` supplies the same
  16px desktop value (the test asserts computed margin, not classes).
- `src/app/layout.tsx` metadata is the only root source; every target page
  already exports `metadata`/`generateMetadata` with title-only objects
  (drop-in replacement with the builder); the PDP's `generateMetadata` is
  the only product-metadata seam; `notFoundPageTitle` already exists in
  `src/lib/format.ts` for the catch-all.
- No E2E spec currently asserts og/twitter metas (verified by grep) — the new
  smoke assertions have no conflicts. `NEXT_PUBLIC_SITE_URL` is unset in the
  E2E build → deterministic `http://localhost:3000` og:url values.

## 5. Sign-off criteria

- [x] All RED tests verified failing for the right reasons before fixes (308px button / 170px trigger / bordered row / absent og tags)
- [x] GREEN: 88 unit / 136 E2E, all green; two consecutive full runs (+ re-confirmed in the continuation session after stopping next dev)
- [x] Live re-measurements: Save button 127px @ mobile, sort trigger 150px,
      order-row geometry/badges, head metas on 5+ routes — all matching the
      reference values above (scripts/verify-session9.ts, 12/12)
- [x] Pixel re-diff: m-account 2.87%→0.65%, account 0.21%, shop 0.24%, m-shop 0.71% — band gone
- [x] Docs/screenshots/worklog/commit/push per repo convention (screenshots 52-57 VLM-verified 6/6; session_16 log; PAD v1.9/ADR-017; SKILL v1.9.0)
