# Remediation Plan — Session 14 Review (Round-14 Delivery-Layer Differential + CSP Nonce Superset)

**Date:** 2026-10-08
**Repo:** `nordeim/ecommerce-store` (branch `main`, baseline `7d9fb52` — the
session-13 ship state `fd6b909` plus the remotely-added `docs/session_25.md`
narrative)
**Author:** Review/build agent (Super Z)
**Scope:** Live differential audit (round 14) of the LUXE Store clone against
the reference (`fuzzy-lumina-style-hub.base44.app`). Thirteen prior rounds
closed the catalog, cart, checkout, auth, account, PDP, admin,
computed-geometry, mobile-geometry, social-metadata, interaction-engine,
typography/keyboard, axe-a11y/security-header, and CWV/admin-filter gaps
(248-test gate). Round 14 targets: (a) the standing user priorities — mobile
navigation (14th verification, Tailwind v4 watch) and reference drift on
pinned surfaces; (b) **the first network/delivery-layer differential**
(request census, compressed transfer sizes, caching/compression headers on
both sites — never quantified); (c) the standing pixel-diff drift re-check
@1024 on 8 routes; (d) the content census + console-error census +
typeahead/carousel drift watches. The `skills/` folder is excluded from code
checking, testing and compilation per the operating contract.

**Method:** Baseline gate (248/248 green, exactly the documented session-13
ship state) → agent-browser sessions (`ref` = production reference logged in
as the operator account, `clone` = production standalone server on :3000)
with request-log + curl transfer-size probes on both sides; paired
screenshot pixel-diffs @1024; text censuses; dot-class carousel probes.
Every conclusion carries live-measured evidence from both sites.

---

## 1. Baseline verification (state at audit start)

| Gate | Result |
|---|---|
| `bun run lint` | 0 errors, 0 warnings |
| `bun run typecheck` | clean |
| `bun run test` (Vitest) | 100/100 passed |
| `bun run build` (the repo wrapper — never raw `next build`) | exit 0, 23 routes |
| `bun run test:e2e` (Playwright) | 148/148 passed (248 total) |
| DB contract | `db/custom.db` at repo root; hard-link convergence live (inode 303519, both paths); canonical state |
| Docs | AGENTS/CLAUDE/README/PAD v1.13/SKILL v1.13.0 all current through session-13 (248-test gate, 13 traps) |
| Env | `.env` `DATABASE_URL="file:../db/custom.db"` intact; `.env.example` current; session-13 deliverables verified in code (the seam, the island, the page wiring, 80 screenshots) |

**Standing state:** all four security headers live on the standalone server
(referrer-policy / nosniff / HSTS / X-Frame-Options, re-verified via curl);
the admin-order filter bar + count line + empty state render on the
production server.

## 2. Audit results

### Verified at parity this round (no action required)

- **Mobile navigation menu (14th standing verification):** iPhone 14 on both
  sites: the Sheet panel class string matches token-for-token (`fixed z-50
  gap-4 bg-background p-6 shadow-lg transition ease-in-out … inset-y-0
  left-0 h-full border-r … w-72 sm:max-w-sm`), pad 24px, bg
  `rgb(251, 250, 249)`, w-72 (288px), nav `flex flex-col gap-4 mt-8` (gap
  16px, margin-top 32px), all 5 links identical (text + hrefs incl. the
  category deep-links) at 239×44, 18px/500, `display:block`. **No Tailwind
  v4 regression (14th consecutive verification).** Functional check:
  clicking "Electronics" navigates to `/shop?category=electronics` and the
  sheet auto-closes (the documented deliberate superset behavior).
- **Network/delivery-layer differential (the round's primary new surface):**
  - **Home request census:** reference 22 requests (1 document + 1 SPA JS
    bundle + 2 stylesheets incl. Google Fonts CSS + 1 gstatic woff2 + 2
    manifests + 5 platform API/analytics calls + 9 CDN images + 1 logo) vs
    clone 40 (1 document + 12 route-split JS chunks + 1 stylesheet + 1
    self-hosted font + 10 CDN images + 12 Next Link RSC prefetches + 2
    server-action polls). The deltas are all architecture: the clone
    splits JS per-route (12 chunks), prefetches its nav targets
    (`?_rsc` fetches — the Next App Router optimization the reference's
    SPA has no need of), and keeps the inert hero slides' images in the
    DOM (the documented crossfade divergence, +1 hero image).
  - **Compressed transfer sizes (curl, gzip for the clone / brotli for the
    reference — each site's own production encoding):** document 15,031B
    (gzip; the FULL SSR first paint — raw 118,754B) vs 3,193B (brotli; an
    empty SPA shell — the trade the round-13 CWV differential already
    quantified: the clone paints 6.3× faster); JS 177,282B across 12
    gzip chunks vs 213,545B single brotli bundle; CSS 24,179B gzip vs
    12,587B brotli; **font byte-identical at 27,348B on both sites** (the
    session-11 FILE-parity contract, re-confirmed).
  - **Asset caching:** the clone's hashed static assets ship
    `cache-control: public, max-age=31536000, immutable` + ETag — **1-year
    immutable, stronger than the reference's 7-day `max-age=604800`**.
    The document response is `private, no-cache, no-store` on the clone
    (session-carrying SSR) vs the reference's SPA shell.
  - **Encoding gap recorded, not remediated:** the reference serves brotli;
    the Node standalone server negotiates gzip only (Node's Next server
    does not ship brotli — a documented reverse-proxy/CDN responsibility
    per the standalone-output contract; DEPLOYMENT.md already targets a
    fronting proxy). Local brotli in the app server would be custom
    middleware territory with no parity surface at stake — recorded as
    the ops note, not a code change.
- **Pixel diffs @1024 (standing drift re-check, 8 routes):** home 0.35 /
  shop 0.34 / PDP 0.63 / cart 0.34 / login 0.27 / wishlist 0.34 / checkout
  0.35 / **account 0.34 after re-login + re-capture** — all at the
  documented baseline band (0.27–0.63%). No drift on any pinned surface.
- **Content census:** home product-card names byte-identical on both sites
  (22 link texts incl. badges — the identical array).
- **Hero carousel timing:** with the pointer moved off the hero, the clone
  flips slides at exactly 5.0s intervals (2000 → 7001 → 12000ms, the
  corrected w-8 active-dot probe) — the reference cycles at ~5s too. The
  clone's pause-on-hover (the documented deliberate divergence) was
  re-confirmed: with the pointer resting on the hero the clone pauses
  while the reference keeps cycling.
- **Console-error census (clone, production server):** /checkout,
  /wishlist, /admin/products, /admin/orders, /verify-email,
  /shop?category=electronics, /product/wireless-headphones — ZERO
  console entries (no pageerrors, no errors/warnings).
- **Typeahead drift watch:** typing "headphones" in the reference's search
  still fires ZERO search network requests (client-side in-memory
  filtering) — the clone's `/api/search` remains the registered superset.
  No drift.

### Audit artifacts + lessons (recorded, not code defects)

1. **`agent-browser set device` resets the browser context** (the session-9
   context-reset lesson, modern face): after `set device "iPhone 14"`, the
   clone session's auth cookie was gone — every later "authenticated"
   surface silently rendered its GUEST state (mobile nav and home are
   auth-agnostic, so the standing verifications were unaffected, but
   /account guest-gated to `/login?redirect=/account`). The pixel sweep's
   account pair read **22.08%** — the guest-login page rendered inside the
   /account screenshot. Re-login + re-capture read the 0.34% baseline.
2. **Round-13's account-artifact diagnosis is CORRECTED:** the session-24
   log attributed its identical 22.08% first-sweep reading to "a
   mid-hydration frame"; this round reproduced the EXACT number via a
   different, demonstrable cause (device-context reset → guest redirect).
   A mid-hydration frame would not produce a byte-stable 22.08%; a
   logged-out redirect does. The refined lesson: **a suspiciously large
   pixel diff on an auth-gated route is a SESSION artifact until auth
   state is verified — check `location.href` before re-capturing.** The
   SKILL L20 lesson is amended accordingly (recorded in this round's doc
   updates).

### Findings

**No parity defects.** Every pinned surface verified at parity this round;
the reference shows no drift. The delivery layer measures as a functional
superset (smaller route-split JS, immutable caching, byte-identical font,
SSR-first paint).

The round's finding is the **last nominated security item** — the CSP
follow-up ADR-020 documented in session-12 and deferred twice
(session-13's remediation plan: "CSP-with-nonce remains the documented
security follow-up — deferred again this round: the risk/reward favors the
operational feature; a broken CSP nonce pipeline bricks hydration
system-wide"):

#### F1 — SEC-CSP-1 · the clone ships no Content-Security-Policy (the last nominated security gap)

The reference ships no CSP at all, so this is superset territory (like
X-Frame-Options before it). The production-readiness claim ("production
ready superset") argues for a real CSP: today any injected inline script
would execute unchallenged. The repo's own posture — no inline
application styles, no `notFound()` calls, no third-party scripts, a
self-hosted font, same-origin APIs, a single image CDN host — makes the
directive set tractable and fully enumerable.

**Fix design (validated against the codebase):**

1. **`src/middleware.ts` (new):** generate a per-request nonce
   (`crypto.randomUUID()` → base64), build the CSP with the nonce, set it
   on the REQUEST headers (`Content-Security-Policy` — Next.js extracts
   the nonce via `getScriptNonceFromHeader` and applies it to every
   bootstrap/flight `<script>` it renders; verified present in
   `next/dist/server/route-modules/app-page/parse-request-headers.js`) and
   on the RESPONSE (browser enforcement). Matcher excludes
   `/_next/static`, `/_next/image`, `/fonts`, `/favicon.ico`,
   `/robots.txt`, `/sitemap.xml`, and extension-bearing asset paths.
2. **Directive set (each pinned to the codebase's actual footprint):**
   `default-src 'self'`; `script-src 'self' 'nonce-…' 'strict-dynamic'`;
   `style-src 'self' 'unsafe-inline'` (insurance for any framework-injected
   style attributes — the app itself ships zero inline styles, measured);
   `img-src 'self' https://media.base44.com data:` (the sole image CDN +
   favicon host); `font-src 'self'` (the self-hosted woff2);
   `connect-src 'self'` (RSC fetches, server actions, `/api/*`);
   `frame-ancestors 'none'` (complements X-Frame-Options: DENY);
   `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`. No
   `upgrade-insecure-requests` (the app runs on plain-HTTP localhost in
   dev/E2E — the directive would rewrite same-origin subresources to
   https and break them; TLS termination is the documented reverse-proxy
   layer).
3. **Static-render opt-outs:** the ONLY static HTML pages are `/register`
   and `/forgot-password` (`/_not-found` is unreachable — nothing calls
   `notFound()`; robots/sitemap are route handlers). Both auth screens
   gain `export const dynamic = "force-dynamic"` — a per-request render is
   required for a per-request nonce; the auth screens are trivial
   server pages (the reference's own login is dynamic already; the CWV
   story is SSR-driven and unaffected).
4. **The brick-risk mitigation (why this is now safe to ship):** the full
   148-test E2E suite IS the hydration regression net (register/login form
   fills, cart steppers, checkout wizard, admin combobox — every one
   requires working hydration); plus a live verification script probes
   real-browser console for CSP violations. If the nonce pipeline breaks
   anywhere, the gate fails loudly before anything ships.

**Deliberately out of scope (recorded):** local brotli encoding in the app
server (reverse-proxy territory, recorded above); a report-only rollout
phase (the gate provides the confidence report-only would); CSP for
non-document responses (API route handlers — no scripts to protect).

## 3. TDD plan

**RED (E2E, `tests/e2e/smoke.spec.ts` — extends the session-12 security
describe):**

1. "CSP header ships with a per-request nonce (session-14, SEC-CSP-1)":
   GET `/` → `content-security-policy` header present, contains
   `script-src 'self' 'nonce-` + `'strict-dynamic'`, contains
   `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`,
   `form-action 'self'`, `img-src 'self' https://media.base44.com data:`,
   `font-src 'self'`, `connect-src 'self'`, `style-src 'self'`; a SECOND
   GET `/` yields a DIFFERENT nonce (per-request uniqueness).
2. "every script the SSR document emits carries the page nonce": GET `/`
   AND `/register` (the force-dynamic'd static auth screen) → parse the
   HTML, extract the nonce from the CSP header, assert EVERY `<script>`
   element (inline or external) carries `nonce="«the same nonce»"`.
3. The existing 148 tests (register form fill, login, cart, checkout,
   account, admin) — the hydration regression net — must remain green
   untouched.

**GREEN:** `src/middleware.ts` (nonce + CSP + matcher);
`export const dynamic = "force-dynamic"` on register + forgot-password.

**Live verification (`scripts/verify-session14.ts`, persisted per repo
convention):** boot the standalone server → curl `/` twice (nonce
differs; directives present) → curl `/register` (scripts nonced) →
agent-browser loads `/`, `/register`, `/shop` → assert zero console
CSP violations + hydration landed (input fill works) → a cart-add via
the PDP exercises the server-action path under CSP.

## 4. Sign-off criteria

- [x] Baseline gate green at audit start (248/248, exactly the documented ship state)
- [x] Round-14 audit complete: mobile nav 14th verification; delivery-layer differential; 8-route pixel drift re-check; content + console + typeahead/carousel drift watches
- [x] Zero parity defects confirmed (every finding at parity, no reference drift)
- [x] Audit lessons recorded (device-reset artifact + the round-13 account-artifact diagnosis correction)
- [x] RED tests written and confirmed failing for the right reasons (CSP header absent; scripts carry no nonce)
- [x] GREEN: middleware + the two force-dynamic opt-outs (migrated to the Next 16 `proxy.ts` convention — `middleware.ts` is deprecated)
- [x] Full gate green: lint 0/0 · typecheck clean · 100/100 unit · build 23 routes (zero deprecation warnings) · E2E 150/150 (+2 new tests; none removed) — two consecutive full runs for determinism
- [x] Live re-verification against the production server (14/14 green incl. zero CSP violations in a real browser — `scripts/verify-session14.ts`)
- [x] Pixel re-diff of the 8-route sweep unchanged from parity (all at the 0.27–0.63% baseline; the 14th mobile-nav capture BYTE-IDENTICAL to the 13th — md5-equal across the CSP change)
- [x] Screenshots captured + VLM-verified under `docs/screenshots/` (81–85, 5/5 PASS)
- [x] Docs updated: AGENTS.md (CSP contract + device/host lesson + the round-13 artifact correction), CLAUDE.md, README.md, PAD v1.14 (ADR-022), SKILL v1.14.0 (L22–L23), session log (session_26), worklog
- [x] `.env.example` verified current (no new env plumbing — the CSP is code-level)
- [ ] Committed on `main` and pushed via the SSH wrapper (final step — checked off in the session log after the push lands)
