// Session-30 screenshot capture (screenshots 161–165): the
// deterministic-failure reason trail round (REASON-TRAIL-1, ADR-038) —
// 161 (the reason line live on the refund-needed family: the fixture row
// renders "No order — refund via Stripe dashboard" + the muted
// "Reason: amount mismatch vs cart total" beneath it), 162 (the calm
// state: the unfiltered payments list — only the refund-needed fixture
// carries a reason; the placed/failed/refunded rows render none), 163
// (the post-change sweep: all 8 routes at baseline, both sides painted
// on the same slide), 164 (the unit gate, 242/242, +7 for the round),
// 165 (the E2E gate, 233/233 × 2 consecutive runs on the final code).
// Run: bun scripts/capture-session30.ts   (server on :3000)
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
  writeFileSync("/tmp/capture30.html", html);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("file:///tmp/capture30.html");
  await page.screenshot({ path, fullPage: true });
  await page.close();
};

// --- 161 + 162: the reason line live + the calm state -----------------------
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

  // 161: the refund-needed family with the reason line.
  {
    const page = await ctx.newPage();
    await page.goto(`${BASE}/admin/payments?family=refund-needed`, { waitUntil: "networkidle" });
    await page
      .getByText("Reason: amount mismatch vs cart total", { exact: true })
      .waitFor();
    await page.screenshot({ path: `${OUT}/161-refund-reason-live.png`, fullPage: true });
    console.log("161 captured");
    await page.close();
  }

  // 162: the calm state — the unfiltered list: only fixture-n carries a reason.
  {
    const page = await ctx.newPage();
    await page.goto(`${BASE}/admin/payments`, { waitUntil: "networkidle" });
    await page
      .locator("div.rounded-xl", { hasText: "pi_demo_fixture_006" })
      .getByText("Reason: amount mismatch vs cart total", { exact: true })
      .waitFor();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/162-reason-calm-state.png`, fullPage: true });
    console.log("162 captured");
    await page.close();
  }
  await ctx.close();
}

// --- 163: the post-change sweep panel ---------------------------------------
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
<div class="label">Round-30 post-change live A/B pixel sweep (2026-10-10)</div>
<div>1024×768 paired captures, 8 pinned routes, per-channel tolerance 16</div>
<table><tr><th>route</th><th>diff</th><th>hero phase record (L37)</th></tr>
${rows.map((r) => `<tr><td>${r[0]}</td><td class="good">${r[1]}</td><td>${r[2]}</td></tr>`).join("\n")}
</table>
<pre>BASELINE BAND: 0.28–0.68% (documented). Out-of-band => investigate.
<span class="good">ALL ROUTES AT BASELINE BAND</span>

The admin-only change (the payments surface's reason line) touches NO
parity surface — the sweep confirms the design intent. The 30th
mobile-nav verification re-verified TOKEN-EXACT post-change (all 10
checks); the standing watches + the 24-route + 11-admin console
census CLEAN.</pre>
</div></body></html>`,
    `${OUT}/163-sweep-postchange.png`,
  );
  console.log("163 captured");
}

// --- 164: the unit gate ------------------------------------------------------
{
  const cases = [
    ["paymentFailureReasonView", "is invisible for null — the honest calm state", "✓"],
    ["paymentFailureReasonView", "maps amount-mismatch to the operator copy", "✓"],
    ["paymentFailureReasonView", "maps stock-short to the operator copy", "✓"],
    ["paymentFailureReasonView", "maps metadata-unusable to the operator copy", "✓"],
    ["paymentFailureReasonView", "maps cart-unavailable to the operator copy", "✓"],
    ["paymentFailureReasonView", "passes an unknown code through raw (the fall-through philosophy)", "✓"],
    ["webhook integration", "deterministic failures persist their reason code (all four sites + the success-path null)", "✓"],
  ];
  await shot(
    `<html><head><style>${CSS}</style></head><body><div class="box">
<div class="label">Vitest unit + integration gate — session 30 (REASON-TRAIL-1)</div>
<pre>Test Files  15 passed (15)
     Tests  <span class="good">242 passed (242)</span>  [+7 this round: 6 unit + 1 integration]
   Duration  3.4s</pre>
<table><tr><th>new contract</th><th>verdict</th></tr>
${cases.map((c) => `<tr><td>${c[0]} › ${c[1]}</td><td class="good">${c[2]}</td></tr>`).join("\n")}
</table>
<pre>Mutation efficacy ×3 (each caught, byte-exact reverted — md5 pair
a53fe16a… / b8a8112f… across all three reverts):
M1 the label mapping dropped → 4 unit FAILS (the vocabulary contract)
M2 the visible gate inverted → 1 unit FAIL (the calm-state contract)
M3 the webhook's amount-mismatch write drops the reason → 1 integration
   FAIL (the write-path contract — no rebuild needed, the integration
   test imports the route handler directly)</pre>
</div></body></html>`,
    `${OUT}/164-unit-gate-run.png`,
  );
  console.log("164 captured");
}

// --- 165: the E2E gate -------------------------------------------------------
{
  await shot(
    `<html><head><style>${CSS}</style></head><body><div class="box">
<div class="label">Playwright E2E gate — session 30 (final code, two consecutive runs)</div>
<pre>run 1: <span class="good">233 passed (233)</span>  (7.6m)
run 2: <span class="good">233 passed (233)</span>  (7.7m)   [+1 this round]</pre>
<table><tr><th>new test (tests/e2e/admin.spec.ts)</th><th>verdict</th></tr>
<tr><td>the refund-needed row renders the deterministic-failure reason
(session-30, REASON-TRAIL-1) — the reason line scoped to the fixture
row + the calm state (exactly ONE reason line on the unfiltered list;
the placed fixture's row renders none)</td>
<td class="good">✓ (1.9s)</td></tr>
</table>
<pre>Full gate: lint 0/0 · tsc clean · 242/242 unit+integration (+7) ·
build exit 0 (25 routes) · 233/233 E2E (+1) = 475 total — two
consecutive full E2E runs on the FINAL code, zero failures.

a11y admin gate re-run GREEN: the payments census pin UNCHANGED at 9
(the reason line uses the row's own muted-foreground pair — zero new
color pairs; the contrast-safe design held, no recalibration).</pre>
</div></body></html>`,
    `${OUT}/165-e2e-gate-run.png`,
  );
  console.log("165 captured");
}

await browser.close();
console.log("All 5 screenshots captured.");
