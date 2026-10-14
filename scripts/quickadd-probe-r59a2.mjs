// Round-59 probe A2: the reference's related-card quick-add — WITH THE SCROLL
// DISCIPLINE (r59a's hover/click coordinates were clamped below the 768px
// viewport — the related section sits at y≈1132; mouse.move/click never
// scroll. scrollIntoView FIRST, then re-measure every in-view interaction).
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
console.log("[1] navigating to the headphones PDP…");
await withTimeout(page.goto(REF + "/product/wireless-headphones", { waitUntil: "domcontentloaded" }), 30000, "pdp-goto");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1200);

// scroll the related card into view (the r59a viewport trap)
await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  grid.children[0].scrollIntoView({ block: "center" });
});
await page.waitForTimeout(600);

// [2] the card container's FULL class (the overflow-hidden + hover:shadow-xl in the related context)
const container = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const group = card.querySelector("div.group") || card; // the card's inner group div (clone structure) or card itself
  return { cardCls: card.className, groupCls: group !== card ? group.className : "card-is-group", overflow: getComputedStyle(card).overflow };
});
console.log("[2] CONTAINER:", JSON.stringify(container));

// [3] hover the card properly (in-view coordinates)
const rect = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const r = grid.children[0].getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height * 0.25, x: r.x, y: r.y, w: r.width, h: r.height, inView: r.y > 0 && r.y < 700 };
});
console.log("[3] card rect (inView " + rect.inView + "):", JSON.stringify({ x: rect.x, y: rect.y, w: rect.w, h: rect.h }));
await page.mouse.move(rect.cx, rect.cy, { steps: 6 });
await page.waitForTimeout(500);
const hovered = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const addbar = card.querySelector("div.absolute.inset-x-0.bottom-0, div[class*='translate-y']");
  const cs = getComputedStyle(addbar);
  return { transform: cs.transform, transition: cs.transition };
});
console.log("[3] HOVERED addbar:", JSON.stringify(hovered));

// [4] hover the Add button itself (its own hover bg)
const addRect = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const addBtn = [...card.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const r = addBtn.getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height / 2, inView: r.y > 0 && r.y < 700 };
});
await page.mouse.move(addRect.cx, addRect.cy, { steps: 4 });
await page.waitForTimeout(400);
const addHover = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const addBtn = [...card.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const cs = getComputedStyle(addBtn);
  return { bg: cs.backgroundColor, inView: true };
});
console.log("[4] ADD-BTN HOVER bg:", JSON.stringify(addHover));

// [5] mouse DOWN state (active) — measure during press
await page.mouse.move(addRect.cx, addRect.cy);
await page.mouse.down();
await page.waitForTimeout(150);
const activeState = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const addBtn = [...card.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const cs = getComputedStyle(addBtn);
  return { bg: cs.backgroundColor, transform: cs.transform, boxShadow: cs.boxShadow.slice(0, 80) };
});
await page.mouse.up();
await page.waitForTimeout(100);
console.log("[5] MOUSE-DOWN (active) state:", JSON.stringify(activeState));

// [6] the CLICK behavior — badge + toast + network + URL (proper in-view)
const badgeBefore = await page.evaluate(() => {
  const header = document.querySelector("header");
  const btns = header ? [...header.querySelectorAll("button")] : [];
  const cartBtn = btns.find((b) => b.querySelector("svg") && /bag|cart/i.test(b.innerHTML));
  return { text: cartBtn?.textContent?.trim() || null, childSpans: cartBtn ? cartBtn.querySelectorAll("span").length : 0 };
});
const netEvents = [];
page.on("request", (req) => {
  if (req.resourceType() === "xhr" || req.resourceType() === "fetch") netEvents.push("R:" + req.method() + " " + req.url().slice(0, 70));
});
await page.mouse.click(addRect.cx, addRect.cy);
await page.waitForTimeout(800);
const afterClick = await page.evaluate(() => {
  const header = document.querySelector("header");
  const btns = header ? [...header.querySelectorAll("button")] : [];
  const cartBtn = btns.find((b) => b.querySelector("svg") && /bag|cart/i.test(b.innerHTML));
  // the toast: a fixed bottom-right box carrying "added to cart"
  let toast = null;
  for (const d of document.querySelectorAll("body *")) {
    const st = getComputedStyle(d);
    const r = d.getBoundingClientRect();
    if (st.position === "fixed" && r.y > 500 && /added to cart/i.test(d.textContent || "") && d.children.length < 6) {
      toast = { text: d.textContent?.trim().slice(0, 60), bg: st.backgroundColor, y: Math.round(r.y) };
      break;
    }
  }
  return {
    badge: { text: cartBtn?.textContent?.trim() || null, spans: cartBtn ? cartBtn.querySelectorAll("span").length : 0 },
    toast,
    url: location.pathname,
    drawerOpen: !!document.querySelector("[role='dialog']"),
  };
});
console.log("[6] CLICK:", JSON.stringify({ badgeBefore, afterClick, netEvents: netEvents.slice(0, 6) }));

// [7] the toast's lifetime + the settle (badge persists after toast gone)
await page.waitForTimeout(3200);
const afterToast = await page.evaluate(() => {
  const header = document.querySelector("header");
  const btns = header ? [...header.querySelectorAll("button")] : [];
  const cartBtn = btns.find((b) => b.querySelector("svg") && /bag|cart/i.test(b.innerHTML));
  let toastGone = true;
  for (const d of document.querySelectorAll("body *")) {
    if (/added to cart/i.test(d.textContent || "") && getComputedStyle(d).position === "fixed") toastGone = false;
  }
  return { badge: cartBtn?.textContent?.trim() || null, toastGone };
});
console.log("[7] AFTER-TOAST:", JSON.stringify({ ...afterToast, moreNet: netEvents.slice(6, 12) }));

// [8] double-click (two rapid clicks) — the client-state answer
const badgeNow = await page.evaluate(() => {
  const header = document.querySelector("header");
  const btns = [...header.querySelectorAll("button")];
  const cartBtn = btns.find((b) => b.querySelector("svg") && /bag|cart/i.test(b.innerHTML));
  return cartBtn?.textContent?.trim() || "0";
});
await page.mouse.click(addRect.cx, addRect.cy);
await page.waitForTimeout(100);
await page.mouse.click(addRect.cx, addRect.cy);
await page.waitForTimeout(600);
const afterDouble = await page.evaluate(() => {
  const header = document.querySelector("header");
  const btns = [...header.querySelectorAll("button")];
  const cartBtn = btns.find((b) => b.querySelector("svg") && /bag|cart/i.test(b.innerHTML));
  return { badge: cartBtn?.textContent?.trim() || null };
});
console.log("[8] DOUBLE-CLICK:", JSON.stringify({ before: badgeNow, after: afterDouble }));

await browser.close();
console.log("PROBE r59a2 COMPLETE");
