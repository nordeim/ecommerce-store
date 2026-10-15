import { chromium } from "playwright-core";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
await page.waitForLoadState("networkidle");
await page.locator('header button[aria-label="Search"]').click();
await page.waitForTimeout(450);
const input = page.locator("input[aria-label='Search products']");
await input.fill("an");
await page.waitForTimeout(900);
const d = await page.evaluate(() => {
  const cont = document.querySelector("header .bg-popover");
  const row = cont?.querySelector("button");
  const cr = cont?.getBoundingClientRect();
  const rr = row?.getBoundingClientRect();
  return {
    cont: cr ? { x: cr.x, w: cr.width, h: cr.height } : null,
    row: rr ? { x: rr.x, w: rr.width, h: rr.height } : null,
    innerW: window.innerWidth, docClient: document.documentElement.clientWidth,
  };
});
console.log(JSON.stringify(d, null, 1));
await browser.close();
