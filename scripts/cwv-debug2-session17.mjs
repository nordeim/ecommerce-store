// Round-17 debug #2: does the reference's home hero render for an ANON
// fresh context? (the cwv differential uses fresh anon contexts; the
// agent-browser session was authenticated — isolating the variable)
import { chromium } from "playwright-core";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 80)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console: " + m.text().slice(0, 80));
});
await page.goto("https://fuzzy-lumina-style-hub.base44.app/", { waitUntil: "networkidle" });
await page.waitForTimeout(8000);
const state = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll("img")];
  const big = imgs.filter((i) => i.getBoundingClientRect().width > 400);
  const bgBig = [...document.querySelectorAll("div")]
    .filter((e) => e.getBoundingClientRect().width > 800 && e.getBoundingClientRect().height > 400)
    .map((e) => ({ w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height), bg: getComputedStyle(e).backgroundImage.slice(0, 80) }))
    .slice(0, 3);
  return JSON.stringify({
    title: document.title,
    imgCount: imgs.length,
    bigImgCount: big.length,
    bigImgs: big.slice(0, 3).map((i) => ({ w: Math.round(i.getBoundingClientRect().width), src: (i.currentSrc || "").slice(-40), complete: i.complete, natural: i.naturalWidth })),
    bgCandidates: bgBig,
    bodyText: document.body.textContent.replace(/\s+/g, " ").slice(0, 120),
  });
});
console.log(state);
console.log("errors:", JSON.stringify(errors.slice(0, 5)));
await browser.close();
