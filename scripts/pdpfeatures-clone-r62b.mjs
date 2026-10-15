// Round-62 CLONE probe B: the clone's PDP description-tab KEY-FEATURES LIST
// — the sweep's twentieth installment. Same axes as the reference probe
// (pdpfeatures-ref-r62a.mjs) for the paired diff:
//   A. locate the features block + the tab state
//   B-D. h3 / ul / li rows full anatomy (class strings + computed)
//   E. the a11y census
//   F. the interactivity census
//   G. the @375 mobile pass
// Run: bash scripts/battery-runner.sh pdpfeatures-clone-r62b.mjs prod
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const report = (k, v) => console.log(`  ${k.padEnd(56)} ${typeof v === "string" ? v : JSON.stringify(v)}`);
const line = (t) => console.log(`\n=== ${t} ===`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(CLONE + "/product/wireless-headphones", { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(1500);

line("A. LOCATE THE FEATURES BLOCK + THE TAB STATE");
const locate = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll("h3,div,p,span")].find(
    (el) => /^key features$/i.test((el.textContent || "").trim()) && el.children.length === 0
  );
  if (!h3) return { found: false };
  let list = h3.nextElementSibling;
  for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
  const tabs = [...document.querySelectorAll("[role='tab'],button")].filter((b) =>
    /^description$/i.test((b.textContent || "").trim())
  );
  const read = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName,
      cls: (el.className || "").toString(),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      display: cs.display, color: cs.color, fontSize: cs.fontSize, fontWeight: cs.fontWeight,
      lineHeight: cs.lineHeight, marginTop: cs.marginTop, marginBottom: cs.marginBottom,
    };
  };
  return {
    found: true,
    h3: read(h3),
    h3ParentTag: h3.parentElement ? h3.parentElement.tagName : null,
    h3ParentCls: h3.parentElement ? (h3.parentElement.className || "").toString() : null,
    list: list ? read(list) : null,
    listTag: list ? list.tagName : null,
    listChildCount: list ? list.children.length : 0,
    listChildTags: list ? [...list.children].map((c) => c.tagName) : [],
    descriptionTab: tabs.length ? { count: tabs.length, cls: (tabs[0].className || "").toString(), role: tabs[0].getAttribute("role"), ariaSelected: tabs[0].getAttribute("aria-selected") } : null,
  };
});
for (const [k, v] of Object.entries(locate)) report(`locate.${k}`, JSON.stringify(v));

if (locate.found) {

line("B+C+D. THE FULL ANATOMY — h3, list, rows (class strings + computed)");
const anatomy = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll("h3,div,p,span")].find(
    (el) => /^key features$/i.test((el.textContent || "").trim()) && el.children.length === 0
  );
  let list = h3.nextElementSibling;
  for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
  const comp = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName, cls: (el.className || "").toString(),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      display: cs.display, flexDirection: cs.flexDirection, columnGap: cs.columnGap, rowGap: cs.rowGap,
      gap: cs.gap, padding: cs.padding, margin: cs.margin, bg: cs.backgroundColor, color: cs.color,
      fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontFamily: cs.fontFamily.split(",")[0],
      lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, alignItems: cs.alignItems,
      listStyle: cs.listStyleType, listStylePosition: cs.listStylePosition,
      textDecoration: cs.textDecorationLine, textTransform: cs.textTransform,
      overflow: cs.overflow, boxShadow: cs.boxShadow.slice(0, 100), borderRadius: cs.borderRadius,
      border: cs.borderTopWidth + " " + cs.borderTopStyle + " " + cs.borderTopColor,
    };
  };
  const rows = list ? [...list.children].map((li) => {
    const icon = li.querySelector("svg,img,i,span[class*='icon'],[data-lucide]");
    const textEl = [...li.childNodes].find((n) => n.nodeType === 3 && (n.textContent || "").trim()) ||
      [...li.children].find((c) => c.tagName !== "svg" && (c.textContent || "").trim());
    return {
      row: comp(li),
      text: (li.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60),
      icon: icon ? (() => {
        const cs = getComputedStyle(icon);
        const ir = icon.getBoundingClientRect();
        return {
          tag: icon.tagName, cls: (icon.getAttribute("class") || "").toString().slice(0, 120),
          w: Math.round(ir.width), h: Math.round(ir.height),
          color: cs.color, fill: cs.fill, strokeWidth: icon.tagName === "svg" ? icon.getAttribute("stroke-width") : null,
          ariaHidden: icon.getAttribute("aria-hidden"), role: icon.getAttribute("role"),
          display: cs.display, flexShrink: cs.flexShrink,
        };
      })() : null,
      textNodeShape: textEl ? (textEl.nodeType === 3 ? "TEXT_NODE" : textEl.tagName) : null,
    };
  }) : [];
  return { h3: comp(h3), list: comp(list), rows };
});
report("anatomy.h3", JSON.stringify(anatomy.h3));
report("anatomy.list", JSON.stringify(anatomy.list));
anatomy.rows.forEach((r, i) => {
  report(`row[${i}].text`, r.text);
  report(`row[${i}].row`, JSON.stringify(r.row));
  report(`row[${i}].icon`, r.icon ? JSON.stringify(r.icon) : "NONE");
  report(`row[${i}].textNodeShape`, r.textNodeShape);
});

line("E. THE A11Y CENSUS — list semantics, roles, aria attrs");
const a11y = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll("h3,div,p,span")].find(
    (el) => /^key features$/i.test((el.textContent || "").trim()) && el.children.length === 0
  );
  let list = h3.nextElementSibling;
  for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
  const census = (el) => ({
    tag: el.tagName, role: el.getAttribute("role"),
    ariaLabel: el.getAttribute("aria-label"), ariaHidden: el.getAttribute("aria-hidden"),
    ariaDescribedby: el.getAttribute("aria-describedby"),
    allAttrs: el.getAttributeNames().filter((a) => a.startsWith("aria") || a === "role"),
  });
  return {
    h3: census(h3),
    list: list ? census(list) : null,
    firstRow: list ? census(list.children[0]) : null,
    firstRowIcon: list && list.children[0].querySelector("svg") ? census(list.children[0].querySelector("svg")) : null,
    h3HeadingLevel: h3.tagName,
    // the tabpanel association (Radix vs the reference's plain div)
    panelOfList: (() => {
      let p = list; for (let i = 0; i < 6 && p; i++) { if (p.getAttribute && (p.getAttribute("role") === "tabpanel" || p.hasAttribute("data-state"))) break; p = p.parentElement; }
      return p ? { tag: p.tagName, role: p.getAttribute("role"), labelledby: p.getAttribute("aria-labelledby"), dataState: p.getAttribute("data-state") } : null;
    })(),
  };
});
for (const [k, v] of Object.entries(a11y)) report(`a11y.${k}`, JSON.stringify(v));

line("F. THE INTERACTIVITY CENSUS");
const hover = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll("h3,div,p,span")].find(
    (el) => /^key features$/i.test((el.textContent || "").trim()) && el.children.length === 0
  );
  let list = h3.nextElementSibling;
  for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
  const row = list.children[0];
  const before = getComputedStyle(row);
  return {
    rowCursor: before.cursor, rowPointerEvents: before.pointerEvents,
    rowTag: row.tagName, rowTabIndex: row.getAttribute("tabindex"),
    rowIsButton: row.tagName === "BUTTON" || !!row.closest("button"),
    listInteractiveDescendants: list.querySelectorAll("button,a,[role='button']").length,
  };
});
for (const [k, v] of Object.entries(hover)) report(`hover.${k}`, JSON.stringify(v));

} // end located branch

line("G. THE @375 MOBILE PASS");
const mpage = await ctx.newPage();
await mpage.setViewportSize({ width: 375, height: 700 });
await mpage.goto(CLONE + "/product/wireless-headphones", { waitUntil: "networkidle" });
await mpage.waitForTimeout(1200);
const mobile = await mpage.evaluate(() => {
  const h3 = [...document.querySelectorAll("h3,div,p,span")].find(
    (el) => /^key features$/i.test((el.textContent || "").trim()) && el.children.length === 0
  );
  if (!h3) return { found: false };
  let list = h3.nextElementSibling;
  for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
  const read = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), fontSize: cs.fontSize, gap: cs.gap };
  };
  return {
    found: true, h3: read(h3), list: read(list),
    firstRow: read(list.children[0]),
    icon: (() => { const s = list.children[0].querySelector("svg"); const r = s.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })(),
    rows: list.children.length,
  };
});
for (const [k, v] of Object.entries(mobile)) report(`mobile.${k}`, JSON.stringify(v));

await browser.close();
console.log("\nCLONE PROBE COMPLETE");
