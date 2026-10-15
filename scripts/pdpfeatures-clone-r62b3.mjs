// Round-62 CLONE probe B3: the li's computed transition (the P7 axis the
// b2 probe missed — the honest calibration of the transitionProperty
// expectation before pinning it).
// Run: bash scripts/battery-runner.sh pdpfeatures-clone-r62b3.mjs prod
import { chromium } from "playwright-core";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/product/wireless-headphones", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const out = await page.evaluate(() => {
  const h3 = [...document.querySelectorAll("h3")].find((el) => /^key features$/i.test((el.textContent || "").trim()));
  let list = h3.nextElementSibling;
  for (let i = 0; i < 3 && list && list.children.length < 2; i++) list = list.nextElementSibling;
  const li = list.children[0];
  const cs = getComputedStyle(li);
  const ul = getComputedStyle(list);
  return {
    li: {
      transitionProperty: cs.transitionProperty, transitionDuration: cs.transitionDuration,
      transitionTiming: cs.transitionTimingFunction, bg: cs.backgroundColor, cursor: cs.cursor,
    },
    ul: { transitionProperty: ul.transitionProperty, bg: ul.backgroundColor },
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
