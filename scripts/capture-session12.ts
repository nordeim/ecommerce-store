// Session-12 screenshot capture (production standalone server, remediated
// code). Mirrors scripts/capture-session11.ts. Run: bun scripts/capture-session12.ts
// 70-72 the A11Y-MAIN-1 single-landmark surfaces (home/PDP/account)
// 73 the A11Y-ARIA-1 nameless toast live region (add-to-cart toast)
// 74 the 12th mobile-nav standing verification (open Sheet, iPhone 14)
// 75 the WCAG 1.4.4 200%-zoom reflow surface (512px CSS width)
import { devices, chromium } from "@playwright/test";

const OUT = "docs/screenshots";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();

const login = async (page: import("playwright").Page) => {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("john@example.com");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForURL("**/account", { timeout: 15_000 });
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

// 70 — home @ desktop: the full chrome with exactly one <main> landmark
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await settle(page);
await page.screenshot({ path: `${OUT}/70-a11y-single-main-home.png` });

// 71 — PDP @ desktop: the rating row now carries role="img" + the label
//      (A11Y-ARIA-2) — the flat floor() 5-glyph row is unchanged
await page.goto(`${BASE}/product/wireless-headphones`, { waitUntil: "networkidle" });
await settle(page);
await page.screenshot({ path: `${OUT}/71-a11y-rating-role-img-pdp.png` });

// 72 — account @ desktop: the page that carried the nested <main> since
//      session-1 now renders a single landmark (A11Y-MAIN-1)
await login(page);
await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
await settle(page);
await page.screenshot({ path: `${OUT}/72-a11y-single-main-account.png` });

// 73 — the nameless toast live region (A11Y-ARIA-1): add-to-cart fires the
//      dark bottom-right toast; the region announces content, not a label
await page.goto(`${BASE}/product/wireless-headphones`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Add to Cart" }).first().click();
await page.waitForTimeout(700); // toast enter spring
await page.screenshot({ path: `${OUT}/73-a11y-nameless-toast-region.png` });
await page.close();

// --- Mobile: the 12th standing verification ---------------------------------
const iphone = devices["iPhone 14"];
const mctx = await browser.newContext({ ...iphone });
const mpage = await mctx.newPage();
await mpage.goto(`${BASE}/`, { waitUntil: "load" });
await mpage.evaluate(() => {
  const btns = [...document.querySelectorAll("header button")];
  const hamburger = btns.find((b) => b.querySelector("svg.lucide-menu")) as HTMLButtonElement | undefined;
  (hamburger ?? (btns[0] as HTMLButtonElement | undefined))?.click();
});
await mpage.waitForTimeout(700); // sheet slide-in
await mpage.screenshot({ path: `${OUT}/74-mobile-nav-12th-verification.png` });
await mctx.close();

// --- 200% zoom reflow (WCAG 1.4.4) ------------------------------------------
const zctx = await browser.newContext({ viewport: { width: 512, height: 384 } });
const zpage = await zctx.newPage();
await zpage.goto(`${BASE}/product/wireless-headphones`, { waitUntil: "load" });
await zpage.waitForTimeout(900);
await zpage.screenshot({ path: `${OUT}/75-200pct-reflow-pdp.png` });
await zctx.close();

await browser.close();
console.log("captures done: 70-75");
