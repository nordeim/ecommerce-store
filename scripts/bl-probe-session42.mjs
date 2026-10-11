// Round-42: identify the element at the bottom-left of the clone's viewport
// (x 20..130, y 715..760) in dev mode — the dark box the pixel diff found.
import { chromium } from "playwright-core";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const found = await page.evaluate(() => {
  const hits = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.left < 140 && r.bottom > 700 && r.top < 768) {
      const cs = getComputedStyle(el);
      hits.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || undefined,
        cls: (el.className && String(el.className).slice(0, 120)) || undefined,
        text: el.textContent?.trim().replace(/\s+/g, " ").slice(0, 60) || undefined,
        box: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
        bg: cs.backgroundColor,
        color: cs.color,
        z: cs.zIndex,
        pos: cs.position,
      });
    }
  }
  return hits.slice(0, 12);
});
console.log(JSON.stringify(found, null, 1));
await browser.close();
