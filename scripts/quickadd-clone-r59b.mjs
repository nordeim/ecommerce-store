// Round-59 probe B: the CLONE's related-card quick-add — the same axes as
// r59a2 + the server-action superset states (the in-flight window, the
// double-click transactional landing). Runs against the production
// standalone on :3000 (booted by the caller, killed after).
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r("TIMEOUT:" + what), ms))]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
console.log("[1] login + navigate to the headphones PDP…");
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

// scroll the related card into view
await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  grid.children[0].scrollIntoView({ block: "center" });
});
await page.waitForTimeout(600);

// [2] the card container's full class
const container = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const group = card.querySelector("div.group") || card;
  return {
    cardChildCls: card.children[0] ? card.children[0].className : "none",
    groupCls: group !== card ? group.className : "card-is-group",
    overflow: getComputedStyle(group).overflow,
    cardNames: [...grid.children].map((c) => c.querySelector("h3")?.textContent?.trim()),
  };
});
console.log("[2] CONTAINER:", JSON.stringify(container));

// [3] hover the card (in-view)
const rect = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const group = card.querySelector("div.group") || card;
  const r = group.getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height * 0.25 };
});
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

// [4] hover the Add button (its own hover bg)
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
  return { bg: getComputedStyle(addBtn).backgroundColor };
});
console.log("[4] ADD-BTN HOVER bg:", JSON.stringify(addHover));

// [5] mouse DOWN state
await page.mouse.down();
await page.waitForTimeout(150);
const activeState = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const addBtn = [...card.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const cs = getComputedStyle(addBtn);
  return { bg: cs.backgroundColor, transform: cs.transform };
});
await page.mouse.up();
await page.waitForTimeout(100);
console.log("[5] MOUSE-DOWN state:", JSON.stringify(activeState));

// [6] the CLICK: badge + toast + network (the server-action POST) + in-flight window
const badgeBefore = await page.evaluate(() => {
  const header = document.querySelector("header");
  const btns = header ? [...header.querySelectorAll("button")] : [];
  const cartBtn = btns.find((b) => b.querySelector("svg") && /bag|cart/i.test(b.innerHTML));
  return { text: cartBtn?.textContent?.trim() || null, aria: cartBtn?.getAttribute("aria-label") };
});
const netEvents = [];
page.on("request", (req) => {
  if (req.resourceType() === "xhr" || req.resourceType() === "fetch") netEvents.push("R:" + req.method() + " " + req.url().slice(0, 60));
});
await page.mouse.click(addRect.cx, addRect.cy);
// sample the in-flight window at ~60ms and ~180ms
await page.waitForTimeout(60);
const inFlight = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const addBtn = [...card.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const cs = getComputedStyle(addBtn);
  const header = document.querySelector("header");
  const cartBtn = [...header.querySelectorAll("button")].find((b) => b.querySelector("svg") && /bag|cart/i.test(b.innerHTML));
  return { disabled: addBtn.disabled, opacity: cs.opacity, cursor: cs.cursor, badgeNow: cartBtn?.textContent?.trim() || null };
});
console.log("[6a] IN-FLIGHT (+60ms):", JSON.stringify(inFlight));
await page.waitForTimeout(500);
const afterClick = await page.evaluate(() => {
  const header = document.querySelector("header");
  const btns = [...header.querySelectorAll("button")];
  const cartBtn = btns.find((b) => b.querySelector("svg") && /bag|cart/i.test(b.innerHTML));
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
    badge: { text: cartBtn?.textContent?.trim() || null, aria: cartBtn?.getAttribute("aria-label") },
    toast,
    url: location.pathname,
    drawerOpen: !!document.querySelector("[role='dialog']"),
  };
});
console.log("[6b] CLICK:", JSON.stringify({ badgeBefore, afterClick, netEvents: netEvents.slice(0, 6) }));

// [7] toast lifetime + badge persistence
await page.waitForTimeout(3200);
const afterToast = await page.evaluate(() => {
  const header = document.querySelector("header");
  const cartBtn = [...header.querySelectorAll("button")].find((b) => b.querySelector("svg") && /bag|cart/i.test(b.innerHTML));
  let toastGone = true;
  for (const d of document.querySelectorAll("body *")) {
    if (/added to cart/i.test(d.textContent || "") && getComputedStyle(d).position === "fixed") toastGone = false;
  }
  return { badge: cartBtn?.textContent?.trim() || null, toastGone };
});
console.log("[7] AFTER-TOAST:", JSON.stringify({ ...afterToast, moreNet: netEvents.slice(6, 12) }));

// [8] double-click rapid — both server actions land
const badgeNow = await page.evaluate(() => {
  const header = document.querySelector("header");
  const cartBtn = [...header.querySelectorAll("button")].find((b) => b.querySelector("svg") && /bag|cart/i.test(b.innerHTML));
  return cartBtn?.textContent?.trim() || "0";
});
await page.mouse.click(addRect.cx, addRect.cy);
await page.waitForTimeout(100);
await page.mouse.click(addRect.cx, addRect.cy);
await page.waitForTimeout(900);
const afterDouble = await page.evaluate(() => {
  const header = document.querySelector("header");
  const cartBtn = [...header.querySelectorAll("button")].find((b) => b.querySelector("svg") && /bag|cart/i.test(b.innerHTML));
  return { badge: cartBtn?.textContent?.trim() || null, aria: cartBtn?.getAttribute("aria-label") };
});
console.log("[8] DOUBLE-CLICK:", JSON.stringify({ before: badgeNow, after: afterDouble, netEvents: netEvents.slice(12, 20) }));

// [9] the FOCUS WALK — the addbar reveal on focus? + the Add ring
await page.mouse.move(512, 20, { steps: 8 });
await page.waitForTimeout(300);
await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  grid.querySelector("a")?.focus();
});
await page.waitForTimeout(250);
await page.keyboard.press("Tab"); // -> heart button
await page.waitForTimeout(250);
await page.keyboard.press("Tab"); // -> Add button (probably)
await page.waitForTimeout(350);
const focusState = await page.evaluate(() => {
  const a = document.activeElement;
  const isAdd = /add to cart/i.test(a?.textContent || "");
  let addbarT = null;
  if (a) {
    const card = a.closest("div.group");
    const addbar = card?.querySelector("div.absolute.inset-x-0.bottom-0, div[class*='translate-y']");
    addbarT = addbar ? getComputedStyle(addbar).transform : null;
  }
  const cs = a ? getComputedStyle(a) : null;
  return {
    active: a?.tagName + ":" + (a?.getAttribute("aria-label") || a?.textContent || "").trim().slice(0, 24),
    isAddBtn: isAdd,
    boxShadow: cs?.boxShadow.slice(0, 110) || null,
    addbarTransformOnFocus: addbarT,
  };
});
console.log("[9] FOCUS WALK:", JSON.stringify(focusState));

// [10] the cart state after the probe (for the caller's cleanup knowledge)
const cartState = await page.evaluate(() => {
  const header = document.querySelector("header");
  const cartBtn = [...header.querySelectorAll("button")].find((b) => b.querySelector("svg") && /bag|cart/i.test(b.innerHTML));
  return cartBtn?.textContent?.trim() || null;
});
console.log("[10] FINAL BADGE (dev-DB residue):", cartState);

await browser.close();
console.log("PROBE r59b COMPLETE");
