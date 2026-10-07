# Session 12 Log — Round-7 Differential Audit + Remediation

**Date:** 2026-10-07/08 · **Agent:** Super Z (review/build) · **Branch:** `main`
**Baseline:** `44f1558` (session-6 work complete + session_10.md log)

## Timeline

1. Workspace had been reset — fresh `git clone` (2811 files). Reviewed all
   root docs + `docs/session_10.md` + `docs/remediation-plan-session6.md` +
   `worklog.md` + `docs/session_11.md` — everything current through
   session-6 (PAD v1.6, SKILL v1.6.0, 188-test gate).
2. Environment setup: `.env` (`DATABASE_URL="file:../db/custom.db"`), the
   sandbox env-shadowing trap re-converged via hard link (injected
   `/home/z/my-project/db/custom.db` ↔ repo `db/custom.db`, inode 305049),
   `bun install`, `db:setup` (12 products / 3 demo orders / 3 users).
3. **Baseline gate:** lint 0/0 · tsc clean · 76/76 unit · build compiled 21
   routes **but exited 1** — `cp: cannot stat 'public'` (BUILD-1: the
   directory was never committed; prior sessions had it only as an
   untracked local artifact). 112/112 E2E. Everything else matched the
   documented session-6 ship state exactly.
4. **Round-7 live A/B audit** (agent-browser sessions `ref` + `clone`):
   - **Mobile nav (6th standing verification):** overlay 288×844 @ (0,0),
     nav `flex flex-col gap-4 mt-8`, 5 byte-identical links — parity
     holds; **no Tailwind v4 regression**. Reference menu-stays-open quirk
     re-confirmed; clone auto-closes (registered divergence).
   - **Drift re-check:** home (8-child wrapper, both dividers), shop (12
     cards, identical order), PDP (title/h1/price/tabs/related), login —
     all at parity. The in-chrome product-not-found block anatomy
     matches too — but the reference TITLES unknown slugs as the
     humanized slug (TITLE-NF-1) while the clone said "Product Not Found".
   - **FAVICON-1:** the reference injects `<link rel=icon>` → its
     media.base44.com logo; the clone served no icon (404).
   - **Superset sweeps:** admin console (dashboard/orders/products),
     newsletter API (idempotent + validated), isActive enforcement
     (grep: shop/home/PDP/search/sitemap all filter), OrderEvent writers
     verified — but zero renders anywhere (ADMIN-DETAIL-1, the PAD §11
     round-7 candidate) and admin E2E still stock-form-only
     (ADMIN-COV-2). DEPS-1: six zero-import dependencies.
5. Wrote `docs/remediation-plan-session7.md` (issue inventory with
   evidence, dependency sweeps, TDD plan, sign-off criteria) and validated
   it against the exact seams to modify.
6. **TDD RED:** smoke title + favicon assertions failing for the right
   reasons; new `admin.spec.ts` (5 tests) with the order-detail and
   timeline tests failing (no route) — **and the guest-gating test
   surfaced REDIRECT-2**: the session-6 wiring hardcoded
   `/login?redirect=/admin` on the sub-pages, so `/admin/orders` guests
   lost their exact destination (the ADR-014 spec had said "their own
   path"). Two spec bugs fixed during RED (percent-encoded URL regex;
   stat-label strict-mode collision with the header "Orders" link).
7. **TDD GREEN:** `public/.gitkeep` + `mkdir -p public` in the build
   script (BUILD-1); `metadata.icons` → reference CDN logo (FAVICON-1);
   `generateMetadata` humanizes every slug (TITLE-NF-1); per-page admin
   redirect targets (REDIRECT-2); new read-only `/admin/orders/[id]`
   page rendering the customer block, shipping snapshot, item snapshots,
   and the chronological OrderEvent timeline, with order numbers
   deep-linked from the list + dashboard (ADMIN-DETAIL-1, ADR-015);
   `adminLogin` promoted to `helpers.ts` + full admin.spec.ts
   (ADMIN-COV-2); six deps pruned (DEPS-1).
8. **MAIN-NEST-1 (found during live verification):** every admin page
   nested a `<main>` inside the storefront layout's `<main>` — invalid
   HTML, pre-existing. All four admin pages now wrap in
   `<div className="flex-1">`.
9. **Run-to-run isolation (found during GREEN):** the first full run
   failed the dashboard + timeline tests — spec-placed orders from prior
   runs had accumulated in the persisted `db/e2e.db`, pushing demo
   fixtures out of the take:5 Recent Orders list while duplicate
   status_changed events tripped strict mode. `prisma/e2e-reset.ts` now
   deletes non-canonical orders + demo-order status_changed events and
   restores canonical statuses every run; `prisma/dev-cleanup.ts`
   mirrors it for the dev DB. **Two consecutive full runs then passed
   118/118** — determinism proven.
10. **Full suite green: 76 unit + 118 E2E = 194 total** (was 188; +1
    smoke, +5 admin). Gate: lint 0/0 · tsc clean · build exit 0 (22
    routes) · fresh-clone simulation (`rm -rf public && bun run build`)
    exits 0.
11. **Live re-verification** (`scripts/verify-session7.ts`, Playwright
    against the settled dev server): all 9 checks green — favicon link,
    unknown-slug title + block, `/admin/orders` guest redirect carrying
    its own path, order-detail h1/shipping/placed-event/items, and a live
    status transition landing in the timeline (status restored after).
    Dev-mode lessons en route: repo-file edits under a running `next dev`
    trigger Fast Refresh reloads mid-fill (settle + retry pattern;
    SKILL row 29); `networkidle` never fires under the HMR websocket.
12. Dev DB returned to canonical (dev-cleanup: stray orders 0, stock 25,
    demo timelines clean, statuses canonical).
13. **Docs:** AGENTS.md (favicon/title/redirect/order-detail/one-main
    contracts, admin.spec selector quirks, e2e-reset isolation, build +
    deps conventions, dev-cleanup note), CLAUDE.md (194 counts, ADR-015
    bullets, spec list, 22 routes, fresh-clone-safe build), README.md
    (194 tests, admin feature row, hierarchy, testing table), PAD v1.7
    (ADR-015 full record, §8.1 24-file/194-test table, §8.4 checklist
    118/118, §11 three Resolved rows incl. both round-7 candidates),
    SKILL v1.7.0 (§9 rows 26-29, ADR index through 015), plan checked
    off with outcome notes, this session log.
14. **Screenshots:** 4 new (42-admin-order-detail-timeline,
    43-admin-orders-linked, 44-pdp-not-found-title,
    45-admin-dashboard-linked-orders — VLM-verified) → 45 total.
15. `.env.example` verified current (no new env plumbing this round —
    the favicon is a hardcoded CDN URL; all four documented vars match
    the code's `process.env` usage exactly).

## Result

- **9 findings closed:** BUILD-1 (fresh-clone build reproducibility —
  the gate is runnable from a bare clone again), FAVICON-1 (CDN-logo
  favicon parity), TITLE-NF-1 (unknown-slug PDP titles), REDIRECT-2
  (admin sub-pages carry their own redirect path), ADMIN-DETAIL-1 (the
  order-detail view + OrderEvent timeline — ADR-015), ADMIN-COV-2
  (dedicated admin E2E), MAIN-NEST-1 (one `<main>` landmark per page),
  DEPS-1 (six unused dependencies pruned), plus run-to-run E2E order
  isolation (e2e-reset + dev-cleanup canonical-order contracts).
- **Gate at ship:** lint 0/0 · tsc clean · 76/76 unit · build OK (22
  routes) · **118/118 E2E = 194 total** (was 188; proven deterministic
  across two consecutive runs).
- The admin console is now a complete operational surface — stats →
  list → detail → attributed timeline — with E2E at every seam.
- `docs/remediation-plan-session7.md` records the full audit trail.
