// Session-8 screenshot capture (dev server, remediated code).
// Mirrors scripts/capture-session7.ts. Run: bun scripts/capture-session8.ts
import { chromium } from "playwright";

const OUT = "docs/screenshots";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();

// --- Desktop captures -------------------------------------------------------
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// 46 — PDP with the fixed flat star row (4 amber + 1 gray) + breadcrumb gap
await page.goto(`${BASE}/product/wireless-headphones`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/46-pdp-star-row-parity.png` });

// 47 — register card with the restored 11px label gaps (trap 8)
await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/47-register-field-spacing.png` });

// 48 — unknown route: humanized-path title + platform 404
await page.goto(`${BASE}/nonexistent-route-xyz`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/48-404-humanized-title.png` });

// 49 — account profile: inline labels + 24px tab gap + 16px save spacing
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.getByLabel("Email").fill("john@example.com");
await page.getByLabel("Password").fill("Demo1234!");
await page.getByRole("button", { name: "Log in" }).click();
await page.waitForURL("**/account", { timeout: 15_000 });
await page.waitForLoadState("networkidle");
await page.screenshot({ path: `${OUT}/49-account-profile-geometry.png` });

// 50 — feature bar with the reference glyphs (shield + rotate-ccw)
await page.goto(`${BASE}`, { waitUntil: "networkidle" });
await page.evaluate(() => {
  const features = document.querySelector("main section:nth-of-type(1)") ?? document.body;
  features.scrollIntoView({ block: "center" });
});
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/50-feature-bar-glyphs.png` });

// --- Mobile capture ----------------------------------------------------------
const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
await mobile.goto(`${BASE}`, { waitUntil: "networkidle" });
await mobile.locator('header button[aria-label="Open navigation menu"]').click();
await mobile.waitForTimeout(600);
await mobile.screenshot({ path: `${OUT}/51-mobile-nav-8th-verification.png` });

await browser.close();
console.log("captured 46-51");
