// Session-9 screenshot capture (dev server, remediated code).
// Mirrors scripts/capture-session8.ts. Run: bun scripts/capture-session9.ts
// 57 is a FULL-PAGE mobile capture (the PDP runs past the 844px fold —
// the stepper / ATC / heart / tabs live below it).
import { chromium } from "playwright";

const OUT = "docs/screenshots";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();

const login = async (page: import("playwright").Page) => {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("john@example.com");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("**/account", { timeout: 15_000 });
  await page.waitForLoadState("networkidle");
};

// --- Desktop captures -------------------------------------------------------
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await login(page);

// 52 — profile tab: fields grid + Save button as a flow child (mt-4, fit-content)
await page.screenshot({ path: `${OUT}/52-account-profile-form-flow-button.png` });

// 53 — orders tab: reference row anatomy (bg-secondary/30 tint, no border,
//      font-semibold number, pill badges, font-bold total, 16px row gaps)
await page.getByRole("tab", { name: "Orders" }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/53-account-orders-reference-anatomy.png` });

// 54 — shop filter bar with the 150px sort trigger
await page.goto(`${BASE}/shop`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/54-shop-filter-row-150px.png` });

// --- Mobile captures ---------------------------------------------------------
const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
await login(mobile);

// 55 — mobile profile: Save button sized to its content (~127px), NOT stretched
await mobile.screenshot({ path: `${OUT}/55-mobile-account-fit-content-save.png` });

// 56 — mobile orders: rows stack (number block above badge + total)
await mobile.getByRole("tab", { name: "Orders" }).click();
await mobile.waitForTimeout(500);
await mobile.screenshot({ path: `${OUT}/56-mobile-orders-stacked-rows.png` });

// 57 — mobile PDP, full page (breadcrumb / badges / star row / price /
//      stepper + ATC + heart / tab strip all visible past the fold)
await mobile.goto(`${BASE}/product/wireless-headphones`, {
  waitUntil: "networkidle",
});
await mobile.screenshot({
  path: `${OUT}/57-pdp-remediated.png`,
  fullPage: true,
});

await browser.close();
console.log("captured 52-57");
