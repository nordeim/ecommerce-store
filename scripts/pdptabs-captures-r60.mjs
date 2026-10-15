// Round-60 captures 311-315: the tabs interaction family's states — the
// resting tablist (311), the Reviews panel swap (312), the CLICKED trigger
// with NO ring (313 — the headline's proof), the keyboard-focused trigger
// with the ring (314 — the two-sided truth), the account variant (315).
// Probe-first, read-only pages; the server boots on :3001.
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
await withTimeout(page.goto(CLONE + "/product/wireless-headphones", { waitUntil: "domcontentloaded" }), 20000, "pdp-goto");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1200);

// scroll the tablist into a good capture position
await page.evaluate(() => {
  document.querySelector('[role="tablist"]').scrollIntoView({ block: "center" });
});
await page.waitForTimeout(500);

// [311] the resting tablist (the pill list, the Description selected)
const restingFacts = await page.evaluate(() => {
  const list = document.querySelector('[role="tablist"]');
  const sel = document.querySelector('[role="tab"][aria-selected="true"]');
  const lcs = getComputedStyle(list);
  const scs = getComputedStyle(sel);
  return { listCls: list.getAttribute("class"), overflowX: lcs.overflowX, selBg: scs.backgroundColor, selShadow: scs.boxShadow.slice(0, 120) };
});
console.log("311 facts:", JSON.stringify(restingFacts));
await page.screenshot({ path: OUT + "/311-pdp-tablist-resting.png" });
console.log("311 saved");

// [312] the Reviews click — the panel swap (settled, no ring on the trigger)
await page.locator('[role="tab"]', { hasText: "Reviews" }).click();
await page.waitForTimeout(900);
const clickFacts = await page.evaluate(() => {
  const sel = document.querySelector('[role="tab"][aria-selected="true"]');
  const panel = document.querySelector('[role="tabpanel"][data-state="active"]');
  const cs = getComputedStyle(sel);
  const spreads = (cs.boxShadow.match(/0px 0px 0px (\d+(?:\.\d+)?)px/g) || []).map((s) => Number((s.match(/(\d+(?:\.\d+)?)px$/) || [])[1] || 0));
  return {
    selText: (sel.textContent || "").trim(),
    m: sel.matches(":focus-visible"),
    spreads,
    panelHead: (panel.textContent || "").trim().slice(0, 40),
  };
});
console.log("312/313 facts:", JSON.stringify(clickFacts));
await page.screenshot({ path: OUT + "/312-reviews-panel-swap.png" });
console.log("312 saved");

// [313] a tight crop of the CLICKED trigger (no ring — the headline proof)
const trigRect = await page.evaluate(() => {
  const sel = document.querySelector('[role="tab"][aria-selected="true"]');
  const r = sel.getBoundingClientRect();
  const list = document.querySelector('[role="tablist"]').getBoundingClientRect();
  return { x: Math.max(0, list.x - 8), y: Math.max(0, r.y - 8), width: list.width + 16, height: r.height + 16 };
});
await page.screenshot({ path: OUT + "/313-clicked-trigger-no-ring.png", clip: trigRect });
console.log("313 saved");

// [314] the keyboard-focused trigger — the ring paints (two-sided truth)
await page.evaluate(() => {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  window.scrollTo(0, 0);
});
await page.waitForTimeout(200);
let landed = false;
for (let i = 0; i < 60; i++) {
  await page.keyboard.press("Tab");
  await page.waitForTimeout(50);
  const isTab = await page.evaluate(() => document.activeElement?.getAttribute("role") === "tab");
  if (isTab) { landed = true; break; }
}
await page.waitForTimeout(500); // settle the ring fully
const kbFacts = await page.evaluate(() => {
  const el = document.activeElement;
  const cs = getComputedStyle(el);
  const spreads = (cs.boxShadow.match(/0px 0px 0px (\d+(?:\.\d+)?)px/g) || []).map((s) => Number((s.match(/(\d+(?:\.\d+)?)px$/) || [])[1] || 0));
  return { text: (el.textContent || "").trim(), m: el.matches(":focus-visible"), spreads };
});
console.log("314 facts:", JSON.stringify({ landed, ...kbFacts }));
const kbRect = await page.evaluate(() => {
  const el = document.activeElement;
  const r = el.getBoundingClientRect();
  const list = document.querySelector('[role="tablist"]').getBoundingClientRect();
  return { x: Math.max(0, list.x - 8), y: Math.max(0, r.y - 8), width: list.width + 16, height: r.height + 16 };
});
await page.screenshot({ path: OUT + "/314-keyboard-focused-ring.png", clip: kbRect });
console.log("314 saved");

// [315] the account variant (the icons + the account classes)
const page2 = await ctx.newPage();
await withTimeout(page2.goto(CLONE + "/account", { waitUntil: "domcontentloaded" }), 20000, "acct-goto");
await page2.waitForLoadState("networkidle");
await page2.waitForTimeout(1000);
await page2.evaluate(() => {
  document.querySelector('[role="tablist"]').scrollIntoView({ block: "center" });
});
await page2.waitForTimeout(500);
const acctFacts = await page2.evaluate(() => {
  const list = document.querySelector('[role="tablist"]');
  const trig = list.querySelector('[role="tab"]');
  const icon = trig.querySelector("svg");
  const ir = icon.getBoundingClientRect();
  const lcs = getComputedStyle(list);
  const tcs = getComputedStyle(trig);
  let iconTextGap = null;
  const range = document.createRange();
  for (const node of trig.childNodes) {
    if (node.nodeType === 3 && (node.textContent || "").trim()) {
      range.selectNodeContents(node);
      const tr = range.getBoundingClientRect();
      if (tr.width > 0) { iconTextGap = +(tr.x - (ir.x + ir.width)).toFixed(2); break; }
    }
  }
  return { listCls: list.getAttribute("class"), overflowX: lcs.overflowX, trigGap: tcs.gap, iconTextGap };
});
console.log("315 facts:", JSON.stringify(acctFacts));
await page2.screenshot({ path: OUT + "/315-account-variant.png" });
console.log("315 saved");

await browser.close();
console.log("CAPTURES COMPLETE");
