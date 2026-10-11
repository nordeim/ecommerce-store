import { chromium } from "playwright-core";
const t0 = Date.now();
const browser = await chromium.launch();
const page = await browser.newPage();
for (const r of ["/login", "/", "/shop", "/product/wireless-headphones"]) {
  const s = Date.now();
  try {
    await page.goto("http://localhost:3000" + r, { waitUntil: "load", timeout: 25000 });
    await page.waitForTimeout(500);
    console.log(r, Math.round((Date.now() - s) / 1000) + "s");
  } catch (e) {
    console.log(r, "TIMEOUT/ERR:", String(e).slice(0, 80));
  }
}
console.log("total", Math.round((Date.now() - t0) / 1000) + "s");
await browser.close();
