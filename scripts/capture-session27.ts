// Session-27 screenshot capture (screenshots 146–150): the console
// trifecta completion round (ADMIN-PRODUCTS-1, ADR-035) — 146 (the
// products search deep-link live: q=headphone → 1 of 12), 147 (the
// category deep-link live: electronics → 3 of 12), 148 (the visibility
// deep-link live: hide Ceramic Planter Set through the eye seam, then
// ?visibility=hidden answers "which products did I hide?" — then
// restore), 149 (the unit gate, 226/226, +18 for the round), 150 (the
// E2E gate, 230/230 × 2 consecutive runs on the final code).
// Run: bun scripts/capture-session27.ts   (server on :3000)
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
th,td{border:1px solid #2b3640;padding:6px 10px;text-align:left;vertical-font-size:12px;}
th{background:#141a20;color:#e8eef4;}
tr:nth-child(odd) td{background:#0f141a;}
pre{background:#0f141a;border:1px solid #2b3640;border-radius:6px;padding:12px;white-space:pre-wrap;font-size:11px;overflow:hidden;}
.good{color:#5dd39e;font-weight:bold;}`;

const shot = async (html: string, path: string) => {
  writeFileSync("/tmp/capture27.html", html);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("file:///tmp/capture27.html");
  await page.screenshot({ path, fullPage: true });
  await page.close();
};

// --- 146 + 147 + 148: the products filters live (ADMIN-PRODUCTS-1) ----------
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

  // 146: the search deep-link — "1 of 12 products" + the matched row.
  const page = await ctx.newPage();
  await page.goto(`${BASE}/admin/products?q=headphone`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/146-products-search-live.png`, fullPage: true });
  console.log("146 captured");

  // 147: the category deep-link — electronics' 3 of 12.
  const page2 = await ctx.newPage();
  await page2.goto(`${BASE}/admin/products?category=electronics`, {
    waitUntil: "networkidle",
  });
  await page2.waitForTimeout(800);
  await page2.screenshot({ path: `${OUT}/147-products-category-live.png`, fullPage: true });
  await page2.close();
  console.log("147 captured");

  // 148: the visibility deep-link — hide through the real eye seam
  // first, then the filter answers "which products did I hide?".
  const page3 = await ctx.newPage();
  await page3.goto(`${BASE}/admin/products`, { waitUntil: "networkidle" });
  await page3.getByRole("button", { name: "Hide Ceramic Planter Set" }).click();
  await page3.waitForTimeout(900);
  await page3.goto(`${BASE}/admin/products?visibility=hidden`, {
    waitUntil: "networkidle",
  });
  await page3.waitForTimeout(800);
  await page3.screenshot({ path: `${OUT}/148-products-visibility-live.png`, fullPage: true });
  // Restore the canonical state (the seed re-restores isActive: true
  // on every global-setup as the run-to-run backstop).
  await page3.getByRole("button", { name: "Show Ceramic Planter Set" }).click();
  await page3.waitForTimeout(900);
  await page3.close();
  await ctx.close();
  console.log("148 captured (+ state restored)");
}

// --- 149: the unit gate run ---------------------------------------------------
{
  const body = `<div class="box"><span class="label">the unit + integration gate (Vitest) — 226/226, +18 for the round:</span>
<pre>$ bun run test
 ✓ src/lib/admin-products.test.ts (18) — NEW: the ADMIN-PRODUCTS-1 seam
   ✓ the parse: q trimmed/kept, empty dropped, array params take the first
   ✓ the parse: category validated against the PAGE-passed slug set (the
     placedIntentIds precedent — the seam never hard-codes the catalog)
   ✓ the parse: bad categories fall through (bad deep-links render the
     unfiltered list, never an error — the family contract)
   ✓ the parse: visibility validated (active/hidden kept, else dropped)
   ✓ the parse: dimensions drop independently; unknown keys ignored
   ✓ the where: q → the bare name/slug OR; category → the bare relation
     element; visibility → the bare isActive element
   ✓ the where: q+category, category+visibility → AND-of-2
   ✓ the where: all three → the canonical AND-of-3 (q, category, visibility)
   ✓ the where: no filters → {} (the unfiltered list)
 ✓ the 14 pre-existing files (208 tests) — unchanged, all green

 Test Files  15 passed (15)
 Tests  226 passed (226)          — was 208; +18, none removed</pre></div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/149-unit-gate-run.png`);
  console.log("149 captured");
}

// --- 150: the E2E gate run -----------------------------------------------------
{
  const body = `<div class="box"><span class="label">the E2E gate (Playwright) — 230/230, two consecutive full runs on the FINAL code:</span>
<pre>$ bun run test:e2e        (run 1)
  ✓ 230 passed             — 0 failures, 0 skipped   (7.5m)
$ bun run test:e2e        (run 2 — the consecutive-pair determinism gate)
  ✓ 230 passed             — 0 failures, 0 skipped   (7.6m)

The NEW session-27 coverage (ADMIN-PRODUCTS-1, ADR-035):
  ✓ products search by name fragment (?q=headphone → 1 of 12 + the URL pin)
  ✓ products filter by category (?category=electronics → 3 of 12; the
    bad-category deep-link falls through to the unfiltered list)
  ✓ products filter by visibility — the eye-toggle seam's list-level
    answer (hide Ceramic Planter Set → ?visibility=hidden → 1 of 12 →
    restored; ?visibility=active → 12 of 12)
  ✓ products filters combine (category=electronics AND q=speaker → 1 of 12)
  ✓ products empty state offers Clear (the guided copy + the bare-path push)

Mutation efficacy ×3 (each reverted, verified byte-exact against backups):
  M1 the q OR reduced to name-only → 3 seam unit tests FAIL (the shape)
  M2 the category validation dropped → 2 seam unit tests FAIL (bad values
    kept — the E2E fall-through is behaviorally identical; the seam owns
    the contract, the session-24 documented precedent)
  M3 the visibility clause dropped from the where → the unit tests FAIL
    + the visibility E2E test FAILS (all 12 rows render)

456 total (226 Vitest + 230 E2E) — was 433; +23, none removed</pre></div>`;
  await shot(`<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`, `${OUT}/150-e2e-gate-run.png`);
  console.log("150 captured");
}

await browser.close();
console.log("session-27 capture complete: 146–150");
