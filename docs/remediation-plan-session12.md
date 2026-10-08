# Remediation Plan — Session 12 Review (Round-12 Differential Audit)

**Date:** 2026-10-08
**Repo:** `nordeim/ecommerce-store` (branch `main`, baseline `5970e9d` — the
session-11 ship state `6d21c58` plus the remotely-added `docs/session_21.md`
narrative + `docs/prompt-to-review-2/3.md`)
**Author:** Review/build agent (Super Z)
**Scope:** Live differential audit (round 12) of the LUXE Store clone against
the reference (`fuzzy-lumina-style-hub.base44.app`). Eleven prior rounds closed
the catalog, cart, checkout, auth, account, PDP, admin, computed-geometry,
mobile-geometry, social-metadata, interaction-engine and typography/keyboard
gaps (229-test gate). Round 12 targets: (a) the standing user priorities —
mobile navigation (12th verification, Tailwind v4 watch) and reference drift
on pinned surfaces; (b) **the first automated axe-core a11y differential**
(the round-12 candidate nominated at the end of session-20 — a11y violations
compared rule-by-rule across both sites on 6 routes); (c) **a WCAG 1.4.4
200%-zoom reflow audit** (never tested); (d) **a console-error/pageerror
census across every route** (production readiness — after the round's own
`bunx next build` artifact proved how silently a dead client bundle hides);
(e) **security response headers** vs the reference; (f) the standing
pixel-diff drift re-check @1024. The `skills/` folder is excluded from code
checking, testing and compilation per the operating contract.

**Method:** Baseline gate (229/229 green, exactly the documented session-11
ship state) → agent-browser sessions (`ref` = production reference logged in
as the operator account, `clone` = production standalone server on :3000
running the current build; session state saved to files before device
emulation per the session-9 lesson) with axe-core 4.10.2 injected
same-version on both sides; paired screenshot pixel-diffs @1024 with band
localization; curl header censuses; viewport-reflow probes at 512px CSS width
(= 200% of 1024). Every finding carries live-measured evidence from both
sites.

---

## 1. Baseline verification (state at audit start)

| Gate | Result |
|---|---|
| `bun run lint` | 0 errors, 0 warnings |
| `bun run typecheck` | clean |
| `bun run test` (Vitest) | 88/88 passed |
| `bun run build` | exit 0, 23 routes |
| `bun run test:e2e` (Playwright) | 141/141 passed (229 total) |
| DB contract | `db/custom.db` at repo root; hard-link convergence live (inode 303519, both paths); canonical state (12 products / 3 demo orders / 3 users) |
| Docs | AGENTS/CLAUDE/README/PAD v1.11/SKILL v1.11.0 all current through session-11 (229-test gate, 13 traps) |
| Env | `.env` `DATABASE_URL="file:../db/custom.db"` intact; `.env.example` current; session-11 pins verified in code (font md5 `7660bd9909fb097989b19471a75f1b7a`, hero `inert`, no `antialiased`, `@custom-variant hover (&:hover)`) |

**Audit artifact recorded (not a code defect):** running `bunx next build`
directly (raw Next, without the repo wrapper's standalone static/public copy
steps) regenerates `.next/standalone` WITHOUT the static chunks — every
`/_next/static/chunks/*.js` then serves the HTML 200 fallback, the client
bundle dies with `Unexpected token '<'` pageerrors, and hydration never
lands (login E2E stuck, inputs wiped). The fix was re-running the repo
wrapper `bun run build`. Lesson recorded for the trap log conventions: always
build through `bun run build` — never `bunx next build` — in this repo.

## 2. Audit results

### Verified at parity this round (no action required)

- **Mobile navigation menu (12th standing verification):** iPhone 14 on both
  sites: the Sheet panel class string matches token-for-token (`fixed z-50
  gap-4 bg-background p-6 shadow-lg transition ease-in-out … inset-y-0
  left-0 h-full border-r … w-72 sm:max-w-sm`; the two sites differ only in
  the ATTRIBUTE ORDER of the last two utilities, which does not affect the
  cascade), pad 24px, gap 16px, bg `rgb(251, 250, 249)`, nav
  `flex flex-col gap-4 mt-8`, all 5 links identical (text + hrefs incl. the
  category deep-links) at 239×44, 18px/500, `display:block`. **No Tailwind v4
  regression (12th consecutive).**
- **axe-core color-contrast: PARITY everywhere once the ref's scroll-reveal
  is accounted for.** The ref gates every product section behind
  framer-motion `whileInView` wrappers (`opacity: 0; transform:
  translateY(20px)` inline until scrolled into view) — axe skips invisible
  text, so the ref's initial scan under-reports. After an incremental
  full-page scroll the ref's home page reports **28 contrast nodes —
  exactly the clone's 28** (same badge set: white-on-primary `bg-primary`
  3.23:1 "Best Seller"/"-25%"/… rows, footer 3.72:1, announcement bar,
  newsletter fine print). Route-by-route: home 28=28, shop 23=23,
  PDP 14=14, cart 8=8, account 8=8, login 3=3. The white-on-orange badges
  are a SHARED design-system trait (byte-identical computed styles measured
  on both sites) — changing them would break visual parity; registered as
  considered-and-dismissed with evidence.
- **axe heading-order: parity** (1 node on the shared home/shop/PDP/cart/
  account surfaces — the same category-card h3-into-h1 skip exists on both
  sites).
- **axe login page: IDENTICAL violation sets** (color-contrast 3,
  landmark-one-main 1, region 8 — the auth screens' icon-led inputs are
  unlabeled-by-axe's-region heuristic on BOTH sites).
- **The clone's aria superset holds:** 0 unlabeled buttons and 0 unnamed
  links on every scanned route vs the ref's 19–20 `button-name` + 2
  `link-name` + 4 `label` (account) violations; the ref additionally carries
  a `landmark-unique` violation on its PDP that the clone does not.
- **Console-error census (clone, production server):** 12 routes walked
  (home, shop, PDP, cart, checkout, wishlist, account, login, register,
  forgot-password, admin, 404 catch-all) — ZERO pageerrors, ZERO
  console errors/warnings.
- **200% zoom reflow (WCAG 1.4.4):** both sites at 512px CSS width (= 200%
  of the 1024 canvas): no horizontal `scrollWidth > clientWidth` overflow on
  home/shop/PDP/cart/account — parity.
- **Pixel diffs @1024 (standing drift re-check):** home 0.36 / shop 0.40 /
  PDP 0.72 / account 0.35 / cart 0.36 / login 0.28% — at the documented
  baseline band (session-11 ship: 0.23–0.60%; session-10 band: 0.27–0.54%).
  The PDP re-capture is reproducible at 0.72% with the ref's own self-diff
  at 0.00% — the 4 thin (≤16px) diff bands sit on text-glyph AA rows, an
  order of magnitude below any drift signature (the trap-12/13 drift was
  1.62–4.81%); recorded as sub-threshold AA noise, no action.
- **Typeahead/content drift watch:** the ref's SPA content censuses match the
  clone's on every scanned route (the axe text-visible sets agree; the
  account Phone field exists on both) — no reference drift detected this
  round.

### Findings (4 — each with live-measured evidence from BOTH sites)

#### F1 — A11Y-ARIA-1 · the ToastViewport's `aria-label` sits on a role-less div (axe `aria-prohibited-attr` on every storefront route)

The toast region (`src/components/store/toast-viewport.tsx`) renders
`<div class="fixed bottom-6 right-6 z-[100] …" aria-live="polite"
aria-label="Notifications">`. A plain `<div>` computes `role=generic`, and
ARIA 1.2+ prohibits `aria-label`/`aria-labelledby` on generic elements —
axe-core 4.10.2 flags it (`aria-prohibited-attr`, serious) on every route
that renders the store chrome (home, shop, PDP, cart, account — 1 node each).
The reference has NO such label (its toast container is a bare
`div.fixed.bottom-6.right-6.z-[100].flex.flex-col.gap-2` with no aria
attributes at all; its shadcn `Toaster` viewports are equally bare).

**Live A/B evidence:** clone axe = `aria-prohibited-attr` n:1 on every
chrome route; ref axe = 0 occurrences of the rule; the ref's toast container
markup captured via `document.querySelectorAll` on a live add-to-cart.

**Fix:** drop `aria-label="Notifications"` (keep `aria-live="polite"`). The
live region announces its content with no name needed; a nameless live
region is fully valid ARIA. `role="region"` was considered and rejected: it
would add a landmark the reference does not carry (a11y-tree noise), while
dropping the label keeps the documented live-region superset intact and the
markup closer to the reference's.

#### F2 — A11Y-ARIA-2 · the PDP star-rating's `aria-label` sits on a role-less div (same rule, PDP only)

`src/components/store/star-rating.tsx` renders
`<div class="flex items-center gap-1" aria-label="Rated 4.8 out of 5">` —
the same prohibited-attr pattern (axe: 1 node on the PDP). The reference's
rating row is a completely unlabeled
`<div class="flex items-center gap-1">` with decorative svgs and the numeric
`4.8` as a sibling text node.

**Fix:** add `role="img"` to the row (keep the aria-label).
`role="img"` + `aria-label` is the canonical WCAG pattern for a decorative
glyph row with a text alternative — the label becomes VALID, screen readers
announce "Rated 4.8 out of 5, image", and the clone's aria superset over the
reference's unlabeled row is preserved. No computed-style effect (an
attribute only); the star glyphs stay `aria-hidden`.

#### F3 — A11Y-MAIN-1 · four shopper pages render a NESTED `<main>` landmark (invalid HTML + 3 axe landmark rules)

The `(storefront)` layout renders the page's `<main className="flex-1">`
(one landmark per page — the session-7 contract). But FOUR pages render
their OWN `<main className="flex-1">` INSIDE it (the session-7 MAIN-NEST-1
fix covered only the admin pages):

| Route | Code sites |
|---|---|
| `/account` | `src/app/(storefront)/account/page.tsx:52` |
| `/checkout` | `src/app/(storefront)/checkout/page.tsx:22` (empty state) + `:34` (wizard) |
| `/checkout/success` | `src/app/(storefront)/checkout/success/page.tsx:32` |
| `/wishlist` | `src/app/(storefront)/wishlist/page.tsx:20` (empty state) + `:36` (content) |

**Live A/B evidence:** the reference renders EXACTLY ONE `main` on every
page (`main.flex-1`, counted on home/shop/PDP/account); the clone renders
TWO on checkout, wishlist and account (`main.flex-1 > main.flex-1` — the
outer HTML captured live). The account page's axe scan carries the clone-only
`landmark-main-is-top-level` + `landmark-no-duplicate-main` +
`landmark-unique` violations; the ref's account scan carries none. Nested
`main` is invalid HTML (the element's content model forbids it) and confuses
landmark navigation (AT announces "main" twice or merges unpredictably).
Present since session-1 (`0a5a8a0`) — the E2E suites never failed because
`locator("main")`/`getByRole("main")` chains dedupe the shared descendants,
so the nested pair was invisible to every prior computed-style audit.

**Fix:** replace the inner `<main className="flex-1">` with
`<div className="flex-1">` at all 6 code sites — exactly the session-7
admin-page pattern. The `flex-1` is layout-inert either way (the parent
`main` is not a flex container), so the change is a visual no-op; the
E2E `main`-scoped selectors keep resolving (the content stays inside the
single outer main).

#### F4 — SEC-HEADERS-1 · the clone ships zero security headers; the reference ships three

**Live A/B evidence (curl -I on both roots):**

| Header | Reference | Clone |
|---|---|---|
| `referrer-policy` | `strict-origin-when-cross-origin` | — |
| `strict-transport-security` | `max-age=31536000` | — |
| `x-content-type-options` | `nosniff` | — |

A bare Next standalone server sets none of these. For a "production-ready
superset" the clone should carry at least the reference's baseline.

**Fix:** `next.config.ts` `headers()` (applies to the standalone server at
runtime): the three reference headers + `X-Frame-Options: DENY` as the
superset hardening (clickjacking). HSTS over plain HTTP is a spec-defined
no-op (RFC 6797 §7.2 — UAs MUST ignore it on non-secure transports), so the
unconditional value is safe for localhost/E2E. CSP and Permissions-Policy
were considered and deferred: a meaningful CSP needs nonce plumbing through
Next's inline bootstrap (documented as future work), and the site uses no
camera/mic/geo capabilities to fence.

## 3. TDD plan

**RED (new failing tests, `tests/e2e/storefront-parity.spec.ts` — 3, plus
1 in `tests/e2e/smoke.spec.ts`):**

1. "exactly one main landmark per page (session-12, A11Y-MAIN-1)": for
   `/account`, `/wishlist`, `/checkout`, `/checkout/success` (authenticated,
   empty-cart where applicable) assert
   `await page.locator("main").count() === 1`. Pre-fix: 2 on each route.
2. "the toast region is a valid nameless live region (session-12,
   A11Y-ARIA-1)": on `/`, the viewport
   (`div.fixed.bottom-6.right-6`) computes `aria-live="polite"` and carries
   NO `aria-label` attribute. Pre-fix: `aria-label="Notifications"`.
3. "the PDP rating row is a labeled image role (session-12, A11Y-ARIA-2)":
   on the PDP, `main div[aria-label^="Rated"]` has
   `getAttribute("role") === "img"`. Pre-fix: null.
4. "security headers match the reference baseline (session-12,
   SEC-HEADERS-1)" (smoke spec): `page.request.get("/")` → response headers
   include `referrer-policy: strict-origin-when-cross-origin`,
   `x-content-type-options: nosniff`,
   `strict-transport-security: max-age=31536000`, and
   `x-frame-options: DENY`. Pre-fix: all four missing.

**GREEN:**

- T1 (F1): `src/components/store/toast-viewport.tsx` — remove
  `aria-label="Notifications"` (keep `aria-live="polite"`; update the
  divergence comment).
- T2 (F2): `src/components/store/star-rating.tsx` — add `role="img"` to the
  rating row div.
- T3 (F3): 6 sites — `<main className="flex-1">` → `<div
  className="flex-1">` (account, checkout ×2, checkout/success,
  wishlist ×2).
- T4 (F4): `next.config.ts` — `headers()` returning the four headers on
  `/:path*`.

**Regression safety:** T1/T2/T3 are attribute/tag changes with zero
computed-style effect (the parity spec's geometry pins — hero line-heights,
field gaps, star-row classes, toast anatomy — are untouched; the inner
`flex-1` is layout-inert because the parent main is not a flex container).
T4 adds response headers only — no DOM change; HSTS is HTTP-ignored by
spec. The E2E `main`-scoped selectors keep resolving through the single
outer main. None of the four touches a pinned trap from sessions 1–11; the
full 229-test gate re-runs green plus the 4 new tests.

## 4. Sign-off criteria

- [x] Baseline gate green at audit start (229/229, exactly the documented ship state)
- [x] Round-12 audit complete: mobile nav 12th verification; axe differential on 6 routes both sites; console census; 200% reflow; security headers; pixel diffs at baseline
- [x] Findings live-measured on BOTH sites with root causes traced (ARIA prohibited-attr rules; the session-1 nested-main; the bare standalone server)
- [x] RED tests written and confirmed failing for the right reasons (main count 2; aria-label present; role missing; all four headers absent)
- [x] GREEN: one label removal + one role attribute + six main→div swaps + one headers() block
- [x] Full gate green: lint 0/0 · typecheck clean · 88/88 unit · build 23 routes · 145/145 E2E (233 total)
- [x] Live re-verification against the production server (18/18 — single main ×4 routes; toast region nameless + live; rating row role=img; the four response headers; the 12th mobile-nav verification)
- [x] Post-fix axe re-scan: `aria-prohibited-attr` and the three landmark rules GONE from the clone's scans
- [x] Pixel re-diffs of the affected routes unchanged (visual no-op: account 0.35% / PDP 0.72% / wishlist 0.35%)
- [x] Screenshots captured + VLM-verified under `docs/screenshots/` (70–75)
- [x] Docs updated: AGENTS.md (a11y contracts + build-wrapper lesson), CLAUDE.md, README.md, PAD v1.12 (ADR-020), SKILL v1.12.0, session log, worklog
- [x] `.env.example` verified current (no new env plumbing)
- [x] Committed on `main` and pushed via the SSH wrapper
