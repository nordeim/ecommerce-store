// Round-38 audit probe v3: enter the reference checkout via the cart DRAWER
// (the reference's actual flow: add -> drawer -> checkout button). This is
// the state the /checkout route can't reach via direct navigation.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/audit-r38";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

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
await page.waitForTimeout(2000);
await page.locator("button", { hasText: /add to cart/i }).first().click();
await page.waitForTimeout(1500);
// the drawer opens ONLY via the header cart button (the interaction-parity
// contract: add -> badge only). Click it.
const headerCartBtn = page.locator("header button").filter({ has: page.locator("svg.lucide-shopping-cart, svg.lucide-shopping-bag") }).first();
if (await headerCartBtn.count()) {
  await headerCartBtn.click();
  await page.waitForTimeout(1200);
  console.log("header cart button clicked");
}
const drawer = page.locator("[data-radix-panel], [role=dialog]").first();
if (await drawer.count()) {
  await page.screenshot({ path: OUT + "/ref-drawer.png" });
  console.log("drawer open");
  const drawerText = await drawer.textContent();
  console.log("DRAWER TEXT:", drawerText?.replace(/\s+/g, " ").slice(0, 600));
  // find the checkout button in the drawer
  const checkoutBtn = page.locator("[role=dialog] button, [data-radix-panel] button, [data-radix-panel] a, [role=dialog] a").filter({ hasText: /^checkout$/i }).first();
  if (!(await checkoutBtn.count())) {
    // fallback: any clickable with the word Checkout
    const any = page.getByText("Checkout", { exact: true }).first();
    if (await any.count()) { await any.click(); console.log("clicked via getByText"); }
  }
  if (await checkoutBtn.count()) {
    await checkoutBtn.click();
    await page.waitForTimeout(2500);
    await page.waitForLoadState("networkidle");
    console.log("CHECKOUT URL:", new URL(page.url()).pathname);
    await page.screenshot({ path: OUT + "/ref-checkout-drawer-path.png", fullPage: true });
    const structure = await page.evaluate(() => {
      const out = { h2: [], labels: [], buttons: [], radios: [], selects: [], text: [] };
      document.querySelectorAll("h2").forEach((h) => out.h2.push(h.textContent?.trim()));
      document.querySelectorAll("label").forEach((l) => out.labels.push(l.textContent?.trim()));
      document.querySelectorAll("button").forEach((b) => out.buttons.push(b.textContent?.trim()));
      document.querySelectorAll("input[type=radio]").forEach((r) => out.radios.push(r.name + ":" + r.value));
      document.querySelectorAll("select").forEach((s) => out.selects.push(s.name));
      out.text = document.querySelector("main")?.textContent?.replace(/\s+/g, " ").slice(0, 1500) ?? "";
      return out;
    });
    console.log("CHECKOUT VIA DRAWER:", JSON.stringify(structure, null, 1));
  } else {
    console.log("NO checkout button in drawer");
  }
} else {
  console.log("NO drawer detected after add");
}
await browser.close();
