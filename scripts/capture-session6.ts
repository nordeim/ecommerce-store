/* Session-6 screenshot capture — drives the DEV server through the
 * remediated surfaces and saves viewport captures. Run:
 *   bun scripts/capture-session6.ts
 */
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:3000";
const OUT = "docs/screenshots";

async function main() {
  const browser = await chromium.launch();

  // --- 38: admin products stock editing (the stock-control seam) ----------
  const adminCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const admin = await adminCtx.newPage();
  await admin.goto(`${BASE}/login`);
  await admin.getByLabel("Email").fill("admin@luxestore.com");
  await admin.getByLabel("Password").fill("Admin1234!");
  await admin.getByRole("button", { name: "Log in", exact: true }).click();
  await admin.waitForURL("**/account");
  await admin.goto(`${BASE}/admin/products`);
  await admin.getByLabel("Stock for Ceramic Planter Set").scrollIntoViewIfNeeded();
  await admin.screenshot({ path: `${OUT}/38-admin-stock-editing.png` });
  console.log("✓ 38-admin-stock-editing.png");

  // Drop the planter stock to 0 through the real form for the sold-out shot.
  const input = admin.getByLabel("Stock for Ceramic Planter Set");
  await input.fill("0");
  await input.locator("xpath=following-sibling::button").click();
  await admin.waitForTimeout(1500);

  // --- 39: the sold-out PDP (Out of Stock button) --------------------------
  const userCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const user = await userCtx.newPage();
  await user.goto(`${BASE}/product/ceramic-planter`);
  await user.getByRole("button", { name: "Out of Stock" }).scrollIntoViewIfNeeded();
  await user.waitForTimeout(400);
  await user.screenshot({ path: `${OUT}/39-pdp-out-of-stock.png` });
  console.log("✓ 39-pdp-out-of-stock.png");

  // --- 40: the overselling rejection at checkout ---------------------------
  // (assemble a 2-unit cart while stock reads 2, then drop stock under it)
  await admin.goto(`${BASE}/admin/products`);
  await admin.getByLabel("Stock for Ceramic Planter Set").fill("2");
  await admin.getByLabel("Stock for Ceramic Planter Set").locator("xpath=following-sibling::button").click();
  await admin.waitForTimeout(1500);

  await user.goto(`${BASE}/login`);
  await user.getByLabel("Email").fill("john@example.com");
  await user.getByLabel("Password").fill("Demo1234!");
  await user.getByRole("button", { name: "Log in", exact: true }).click();
  await user.waitForURL("**/account");

  await user.goto(`${BASE}/product/ceramic-planter`);
  await user.getByRole("button", { name: "Increase quantity" }).click(); // qty 2
  await user.getByRole("button", { name: "Add to Cart" }).first().click();
  await user.getByRole("button", { name: "Cart, 2 items" }).waitFor({ timeout: 10000 });

  // drop stock back to 0 after the cart was assembled
  await admin.goto(`${BASE}/admin/products`);
  await admin.getByLabel("Stock for Ceramic Planter Set").fill("0");
  await admin.getByLabel("Stock for Ceramic Planter Set").locator("xpath=following-sibling::button").click();
  await admin.waitForTimeout(1500);

  await user.goto(`${BASE}/checkout`);
  await user.waitForLoadState("networkidle");
  await user.getByRole("main").getByLabel("Address").fill("1 Test Way");
  await user.getByRole("main").getByLabel("City").fill("NYC");
  await user.getByRole("main").getByLabel("State").fill("NY");
  await user.getByRole("main").getByLabel("ZIP").fill("10001");
  await user.getByRole("button", { name: "Continue to Payment" }).click();
  await user.getByRole("radio", { name: "PayPal" }).check();
  await user.getByRole("button", { name: "Review Order" }).click();
  await user.getByRole("button", { name: /Place Order/ }).click();
  await user.getByText(/only has 0 left in stock/i).waitFor({ timeout: 15000 });
  await user.screenshot({ path: `${OUT}/40-checkout-stock-rejected.png` });
  console.log("✓ 40-checkout-stock-rejected.png");

  // Restore canonical stock (dev-cleanup also does this, but be immediate).
  await admin.goto(`${BASE}/admin/products`);
  await admin.getByLabel("Stock for Ceramic Planter Set").fill("25");
  await admin.getByLabel("Stock for Ceramic Planter Set").locator("xpath=following-sibling::button").click();
  await admin.waitForTimeout(1200);

  await adminCtx.close();
  await userCtx.close();
  await browser.close();
  console.log("SESSION-6 SCREENSHOTS DONE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
