# Session 28 Log — Round-15 Full-Route Census + Standing Axe A11y Gate

**Date:** 2026-10-08 · **Agent:** Super Z (review/build) · **Branch:** `main`
**Baseline:** `443d03d` (the session-14 ship `c59de6f` + the
remotely-added `docs/session_27.md` narrative)

## Timeline

1. Workspace reset → fresh `git clone` (2908 files); `.env` created from
   `.env.example`; `bun install`; `bun run db:setup` (the injected
   `DATABASE_URL` env-shadowed the seed onto the sandbox path — moved to
   the repo root + hard-linked per the documented contract, inode 172348
   live at both paths). Reviewed all root docs + `docs/session_26.md` +
   `docs/remediation-plan-session14.md` + `worklog.md` +
   `docs/session_27.md` — everything current through session-14 (PAD
   v1.14, SKILL v1.14.0, the 250-test gate, 13 traps); the session-14
   deliverables verified in code (`src/proxy.ts` CSP live on the server
   with a fresh nonce per request, force-dynamic auth pages, 85
   screenshots).
2. **Baseline gate:** lint 0/0 · tsc clean · 100/100 unit · build exit 0
   (23 routes, zero deprecation warnings) · 150/150 E2E = **250** —
   exactly the documented session-14 ship state, one run.
3. Skills mapped from `skills/skills-catalog.md` (agent-browser, tdd,
   clone-app-pat-pro, code-quality-standards, tailwind-patterns); the
   session-14 code changes audited clean (the proxy's directive set, the
   force-dynamic opt-outs, the 2 CSP smoke pins, the persisted verify +
   capture scripts).
4. **Round-15 live A/B audit** (agent-browser sessions `ref` + `clone`;
   the clone served by the production standalone server on :3000 — ONE
   host, localhost, for the whole lifecycle per L22; states saved before
   device emulation):
   - **Mobile nav (15th standing verification):** iPhone 14 both sites —
     the Sheet panel class string token-identical, pad 24px, bg
     `rgb(251,250,249)`, w-72 (288px), nav `flex flex-col gap-4 mt-8`,
     all 5 links byte-identical (239×44, 18px/500, block, same hrefs).
     Functional check: "Electronics" deep-links to
     `/shop?category=electronics` and the sheet auto-closes. **No
     Tailwind v4 regression (15th consecutive verification).**
   - **The round's primary new surface — the full-route
     production-readiness census:** all 22 manifest routes walked in a
     real browser (networkidle): home, shop ×3 filter/search states, PDP
     + the unknown-slug in-chrome not-found, cart, checkout, wishlist,
     account, all four auth screens, all four admin surfaces incl. the
     order detail, the platform 404, sitemap, robots, health — ZERO
     console errors/warnings/pageerrors (demo-user context; the admin
     surfaces re-verified in the admin context) and ZERO navigation
     failures. **Link-integrity crawl:** 19 unique internal link targets
     collected from the rendered pages — ALL resolve 200/3xx, zero
     broken links.
   - **Standing drift watches:** pixel diffs @1024 on 8 routes (home
     0.34 / shop 0.38 / PDP 0.68 / cart 0.34 / wishlist 0.34 / checkout
     0.35 / account 0.34 / login 0.28 — the documented baseline band;
     the sweep script enforces ONE-host + `location.pathname` auth
     verification + networkidle/font settle). Content census: the 22
     home card texts byte-identical (one recorded non-defect: the card
     category label's DOM text differs in case — clone `Electronics`,
     ref `electronics` — but both elements carry the identical
     `capitalize` class + computed transform, so both RENDER
     identically; the 0.34% pixel diff confirms). Carousel cadence
     ~5.0s both sites (4964+5036ms vs 4960+5040ms, pointer off the
     hero). Typeahead: the reference still fires ZERO search network
     requests (the clone's `/api/search` stays the registered
     superset). Console census: zero entries.
   - **The session-12 axe differential repeated (same build 4.14.0
     injected both sides, scrolled-reveal):** the clone's profile is
     EXACTLY the shared-parity set — `color-contrast` only, node counts
     byte-identical per route (home 28=28, shop 23=23, PDP 14=14, cart
     8=8, account 8=8, login 3=3) — while the reference additionally
     carries 4–20 button-name + 2 link-name + 4 label violations per
     route (the clone's aria superset). Counts re-calibrated under
     exact E2E conditions (standalone server on the e2e DB, Desktop
     Chrome 1280×720, storageState): identical numbers.
5. **Remediation plan** (`docs/remediation-plan-session15.md`): the audit
   record + the fix design for the round's finding — **A11Y-GATE-1, the
   self-hosted axe differential converted into a standing E2E gate**
   (session-12's manual audit is the only thing that ever caught the
   11-round-invisible nested-`<main>`; its return is currently prevented
   by nothing but a human). Validated against the codebase before
   writing: the toast viewport (the mutation target), the auth.spec
   anon- pattern, the devDependencies home for the explicit pin.
6. **TDD RED:** the zero-violation form of the 6 a11y assertions —
   failed for the RIGHT reason (color-contrast 28 on home — the shared
   parity trait; the failure documents the baseline as a DELIBERATE
   parity contract before the pin).
7. **TDD GREEN:** the parity-profile spec (`tests/e2e/accessibility.spec.ts`
   — census EXACTLY {color-contrast} + pinned counts 28/23/14/8/8/3;
   self-hosted `page.addScriptTag` injection, DevTools-protocol = CSP-
   exempt; scrolled-reveal before every run; login via the opted-out
   anon describe) + `axe-core@4.14.0` as an explicit pinned
   devDependency.
8. **Mutation efficacy check:** re-introduced the exact session-12 defect
   (`aria-label="Notifications"` on the toast viewport's role-less div)
   → rebuilt → the home assertion FAILED with
   `[{"id":"aria-prohibited-attr","nodes":1},{"id":"color-contrast","nodes":28}]`
   → reverted (git-diff clean) → GREEN again. The gate is proven to
   bite, not just pass.
9. **Gate at ship:** lint 0/0 · tsc clean · 100/100 unit · build exit 0
   (23 routes) · **156/156 E2E = 256 total** (was 250; +6 a11y tests,
   none removed) — **two consecutive full E2E runs** for determinism
   (the second run on `E2E_PORT=3200` — a stale :3100 server from the
   calibration phase couldn't be killed; see the lesson below).
10. **Live re-verification:** pixel re-diff after the change — all 8
    routes at the identical baseline numbers (the change is test-level;
    rendering byte-identical, empirically confirmed). **The 15th
    mobile-nav screenshot is BYTE-IDENTICAL (md5
    `05de11678965f30a85f9196c2ec43bae`) to the 13th AND 14th** — three
    consecutive rounds of rendering continuity across the CSP and
    a11y-gate changes. The axe-diff + calibration scripts persisted
    (`scripts/axe-diff-session15.mjs`,
    `scripts/axe-calibrate-session15.mjs`).
11. **Screenshots:** 5 new (86–90, captured by the persisted
    `scripts/capture-session15.ts` — 86 the axe differential parity
    table, 87 the 15th mobile-nav verification, 88 the a11y gate live
    run, 89 the mutation efficacy proof, 90 the full-route census) → 90
    total. VLM-verified **5/5**. Dev-DB hygiene run clean (canonical 3
    orders). `.env.example` verified current (no new env plumbing — the
    gate is test-level).
12. **Docs:** AGENTS.md (the a11y-gate contract + the
    stale-server/hidden-PID lesson), CLAUDE.md (the session-15
    contract, 100 unit / 156 E2E), README.md (256 tests, the a11y-gate
    row, 15th verification), PAD v1.15 (ADR-023 + revision row +
    Known-Issues Resolved row + matrix 27/256), SKILL v1.15.0 (L24–L25
    + the ADR-index entry), this session log, the worklog.

## Key decisions

- **The standing-gate conversion over a new feature:** the round-15
  candidate list held four options (email provider, Stripe, the axe
  gate, pagination). The email and Stripe items need external
  credentials that don't exist for a self-hosted clone; pagination has
  no demonstrated need at scale. The axe gate is the one that
  compounds: it converts the ONLY tool that ever caught an
  11-round-invisible defect class into a permanent regression pin, at
  zero external dependency.
- **The parity profile is pinned, not fixed:** the color-contrast
  violations are a SHARED trait (byte-identical counts on the
  reference) — "fixing" them only on the clone would break parity. The
  gate pins the census + counts so drift in EITHER direction is
  flagged, and the assertion message carries the census JSON so a
  future re-pin is a one-glance operation.
- **The mutation check as a first-class step:** a gate that has never
  failed is unproven. Re-introducing the exact session-12 defect and
  watching the gate FAIL (aria-prohibited-attr) before reverting is
  the difference between "a test exists" and "the test protects."
- **The stale-server lesson (L25):** a rebuilt `.next/standalone` under
  a running server 500s every renamed chunk (hydration dies while SSR
  renders — `getByLabel` times out on forms whose labels exist in the
  curl HTML); the sandbox hides server PIDs from lsof/ps, and the
  recovery is the `/proc/net/tcp` socket-inode walk → kill → reboot on
  the current build (or a fresh port — `E2E_PORT`).

`docs/remediation-plan-session15.md` records the full audit trail.

## Suggested next steps

Round-16 candidates: an email provider to activate the ADR-011
verification gate, Stripe Payment Element (ADR-007's documented next
step), extending the axe gate to mobile viewports / admin surfaces
(own calibration pass), or server-side pagination if scale demands it.
The audit surface is now fully gated (geometry, catalog, money, CSP,
headers, fonts, a11y). Tell me which to pick up and I'll start the
next round.
