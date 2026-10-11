// Round-44 probe v6 (FINAL calibration): fill the reference's checkout by
// PLACEHOLDER (its inputs are unlabeled — placeholder-only), walk to step 3,
// and measure the edit-back navigation's state preservation. Answers:
// (a) does the reference preserve step-1 values across step2->Back->step1?
// (b) does step 3 carry Edit affordances, and do they preserve values?
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
await page.getByRole("button", { name: "Add to Cart" }).first().click();
await page.waitForTimeout(4000);
await page.locator("header button").filter({ has: page.locator("svg.lucide-shopping-bag") }).click();
await page.waitForTimeout(2500);
const co = page.locator("[role=dialog] a, [data-state=open] a").filter({ hasText: /checkout/i }).first();
await co.click();
await page.waitForTimeout(3000);
await page.waitForLoadState("networkidle");

// fill step 1 BY PLACEHOLDER
const ph = (p) => page.getByPlaceholder(p).first();
await ph("John").fill("Ada");
await ph("Doe").fill("Lovelace");
await ph("john@example.com").fill("ada@example.com");
await ph("123 Main St").fill("742 Evergreen Terrace");
await ph("New York").fill("Springfield");
await ph("NY").fill("IL");
await ph("10001").fill("62704");
await page.waitForTimeout(500);
console.log("filled step1; Continue disabled:", await page.getByRole("button", { name: /continue/i }).first().isDisabled());

await page.getByRole("button", { name: /continue/i }).first().click();
await page.waitForTimeout(2500);
await page.waitForLoadState("networkidle");
console.log("URL after continue:", new URL(page.url()).pathname);
await page.screenshot({ path: OUT + "/v6-step2.png" });

// step 2: fill card by placeholder
await ph("4242 4242 4242 4242").pressSequentially("4242424242424242", { delay: 20 });
await page.waitForTimeout(300);
console.log("P2 card value after typing raw digits:", JSON.stringify(await ph("4242 4242 4242 4242").inputValue()));
await ph("MM/YY").pressSequentially("1228", { delay: 20 });
await page.waitForTimeout(300);
console.log("P2 expiry value after typing 1228:", JSON.stringify(await ph("MM/YY").inputValue()));
await ph("123").pressSequentially("123", { delay: 20 });
await page.waitForTimeout(300);

// step2 Back -> step1: values preserved?
await page.getByRole("button", { name: "Back" }).first().click();
await page.waitForTimeout(1800);
const s1 = {
  first: await ph("John").inputValue(),
  email: await ph("john@example.com").inputValue(),
  city: await ph("New York").inputValue(),
};
console.log("P3 step-1 values after step2->Back:", JSON.stringify(s1));

// forward again -> step 2: card preserved?
await page.getByRole("button", { name: /continue/i }).first().click();
await page.waitForTimeout(2200);
const cardVal = await ph("4242 4242 4242 4242").inputValue().catch(() => "N/A");
console.log("P3 step-2 card value after forward-again:", JSON.stringify(cardVal));

// to step 3: Review Order
await page.getByRole("button", { name: /review/i }).first().click();
await page.waitForTimeout(2500);
await page.waitForLoadState("networkidle");
await page.screenshot({ path: OUT + "/v6-step3.png" });
const step3 = await page.evaluate(() => {
  const out = { h2: [], buttons: [], text: null, editish: [] };
  document.querySelectorAll("h2").forEach((h) => out.h2.push(h.textContent?.trim()));
  document.querySelectorAll("main button, form button").forEach((b) => out.buttons.push(b.textContent?.trim()));
  document.querySelectorAll("main a, form a").forEach((a) => out.editish.push(a.textContent?.trim()));
  out.text = document.querySelector("main")?.textContent?.replace(/\s+/g, " ").slice(0, 900) ?? "";
  return out;
});
console.log("STEP3:", JSON.stringify(step3, null, 1));

// step 3 -> Edit (Shipping): preserved?
const editShip = page.getByRole("button", { name: "Edit" }).first();
if (await editShip.count()) {
  await editShip.click();
  await page.waitForTimeout(1800);
  const s1b = {
    first: await ph("John").inputValue().catch(() => "N/A"),
    city: await ph("New York").inputValue().catch(() => "N/A"),
  };
  console.log("P3 step-1 values after step3->Edit(Shipping):", JSON.stringify(s1b));
  await page.screenshot({ path: OUT + "/v6-step1-after-edit.png" });
} else {
  console.log("P3 no Edit button on step 3");
}
await browser.close();
