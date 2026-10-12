// Round-50 third probe (r50c): settling the remaining questions.
//   P  the chips question — do deep-linked ?category=/?search= render chips
//      on the reference TODAY? (session-3 measured them; today's pill hunt
//      found none — drift suspicion). Full anchor/span dump.
//   Q  the sort deep-link drift — ?sort=newest/rating/price_asc with DOUBLE
//      reads (1500ms + 4000ms) + the UI "Newest" selection's order.
//   R  the header search submit — locate the icon button (no aria-label),
//      type, submit: where does it navigate?
//   S  the popover geometry — width vs trigger, gap, item hover state.
//   T  the category popover's full option list + the price popover anatomy.
//   U  the bar search — URL polling right after Enter (transient push?).
// Run: node scripts/shopfilter-probe-r50c.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const report = (k, v) => console.log(`  ${k.padEnd(46)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

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

const cardSlugs = () =>
  page.evaluate(() => {
    const links = [...document.querySelectorAll("main a[href^='/product/']")];
    const seen = [];
    for (const a of links) {
      const s = a.getAttribute("href").split("/").pop();
      if (!seen.includes(s)) seen.push(s);
    }
    return seen;
  });

// ---------------------------------------------------------------------------
// P — the chips question: full anchor dump on the deep-linked pages
// ---------------------------------------------------------------------------
line("P1: ?category=electronics — ALL main anchors/spans with classes");
await page.goto(REF + "/shop?category=electronics", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
const catDump = await page.evaluate(() => {
  const els = [...document.querySelectorAll("main a, main span, main button")]
    .filter((e) => e.textContent.trim().length > 0 && e.textContent.trim().length < 40)
    .slice(0, 30);
  return els.map((e) => ({
    tag: e.tagName,
    text: e.textContent.trim().slice(0, 30),
    classes: (e.className.baseVal ?? e.className).toString().slice(0, 110),
  }));
});
console.log(JSON.stringify(catDump, null, 1).slice(0, 3200));
await page.screenshot({ path: "/tmp/probe-r50/p1-category-deeplink.png", fullPage: false });

line("P2: ?search=serum — the quoted-chip hunt");
await page.goto(REF + "/shop?search=serum", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
const serumDump = await page.evaluate(() => {
  const quoted = [...document.querySelectorAll("main *")].filter((e) =>
    e.children.length === 0 && e.textContent.trim().startsWith('"'),
  );
  return quoted.map((e) => ({ tag: e.tagName, text: e.textContent.trim(), classes: e.className.toString().slice(0, 110) }));
});
console.log(JSON.stringify(serumDump, null, 1));
await page.screenshot({ path: "/tmp/probe-r50/p2-search-deeplink.png", fullPage: false });

// ---------------------------------------------------------------------------
// Q — the sort deep-link drift: double reads + the UI Newest order
// ---------------------------------------------------------------------------
line("Q1: ?sort=newest — double read (1500ms then +4000ms)");
await page.goto(REF + "/shop?sort=newest", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
report("read1[0..3]", JSON.stringify((await cardSlugs()).slice(0, 4)));
await page.waitForTimeout(4000);
report("read2[0..3]", JSON.stringify((await cardSlugs()).slice(0, 4)));
report("read2(n)", (await cardSlugs()).length);

line("Q2: ?sort=price_asc — double read");
await page.goto(REF + "/shop?sort=price_asc", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
report("read1[0..3]", JSON.stringify((await cardSlugs()).slice(0, 4)));
await page.waitForTimeout(3000);
report("read2[0..3]", JSON.stringify((await cardSlugs()).slice(0, 4)));

line("Q3: ?sort=rating — double read");
await page.goto(REF + "/shop?sort=rating", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
report("read1[0..3]", JSON.stringify((await cardSlugs()).slice(0, 4)));
await page.waitForTimeout(3000);
report("read2[0..3]", JSON.stringify((await cardSlugs()).slice(0, 4)));

line("Q4: the UI 'Newest' selection's order (client-side truth)");
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.getByRole("combobox").nth(2).click();
await page.waitForTimeout(600);
await page.getByRole("option", { name: "Newest" }).click();
await page.waitForTimeout(1800);
report("ui-newest[0..5]", JSON.stringify((await cardSlugs()).slice(0, 6)));
report("url", page.url());

line("Q5: resting featured order (the baseline)");
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
report("featured", JSON.stringify(await cardSlugs()));

// ---------------------------------------------------------------------------
// R — the header search submit target
// ---------------------------------------------------------------------------
line("R: the header search — open, type, submit");
await page.goto(REF + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const headerDump = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("header button")];
  return btns.map((b, i) => ({
    i,
    aria: b.getAttribute("aria-label"),
    text: b.textContent.trim().slice(0, 16),
    svg: b.querySelector("svg") ? b.querySelector("svg").className.baseVal : null,
  }));
});
console.log(JSON.stringify(headerDump, null, 1).slice(0, 1600));
// the search icon button: the one with a search svg (no aria-label)
const searchBtnIdx = headerDump.findIndex((b) => b.svg && b.svg.includes("search"));
report("searchBtnIdx", searchBtnIdx);
if (searchBtnIdx >= 0) {
  await page.locator("header button").nth(searchBtnIdx).click();
  await page.waitForTimeout(700);
  const input = page.locator("header input").first();
  await input.fill("watch");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(2200);
  report("url after Enter", page.url());
  report("slugs", JSON.stringify(await cardSlugs()));
}

// ---------------------------------------------------------------------------
// U — the bar search: URL polling right after Enter
// ---------------------------------------------------------------------------
line("U: the bar search — poll the URL right after Enter");
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.locator("main input[placeholder='Search products...']").fill("blanket");
const t0 = Date.now();
await page.keyboard.press("Enter");
for (let i = 0; i < 6; i++) {
  await page.waitForTimeout(400);
  report(`url @${Date.now() - t0}ms`, page.url());
}

// ---------------------------------------------------------------------------
// S — the popover geometry + item hover
// ---------------------------------------------------------------------------
line("S: the sort popover geometry + hover");
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.getByRole("combobox").nth(2).click();
await page.waitForTimeout(800);
const popGeom = await page.evaluate(() => {
  const pop = document.querySelector("[role='listbox']");
  const trig = document.querySelectorAll("button[role='combobox']")[2];
  if (!pop || !trig) return { found: false };
  const pr = pop.getBoundingClientRect();
  const tr = trig.getBoundingClientRect();
  return {
    found: true,
    pop: { x: Math.round(pr.x), y: Math.round(pr.y), w: Math.round(pr.width), h: Math.round(pr.height) },
    trig: { x: Math.round(tr.x), w: Math.round(tr.width) },
    widthMatch: Math.abs(pr.width - tr.width) < 2,
    gapY: Math.round(pr.y - (tr.y + tr.height)),
  };
});
console.log(JSON.stringify(popGeom, null, 1));
const itemPos = await page.evaluate(() => {
  const it = [...document.querySelectorAll("[role='listbox'] [role='option']")][1];
  const r = it.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await page.mouse.move(itemPos.x, itemPos.y);
await page.waitForTimeout(400);
const hoverState = await page.evaluate(() => {
  const it = [...document.querySelectorAll("[role='listbox'] [role='option']")][1];
  const cs = getComputedStyle(it);
  return { bg: cs.backgroundColor, color: cs.color, dataHighlighted: it.getAttribute("data-highlighted") };
});
report("item hover (mouse)", JSON.stringify(hoverState));
await page.screenshot({ path: "/tmp/probe-r50/s1-popover-hover.png" });
await page.keyboard.press("Escape");

// ---------------------------------------------------------------------------
// T — the category popover's full option list
// ---------------------------------------------------------------------------
line("T: the category popover's options");
await page.getByRole("combobox").nth(0).click();
await page.waitForTimeout(700);
const catOpts = await page.evaluate(() =>
  [...document.querySelectorAll("[role='listbox'] [role='option']")].map((o) => o.textContent.trim()),
);
report("category options", JSON.stringify(catOpts));

await browser.close();
console.log("\nPROBE r50c COMPLETE");
