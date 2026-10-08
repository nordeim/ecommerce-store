// Round-18 E2E-condition MOBILE CWV calibration (the session-15/16/17
// discipline — pins come from E2E conditions, not the dev DB): boots against
// the standalone server on :3100 (e2e DB, canonical reset state), signs the
// demo user in once (storageState semantics), measures LCP + CLS + LCP
// element identity on the three gate routes at iPhone 14 (390x664 DPR 3,
// isMobile, hasTouch) under the exact E2E conditions. The mobile budgets
// written into tests/e2e/performance.spec.ts's CWV mobile gate describe are
// these numbers with documented headroom.
// Run: node scripts/cwv-calibrate-session18.mjs   (server on :3100 first)
import { chromium } from "playwright-core";

const BASE = "http://localhost:3100";
const ROUTES = [
  { name: "home", path: "/" },
  { name: "shop", path: "/shop" },
  { name: "pdp", path: "/product/wireless-headphones" },
];

const INIT = () => {
  window.__cwv = { entries: [], cls: 0, shiftCount: 0, fcp: 0 };
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        const el = e.element;
        window.__cwv.entries.push({
          startTime: Math.round(e.startTime),
          size: e.size,
          tag: el ? el.tagName : null,
          w: el ? Math.round(el.getBoundingClientRect().width) : 0,
          h: el ? Math.round(el.getBoundingClientRect().height) : 0,
        });
      }
      window.__cwv.entries.sort((a, b) => b.size - a.size);
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__cwv.cls += e.value;
        window.__cwv.shiftCount++;
      }
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.name === "first-contentful-paint") window.__cwv.fcp = Math.round(e.startTime);
      }
    }).observe({ type: "paint", buffered: true });
  } catch {
    /* older engine */
  }
};

const browser = await chromium.launch();
// iPhone 14 semantics — the same descriptor the mobile gate describe uses
// (test.use strips defaultBrowserType; Playwright's device descriptor).
const ctx = await browser.newContext({
  viewport: { width: 390, height: 664 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
});
// one demo login (the auth.setup semantics — session cookie in context)
{
  const page = await ctx.newPage();
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("john@example.com");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  console.log("login ->", new URL(page.url()).pathname);
  await page.close();
}
console.log("\n=== Round-18 MOBILE CWV calibration (E2E conditions: :3100 + e2e DB + demo session, iPhone 14) ===\n");
for (const route of ROUTES) {
  // two passes per route for stability evidence
  const passes = [];
  for (let i = 0; i < 2; i++) {
    const page = await ctx.newPage();
    await page.addInitScript(INIT);
    await page.goto(BASE + route.path, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await page.waitForTimeout(1200);
    const cwv = await page.evaluate(() => window.__cwv);
    const top = cwv.entries[0] || null;
    passes.push({ fcp: cwv.fcp, lcp: top ? top.startTime : null, lcpTag: top ? top.tag : null, lcpSize: top ? top.size : 0, lcpRect: top ? [top.w, top.h] : null, cls: cwv.cls, shifts: cwv.shiftCount, n: cwv.entries.length });
    await page.close();
  }
  console.log(route.name + ":");
  for (const p of passes) {
    console.log(
      `  FCP ${p.fcp}ms | LCP ${p.lcp}ms ${p.lcpTag} size=${p.lcpSize} rect=${JSON.stringify(p.lcpRect)} | CLS ${p.cls.toFixed(4)} (${p.shifts} shifts) | entries ${p.n}`,
    );
  }
}
await browser.close();
