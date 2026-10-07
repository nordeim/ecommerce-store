/* Session-7 screenshot capture — drives the dev server (port 3000) with
 * Playwright (direct connection; agent-browser's proxy path can break
 * Server-Action POSTs). Captures the round-7 remediated surfaces.
 * Run: bun scripts/capture-session7.ts
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = "http://127.0.0.1:3000";
const OUT = "docs/screenshots";

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  // --- 42: admin order-detail (items + shipping + timeline) ----------------
  const adminCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const admin = await adminCtx.newPage();
  await admin.goto(`${BASE}/login`);
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
      if (attempt === 2) throw new Error("admin login never navigated");
      await admin.waitForTimeout(2000);
    }
  }
  await admin.goto(`${BASE}/admin/orders`);
  await admin.waitForTimeout(1500);
  await admin.getByRole("link", { name: "ORD-2026-001" }).click();
  await admin.waitForURL(/\/admin\/orders\/[a-z0-9]+$/, { timeout: 30_000 });
  await admin.getByText("Order placed", { exact: true }).waitFor({ timeout: 30_000 });
  await admin.screenshot({ path: `${OUT}/42-admin-order-detail-timeline.png`, fullPage: true });
  console.log("✓ 42-admin-order-detail-timeline.png");

  // --- 43: admin orders list (linked numbers + status comboboxes) ----------
  await admin.goto(`${BASE}/admin/orders`);
  await admin.getByRole("link", { name: "ORD-2026-001" }).waitFor({ timeout: 30_000 });
  await admin.screenshot({ path: `${OUT}/43-admin-orders-linked.png`, fullPage: true });
  console.log("✓ 43-admin-orders-linked.png");

  // --- 44: PDP not-found with the humanized-slug title ---------------------
  await admin.goto(`${BASE}/product/wireless-noise-cancelling-headphones`);
  await admin.getByRole("heading", { name: "Product not found" }).waitFor({ timeout: 30_000 });
  await admin.screenshot({ path: `${OUT}/44-pdp-not-found-title.png`, fullPage: true });
  console.log("✓ 44-pdp-not-found-title.png (title: " + (await admin.title()) + ")");

  // --- 45: admin dashboard (stat cards + linked recent orders) -------------
  await admin.goto(`${BASE}/admin`);
  await admin.getByRole("heading", { name: "Admin Dashboard" }).waitFor({ timeout: 30_000 });
  await admin.getByRole("link", { name: "ORD-2026-001" }).waitFor({ timeout: 30_000 });
  await admin.screenshot({ path: `${OUT}/45-admin-dashboard-linked-orders.png`, fullPage: true });
  console.log("✓ 45-admin-dashboard-linked-orders.png");
  await adminCtx.close();

  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
