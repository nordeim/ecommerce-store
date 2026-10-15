// Round-62 REFERENCE probe A2: the follow-up axes the first pass missed —
// the h3's PARENT div class string (the clone carries "prose prose-sm
// max-w-none"; does the reference?), the icon's class ATTRIBUTE (the svg
// className serializes as [object SVGAnimatedString] — getAttribute works),
// the tabpanel's association shape, and the description paragraph's
// computed anatomy (the sibling above the h3).
// Run: node scripts/pdpfeatures-ref-r62a2.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const report = (k, v) => console.log(`  ${k.padEnd(56)} ${typeof v === "string" ? v : JSON.stringify(v)}`);
const line = (t) => console.log(`\n=== ${t} ===`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

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

line("A. THE H3's PARENT + ANCESTOR CLASS STRINGS");
const parent = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll("h3,div,p,span")].find(
    (el) => /^key features$/i.test((el.textContent || "").trim()) && el.children.length === 0
  );
  if (!h3) return { found: false };
  const chain = [];
  let el = h3.parentElement;
  for (let i = 0; i < 5 && el; i++) {
    chain.push({ tag: el.tagName, cls: el.getAttribute("class"), role: el.getAttribute("role"), dataState: el.getAttribute("data-state"), labelledby: el.getAttribute("aria-labelledby") });
    el = el.parentElement;
  }
  return { found: true, chain };
});
report("parent.chain", JSON.stringify(parent.chain, null, 1));

line("B. THE ICON's CLASS ATTRIBUTE + SVG SHAPE");
const icon = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll("h3,div,p,span")].find(
    (el) => /^key features$/i.test((el.textContent || "").trim()) && el.children.length === 0
  );
  let list = h3.nextElementSibling;
  for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
  const s = list.children[0].querySelector("svg");
  return {
    cls: s.getAttribute("class"),
    viewBox: s.getAttribute("viewBox"),
    width: s.getAttribute("width"), height: s.getAttribute("height"),
    ariaHidden: s.getAttribute("aria-hidden"),
    childPaths: s.children.length,
    firstChildTag: s.firstElementChild ? s.firstElementChild.tagName : null,
    outerStart: s.outerHTML.slice(0, 200),
  };
});
for (const [k, v] of Object.entries(icon)) report(`icon.${k}`, v);

line("C. THE DESCRIPTION PARAGRAPH (the sibling above the h3)");
const para = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll("h3,div,p,span")].find(
    (el) => /^key features$/i.test((el.textContent || "").trim()) && el.children.length === 0
  );
  let prev = h3.previousElementSibling;
  // walk to the nearest paragraph-ish sibling
  for (let i = 0; i < 3 && prev && !/^P$/.test(prev.tagName); i++) prev = prev.previousElementSibling;
  if (!prev) return { found: false };
  const cs = getComputedStyle(prev);
  const r = prev.getBoundingClientRect();
  return {
    found: true, tag: prev.tagName, cls: prev.getAttribute("class"),
    rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    color: cs.color, fontSize: cs.fontSize, fontWeight: cs.fontWeight, lineHeight: cs.lineHeight,
    margin: cs.margin, marginBottom: cs.marginBottom,
  };
});
for (const [k, v] of Object.entries(para)) report(`para.${k}`, typeof v === "string" ? v : JSON.stringify(v));

line("D. THE PROSE QUESTION — is any prose CSS emitted?");
const prose = await page.evaluate(() => {
  const styles = [...document.querySelectorAll("style")].map((s) => s.textContent || "");
  const all = styles.join("\n");
  return {
    proseRules: (all.match(/\.prose[ ,{:\[]/g) || []).length,
    proseSmRules: (all.match(/\.prose-sm/g) || []).length,
    styleCount: styles.length,
  };
});
for (const [k, v] of Object.entries(prose)) report(`prose.${k}`, v);

await browser.close();
console.log("\nREF PROBE A2 COMPLETE");
