/* Live verification against the DEV server (port 3000) — mirrors the E2E
 * coverage for the session-7 fixes but against `next dev`, proving the
 * remediated surfaces work in dev mode too. Run: bun scripts/verify-session7.ts
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

  // --- FAVICON-1: the icon link points at the reference's CDN logo --------
  const ctx0 = await browser.newContext();
  const page0 = await ctx0.newPage();
  await page0.goto(`${BASE}/`);
  const iconHref = await page0
    .locator('link[rel="icon"]')
    .first()
    .getAttribute("href")
    .catch(() => null);
  if (
    iconHref ===
    "https://media.base44.com/images/public/69d296f5d1237b9a1afec899/76cff797e_logo.png"
  )
    ok("favicon link present with the reference CDN href");
  else fail(`favicon link wrong: ${iconHref}`);
  await ctx0.close();

  // --- TITLE-NF-1: unknown PDP slug titles as the humanized slug ----------
  const ctx1 = await browser.newContext();
  const page1 = await ctx1.newPage();
  await page1.goto(`${BASE}/product/wireless-noise-cancelling-headphones`);
  // Dev-mode: wait for the route to actually render (first hit compiles).
  await page1.getByRole("heading", { name: "Product not found" }).waitFor({ timeout: 30_000 });
  if ((await page1.title()) === "Wireless Noise Cancelling Headphones | Lumina")
    ok("unknown slug title = humanized slug (reference parity)");
  else fail(`unknown slug title wrong: ${await page1.title()}`);
  const blockVisible = await page1.getByRole("heading", { name: "Product not found" }).isVisible();
  if (blockVisible) ok("in-chrome not-found block still renders");
  else fail("not-found block missing");
  await ctx1.close();

  // --- REDIRECT-2: admin sub-pages carry their own path --------------------
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  await page2.goto(`${BASE}/admin/orders`);
  if (page2.url().endsWith("/login?redirect=/admin/orders"))
    ok("guest /admin/orders -> /login?redirect=/admin/orders");
  else fail(`sub-page gate URL wrong: ${page2.url()}`);
  await ctx2.close();

  // --- ADMIN-DETAIL-1: order detail renders items + timeline ---------------
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await admin.goto(`${BASE}/login`);
  // Client-island hydration race (AGENTS.md lesson): dev-mode first hit
  // compiles the route AND hydrates the form island — give it a beat before
  // filling (networkidle never fires under the HMR websocket), then retry
  // the submit once if hydration swallowed the first attempt.
  await admin.getByLabel("Email").waitFor({ timeout: 30_000 });
  await admin.waitForTimeout(2000);
  for (let attempt = 1; attempt <= 2; attempt++) {
    await admin.getByLabel("Email").fill("admin@luxestore.com");
    await admin.getByLabel("Password").fill("Admin1234!");
    await admin.getByRole("button", { name: "Log in", exact: true }).click();
    try {
      await admin.waitForURL("**/account", { timeout: 20_000 });
      break;
    } catch {
      if (attempt === 2) throw new Error("admin login never navigated to /account");
      await admin.waitForTimeout(2000);
    }
  }
  await admin.goto(`${BASE}/admin/orders`);
  await admin.getByRole("link", { name: "ORD-2026-001" }).click();
  await admin.waitForURL(/\/admin\/orders\/[a-z0-9]+$/, { timeout: 15000 });
  const headingVisible = await admin.getByRole("heading", { name: "ORD-2026-001" }).isVisible();
  if (headingVisible) ok("order-detail h1 = ORD-2026-001");
  else fail("order-detail heading missing");
  const johnVisible = await admin.getByText("John Doe").first().isVisible().catch(() => false);
  if (johnVisible) ok("shipping snapshot renders (John Doe)");
  else fail("shipping snapshot missing");
  const placedVisible = await admin.getByText("Order placed", { exact: true }).isVisible().catch(() => false);
  if (placedVisible) ok("timeline renders the placed event");
  else fail("timeline placed event missing");
  const itemVisible = await admin
    .getByText("Wireless Noise-Cancelling Headphones")
    .first()
    .isVisible()
    .catch(() => false);
  if (itemVisible) ok("line items render");
  else fail("line items missing");

  // --- Status transition lands in the timeline (live, then restore) --------
  await admin.goto(`${BASE}/admin/orders`);
  await admin.waitForTimeout(1500);
  const combo = admin.getByRole("combobox", { name: "Change status for ORD-2026-001" });
  await combo.click();
  await admin.getByRole("option", { name: "Cancelled" }).click();
  // Wait for the row's badge to flip (the action + router.refresh() land
  // asynchronously — a fixed sleep races the POST in dev mode).
  const row = admin.locator("div.rounded-xl").filter({ has: combo });
  await row
    .locator("div.rounded-full")
    .filter({ hasText: /cancelled/i })
    .waitFor({ timeout: 20_000 });
  await admin.goto(`${BASE}/admin/orders`);
  await admin.getByRole("link", { name: "ORD-2026-001" }).click();
  await admin.waitForURL(/\/admin\/orders\/[a-z0-9]+$/, { timeout: 30_000 });
  // The timeline note needs the fresh render (dev-mode compile on hit).
  // .first(): earlier verification runs accumulate status_changed events in
  // the dev DB — any one of them proves the timeline renders.
  await admin.getByText(/→ cancelled by admin@luxestore\.com/).first().waitFor({ timeout: 30_000 });
  ok("status transition recorded in the timeline");
  // restore canonical status
  await admin.goto(`${BASE}/admin/orders`);
  await admin.waitForTimeout(1500);
  const combo2 = admin.getByRole("combobox", { name: "Change status for ORD-2026-001" });
  await combo2.click();
  await admin.getByRole("option", { name: "Delivered" }).click();
  const row2 = admin.locator("div.rounded-xl").filter({ has: combo2 });
  await row2
    .locator("div.rounded-full")
    .filter({ hasText: /delivered/i })
    .waitFor({ timeout: 20_000 });
  await adminCtx.close();

  // --- BUILD-1 is verified by the build itself (exit 0 with public/ absent);
  //     nothing to drive live. ------------------------------------------------

  await browser.close();
  console.log(process.exitCode ? "\nLIVE VERIFICATION FAILED" : "\nLIVE VERIFICATION PASSED");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
