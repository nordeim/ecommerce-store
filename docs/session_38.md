# Session 38 Log — Round-20 SEO + Auth-Completion (ADR-028)

**Date:** 2026-10-09 · **Agent:** Super Z (review/build) · **Branch:** `main`
**Baseline:** `5aad157` (the session-19 ship `3cc091e` + the sign-off
commit + the remotely-added `docs/session_37.md` narrative)

## Timeline

1. The workspace had been reset — fresh `git clone` of
   `nordeim/ecommerce-store`; `.env` recreated from `.env.example`. The
   env-shadowing trap live from the first command (the shell exports
   `DATABASE_URL=file:/home/z/my-project/db/custom.db` which WINS over the
   repo `.env`) — `bun run db:setup` run with the repo URL inline, then the
   hard-link convergence restored (inode 172496 at BOTH paths; the
   `tests/db-path.test.ts` contract holds, 15/15). Reviewed all root docs +
   `docs/session_36.md` + `docs/remediation-plan-session19.md` +
   `worklog.md` + `docs/session_37.md` — everything current through
   session-19 (PAD v1.19, SKILL v1.19.0, the 278-test gate, 29 lessons).
   No stale servers live at audit start (the `/proc/net/tcp` walk scanned
   :3000/:3100 clean). The round's :3000 server detached via the
   double-fork orphan pattern.
2. **Baseline gate:** lint 0/0 · tsc clean · 100/100 unit · build exit 0
   (23 routes, zero deprecation warnings) · 178/178 E2E = **278** —
   exactly the documented session-19 ship state, one run.
3. Skills mapped from `skills/skills-catalog.md` (agent-browser, tdd,
   clone-app-pat-pro, code-quality-standards, nextjs-react-expert); the
   session-19 commit audited clean (test-level code + docs only).
4. **Round-20 live A/B audit** (agent-browser sessions `ref` + `clone`;
   the clone on the production standalone server at :3000, ONE host —
   localhost — for the whole lifecycle per L22; states saved before
   device emulation; both sessions logged in — the operator account on
   the reference, the demo user on the clone):
   - **Mobile nav (20th standing verification):** iPhone 14 both sites —
     the Sheet panel class string token-identical (modulo attribute
     order), pad 24px, bg `rgb(251,250,249)`, w-72 (288px), nav `flex
     flex-col gap-4 mt-8`, all 5 links byte-identical (239×44, 18px/500,
     block, same hrefs incl. the category deep-links). Functional check:
     "Electronics" deep-links to `/shop?category=electronics` and the
     sheet auto-closes. **No Tailwind v4 regression (20th consecutive
     verification).**
   - **Standing drift watches:** pixel diffs @1024 on 8 routes — ALL at
     the documented baseline band, byte-identical to the
     session-15/16/17/18/19 numbers (home 0.34 / shop 0.38 / PDP 0.68 /
     cart 0.34 / wishlist 0.34 / checkout 0.35 / account 0.34 / login
     0.28). Typeahead watch: the reference fires ZERO search network
     requests (fetch + XHR instrumented; search expanded via its icon
     button). Carousel cadence watch: both sites flip at the same ~5.0s
     stable interval (ref 5000/5000ms; clone 5000/5003ms — the first
     shorter interval on each side is the probe's mid-cycle entry
     artifact).
   - **The round's primary new surface — the SEO/SITEMAP differential**
     (the user's standing round instruction: "Check for Sitemap
     implementation and SEO optimization"; both sites measured live):
     the reference's platform sitemap = 10 app routes incl. PRIVATE ones
     (`/account`, `/checkout`, `/cart`) at 0.8/weekly with **ZERO
     product URLs**; the clone's sitemap = 5 curated public routes +
     **all 12 product URLs with `lastModified`** (the SEO superset,
     confirmed). The reference's robots = allow-all; the clone correctly
     disallows the 4 private families. **The reference's own sitemap
     lists `/reset-password` — a REAL route the clone 404s** (measured
     live: no-token → the "Invalid reset link" screen; any token → the
     "New password" form; a bogus token on submit → the tinted error box
     "Invalid or expired reset token"; mismatched passwords →
     "Passwords do not match" CLIENT-SIDE FIRST; the full head set with
     og:url PRESERVING the token query) — **RESET-ROUTE-1, the auth
     family's missing member, a genuine parity defect.** The sitemap +
     robots files had ZERO regression pins (SEO-GATE-1); neither site
     ships structured data (JSON-LD-1). The reset-password axe
     differential (`scripts/axe-diff-session20.mjs`): the reference's
     census {color-contrast} × 1 at both viewports in both states.
5. **The remediation plan written and validated**
   (`docs/remediation-plan-session20.md` — the fix design checked
   against the codebase: the `PasswordResetToken` model keyed by
   `tokenHash` (NOT fields-on-User — the link carries only the token),
   the `pageMetadata` static-page pattern with query-preserving
   `generateMetadata`, the e2e-reset fixture design with a DEDICATED
   `resetuser@example.com` (john untouched — the login rate limit is
   keyed per IP+email), the JSON-LD placement (outside pinned child
   lists), the smoke nonce-test refinement (data blocks skipped).
6. **TDD RED:** the reset-token lib unit tests failed on the missing
   module; the four auth.spec reset tests failed on the 404 page; the
   seo.spec tests failed on the missing JSON-LD nodes (the sitemap/robots
   pins passed — the implementation already shipped them; the GATE is
   what was missing).
7. **TDD GREEN (with two live design corrections):**
   - **L31 discovered live:** the first token design used scrypt for the
     tokenHash — every reset attempt read "Invalid or expired reset
     token" because scrypt's per-call random salt makes the same input
     produce a DIFFERENT digest (a lookup key can never be salted). The
     fix: sha256 hex indexing (the `src/lib/auth.ts` Session-token
     pattern — deterministic for high-entropy tokens). Unit test added
     pinning the determinism.
   - The JSON-LD array shape on home was split into one-node-per-script
     (the standard shape, simpler to pin); the regex in the smoke
     refinement needed `\/` escaping inside the character class (an
     unescaped `/` terminates the regex literal — a lint catch).
   - `/reset-password` shipped: both measured states, the
     `resetPasswordAction` (transactional password rotation + token
     consumption + session invalidation), the request flow's token
     issuance logged at the `console.info` seam (the anti-enumeration
     response unchanged), the e2e-reset fixture.
   - The JSON-LD layer: Organization + WebSite on home, Product with
     offers (DECIMAL USD, availability from live stock, aggregateRating
     when rating > 0) on the PDP.
8. **The one suite-level regression, bisected to a latent race (L30):**
   the full gate's first run failed `cart.spec`'s "the full-page cart
   mirrors the drawer" — the unscoped `getByRole("link", { name:
   "Checkout" })` matched BOTH the page's link AND the cart drawer's
   exit-animation remnant. Bisection: solo runs pass; the
   preceding-specs sequence fails; WITHOUT the four new auth tests it
   STILL fails; the baseline worktree PASSES the same sequence; with
   the four new axe tests removed it PASSES — the four axe-gate
   additions shifted the suite timing enough to expose a latent
   19-round-old race (the drawer's exit animation leaves its portal
   content ~500ms; the animationend timings measured byte-identical on
   both builds: 137/487ms vs the baseline's 142/506ms). The fix: the
   assertion scoped to the main region (`getByRole("main").getByRole(...)`)
   — the test's intent, not a weakening. One false "still failing"
   mid-bisection was a stale :3100 server (`reuseExistingServer` serving
   the pre-rebuild build — the L25 :3100 variant, documented).
9. **Quad mutation efficacy check** (one at a time, rebuild, run, verify
   the failure REASON, revert, GREEN):
   - **Mutation 1 — the sitemap product-URL contract:** filtering
     wireless-headphones out of the sitemap query → the seo spec's
     census pin FAILS (17 → 16 URLs, the exact expected array printed).
   - **Mutation 2 — the robots contract:** dropping the `/account`
     disallow → the robots pin FAILS at the exact assertion line.
   - **Mutation 3 — the JSON-LD price:** passing integer cents as the
     schema.org decimal → the Product-schema price pin FAILS (29999 vs
     299.99).
   - **Mutation 4 — the axe label association (L29-aware):** removing
     the Confirm Password input's `Label htmlFor` AND its
     `••••••••` placeholder → the reset-password (token) axe tests FAIL
     with `label(1)` at BOTH viewports while the no-token tests and the
     other auth screens stay GREEN.
   - All reverted (git-diff clean) → GREEN again.
10. **Gate at ship:** lint 0/0 · tsc clean · **104/104 unit** (+4
    reset-token) · build exit 0 (23 routes, zero deprecation warnings) ·
    **192/192 E2E = 296 total** (was 278; +4 auth + 6 seo + 4 axe, none
    removed) — **two consecutive full E2E runs** for determinism (the
    L25 stale-server discipline before each).
11. **Live re-verification:** the :3000 production server restarted on
    the current build; pixel re-diff — all 8 routes at the identical
    baseline numbers (the route + JSON-LD additions are
    rendering-neutral, empirically confirmed). **The 20th mobile-nav
    screenshot is BYTE-IDENTICAL (md5 `05de11678965f30a85f9196c2ec43bae`)
    to the 13th through the 19th** — eight consecutive rounds of
    rendering continuity. The diff script persisted
    (`scripts/axe-diff-session20.mjs`) + the capture script
    (`scripts/capture-session20.ts`) + the VLM verification script
    (`scripts/vlm-verify-session20.mjs`).
12. **Screenshots:** 6 new (111–115, with 114 split a/b — 111 the
    SEO/sitemap differential table, 112 the 20th mobile-nav verification,
    113 the SEO gate live run, 114a/114b the reset-password route's two
    states, 115 the quad mutation efficacy proof) → 116 total.
    VLM-verified 6/6 (via the SDK's `createVision`; the transient SDK
    install reverted). Dev-DB hygiene run clean (canonical 3 orders).
    `.env.example` verified current (no new env plumbing — the token
    seam reuses the console.info contract).
13. **Docs:** AGENTS.md (the RESET-ROUTE-1/SEO-GATE-1/JSON-LD-1
    contracts + the L30/L31 lessons + the A11Y-GATE-3 extension note +
    the smoke refinement), CLAUDE.md (the session-20 contract, 104 unit
    / 192 E2E), README.md (296 tests, the auth/SEO rows, 20th
    verification), PAD v1.20 (ADR-028 + revision row + 2 Known-Issues
    Resolved rows + matrix 31/296), SKILL v1.20.0 (L30 + L31 + the
    ADR-index entry), this session log, the worklog.

## Key decisions

- **The SEO check drove the round (the user's standing instruction):**
  the first SEO/sitemap differential on both sites found ONE parity
  defect (the missing `/reset-password` route — discovered because the
  reference's own sitemap lists it) and two gaps (the un-pinned SEO
  layer, the absent structured data). One audit surface, three
  deliverables — the session-9 social-metadata precedent.
- **The token design corrected live (L31):** scrypt's per-call random
  salt makes it unusable as a lookup key; the sha256-indexed
  Session-token pattern is the codebase convention for high-entropy
  tokens. The unit test pins the determinism.
- **The session-invalidation superset decision:** a successful reset
  deletes every session (the standard security behavior) and routes to
  `/login` (no auto-login). The reference's post-success state is
  unmeasurable without a real reset email — registered as the superset
  decision, pinned by the full-flow test (the old session cookie is
  gated to /login?redirect=).
- **The dedicated fixture user:** `resetuser@example.com` (the
  unverified@example.com precedent) so the demo user's login budget and
  storageState are untouched — the login rate limit is keyed per
  IP+email, so the reset spec's logins draw from their own bucket.
- **The JSON-LD placement discipline:** data blocks render as fragment
  SIBLINGS, never inside a pinned child list (the home wrapper's 8
  children are the session-5 parity contract — the first placement
  inside the div failed the storefront-parity spec immediately).
- **The cart-race fix is a scoping refinement, not a weakening (L30):**
  the assertion now matches the page's own Checkout link exactly
  (`getByRole("main").getByRole(...)`) instead of also matching the
  drawer's exit-animation remnant; the drawer behavior measured
  byte-identical to the baseline.

`docs/remediation-plan-session20.md` records the full audit trail.

## Suggested next steps

Round-21 candidates: INP pins (the scripted interaction protocol — the
deterministic next CWV family; needs a repeatably-driven interaction set
like the cart stepper or the search typeahead), an email provider to
activate the ADR-011 verification gate + the ADR-028 reset delivery
(external credentials), or Stripe Payment Element (ADR-007's documented
next step, external credentials). Just say the word.

## Ship

Committed on `main` and pushed via `docs/ssh_git_wrapper_v3.py` (the
paramiko-shim Appendix-A deployment — no OpenSSH binary in this sandbox).
The wrapper's post-push verification confirmed `refs/heads/main @ <HEAD>
== local HEAD` and synced `refs/remotes/origin/main`. The operator key
shredded. The remediation plan's final sign-off item checked off in the
follow-up commit.
