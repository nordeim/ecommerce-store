// Round-50 clone-side probe (r50d): the clone's CURRENT state on the same
// paths the reference probes measured — the pre-fix divergence proof for
// the remediation plan's table. Runs against :3000 (the battery runner's
// production standalone). ZERO DB mutations (filters are URL state).
// Run: bash scripts/battery-runner.sh shopfilter-clone-r50d.mjs prod
import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const report = (k, v) => console.log(`  ${k.padEnd(46)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

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

const barState = () =>
  page.evaluate(() => {
    const combos = [...document.querySelectorAll("button[role='combobox']")];
    const input = document.querySelector("main input[placeholder='Search products...']");
    const clear = [...document.querySelectorAll("main button")].find((b) =>
      /^clear/i.test(b.textContent.trim()),
    );
    const count = document.querySelector("main p");
    return {
      triggers: combos.map((b) => b.textContent.trim()),
      input: input ? input.value : null,
      clear: clear
        ? {
            classes: clear.className,
            h: getComputedStyle(clear).height,
            fontSize: getComputedStyle(clear).fontSize,
            radius: getComputedStyle(clear).borderRadius,
            color: getComputedStyle(clear).color,
            svg: clear.querySelector("svg")
              ? {
                  classes: clear.querySelector("svg").className.baseVal,
                  size: getComputedStyle(clear.querySelector("svg")).width,
                }
              : null,
          }
        : null,
      firstP: count ? count.textContent.trim() : null,
    };
  });

line("A: ?category=electronics (the Clear divergence proof)");
await page.goto(BASE + "/shop?category=electronics", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
report("slugs", JSON.stringify(await cardSlugs()));
console.log(JSON.stringify(await barState(), null, 1));
await page.screenshot({ path: "/tmp/probe-r50/d1-clone-clear-prefix.png", fullPage: false });

line("B: the sort popover geometry + hover");
await page.goto(BASE + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.getByRole("combobox").nth(2).click();
await page.waitForTimeout(700);
const popGeom = await page.evaluate(() => {
  const pop = document.querySelector("[role='listbox']");
  const trig = document.querySelectorAll("button[role='combobox']")[2];
  if (!pop || !trig) return { found: false };
  const pr = pop.getBoundingClientRect();
  const tr = trig.getBoundingClientRect();
  const cs = getComputedStyle(pop);
  return {
    found: true,
    pop: { x: Math.round(pr.x), y: Math.round(pr.y), w: Math.round(pr.width), h: Math.round(pr.height) },
    trig: { x: Math.round(tr.x), w: Math.round(tr.width) },
    gapY: Math.round(pr.y - (tr.y + tr.height)),
    radius: cs.borderRadius,
    classes: pop.className.slice(0, 120),
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
report("item hover", JSON.stringify(hoverState));
await page.keyboard.press("Escape");

line("C: the price buckets (deep-linked — the superset path)");
for (const bucket of ["under-50", "50-100", "100-200", "over-200"]) {
  await page.goto(`${BASE}/shop?price=${bucket}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  report(`price=${bucket}`, JSON.stringify(await cardSlugs()));
}

line("D: trigger labels on deep links (the coherence superset)");
await page.goto(BASE + "/shop?sort=rating", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
report("?sort=rating triggers", JSON.stringify((await barState()).triggers));
await page.goto(BASE + "/shop?price=over-200", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
report("?price=over-200 triggers", JSON.stringify((await barState()).triggers));

line("E: the bar search push + case-insensitivity");
await page.goto(BASE + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.locator("main input[placeholder='Search products...']").fill("SERUM");
await page.keyboard.press("Enter");
await page.waitForTimeout(1400);
report("url after SERUM Enter", page.url());
report("slugs", JSON.stringify(await cardSlugs()));

line("F: the chips (the superset after the reference drift)");
await page.goto(BASE + "/shop?category=electronics", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
const chips = await page.evaluate(() => {
  const row = document.querySelector("main .flex.flex-wrap.gap-2");
  return row ? [...row.querySelectorAll("a")].map((a) => ({ text: a.textContent.trim(), href: a.getAttribute("href") })) : [];
});
console.log(JSON.stringify(chips, null, 1));

line("G: the category + price popover options");
await page.goto(BASE + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.getByRole("combobox").nth(0).click();
await page.waitForTimeout(600);
const catOpts = await page.evaluate(() =>
  [...document.querySelectorAll("[role='listbox'] [role='option']")].map((o) => o.textContent.trim()),
);
report("category options", JSON.stringify(catOpts));
await page.keyboard.press("Escape");
await page.getByRole("combobox").nth(1).click();
await page.waitForTimeout(600);
const priceOpts = await page.evaluate(() =>
  [...document.querySelectorAll("[role='listbox'] [role='option']")].map((o) => o.textContent.trim()),
);
report("price options", JSON.stringify(priceOpts));

await browser.close();
console.log("\nCLONE PROBE r50d COMPLETE");
