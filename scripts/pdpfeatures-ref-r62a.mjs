// Round-62 REFERENCE probe A: the live reference's PDP description-tab
// KEY-FEATURES LIST — the sweep's twentieth installment (session-121/122's
// standing suggested next). The reference PDP renders the Description tab
// by default with a "Key Features" heading + an icon-bulleted list (the
// page.tsx comment's "only the Description tab's Key Features uses icons
// on the reference"). This probe captures the reference's ground truth:
//   A. locate the features block (h3 + list) + the tab state
//   B. the h3's full anatomy (class string + computed set)
//   C. the ul's anatomy (class string + computed set)
//   D. each li row's anatomy (class + computed + the svg icon census)
//   E. the a11y census (roles, aria attrs, list semantics)
//   F. the hover states (are the rows interactive at all?)
//   G. the @375 mobile pass (geometry under the mobile viewport)
// Run: node scripts/pdpfeatures-ref-r62a.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const report = (k, v) => console.log(`  ${k.padEnd(56)} ${typeof v === "string" ? v : JSON.stringify(v)}`);
const line = (t) => console.log(`\n=== ${t} ===`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

// login (the r52+ convention)
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
await page.goto(REF + "/product/wireless-headphones", { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(1500);

line("A. LOCATE THE FEATURES BLOCK + THE TAB STATE");
const locate = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll("h3,div,p,span")].find(
    (el) => /^key features$/i.test((el.textContent || "").trim()) && el.children.length === 0
  );
  if (!h3) return { found: false };
  // the list: the next sibling list-ish container (ul or div with multiple
  // text rows) after the h3
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
    list: list ? read(list) : null,
    listTag: list ? list.tagName : null,
    listChildCount: list ? list.children.length : 0,
    listChildTags: list ? [...list.children].map((c) => c.tagName) : [],
    descriptionTab: tabs.length ? { count: tabs.length, cls: (tabs[0].className || "").toString(), role: tabs[0].getAttribute("role"), ariaSelected: tabs[0].getAttribute("aria-selected") } : null,
  };
});
for (const [k, v] of Object.entries(locate)) report(`locate.${k}`, v);

if (!locate.found) {
  console.log("FEATURES BLOCK NOT FOUND — dumping tab-panel text for diagnosis");
  const dump = await page.evaluate(() => {
    const tabs = [...document.querySelectorAll("[role='tabpanel'],[data-state='active']")];
    return tabs.map((t) => (t.textContent || "").replace(/\s+/g, " ").trim().slice(0, 300));
  });
  console.log(JSON.stringify(dump, null, 2));
} else {

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
          tag: icon.tagName, cls: (icon.className || "").toString().slice(0, 120),
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
  };
});
for (const [k, v] of Object.entries(a11y)) report(`a11y.${k}`, v);

line("F. THE HOVER STATES — are the rows interactive?");
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
for (const [k, v] of Object.entries(hover)) report(`hover.${k}`, v);

} // end located branch

line("G. THE @375 MOBILE PASS");
const mpage = await ctx.newPage();
await mpage.setViewportSize({ width: 375, height: 700 });
await mpage.goto(REF + "/product/wireless-headphones", { waitUntil: "networkidle" });
await mpage.waitForTimeout(1500);
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
console.log("\nREF PROBE COMPLETE");
