// Round-38 audit probe: walk the REFERENCE checkout with a cart (the sweep
// captures the empty state only — the with-cart state is the gap). Also
// re-check the reference's order-detail surfaces for any feature the clone
// lacks. Read-only against the reference; captures for eyeball comparison.
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/audit-r38";
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

// login
const lp = await ctx.newPage();
await lp.goto(REF + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await lp.getByLabel("Password").fill("$Abcd1234");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try {
  await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
} catch { /* report what we find */ }
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
await lp.close();

// 1. shop -> first product -> add to cart
const page = await ctx.newPage();
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const card = page.locator("a[href*='/product/']").first();
const href = await card.getAttribute("href");
console.log("first product href:", href);
await page.goto(REF + href, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: OUT + "/ref-pdp.png" });
// find the add-to-cart button on the PDP
const addBtn = page.getByRole("button", { name: /add to cart/i }).first();
if (await addBtn.count()) {
  await addBtn.click();
  await page.waitForTimeout(1200);
  console.log("add-to-cart clicked on PDP");
}
// 2. go to checkout
await page.goto(REF + "/checkout", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT + "/ref-checkout-step1.png", fullPage: true });
console.log("checkout step1 URL:", new URL(page.url()).pathname);
// dump the step-1 structure: headings + form fields + any shipping-method UI
const structure = await page.evaluate(() => {
  const out = { h2: [], labels: [], buttons: [], radios: [], selects: [], text: [] };
  document.querySelectorAll("h2").forEach((h) => out.h2.push(h.textContent?.trim()));
  document.querySelectorAll("label").forEach((l) => out.labels.push(l.textContent?.trim()));
  document.querySelectorAll("button").forEach((b) => out.buttons.push(b.textContent?.trim()));
  document.querySelectorAll("input[type=radio]").forEach((r) => out.radios.push(r.name + ":" + r.value));
  document.querySelectorAll("select").forEach((s) => out.selects.push(s.name));
  out.text = document.querySelector("main")?.textContent?.replace(/\s+/g, " ").slice(0, 1200) ?? "";
  return out;
});
console.log("STEP1 STRUCTURE:", JSON.stringify(structure, null, 1));
await browser.close();
console.log("probe done");
