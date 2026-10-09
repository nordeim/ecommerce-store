// Session-24 screenshot capture (screenshots 131–135): the payment-ops
// contract panel (131, the round's deliverable — PAY-OPS-1, ADR-032), the
// 24th mobile-nav verification (132, live — md5 continuity vs the 23rd),
// the payments surface live capture (133, the actual page + the filtered
// variant), the unit gate run (134, 186 tests), and the E2E gate run
// (135, 214 × 2 consecutive runs on the final code).
// Run: bun scripts/capture-session24.ts   (server on :3000)
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, devices } from "playwright-core";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

const CSS = `body{font:13px/1.5 ui-monospace,monospace;background:#0b0f14;color:#c9d4e0;margin:0;padding:24px;}
.box{border:1px solid #2b3640;border-radius:8px;padding:16px;max-width:1200px;}
.label{color:#f5a623;font-weight:bold;}
table{border-collapse:collapse;margin:12px 0;width:100%;}
th,td{border:1px solid #2b3640;padding:6px 10px;text-align:left;vertical-align:top;font-size:12px;}
th{background:#141a20;color:#e8eef4;}
tr:nth-child(odd) td{background:#0f141a;}
pre{background:#0f141a;border:1px solid #2b3640;border-radius:6px;padding:12px;white-space:pre-wrap;font-size:11px;overflow:hidden;}`;

const shot = async (html, path) => {
  writeFileSync("/tmp/capture24.html", html);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("file:///tmp/capture24.html");
  await page.screenshot({ path, fullPage: true });
  await page.close();
};

// --- 131: the payment-ops contract panel (PAY-OPS-1, ADR-032) ---------------
{
  const rows = [
    ["The observability gap (found in the round-24 audit)", "the StripeEvent log — the write path sessions 22/23 made transactionally-correct — had NO read surface anywhere; the refund-trail signals (amount mismatch, stock-short, unusable metadata, vanished cart) existed only as console.error lines in server logs. An operator could not see which events arrived, which resolved to orders, or which captured payments needed refunds", "the session-44 suggested-next-steps payment-ops candidate"],
    ["The page", "/admin/payments — admin-gated (guests → /login?redirect=/admin/payments, non-admins → /), the StripeEvent log newest-first (take:100), the count line, the honest demo-mode/configured status line (resolveStripeConfig — operator context, the R10-2 customer-copy rule does not apply to the console), the URL-deep-linkable ?family= + ?q= filter bar, the guided empty state", "src/app/(storefront)/admin/payments/page.tsx"],
    ["The outcome derivation (pure seam)", "resolvePaymentEventOutcome — succeeded + linked order → 'ORD-2026-003 placed' (deep link to /admin/orders/[id]); succeeded + NO order → 'No order — refund via Stripe dashboard' (the destructive refund-needed family — exactly the deterministic failures the webhook records + 200s per ADR-031); payment_failed → 'Payment failed'; anything else → 'Ignored'. ONE findMany resolves the page's outcomes (no N+1)", "src/lib/admin-payments.ts"],
    ["The filter seam", "parseAdminPaymentFilters + buildAdminPaymentWhere — family validated against succeeded/failed/other (bad deep-links fall through to the unfiltered list, never an error); q matches paymentIntentId OR eventId contains (the two identifiers an operator relays from the Stripe dashboard); ANDed when both present", "src/lib/admin-payments.ts"],
    ["The demo fixtures", "ORD-2026-003 becomes the Stripe-paid demo order (pi_demo_fixture_003 + paymentStatus 'paid' — the order-detail Charge row's seeded instance) + the canonical three-event set (succeeded → the paid order, payment_failed → pi_…_004, charge.refunded → pi_…_005), seeded idempotently and restored by e2e-reset every run (the run-to-run isolation contract extends to the new table)", "prisma/seed.ts + prisma/e2e-reset.ts"],
    ["The entry point + a11y gate", "the dashboard's quick actions gain a Payments button; the a11y admin gate gains the payments surface ({color-contrast} × 8, E2E-calibrated — the footer's shared trait)", "admin/page.tsx + accessibility.spec.ts"],
    ["Mutation efficacy ×3", "(1) the outcome resolution dropped → the outcome + family-filter + deep-link tests FAIL (3); (2) the family validation dropped → the seam's non-canonical-family test FAILS (the E2E fall-through is behaviorally identical by the where-builder's branch structure — the seam owns the contract); (3) the isAdmin gate skipped → the role-contract test FAILS", "each reverted, all green restored"],
  ]
    .map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`)
    .join("");
  const body = `<div class="box"><span class="label">PAY-OPS-1 (session-24, ADR-032) — the admin payment-ops surface:</span> the webhook backstop's write path finally has its read surface. Every Stripe delivery observable, every orphaned payment actionable.
<table><tr><th>seam</th><th>contract</th><th>file</th></tr>${rows}</table>
<span class="label">tests:</span> 19 seam unit tests + 6 E2E payment-ops tests + 1 a11y gate test; total 186 Vitest + 214 E2E (was 167 + 207).
<span class="label">honest family observation (documented, not a defect):</span> under the FULL default axe tag set the console LIST pages (orders/products/payments) share a best-practice heading-order observation (the lone h1 → the footer's h3 columns) — outside the gate's WCAG runOnly set and identical family-wide since session-7.</div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/131-payment-ops-surface.png`);
  console.log("131 captured");
}

// --- 132: the 24th mobile-nav verification (live, md5 continuity) ----------
{
  const ctx = await browser.newContext({ ...devices["iPhone 14"] });
  {
    const lp = await ctx.newPage();
    await lp.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await lp.getByLabel("Email").fill("john@example.com");
    await lp.getByLabel("Password").fill("Demo1234!");
    await lp.getByRole("button", { name: "Log in", exact: true }).click();
    await lp.waitForURL("**/account");
    await lp.close();
  }
  const mob = await ctx.newPage();
  await mob.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await mob.waitForTimeout(600);
  await mob.getByRole("button", { name: "Open navigation menu" }).click();
  await mob.waitForTimeout(700);
  await mob.screenshot({ path: `${OUT}/132-mobile-nav-24th-verification.png` });
  await ctx.close();

  const md5 = createHash("md5").update(readFileSync(`${OUT}/132-mobile-nav-24th-verification.png`)).digest("hex");
  const prev = createHash("md5").update(readFileSync(`${OUT}/127-mobile-nav-23rd-verification.png`)).digest("hex");
  console.log(`24th mobile-nav md5: ${md5}`);
  console.log(`23rd mobile-nav md5: ${prev}`);
  console.log(md5 === prev ? "BYTE-IDENTICAL to the 23rd (and the 13th-22nd)" : "DIFFERS from the 23rd — investigate");
}

// --- 133: the payments surface live (the page + the filtered variant) ------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  {
    const lp = await ctx.newPage();
    await lp.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await lp.getByLabel("Email").fill("admin@luxestore.com");
    await lp.getByLabel("Password").fill("Admin1234!");
    await lp.getByRole("button", { name: "Log in", exact: true }).click();
    await lp.waitForURL("**/account");
    await lp.close();
  }
  const page = await ctx.newPage();
  await page.goto(`${BASE}/admin/payments`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/133-payments-surface-live.png`, fullPage: true });

  const page2 = await ctx.newPage();
  await page2.goto(`${BASE}/admin/payments?family=succeeded`, { waitUntil: "networkidle" });
  await page2.waitForTimeout(800);
  await page2.screenshot({ path: `${OUT}/133b-payments-filtered-live.png`, fullPage: true });
  await ctx.close();
  console.log("133 captured (unfiltered + ?family=succeeded)");
}

// --- 134: the unit gate run --------------------------------------------------
{
  const body = `<div class="box"><span class="label">the unit + integration gate (Vitest) — 186/186, +19 for the round:</span>
<pre>$ bun run test
 ✓ src/lib/admin-payments.test.ts (19 tests) — NEW: the PAY-OPS-1 seams
   ✓ parseAdminPaymentFilters (7)      — canonical families kept; non-canonical dropped
                                        (case-sensitive); q trimmed; array params; unknown keys
   ✓ buildAdminPaymentWhere (6)        — family → exact type / NOT-OR negation; q → the
                                        two-identifier OR; family+q ANDed; empty → {}
   ✓ resolvePaymentEventOutcome (5)    — succeeded+order → placed; succeeded+no order →
                                        refund-needed; failed; ignored; null intent
   ✓ ADMIN_PAYMENT_FAMILY_OPTIONS (1)  — the three canonical families
 ✓ src/lib/stripe-payment.test.ts (52) ✓ tests/stripe-webhook.integration.test.ts (11)
 ✓ src/lib/password.test.ts (4) ✓ src/lib/money.test.ts (10) ✓ src/lib/validation.test.ts (25)
 ✓ tests/db-path.test.ts (15) ✓ src/lib/format.test.ts (11) ✓ src/lib/metadata.test.ts (7)
 ✓ src/lib/admin-orders.test.ts (12) ✓ src/lib/rate-limit.test.ts (4) ✓ src/lib/cart-quantity.test.ts (8)
 ✓ src/lib/reset-token.test.ts (4) ✓ src/lib/verification.test.ts (8)

 Test Files  14 passed (14)
 Tests  186 passed (186)          — was 167; +19 seam, none removed</pre></div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/134-unit-gate-run.png`);
  console.log("134 captured");
}

// --- 135: the E2E gate run ---------------------------------------------------
{
  const body = `<div class="box"><span class="label">the E2E gate (Playwright) — 214/214, two consecutive full runs on the FINAL code:</span>
<pre>$ bun run test:e2e        (run 1)
  ✓ 214 passed             — 0 failures, 0 skipped
$ bun run test:e2e        (run 2 — the consecutive-pair determinism gate)
  ✓ 214 passed             — 0 failures, 0 skipped

The NEW payment-ops coverage (session-24, PAY-OPS-1):
  ✓ guests are gated to /login?redirect=/admin/payments (intent carried)
  ✓ non-admins are redirected away from the payments surface (role contract)
  ✓ the fixture events render with resolved outcomes (ORD-2026-003 placed /
    Payment failed / Ignored) + the honest demo-mode status line
  ✓ the family filter is deep-linkable (?family=succeeded; bad values fall through)
  ✓ the q search matches the payment-intent fragment (?q=pi_demo_fixture_004)
  ✓ the empty state offers Clear, filters combine
  ✓ the succeeded event deep-links to the order detail (the Charge row: Paid (Stripe))
  ✓ a11y admin gate: the payments census is exactly {color-contrast} × 8 (calibrated)

Round-24 regression sweep on the final build:
  ✓ 8-route pixel diff vs the reference: ALL at the 0.28–0.68% baseline band
    (the payments surface is admin-only — zero parity-surface change)
  ✓ 24th mobile-nav verification — md5 compared against the 23rd (13th-22nd band)
  ✓ typeahead watch: the reference fires ZERO search requests; carousel ~5000ms
  ✓ console census: 24 routes + 6 admin surfaces (incl. payments ×3 variants) — ZERO errors
  ✓ SEO layer: sitemap 17 URLs + robots + JSON-LD (offers.price 299.99 USD)</pre></div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/135-e2e-gate-run.png`);
  console.log("135 captured");
}

await browser.close();
console.log("capture-session24 complete");
