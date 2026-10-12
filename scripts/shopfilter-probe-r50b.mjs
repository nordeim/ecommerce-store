// Round-50 follow-up probe (r50b): settling the shop-filter questions the
// first pass raised. The first pass found: the reference's UI selections
// push NO URL params (client state); deep-linked ?price= is a NO-OP; the
// sort popover at ?sort=rating still checks "Featured"; the Clear button
// is a shadcn ghost Button (h-8 px-3 text-xs) vs the clone's custom one.
//
// This probe settles:
//   A  deep-link ?category=  -> heading/chips/trigger/Clear/count
//   B  deep-link ?search=    -> heading/chips/trigger/input value/Clear
//   C  deep-link ?price=     -> trigger label (select follows param?) + Clear?
//   D  deep-link ?sort=      -> trigger label + Clear?
//   E  UI price selection    -> THE SEMANTICS: does the grid filter? labels?
//   F  UI price each bucket  -> counts + sets (if E filters)
//   G  UI sort selection     -> order + trigger + URL
//   H  UI category selection -> the full chip-row hunt + count
//   I  the Clear button      -> computed geometry + icon size
//   J  Clear click           -> what resets?
//   K  header search submit  -> URL on the reference
//   L  bar search after submit -> the input's retained value
//   M  popover geometry      -> position/width/offset + item hover
//   N  category options      -> the full list (first pass truncated)
//
// Run: node scripts/shopfilter-probe-r50b.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/probe-r50";
mkdirSync(OUT, { recursive: true });

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

// dump the bar state: trigger labels, chips row (any pill hunt), Clear info
const barState = () =>
  page.evaluate(() => {
    const combos = [...document.querySelectorAll("button[role='combobox']")];
    const input = document.querySelector("main input[placeholder='Search products...']");
    // the chip hunt: any anchor/span pill row between the bar and the grid
    const pills = [...document.querySelectorAll("main a, main span")].filter((e) => {
      const cs = getComputedStyle(e);
      return (
        cs.borderRadius !== "0px" &&
        parseInt(cs.borderRadius) > 100 &&
        e.textContent.trim().length > 0 &&
        e.textContent.trim().length < 40
      );
    });
    const clear = [...document.querySelectorAll("main button")].find((b) =>
      /^clear/i.test(b.textContent.trim()),
    );
    const count = document.querySelector("main p");
    return {
      triggers: combos.map((b) => b.textContent.trim()),
      input: input ? input.value : null,
      pillTexts: pills.map((p) => p.textContent.trim()).slice(0, 6),
      clear: clear
        ? {
            text: clear.textContent.trim(),
            classes: clear.className,
            h: getComputedStyle(clear).height,
            fontSize: getComputedStyle(clear).fontSize,
            pad: getComputedStyle(clear).padding,
            radius: getComputedStyle(clear).borderRadius,
            svg: clear.querySelector("svg") ? getComputedStyle(clear.querySelector("svg")).width : null,
          }
        : null,
      firstP: count ? count.textContent.trim() : null,
    };
  });

// ---------------------------------------------------------------------------
// A–D — the deep-link paths
// ---------------------------------------------------------------------------
line("A: deep-link ?category=electronics");
await page.goto(REF + "/shop?category=electronics", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
report("url", page.url());
report("slugs", JSON.stringify(await cardSlugs()));
console.log(JSON.stringify(await barState(), null, 1));

line("B: deep-link ?search=serum");
await page.goto(REF + "/shop?search=serum", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
report("slugs", JSON.stringify(await cardSlugs()));
console.log(JSON.stringify(await barState(), null, 1));

line("C: deep-link ?price=under-50");
await page.goto(REF + "/shop?price=under-50", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
report("slugs(n)", (await cardSlugs()).length);
console.log(JSON.stringify(await barState(), null, 1));

line("D: deep-link ?sort=newest");
await page.goto(REF + "/shop?sort=newest", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
report("slugs[0..2]", JSON.stringify((await cardSlugs()).slice(0, 3)));
console.log(JSON.stringify(await barState(), null, 1));

// ---------------------------------------------------------------------------
// E–F — the UI price selection (THE semantics question)
// ---------------------------------------------------------------------------
line("E: UI price selection 'Under $50'");
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.getByRole("combobox").nth(1).click();
await page.waitForTimeout(600);
await page.screenshot({ path: OUT + "/e1-price-popover.png" });
await page.getByRole("option", { name: "Under $50" }).click();
await page.waitForTimeout(1600);
report("url", page.url());
report("slugs", JSON.stringify(await cardSlugs()));
await page.screenshot({ path: OUT + "/e2-price-under50-selected.png", fullPage: false });
console.log(JSON.stringify(await barState(), null, 1));

line("F: UI price selection — each bucket");
for (const label of ["$50 - $100", "$100 - $200", "Over $200"]) {
  await page.getByRole("combobox").nth(1).click();
  await page.waitForTimeout(600);
  await page.getByRole("option", { name: label, exact: true }).click();
  await page.waitForTimeout(1600);
  const slugs = await cardSlugs();
  report(`price "${label}"`, `${slugs.length} slugs · ${JSON.stringify(slugs)}`);
}

// ---------------------------------------------------------------------------
// G — the UI sort selection: order + trigger + URL
// ---------------------------------------------------------------------------
line("G: UI sort selection 'Price: Low to High'");
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.getByRole("combobox").nth(2).click();
await page.waitForTimeout(600);
await page.getByRole("option", { name: "Price: Low to High" }).click();
await page.waitForTimeout(1600);
report("url", page.url());
report("slugs", JSON.stringify(await cardSlugs()));
console.log(JSON.stringify(await barState(), null, 1));

// ---------------------------------------------------------------------------
// H — the UI category selection: chips hunt + count
// ---------------------------------------------------------------------------
line("H: UI category selection 'Electronics'");
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.getByRole("combobox").nth(0).click();
await page.waitForTimeout(600);
await page.getByRole("option", { name: "Electronics" }).click();
await page.waitForTimeout(1600);
report("url", page.url());
report("slugs", JSON.stringify(await cardSlugs()));
await page.screenshot({ path: OUT + "/h1-category-ui-selected.png", fullPage: false });
console.log(JSON.stringify(await barState(), null, 1));

// ---------------------------------------------------------------------------
// I–J — the Clear button: geometry + click behavior
// ---------------------------------------------------------------------------
line("I: the Clear button's computed geometry (after UI category)");
const clearGeom = await page.evaluate(() => {
  const clear = [...document.querySelectorAll("main button")].find((b) =>
    /^clear/i.test(b.textContent.trim()),
  );
  if (!clear) return { found: false };
  const cs = getComputedStyle(clear);
  const rect = clear.getBoundingClientRect();
  const svg = clear.querySelector("svg");
  return {
    found: true,
    text: clear.textContent.trim(),
    classes: clear.className,
    height: cs.height,
    width: cs.width,
    rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    padding: cs.padding,
    radius: cs.borderRadius,
    color: cs.color,
    svgSize: svg ? getComputedStyle(svg).width : null,
    svgClasses: svg ? svg.className.baseVal : null,
  };
});
console.log(JSON.stringify(clearGeom, null, 1));

line("J: Clear click — what resets?");
await page.evaluate(() => {
  const clear = [...document.querySelectorAll("main button")].find((b) =>
    /^clear/i.test(b.textContent.trim()),
  );
  if (clear) clear.click();
});
await page.waitForTimeout(1600);
report("url", page.url());
report("slugs(n)", (await cardSlugs()).length);
console.log(JSON.stringify(await barState(), null, 1));
await page.screenshot({ path: OUT + "/j1-after-clear.png", fullPage: false });

// ---------------------------------------------------------------------------
// K — the header search submit -> URL
// ---------------------------------------------------------------------------
line("K: the header search submit -> URL");
await page.goto(REF + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.locator("header button[aria-label='Search']").click();
await page.waitForTimeout(500);
const headerInput = page.locator("header input").first();
await headerInput.fill("watch");
await page.locator("header form").getByRole("button", { name: "Search" }).click();
await page.waitForTimeout(2000);
report("url after header submit", page.url());
report("slugs", JSON.stringify(await cardSlugs()));

// ---------------------------------------------------------------------------
// L — the bar search after submit: the input's retained value
// ---------------------------------------------------------------------------
line("L: bar search 'serum' — input retained?");
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.locator("main input[placeholder='Search products...']").fill("serum");
await page.keyboard.press("Enter");
await page.waitForTimeout(1600);
console.log(JSON.stringify(await barState(), null, 1));
report("slugs", JSON.stringify(await cardSlugs()));

// ---------------------------------------------------------------------------
// M — the popover geometry (position/width/offset) + item hover state
// ---------------------------------------------------------------------------
line("M: the sort popover geometry");
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.getByRole("combobox").nth(2).click();
await page.waitForTimeout(700);
const popGeom = await page.evaluate(() => {
  const pop = document.querySelector("[role='listbox']");
  const trig = document.querySelectorAll("button[role='combobox']")[2];
  if (!pop || !trig) return { found: false };
  const pr = pop.getBoundingClientRect();
  const tr = trig.getBoundingClientRect();
  // hover the second item to read the hover state
  const items = [...pop.querySelectorAll("[role='option']")];
  return {
    found: true,
    pop: { x: Math.round(pr.x), y: Math.round(pr.y), w: Math.round(pr.width), h: Math.round(pr.height) },
    trig: { x: Math.round(tr.x), y: Math.round(tr.y), w: Math.round(tr.width), h: Math.round(tr.height) },
    widthMatchesTrigger: Math.abs(pr.width - tr.width) < 2,
    gapY: Math.round(pr.y - (tr.y + tr.height)),
    itemClasses: items[1] ? items[1].className : null,
    viewportW: window.innerWidth,
  };
});
console.log(JSON.stringify(popGeom, null, 1));
// hover the second item and read its computed bg
const itemBox = await page.evaluate(() => {
  const items = [...document.querySelectorAll("[role='listbox'] [role='option']")];
  const r = items[1].getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await page.mouse.move(itemBox.x, itemBox.y);
await page.waitForTimeout(350);
const hoverState = await page.evaluate(() => {
  const items = [...document.querySelectorAll("[role='listbox'] [role='option']")];
  const cs = getComputedStyle(items[1]);
  return { bg: cs.backgroundColor, color: cs.color };
});
report("item hover", JSON.stringify(hoverState));
await page.keyboard.press("Escape");

// ---------------------------------------------------------------------------
// N — the category popover: the full option list
// ---------------------------------------------------------------------------
line("N: the category popover's full option list");
await page.getByRole("combobox").nth(0).click();
await page.waitForTimeout(600);
const catList = await page.evaluate(() =>
  [...document.querySelectorAll("[role='listbox'] [role='option']")].map((o) => o.textContent.trim()),
);
report("options", JSON.stringify(catList));

await browser.close();
console.log("\nPROBE r50b COMPLETE");
