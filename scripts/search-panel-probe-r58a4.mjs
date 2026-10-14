// Round-58 probe A4: the reference's THIRD form button (the X close button)
// — its hover state via coordinate mouse-move, and its CLICK behavior
// (does the panel close? does the query survive a reopen?).
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r("TIMEOUT:" + what), ms))]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const lp = await ctx.newPage();
await withTimeout(lp.goto(REF + "/login", { waitUntil: "domcontentloaded" }), 25000, "login-goto");
await withTimeout(lp.getByLabel("Email").fill("sepnetflix2023@outlook.com"), 15000, "email-fill");
await withTimeout(lp.getByLabel("Password").fill("$Abcd1234"), 15000, "pw-fill");
await withTimeout(lp.getByRole("button", { name: "Log in", exact: true }).click(), 15000, "login-click");
try {
  await withTimeout(lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }), 28000, "login-nav");
} catch {}
await lp.waitForTimeout(1500);
await lp.close();

const page = await ctx.newPage();
await withTimeout(page.goto(REF + "/", { waitUntil: "domcontentloaded", timeout: 30000 }), 35000, "home-goto");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1500);

// open the search panel
await page.locator("header button").nth(1).click();
await page.waitForTimeout(1200);

// 1. hover the X via coordinate mouse move (no locator stability games)
const xRect = await page.evaluate(() => {
  const form = document.querySelector("header form");
  const btns = form ? [...form.querySelectorAll("button")] : [];
  const ghost = btns[btns.length - 1];
  const r = ghost.getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
});
await page.mouse.move(xRect.cx, xRect.cy);
await page.waitForTimeout(500);
const hoverState = await page.evaluate(() => {
  const form = document.querySelector("header form");
  const btns = form ? [...form.querySelectorAll("button")] : [];
  const ghost = btns[btns.length - 1];
  const cs = ghost ? getComputedStyle(ghost) : null;
  return ghost ? { bg: cs.backgroundColor, color: cs.color, transition: cs.transitionDuration } : null;
});
console.log("X HOVER:", JSON.stringify(hoverState));

// 2. type a query, then click the X — the behavior
await page.locator("header input").first().fill("serum");
await page.waitForTimeout(600);
await page.mouse.click(xRect.cx, xRect.cy);
await page.waitForTimeout(900);
const afterClick = await page.evaluate(() => {
  const header = document.querySelector("header");
  const input = header?.querySelector("input");
  return {
    inputInDom: !!input,
    inputVisible: input ? !!(input.offsetWidth || input.offsetHeight) : false,
    inputValue: input?.value ?? null,
    path: location.pathname,
  };
});
console.log("AFTER X CLICK:", JSON.stringify(afterClick));

// 3. reopen via the search icon — does the query survive?
await page.locator("header button").nth(1).click();
await page.waitForTimeout(900);
const afterReopen = await page.evaluate(() => {
  const input = document.querySelector("header input");
  return { visible: !!input, value: input?.value ?? null };
});
console.log("AFTER REOPEN:", JSON.stringify(afterReopen));

// 4. the X's aria/role at rest — and the panel's outside-click close behavior
await page.mouse.click(512, 700); // click the page body well below
await page.waitForTimeout(900);
const afterOutside = await page.evaluate(() => {
  const input = document.querySelector("header input");
  return { inputVisible: input ? !!(input.offsetWidth || input.offsetHeight) : false };
});
console.log("AFTER OUTSIDE-CLICK:", JSON.stringify(afterOutside));

await browser.close();
