// Round-56 CLONE probe D2: debug the CSSOM walk — how many sheets, what do
// the top-level rules look like, where do the toast rules live.
// Run (via battery): bash scripts/battery-runner.sh toast-clone-r56d2.mjs prod
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
await page.goto(CLONE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const info = await page.evaluate(() => {
  const sheets = [...document.styleSheets];
  const out = { sheetCount: sheets.length, sheets: [], toastHits: [] };
  const walk = (rules, path) => {
    for (const rule of rules) {
      const text = rule.cssText || "";
      if (text.includes("toast-item") || text.includes("starting-style")) {
        out.toastHits.push({ path, head: text.slice(0, 220) });
      }
      if (rule.cssRules && text.length < 4000) walk(rule.cssRules, path + " > " + (rule.cssText || "?").slice(0, 24));
    }
  };
  sheets.forEach((s, i) => {
    let n = -1, first = "(throws)", err = null;
    try { n = s.cssRules.length; first = n ? s.cssRules[0].cssText.slice(0, 100) : "(empty)"; } catch (e) { err = String(e); }
    out.sheets.push({ i, href: s.href, rules: n, first, err });
    try { walk(s.cssRules, `sheet${i}`); } catch (e) { out.toastHits.push({ path: `sheet${i} ERROR`, head: String(e) }); }
  });
  return out;
});

console.log(JSON.stringify(info, null, 2).slice(0, 3000));
await browser.close();
console.log("probe r56d2 complete");
