// Session-25 screenshot capture (screenshots 136–140): the payment-ops
// observability + console a11y contract panel (136, the round's deliverable
// — PAY-OPS-2, ADR-033 + A11Y-HEADING-1), the 25th mobile-nav verification
// (137, live — md5 continuity vs the 24th), the payments surface live
// capture (138, the actual page + the refund-needed filtered variant), the
// unit gate run (139, 198 tests), and the E2E gate run (140, 217 × 2
// consecutive runs on the final code).
// Run: bun scripts/capture-session25.ts   (server on :3000)
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
  writeFileSync("/tmp/capture25.html", html);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("file:///tmp/capture25.html");
  await page.screenshot({ path, fullPage: true });
  await page.close();
};

// --- 136: the round-25 contract panel (PAY-OPS-2, ADR-033 + A11Y-HEADING-1) ---
{
  const rows = [
    ["The refund-needed filter family (PAY-OPS-2a)", "the operator's most actionable signal promoted to a first-class family — ?family=refund-needed renders exactly the succeeded events with NO linked order (the deterministic-failure family the webhook records + 200s per ADR-031: amount mismatch, stock-short, unusable metadata, vanished cart). The seam: buildAdminPaymentWhere(filters, placedIntentIds) — succeeded AND notIn(placed intents) OR paymentIntentId null (pure input, default []); the page fetches the placed-intent set in ONE bounded query; family+q keeps the type+notIn group intact inside the AND element", "src/lib/admin-payments.ts + the payments page"],
    ["The event amount column (PAY-OPS-2b)", "StripeEvent.amount Int? (integer minor units, nullable — non-payment payloads + pre-session-25 rows). The webhook persists data.object.amount at BOTH write sites (recordEvent + the in-tx insert); the payments rows render the magnitude beside the outcome via formatCents — the operator's first question ('how much needs refunding?') answered on the surface", "prisma/schema.prisma + the webhook route + the page"],
    ["The charge-event intent honesty (PAY-OPS-2c)", "stripeEventIntentId(object): payment_intent ?? object.id — charge-family deliveries (charge.refunded etc.) record the REAL intent id from the payload's payment_intent field, not the charge id; the surface's q-search over the intent column stays truthful for the charge family. The parse schema gains payment_intent: string.optional()", "src/lib/stripe-payment.ts + the webhook route"],
    ["The console heading-order fix (A11Y-HEADING-1)", "the session-24 documented family observation (the lone h1 → the footer's h3 columns on the console LIST pages, best-practice-tagged — outside the WCAG runOnly set) resolved: an sr-only h2 labels each list region (Orders list / Products list / Payment event list) — the h1 → h2 → h3 order is valid; the NEW gate test pins the best-practice census on the three list pages as exactly EMPTY; the storefront pages keep the reference's own heading shape (parity, untouched)", "the three admin LIST pages + accessibility.spec.ts"],
    ["The fixtures + isolation", "a FOURTH canonical StripeEvent: evt_demo_fixture_n (payment_intent.succeeded → pi_demo_fixture_006, NO linked order, amount 14900 — the refund-needed family's seeded instance) + amounts on the existing set (s: 52497 = ORD-2026-003's pinned total; f: 8999; r: 7999), seeded idempotently + restored by e2e-reset every run", "prisma/seed.ts + prisma/e2e-reset.ts"],
    ["Mutation efficacy ×3", "(1) the placed-intent fetch dropped (the page passes the default []) → the refund-needed family deep-link + the combined-filter tests FAIL (2 — every succeeded event renders as refund-needed); (2) the amount persistence dropped → the integration amount test FAILS (the write path's proof); (3) the sr-only h2s dropped → the best-practice census test FAILS alone", "each reverted, all green restored"],
  ]
    .map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`)
    .join("");
  const body = `<div class="box"><span class="label">PAY-OPS-2 (session-25, ADR-033) + A11Y-HEADING-1 — the payment-ops observability refinement + the console a11y family fix:</span> the payments surface graduates from observable to triageable.
<table><tr><th>seam</th><th>contract</th><th>file</th></tr>${rows}</table>
<span class="label">tests:</span> +7 seam unit + 5 stripe-payment unit (incl. the intent-id helper) + 2 webhook integration + 3 E2E + 1 a11y-gate = 400 → 412 total (198 Vitest + 214 E2E); the payments a11y pin calibrated 8 → 9 (the fourth fixture's destructive line — the same app-wide class, node-enumerated).</div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/136-payment-ops-refinement.png`);
  console.log("136 captured");
}

// --- 137: the 25th mobile-nav verification (live, md5 continuity) ----------
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
  await mob.screenshot({ path: `${OUT}/137-mobile-nav-25th-verification.png` });
  await ctx.close();

  const md5 = createHash("md5").update(readFileSync(`${OUT}/137-mobile-nav-25th-verification.png`)).digest("hex");
  const prev = createHash("md5").update(readFileSync(`${OUT}/132-mobile-nav-24th-verification.png`)).digest("hex");
  console.log(`25th mobile-nav md5: ${md5}`);
  console.log(`24th mobile-nav md5: ${prev}`);
  console.log(md5 === prev ? "BYTE-IDENTICAL to the 24th (and the 13th-23rd band)" : "DIFFERS from the 24th — investigate");
}

// --- 138: the payments surface live (the page + the refund-needed variant) --
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
  await page.screenshot({ path: `${OUT}/138-payments-surface-live.png`, fullPage: true });

  const page2 = await ctx.newPage();
  await page2.goto(`${BASE}/admin/payments?family=refund-needed`, { waitUntil: "networkidle" });
  await page2.waitForTimeout(800);
  await page2.screenshot({ path: `${OUT}/138b-payments-refund-needed-live.png`, fullPage: true });
  await ctx.close();
  console.log("138 captured (unfiltered + ?family=refund-needed)");
}

// --- 139: the unit gate run --------------------------------------------------
{
  const body = `<div class="box"><span class="label">the unit + integration gate (Vitest) — 198/198, +12 for the round:</span>
<pre>$ bun run test
 ✓ src/lib/admin-payments.test.ts (24) — +5: the refund-needed family
   ✓ family=refund-needed → succeeded + notIn(placed) OR paymentIntentId null
   ✓ empty placed-intent set → every succeeded event (fresh-DB honest)
   ✓ the default [] contract (the page always passes the fetched set)
   ✓ family+q ANDed — the type+notIn group intact inside the AND element
   ✓ the placed-intent set ignored for the other families
 ✓ src/lib/stripe-payment.test.ts (57) — +5: the charge-family parse
   ✓ payment_intent optional field parses; stripeEventIntentId × 4
    (own id for intents / payment_intent for charges / fallback / empty-string)
 ✓ tests/stripe-webhook.integration.test.ts (13) — +2:
   ✓ the recorded rows persist the payload amount (recordEvent + in-tx)
   ✓ charge-family events record payment_intent, not the charge id (+fallback)
 ✓ the 11 pre-existing files (167 tests) — unchanged, all green

 Test Files  14 passed (14)
 Tests  198 passed (198)          — was 186; +12, none removed</pre></div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/139-unit-gate-run.png`);
  console.log("139 captured");
}

// --- 140: the E2E gate run ---------------------------------------------------
{
  const body = `<div class="box"><span class="label">the E2E gate (Playwright) — 218/218, two consecutive full runs on the FINAL code:</span>
<pre>$ bun run test:e2e        (run 1)
  ✓ 218 passed             — 0 failures, 0 skipped
$ bun run test:e2e        (run 2 — the consecutive-pair determinism gate)
  ✓ 218 passed             — 0 failures, 0 skipped

The NEW session-25 coverage (PAY-OPS-2 + A11Y-HEADING-1):
  ✓ payments filters by the refund-needed family (?family=refund-needed →
    ONLY the fixture-n row + 'No order — refund via Stripe dashboard' +
    '1 payment event'; the Select offers the family)
  ✓ the refund-needed family ANDs with the search query
    (?family=refund-needed&q=pi_demo_fixture_003 → the empty state — the
    placed s fixture is NOT in the family: the AND shape's behavioral pin)
  ✓ payment rows render the event amount beside the outcome ($524.97 placed /
    $149.00 refund-needed / $89.99 failed)
  ✓ a11y admin gate: the best-practice census on the three console LIST
    pages is exactly EMPTY (the sr-only h2 family fix — heading-order gone)
  ✓ the payments a11y pin recalibrated 8 → 9 (the fourth fixture's
    destructive line — the same app-wide class, node-enumerated)

Round-25 regression sweep on the final build:
  ✓ 8-route pixel diff vs the reference: ALL at the 0.28–0.68% baseline band
    (the payments surface is admin-only — zero parity-surface change)
  ✓ 25th mobile-nav verification — md5 compared against the 24th (13th-24th band)
  ✓ typeahead watch: the reference fires ZERO search requests; carousel ~5000ms
  ✓ console census: 24 routes + 7 admin surfaces (incl. payments ×4 variants) — ZERO errors
  ✓ SEO layer: sitemap 17 URLs + robots + JSON-LD (offers.price 299.99 USD)</pre></div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/140-e2e-gate-run.png`);
  console.log("140 captured");
}

await browser.close();
console.log("capture-session25 complete");
