# Session 6 Log — Round-4 Differential Audit & Money/Interaction Parity Remediation

Continuation of the standing engagement: keep the LUXE Store clone at visual
parity with `fuzzy-lumina-style-hub.base44.app` while extending its functional
superset. This session (round 4) targeted the surfaces earlier rounds had not
measured — money, interaction feedback, auth screen anatomy, and page titles —
plus whatever the live audit surfaced.

## Baseline & review

- Pulled `main` @ `2134652` (clean tree). Read `docs/session_4.md`,
  `docs/session_5.md`, `docs/remediation-plan-session3.md`, the root
  `worklog.md`, and re-verified the documented state: DB hard-link converged
  (inode-matched repo-root `db/custom.db`), `.env` contract correct.
- Ran the full gate on the baseline: lint 0/0 · tsc clean · 52/52 unit ·
  build OK (20 routes) · 88/88 E2E — exactly matching the session-3 ship
  state.
- One E2E failure appeared in the first full run (cart stepper) and passed
  in isolation — investigated instead of shrugged off. Root cause analysis
  found a REAL lost-update race: the drawer stepper posted ABSOLUTE
  quantities (`item.quantity + 1`) computed from stale render state, so two
  rapid clicks both sent the same value. Promoted to audit finding
  CART-RACE-1 (the flake was the symptom, the race was the disease).

## Round-4 live A/B audit (agent-browser, parallel sessions)

Logged into the reference (`sepnetflix2023@outlook.com`), then walked both
sites side-by-side. Findings (IDs used throughout the remediation):

1. **TITLE-1**: clone `/cart` title "Lumina" vs reference "Cart | Lumina".
2. **TITLE-2**: reference PDP titles are the HUMANIZED SLUG ("Wireless
   Headphones | Lumina"), not the product name — verified across all 11
   products; the clone used the full name.
3. **PDP-TABS-1**: reference Reviews empty panel = `div.text-center.py-10`
   with a bare `p`; clone rendered left-aligned muted text.
4. **PDP-TABS-2**: reference Shipping tab = plain `p` elements with a
   literal `✓` prefix; clone used `ul` + lucide Check icons.
5. **SHIP-1**: reference charges FLAT $9.99 shipping under $100 (measured at
   $34.99 and $79.99 subtotals — no tiering); clone charged $5.99.
6. **TOAST-1**: reference fires a dark bottom-right toast on cart adds and
   wishlist ADDS — "«Product» added to cart!", orange CircleCheckBig icon,
   ~3000 ms lifetime (measured 3.35 s incl. latency), spring enter
   (translateY 16→0 + scale 0.96→1), rise-and-fade exit, stacks without
   dedupe, NO toast on wishlist remove. The clone had no toast subsystem.
7. **FOOT-1**: reference footer Join button = 32px height / 12px font;
   clone = 36px / 14px.
8. **FOOT-2**: reference bottom-bar separator = 40px margins / 1px line /
   40px; clone = 48px / border-top / 32px.
9. **FEATURES-1** (long-missed): reference feature bar items are bordered
   cards (`p-6 rounded-2xl bg-card border`, gap-4) with rounded-2xl icon
   tiles; clone rendered bare items with circular icons and gap-6. Found at
   tablet width, confirmed at desktop.
10. **AUTH-ERR-1/2**: reference auth errors render as a tinted BOX
    (`p-3 rounded-lg bg-destructive/10 text-destructive text-sm`) — clone
    used plain red text; duplicate-register copy differs ("A user with this
    email already exists" vs "An account with…").
11. **FP-VALID-1**: reference auth forms rely on NATIVE browser validation
    (no `noValidate`); the clone's forms all carried `noValidate`.
12. **AUTH-VERIFY-1** (major): the reference gates registration behind a
    6-digit "Verify your email" screen (MailQuestionMark tile, 6-box OTP
    input, Resend timer, "Wrong code? Go back to sign up") and BLOCKS
    unverified logins ("Please verify your email before logging in. Check
    your email for the verification code."); wrong codes decrement a
    5-attempt budget ("Invalid verification code. N attempts remaining.").
13. **CART-RACE-1** (from the baseline flake): absolute-quantity steppers
    lose updates under rapid clicks.

Confirmed divergences (documented, not "fixed"): footer Shop-column links
(clone deep-links category filters — superset), toast click-through behavior,
mobile menu auto-close (re-verified at iPhone 14 — panels byte-identical,
backdrop + Escape dismissal identical), search typeahead (clone-only), and
the reference's hardcoded checkout/cart empty states.

Dependency sweeps before planning: no E2E pinned $5.99; both add-to-cart
call sites hold `product.name`; `FLAT_SHIPPING_CENTS` has one consumer;
seeded demo orders store their own totals (unaffected); no spec asserted
feature-bar classes.

Plan: `docs/remediation-plan-session4.md` (T1–T12, validated against the
codebase before execution).

## TDD execution (RED → GREEN)

- **RED**: unit tests for the not-yet-existing `cart-quantity.ts`,
  `format.ts` (humanizeSlug), `verification.ts`; money flat-rate pin updated
  to 999; 13 new E2E tests across smoke/parity/cart/wishlist/auth
  (43 prior passing) — all failing for the right reasons, verified before
  any implementation.
- **GREEN, surgical fixes first**: `FLAT_SHIPPING_CENTS = 999`; FeatureBar
  restyle; footer Join `size="sm"` + separator div; /cart restructured as
  server page (metadata) + `cart-client.tsx` island; `humanizeSlug` in PDP
  `generateMetadata`; PDP Reviews/Shipping panels; shared `auth-error.tsx`
  box + server copy change + `noValidate` removal.
- **GREEN, subsystems**:
  - **Toast stack**: `notify` in StoreProvider + `ToastViewport`
    (`fixed bottom-6 right-6 z-[100]`, dark box, CircleCheckBig accent,
    3000 ms, stacks); enter/exit as CSS `@starting-style` + bouncy bezier
    approximations of the reference's JS spring; region
    `pointer-events-none` + `aria-live=polite` (protects the
    drawer-Checkout click path and keeps semantics).
  - **Transactional delta steppers**: `adjustCartItemAction` →
    `changeQuantityBy` inside `db.$transaction`; remove became its own
    action; pure delta math in `cart-quantity.ts`; both stepper surfaces
    migrated.
  - **Email verification (ADR-011)**: 4 additive `User` columns (db push),
    scrypt-hashed 6-digit codes (15-min TTL, 5-attempt budget),
    `/verify-email` route (server page + OTP client form),
    `verifyEmailAction`/`resendVerificationAction`, register-under-flag,
    login gating — env-GATED behind `AUTH_REQUIRE_EMAIL_VERIFICATION`
    (default OFF: no email provider is wired; codes log at the
    `console.info` seam; an always-on gate would lock every new user out).
    Seeded `unverified@example.com` fixture (code 123456), restored by
    `e2e-reset.ts` every run.
- **Auth screen rebuild**: while wiring the error box, discovered the
  reference's login/register carry the header tile OUTSIDE the card (like
  forgot-password) with `h-12` icon-led inputs and a line-and-label "or"
  divider — rebuilt both forms to that anatomy.

## Two latent bugs found during live re-verification

1. **Guest-token cart mutations (predates this session)**: `getCart` read
   the cookie token, but `addItem`/mutations passed `undefined` — every
   guest add minted a NEW cart and guest steppers read as empty. Never
   caught because every cart/wishlist E2E ran authenticated. Fixed all
   call sites; added `tests/e2e/guest-cart.spec.ts` (storageState opt-out)
   to pin the cookie path forever.
2. **Stale Prisma client in the long-running dev server**: after the schema
   push, the dev server kept the pre-push client (new columns read as
   undefined, tripping an anti-enum branch). The E2E suite (fresh server)
   proved the code correct; restarting dev fixed it. Lesson: restart dev
   after schema pushes.

## Verification (evidence)

- Final gate: **lint 0/0 · tsc clean · 66/66 unit · build OK · 104/104 E2E
  = 170 total** (was 140; nothing removed).
- Unit distribution: money 10 · password 4 · validation 20 · db-path 15 ·
  cart-quantity 5 · format 5 · verification 4 · rate-limit 3.
- E2E distribution: auth 15 · storefront-parity 14 · smoke 11 · account 11
  · search 10 · catalog-parity 10 · cart 10 · mobile-navigation 7 ·
  wishlist 5 · checkout 5 · verify-email 3 · guest-cart 2 · setup 1.
- Live A/B re-verification of every remediated surface: drawer shows
  Shipping $9.99 at $34.99/$79.99 subtotals and Free at $104.97; toasts
  byte-match the reference anatomy and copy on card/PDP/wishlist adds with
  silence on remove; feature bar + footer computed styles match; titles
  ("Cart | Lumina", humanized PDP slugs) match; PDP tab panels match; auth
  error boxes match; the verify-email screen matches and the full
  wrong-code → correct-code flow works live; the rapid-stepper race lands
  3 × $34.99 = $104.97 exactly (reproduced the original failure scenario).
- VLM screenshot comparison: auth screens "essentially identical" (the one
  flag was a captured focus state — re-verified computationally:
  48/48/48 input heights, 24px margins).
- Screenshots: 33 in `docs/screenshots/` (7 new + 3 refreshed).

## Documentation (T9)

AGENTS.md (money/toast/stepper/guest-token contracts, expanded divergence
register, testing quirks), CLAUDE.md (contracts, counts, env var, selector
changes), README.md (features, testing table, $9.99, env vars, mermaid +
hierarchy routes), PAD v1.4 (ADR-011 full record, rebuilt test-distribution
table, gates, checklist, env row, verification seam, key files, glossary),
`ecommerce-store_SKILL.md` v1.4.0 (routes, inventory 55/26, contracts,
anti-pattern rows 16–18, lessons L10–L11, patterns §15.7–15.8, ADR index).
This plan checked off with per-task outcomes.

## Ship (T12)

Conventional commit on `main` (single branch — no new branches), push via
`docs/ssh_git_wrapper_v3.py` with the operator-provided ed25519 key
(materialized outside the repo, shredded after; remote ref verified), per
`docs/how-to-git-push-using-ssh-wrapper_SKILL.md`.
