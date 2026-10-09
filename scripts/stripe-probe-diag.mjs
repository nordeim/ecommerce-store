// Diagnostic: which page/initiator fires the js.stripe.com request when
// unconfigured? Walk the same flow as capture 123 with request initiators.
import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

const lp = await ctx.newPage();
await lp.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("john@example.com");
await lp.getByLabel("Password").fill("Demo1234!");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
await lp.waitForURL("**/account");
await lp.close();

const page = await ctx.newPage();
const hits = [];
page.on("request", (req) => {
  const u = req.url();
  if (u.includes("stripe.com")) {
    hits.push({ url: u, initiator: req.headers()?.["sec-fetch-site"] ?? "?", resourceType: req.resourceType() });
  }
});
await page.goto(`${BASE}/product/wireless-headphones`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
console.log("PDP:", JSON.stringify(hits));
await page.getByRole("button", { name: "Add to Cart" }).first().click();
await page.getByRole("button", { name: "Cart, 1 items" }).click();
await page.getByRole("dialog").getByRole("link", { name: "Checkout" }).click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1000);
console.log("CHECKOUT (step 1):", JSON.stringify(hits));
await page.getByRole("main").getByLabel("First Name").fill("John");
await page.getByRole("main").getByLabel("Last Name").fill("Doe");
await page.getByRole("main").getByLabel("Email").fill("john@example.com");
await page.getByRole("main").getByLabel("Address").fill("123 Main St");
await page.getByRole("main").getByLabel("City").fill("New York");
await page.getByRole("main").getByLabel("State").fill("NY");
await page.getByRole("main").getByLabel("ZIP").fill("10001");
await page.getByRole("button", { name: "Continue to Payment" }).click();
await page.waitForTimeout(1500);
console.log("STEP 2:", JSON.stringify(hits));
const sources = await page.evaluate(() => [...document.querySelectorAll("script[src*='stripe']")].map((s) => s.outerHTML));
console.log("stripe script tags in DOM:", JSON.stringify(sources));
await browser.close();
