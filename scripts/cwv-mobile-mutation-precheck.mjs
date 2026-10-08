// Round-18 mobile CLS mutation pre-check: does the L27 mutation (PDP
// aspect-square + h-full removed) ACTUALLY bite at the mobile viewport?
// Round-17 measured it NOT biting at desktop (the 2-col grid absorbs the
// image growth). This script measures CLS at iPhone 14 (390x844 DPR3) on
// the MUTATED build — the efficacy pre-check for the mobile CWV gate design.
// Run: node scripts/cwv-mobile-mutation-precheck.mjs
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";

const INIT = () => {
  window.__cwv = { lcpEntries: [], cls: 0, shiftCount: 0, fcp: 0 };
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__cwv.lcpEntries.push({
          startTime: Math.round(e.startTime),
          size: e.size,
          tag: e.element ? e.element.tagName : "?",
          w: e.element ? Math.round(e.element.getBoundingClientRect().width) : 0,
          h: e.element ? Math.round(e.element.getBoundingClientRect().height) : 0,
        });
      }
      window.__cwv.lcpEntries.sort((a, b) => b.size - a.size);
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

const login = async (ctx, base) => {
  const page = await ctx.newPage();
  await page.goto(base + "/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("john@example.com");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  await page.close();
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
await login(ctx, CLONE);
for (const vp of [
  { name: "mobile-390", width: 390, height: 844, dsf: 3, mobile: true },
  { name: "desktop-1280", width: 1280, height: 720, dsf: 1, mobile: false },
]) {
  const ctx2 = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dsf,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
  });
  await login(ctx2, CLONE);
  const page = await ctx2.newPage();
  await page.addInitScript(INIT);
  await page.goto(CLONE + "/product/wireless-headphones", { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(2500);
  const cwv = await page.evaluate(() => window.__cwv);
  const top = cwv.lcpEntries[0] || null;
  console.log(
    `${vp.name.padEnd(13)} CLS ${cwv.cls.toFixed(4)} (${cwv.shiftCount} shifts) | ` +
      `LCP ${top ? top.startTime + "ms " + top.tag + " " + top.w + "x" + top.h : "-"} | entries ${cwv.lcpEntries.length}`,
  );
  await ctx2.close();
}
await browser.close();
