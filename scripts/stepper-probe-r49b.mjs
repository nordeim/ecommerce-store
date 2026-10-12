// Round-49 calibration probe B (v2): the reference's DRAWER stepper boundary
// fate with content-scoped selectors (the first pass matched the Radix
// OVERLAY; this one scopes to the element carrying the "Cart (" heading).
//
//   B2  the minus-at-1 fate on a FRESH item (remove? — the definitive
//       measurement, content-scoped)
//   B3  the plus at high qty (any cap? disabled? error copy?)
//   B4  the PDP plus pushed to 15 (the ceiling question)
//
// Run: node scripts/stepper-probe-r49b.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/probe-r49";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const report = (k, v) => console.log(`  ${k.padEnd(44)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

// login
const lp = await ctx.newPage();
await lp.goto(REF + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await lp.getByLabel("Password").fill("$Abcd1234");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try {
  await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
} catch { /* report what we find */ }
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
await lp.close();
console.log("login ok");

const page = await ctx.newPage();

// content-scoped evaluate: finds the drawer CONTENT (the element with the
// "Cart (N)" heading), then runs the body expression with (dlg, $) bound.
const FIND = `(() => {
  const els = [...document.querySelectorAll("[role=dialog],[data-state=open]")];
  const dlg = els.find((e) => /Cart \\(\\d+\\)/.test(e.textContent || "")) ?? els.find((e) => e.querySelector("button"));
  if (!dlg) return null;
  const $ = (sel) => [...dlg.querySelectorAll(sel)];
  return ({ dlg, $, cs: (el) => getComputedStyle(el) });
})()`;
const drawerQuery = (body) => page.evaluate(`(() => {
  const ctx = ${FIND};
  if (!ctx) return { found: false };
  ${body}
})()`);

line("B2: the minus-at-1 fate on a FRESH item (definitive)");
await page.goto(REF + "/product/wireless-headphones", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.getByRole("button", { name: "Add to Cart" }).first().click();
await page.waitForTimeout(2500);
await page.locator("header button").filter({ has: page.locator("svg.lucide-shopping-bag") }).click();
await page.waitForTimeout(2000);

const before = await drawerQuery(`
  return {
    found: true,
    heading: ctx.dlg.querySelector("h2")?.textContent?.trim(),
    imgs: ctx.$("img").length,
    minusDisabled: ctx.$("button").find((b) => b.querySelector("svg.lucide-minus"))?.disabled === true,
  };`);
report("before minus-at-1", JSON.stringify(before));

await page.locator("[role=dialog] button", { has: page.locator("svg.lucide-minus") }).first().click({ timeout: 5000 }).catch((e) => report("click", "THREW " + e.message.split("\n")[0]));
await page.waitForTimeout(1500);
const after = await drawerQuery(`
  return {
    found: true,
    heading: ctx.dlg.querySelector("h2")?.textContent?.trim(),
    imgs: ctx.$("img").length,
    emptyMsg: /cart is empty/.test(ctx.dlg.textContent || ""),
    startShopping: (ctx.dlg.textContent || "").includes("Start Shopping"),
  };`);
report("after minus-at-1", JSON.stringify(after));
await page.screenshot({ path: OUT + "/b2b-drawer-after-minus-at-1.png", fullPage: false });

line("B3: the drawer plus at high qty (fresh item, 6 clicks)");
await page.keyboard.press("Escape").catch(() => {});
await page.waitForTimeout(800);
await page.getByRole("button", { name: "Add to Cart" }).first().click();
await page.waitForTimeout(2000);
await page.locator("header button").filter({ has: page.locator("svg.lucide-shopping-bag") }).click();
await page.waitForTimeout(2000);
for (let i = 0; i < 6; i++) {
  await page.locator("[role=dialog] button", { has: page.locator("svg.lucide-plus") }).first().click({ timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(400);
}
const afterPlus = await drawerQuery(`
  const btns = ctx.$("button");
  const minus = btns.find((b) => b.querySelector("svg.lucide-minus"));
  const plus = btns.find((b) => b.querySelector("svg.lucide-plus"));
  const container = minus?.parentElement;
  const qtyEl = container ? [...container.children].find((c) => c !== minus && c !== plus) : null;
  return {
    found: true,
    heading: ctx.dlg.querySelector("h2")?.textContent?.trim(),
    qty: qtyEl?.textContent?.trim(),
    plusDisabled: plus?.disabled === true,
    plusOpacity: plus ? ctx.cs(plus).opacity : null,
    errorCopy: (ctx.dlg.textContent || "").match(/(?:[Ss]orry|[Ll]imit|[Mm]aximum|[Oo]nly \\d+ left)[^.]*/)?.[0] ?? null,
    money: ctx.$("p,span,div").map((e) => (e.textContent || "").trim()).filter((t) => /^\\$[\\d,.]+$/.test(t)).slice(0, 5),
  };`);
report("after drawer +6", JSON.stringify(afterPlus));
await page.screenshot({ path: OUT + "/b3b-drawer-after-plus6.png", fullPage: false });

line("B4: the PDP plus pushed to 15 (ceiling question)");
await page.keyboard.press("Escape").catch(() => {});
await page.waitForTimeout(800);
await page.goto(REF + "/product/wireless-earbuds", { waitUntil: "networkidle" }).catch(async () => {
  await page.goto(REF + "/product/smart-watch", { waitUntil: "networkidle" });
});
await page.waitForTimeout(1500);
for (let i = 0; i < 15; i++) {
  await page.locator("button", { has: page.locator("svg.lucide-plus") }).first().click({ timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(200);
}
const pdpPlus15 = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-minus"));
  const p = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-plus"));
  const c = b?.parentElement;
  const qtyEl = c ? [...c.children].find((ch) => ch !== b && ch !== p) : null;
  return { qty: qtyEl?.textContent?.trim(), plusDisabled: p?.disabled === true, plusOpacity: p ? getComputedStyle(p).opacity : null };
});
report("PDP after +15", JSON.stringify(pdpPlus15));
await page.screenshot({ path: OUT + "/b4-pdp-after-plus15.png", fullPage: true });

await browser.close();
console.log("\nPROBE B COMPLETE");
