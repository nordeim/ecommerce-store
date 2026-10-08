// Session-10 screenshot capture (production standalone server, remediated
// code). Mirrors scripts/capture-session9.ts. Run: bun scripts/capture-session10.ts
// 61 is captured in an iPhone-14-EMULATED context with a real card hover —
// the trap-11 proof (hover effects render where (hover: hover) is false).
// 63 is the 10th mobile-nav standing verification (open Sheet).
import { devices, chromium } from "@playwright/test";

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

// --- Desktop captures --------------------------------------------------------
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// 58 — home hero @ desktop: the trap-10 pins (h1 lh 48px @ lg, text-block
//      back to the reference's 244px for the 2-line Spring slide)
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/58-hero-line-height-desktop.png` });

// 59 — home hero @ tablet 768: the sm: companion (h1 lh 40px)
await page.setViewportSize({ width: 768, height: 1024 });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/59-hero-line-height-tablet.png` });

// 60 — product-card hover @ desktop: scaled img + primary title
//      (group-hover now ungated; also proves desktop hover unaffected)
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}/shop`, { waitUntil: "networkidle" });
const card = page.locator("main div.group").first();
await card.hover();
await page.waitForTimeout(800); // let the 500ms scale transition settle
await page.screenshot({ path: `${OUT}/60-card-hover-desktop.png` });

// --- Touch-context captures (the trap-11 decisive condition) ----------------
const ctx = await browser.newContext({
  ...devices["iPhone 14"],
  storageState: "tests/e2e/.auth/user.json",
});
const touch = await ctx.newPage();

// 61 — product-card hover in an iPhone-14 context (hover:hover FALSE):
//      the reference renders its hover effects here; the ungated clone now
//      does too (img scale 1.05, title primary)
await touch.goto(`${BASE}/shop`, { waitUntil: "networkidle" });
await touch.locator("main div.group").first().hover();
await touch.waitForTimeout(800);
await touch.screenshot({ path: `${OUT}/61-card-hover-touch-context.png` });

// 63 — mobile nav, 10th standing verification (open Sheet, byte-exact panel)
await touch.goto(`${BASE}/`, { waitUntil: "networkidle" });
await touch.locator('button[aria-label="Open navigation menu"]').click();
await touch.waitForTimeout(600);
await touch.screenshot({ path: `${OUT}/63-mobile-nav-10th-verification.png` });
await ctx.close();

// --- Tablet-band surface ------------------------------------------------------
const tablet = await browser.newPage({
  viewport: { width: 768, height: 1024 },
  storageState: "tests/e2e/.auth/user.json",
});

// 62 — shop @ 768: the round's audited tablet band (3-col grid, 150px sort)
await tablet.goto(`${BASE}/shop`, { waitUntil: "networkidle" });
await tablet.screenshot({ path: `${OUT}/62-tablet-shop-768.png` });
await tablet.close();

// (auth not needed for any of the above surfaces — public pages + the
// storageState contexts — but keep the login flow import-compatible)
void login;

await browser.close();
console.log("captured 58-63");
