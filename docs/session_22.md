# Session 22 Log — Round-12 axe-Core Differential Audit + Remediation

**Date:** 2026-10-08 · **Agent:** Super Z (review/build) · **Branch:** `main`
**Baseline:** `5970e9d` (session-11 ship `6d21c58` + the remotely-added
`docs/session_21.md` narrative + `docs/prompt-to-review-2/3.md`)

## Timeline

1. `git pull` brought `docs/session_21.md` + the prompt-to-review records;
   reviewed all root docs + `docs/session_20.md` +
   `docs/remediation-plan-session11.md` + `worklog.md` — everything current
   through session-11 (PAD v1.11, SKILL v1.11.0, the 229-test gate, 13
   traps). Environment intact (`.env` `DATABASE_URL="file:../db/custom.db"`,
   `db/` at repo root, hard-link convergence live at inode 303519; the
   session-11 pins verified in code: font md5, hero `inert`, no
   `antialiased`, the hover variant).
2. **Baseline gate:** lint 0/0 · tsc clean · 88/88 unit · build exit 0 (23
   routes) · 141/141 E2E = 229 — exactly the documented session-11 ship
   state. **Audit artifact en route:** the first E2E run failed at
   `auth.setup.ts` (login never navigated, inputs wiped after fill) — root
   cause: an earlier `bunx next build` (run for route counting) had
   regenerated `.next/standalone` WITHOUT the wrapper's static/public
   copies, so every chunk served HTML and hydration died (`Unexpected
   token '<'` pageerrors — the MIME probe found all `/_next/static/chunks`
   returning `text/html`). Re-running the repo wrapper `bun run build`
   restored the 141/141 green. Lesson recorded in AGENTS.md testing
   quirks + SKILL L19: **never build with the raw `next build` in this
   repo.**
3. **Round-12 live A/B audit** (agent-browser sessions `ref` + `clone`, the
   clone served by the production standalone server on :3000; both sessions
   authenticated; state saved to files before device emulation; axe-core
   4.10.2 injected SAME-version on both sides):
   - **Mobile nav (12th standing verification):** iPhone 14 both sites —
     the Sheet panel class string matches token-for-token (the only
     difference is the attribute ORDER of `w-72 sm:max-w-sm`, which does
     not affect the cascade), pad 24px, gap 16px, bg `rgb(251, 250, 249)`,
     nav `flex flex-col gap-4 mt-8`, all 5 links byte-identical (239×44,
     18px/500). **No Tailwind v4 regression (12th consecutive).**
   - **The round's primary surface — the axe-core differential (6
     routes):** the clone's aria superset holds (0 unlabeled buttons /
     unnamed links vs the ref's 19–20 `button-name` + 2 `link-name` + 4
     `label`; the ref also carries a PDP `landmark-unique` the clone
     lacks). **Methodology trap found and proven:** the ref gates its
     product sections behind framer-motion `whileInView` wrappers
     (`opacity: 0; transform: translateY(20px)` inline until scrolled) —
     axe skips invisible text, so the ref's initial scans under-report
     (home color-contrast 7 nodes); after an incremental full reveal the
     ref reports **28 = exactly the clone's 28** (route-by-route: home
     28=28, shop 23=23, PDP 14=14, cart 8=8, account 8=8, login
     3=3 + identical login violation sets). The white-on-orange badges
     are a SHARED design-system trait (computed styles byte-identical on
     both sites) — registered as considered-and-dismissed (fixing them
     would break visual parity). The clone-only violations became the
     round's findings (below).
   - **New surfaces, all at parity:** 200% zoom reflow (WCAG 1.4.4 —
     512px CSS width, no horizontal overflow on either site);
     console-error census (12 clone routes, ZERO pageerrors/console
     errors); pixel diffs @1024 (home 0.36 / shop 0.40 / PDP 0.72 /
     account 0.35 / cart 0.36 / login 0.28% — at the baseline band; the
     PDP re-capture is reproducible with the ref's self-diff at 0.00%,
     the 4 thin bands sit on text-glyph AA rows — sub-threshold noise).
   - **Findings (4, each with live-measured evidence from BOTH sites):**
     - **A11Y-ARIA-1:** the toast viewport's `aria-label="Notifications"`
       on a role-less div (axe `aria-prohibited-attr`, serious, every
       storefront route). The ref's toast container carries NO aria
       attributes at all (captured live on an add-to-cart).
     - **A11Y-ARIA-2:** the PDP star-rating row's
       `aria-label="Rated 4.8 out of 5"` — the same prohibited pattern
       (the ref's row is a bare unlabeled div).
     - **A11Y-MAIN-1:** four shopper pages shipped a NESTED `<main>` inside
       the storefront layout's `<main>` since session-1 (account,
       checkout ×2 code paths, checkout/success, wishlist ×2 code paths) —
       the session-7 fix covered only the admin pages. axe flagged
       landmark-main-is-top-level + landmark-no-duplicate-main +
       landmark-unique; the ref renders exactly one main per route
       (live-counted). Invisible to eleven computed-style rounds because
       Playwright main-locator chains dedupe shared descendants.
     - **SEC-HEADERS-1:** the clone shipped zero security headers; the
       ref's platform ships `referrer-policy:
       strict-origin-when-cross-origin`, `strict-transport-security:
       max-age=31536000`, `x-content-type-options: nosniff` (curl -I on
       both roots).
4. **Remediation plan** (`docs/remediation-plan-session11.md`'s successor,
   `docs/remediation-plan-session12.md`): findings + evidence + validated
   code sites + TDD plan + sign-off criteria; validated against the
   codebase (the 6 nested-main sites read in source; spec-locator blast
   radius checked — `getByRole("main")` chains survive the fix).
5. **TDD RED:** 4 new tests — the single-main pin (4 routes),
   the nameless-live-region pin, the rating-row role="img" pin, and the
   security-headers pin (smoke). All failed for the right reasons (main
   count 2; `aria-label="Notifications"` present; role missing; all four
   headers absent).
6. **TDD GREEN:**
   - T1 (A11Y-ARIA-1): `aria-label` dropped from the toast viewport (the
     nameless `aria-live="polite"` region keeps the announcement superset).
   - T2 (A11Y-ARIA-2): `role="img"` added to the star-rating row (the
     canonical glyph-row pattern — the label becomes VALID).
   - T3 (A11Y-MAIN-1): `<main className="flex-1">` → `<div
     className="flex-1">` at all 6 code sites.
   - T4 (SEC-HEADERS-1): `next.config.ts` `headers()` — the reference's
     three + `X-Frame-Options: DENY` (superset; HSTS over HTTP is a
     spec no-op per RFC 6797 §7.2).
7. **Gate at ship:** lint 0/0 · tsc clean · 88/88 unit · build exit 0 (23
   routes) · **145/145 E2E = 233 total** (was 229; +4 E2E, none removed) —
   **two consecutive full runs** for determinism.
8. **Live re-verification** (`scripts/verify-session12.ts`): **18/18
   green** — single `<main>` on all 4 routes; the toast region nameless +
   live; the rating row role=img with the label + 5 decorative glyphs; the
   four response headers; the mobile-nav 12th verification re-confirmed
   (panel/nav classes, pad/gap/bg, 5 links @239×44/18px/500).
9. **Post-fix axe re-scan:** the clone's `aria-prohibited-attr` and all
   three landmark violations GONE — the clone's axe profile now contains
   only the SHARED parity violations (color-contrast + heading-order,
   identical to the ref's post-reveal scans).
10. **Pixel re-diff:** unchanged (account 0.35% / PDP 0.72% / wishlist
    0.35%) — the fixes are visual no-ops, confirmed.
11. **Screenshots:** 6 new (70–75, captured by the persisted
    `scripts/capture-session12.ts` — 70–72 the single-landmark surfaces,
    73 the nameless toast region live, 74 the 12th mobile-nav
    verification, 75 the 200% reflow surface; VLM-verified 6/6 from the
    scratch dir — the initial "FAIL"s on 70/71/74/75 were description
    errors: the logo is "LUXE" on both sites, the headphones price is
    $299.99, the open Sheet covers the header logo, and the 512px first
    viewport is the stacked product image) → 75 total. `.env.example`
    verified current (no new env plumbing — headers are config-level).
12. **Docs:** AGENTS.md (the extended one-main rule, the ARIA-label rule,
    the security-headers contract, the bunx-next-build lesson), CLAUDE.md
    (session-12 contracts, 145 E2E, the build warning), README.md (233
    tests, 12th verification, the SEO & ops headers row, the new parity
    gates), PAD v1.12 (ADR-020, revision row, 4 Resolved rows, test
    matrix 233), SKILL v1.12.0 (L18–L19), this session log, the worklog.

## Key decisions

- **A shared axe violation is parity; a clone-only violation is the
  finding.** The badge contrast (3.23:1 white-on-orange) is byte-identical
  on both sites — "fixing" it would break visual parity (the repo's prime
  contract). The differential methodology (same axe version, both sites,
  reveal-adjusted) is what separates signal from noise.
- **The nameless live region over a labeled landmark** — dropping the
  toast label keeps the markup closest to the reference's bare container,
  keeps the announcement superset, and kills the violation; `role="region"`
  was rejected as a11y-tree noise the reference does not carry.
- **`role="img"` over dropping the rating label** — the canonical WCAG
  pattern for decorative glyph rows preserves the clone's aria superset
  while making the label valid.
- **HSTS unconditionally** — RFC 6797 §7.2 makes it a no-op over plain
  HTTP, so localhost/E2E safety is spec-guaranteed; the max-age copies the
  reference's single-year policy.
- **Probe lessons recorded:** `offsetParent` is null for fixed elements
  (probe artifacts); agent-browser `eval` state persists per page
  (redeclare with IIFEs); axe must be re-injected after every navigation
  (per-page script tags); the ref's framer-motion reveals must be fired
  (incremental scroll) before reading its axe scans.

`docs/remediation-plan-session12.md` records the full audit trail.

## Suggested next steps

Round-13 candidates: a meaningful CSP with nonce plumbing (the documented
SEC-HEADERS follow-up), admin order filtering/search (the dashboard
superset), wiring an email provider to activate the ADR-011 verification
gate, Stripe Payment Element (ADR-007's documented next step), or an
automated axe differential as a standing E2E check (self-hosted axe-core
asset to avoid the CDN dependency). Tell me which to pick up and I'll
start the next round.
