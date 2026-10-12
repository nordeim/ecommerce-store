// Round-51 calibration probe B: the reference's PRODUCT-CARD HOVER STATES,
// re-measured with the CORRECT card locator (r51a's lesson: the link's
// ancestor::div[3] is the GRID — its center falls between cards, so no
// group-hover fired and every "hovered" read returned the resting value).
// The card is ancestor::div[1] (the div.group). This pass measures the
// full computed hover contract + the hovered-card PIXEL diff (the r48
// lesson: engine shadow serialization differs — v3 rgba vs v4 lab() —
// the canvas pixel pipeline is the honest comparison).
// Run: node scripts/cardhover-probe-r51b.mjs
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { PNG } from "../node_modules/playwright-core/lib/utilsBundle.js";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/probe-r51b";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const report = (k, v) => console.log(`  ${k.padEnd(44)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

// login
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
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// THE CARD = the link's ancestor::div[1] (div.group), NOT [3] (the grid)
const firstLink = page.locator('a[href^="/product/"]').first();
const card = firstLink.locator("xpath=ancestor::div[1]");
report("card.tag+class", (await card.evaluate((el) => el.tagName + "." + el.className)).slice(0, 110));

// ---- resting capture (for the pixel diff baseline) ----
await card.screenshot({ path: OUT + "/ref-card-resting.png" });

line("B. CONTAINER — resting vs hovered (the shadow lift)");
const rest = await card.evaluate((el) => {
  const cs = getComputedStyle(el);
  return {
    boxShadow: cs.boxShadow, borderRadius: cs.borderRadius, background: cs.backgroundColor,
    border: cs.border, transitionProperty: cs.transitionProperty,
    transitionDuration: cs.transitionDuration, transitionTiming: cs.transitionTimingFunction,
  };
});
for (const [k, v] of Object.entries(rest)) report(`resting.${k}`, v);

await card.hover();
await page.waitForTimeout(750); // settle beyond the 300ms transition
const hov = await card.evaluate((el) => {
  const cs = getComputedStyle(el);
  return { boxShadow: cs.boxShadow, borderRadius: cs.borderRadius };
});
report("hovered.boxShadow", hov.boxShadow);
report("hovered.borderRadius", hov.borderRadius);
await card.screenshot({ path: OUT + "/ref-card-hovered.png" });

line("C. IMAGE — hovered (the zoom)");
const img = card.locator("img").first();
report("img.hovered.transform", await img.evaluate((el) => getComputedStyle(el).transform));
report("img.hovered.scale", await img.evaluate((el) => getComputedStyle(el).scale));

line("D. TITLE — hovered (the color)");
const title = card.locator("h3").first();
report("title.hovered.color", await title.evaluate((el) => getComputedStyle(el).color));
report("title.transitionDuration", await title.evaluate((el) => getComputedStyle(el).transitionDuration));

line("E. ADD-BAR — revealed (while hovered)");
const addbar = await card.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  // scope: only the button inside THIS card
  const wrap = btn.closest("div.absolute");
  const cs = getComputedStyle(wrap);
  const bcs = getComputedStyle(btn);
  const br = btn.getBoundingClientRect();
  const wr = wrap.getBoundingClientRect();
  return {
    wrapTransform: cs.transform,
    wrapTransition: `${cs.transitionProperty} ${cs.transitionDuration}`,
    wrapRect: { y: Math.round(wr.y), h: Math.round(wr.height), w: Math.round(wr.width) },
    btnClass: (btn.getAttribute("class") || ""),
    btnRect: { h: Math.round(br.height), w: Math.round(br.width) },
    btnFont: `${bcs.fontSize}/${bcs.fontWeight}`,
    btnRadius: bcs.borderRadius,
    btnBg: bcs.backgroundColor,
    btnColor: bcs.color,
    btnShadow: bcs.boxShadow,
    btnGap: bcs.gap,
    btnText: (btn.textContent || "").trim(),
    svgSize: getComputedStyle(btn.querySelector("svg")).width,
  };
});
for (const [k, v] of Object.entries(addbar)) report(`bar.${k}`, typeof v === "object" ? JSON.stringify(v) : v);

// hover the ADD BUTTON itself (its own hover: bg shift) while staying in-card
const addBtn = card.locator("button", { hasText: "Add to Cart" }).first();
await addBtn.hover();
await page.waitForTimeout(400);
report("bar.btn.hoveredBg", await addBtn.evaluate((el) => getComputedStyle(el).backgroundColor));

// mouse away → the bar re-hides
await page.mouse.move(8, 400);
await page.waitForTimeout(750);
const hidden = await card.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const wrap = btn.closest("div.absolute");
  return { transform: getComputedStyle(wrap).transform };
});
report("bar.hidden.transform", hidden.transform);

line("F. HEART — resting, hovered (the bg shift)");
// the heart = the card's only absolutely-positioned button (no aria-label — r50 lesson)
const heart = card.locator("button.absolute").first();
const heartResting = await heart.evaluate((el) => {
  const cs = getComputedStyle(el);
  const svg = el.querySelector("svg");
  return {
    size: `${Math.round(cs.width)}x${Math.round(cs.height)}`, radius: cs.borderRadius,
    bg: cs.backgroundColor, backdrop: cs.backdropFilter, shadow: cs.boxShadow,
    svgColor: getComputedStyle(svg).color, svgSize: getComputedStyle(svg).width,
    svgFill: getComputedStyle(svg).fill, cls: el.className.slice(0, 130),
  };
});
for (const [k, v] of Object.entries(heartResting)) report(`heart.resting.${k}`, v);
await heart.hover();
await page.waitForTimeout(400);
const heartHovered = await heart.evaluate((el) => {
  const cs = getComputedStyle(el);
  return { bg: cs.backgroundColor, shadow: cs.boxShadow, backdrop: cs.backdropFilter };
});
report("heart.hovered.bg", heartHovered.bg);
report("heart.hovered.shadow", heartHovered.shadow);
await heart.screenshot({ path: OUT + "/ref-heart-hovered.png" });

line("G. BADGES — the computed anatomy");
const badges = await card.evaluate(() => {
  return [...document.querySelectorAll("div.absolute.top-3.left-3 > div")].slice(0, 3).map((b) => {
    const cs = getComputedStyle(b);
    const r = b.getBoundingClientRect();
    return {
      text: (b.textContent || "").trim().slice(0, 16),
      h: Math.round(r.height), w: Math.round(r.width),
      radius: cs.borderRadius, bg: cs.backgroundColor, color: cs.color,
      font: `${cs.fontSize}/${cs.fontWeight}`, padding: cs.padding,
      shadow: cs.boxShadow.slice(0, 60),
    };
  });
});
for (const b of badges) console.log("  " + JSON.stringify(b));

line("H. TITLE/CATEGORY/PRICE — the info block (resting, hover-stable)");
const info = await card.evaluate(() => {
  const info = document.querySelector("a.block.p-4");
  const cat = info.querySelector("p");
  const h3 = info.querySelector("h3");
  const price = info.querySelector("span.text-base");
  const cmp = info.querySelector("span.line-through");
  return {
    catColor: getComputedStyle(cat).color, catFont: getComputedStyle(cat).fontSize,
    h3Color: getComputedStyle(h3).color, h3Font: `${getComputedStyle(h3).fontSize}/${getComputedStyle(h3).fontWeight}`,
    h3LineClamp: getComputedStyle(h3).webkitLineClamp,
    priceColor: getComputedStyle(price).color, priceFont: `${getComputedStyle(price).fontSize}/${getComputedStyle(price).fontWeight}`,
    cmpColor: getComputedStyle(cmp).color, cmpDecoration: cmp ? getComputedStyle(cmp).textDecorationLine : null,
  };
});
for (const [k, v] of Object.entries(info)) report(`info.${k}`, v);

// ---- the pixel diff: resting vs hovered (the shadow lift's honest form) ----
line("I. PIXEL — the hovered card's diff zone (shadow-lift truth)");
const A = PNG.sync.read(OUT + "/ref-card-resting.png");
const B = PNG.sync.read(OUT + "/ref-card-hovered.png");
if (A.width === B.width && A.height === B.height) {
  let diff = 0;
  for (let i = 0; i < A.data.length; i += 4) {
    if (Math.abs(A.data[i] - B.data[i]) > 12 || Math.abs(A.data[i + 1] - B.data[i + 1]) > 12 || Math.abs(A.data[i + 2] - B.data[i + 2]) > 12) diff++;
  }
  const total = (A.width * A.height);
  report("selfDiff.resting→hovered", `${diff} px of ${total} (${((100 * diff) / total).toFixed(2)}%) — the shadow+zoom+bar zone`);
} else {
  report("selfDiff", `SIZE MISMATCH ${A.width}x${A.height} vs ${B.width}x${B.height}`);
}

await browser.close();
console.log("\nPROBE r51b COMPLETE — captures in " + OUT);
