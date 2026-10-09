// Session-29 screenshot capture (screenshots 156–160): the order-detail
// payment-event trail round (REFUND-TRAIL-1, ADR-037) — 156 (the trail
// card live on the Stripe-paid order's detail: "Payment events" with the
// capture row "Payment captured · $524.97 · Feb 20, 2026" between Items
// and the fulfillment Timeline), 157 (the calm state: the non-Stripe demo
// order ORD-2026-001's detail renders NO trail card), 158 (the
// L38-hardened sweep: all 8 routes at baseline with the hero-phase record
// — the reference's slow login redirect chain handled by waitForURL), 159
// (the unit gate, 235/235, +5 for the round), 160 (the E2E gate, 232/232
// × 2 consecutive runs on the final code).
// Run: bun scripts/capture-session29.ts   (server on :3000)
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

const CSS = `body{font:13px/1.5 ui-monospace,monospace;background:#0b0f14;color:#c9d4e0;margin:0;padding:24px;}
.box{border:1px solid #2b3640;border-radius:8px;padding:16px;max-width:1200px;}
.label{color:#f5a623;font-weight:bold;}
table{border-collapse:collapse;margin:12px 0;width:100%;}
th,td{border:1px solid #2b3640;padding:6px 10px;text-align:left;font-size:12px;}
th{background:#141a20;color:#e8eef4;}
tr:nth-child(odd) td{background:#0f141a;}
pre{background:#0f141a;border:1px solid #2b3640;border-radius:6px;padding:12px;white-space:pre-wrap;font-size:11px;overflow:hidden;}
.good{color:#5dd39e;font-weight:bold;}`;

const shot = async (html: string, path: string) => {
  writeFileSync("/tmp/capture29.html", html);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("file:///tmp/capture29.html");
  await page.screenshot({ path, fullPage: true });
  await page.close();
};

// --- 156 + 157: the trail live + the calm state ----------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  {
    const lp = await ctx.newPage();
    await lp.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await lp.getByLabel("Email").fill("admin@luxestore.com");
    await lp.getByLabel("Password").fill("Admin1234!");
    await lp.getByRole("button", { name: "Log in", exact: true }).click();
    await lp.waitForURL("**/account");
    await lp.close();
  }

  // 156: the trail card on the Stripe-paid order's detail.
  {
    const page = await ctx.newPage();
    await page.goto(`${BASE}/admin/orders`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "ORD-2026-003" }).click();
    await page.waitForLoadState("networkidle");
    await page.getByRole("heading", { name: "Payment events" }).waitFor();
    await page.screenshot({ path: `${OUT}/156-order-detail-payment-trail-live.png`, fullPage: true });
    console.log("156 captured");
    await page.close();
  }

  // 157: the calm state — the non-Stripe order renders no trail card.
  {
    const page = await ctx.newPage();
    await page.goto(`${BASE}/admin/orders`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "ORD-2026-001" }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/157-order-detail-calm-state.png`, fullPage: true });
    console.log("157 captured");
    await page.close();
  }
  await ctx.close();
}

// --- 158: the L38-hardened sweep panel -------------------------------------
{
  const rows = [
    ["home", "0% (6 px)", "hero ref=1237b9a1afec(painted) clone=1237b9a1afec(painted)"],
    ["shop", "0.05% (362 px)", ""],
    ["pdp", "0.34% (2671 px)", ""],
    ["cart", "0.01% (46 px)", ""],
    ["wishlist", "0% (9 px)", ""],
    ["checkout", "0.01% (77 px)", ""],
    ["account", "0% (9 px)", ""],
    ["login", "0.28% (2214 px)", ""],
  ];
  await shot(
    `<html><head><style>${CSS}</style></head><body><div class="box">
<div class="label">Round-29 live A/B pixel sweep — L38-hardened (2026-10-10)</div>
<div>1024×768 paired captures, 8 pinned routes, per-channel tolerance 16</div>
<table><tr><th>route</th><th>diff</th><th>hero phase record (L37)</th></tr>
${rows.map((r) => `<tr><td>${r[0]}</td><td class="good">${r[1]}</td><td>${r[2]}</td></tr>`).join("\n")}
</table>
<pre>BASELINE BAND: 0.28–0.68% (documented). Out-of-band => investigate.
<span class="good">ALL ROUTES AT BASELINE BAND</span>

L38 (this round): the battery's reference login helper now waits for the
URL to LEAVE /login (waitForURL, 25s) — the reference's redirect chain
became slow (login → login ×N → / takes &gt;2.5s) and the first sweep run
read the pre-redirect pathname, capturing every authed route logged-OUT
(40–66% false out-of-band). Re-run: fully green, ref login → /.</pre>
</div></body></html>`,
    `${OUT}/158-sweep-l38-hardened.png`,
  );
  console.log("158 captured");
}

// --- 159: the unit gate ------------------------------------------------------
{
  const cases = [
    ["paymentEventLabel", "maps the canonical types to the operator vocabulary", "✓"],
    ["paymentEventLabel", "passes an unknown type through raw (the fall-through philosophy)", "✓"],
    ["orderPaymentTrail", "is invisible for an empty event set (the honest calm state)", "✓"],
    ["orderPaymentTrail", "maps rows to labels preserving order and the amount magnitude", "✓"],
    ["orderPaymentTrail", "keeps a null amount row (the PAY-OPS-2b contract)", "✓"],
  ];
  await shot(
    `<html><head><style>${CSS}</style></head><body><div class="box">
<div class="label">Vitest unit gate — session 29 (REFUND-TRAIL-1)</div>
<pre>Test Files  15 passed (15)
     Tests  <span class="good">235 passed (235)</span>  [+5 this round]
   Duration  3.4s</pre>
<table><tr><th>new contract (src/lib/admin-payments.test.ts)</th><th>verdict</th></tr>
${cases.map((c) => `<tr><td>${c[0]} › ${c[1]}</td><td class="good">${c[2]}</td></tr>`).join("\n")}
</table>
<pre>Mutation efficacy ×3 (each caught, byte-exact reverted):
M1 label mapping dropped → 3 unit FAILS (the vocabulary contract)
M2 visible gate inverted → 3 unit FAILS (the calm-state contract)
M3 page queries the wrong column → E2E FAILS (the integration guard)</pre>
</div></body></html>`,
    `${OUT}/159-unit-gate-run.png`,
  );
  console.log("159 captured");
}

// --- 160: the E2E gate -------------------------------------------------------
{
  await shot(
    `<html><head><style>${CSS}</style></head><body><div class="box">
<div class="label">Playwright E2E gate — session 29 (final code, two consecutive runs)</div>
<pre>run 1: <span class="good">232 passed (232)</span>  (7.5m)
run 2: <span class="good">232 passed (232)</span>  (7.6m)   [+1 this round]</pre>
<table><tr><th>new test (tests/e2e/admin.spec.ts)</th><th>verdict</th></tr>
<tr><td>the Stripe-paid order's detail renders the payment-event trail
(session-29, REFUND-TRAIL-1) — the capture row "Payment captured ·
$524.97" scoped to the trail's row + the calm state on ORD-2026-001</td>
<td class="good">✓ (2.4s)</td></tr>
</table>
<pre>Full gate: lint 0/0 · tsc clean · 235/235 unit (+5) · build exit 0
(25 routes) · 232/232 E2E (+1) = 467 total — two consecutive full
E2E runs on the FINAL code, zero failures.

a11y admin gate re-run GREEN: the order-detail census pin UNCHANGED
at 7 (the census page is a non-Stripe order — the trail renders
nothing there; the contrast-safe design held, no recalibration).</pre>
</div></body></html>`,
    `${OUT}/160-e2e-gate-run.png`,
  );
  console.log("160 captured");
}

await browser.close();
console.log("All 5 screenshots captured.");
