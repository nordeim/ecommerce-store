// Round-51 calibration probe: the reference's PRODUCT-CARD HOVER STATES,
// measured live (the pin family's parity ground truth). The resting card
// is pixel-swept (the paired sweep captures /shop at rest); the
// interaction-gated states — the container's shadow lift, the image zoom
// mid-hover, the title's hovered color, the slide-up Add bar's hidden/
// revealed anatomy, the heart button's hover bg — were NEVER measured
// against the reference (the HOVER-GATE-1 pin covers only the media-gate
// trap's two states; wishlist.spec:29 pins the heart's color states).
//
//   A  structure   the first card's DOM dump (selector discovery — the
//                  reference's card anatomy from the live DOM)
//   B  container   resting shadow/border/radius/transition → HOVERED
//                  shadow (settled, +700ms) + the transition inventory
//   C  image       resting transform → hovered scale + duration/timing
//                  (v3 engine: transform matrix; the clone's v4 spells it
//                  as the `scale` property — the HOVER-GATE-1 register)
//   D  title       resting color → hovered color + transition-duration
//   E  add-bar     the hidden resting state (transform? visibility?) →
//                  the revealed state + the button's full anatomy (h/w,
//                  font, radius, bg, shadow) + its transition duration
//   F  heart btn   resting anatomy (size/radius/bg/backdrop/shadow) →
//                  hovered bg
//   G  heart glyph the inactive color on the card (session-5 pinned the
//                  pair; re-confirm in passing)
//   H  badges      the stack's geometry (top/left/gap)
//
// Read-only against the reference (a hover writes nothing; the wishlist
// toggle is NOT triggered — the heart hover is CSS-only).
// Run: node scripts/cardhover-probe-r51.mjs
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/probe-r51";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const report = (k, v) => console.log(`  ${k.padEnd(42)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

// login (the reference storefront is login-gated — the S46 lesson)
const lp = await ctx.newPage();
await lp.goto(REF + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await lp.getByLabel("Password").fill("$Abcd1234");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try {
  await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
} catch { /* report what we find */ }
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
await lp.close();

const page = await ctx.newPage();
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(1200); // font settle

line("A. STRUCTURE — the first card's DOM");
// The reference's grid: find the first product card. The card links to
// /product/<slug>; the card container is the link's ancestor block.
const firstLink = page.locator('a[href^="/product/"]').first();
const card = firstLink.locator("xpath=ancestor::div[3]");
const html = await card.evaluate((el) => el.outerHTML);
writeFileSync(OUT + "/card.html", html);
// dump a pruned form to console (first 1200 chars, tags only)
const pruned = html.replace(/></g, ">\n<").split("\n").filter((l) => /^\s*<(div|a|img|button|p|h3|svg|span)/i.test(l.trim())).slice(0, 18).join("\n");
console.log(pruned.slice(0, 1600));
report("card.class", await card.getAttribute("class"));

line("B. CONTAINER — resting vs hovered");
const contResting = await card.evaluate((el) => {
  const cs = getComputedStyle(el);
  return {
    boxShadow: cs.boxShadow,
    borderRadius: cs.borderRadius,
    background: cs.backgroundColor,
    border: cs.border,
    transitionProperty: cs.transitionProperty,
    transitionDuration: cs.transitionDuration,
    transitionTiming: cs.transitionTimingFunction,
  };
});
for (const [k, v] of Object.entries(contResting)) report(`resting.${k}`, v);

await card.hover();
await page.waitForTimeout(700); // the settle (r48/r50 lesson: never read mid-transition)
const contHovered = await card.evaluate((el) => {
  const cs = getComputedStyle(el);
  return { boxShadow: cs.boxShadow, borderRadius: cs.borderRadius };
});
for (const [k, v] of Object.entries(contHovered)) report(`hovered.${k}`, v);

line("C. IMAGE — resting vs hovered (the zoom)");
const img = card.locator("img").first();
const imgResting = await img.evaluate((el) => {
  const cs = getComputedStyle(el);
  return { transform: cs.transform, scale: cs.scale, transitionProperty: cs.transitionProperty, transitionDuration: cs.transitionDuration };
});
for (const [k, v] of Object.entries(imgResting)) report(`resting.${k}`, v);
const imgHovered = await img.evaluate((el) => {
  const cs = getComputedStyle(el);
  return { transform: cs.transform, scale: cs.scale };
});
report("hovered.transform", imgHovered.transform);
report("hovered.scale", imgHovered.scale);

line("D. TITLE — resting vs hovered (the color)");
const title = card.locator("h3").first();
const titleResting = await title.evaluate((el) => {
  const cs = getComputedStyle(el);
  return { color: cs.color, transitionProperty: cs.transitionProperty, transitionDuration: cs.transitionDuration };
});
for (const [k, v] of Object.entries(titleResting)) report(`resting.${k}`, v);
const titleHovered = await title.evaluate((el) => getComputedStyle(el).color);
report("hovered.color", titleHovered);

line("E. ADD-BAR — hidden vs revealed (the slide-up)");
// The slide-up element: the absolutely-positioned block at the image's
// bottom. In the clone it is the div wrapping the Add to Cart button.
// Discover on the reference: the element whose transform changes on hover.
const candidates = await card.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll("div,button")) {
    const cs = getComputedStyle(el);
    if (cs.transform !== "none" || el.querySelector('button')) {
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.height < 80 && cs.position === "absolute") {
        out.push({
          tag: el.tagName,
          cls: (el.getAttribute("class") || "").slice(0, 110),
          pos: cs.position,
          transform: cs.transform,
          bottom: cs.bottom,
          text: (el.textContent || "").trim().slice(0, 30),
        });
      }
    }
  }
  return out.slice(0, 10);
});
console.log(JSON.stringify(candidates, null, 1).slice(0, 1500));

// measure the revealed bar + its button anatomy while still hovered
const barProbe = await card.evaluate(() => {
  // the Add to Cart button on the reference
  const btn = [...document.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  if (!btn) return { found: false };
  const wrap = btn.parentElement;
  const bcs = getComputedStyle(btn);
  const wcs = getComputedStyle(wrap);
  const br = btn.getBoundingClientRect();
  const wr = wrap.getBoundingClientRect();
  return {
    found: true,
    wrapClass: (wrap.getAttribute("class") || "").slice(0, 120),
    wrapTransform: wcs.transform,
    wrapTransition: `${wcs.transitionProperty} ${wcs.transitionDuration}`,
    wrapRect: { y: Math.round(wr.y), h: Math.round(wr.height), w: Math.round(wr.width) },
    btnClass: (btn.getAttribute("class") || "").slice(0, 200),
    btnRect: { h: Math.round(br.height), w: Math.round(br.width) },
    btnFont: `${bcs.fontSize}/${bcs.fontWeight}`,
    btnRadius: bcs.borderRadius,
    btnBg: bcs.backgroundColor,
    btnColor: bcs.color,
    btnShadow: bcs.boxShadow.slice(0, 90),
    btnText: (btn.textContent || "").trim(),
  };
});
for (const [k, v] of Object.entries(barProbe)) report(`bar.${k}`, typeof v === "object" ? JSON.stringify(v) : v);

// move the mouse AWAY — the bar must re-hide (the resting hidden state)
await page.mouse.move(8, 400);
await page.waitForTimeout(700);
const barHidden = await card.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  if (!btn) return { found: false };
  const wrap = btn.parentElement;
  const cs = getComputedStyle(wrap);
  const r = wrap.getBoundingClientRect();
  // is it clipped out of the card (below the image bottom)?
  return { found: true, transform: cs.transform, rectY: Math.round(r.y), rectH: Math.round(r.height), overflowVisible: cs.overflow };
});
for (const [k, v] of Object.entries(barHidden)) report(`hidden.${k}`, typeof v === "object" ? JSON.stringify(v) : v);

line("F. HEART BUTTON — resting vs hovered");
const heart = page.locator('button[aria-label*="wishlist"], button:has(svg)').filter({ hasText: /^$/ }).first();
// more robust: the reference's card heart is the top-right circular button
const heartBtn = await page.evaluate(() => {
  const link = document.querySelector('a[href^="/product/"]');
  const card0 = link ? link.closest("div") : null;
  // climb to the card root (the group container)
  let root = card0;
  for (let i = 0; i < 4 && root.parentElement; i++) root = root.parentElement;
  const btns = [...root.querySelectorAll("button")];
  const heart = btns.find((b) => (b.getAttribute("aria-label") || "").toLowerCase().includes("wishlist")) || btns.find((b) => b.querySelector("svg") && !/add to cart/i.test(b.textContent || ""));
  if (!heart) return { found: false };
  const cs = getComputedStyle(heart);
  const r = heart.getBoundingClientRect();
  return {
    found: true,
    label: heart.getAttribute("aria-label"),
    cls: (heart.getAttribute("class") || "").slice(0, 150),
    size: `${Math.round(r.width)}x${Math.round(r.height)}`,
    radius: cs.borderRadius,
    bg: cs.backgroundColor,
    backdrop: cs.backdropFilter,
    shadow: cs.boxShadow.slice(0, 80),
    svgColor: getComputedStyle(heart.querySelector("svg")).color,
  };
});
for (const [k, v] of Object.entries(heartBtn)) report(`heart.${k}`, typeof v === "object" ? JSON.stringify(v) : v);

// hover the heart specifically (still inside the card → the group states
// stay active; the heart's OWN hover is the bg shift)
const heartLoc = page.getByRole("button", { name: /wishlist/i }).first();
try {
  await heartLoc.hover();
  await page.waitForTimeout(400);
  const heartHovered = await heartLoc.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, shadow: cs.boxShadow.slice(0, 80) };
  });
  report("heart.hovered.bg", heartHovered.bg);
  report("heart.hovered.shadow", heartHovered.shadow);
} catch (e) {
  report("heart.hovered", "LOCATOR FAILED: " + String(e).slice(0, 80));
}

line("G. BADGES — the stack geometry");
const badges = await card.evaluate((el) => {
  const out = [];
  for (const b of el.querySelectorAll("[class*='badge'], [data-badge], span")) {
    const cs = getComputedStyle(b);
    const r = b.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.height < 30 && cs.position === "absolute") {
      out.push({ text: (b.textContent || "").trim().slice(0, 20), cls: (b.getAttribute("class") || "").slice(0, 90), top: cs.top, left: cs.left, h: Math.round(r.height), radius: cs.borderRadius, bg: cs.backgroundColor, color: cs.color, font: `${cs.fontSize}/${cs.fontWeight}` });
    }
  }
  return out.slice(0, 5);
});
console.log(JSON.stringify(badges, null, 1).slice(0, 1200));

line("H. GRID — the card geometry (resting context)");
const grid = await page.evaluate(() => {
  const link = document.querySelector('a[href^="/product/"]');
  const cardEl = link.closest("div");
  let root = cardEl;
  for (let i = 0; i < 4 && root.parentElement; i++) root = root.parentElement;
  const r = root.getBoundingClientRect();
  const g = root.parentElement.getBoundingClientRect();
  return { cardRect: { w: Math.round(r.width), h: Math.round(r.height) }, gap: Math.round(g.width - r.width), cols: getComputedStyle(root.parentElement).gridTemplateColumns };
});
report("grid", JSON.stringify(grid));

await page.screenshot({ path: OUT + "/ref-shop-hover.png" });
await browser.close();
console.log("\nPROBE r51 COMPLETE — captures in " + OUT);
