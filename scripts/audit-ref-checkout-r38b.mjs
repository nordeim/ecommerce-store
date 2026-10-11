// Round-38 audit probe v2: add an item to the REFERENCE cart and walk the
// checkout steps. v1's add click missed (the button may need hydration or a
// different selector). Also probe the ref's cart drawer state.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/audit-r38";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

// login
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
// try any button containing "cart" text or a cart svg, fallback: all buttons dump
const buttons = await page.locator("button").allTextContents();
console.log("PDP buttons:", JSON.stringify(buttons));
const add = page.locator("button", { hasText: /add to cart/i }).first();
if (await add.count()) {
  await add.click();
  console.log("clicked add-to-cart");
  await page.waitForTimeout(1500);
  // check the cart badge / state
  const badge = await page.locator("header").textContent();
  console.log("header after add:", badge?.replace(/\s+/g, " ").slice(0, 200));
} else {
  console.log("NO add-to-cart button found");
}
// cart page state
await page.goto(REF + "/cart", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const cartText = await page.locator("main").textContent();
console.log("CART TEXT:", cartText?.replace(/\s+/g, " ").slice(0, 500));
await page.screenshot({ path: OUT + "/ref-cart.png" });

// checkout with cart state (if any)
await page.goto(REF + "/checkout", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.screenshot({ path: OUT + "/ref-checkout-withcart.png", fullPage: true });
const structure = await page.evaluate(() => {
  const out = { h1: [], h2: [], labels: [], buttons: [], radios: [], shippingText: [] };
  document.querySelectorAll("h1,h2").forEach((h) => (h.tagName === "H1" ? out.h1 : out.h2).push(h.textContent?.trim()));
  document.querySelectorAll("label").forEach((l) => out.labels.push(l.textContent?.trim()));
  document.querySelectorAll("button").forEach((b) => out.buttons.push(b.textContent?.trim()));
  document.querySelectorAll("input[type=radio]").forEach((r) => out.radios.push(r.name + ":" + r.value));
  const main = document.querySelector("main")?.textContent ?? "";
  out.shippingText = main.replace(/\s+/g, " ").slice(0, 1500);
  return out;
});
console.log("CHECKOUT STRUCTURE:", JSON.stringify(structure, null, 1));
await browser.close();
console.log("probe v2 done");
