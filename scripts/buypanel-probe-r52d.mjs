// Round-52 calibration probe D: THE ACCENT QUESTION, settled decisively.
// r52c's heart-hover read hit a related-product CARD heart (.last() in main)
// — its hover:bg-background = #FBFAF9 contaminated the measurement. This
// probe measures ONLY the buy-panel action row's heart hover (scoped), the
// home resting accent sites (category tiles + feature-bar tiles), the :root
// token literals, and the ghost Clear button's hover on /shop.
// Run: node scripts/buypanel-probe-r52d.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const report = (k, v) => console.log(`  ${k.padEnd(46)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

// login
const lp = await ctx.newPage();
await lp.goto(REF + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await lp.getByLabel("Password").fill("$Abcd1234");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try { await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }); } catch {}
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
await lp.close();

const page = await ctx.newPage();

line("A. :ROOT TOKENS — the accent literals");
const tokens = await page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  const read = (n) => cs.getPropertyValue(n).trim();
  return {
    accent: read("--accent"), accentFg: read("--accent-foreground"),
    background: read("--background"), secondary: read("--secondary"),
    primary: read("--primary"), muted: read("--muted"),
  };
});
for (const [k, v] of Object.entries(tokens)) report(`token.${k}`, v);

line("B. THE BUY-PANEL HEART HOVER — scoped to the action row");
await page.goto(REF + "/product/wireless-headphones", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const rowHeart = page.locator("main .flex.items-center.gap-4.mb-4").getByRole("button").filter({ has: page.locator("svg.lucide-heart") });
const restBg = await rowHeart.evaluate((el) => getComputedStyle(el).backgroundColor);
await rowHeart.hover();
await page.waitForTimeout(700);
const hov = await rowHeart.evaluate((el) => {
  const cs = getComputedStyle(el);
  return { bg: cs.backgroundColor, color: cs.color };
});
report("buyHeart.restBg", restBg);
report("buyHeart.hoverBg", hov.bg);
report("buyHeart.hoverColor", hov.color);

line("C. HOME RESTING ACCENT SITES — category + feature tiles");
await page.goto(REF + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const tiles = await page.evaluate(() => {
  // Category tiles: h-14 w-14 (56px) rounded-2xl; feature tiles: h-12 (48px)
  const cat = [...document.querySelectorAll("div.h-14.w-14, div")].filter((d) => {
    const r = d.getBoundingClientRect();
    return Math.round(r.width) === 56 && Math.round(r.height) === 56 && getComputedStyle(d).borderRadius === "16px" && d.querySelector("svg");
  }).slice(0, 2);
  const feat = [...document.querySelectorAll("div")].filter((d) => {
    const r = d.getBoundingClientRect();
    return Math.round(r.width) === 48 && Math.round(r.height) === 48 && getComputedStyle(d).borderRadius === "16px" && d.querySelector("svg");
  }).slice(0, 2);
  const read = (d) => {
    const cs = getComputedStyle(d);
    return { bg: cs.backgroundColor, icon: getComputedStyle(d.querySelector("svg")).color, cls: d.className.slice(0, 80) };
  };
  return { cat: cat.map(read), feat: feat.map(read) };
});
for (const t of tiles.cat) report("categoryTile", JSON.stringify(t));
for (const t of tiles.feat) report("featureTile", JSON.stringify(t));

line("D. THE GHOST CLEAR BUTTON HOVER — /shop (round-50's surface)");
await page.goto(REF + "/shop?search=zzzqqq", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const clear = page.getByRole("link", { name: /clear all filters/i });
if (await clear.count()) {
  // The empty-state's Clear is a link-styled button; find any hover:bg-accent sibling
  const clearHov = await clear.first().evaluate((el) => {
    // walk up to find the button/link carrying hover:bg-accent
    let t = el;
    for (let i = 0; i < 3 && t; i++) {
      if ((t.className || "").includes("hover:bg-accent")) break;
      t = t.parentElement;
    }
    if (!t || !(t.className || "").includes("hover:bg-accent")) return { found: false, cls: el.className.slice(0, 100) };
    const rest = getComputedStyle(t).backgroundColor;
    return { found: true, cls: t.className.slice(0, 120), restBg: rest };
  });
  for (const [k, v] of Object.entries(clearHov)) report(`clear.${k}`, v);
  await clear.first().hover();
  await page.waitForTimeout(700);
  const hovRead = await clear.first().evaluate((el) => {
    let t = el;
    for (let i = 0; i < 3 && t; i++) {
      if ((t.className || "").includes("hover:bg-accent")) break;
      t = t.parentElement;
    }
    if (!t) return { found: false };
    const cs = getComputedStyle(t);
    return { found: true, bg: cs.backgroundColor, color: cs.color };
  });
  report("clear.hoverBg", hovRead.bg);
  report("clear.hoverColor", hovRead.color);
} else {
  report("clear", "NOT FOUND");
}

line("E. THE SELECT ITEM HIGHLIGHT — the shop category popover");
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
// open the category select
const trigger = page.locator("button[role='combobox']").first();
if (await trigger.count()) {
  await trigger.click();
  await page.waitForTimeout(700);
  const itemHov = await page.evaluate(() => {
    const opts = [...document.querySelectorAll('[role="option"]')];
    const first = opts[0];
    if (!first) return { found: false };
    const rest = getComputedStyle(first).backgroundColor;
    const cls = first.className.slice(0, 110);
    return { found: true, count: opts.length, firstRestBg: rest, cls };
  });
  for (const [k, v] of Object.entries(itemHov)) report(`option.${k}`, v);
  // hover the SECOND option (so the first keeps its highlight state for reading)
  const opt = page.locator('[role="option"]').nth(1);
  if (await opt.count()) {
    await opt.hover();
    await page.waitForTimeout(500);
    const hov = await opt.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color };
    });
    report("option.hoverBg", hov.bg);
    report("option.hoverColor", hov.color);
  }
  await page.keyboard.press("Escape");
}

await browser.close();
console.log("\nPROBE r52d COMPLETE");
