// Debug why the L27 mutation does not bite at mobile: measure FCP, img load
// timing, container height over time, and layout-shift entries with detail.
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";

const INIT = () => {
  window.__dbg = { fcp: 0, shifts: [], heights: [], imgLoad: 0 };
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (e.name === "first-contentful-paint") window.__dbg.fcp = Math.round(e.startTime);
  }).observe({ type: "paint", buffered: true });
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) {
      window.__dbg.shifts.push({
        t: Math.round(e.startTime),
        value: +e.value.toFixed(4),
        sources: (e.sources || []).map((s) => {
          let node = "text";
          if (s.node) {
            node = s.node.tagName || "text";
            if (s.node.className && typeof s.node.className === "string") {
              node += "." + s.node.className.split(" ").slice(0, 3).join(".");
            }
          }
          return {
            node,
            prev: s.previousRect ? [Math.round(s.previousRect.x), Math.round(s.previousRect.y), Math.round(s.previousRect.width), Math.round(s.previousRect.height)] : null,
            cur: s.currentRect ? [Math.round(s.currentRect.x), Math.round(s.currentRect.y), Math.round(s.currentRect.width), Math.round(s.currentRect.height)] : null,
          };
        }),
      });
    }
  }).observe({ type: "layout-shift", buffered: true });
  // track the product image container's height every 50ms from the start
  let n = 0;
  const probe = setInterval(() => {
    n++;
    const c = document.querySelector(".relative.rounded-3xl");
    if (c) window.__dbg.heights.push({ t: Math.round(performance.now()), h: Math.round(c.getBoundingClientRect().height) });
    if (n > 80) clearInterval(probe);
  }, 50);
  window.addEventListener("load", () => {
    const img = document.querySelector(".relative.rounded-3xl img");
    if (img) window.__dbg.imgLoad = Math.round(performance.now());
  });
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
await page.addInitScript(INIT);
await page.goto(CLONE + "/product/wireless-headphones", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);
const dbg = await page.evaluate(() => window.__dbg);
console.log("FCP:", dbg.fcp, "ms | imgLoad(at window load):", dbg.imgLoad, "ms");
console.log("shifts:", JSON.stringify(dbg.shifts, null, 1));
const heights = dbg.heights.filter((h, i, a) => i === 0 || h.h !== a[i - 1].h);
console.log("container height transitions:", JSON.stringify(heights));
await browser.close();
