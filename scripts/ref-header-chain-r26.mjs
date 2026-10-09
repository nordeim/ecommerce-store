import { chromium } from "playwright-core";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await ctx.newPage();
await page.goto("https://fuzzy-lumina-style-hub.base44.app/login", { waitUntil: "networkidle" });
await page.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await page.getByLabel("Password").fill("$Abcd1234");
await page.getByRole("button", { name: "Log in", exact: true }).click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1500);
await page.goto("https://fuzzy-lumina-style-hub.base44.app/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const chain = await page.evaluate(() => {
  const nav = document.querySelector('[role="navigation"], nav');
  const out = [];
  let el = nav;
  for (let i = 0; i < 5 && el && el !== document.body; i++) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    out.push({
      tag: el.tagName,
      cls: String(el.className).slice(0, 100),
      box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      display: cs.display, justify: cs.justifyContent, gap: cs.gap, ml: cs.marginLeft, pl: cs.paddingLeft,
    });
    el = el.parentElement;
  }
  return out;
});
console.log(JSON.stringify(chain, null, 1));
await browser.close();
