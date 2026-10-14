// Round-59 instrument check: how does the r51 P7 form (btn.hover() on the
// translate-hidden, overflow-clipped Add button) produce the /90 hover bg?
// Replicate the exact sequence and dump every intermediate state.
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(CLONE + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const card = page.locator("main a[href^='/product/']").first().locator("xpath=ancestor::div[1]");
const btn = card.locator("button", { hasText: /^Add to Cart$/ }).first();
const wrap = btn.locator("xpath=ancestor::div[1]");

// the pre-hover state
const pre = await btn.evaluate((el) => {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const addbar = el.closest("div.absolute");
  const group = el.closest("div.group");
  return {
    bg: cs.backgroundColor,
    translate: addbar ? getComputedStyle(addbar).translate : null,
    rect: { y: Math.round(r.y), h: Math.round(r.height) },
    cardBottom: group ? Math.round(group.getBoundingClientRect().bottom) : null,
  };
});
console.log("PRE-HOVER:", JSON.stringify(pre));

// the exact r51 P7 sequence
await btn.hover();
await page.waitForTimeout(450);
const post = await btn.evaluate((el) => {
  const cs = getComputedStyle(el);
  const group = el.closest("div.group");
  const addbar = el.closest("div.absolute");
  const r = el.getBoundingClientRect();
  const at = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
  return {
    bg: cs.backgroundColor,
    addbarTranslate: addbar ? getComputedStyle(addbar).translate : null,
    groupHover: group ? group.matches(":hover") : null,
    btnHover: el.matches(":hover"),
    hitTarget: at ? at.tagName + "." + (at.className || "").toString().slice(0, 30) : "null",
  };
});
console.log("POST-HOVER:", JSON.stringify(post, null, 1));
await browser.close();
console.log("EXPERIMENT COMPLETE");
