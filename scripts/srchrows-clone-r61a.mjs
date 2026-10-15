// Round-61 probe A: the CLONE's search typeahead popover ROW interaction
// states — the sweep's nineteenth installment (the thrice-deferred standing
// next from r58/r59/r60; the superset's own deep states — the reference has
// NO popover, so this is a clone-internal consistency + a11y-quality audit).
//
// Captures at 1024x768 against the production standalone on :3000:
//   1. the popover container's geometry + computed set
//   2. each row's FULL class string (L81) + computed anatomy
//      (h/padding/gap, the 40px image, name/category/price typography)
//   3. the row's HOVER state (computed bg + color deltas)
//   4. the KEYBOARD path — REAL Tab presses (L77: script .focus() never
//      trips :focus-visible for non-text targets) — where focus lands, the
//      outline the global * { outline-ring/50 } rule paints
//   5. the ARIA census (input attrs, container role, row roles)
//   6. the ARROW-KEY behavior as shipped (ArrowDown/ArrowUp/Enter)
//
// Run: bash scripts/battery-runner.sh srchrows-clone-r61a.mjs prod
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const OUT = "/tmp/audit-r61";
const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r("TIMEOUT:" + what), ms))]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await withTimeout(page.goto(CLONE + "/", { waitUntil: "domcontentloaded", timeout: 30000 }), 35000, "home");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(800);

// --- open the search panel (the header's search icon button) ---
const searchBtn = page.locator("header button[aria-label='Search']");
if ((await searchBtn.count()) === 0) {
  // fallback: enumerate the header buttons to find the search toggle
  const n = await page.locator("header button").count();
  console.log("NOTE: no aria-label=Search button; header button count:", n);
}
await withTimeout(searchBtn.click(), 8000, "search-click");
await page.waitForTimeout(500);

// --- type a multi-match query ("an" → 5 seeded products: headphones,
// sunglasses, tee, planter, blanket) ---
const input = page.locator("input[aria-label='Search products']");
await withTimeout(input.fill("an"), 8000, "fill");
await page.waitForTimeout(900); // 250ms debounce + fetch + paint

// --- 1+2: the popover container + each row at rest ---
const rest = await page.evaluate(() => {
  const comp = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      cls: (el.className || "").toString(),
      c: {
        display: cs.display, gap: cs.gap, padding: cs.padding,
        bg: cs.backgroundColor, color: cs.color, border: cs.border,
        radius: cs.borderRadius, boxShadow: cs.boxShadow.slice(0, 120),
        zIndex: cs.zIndex, overflow: cs.overflow, font: cs.fontSize + "/" + cs.fontWeight,
      },
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      attrs: el.getAttributeNames().filter((a) => a.startsWith("aria") || a === "role" || a === "id"),
      attrsMap: Object.fromEntries(
        el.getAttributeNames().filter((a) => a.startsWith("aria") || a === "role" || a === "id")
          .map((a) => [a, el.getAttribute(a)])),
    };
  };
  // the popover: the absolute container below the form
  const form = document.querySelector("form[role='search']");
  const container = form?.parentElement?.querySelector("div.absolute");
  const rows = container ? Array.from(container.querySelectorAll("button")) : [];
  const input = form?.querySelector("input");
  return {
    container: comp(container),
    rowCount: rows.length,
    rows: rows.map((row) => {
      const img = row.querySelector("img");
      const name = row.querySelector("span span:nth-child(1)");
      const cat = row.querySelector("span span:nth-child(2)");
      const price = row.querySelector("span:last-child");
      const d = comp(row);
      return {
        ...d,
        img: img
          ? { cls: img.className, rect: (() => { const rr = img.getBoundingClientRect(); return { w: Math.round(rr.width), h: Math.round(rr.height) }; })(),
              radius: getComputedStyle(img).borderRadius, objectFit: getComputedStyle(img).objectFit }
          : null,
        name: name ? { text: name.textContent, font: getComputedStyle(name).fontSize + "/" + getComputedStyle(name).fontWeight, truncate: getComputedStyle(name).textOverflow } : null,
        cat: cat ? { text: cat.textContent, font: getComputedStyle(cat).fontSize + "/" + getComputedStyle(cat).fontWeight, color: getComputedStyle(cat).color } : null,
        price: price ? { text: price.textContent, font: getComputedStyle(price).fontSize + "/" + getComputedStyle(price).fontWeight } : null,
      };
    }),
    inputAttrs: input
      ? Object.fromEntries(input.getAttributeNames().map((a) => [a, input.getAttribute(a)]))
      : null,
    activeElement: document.activeElement?.tagName + ":" + (document.activeElement?.getAttribute("aria-label") ?? ""),
  };
});
console.log("=== RESTING POPOVER ===");
console.log(JSON.stringify(rest, null, 1).slice(0, 4000));

// --- 3: the HOVER state on row 2 (computed deltas) ---
await page.locator("div.absolute button").nth(1).hover();
await page.waitForTimeout(300);
const hovered = await page.evaluate(() => {
  const container = document.querySelector("form[role='search']")?.parentElement?.querySelector("div.absolute");
  const rows = container ? Array.from(container.querySelectorAll("button")) : [];
  const row = rows[1];
  if (!row) return null;
  const cs = getComputedStyle(row);
  const name = row.querySelector("span span:nth-child(1)");
  const price = row.querySelector("span:last-child");
  const matches = row.matches(":hover");
  return {
    matchesHover: matches,
    bg: cs.backgroundColor, color: cs.color, boxShadow: cs.boxShadow.slice(0, 120),
    nameColor: name ? getComputedStyle(name).color : null,
    priceColor: price ? getComputedStyle(price).color : null,
    cursor: cs.cursor,
  };
});
console.log("=== HOVERED ROW 2 ===");
console.log(JSON.stringify(hovered, null, 1));

// --- 4: the KEYBOARD path — real Tab presses from the input ---
// The input has focus after fill? refocus it, then Tab and see where focus lands.
await input.click();
await page.waitForTimeout(200);
const keyWalk = [];
for (let i = 0; i < 6; i++) {
  await page.keyboard.press("Tab");
  await page.waitForTimeout(120);
  const st = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return { tag: null };
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName,
      label: el.getAttribute("aria-label") ?? el.textContent?.slice(0, 24),
      matchesFV: el.matches(":focus-visible"),
      outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    };
  });
  keyWalk.push(st);
}
console.log("=== TAB WALK (6 steps from the input) ===");
console.log(JSON.stringify(keyWalk, null, 1).slice(0, 2500));

// --- 5: the ARROW-KEY behavior as shipped ---
await input.click();
await page.keyboard.press("ArrowDown");
await page.waitForTimeout(250);
const arrows = await page.evaluate(() => {
  const container = document.querySelector("form[role='search']")?.parentElement?.querySelector("div.absolute");
  const rows = container ? Array.from(container.querySelectorAll("button")) : [];
  return {
    activeElement: document.activeElement?.tagName + ":" + (document.activeElement?.textContent?.slice(0, 20) ?? ""),
    rowsWithAriaSelected: rows.filter((r) => r.getAttribute("aria-selected") !== null).length,
    rowCount: rows.length,
  };
});
console.log("=== ARROW-DOWN (as shipped) ===");
console.log(JSON.stringify(arrows, null, 1));

// --- 6: Escape closes (the standing behavior, re-verified in this context) ---
await page.keyboard.press("Escape");
await page.waitForTimeout(700);
const escState = await page.evaluate(() => {
  const container = document.querySelector("form[role='search']")?.parentElement?.querySelector("div.absolute");
  return { popoverStillInDom: !!container, inputStillInDom: !!document.querySelector("form[role='search'] input") };
});
console.log("=== ESCAPE ===");
console.log(JSON.stringify(escState, null, 1));

await browser.close();
console.log("PROBE DONE");
