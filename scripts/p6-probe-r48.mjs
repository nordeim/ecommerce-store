import { chromium } from "playwright-core";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
await page.goto("http://localhost:3000/product/wireless-headphones", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Add to Cart" }).first().click();
await page.waitForTimeout(1500);
await page.locator("header button").filter({ has: page.locator("svg.lucide-shopping-bag") }).click();
await page.waitForTimeout(1200);
await page.getByRole("dialog").getByRole("link", { name: "Checkout" }).click();
await page.waitForTimeout(2000);
const main = page.getByRole("main");
for (const [l, v] of [["First Name","Ada"],["Last Name","Lovelace"],["Email","ada@example.com"],["Address","123 Main St"],["City","New York"],["State","NY"],["ZIP","10001"]]) await main.getByLabel(l).fill(v);
await page.getByRole("button", { name: "Continue to Payment" }).click();
await page.waitForTimeout(800);
await page.getByText("PayPal", { exact: true }).click();
await page.waitForTimeout(500); // let the 150ms transition settle
const out = await page.evaluate(() => {
  const lbl = [...document.querySelectorAll("label")].find((l) => /paypal/i.test(l.textContent ?? ""));
  const s = getComputedStyle(lbl);
  const c = document.createElement("canvas").getContext("2d");
  c.fillStyle = s.borderColor;
  return { rawBorder: s.borderColor, canvasNorm: c.fillStyle, bg: s.backgroundColor };
});
console.log(JSON.stringify(out, null, 1));
// also the unselected (card) label at rest
const out2 = await page.evaluate(() => {
  const lbl = [...document.querySelectorAll("label")].find((l) => /credit/i.test(l.textContent ?? ""));
  const s = getComputedStyle(lbl);
  const c = document.createElement("canvas").getContext("2d");
  c.fillStyle = s.borderColor;
  return { rawBorder: s.borderColor, canvasNorm: c.fillStyle, bg: s.backgroundColor };
});
console.log(JSON.stringify(out2, null, 1));
await browser.close();
