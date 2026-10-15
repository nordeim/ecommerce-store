// Round-61 captures 316-320: the search typeahead popover's row interaction
// states — the resting rows (316), the hovered row (317 — the accent pair),
// the arrow-ACTIVE row (318 — THE HEADLINE's proof: the accent bg +
// aria-selected at capture), the Enter-on-active navigation (319 — the PDP
// landing), the @375 pass (320 — the mobile popover + the active row).
// Probe-first, read-only pages; the server boots on :3001 (the caller's job).
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3001";
const OUT = "docs/screenshots";
const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r("TIMEOUT:" + what), ms))]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await withTimeout(page.goto(CLONE + "/login", { waitUntil: "domcontentloaded" }), 20000, "login-goto");
await withTimeout(page.getByLabel("Email").fill("john@example.com"), 12000, "email-fill");
await withTimeout(page.getByLabel("Password").fill("Demo1234!"), 12000, "pw-fill");
await withTimeout(page.getByRole("button", { name: "Log in", exact: true }).click(), 12000, "login-click");
try {
  await withTimeout(page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 }), 18000, "login-nav");
} catch {}
await withTimeout(page.goto(CLONE + "/", { waitUntil: "domcontentloaded" }), 20000, "home-goto");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1000);

// open the search panel + type the multi-match query
await page.locator('header button[aria-label="Search"]').click();
await page.waitForTimeout(500);
const input = page.locator("input[aria-label='Search products']");
await withTimeout(input.fill("an"), 8000, "fill");
await page.waitForResponse((r) => r.url().includes("/api/search"));
await page.waitForTimeout(400);

// [316] the resting popover rows (the anatomy + the ARIA census at capture)
const restFacts = await page.evaluate(() => {
  const cont = document.querySelector("header .bg-popover");
  const row = cont?.querySelector("button");
  const cs = cont ? getComputedStyle(cont) : null;
  const rcs = row ? getComputedStyle(row) : null;
  const icont = document.querySelector("input[aria-label='Search products']");
  return {
    contRole: cont?.getAttribute("role"), contId: cont?.id,
    contBg: cs?.backgroundColor, contRadius: cs?.borderRadius,
    rowRole: row?.getAttribute("role"), rowH: row ? Math.round(row.getBoundingClientRect().height) : null,
    rowPad: rcs?.padding, rowGap: rcs?.gap,
    inputRole: icont?.getAttribute("role"), inputExpanded: icont?.getAttribute("aria-expanded"),
    inputControls: icont?.getAttribute("aria-controls"), inputAuto: icont?.getAttribute("aria-autocomplete"),
    rowCount: cont ? cont.querySelectorAll("button").length : 0,
  };
});
console.log("316 facts:", JSON.stringify(restFacts));
await page.screenshot({ path: OUT + "/316-srch-popover-resting.png" });
console.log("316 saved");

// [317] the hovered row (row 2 — the accent pair, no text flip)
await page.locator("header .bg-popover button").nth(1).hover();
await page.waitForTimeout(300);
const hoverFacts = await page.evaluate(() => {
  const rows = document.querySelectorAll("header .bg-popover button");
  const row = rows[1];
  const cs = getComputedStyle(row);
  const name = row.querySelector("span > span:nth-child(1)");
  return {
    text: (row.textContent || "").slice(0, 26),
    bg: cs.backgroundColor, color: cs.color,
    nameColor: name ? getComputedStyle(name).color : null, cursor: cs.cursor,
  };
});
console.log("317 facts:", JSON.stringify(hoverFacts));
await page.screenshot({ path: OUT + "/317-srch-row-hover.png" });
console.log("317 saved");

// [318] the arrow-ACTIVE row (ArrowDown — the headline's proof)
await input.click();
await page.keyboard.press("ArrowDown");
await page.waitForTimeout(250);
const activeFacts = await page.evaluate(() => {
  const rows = document.querySelectorAll("header .bg-popover button");
  const row1 = rows[0];
  const cs = getComputedStyle(row1);
  const icont = document.querySelector("input[aria-label='Search products']");
  return {
    row1Selected: row1.getAttribute("aria-selected"),
    row1Bg: cs.backgroundColor, row1Id: row1.id, row1Role: row1.getAttribute("role"),
    activedescendant: icont?.getAttribute("aria-activedescendant"),
    row2Selected: rows[1]?.getAttribute("aria-selected"),
  };
});
console.log("318 facts:", JSON.stringify(activeFacts));
await page.screenshot({ path: OUT + "/318-srch-row-active.png" });
console.log("318 saved");

// [319] the Enter-on-active navigation — the PDP landing
await page.keyboard.press("Enter");
await withTimeout(page.waitForURL("**/product/wireless-headphones", { timeout: 15000 }), 18000, "pdp-nav");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(800);
const pdpFacts = await page.evaluate(() => {
  const h1 = document.querySelector("h1");
  return {
    url: location.pathname,
    h1: (h1?.textContent || "").trim(),
    panelClosed: !document.querySelector("input[aria-label='Search products']"),
  };
});
console.log("319 facts:", JSON.stringify(pdpFacts));
await page.screenshot({ path: OUT + "/319-srch-enter-active-nav.png" });
console.log("319 saved");

// [320] the @375 pass — the mobile popover + the active row
const page2 = await ctx.newPage();
await page2.setViewportSize({ width: 375, height: 667 });
await withTimeout(page2.goto(CLONE + "/", { waitUntil: "domcontentloaded" }), 20000, "home2-goto");
await page2.waitForLoadState("networkidle");
await page2.waitForTimeout(800);
await page2.locator('header button[aria-label="Search"]').click();
await page2.waitForTimeout(500);
const input2 = page2.locator("input[aria-label='Search products']");
await withTimeout(input2.fill("an"), 8000, "fill2");
await page2.waitForResponse((r) => r.url().includes("/api/search"));
await page2.waitForTimeout(400);
await input2.click();
await page2.keyboard.press("ArrowDown");
await page2.waitForTimeout(250);
const mobileFacts = await page2.evaluate(() => {
  const cont = document.querySelector("header .bg-popover");
  const row = cont?.querySelector("button");
  const r = cont?.getBoundingClientRect();
  const rr = row?.getBoundingClientRect();
  const cs = row ? getComputedStyle(row) : null;
  return {
    contW: r ? Math.round(r.width) : null, contX: r ? Math.round(r.x) : null,
    rowW: rr ? Math.round(rr.width) : null, rowH: rr ? Math.round(rr.height) : null,
    rowSelected: row?.getAttribute("aria-selected"), rowBg: cs?.backgroundColor,
  };
});
console.log("320 facts:", JSON.stringify(mobileFacts));
await page2.screenshot({ path: OUT + "/320-srch-mobile-375.png" });
console.log("320 saved");

await browser.close();
console.log("CAPTURES COMPLETE");
