// Session-11 screenshot capture (production standalone server, remediated
// code). Mirrors scripts/capture-session10.ts. Run: bun scripts/capture-session11.ts
// 68 is the A11Y-FOCUS-1 proof (focus on the hero prev-arrow — the first
// tab stop after the CTA; the invisible slides are inert).
// 69 is the 11th mobile-nav standing verification (open Sheet).
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

// --- Desktop captures: the trap-12/13 typography surfaces ------------------
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// 64 — home hero @ desktop: the reference's exact font file now drives every
//      glyph (subpixel smoothing + the prep-table woff2)
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.evaluate(async () => {
  await document.fonts.ready;
});
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/64-font-parity-home-hero.png` });

// 65 — shop @ desktop: the typography band that carried the 2.5% halo
await page.goto(`${BASE}/shop`, { waitUntil: "networkidle" });
await page.evaluate(async () => {
  await document.fonts.ready;
});
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/65-font-parity-shop.png` });

// 66 — PDP @ desktop: the worst pre-fix pixel diff (4.81%), now 0.60%
await page.goto(`${BASE}/product/wireless-headphones`, { waitUntil: "networkidle" });
await page.evaluate(async () => {
  await document.fonts.ready;
});
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/66-font-parity-pdp.png` });

// 67 — login @ desktop: text-heavy standalone auth screen, now 0.23%
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.evaluate(async () => {
  await document.fonts.ready;
});
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/67-font-parity-login.png` });

// --- The A11Y-FOCUS-1 proof: tab order through the hero --------------------
// 68 — focus the hero's active CTA, Tab once → the prev-arrow BUTTON owns
//      focus (its focus ring visible); the invisible slides are inert.
const hero = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await hero.goto(`${BASE}/`, { waitUntil: "networkidle" });
await hero.evaluate(async () => {
  await document.fonts.ready;
});
await hero.locator('[aria-roledescription="carousel"]').scrollIntoViewIfNeeded();
const cta = hero.locator('[aria-roledescription="carousel"] a[href]').first();
await cta.focus();
await hero.keyboard.press("Tab");
await hero.waitForTimeout(400);
await hero.screenshot({ path: `${OUT}/68-hero-tab-order-inert.png` });

// --- 69 — mobile nav, 11th standing verification (open Sheet) --------------
const ctx = await browser.newContext({ ...devices["iPhone 14"] });
const touch = await ctx.newPage();
await touch.goto(`${BASE}/`, { waitUntil: "networkidle" });
await touch.evaluate(async () => {
  await document.fonts.ready;
});
await touch.evaluate(() => {
  const btn = [...document.querySelectorAll("header button")].find((b) => b.querySelector("svg.lucide-menu")) as HTMLElement | undefined;
  if (btn) btn.click();
});
await touch.waitForTimeout(900);
await touch.screenshot({ path: `${OUT}/69-mobile-nav-11th-verification.png` });

await browser.close();
console.log("6 captures written (64-69)");
