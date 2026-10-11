// Round-44 probe v3: debug the reference's drawer path — what does the
// header cart button do after an add? Screenshots + patient waits.
import { chromium } from "playwright-core";
const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/audit-r44";
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const lp = await ctx.newPage();
await lp.goto(REF + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await lp.getByLabel("Password").fill("$Abcd1234");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try { await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }); } catch {}
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
await lp.close();

const page = await ctx.newPage();
await page.goto(REF + "/product/wireless-headphones", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.getByRole("button", { name: /add to cart/i }).first().click();
await page.waitForTimeout(2000);
await page.screenshot({ path: OUT + "/dbg-after-add.png" });

// enumerate ALL buttons with accessible names + the cart area
const census = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll("button").forEach((b) => {
    const label = b.getAttribute("aria-label") ?? b.textContent?.trim()?.slice(0, 30) ?? "(icon)";
    out.push({ label, hasSvg: !!b.querySelector("svg") });
  });
  return out;
});
console.log("BUTTONS:", JSON.stringify(census, null, 1));

// try the aria-labeled cart button
const cartByAria = page.getByRole("button", { name: /cart/i }).first();
console.log("cart by role/aria:", await cartByAria.count());
if (await cartByAria.count()) {
  await cartByAria.click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: OUT + "/dbg-after-cartclick.png" });
  const drawerState = await page.evaluate(() => {
    const d = document.querySelector("[role=dialog], [data-radix-panel], [data-state=open]");
    return { found: !!d, text: d?.textContent?.replace(/\s+/g, " ").slice(0, 300) ?? null };
  });
  console.log("DRAWER:", JSON.stringify(drawerState));
}
await browser.close();
