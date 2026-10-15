// Round-62 CLONE probe B2: the follow-up axes — the description paragraph's
// computed anatomy, the icon's outerHTML shape, the parent chain classes
// (the paired completion of pdpfeatures-ref-r62a2.mjs).
// Run: bash scripts/battery-runner.sh pdpfeatures-clone-r62b2.mjs prod
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const report = (k, v) => console.log(`  ${k.padEnd(56)} ${typeof v === "string" ? v : JSON.stringify(v)}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(CLONE + "/product/wireless-headphones", { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(1200);

const out = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll("h3")].find((el) => /^key features$/i.test((el.textContent || "").trim()));
  const chain = [];
  let el = h3.parentElement;
  for (let i = 0; i < 3 && el; i++) { chain.push({ tag: el.tagName, cls: el.getAttribute("class"), role: el.getAttribute("role"), dataState: el.getAttribute("data-state"), labelledby: el.getAttribute("aria-labelledby") }); el = el.parentElement; }
  let prev = h3.previousElementSibling;
  for (let i = 0; i < 3 && prev && !/^P$/i.test(prev.tagName); i++) prev = prev.previousElementSibling;
  const cs = getComputedStyle(prev); const r = prev.getBoundingClientRect();
  let list = h3.nextElementSibling;
  const s = list.children[0].querySelector("svg");
  return {
    chain,
    para: { tag: prev.tagName, cls: prev.getAttribute("class"), rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], color: cs.color, fontSize: cs.fontSize, lineHeight: cs.lineHeight, margin: cs.margin },
    iconOuter: s.outerHTML.slice(0, 280),
  };
});
report("parentChain", JSON.stringify(out.chain, null, 1));
report("para", JSON.stringify(out.para));
report("iconOuter", out.iconOuter);

await browser.close();
console.log("\nCLONE PROBE B2 COMPLETE");
