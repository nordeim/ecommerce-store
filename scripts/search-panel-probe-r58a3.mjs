// Round-58 probe A3: the reference's THIRD form button — identify its icon
// (lucide name), its aria, and its BEHAVIOR (click it — does the panel
// close? does the query clear?). Plus the input's Escape behavior control.
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

// 1. the third button's identity: icon svg class + any aria + computed
const third = await page.evaluate(() => {
  const header = document.querySelector("header");
  const form = header?.querySelector("form");
  const btns = form ? [...form.querySelectorAll("button")] : [];
  const ghost = btns[btns.length - 1]; // the h-9 w-9 one
  if (!ghost) return null;
  const svg = ghost.querySelector("svg");
  const cs = getComputedStyle(ghost);
  const r = ghost.getBoundingClientRect();
  return {
    aria: ghost.getAttribute("aria-label"),
    type: ghost.getAttribute("type"),
    svgCls: svg ? (svg.getAttribute("class") || "") : null,
    svgPathCount: svg ? svg.querySelectorAll("path").length : 0,
    computed: { w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, color: cs.color, radius: cs.borderRadius, hoverBg: cs.backgroundColor },
    text: (ghost.textContent || "").trim(),
  };
});
console.log("THIRD BUTTON:", JSON.stringify(third, null, 1));

// 2. its hover state
const ghostBtn = page.locator("header form button").nth(2);
await ghostBtn.hover();
await page.waitForTimeout(400);
const hoverState = await page.evaluate(() => {
  const header = document.querySelector("header");
  const form = header?.querySelector("form");
  const btns = form ? [...form.querySelectorAll("button")] : [];
  const ghost = btns[btns.length - 1];
  const cs = ghost ? getComputedStyle(ghost) : null;
  return ghost ? { bg: cs.backgroundColor, color: cs.color } : null;
});
console.log("THIRD HOVER:", JSON.stringify(hoverState));

// 3. type a query first, then click the third button — behavior
const input = page.locator("header input").first();
await input.fill("serum");
await page.waitForTimeout(600);
await ghostBtn.click();
await page.waitForTimeout(900);
const afterClick = await page.evaluate(() => {
  const header = document.querySelector("header");
  const input = header?.querySelector("input");
  return {
    inputStillInDom: !!input,
    inputVisible: input ? !!(input.offsetWidth || input.offsetHeight) : false,
    inputValue: input?.value ?? null,
    path: location.pathname,
  };
});
console.log("AFTER THIRD-BUTTON CLICK:", JSON.stringify(afterClick));

// 4. screenshot for the record
await page.locator("header button").nth(1).click(); // reopen if closed
await page.waitForTimeout(900);
await page.locator("header input").first().fill("serum");
await page.waitForTimeout(400);
await page.screenshot({ path: "/tmp/audit-r58/ref-search-panel-with-third.png" });
console.log("screenshot saved");

await browser.close();
