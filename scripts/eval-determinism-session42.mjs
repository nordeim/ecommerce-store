// Round-42: determinism check — does the eval-CSP console error fire on every
// dev-mode page load, on which routes, and on every reload?
import { chromium } from "playwright-core";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });

for (const route of ["/login", "/", "/shop", "/cart"]) {
  for (let i = 0; i < 3; i++) {
    const page = await ctx.newPage();
    const errs = [];
    page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 60)); });
    await page.goto("http://localhost:3000" + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    console.log(`${route} #${i + 1}: ${errs.length === 0 ? "CLEAN" : errs.length + " ERR: " + errs[0]}`);
    await page.close();
  }
}
await browser.close();
