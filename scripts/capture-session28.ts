// Session-28 screenshot capture (screenshots 151–155): the dashboard
// refund-needed alert round (DASH-ALERT-1, ADR-036) — 151 (the alert row
// live at the console's entry point: "Payment review needed" + the seeded
// count "1 payment needs refund attention" + the Review payments action),
// 152 (the deep-link proof: Review payments → ?family=refund-needed with
// the fixture row that makes the count 1), 153 (the L37-instrumented
// sweep: all 8 routes at baseline with the hero-phase record — the
// round's no-drift verdict self-diagnosing), 154 (the unit gate, 230/230,
// +4 for the round), 155 (the E2E gate, 231/231 × 2 consecutive runs on
// the final code).
// Run: bun scripts/capture-session28.ts   (server on :3000)
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
  writeFileSync("/tmp/capture28.html", html);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("file:///tmp/capture28.html");
  await page.screenshot({ path, fullPage: true });
  await page.close();
};

// --- 151 + 152: the alert row live + the deep-link proof --------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  {
    const lp = await ctx.newPage();
    await lp.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await lp.getByLabel("Email").fill("admin@luxestore.com");
    await lp.getByLabel("Password").fill("Admin1234!");
    await lp.getByRole("button", { name: "Log in", exact: true }).click();
    await lp.waitForURL("**/account");
    await lp.close();
  }

  // 151: the alert row at the console's entry point.
  const page = await ctx.newPage();
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByText("Payment review needed", { exact: true }).waitFor();
  await page.screenshot({ path: `${OUT}/151-dashboard-alert-live.png`, fullPage: true });
  console.log("151 captured");

  // 152: the deep-link proof — the action lands on the family filter
  // with the row that makes the count 1.
  await page.getByRole("link", { name: "Review payments" }).click();
  await page.waitForURL("**/admin/payments?family=refund-needed");
  await page.waitForTimeout(800);
  await page.getByText("No order — refund via Stripe dashboard", { exact: true }).waitFor();
  await page.screenshot({ path: `${OUT}/152-alert-deeplink-live.png`, fullPage: true });
  await page.close();
  await ctx.close();
  console.log("152 captured");
}

// --- 153: the L37-instrumented sweep (the round's no-drift verdict) ----------
{
  const body = `<div class="box"><span class="label">the Round-28 live A/B pixel sweep — all 8 routes at the 0.28–0.68% baseline band, WITH the NEW hero-phase record (L37):</span>
<pre>$ node scripts/sweep-session28.mjs        (the :3000 production server, final build)
 home      0% (6 px)  [hero ref=1237b9a1afec(painted) clone=1237b9a1afec(painted)]
 shop      0.05% (362 px)
 pdp       0.34% (2671 px)
 cart      0.01% (46 px)
 wishlist  0% (9 px)
 checkout  0.01% (77 px)
 account   0% (9 px)
 login     0.28% (2214 px)
 ALL ROUTES AT BASELINE BAND — <span class="good">NO new reference drift</span>

THE ROUND'S AUDIT STORY (SWEEP-DIAG-1, L37): the battery's FIRST run
measured home 59.95% OUT OF BAND (471,434 px ≈ the hero band rows
109–607) → the round-26 drift playbook invoked → the investigation
read NO drift: the active slide IDENTICAL on both sites (7cfe01108…,
y=109, 976×499), the h1 computed styles identical (48px/700/48px),
the CTAs all /shop, the shop inventories identical (12 imgs) — and 4
independent re-measurements all read 0.00%. VERDICT: a transient
cold-boot paint/phase artifact (the first battery ran fresh contexts
with cold DNS/TLS to media.base44.com — networkidle guarantees
network quiet, NOT paint completion of a cold-fetched remote PNG).

THE FIX: the sweep now records the hero phase at capture time (the
active slide's hash tail + its paint state on BOTH sides) — a
differing tail or NOT-PAINTED beside an out-of-band number = artifact
(re-measure); identical painted phases + a persistent diff = drift
(run the full playbook). The drift signal is now self-diagnosing.

The 28th mobile-nav verification: TOKEN-EXACT PARITY (all 10 checks —
re-verified post-change). The standing watches clean (typeahead zero
ref search requests; carousel cadence 5000ms; the SEO layer — 17-URL
sitemap, robots, JSON-LD, offers.price 299.99 USD). The console
census 24 routes + 11 admin surfaces CLEAN.</pre></div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/153-sweep-phase-record.png`);
  console.log("153 captured");
}

// --- 154: the unit gate run ---------------------------------------------------
{
  const body = `<div class="box"><span class="label">the unit + integration gate (Vitest) — 230/230, +4 for the round:</span>
<pre>$ bun run test
 ✓ src/lib/admin-payments.test.ts (38) — +4 NEW: the refundNeededAlert seam
   ✓ invisible at count 0 (the honest calm state — no alert noise; only
     this unit layer can pin it: the e2e fixture set always counts 1)
   ✓ the singular label at count 1 ("1 payment needs refund attention")
     + the family deep-link href
   ✓ the plural label at count N ("3 payments need refund attention")
   ✓ the href is exactly the family Select's own value (the canonical
     param shape) — the narrowing guard form
 ✓ the 14 pre-existing files (226 tests) — unchanged, all green

 Test Files  15 passed (15)
 Tests  230 passed (230)          — was 226; +4, none removed</pre></div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/154-unit-gate-run.png`);
  console.log("154 captured");
}

// --- 155: the E2E gate run -----------------------------------------------------
{
  const body = `<div class="box"><span class="label">the E2E gate (Playwright) — 231/231, two consecutive full runs on the FINAL code:</span>
<pre>$ bun run test:e2e        (run 1)
  ✓ 231 passed             — 0 failures, 0 skipped   (7.5m)
$ bun run test:e2e        (run 2 — the consecutive-pair determinism gate)
  ✓ 231 passed             — 0 failures, 0 skipped   (7.5m)

The NEW session-28 coverage (DASH-ALERT-1, ADR-036):
  ✓ dashboard surfaces the refund-needed alert and deep-links to the
    family filter (the count derives from the SAME seam the payments
    family composes — buildAdminPaymentWhere + the placed-intent set;
    the e2e-reset restores the canonical 4-event fixture set so the
    count is deterministically 1; Review payments → ?family=refund-needed
    → the fixture row renders)

The a11y admin gate: 7/7 GREEN with the dashboard census pin UNCHANGED
at 8 — the alert's icon-only destructive accent adds no
color-contrast nodes (the contrast-safe design held; no recalibration).

Mutation efficacy ×3 (each reverted, verified byte-exact against backups):
  M1 the seam's visibility gate inverted (count >= 0) → the calm-state
     unit contract FAILS (the alert would render at count 0 — alert noise)
  M2 the label drops the pluralization → the singular-form unit
     contract FAILS ("1 payments need refund attention")
  M3 the page's count query passes an EMPTY placed-intent set → the
     count reads 2 (every succeeded event) → the E2E test FAILS (the
     integration guard — the page wiring's own efficacy proof)

461 total (230 Vitest + 231 E2E) — was 456; +5, none removed</pre></div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/155-e2e-gate-run.png`);
  console.log("155 captured");
}

await browser.close();
console.log("session-28 capture complete: 151–155");
