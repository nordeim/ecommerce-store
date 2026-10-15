// Round-62 captures 321-325: the PDP description-tab key-features list —
// the resting features block (321, the full measured contract verified at
// capture), the anatomy crop of the h3 + list (322), the icon glyph at
// zoom (323 — the primary-color check), the @375 pass (324 — the mobile
// geometry), the tab-coupled state (325 — the Reviews swap hides the
// list, the r60 family's content-side closure).
// Probe-first, read-only pages; the server boots on :3001 (the caller's job).
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3001";
const OUT = "docs/screenshots";
const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r("TIMEOUT:" + what), ms))]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await withTimeout(page.goto(CLONE + "/login", { waitUntil: "domcontentloaded" }), 20000, "login-goto");
await withTimeout(page.getByLabel("Email").fill("john@example.com"), 12000, "email-fill");
await withTimeout(page.getByLabel("Password").fill("Demo1234!"), 12000, "pw-fill");
await withTimeout(page.getByRole("button", { name: "Log in", exact: true }).click(), 12000, "login-click");
try {
  await withTimeout(page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 }), 18000, "login-nav");
} catch {}
await withTimeout(page.goto(CLONE + "/product/wireless-headphones", { waitUntil: "networkidle" }), 25000, "pdp-goto");
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(1200);

// the shared surface walk (the probes' exact walk)
const surface = () => page.evaluate(() => {
  const h3 = [...document.querySelectorAll("h3")].find(
    (el) => /^key features$/i.test((el.textContent || "").trim()) && el.children.length === 0
  );
  if (!h3) return { found: false };
  let list = h3.nextElementSibling;
  for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
  let para = h3.previousElementSibling;
  for (let i = 0; i < 3 && para && para.tagName !== "P"; i++) para = para.previousElementSibling;
  return { found: true, h3, list, para };
});

// scroll the features block into view (in-page — elements never cross
// the serialization boundary)
const found = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll("h3")].find(
    (el) => /^key features$/i.test((el.textContent || "").trim()) && el.children.length === 0
  );
  if (!h3) return false;
  h3.scrollIntoView({ block: "center" });
  return true;
});
if (!found) { console.log("SURFACE NOT FOUND"); process.exit(1); }
await page.waitForTimeout(400);

// [321] the resting features block — the full contract at capture
const restFacts = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll("h3")].find(
    (el) => /^key features$/i.test((el.textContent || "").trim()) && el.children.length === 0
  );
  let list = h3.nextElementSibling;
  for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
  let para = h3.previousElementSibling;
  for (let i = 0; i < 3 && para && para.tagName !== "P"; i++) para = para.previousElementSibling;
  const hcs = getComputedStyle(h3), lcs = getComputedStyle(list), rcs = getComputedStyle(list.children[0]);
  const svg = list.children[0].querySelector("svg");
  const scs = svg ? getComputedStyle(svg) : null;
  const hr = h3.getBoundingClientRect(), lr = list.getBoundingClientRect();
  const panel = h3.parentElement ? h3.parentElement.closest('[role="tabpanel"]') : null;
  return {
    h3Text: h3.textContent, h3Cls: h3.getAttribute("class"),
    h3Font: hcs.fontSize + "/" + hcs.fontWeight, h3Color: hcs.color, h3Margins: hcs.marginTop + "/" + hcs.marginBottom,
    listCls: list.getAttribute("class"), listH: Math.round(lr.height), listW: Math.round(lr.width),
    listStyle: lcs.listStyleType, rowCount: list.children.length,
    rowCls: list.children[0].getAttribute("class"), rowH: Math.round(list.children[0].getBoundingClientRect().height),
    rowGap: rcs.columnGap, rowColor: rcs.color, rowFont: rcs.fontSize + "/" + rcs.fontWeight + "/" + rcs.lineHeight,
    iconCls: svg ? svg.getAttribute("class") : null, iconW: svg ? Math.round(svg.getBoundingClientRect().width) : null,
    iconColor: scs ? scs.color : null, iconAriaHidden: svg ? svg.getAttribute("aria-hidden") : null,
    h3ToListGap: Math.round(lr.y - (hr.y + hr.height)),
    parentCls: h3.parentElement.getAttribute("class"),
    panelRole: panel ? panel.getAttribute("role") : null, panelState: panel ? panel.getAttribute("data-state") : null,
  };
});
console.log("321 facts:", JSON.stringify(restFacts, null, 1));
await page.screenshot({ path: OUT + "/321-pdpfeatures-resting.png" });
console.log("321 saved");

// [322] the anatomy crop — the paragraph tail + the h3 + the full list
const cropFacts = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll("h3")].find(
    (el) => /^key features$/i.test((el.textContent || "").trim()) && el.children.length === 0
  );
  let list = h3.nextElementSibling;
  for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
  const h3r = h3.getBoundingClientRect();
  const lr = list.getBoundingClientRect();
  const w = Math.min(lr.width, 560);
  // headroom: include the paragraph's LAST LINE above the h3 (the
  // r62 VLM settle: 20px was only 4px of the paragraph — invisible)
  return { x: Math.round(lr.x), y: Math.round(h3r.y - 56), w: Math.round(w), h: Math.round(lr.height + h3r.height + 56) };
});
await page.screenshot({
  path: OUT + "/322-pdpfeatures-anatomy.png",
  clip: { x: cropFacts.x, y: cropFacts.y, width: cropFacts.w, height: cropFacts.h },
});
console.log("322 facts (clip):", JSON.stringify(cropFacts), "— saved");

// [323] the icon glyph at zoom — the first row's check + its primary color
const iconFacts = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll("h3")].find(
    (el) => /^key features$/i.test((el.textContent || "").trim()) && el.children.length === 0
  );
  let list = h3.nextElementSibling;
  for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
  const row = list.children[0];
  const svg = row.querySelector("svg");
  const rr = row.getBoundingClientRect();
  const ir = svg.getBoundingClientRect();
  const scs = getComputedStyle(svg);
  return {
    rowText: (row.textContent || "").trim(),
    iconCls: svg.getAttribute("class"),
    iconRect: [Math.round(ir.x), Math.round(ir.y), Math.round(ir.width), Math.round(ir.height)],
    iconColor: scs.color, iconFill: scs.fill, iconStrokeWidth: svg.getAttribute("stroke-width"),
    clip: { x: Math.round(rr.x), y: Math.round(rr.y), width: Math.min(Math.round(rr.width), 300), height: Math.round(rr.height) },
  };
});
console.log("323 facts:", JSON.stringify(iconFacts));
await page.screenshot({
  path: OUT + "/323-pdpfeatures-icon.png",
  clip: iconFacts.clip,
});
console.log("323 saved");

// [324] the @375 pass — the mobile geometry (fresh context viewport)
const mctx = await browser.newContext({ viewport: { width: 375, height: 700 }, deviceScaleFactor: 1 });
const mpage = await mctx.newPage();
await withTimeout(mpage.goto(CLONE + "/product/wireless-headphones", { waitUntil: "networkidle" }), 25000, "m-goto");
await mpage.waitForTimeout(1000);
const mFacts = await mpage.evaluate(() => {
  const h3 = [...document.querySelectorAll("h3")].find(
    (el) => /^key features$/i.test((el.textContent || "").trim()) && el.children.length === 0
  );
  if (!h3) return { found: false };
  let list = h3.nextElementSibling;
  for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
  const h3r = h3.getBoundingClientRect(), lr = list.getBoundingClientRect(), rr = list.children[0].getBoundingClientRect();
  const svg = list.children[0].querySelector("svg");
  return {
    found: true,
    h3: [Math.round(h3r.width), Math.round(h3r.height)],
    list: [Math.round(lr.width), Math.round(lr.height)],
    row: [Math.round(rr.width), Math.round(rr.height)],
    icon: [Math.round(svg.getBoundingClientRect().width), Math.round(svg.getBoundingClientRect().height)],
    rows: list.children.length,
  };
});
await mpage.evaluate(() => {
  const h3 = [...document.querySelectorAll("h3")].find(
    (el) => /^key features$/i.test((el.textContent || "").trim()) && el.children.length === 0
  );
  if (h3) h3.scrollIntoView({ block: "center" });
});
await mpage.waitForTimeout(400);
console.log("324 facts:", JSON.stringify(mFacts));
await mpage.screenshot({ path: OUT + "/324-pdpfeatures-mobile-375.png" });
console.log("324 saved");
await mctx.close();

// [325] the tab-coupled state — the Reviews swap hides the list
const tabFactsBefore = await page.evaluate(() => document.querySelectorAll("ul.space-y-2").length);
await page.getByRole("tab", { name: /^Reviews/ }).scrollIntoViewIfNeeded();
await page.getByRole("tab", { name: /^Reviews/ }).click();
await page.waitForTimeout(400);
const tabFactsAfter = await page.evaluate(() => ({
  featureLists: document.querySelectorAll("ul.space-y-2").length,
  activePanel: document.querySelector('[role="tabpanel"][data-state="active"]')?.textContent?.slice(0, 60),
}));
console.log("325 facts: lists before =", tabFactsBefore, "after =", JSON.stringify(tabFactsAfter));
await page.screenshot({ path: OUT + "/325-pdpfeatures-tab-swap.png" });
console.log("325 saved");

await browser.close();
console.log("ROUND-62 CAPTURES COMPLETE: 321-325");
