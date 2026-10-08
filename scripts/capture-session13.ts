// Session-13 screenshot capture (production standalone server, remediated
// code). Mirrors scripts/capture-session12.ts. Run: bun scripts/capture-session13.ts
// 76 the admin orders filter bar + count line (the ADMIN-SEARCH-1 surface)
// 77 the status filter applied (deep-linked ?status=delivered, 2 orders)
// 78 the search filter applied (?q=001, 1 order)
// 79 the combined-filter empty state ("No orders match your filters")
// 80 the 13th mobile-nav standing verification (open Sheet, iPhone 14)
// 81 the Core Web Vitals differential proof (this is captured by the
//    audit, not here — 81 is the CWV summary console capture instead:
//    the admin orders page at desktop for the session log)
import { devices, chromium } from "@playwright/test";

const OUT = "docs/screenshots";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();

const login = async (page: import("playwright").Page) => {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("admin@luxestore.com");
  await page.getByLabel("Password").fill("Admin1234!");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForURL(/\/(account|admin)/, { timeout: 15_000 });
  await page.waitForLoadState("networkidle");
};

const settle = async (page: import("playwright").Page) => {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(900);
};

// --- Desktop captures -------------------------------------------------------
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await login(page);

// 76 — the filter bar + count line over the unfiltered list
await page.goto(`${BASE}/admin/orders`, { waitUntil: "networkidle" });
await settle(page);
await page.screenshot({ path: `${OUT}/76-admin-orders-filter-bar.png` });

// 77 — the status filter applied (deep-linkable URL, filtered rows)
await page.goto(`${BASE}/admin/orders?status=delivered`, { waitUntil: "networkidle" });
await settle(page);
await page.screenshot({ path: `${OUT}/77-admin-orders-status-filter.png` });

// 78 — the search filter applied (order-number fragment)
await page.goto(`${BASE}/admin/orders?q=001`, { waitUntil: "networkidle" });
await settle(page);
await page.screenshot({ path: `${OUT}/78-admin-orders-search-filter.png` });

// 79 — the combined-filter empty state
await page.goto(`${BASE}/admin/orders?q=zzz-none&status=processing`, { waitUntil: "networkidle" });
await settle(page);
await page.screenshot({ path: `${OUT}/79-admin-orders-empty-state.png` });

await page.close();

// --- Mobile capture (the 13th standing verification) ------------------------
const mobile = await browser.newPage({ ...devices["iPhone 14"] });
await mobile.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await mobile.getByLabel("Email").fill("john@example.com");
await mobile.getByLabel("Password").fill("Demo1234!");
await mobile.getByRole("button", { name: "Log in", exact: true }).click();
await mobile.waitForURL("**/account", { timeout: 15_000 });
await mobile.goto(`${BASE}/`, { waitUntil: "networkidle" });
await mobile.getByRole("button", { name: "Open navigation menu" }).click();
await mobile.waitForTimeout(600); // the open animation settles
await mobile.screenshot({ path: `${OUT}/80-mobile-nav-13th-verification.png` });
await mobile.close();

await browser.close();
console.log("captured 76-80");
