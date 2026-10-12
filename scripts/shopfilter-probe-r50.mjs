// Round-50 calibration probe: the reference's SHOP-FILTER interaction
// states, measured live (the pin family's parity ground truth). The prior
// rounds pinned the sort dropdown's OPTION LABELS (catalog-parity: 5 options
// in order) and the resting trigger geometry (storefront-parity:376) — but
// the OPEN-state anatomy, the keyboard states, the price-bucket SEMANTICS,
// the category semantics, and the filter bar's own search input were never
// measured on the reference:
//
//   A  resting anatomy   the four controls' classes/aria/widths
//   B  category select   open anatomy · options · selection -> URL + set
//   C  price select      open anatomy · options · EACH bucket's product set
//   D  sort select       open anatomy · active check · keyboard states
//   E  bar search input  Enter submit -> URL + heading · the X clear
//   F  Clear button      visibility contract · behavior
//   G  combined filters  URL param ORDER (category/search/price/sort?)
//
// Read-only against the reference (filters are URL state — no cart writes).
// Run: node scripts/shopfilter-probe-r50.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/probe-r50";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const report = (k, v) => console.log(`  ${k.padEnd(46)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

// login (the reference storefront is login-gated — the S46 lesson)
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

// helper: the visible product-card slugs on the current page (href order)
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

// helper: the active-filter chip texts (if any)
const chipTexts = () =>
  page.evaluate(() => {
    const row = document.querySelector("main .flex.flex-wrap.gap-2");
    return row ? [...row.querySelectorAll("a, span")].map((e) => e.textContent.trim()) : [];
  });

// ---------------------------------------------------------------------------
// A — the resting filter-bar anatomy
// ---------------------------------------------------------------------------
line("A1: the filter bar's resting anatomy");
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT + "/a1-bar-resting.png", fullPage: false });

const bar = await page.evaluate(() => {
  const barEl = [...document.querySelectorAll("main div")].find(
    (d) => d.className.includes("bg-card") && d.querySelector("input, button[role='combobox']"),
  );
  if (!barEl) return { found: false };
  const inputs = [...barEl.querySelectorAll("input")];
  const combos = [...barEl.querySelectorAll("button[role='combobox']")];
  const cs = getComputedStyle(barEl);
  const dumpCombo = (b) => ({
    ariaLabel: b.getAttribute("aria-label"),
    classes: b.className,
    text: b.textContent.trim(),
    width: getComputedStyle(b).width,
    expanded: b.getAttribute("aria-expanded"),
  });
  return {
    found: true,
    barClasses: barEl.className,
    barRadius: cs.borderRadius,
    barPad: cs.padding,
    searchInput: inputs.map((i) => ({
      ariaLabel: i.getAttribute("aria-label"),
      placeholder: i.getAttribute("placeholder"),
      classes: i.className,
      value: i.value,
    })),
    combos: combos.map(dumpCombo),
    clearBtn:
      [...barEl.querySelectorAll("button")]
        .filter((b) => b.getAttribute("role") !== "combobox")
        .map((b) => ({ text: b.textContent.trim(), classes: b.className })) || [],
  };
});
console.log(JSON.stringify(bar, null, 1).slice(0, 2400));

// ---------------------------------------------------------------------------
// B — the category select: open anatomy + options + selection
// ---------------------------------------------------------------------------
line("B1: the category select OPEN state");
// NOTE (r50 finding): the reference's triggers carry NO aria-labels — the
// clone's aria-labels are the accessibility superset. Locate by INDEX:
// nth(0) category · nth(1) price · nth(2) sort.
const combos = page.getByRole("combobox");
await combos.nth(0).click();
await page.waitForTimeout(600);
await page.screenshot({ path: OUT + "/b1-category-open.png" });
const catOpen = await page.evaluate(() => {
  const pop = document.querySelector("[role='listbox']");
  if (!pop) return { found: false };
  const cs = getComputedStyle(pop);
  return {
    found: true,
    classes: pop.className,
    radius: cs.borderRadius,
    bg: cs.backgroundColor,
    shadow: cs.boxShadow.slice(0, 80),
    padding: cs.padding,
    options: [...pop.querySelectorAll("[role='option']")].map((o) => ({
      text: o.textContent.trim(),
      selected: o.getAttribute("aria-selected"),
      state: o.getAttribute("data-state"),
      classes: o.className,
    })),
  };
});
console.log(JSON.stringify(catOpen, null, 1).slice(0, 2200));

line("B2: category selection -> URL + product set");
await page.getByRole("option", { name: "Electronics" }).click();
await page.waitForURL(/category=|shop/, { timeout: 15000 });
await page.waitForTimeout(1200);
report("url", page.url());
report("slugs", JSON.stringify(await cardSlugs()));
report("heading", await page.locator("main h1, main h2").first().textContent().catch(() => "?"));
report("chips", JSON.stringify(await chipTexts()));
await page.screenshot({ path: OUT + "/b2-category-selected.png", fullPage: false });

line("B3: the category trigger's label after selection");
await page.waitForTimeout(400);
const catAfter = await page.evaluate(() => {
  const b = document.querySelectorAll("button[role='combobox']")[0];
  return { text: b ? b.textContent.trim() : null, expanded: b ? b.getAttribute("aria-expanded") : null };
});
console.log(JSON.stringify(catAfter));

// ---------------------------------------------------------------------------
// C — the price select: options + EACH bucket's product set (the semantics)
// ---------------------------------------------------------------------------
line("C1: the price select OPEN state");
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
const priceTrigger = page.getByRole("combobox").nth(1);
await priceTrigger.click();
await page.waitForTimeout(600);
await page.screenshot({ path: OUT + "/c1-price-open.png" });
const priceOpen = await page.evaluate(() => {
  const pop = document.querySelector("[role='listbox']");
  if (!pop) return { found: false };
  return {
    found: true,
    options: [...pop.querySelectorAll("[role='option']")].map((o) => ({
      text: o.textContent.trim(),
      selected: o.getAttribute("aria-selected"),
    })),
  };
});
console.log(JSON.stringify(priceOpen, null, 1));

await page.keyboard.press("Escape");

line("C2: EACH price bucket's product set (the semantics)");
// Deep-link each bucket directly (the reference's URL shape) and read the set.
for (const bucket of ["under-50", "50-100", "100-200", "over-200"]) {
  await page.goto(`${REF}/shop?price=${bucket}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1100);
  const slugs = await cardSlugs();
  const count = await page
    .locator("main")
    .getByText(/products? found/)
    .first()
    .textContent()
    .catch(() => "?");
  report(`price=${bucket}`, `${slugs.length} slugs · ${String(count).trim()} · ${JSON.stringify(slugs)}`);
}

// ---------------------------------------------------------------------------
// D — the sort select: open anatomy + active check + keyboard states
// ---------------------------------------------------------------------------
line("D1: the sort select OPEN anatomy + the active item's check");
await page.goto(REF + "/shop?sort=rating", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
const sortTrigger = page.getByRole("combobox").nth(2);
await sortTrigger.click();
await page.waitForTimeout(600);
await page.screenshot({ path: OUT + "/d1-sort-open.png" });
const sortOpen = await page.evaluate(() => {
  const pop = document.querySelector("[role='listbox']");
  if (!pop) return { found: false };
  const cs = getComputedStyle(pop);
  const items = [...pop.querySelectorAll("[role='option']")];
  return {
    found: true,
    classes: pop.className,
    radius: cs.borderRadius,
    shadow: cs.boxShadow.slice(0, 90),
    items: items.map((o) => {
      const svg = o.querySelector("svg");
      return {
        text: o.textContent.trim(),
        selected: o.getAttribute("aria-selected"),
        hasCheckSvg: !!svg,
        svgVisible: svg ? getComputedStyle(svg).display !== "none" && getComputedStyle(svg).opacity !== "0" : false,
        classes: o.className,
      };
    }),
  };
});
console.log(JSON.stringify(sortOpen, null, 1).slice(0, 3000));

line("D2: keyboard — ArrowDown moves the highlight, Enter commits, Escape closes");
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
await sortTrigger.click();
await page.waitForTimeout(500);
// Radix Select: the ACTIVE item is highlighted on open; ArrowDown moves.
const kb1 = await page.evaluate(() => {
  const items = [...document.querySelectorAll("[role='listbox'] [role='option']")];
  return items.map((o) => ({ t: o.textContent.trim().slice(0, 14), hl: o.getAttribute("data-highlighted") }));
});
report("on-open highlight", JSON.stringify(kb1));
await page.keyboard.press("ArrowDown");
await page.waitForTimeout(250);
const kb2 = await page.evaluate(() => {
  const items = [...document.querySelectorAll("[role='listbox'] [role='option']")];
  return items.map((o) => ({ t: o.textContent.trim().slice(0, 14), hl: o.getAttribute("data-highlighted") }));
});
report("after ArrowDown", JSON.stringify(kb2));
await page.keyboard.press("Enter");
await page.waitForTimeout(1200);
report("url after Enter", page.url());
await page.screenshot({ path: OUT + "/d2-keyboard-commit.png", fullPage: false });

line("D3: Escape closes without committing");
await sortTrigger.click();
await page.waitForTimeout(500);
await page.keyboard.press("Escape");
await page.waitForTimeout(600);
const escClosed = await page.evaluate(() => !document.querySelector("[role='listbox']"));
report("listbox closed after Escape", escClosed);
report("url unchanged", page.url());

// ---------------------------------------------------------------------------
// E — the filter bar's own search input
// ---------------------------------------------------------------------------
line("E1: the bar search input — Enter submit");
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
const barSearch = page
  .locator("main input[placeholder='Search products...']")
  .first();
await barSearch.fill("serum");
await page.keyboard.press("Enter");
await page.waitForURL(/shop\?/, { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1200);
report("url", page.url());
report("heading", await page.locator("main h1, main h2").first().textContent().catch(() => "?"));
report("chips", JSON.stringify(await chipTexts()));
report("slugs", JSON.stringify(await cardSlugs()));

line("E2: the bar search — case-insensitivity");
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const barSearch2 = page
  .locator("main input[placeholder='Search products...']")
  .first();
await barSearch2.fill("SERUM");
await page.keyboard.press("Enter");
await page.waitForURL(/shop\?/, { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1200);
report("url (SERUM)", page.url());
report("slugs", JSON.stringify(await cardSlugs()));

// ---------------------------------------------------------------------------
// F — the Clear button: visibility + behavior
// ---------------------------------------------------------------------------
line("F1: the Clear button on a filtered page");
await page.goto(REF + "/shop?category=electronics&price=over-200&sort=newest", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.screenshot({ path: OUT + "/f1-filtered-bar.png", fullPage: false });
const clearInfo = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("main button")];
  const clear = btns.find((b) => b.textContent.trim().toLowerCase().includes("clear"));
  return {
    found: !!clear,
    text: clear ? clear.textContent.trim() : null,
    classes: clear ? clear.className : null,
    tag: clear ? clear.tagName : null,
    href: clear && clear.tagName === "A" ? clear.getAttribute("href") : null,
  };
});
console.log(JSON.stringify(clearInfo));
if (clearInfo.found) {
  await page
    .locator("main button, main a")
    .filter({ hasText: /^Clear$/ })
    .first()
    .click();
  await page.waitForTimeout(1400);
  report("url after Clear", page.url());
  report("heading", await page.locator("main h1, main h2").first().textContent().catch(() => "?"));
}

line("F2: the Clear button ABSENT on the unfiltered page");
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
const clearGone = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("main button")];
  return !btns.some((b) => b.textContent.trim().toLowerCase().includes("clear"));
});
report("Clear absent unfiltered", clearGone);

// ---------------------------------------------------------------------------
// G — combined filters: the URL param ORDER + composed set
// ---------------------------------------------------------------------------
line("G1: combined category+search+price+sort -> URL order");
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
// set category via the select
await page.getByRole("combobox").nth(0).click();
await page.waitForTimeout(500);
await page.getByRole("option", { name: "Home & Living" }).click();
await page.waitForTimeout(1400);
// set price via the select
await page.getByRole("combobox").nth(1).click();
await page.waitForTimeout(500);
await page.getByRole("option", { name: /\$50 - \$100/ }).click();
await page.waitForTimeout(1400);
// set sort via the select
await page.getByRole("combobox").nth(2).click();
await page.waitForTimeout(500);
await page.getByRole("option", { name: /Price: Low to High/ }).click();
await page.waitForTimeout(1400);
report("url (composed)", page.url());
report("slugs", JSON.stringify(await cardSlugs()));
report("chips", JSON.stringify(await chipTexts()));
await page.screenshot({ path: OUT + "/g1-composed.png", fullPage: false });

line("G2: the results-count line on a filtered page");
const countLine = await page.evaluate(() => {
  const main = document.querySelector("main");
  const txt = main ? main.textContent : "";
  const m = txt.match(/(\d+)\s+products?\s+found/i);
  return m ? m[0] : null;
});
report("count line", countLine);

await browser.close();
console.log("\nPROBE COMPLETE — captures in " + OUT);
