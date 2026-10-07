# Session 10 Log — Round-6 Differential Audit + Remediation

**Date:** 2026-10-07 · **Agent:** Super Z (review/build) · **Branch:** `main`
**Baseline:** `f4204d9` (session-5 work complete + session_9.md log)

## Timeline

1. Refreshed the workspace (`git pull` → `f4204d9`, which had added
   `docs/session_9.md` — the round-5 session's narrative). Reviewed all
   root docs + `docs/session_8.md` + `docs/remediation-plan-session5.md` +
   both worklogs — everything current through session-5 (PAD v1.5, SKILL
   v1.5.0, 173-test gate).
2. Re-validated the full gate at baseline: lint 0/0 · tsc clean · 66/66
   unit · build OK (21 routes) · **107/107 E2E** — codebase matched the
   documented status exactly. DB contract verified (hard link converged,
   inode 274771; `.env` = `file:../db/custom.db`; canonical 12 products /
   3 demo orders).
3. **Round-6 live A/B audit** (agent-browser sessions `ref` + `clone` +
   `admin` + `guest`, DOM/computed styles as ground truth, VLM
   cross-checks). With five rounds of parity work shipped, the audit
   shifted weight to the **superset's production correctness** while
   holding the standing priorities:
   - **Mobile nav (5th standing verification):** dialog 288×844 @ (0,0),
     nav `flex flex-col gap-4 mt-8`, 5 byte-identical links — parity
     holds; no Tailwind v4 regression anywhere in the mobile sweeps.
   - **Drift re-check:** home (8-child wrapper, both dividers), shop
     (12 cards, catalog order), PDP (h1/price/tabs/title), login screen
     — all at parity.
   - **Reference checkout:** still permanently "No items in cart" (the
     documented demo quirk — verified twice, including after an add in
     the same SPA session). Recon note: `23-order-success.png` is
     actually a homepage capture; the reference success page has never
     been reachable.
   - **Superset functional sweep:** card checkout (ORD-2026-004) ·
     PayPal checkout (ORD-2026-005, free shipping ≥ $100) · guest
     checkout (ORD-2026-006, visible in admin) · admin console stats/
     orders/products + mobile sweep (390/390 clean) · account orders ·
     wishlist · SEO endpoints — all working.
   - **Findings:** **STOCK-1** (High — stock neither validated nor
     decremented server-side: `addItem`/`changeQuantityBy` accepted any
     quantity, `placeOrderAction` never read stock; overselling possible,
     admin stock numbers never moved), **REDIRECT-1** (Medium — gated
     pages sent guests to bare `/login` and the form always pushed
     `/account`; visitor intent lost), **DEAD-1** (Low — dead
     `subscribeNewsletterAction` stub), **GUEST-CHECKOUT-COV** (test
     debt — every checkout spec ran authenticated; the session-4
     guest-cart bug hid for three rounds behind exactly this gap).
4. Wrote `docs/remediation-plan-session6.md` (issue inventory with
   evidence, dependency sweeps — no spec pins stock or admin behavior,
   the seed upsert restores stock 25 per E2E run, `/login` static-ness
   pinned nowhere — TDD plan, sign-off criteria) and validated it
   against the codebase.
5. **TDD RED:** 10 unit tests (5 `clampToStock` + 5 `validateRedirectPath`
   — both seams undefined) + 2 E2E stock tests failing at the intended
   assertions (the clamp missing; the rejection missing).
   `guest-checkout.spec.ts` written as an additive pin (passes on the
   pre-fix build, as designed).
6. **TDD GREEN:** `clampToStock` pure seam; `addItem`/`changeQuantityBy`
   clamp at current stock (in-transaction re-read); `placeOrderAction`
   validates every line inside the placement transaction and decrements
   atomically; `validateRedirectPath` + wiring through `/account`,
   `/admin*`, and the login page/form (route now dynamic); dead stub
   removed; `guest-checkout.spec.ts` added. Four test bugs fixed during
   GREEN (admin-login URL expectation, strict-mode money-string
   collisions, the wizard-remount refill, the async admin Save wait) —
   all documented as lessons L14-era quirks in AGENTS.md/SKILL.md.
7. **Full suite green: 76 unit + 112 E2E = 188 total** (was 173).
8. **Live re-verification** (`scripts/verify-session6.ts`, Playwright
   against the dev server): guest `/account` → `/login?redirect=/account`
   → login lands on `/account`; the `//evil.com` payload ignored; a live
   order placement decremented stock 25 → 24. (Found en route: some
   agent-browser sessions route through the sandbox preview proxy and
   Next 16 aborts those Server-Action POSTs on the `x-forwarded-host`
   mismatch — drive action flows with Playwright; documented in the plan.)
9. **Tooling:** `prisma/dev-cleanup.ts` now restores canonical stock 25
   (placements decrement); `scripts/verify-session6.ts` +
   `scripts/capture-session6.ts` added. Dev DB returned to canonical
   state after the audit's live orders.
10. **Docs:** AGENTS.md (stock + redirect contracts, testing quirks:
    admin-login pattern, hydration races, wizard remount, guest specs),
    CLAUDE.md (ADR-013/014 bullets, counts, spec list), README.md
    (188 tests, inventory-integrity + redirect + guest-checkout rows),
    PAD v1.6 (ADR-013/014 full records, §8.1 table 23 files/188 tests,
    §11 round-7 candidates: admin order-detail view + admin E2E
    expansion), SKILL v1.6.0 (§9 rows 22-25, §12 lessons L14-L15),
    remediation plan checked off with outcome notes, this session log.
11. **Screenshots:** 4 new (37-redirect-gate, 38-admin-stock-editing,
    39-pdp-out-of-stock, 40-checkout-stock-rejected — VLM-verified) →
    40 total.
12. `.env.example` verified current (no new env plumbing this round —
    both fixes are pure code; all four documented vars match the code's
    `process.env` usage exactly).

## Result

- **4 findings closed:** STOCK-1 (server-side inventory: clamp + reject +
  atomic decrement — the admin's stock numbers now move with real
  sales), REDIRECT-1 (redirect-after-login with open-redirect
  hardening), DEAD-1 (stub removed), GUEST-CHECKOUT-COV (E2E pin).
- **Gate at ship:** lint 0/0 · tsc clean · 76/76 unit · build OK (21
  routes; `/login` dynamic) · 112/112 E2E = **188 total** (was 173).
- **First E2E coverage for the admin console** (the stock spec's admin
  seam) and **guest checkout**.
- `docs/remediation-plan-session6.md` records the full audit trail.
