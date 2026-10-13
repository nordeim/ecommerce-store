// Round-56 CLONE probe D: verify the CSSOM exposes the @starting-style
// rule (and the .toast-exiting rule) in the PRODUCTION build — the pin
// spec's deterministic P4/P10 route needs to walk document.styleSheets and
// read the @starting-style block's inner rule text.
// Run (via battery): bash scripts/battery-runner.sh toast-clone-r56d.mjs prod
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
await page.goto(CLONE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const walk = await page.evaluate(() => {
  const found = [];
  const walkRules = (rules, ctx) => {
    for (const rule of rules) {
      const text = rule.cssText || "";
      if (rule.cssRules) {
        // group rule (@starting-style, @media, @layer, @supports...)
        const isStartingStyle = text.toLowerCase().startsWith("@starting-style");
        walkRules(rule.cssRules, isStartingStyle ? "starting-style" : ctx);
      } else if (rule.selectorText) {
        if (rule.selectorText.includes(".toast-item") || ctx === "starting-style") {
          found.push({ ctx, selector: rule.selectorText, css: rule.style?.cssText ?? text.slice(0, 200) });
        }
      }
    }
  };
  for (const sheet of document.styleSheets) {
    try { walkRules(sheet.cssRules, "root"); } catch {}
  }
  return found;
});

console.log("== CSSOM: the toast rules in the production build ==");
for (const r of walk) {
  console.log(`  [${r.ctx}] ${r.selector}`);
  console.log(`      ${r.css}`);
}

// also: the computed transitionTimingFunction on a resting .toast-item
// (there is no toast at rest on a plain page load — read the BASE rule's
// declared TF from the CSSOM instead, plus simulate the exiting override)
const baseRule = walk.find((r) => r.selector === ".toast-item");
const exitingRule = walk.find((r) => r.selector.includes("toast-exiting"));
console.log("\nbase .toast-item rule found:", !!baseRule);
console.log("exiting rule found:", !!exitingRule);
if (exitingRule) {
  console.log("exiting rule TF:", exitingRule.css.match(/transition-timing-function:[^;]+/)?.[0] ?? "(not in cssText)");
}

await browser.close();
console.log("\nclone probe r56d complete");
