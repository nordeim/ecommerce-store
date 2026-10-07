/* Live verification against the DEV server (port 3000) — mirrors the E2E
 * coverage for the session-6 fixes but against `next dev`, proving the
 * remediated surfaces work in dev mode too. Run: bun scripts/verify-session6.ts
 */
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:3000";
const ok = (msg: string) => console.log(`  ✓ ${msg}`);
const fail = (msg: string) => {
  console.error(`  ✗ ${msg}`);
  process.exitCode = 1;
};

async function main() {
  const browser = await chromium.launch();

  // --- REDIRECT-1: gate carries intent, login returns, payload ignored ----
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/account`);
  if (page.url().includes("/login?redirect=/account")) ok("guest /account -> /login?redirect=/account");
  else fail(`gate URL wrong: ${page.url()}`);

  await page.getByLabel("Email").fill("john@example.com");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForURL("**/account", { timeout: 15000 });
  if (page.url().endsWith("/account")) ok("login honored redirect -> /account");
  else fail(`login landing wrong: ${page.url()}`);
  await ctx.close();

  // --- Open-redirect payload ignored ---------------------------------------
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  await page2.goto(`${BASE}/login?redirect=//evil.com`);
  await page2.getByLabel("Email").fill("john@example.com");
  await page2.getByLabel("Password").fill("Demo1234!");
  await page2.getByRole("button", { name: "Log in", exact: true }).click();
  await page2.waitForURL("**/account", { timeout: 15000 });
  if (page2.url().endsWith("/account")) ok("open-redirect payload ignored -> /account");
  else fail(`payload landing wrong: ${page2.url()}`);
  await ctx2.close();

  // --- STOCK-1: decrement on order (read stock before/after via admin) -----
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await admin.goto(`${BASE}/login`);
  await admin.getByLabel("Email").fill("admin@luxestore.com");
  await admin.getByLabel("Password").fill("Admin1234!");
  await admin.getByRole("button", { name: "Log in", exact: true }).click();
  await admin.waitForURL("**/account");
  await admin.goto(`${BASE}/admin/products`);
  const stockInput = admin.getByLabel("Stock for Linen Throw Blanket");
  const before = Number(await stockInput.inputValue());

  const userCtx = await browser.newContext();
  const user = await userCtx.newPage();
  await user.goto(`${BASE}/login`);
  await user.getByLabel("Email").fill("john@example.com");
  await user.getByLabel("Password").fill("Demo1234!");
  await user.getByRole("button", { name: "Log in", exact: true }).click();
  await user.waitForURL("**/account");

  await user.goto(`${BASE}/product/linen-blanket`);
  await user.getByRole("button", { name: "Add to Cart" }).first().click();
  await user.getByRole("button", { name: "Cart, 1 items" }).waitFor({ timeout: 10000 });
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
  await user.getByRole("heading", { name: "Order Confirmed" }).waitFor({ timeout: 20000 });
  const orderText = await user.getByText(/Your order ORD-\d{4}-\d+ has been placed/).textContent();
  ok(`order placed: ${orderText?.trim()}`);

  await admin.goto(`${BASE}/admin/products`);
  await admin.reload();
  const after = Number(await admin.getByLabel("Stock for Linen Throw Blanket").inputValue());
  if (after === before - 1) ok(`stock decremented ${before} -> ${after}`);
  else fail(`stock ${before} -> ${after} (expected ${before - 1})`);

  await adminCtx.close();
  await userCtx.close();
  await browser.close();
  console.log(process.exitCode ? "LIVE VERIFICATION FAILED" : "LIVE VERIFICATION PASSED");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
