// Round-59 probe B2: the clone's addbar translate (the V4 SPELLING — v4
// writes translate-y-* into the `translate` property, NOT `transform`) + the
// FULL focus-ring boxShadow (L77: never truncate — the ring layer hides
// behind the cut). Settles: (a) the addbar's resting/hovered/focus states,
// (b) the Add button's full focus ring vs the reference's
// `rgb(255,255,255) 0px, rgb(230,107,26) 0px 0px 0px 1px, shadow-lg pair`.
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r("TIMEOUT:" + what), ms))]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await withTimeout(page.goto(CLONE + "/login", { waitUntil: "domcontentloaded" }), 20000, "login-goto");
await withTimeout(page.getByLabel("Email").fill("john@example.com"), 12000, "email-fill");
await withTimeout(page.getByLabel("Password").fill("Demo1234!"), 12000, "pw-fill");
await withTimeout(page.getByRole("button", { name: "Log in", exact: true }).click(), 12000, "login-click");
try {
  await withTimeout(page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 }), 18000, "login-nav");
} catch {}
await withTimeout(page.goto(CLONE + "/product/wireless-headphones", { waitUntil: "domcontentloaded" }), 20000, "pdp-goto");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1000);

const findCard = () => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  return grid.children[0];
};
await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  grid.children[0].scrollIntoView({ block: "center" });
});
await page.waitForTimeout(500);

// [1] RESTING addbar: translate + transform + the transition
const resting = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const addbar = grid.children[0].querySelector("div.absolute.inset-x-0.bottom-0");
  const cs = getComputedStyle(addbar);
  return { translate: cs.translate, transform: cs.transform, transition: cs.transitionDuration + " " + cs.transitionProperty };
});
console.log("[1] RESTING addbar:", JSON.stringify(resting));

// [2] HOVERED addbar (in-view hover)
const rect = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const r = grid.children[0].querySelector("div.group").getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height * 0.25 };
});
await page.mouse.move(rect.cx, rect.cy, { steps: 6 });
await page.waitForTimeout(500);
const hovered2 = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const addbar = grid.children[0].querySelector("div.absolute.inset-x-0.bottom-0");
  const cs = getComputedStyle(addbar);
  return { translate: cs.translate, transform: cs.transform };
});
console.log("[2] HOVERED addbar:", JSON.stringify(hovered2));

// [3] FOCUS (no hover): the addbar's translate + the Add button's FULL ring
await page.mouse.move(512, 20, { steps: 8 });
await page.waitForTimeout(300);
await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  grid.querySelector("a")?.focus();
});
await page.keyboard.press("Tab"); // heart
await page.keyboard.press("Tab"); // add btn
await page.waitForTimeout(400);
const focusState = await page.evaluate(() => {
  const a = document.activeElement;
  const card = a?.closest("div.group");
  const addbar = card?.querySelector("div.absolute.inset-x-0.bottom-0");
  const cs = a ? getComputedStyle(a) : null;
  return {
    active: a?.tagName + ":" + (a?.getAttribute("aria-label") || a?.textContent || "").trim().slice(0, 24),
    addbarTranslate: addbar ? getComputedStyle(addbar).translate : null,
    addBtnBoxShadowFULL: cs ? cs.boxShadow : null,
    outline: cs ? cs.outlineWidth + " " + cs.outlineStyle + " " + cs.outlineColor : null,
  };
});
console.log("[3] FOCUS:", JSON.stringify(focusState, null, 1));

// [4] the heart's focus ring (full) for the family record
await page.keyboard.press("Shift+Tab");
await page.waitForTimeout(350);
const heartFocus = await page.evaluate(() => {
  const a = document.activeElement;
  const cs = getComputedStyle(a);
  return {
    active: a?.tagName + ":" + (a?.getAttribute("aria-label") || "").slice(0, 30),
    boxShadowFULL: cs.boxShadow,
  };
});
console.log("[4] HEART FOCUS:", JSON.stringify(heartFocus, null, 1));

// [5] keyboard Enter on the focused heart (the a11y path) — no DB write expected (toggle)
const heartBefore = await page.evaluate(() => {
  const a = document.activeElement;
  return a?.getAttribute("aria-pressed");
});
await page.keyboard.press("Enter");
await page.waitForTimeout(700);
const heartAfter = await page.evaluate(() => {
  const header = document.querySelector("header");
  const cartBtn = [...header.querySelectorAll("button")].find((b) => b.querySelector("svg") && /bag|cart/i.test(b.innerHTML));
  let toast = null;
  for (const d of document.querySelectorAll("body *")) {
    if (getComputedStyle(d).position === "fixed" && /wishlist/i.test(d.textContent || "") && d.getBoundingClientRect().y > 500) {
      toast = d.textContent?.trim().slice(0, 50);
      break;
    }
  }
  return { aria: document.activeElement?.getAttribute("aria-pressed"), badge: cartBtn?.textContent?.trim(), toast };
});
console.log("[5] HEART ENTER:", JSON.stringify({ before: heartBefore, after: heartAfter }));

await browser.close();
console.log("PROBE r59b2 COMPLETE");
