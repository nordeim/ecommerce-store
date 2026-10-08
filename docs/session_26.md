# Session 26 Log — Round-14 Delivery-Layer Differential + CSP Nonce Pipeline

**Date:** 2026-10-08 · **Agent:** Super Z (review/build) · **Branch:** `main`
**Baseline:** `7d9fb52` (the session-13 ship `fd6b909` + the
remotely-added `docs/session_25.md` narrative)

## Timeline

1. `git pull` brought `docs/session_25.md` (the session-13 round
   narrative, added remotely); reviewed all root docs +
   `docs/session_24.md` + `docs/remediation-plan-session13.md` +
   `worklog.md` — everything current through session-13 (PAD v1.13,
   SKILL v1.13.0, the 248-test gate, 13 traps). Environment intact:
   `.env` `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo
   root, hard-link convergence live at inode 303519; the session-13
   deliverables verified in code (the seam, the island, the page
   wiring, 80 screenshots, `.env.example` byte-identical to `.env`).
2. **Baseline gate:** lint 0/0 · tsc clean · 100/100 unit · build exit 0
   (23 routes, via the repo wrapper) · 148/148 E2E = **248** — exactly
   the documented session-13 ship state, one run.
3. **Round-14 live A/B audit** (agent-browser sessions `ref` + `clone`,
   the clone served by the production standalone server on :3000; both
   sessions authenticated):
   - **Mobile nav (14th standing verification):** iPhone 14 both sites —
     the Sheet panel class string token-identical, pad 24px, gap 16px,
     bg `rgb(251,250,249)`, w-72 (288px), nav `flex flex-col gap-4
     mt-8`, all 5 links byte-identical (239×44, 18px/500, block, same
     hrefs). Functional check: "Electronics" deep-links to
     `/shop?category=electronics` and the sheet auto-closes (the
     documented superset). **No Tailwind v4 regression (14th
     consecutive verification).**
   - **The round's primary new surface — the delivery-layer
     differential:** home request census (ref 22 requests — 1 SPA
     bundle + Google-fonts chain + 5 platform API calls; clone 40 — 12
     route-split JS chunks + 12 Next Link RSC prefetches + the inert
     hero slides' images); compressed transfer sizes (curl, each site's
     own production encoding): document 15,031B gzip (the FULL SSR
     first paint; raw 118,754B) vs 3,193B brotli (an empty SPA shell —
     the trade round-13's CWV differential already quantified); JS
     177,282B across 12 gzip chunks vs 213,545B single brotli bundle;
     CSS 24,179B vs 12,587B; **font byte-identical at 27,348B** (the
     session-11 FILE-parity contract re-confirmed); asset caching
     STRONGER on the clone (`max-age=31536000, immutable` + ETag vs
     the reference's 7-day `max-age=604800`); the encoding gap
     (brotli vs gzip — Node's standalone server does not ship brotli)
     recorded as reverse-proxy territory, not a code change. **The
     delivery layer measures as a functional superset.**
   - **Standing drift watches:** pixel diffs @1024 on 8 routes — home
     0.35 / shop 0.34 / PDP 0.63 / cart 0.34 / login 0.27 / wishlist
     0.34 / checkout 0.35 / account 0.34-after-relogin — all at the
     0.27–0.63% baseline band; home product-card census byte-identical
     (22 link texts); carousel advances at exactly 5.0s on both sites
     with the pointer off the hero (the clone's pause-on-hover — the
     documented divergence — re-confirmed); console census on 7 routes
     zero entries; the reference's typeahead still fires ZERO search
     network requests (the clone's `/api/search` stays the registered
     superset).
   - **The audit artifact that became the round's process lesson:** the
     first two account captures read **22.08%** — the EXACT number
     round-13 had attributed to a "mid-hydration frame". Root cause
     this round (demonstrated twice): **cookies do not cross hosts** —
     the logins ran on `localhost:3000` while the sweep captured
     through `127.0.0.1:3000`, so /account guest-gated to /login and
     the screenshot contained the login page (a byte-stable,
     deterministic diff — 173,614 differing pixels every run; a
     hydration race would show frame variance). Round-13's diagnosis is
     corrected in the docs. (The recapture script's auth guard also
     silently passed on a JSON-quote mismatch — `"/login"` ≠ `/login`
     — recorded with the lesson.)
4. **Remediation plan** (`docs/remediation-plan-session14.md`): the
   audit record + the fix design for the round's finding —
   **SEC-CSP-1, the last nominated security item** (deferred twice
   since ADR-020: "a broken CSP nonce pipeline bricks hydration
   system-wide"). Validated against the codebase before writing: the
   Next 16 nonce mechanism verified in source
   (`parse-request-headers.js` → `getScriptNonceFromHeader` →
   app-render nonce propagation); the codebase's footprint measured
   (zero inline styles, no `notFound()` calls, one image CDN host,
   self-hosted font, same-origin APIs); the only static HTML pages
   enumerated (register + forgot-password; `/_not-found` unreachable).
5. **TDD RED:** 2 E2E tests in `smoke.spec.ts` (the CSP header with a
   per-request nonce + the full directive census; every SSR `<script>`
   on / AND /register carries the page nonce) — failed for the right
   reasons (`content-security-policy` header undefined).
6. **TDD GREEN:** `src/middleware.ts` (nonce + CSP + matcher) — which
   Next 16 immediately flagged: the `middleware` file convention is
   **deprecated in favor of `proxy`** — migrated to `src/proxy.ts` with
   the exported function named `proxy` (same API; the build now emits
   zero deprecation warnings). Plus `export const dynamic =
   "force-dynamic"` on `/register` + `/forgot-password` (per-request
   nonces require per-request rendering). Empirical proof at the seam:
   16/16 home scripts and 14/14 register scripts carry the nonce; two
   requests never share a nonce; the directive set ships exactly as
   designed (no `upgrade-insecure-requests` — it would rewrite
   same-origin subresources to https and break plain-HTTP localhost).
7. **Gate at ship:** lint 0/0 · tsc clean · **100/100 unit** · build
   exit 0 (23 routes, no deprecation warnings) · **150/150 E2E = 250
   total** (was 248; +2 E2E, none removed) — **two consecutive full
   E2E runs** for determinism. The full suite doubling as the CSP
   hydration regression net was the point: the register/login
   form-fill specs die on the first un-nonced script — they never did.
8. **Live re-verification** (`scripts/verify-session14.ts`): **14/14
   green** — CSP header + directive census; nonce per-request
   uniqueness; every SSR script nonced on /, /register, AND
   /forgot-password; a real-browser walk with a console-violation
   census (home typeahead hydrates; register's native email
   validation live); the PDP cart-add server action under CSP (badge
   "Cart" → "Cart, 1 items" — located via a name-PATTERN scoped to the
   header after two locator lessons: role locators resolve by
   accessible name so an exact-name locator stops matching the moment
   the label changes; and the cart control is a plain onClick Button,
   no `a[href="/cart"]` exists); the toast + the /cart DB write landed;
   zero CSP violations across the whole walk.
9. **Pixel re-diff after the CSP build:** all 8 routes re-captured and
   re-diffed against the SAME reference pairs — identical to the
   baseline band (account 0.34% on the correctly-authenticated
   capture). **The strongest rendering evidence: the 14th mobile-nav
   screenshot is BYTE-IDENTICAL to the 13th (md5-equal) — the CSP
   middleware changed nothing.**
10. **Screenshots:** 5 new (81–85, captured by the persisted
    `scripts/capture-session14.ts` — 81 the register screen hydrated
    under CSP with the validation state live, 82 the nonce proof panel
    (the CSP header + extracted nonce + the nonced script tags), 83
    the PDP cart-add toast + badge under CSP, 84 the /cart DB-write
    landing, 85 the 14th mobile-nav verification) → 85 total.
    VLM-verified **5/5** from the `vlm-check` scratch dir. Dev-DB
    hygiene run clean (canonical 3 orders). `.env.example` verified
    current — the CSP is code-level, no new env plumbing.
11. **Docs:** AGENTS.md (the CSP contract + the proxy-only-file rule +
    the host-consistency lesson + the round-13 artifact correction),
    CLAUDE.md (the session-14 contract, 100 unit / 150 E2E), README.md
    (250 tests, the CSP row, 14th verification), PAD v1.14 (ADR-022 +
    revision row + Known-Issues Resolved row + matrix 250), SKILL
    v1.14.0 (L22–L23 + the ADR-index entry), this session log, the
    worklog.

## Key decisions

- **The de-risked CSP:** the "bricks hydration" fear was real but the
  148-test E2E suite IS the regression net — the register/login
  form-fill specs fail loudly on the first un-nonced script. Ship the
  nonce pipeline directly (a report-only phase would protect nothing
  while the gate provides the same confidence); validate the mechanism
  in the Next 16 source BEFORE writing code; pin the directive set to
  the codebase's measured footprint so every future third-party
  script becomes a conscious directive decision.
- **Ship the current convention:** Next 16 deprecates `middleware.ts`
  for `proxy.ts` — the build warning itself was the signal; the
  migration is a rename (same API), and the repo now ships zero
  deprecation warnings.
- **`upgrade-insecure-requests` deliberately omitted:** it would
  rewrite the app's own plain-HTTP localhost subresources to https and
  break dev/E2E; TLS termination is the documented reverse-proxy layer
  (DEPLOYMENT.md) — the directive belongs there.
- **The static-page question answered empirically:** per-request
  nonces require per-request rendering; the ONLY static HTML pages
  were the two auth screens (now `force-dynamic` — a per-request render
  of a trivial server page costs nothing measurable), and `/_not-found`
  is unreachable (nothing calls `notFound()`).
- **The audit-artifact discipline refined:** a suspiciously large
  pixel diff on an auth-gated route is a SESSION artifact until
  `location.pathname` proves otherwise — the byte-stable 22.08%
  (identical differing-pixel count every run) was the giveaway that
  round-13's "mid-hydration frame" diagnosis was wrong. One host for
  the whole audit lifecycle; auth verified immediately before authed
  captures; the JSON-quoted eval output compared against the quoted
  form.

`docs/remediation-plan-session14.md` records the full audit trail.

## Suggested next steps

Round-15 candidates: an email provider to activate the ADR-011
verification gate, Stripe Payment Element (ADR-007's documented next
step), the self-hosted axe differential as a standing E2E check, or
server-side pagination for the orders list if scale ever demands it.
The security queue is now EMPTY — every nominated item shipped (headers
session-12, CSP session-14). Tell me which to pick up and I'll start
the next round.
