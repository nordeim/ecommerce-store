// Round-59 probe A3: the reference's heart-button FOCUS ring (the last open
// axis — the clone's heart carries no focus-visible classes; the reference's
// class string is byte-identical, so the expectation is no ring either, but
// the r59a probe never measured the heart's own focused boxShadow) + the
// reference's resting addbar re-confirm + the Enter-on-heart behavior.
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r("TIMEOUT:" + what), ms))]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const lp = await ctx.newPage();
await withTimeout(lp.goto(REF + "/login", { waitUntil: "domcontentloaded" }), 25000, "login-goto");
await withTimeout(lp.getByLabel("Email").fill("sepnetflix2023@outlook.com"), 15000, "email-fill");
await withTimeout(lp.getByLabel("Password").fill("$Abcd1234"), 15000, "pw-fill");
await withTimeout(lp.getByRole("button", { name: "Log in", exact: true }).click(), 15000, "login-click");
try {
  await withTimeout(lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }), 28000, "login-nav");
} catch {}
await lp.waitForTimeout(1500);
await lp.close();

const page = await ctx.newPage();
await withTimeout(page.goto(REF + "/product/wireless-headphones", { waitUntil: "domcontentloaded" }), 30000, "pdp-goto");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1200);
await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  grid.children[0].scrollIntoView({ block: "center" });
});
await page.waitForTimeout(500);

// [1] focus the heart via keyboard walk (link -> heart)
await page.mouse.move(512, 20, { steps: 8 });
await page.waitForTimeout(300);
await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  grid.querySelector("a")?.focus();
});
await page.keyboard.press("Tab");
await page.waitForTimeout(400);
const heartFocus = await page.evaluate(() => {
  const a = document.activeElement;
  const cs = getComputedStyle(a);
  const svg = a?.querySelector("svg");
  return {
    active: a?.tagName + ":" + (a?.getAttribute("aria-label") || "no-aria") + " svg:" + (svg ? svg.className.baseVal || svg.getAttribute("class") : null),
    boxShadowFULL: cs.boxShadow,
    outline: cs.outlineWidth + " " + cs.outlineStyle + " " + cs.outlineColor,
  };
});
console.log("[1] REF HEART FOCUS:", JSON.stringify(heartFocus, null, 1));

// [2] Enter on the reference's focused heart — what happens (client state + toast?)
const badgeBefore = await page.evaluate(() => {
  const header = document.querySelector("header");
  const cartBtn = [...header.querySelectorAll("button")].find((b) => b.querySelector("svg") && /bag|cart/i.test(b.innerHTML));
  return cartBtn?.textContent?.trim() || null;
});
await page.keyboard.press("Enter");
await page.waitForTimeout(800);
const afterHeart = await page.evaluate(() => {
  let toast = null;
  for (const d of document.querySelectorAll("body *")) {
    if (getComputedStyle(d).position === "fixed" && /wishlist/i.test(d.textContent || "") && d.getBoundingClientRect().y > 500) {
      toast = d.textContent?.trim().slice(0, 50);
      break;
    }
  }
  const header = document.querySelector("header");
  const cartBtn = [...header.querySelectorAll("button")].find((b) => b.querySelector("svg") && /bag|cart/i.test(b.innerHTML));
  const heartSvg = document.activeElement?.querySelector("svg");
  const cls = heartSvg ? (heartSvg.getAttribute("class") || "") : null;
  return { toast, badge: cartBtn?.textContent?.trim() || null, url: location.pathname, heartSvgCls: cls };
});
console.log("[2] REF HEART ENTER:", JSON.stringify({ badgeBefore, afterHeart }));

// [3] the reference's heart svg class strings BEFORE and AFTER toggle (the color contract re-check in the related context)
const heartStates = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const heart = [...card.querySelectorAll("button")].find((b) => b.querySelector("svg") && !/add to cart/i.test(b.textContent || ""));
  const svg = heart.querySelector("svg");
  const cs = getComputedStyle(svg);
  return { svgCls: svg.getAttribute("class"), fill: cs.fill, color: cs.color };
});
console.log("[3] REF HEART STATE (post-toggle):", JSON.stringify(heartStates));

await browser.close();
console.log("PROBE r59a3 COMPLETE");
