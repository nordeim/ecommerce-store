// Round-54 CLONE calibration probe C: the clone's FOOTER family — the same
// reads as footer-probe-r54b.mjs against the local clone (the battery runner
// boots :3000). Confirms the bottom-row hover divergence (/40 -> FULL on the
// clone vs /40 -> /60 measured on the reference) + the full resting contract.
// Run via: bash scripts/battery-runner.sh footer-clone-r54c.mjs prod
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const report = (k, v) => console.log(`  ${k.padEnd(56)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

const page = await ctx.newPage();
await page.goto(CLONE + "/", { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(1500);

line("A. FOOTER ANATOMY");
const anatomy = await page.evaluate(() => {
  const footer = document.querySelector("footer");
  if (!footer) return { found: false };
  const cs = getComputedStyle(footer);
  const container = footer.querySelector(":scope > div");
  const ccs = container ? getComputedStyle(container) : null;
  const grid = footer.querySelector(".grid");
  const gcs = grid ? getComputedStyle(grid) : null;
  return {
    found: true,
    tag: footer.tagName, cls: footer.className,
    bg: cs.backgroundColor, color: cs.color, marginTop: cs.marginTop,
    containerCls: container ? container.className : null,
    containerMaxW: ccs ? ccs.maxWidth : null, containerPx: ccs ? ccs.paddingLeft : null, containerPy: ccs ? ccs.paddingTop : null,
    gridCls: grid ? grid.className : null,
    gridCols: gcs ? gcs.gridTemplateColumns : null, gridGap: gcs ? gcs.gap : null,
    gridChildCount: grid ? grid.children.length : 0,
    rect: { w: footer.offsetWidth, h: footer.offsetHeight, y: Math.round(footer.getBoundingClientRect().y) },
  };
});
for (const [k, v] of Object.entries(anatomy)) report(`anatomy.${k}`, JSON.stringify(v));

line("B. HEADINGS");
const headings = await page.evaluate(() => {
  const footer = document.querySelector("footer");
  if (!footer) return [];
  return [...footer.querySelectorAll("h3")].map((h) => {
    const cs = getComputedStyle(h);
    return { text: h.textContent.trim(), cls: h.className, fontSize: cs.fontSize, fontWeight: cs.fontWeight, textTransform: cs.textTransform, letterSpacing: cs.letterSpacing, marginBottom: cs.marginBottom, color: cs.color };
  });
});
headings.forEach((h, i) => report(`heading[${i}]`, JSON.stringify(h)));

line("C. SHOP LINKS");
const links = await page.evaluate(() => {
  const footer = document.querySelector("footer");
  if (!footer) return { found: false };
  const anchors = [...footer.querySelectorAll("a")].filter((a) => /shop/i.test(a.getAttribute("href") || ""));
  if (!anchors.length) return { found: false };
  const ul = anchors[0].closest("ul");
  const ulcs = ul ? getComputedStyle(ul) : null;
  const first = anchors[0];
  const cs = getComputedStyle(first);
  return {
    found: true, count: anchors.length,
    cls: first.className,
    hrefs: anchors.map((a) => a.getAttribute("href")),
    fontSize: cs.fontSize, color: cs.color, textDecoration: cs.textDecorationLine,
    ulCls: ul ? ul.className : null, rowGap: ulcs ? ulcs.rowGap : null, display: ulcs ? ulcs.display : null,
    liCls: anchors[0].closest("li").className,
  };
});
for (const [k, v] of Object.entries(links)) report(`links.${k}`, JSON.stringify(v));

line("D. HOVER — REAL mouse on the first Shop link");
const hoverA = await page.evaluate(() => {
  const footer = document.querySelector("footer");
  const a = footer && [...footer.querySelectorAll("a")].find((x) => x.textContent.trim() === "All Products");
  if (!a) return null;
  const cs = getComputedStyle(a);
  return { restingColor: cs.color, transition: cs.transition, transitionDuration: cs.transitionDuration, transitionProperty: cs.transitionProperty, cursor: cs.cursor };
});
report("shopLink.resting", JSON.stringify(hoverA));
const firstShop = page.locator("footer a", { hasText: "All Products" }).first();
await firstShop.scrollIntoViewIfNeeded();
await firstShop.hover();
await page.waitForTimeout(400);
const hoverRead = await page.evaluate(() => {
  const footer = document.querySelector("footer");
  const a = footer && [...footer.querySelectorAll("a")].find((x) => x.textContent.trim() === "All Products");
  if (!a) return null;
  const cs = getComputedStyle(a);
  return { hoveredColor: cs.color, transform: cs.transform };
});
report("shopLink.hovered(real mouse, 400ms)", JSON.stringify(hoverRead));
await page.mouse.move(10, 700);
await page.waitForTimeout(300);

line("E. COMPANY SPANS");
const company = await page.evaluate(() => {
  const footer = document.querySelector("footer");
  if (!footer) return { found: false };
  const spans = [...footer.querySelectorAll("span")].filter((s) => s.children.length === 0 && s.textContent.trim().length > 3 && getComputedStyle(s).cursor === "pointer");
  const read = (s) => { const cs = getComputedStyle(s); return { text: s.textContent.trim().slice(0, 24), cls: s.className, fontSize: cs.fontSize, color: cs.color, cursor: cs.cursor, transition: cs.transitionDuration + " " + cs.transitionProperty }; };
  return { found: true, count: spans.length, sample: spans.slice(0, 9).map(read) };
});
report("companySpans.count", company.count);
company.sample.forEach((s, i) => report(`companySpans[${i}]`, JSON.stringify(s)));

line("F. COMPANY SPAN HOVER — REAL mouse");
const careers = page.locator("footer span", { hasText: "Careers" }).first();
if (await careers.count()) {
  await careers.scrollIntoViewIfNeeded();
  const before = await careers.evaluate((el) => getComputedStyle(el).color);
  await careers.hover();
  await page.waitForTimeout(400);
  const after = await careers.evaluate((el) => getComputedStyle(el).color);
  report("companySpan.careers", `resting=${before} hovered=${after}`);
  await page.mouse.move(10, 700);
  await page.waitForTimeout(300);
}

line("G. BOTTOM ROW — the /40 layer + policy hovers (THE DIVERGENCE CHECK)");
const bottom = await page.evaluate(() => {
  const footer = document.querySelector("footer");
  if (!footer) return { found: false };
  const rows = [...footer.querySelectorAll("div")].filter((d) => getComputedStyle(d).display.includes("flex") && d.textContent.includes("©"));
  const row = rows[rows.length - 1];
  if (!row) return { found: false };
  const rcs = getComputedStyle(row);
  const copyright = [...row.querySelectorAll("p, span")].find((el) => el.textContent.includes("©"));
  const policies = [...row.querySelectorAll("span")].filter((s) => s.children.length === 0);
  const pcs = policies[0] ? getComputedStyle(policies[0]) : null;
  return {
    found: true, rowCls: row.className,
    flexDirection: rcs.flexDirection, justifyContent: rcs.justifyContent, alignItems: rcs.alignItems, gap: rcs.gap,
    copyrightCls: copyright ? copyright.className : null, copyrightColor: copyright ? getComputedStyle(copyright).color : null, copyrightSize: copyright ? getComputedStyle(copyright).fontSize : null,
    policyCls: policies[0] ? policies[0].className : null, policyCount: policies.length,
    policyColor: pcs ? pcs.color : null, policySize: pcs ? pcs.fontSize : null, policyCursor: pcs ? pcs.cursor : null,
    policyTransition: pcs ? pcs.transitionDuration + " " + pcs.transitionProperty : null,
    policyGap: policies.length > 1 ? getComputedStyle(policies[0].parentElement).gap : null,
    policyTexts: policies.map((p) => p.textContent.trim()),
  };
});
for (const [k, v] of Object.entries(bottom)) report(`bottom.${k}`, JSON.stringify(v));

const privacy = page.locator("footer span", { hasText: "Privacy Policy" }).first();
if (await privacy.count()) {
  await privacy.scrollIntoViewIfNeeded();
  const b = await privacy.evaluate((el) => getComputedStyle(el).color);
  await privacy.hover();
  await page.waitForTimeout(400);
  const a = await privacy.evaluate((el) => getComputedStyle(el).color);
  report("policySpan.privacy", `resting=${b} hovered=${a}`);
  await page.mouse.move(10, 700);
}

line("H. CONTACT BLOCK");
const contact = await page.evaluate(() => {
  const footer = document.querySelector("footer");
  if (!footer) return { found: false };
  const emailRow = [...footer.querySelectorAll("div")].find((d) => /hello@luxestore\.com/.test(d.textContent) && d.textContent.length < 60 && d.querySelector("svg"));
  if (!emailRow) return { found: false };
  const cs = getComputedStyle(emailRow);
  const svg = emailRow.querySelector("svg");
  return {
    found: true, rowCls: emailRow.className,
    display: cs.display, alignItems: cs.alignItems, gap: cs.gap,
    text: emailRow.textContent.trim(), fontSize: cs.fontSize, color: cs.color,
    svgW: svg ? svg.getBoundingClientRect().width : null, svgH: svg ? svg.getBoundingClientRect().height : null,
    svgStroke: svg ? getComputedStyle(svg).color : null,
  };
});
for (const [k, v] of Object.entries(contact)) report(`contact.${k}`, JSON.stringify(v));

line("I. BLURB + HAIRLINE");
const misc = await page.evaluate(() => {
  const footer = document.querySelector("footer");
  if (!footer) return { found: false };
  const blurb = [...footer.querySelectorAll("p")].find((p) => /curated collection/i.test(p.textContent));
  const bcs = blurb ? getComputedStyle(blurb) : null;
  const hair = [...footer.querySelectorAll("div")].find((d) => parseFloat(getComputedStyle(d).height) <= 1.5 && d.offsetWidth > 500);
  const hcs = hair ? getComputedStyle(hair) : null;
  return {
    found: true,
    blurbCls: blurb ? blurb.className : null, blurbSize: bcs ? bcs.fontSize : null, blurbColor: bcs ? bcs.color : null, blurbLineHeight: bcs ? bcs.lineHeight : null, blurbMarginBottom: bcs ? bcs.marginBottom : null,
    hairCls: hair ? hair.className : null, hairH: hcs ? hcs.height : null, hairBg: hcs ? hcs.backgroundColor : null, hairMarginY: hcs ? hcs.marginTop + " / " + hcs.marginBottom : null,
  };
});
for (const [k, v] of Object.entries(misc)) report(`misc.${k}`, JSON.stringify(v));

line("J. ANNOUNCEMENT BAR — the resting values (the r54a closure, clone side)");
const ann = await page.evaluate(() => {
  const header = document.querySelector("header");
  const bar = header ? header.firstElementChild : null;
  if (!bar) return { found: false };
  const cs = getComputedStyle(bar);
  return {
    found: true, cls: bar.className,
    text: (bar.textContent || "").replace(/\s+/g, " ").trim(),
    bg: cs.backgroundColor, color: cs.color, fontSize: cs.fontSize, fontWeight: cs.fontWeight,
    letterSpacing: cs.letterSpacing, paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom,
    height: bar.offsetHeight, textAlign: cs.textAlign, childCount: bar.children.length,
  };
});
for (const [k, v] of Object.entries(ann)) report(`ann.${k}`, JSON.stringify(v));

line("K. RESPONSIVE — 390px mobile read");
const page2 = await ctx.newPage();
await page2.setViewportSize({ width: 390, height: 844 });
await page2.goto(CLONE + "/", { waitUntil: "networkidle" });
await page2.waitForTimeout(1200);
const mobile = await page2.evaluate(() => {
  const footer = document.querySelector("footer");
  if (!footer) return { found: false };
  const grid = footer.querySelector(".grid");
  const gcs = grid ? getComputedStyle(grid) : null;
  const row = [...footer.querySelectorAll("div")].filter((d) => getComputedStyle(d).display.includes("flex") && d.textContent.includes("©")).pop();
  const rcs = row ? getComputedStyle(row) : null;
  return { found: true, gridCols: gcs ? gcs.gridTemplateColumns : null, gridGap: gcs ? gcs.gap : null, bottomDir: rcs ? rcs.flexDirection : null, bottomGap: rcs ? rcs.gap : null };
});
for (const [k, v] of Object.entries(mobile)) report(`mobile.${k}`, JSON.stringify(v));
await page2.close();

await browser.close();
console.log("\n[r54c CLONE footer probe complete]");
