import { chromium } from "playwright-core";
const measure = async (base, email, password) => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const kids = await page.evaluate(() => {
    const nav = document.querySelector('[role="navigation"], nav');
    const row = nav?.parentElement;
    if (!row) return { error: "no nav row" };
    return [...row.children].map((c) => {
      const r = c.getBoundingClientRect();
      const cs = getComputedStyle(c);
      return {
        tag: c.tagName,
        cls: String(c.className).slice(0, 90),
        box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
        ml: cs.marginLeft, mr: cs.marginRight, pl: cs.paddingLeft, pr: cs.paddingRight,
        text: c.textContent.trim().slice(0, 40),
      };
    });
  });
  await browser.close();
  return kids;
};
console.log("=== REF row children (1024) ===");
console.log(JSON.stringify(await measure("https://fuzzy-lumina-style-hub.base44.app", "sepnetflix2023@outlook.com", "$Abcd1234"), null, 1));
console.log("=== CLONE row children (1024) ===");
console.log(JSON.stringify(await measure("http://localhost:3000", "john@example.com", "Demo1234!"), null, 1));
