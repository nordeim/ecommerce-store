# Remediation Plan — Session 3 Review (Round-3 Differential Audit)

**Date:** 2026-10-07
**Repo:** `nordeim/ecommerce-store` (branch `main`, baseline `e7b119b` / `8187307`)
**Author:** Review/build agent (Super Z)
**Scope:** Live differential audit (round 3) of the LUXE Store clone against the
reference (`fuzzy-lumina-style-hub.base44.app`), covering the surfaces prior
sessions had not yet A/B-verified: the forgot-password flow, auth form fields,
account Profile/Addresses/Settings tabs, shop active-filter chips and empty
state, PDP related-products membership, hero carousel dots, plus a full mobile
re-verification pass. The `skills/` folder is excluded from code checking,
testing and compilation per the operating contract.

**Method:** Both sites driven side-by-side with agent-browser (two sessions:
`ref` = production reference, `clone` = local dev server on the current
commit), DOM/computed styles as ground truth, VLM cross-checks where useful,
full verification gate re-run at audit start (lint 0/0 · tsc clean · 45 unit ·
build OK · 72 E2E — matched documented status exactly).

---

## 1. Baseline verification (state at audit start)

| Gate | Result |
|---|---|
| `bun run lint` | 0 errors, 0 warnings |
| `bun run typecheck` | clean |
| `bun run test` (Vitest) | 45/45 passed |
| `bun run build` | compiles, 19 routes |
| `bun run test:e2e` (Playwright) | 72/72 passed |
| DB contract | `db/custom.db` at repo root (hard-linked with the sandbox-injected path, shared inode); `.env` = `file:../db/custom.db` |
| Test suites | Vitest 5 + Playwright 1.63 configured and green |

### Verified at parity this round (no action required)

- **Mobile navigation menu (explicit re-verification, user priority):**
  panel byte-identical to the reference (288×844 Sheet at 0,0, identical class
  string incl. the nav wrapper `flex flex-col gap-4 mt-8` — the v4 trap-log
  #5 pin holds; identical link classes `text-lg font-medium …`), body scroll
  lock while open, backdrop-click dismissal, Escape dismissal, in-dialog link
  navigation works on both. The post-navigation divergence is unchanged and
  remains a documented deliberate superset (reference's Sheet STAYS OPEN after
  navigating — re-verified live twice this session; the clone auto-closes).
- **Hero carousel behavior:** auto-advance every 5s on BOTH sites in the same
  slide order (Spring Collection 2026 → Tech Essentials → Home & Comfort);
  prev/next arrow buttons byte-identical; mobile hero identical (422×358,
  radius 16px — v4 radius pin holding). (An initial "clone doesn't
  auto-advance" finding was a measurement artifact: the clone keeps inactive
  slide text in the DOM, so `querySelector('h1')` must be filtered by
  `checkVisibility()`.)
- **Shop filters:** category deep-link (`/shop?category=home-living` → same 4
  products, same h1), category dropdown switching, price dropdown options and
  filtering behavior (identical product sets on both sites), filter bar
  combobox classes.
- **Header:** sticky positioning, `bg-background/80 backdrop-blur-xl`, border,
  no scroll-shadow change — identical.
- **Product card hover:** `group-hover:scale-105` + identical transition classes.
- **Newsletter (resting state):** identical input/button; the clone's
  post-submit confirmation is a functional superset (the reference's form does
  nothing at all).
- **Mobile layouts (v4 responsive sweep):** shop grid 2-col, PDP gallery 358px,
  h1 sizes, no horizontal overflow anywhere.
- **PDP buy panel:** Add to Cart button (`h-10 px-8 flex-1 rounded-xl gap-2`)
  and stepper structure identical.
- Prior-session surfaces re-confirmed where touched: account tabs list, Orders
  tab, category cards, footer.

## 2. Issue inventory

### AUTH-1 — Missing `/forgot-password` flow; login link wrong style + disabled
- **Severity:** High (a whole reference route is missing; the login link is a
  visible style + behavior diff)
- **Evidence (live):** Reference login's "Forgot password?" link:
  `text-xs text-primary hover:underline`, `href="/forgot-password"`, enabled
  (tabIndex 0). Clone: `text-sm`, `aria-disabled="true"`, `tabIndex={-1}`,
  `href="/login"` (self-link). The reference's `/forgot-password` is a real
  standalone screen (no site chrome — same family as login/register):
  - Wrapper: `min-h-screen flex items-center justify-center bg-background px-4`
    > `w-full max-w-md`.
  - Header block `text-center mb-10`: `w-14 h-14 rounded-2xl bg-primary`
    tile with `Mail` icon (`h-7 w-7 text-primary-foreground`); h1
    `text-3xl font-bold tracking-tight` "Reset password"; sub
    `text-muted-foreground mt-2` "We'll send you a link to reset it".
  - Card `bg-card rounded-2xl shadow-sm border border-border p-8` with a
    `space-y-4` form: "Email address" label, relative input with `Mail` icon
    (`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`)
    and `pl-10 h-12`, `placeholder="you@example.com"`, `autocomplete="email"`;
    submit "Send reset link" — `w-full h-12 font-medium px-4 py-2` primary
    (note: `shadow`, not `shadow-sm`).
  - Below the card: `p.text-center.text-sm.text-muted-foreground.mt-6` with
    `a.text-primary.font-medium.hover:underline` → `/login`, ArrowLeft icon
    `w-3 h-3 inline mr-1` + "Back to log in".
  - After submit the form is replaced by
    `p.text-sm.text-foreground.text-center`: "If an account exists with that
    email, you'll receive a password reset link shortly."
  - Document title: "Forgot Password | Lumina".
- **Fix:** new route `src/app/(auth)/forgot-password/page.tsx` (standalone
  chrome from the `(auth)` group layout), reference-exact anatomy, real
  server action (`requestPasswordResetAction`): Zod-validated email,
  rate-limited, anti-enumeration (always the same neutral success message),
  persisted as a no-op seam ready for email infra. Login link becomes
  `text-xs`, enabled, `href="/forgot-password"`.

### AUTH-2 — Register form has an extra Name field; password placeholders missing
- **Severity:** Medium (visible form-structure diff on a parity surface)
- **Evidence:** Reference register fields: `Email`, `Password`
  (`placeholder="••••••••"`), `Confirm Password`
  (`placeholder="••••••••"`), `autocomplete="new-password"`. Clone adds a
  `Name` field ("Jane Doe") the reference does not have, and its password
  inputs have no placeholder.
- **Fix:** remove the Name field from the register form; add
  `placeholder="••••••••"` to both password inputs (and the login password —
  see AUTH-3). The DB keeps `User.name` (required): the action derives a
  display name from the email local part (`john.doe@…` → "John Doe") when no
  name is posted — production apps collect the name later in Profile.
  `registerSchema.name` becomes optional with a derive step in
  `registerAction`; existing E2E specs updated accordingly (they currently
  `getByLabel("Name").fill(...)`).

### AUTH-3 — Login password placeholder missing
- **Severity:** Low
- **Evidence:** reference login password input has
  `placeholder="••••••••"`; clone's is empty.
- **Fix:** add the placeholder.

### ACCT-1 — Profile tab avatar shows initials instead of the User icon
- **Severity:** Medium (the avatar block is the tab's visual anchor)
- **Evidence:** Reference: `h-20 w-20 rounded-full bg-primary/10 …` containing
  `lucide-user h-8 w-8 text-primary`. Clone renders initials text
  (`text-2xl font-semibold text-primary` → "JD").
- **Fix:** render the lucide `User` icon (`h-8 w-8 text-primary`) in the
  `bg-primary/10` circle; drop the `initials()` helper.

### ACCT-2 — Addresses tab button styles and card anatomy differ
- **Severity:** Medium
- **Evidence (live reference DOM):**
  - "Add New": outline variant — `border border-input bg-transparent shadow-sm
    hover:bg-accent hover:text-accent-foreground h-8 px-3 text-xs rounded-lg`.
    Clone: primary filled `bg-primary … rounded-xl`.
  - "Edit": ghost — `hover:bg-accent hover:text-accent-foreground h-8
    rounded-md px-3 text-xs`. Clone: outline.
  - Address card: single `p-4 bg-secondary/30 rounded-xl border-2
    border-primary/20` (default address highlighted). Clone:
    `grid grid-cols-1 sm:grid-cols-2 gap-4` of
    `p-4 rounded-xl border border-border/50` cards.
  - Label row: reference shows only the `Default` badge (with `mb-2` on the
    badge); clone adds a `Home` uppercase label span the reference does not
    have.
- **Fix:** swap button variants/classes; single-card layout with the
  highlighted default; remove the label span. Keep the working Add/Edit form
  (superset) and its behavior.

### ACCT-3 — Settings tab: missing "Change Password" heading + section spacing
- **Severity:** Medium
- **Evidence:** Reference card content: `p-6 pt-0 space-y-6` with an `h3
  font-medium mb-2` "Change Password" heading and fields in
  `space-y-3 max-w-md` (labels without `mb-2 block`, inputs with `mt-1.5`),
  then an `h3 font-medium mb-2` "Notifications" section. Clone: `space-y-4`,
  no Change Password heading, fields in `grid grid-cols-1 gap-4 max-w-md`,
  `h3 font-semibold mb-1` headings, labels `mb-2 block`.
- **Fix:** match the reference section anatomy. KEEP the clone's extra
  "Session / Log out" card — the reference has NO logout anywhere on the
  account page (verified: header user icon is a plain /account link, Settings
  has no logout), so the clone's logout is a required production superset.

### SEARCH-1 — Shop lacks active-filter chips; empty state copy/structure drift
- **Severity:** Medium
- **Evidence:** Reference shows an active-filter chip row
  (`div.flex.flex-wrap.gap-2.mb-6`) between the filter bar and the results,
  on empty AND non-empty result sets. Chips = Badge (secondary, `rounded-full
  cursor-pointer gap-1`) with an `X` icon (`h-3 w-3`); clicking removes that
  filter. Chips exist for **category** (plain name, e.g. "Accessories") and
  **search** (quoted term, e.g. `"watch"`); price and sort produce NO chips
  (verified live with combined params). The clone has no chip row at all.
  Empty-state diffs: reference icon circle `mb-4` (clone `mb-6`), heading
  `h3 text-lg font-semibold` (clone `h2 text-xl`), copy "Try adjusting your
  filters or search terms." (clone "…your search or filters."), button "Clear
  all filters" (clone "Clear All").
- **Fix:** add the chip row to the shop page (server-rendered links to the
  URL minus that param — deep-linkable superset behavior, same as the rest of
  the filter bar); correct the empty-state structure and copy.

### PDP-1 — Related products membership differs
- **Severity:** Medium
- **Evidence:** Reference "You May Also Like" = ALL same-category products
  excluding self, in array order — no cap, no cross-category fill
  (headphones → [smart-speaker, charging-pad]; ceramic-planter →
  [linen-blanket]; titanium-sunglasses → [leather-watch]). Clone takes 4
  same-category and back-fills from other categories (headphones → 4 cards).
  Grid classes are already identical.
- **Fix:** drop `take: 4` and the fallback query in
  `src/app/(storefront)/product/[slug]/page.tsx`.

### HERO-2 — Hero dot pagination style drift
- **Severity:** Low
- **Evidence:** Reference active dot: `h-2 rounded-full transition-all
  duration-300 w-8 bg-white` (32px, 300ms transition); inactive: `… w-2
  bg-white/50` with NO hover style. Clone: active `w-6` (24px), no
  `duration-300`, inactive adds `hover:bg-white/80`.
- **Fix:** pin the dot classes to the reference (`w-8` active, `duration-300`
  on both, no hover variant). Keep the aria-labels + `aria-current`
  (a11y superset).

## 3. Deliberate divergences confirmed this round (document, do not "fix")

1. **Hero hover-pause** — the clone pauses auto-advance on mouseEnter; the
   reference keeps cycling while hovered (verified live, 11s hover). The
   clone's pause is production-correct carousel UX; documented as superset.
2. **Session / Log out card** (Settings tab) — the reference has no logout
   affordance anywhere; the clone needs one.
3. **Newsletter confirmation** — the reference's submit is a no-op; the clone
   shows "Thanks for subscribing!".
4. **URL-synced filters/sort** — the reference SPA never updates the URL for
   category/price/sort changes (search deep-links work); the clone keeps
   every state deep-linkable.
5. **Mobile menu auto-close** — re-verified live: the reference's Sheet stays
   open after link navigation; the clone closes (documented since session 2).
6. **a11y labels** — carousel prev/next/dots, mobile nav heading + nav
   landmark, form labels with `for`/`id`: all superset additions on otherwise
   byte-identical class strings.

## 4. Remediation ToDo list (execution order)

TDD applies to every code change: red → green, one vertical slice at a time.
E2E specs are the seams for page behavior; the suite boots the production
build on the isolated e2e DB (`db/e2e.db`).

- [x] **T1 (AUTH-1)** — RED: new `tests/e2e/auth.spec.ts` cases: (a) login
  shows an ENABLED "Forgot password?" link styled `text-xs` linking to
  `/forgot-password`; (b) `/forgot-password` renders standalone (no header),
  h1 "Reset password", email field, "Send reset link"; (c) submitting an
  email replaces the form with the neutral confirmation copy; (d) "Back to
  log in" navigates to `/login`. GREEN: add the route + page +
  `requestPasswordResetAction` (Zod email, rate limit, anti-enumeration),
  fix the login link. **Done** — route + action shipped; auth pages also
  gained per-route Metadata ("Login/Register/Forgot Password | Lumina",
  matching the reference titles) via server `page.tsx` wrappers.
- [x] **T2 (AUTH-2 + AUTH-3)** — RED: update auth specs — register form has
  exactly [Email, Password, Confirm Password] (no Name), password inputs
  carry the `••••••••` placeholder on login + register; registration without
  a Name field succeeds and lands on /account. GREEN: remove the Name field,
  add placeholders, make `registerSchema.name` optional + derive display
  name from email local-part in `registerAction`; update
  `src/lib/validation.test.ts` (name-omitted case + derive unit tests).
  **Done** — 7 new unit tests (13 → 20 in validation.test.ts).
- [x] **T3 (ACCT-1)** — RED: account spec asserts the avatar circle contains
  a User icon (svg) and NOT initials text. GREEN: swap initials →
  `User` lucide icon. **Done.**
- [x] **T4 (ACCT-2)** — RED: account spec asserts Add New outline + Edit
  ghost computed styles, the highlighted single-card layout
  (`border-2 border-primary/20`), and the absence of the "Home" label span.
  GREEN: restyle per the reference DOM. **Done** — computed-style assertions
  (border 2px / lab() border color regex / ghost h-8 text-xs) verified
  against the live reference (the ref's `rounded-lg` = 12px via the shadcn
  `--radius` pin — initial 8px expectation was a test bug, corrected).
- [x] **T5 (ACCT-3)** — RED: account spec asserts the "Change Password" h3
  and section structure. GREEN: restructure the Settings card (space-y-6,
  h3 font-medium mb-2, space-y-3 max-w-md fields); keep the Session card.
  **Done.**
- [x] **T6 (SEARCH-1)** — RED: search/smoke spec — (a) `/shop?search=watch`
  shows a `"watch"` chip; clicking it returns to the unfiltered shop;
  (b) `/shop?category=accessories` shows an "Accessories" chip; price/sort
  params show NO chips; (c) empty search shows h3 "No products found", the
  reference copy, and a "Clear all filters" button. GREEN: implement the
  chip row + empty-state fixes in the shop page. **Done** — chips are
  server-rendered deep links (URL minus that param).
- [x] **T7 (PDP-1)** — RED: catalog-parity spec — related section for
  wireless-headphones = exactly [smart-speaker, charging-pad];
  ceramic-planter = [linen-blanket]; titanium-sunglasses = [leather-watch].
  GREEN: remove take/fallback from the related query. **Done.**
- [x] **T8 (HERO-2)** — RED: storefront-parity spec — active dot computed
  width 32px, transition-duration 300ms. GREEN: pin the dot classes.
  **Done** — `w-8` active, `duration-300`, no hover variant.
- [x] **T9 (docs)** — Update `AGENTS.md` (divergence register: hover-pause,
  logout card, newsletter confirmation; auth route list), `CLAUDE.md` (test
  counts, register contract), `README.md` (features/testing), PAD (ADR-010
  auth parity + anti-enumeration; test distribution), this plan checked off.
  **Done** — PAD v1.3; the stale "62 E2E" row in README's testing table also
  corrected.
- [x] **T10 (SKILL)** — Refresh `ecommerce-store_SKILL.md` sections touched:
  route inventory (+/forgot-password), auth forms contract, account tabs
  anatomy, shop chips, related-products rule, hero dots, divergence
  register, test counts. **Done.**
- [x] **T11 (screenshots)** — Capture: forgot-password (initial + success),
  refreshed login (link style), refreshed register (3 fields), account
  profile (icon avatar), addresses (highlighted card), settings (Change
  Password heading), shop with chips + empty search state, PDP related
  (2 cards), hero (dots). Keep the existing set intact otherwise. **Done** —
  4 refreshed + 7 new (20–26), 26 total, VLM-verified.
- [x] **T12 (gate + ship)** — Full gate
  (`lint && typecheck && test && build && test:e2e`), live A/B re-verification
  of every remediated surface, conventional commit on `main`, SSH-wrapper
  push per `docs/how-to-git-push-using-ssh-wrapper_SKILL.md` (explicit
  `--remote git@github.com:nordeim/ecommerce-store.git`), key shredded.
  **Done** — gate green: lint 0/0 · tsc clean · 52 unit · build OK · 88 E2E
  (140 total); live A/B re-verification of every remediated surface
  (forgot-password flow, login/register, all 3 account tabs, chips + empty
  state, related products, hero dots) confirmed matching; committed and
  pushed via the wrapper.

## 5. Validation of this plan against the codebase

- `(auth)` route group exists with a standalone layout — the new
  forgot-password page drops in with zero chrome work.
- `src/lib/rate-limit.ts` already exposes `rateLimit(bucket, limit, window)`
  used by `loginAction` — the reset action reuses it (new bucket name).
- `registerSchema`/`registerAction`/`validation.test.ts` are the only name
  consumers; `User.name` stays required in Prisma (derive in the action, no
  schema change, no migration).
- E2E dependency sweep: `tests/e2e/auth.spec.ts` fills `getByLabel("Name")`
  in 3 tests (must be updated with T2); `account.spec.ts` asserts
  tab names/John Doe/Save Changes/Add New/Default/Full Name — all unaffected
  by the restyling; `search.spec.ts` asserts `1 product found` (chip row is
  additive); smoke/catalog specs assert card order and section membership —
  unaffected; storefront-parity asserts the hero CTA, not the dots (new
  assertions added by T8); no spec touches the related section today.
- The shop page is a Server Component reading `searchParams` — the chip row
  is server-rendered links (no client state needed); the empty state and
  filter bar are in the same file.
- The hero dots live in `src/components/store/hero-carousel.tsx` (client) —
  class-only change.
- Anti-enumeration note: `requestPasswordResetAction` MUST NOT reveal whether
  the email exists (same neutral copy as the reference) and is rate-limited;
  no email is actually sent (no infra) — a `console.info` seam documents
  where the send plugs in.

## 6. Sign-off criteria

1. Full gate green (lint 0/0, tsc clean, unit suite, production build, E2E
   suite — counts may grow, never shrink coverage).
2. Live A/B re-verification: forgot-password flow (structure + behavior),
   login/register forms, account Profile/Addresses/Settings, shop chips +
   empty state, PDP related membership, hero dots — all matching.
3. Docs + SKILL.md updated; screenshots refreshed for changed surfaces.
4. Single-branch (`main`) history; pushed and remote-verified via the SSH
   wrapper; operator key shredded.
