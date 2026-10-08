// Round-17 debug: why does the reference's hero image not register as an
// LCP candidate under a fresh Playwright context? (transient — kept as the
// audit artifact for the LCP-element method note)
import { chromium } from "playwright-core";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.__lcp = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries())
      window.__lcp.push({
        t: Math.round(e.startTime),
        size: e.size,
        url: (e.url || "").split("/").pop(),
        tag: e.element ? e.element.tagName : null,
      });
  }).observe({ type: "largest-contentful-paint", buffered: true });
});
await page.goto("https://fuzzy-lumina-style-hub.base44.app/", { waitUntil: "networkidle" });
await page.waitForTimeout(15000);
const lcp = await page.evaluate(() => window.__lcp);
console.log("LCP entries after 15s:", JSON.stringify(lcp, null, 1));
const hero = await page.evaluate(() => {
  const img = [...document.querySelectorAll("img")].filter((i) => i.getBoundingClientRect().width > 400)[0];
  if (!img) return "no img";
  const cs = getComputedStyle(img);
  return JSON.stringify({
    tag: img.tagName,
    w: Math.round(img.getBoundingClientRect().width),
    complete: img.complete,
    naturalW: img.naturalWidth,
    opacity: cs.opacity,
    loading: img.getAttribute("loading"),
    src: (img.currentSrc || img.src || "").slice(-44),
  });
});
console.log("hero img:", hero);
await browser.close();
