// Round-59 probe A: the REFERENCE's PDP related-products quick-add family —
// the sweep's seventeenth installment. The r51 CARD-HOVER round pinned the
// shop-grid card's HOVER geometry; the quick-add's INTERACTION states in the
// PDP related context were never measured: the click behavior (network? badge?
// toast? navigation?), the focus-within reveal question (does the addbar
// reveal on keyboard focus?), the Add button's focus/active states, and the
// double-click behavior. L81 (full class strings), L82 (enumerate children),
// L83 (coordinate-based interactions) apply.
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

// — [2] the related section structure + a card's resting anatomy —
const resting = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  if (!relH2) return { error: "no You May Also Like h2" };
  const section = relH2.closest("section") || relH2.parentElement;
  const grid = section.querySelector("div.grid, ul, div.grid-cols-2");
  const cards = grid ? [...grid.children] : [];
  const card = cards[0];
  if (!card) return { error: "no related card", h2: relH2.textContent };
  const r = card.getBoundingClientRect();
  const addbar = card.querySelector("div.absolute.inset-x-0.bottom-0, div[class*='translate-y']") || null;
  const addBtn = [...card.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const heart = [...card.querySelectorAll("button")].find((b) => b.querySelector("svg") && !/add to cart/i.test(b.textContent || ""));
  const readEl = (el) => {
    if (!el) return null;
    const er = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName,
      fullCls: (el.getAttribute("class") || ""),
      x: Math.round(er.x), y: Math.round(er.y), w: Math.round(er.width), h: Math.round(er.height),
      transform: cs.transform, opacity: cs.opacity, pointerEvents: cs.pointerEvents,
      bg: cs.backgroundColor, color: cs.color, transition: cs.transition,
    };
  };
  return {
    h2: (relH2.textContent || "").trim(),
    h2Cls: relH2.getAttribute("class"),
    gridCls: grid ? grid.getAttribute("class") : null,
    cardCount: cards.length,
    cardNames: cards.slice(0, 4).map((c) => c.querySelector("h3, h2")?.textContent?.trim()),
    card: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    addbar: readEl(addbar),
    addBtn: addBtn ? { ...readEl(addBtn), text: addBtn.textContent?.trim(), type: addBtn.type } : null,
    heart: heart ? { ...readEl(heart), ariaLabel: heart.getAttribute("aria-label") } : null,
    buttonCount: card.querySelectorAll("button").length,
  };
});
console.log("[2] RESTING:", JSON.stringify(resting, null, 1));

// — [3] hover the card (coordinate-based, L83) — the reveal + the Add hover —
const cardRect = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid, ul, div.grid-cols-2");
  const r = grid.children[0].getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + 20 };
});
await page.mouse.move(cardRect.cx, cardRect.cy, { steps: 5 });
await page.waitForTimeout(450);

const hovered = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid, ul, div.grid-cols-2");
  const card = grid.children[0];
  const addbar = card.querySelector("div.absolute.inset-x-0.bottom-0, div[class*='translate-y']");
  const addBtn = [...card.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const readT = (el) => {
    const cs = getComputedStyle(el);
    const er = el.getBoundingClientRect();
    return { transform: cs.transform, y: Math.round(er.y), h: Math.round(er.height), visible: er.height > 4 && cs.opacity !== "0" };
  };
  return { addbar: addbar ? readT(addbar) : null, addBtn: addBtn ? readT(addBtn) : null };
});
console.log("[3] HOVERED:", JSON.stringify(hovered));

// — [4] the Add button's HOVER state (mouse over the button itself) —
const addBtnRect = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid, ul, div.grid-cols-2");
  const card = grid.children[0];
  const addBtn = [...card.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const r = addBtn.getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
});
await page.mouse.move(addBtnRect.cx, addBtnRect.cy, { steps: 3 });
await page.waitForTimeout(300);
const addHover = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid, ul, div.grid-cols-2");
  const card = grid.children[0];
  const addBtn = [...card.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const cs = getComputedStyle(addBtn);
  return { bg: cs.backgroundColor, color: cs.color, boxShadow: cs.boxShadow.slice(0, 90) };
});
console.log("[4] ADD-BTN HOVER:", JSON.stringify(addHover));

// — [5] the CLICK behavior: network watch + badge + toast + URL —
const badgeBefore = await page.evaluate(() => {
  const header = document.querySelector("header");
  const btns = header ? [...header.querySelectorAll("button")] : [];
  const cartBtn = btns.find((b) => b.querySelector("svg") && /bag|cart/i.test(b.innerHTML));
  return { text: cartBtn?.textContent?.trim() || null, aria: cartBtn?.getAttribute("aria-label") };
});
const netEvents = [];
page.on("request", (req) => {
  if (req.resourceType() === "xhr" || req.resourceType() === "fetch") netEvents.push("R:" + req.method() + " " + req.url().slice(0, 80));
});
await page.mouse.click(addBtnRect.cx, addBtnRect.cy);
await page.waitForTimeout(700);
const afterClick = await page.evaluate(() => {
  const header = document.querySelector("header");
  const btns = header ? [...header.querySelectorAll("button")] : [];
  const cartBtn = btns.find((b) => b.querySelector("svg") && /bag|cart/i.test(b.innerHTML));
  const toasts = [...document.querySelectorAll("body > div, body > div > div")].filter((d) => {
    const t = (d.textContent || "").toLowerCase();
    return /added to cart/.test(t) && d.getBoundingClientRect().width > 100;
  });
  return {
    badge: { text: cartBtn?.textContent?.trim() || null, aria: cartBtn?.getAttribute("aria-label") },
    toastCount: toasts.length,
    toastText: toasts[0]?.textContent?.trim().slice(0, 60) || null,
    url: location.pathname,
  };
});
console.log("[5] CLICK:", JSON.stringify({ badgeBefore, afterClick, netEvents: netEvents.slice(0, 8) }));

// — [6] the double-click behavior (two rapid clicks) —
await page.mouse.click(addBtnRect.cx, addBtnRect.cy);
await page.waitForTimeout(120);
await page.mouse.click(addBtnRect.cx, addBtnRect.cy);
await page.waitForTimeout(700);
const afterDouble = await page.evaluate(() => {
  const header = document.querySelector("header");
  const btns = header ? [...header.querySelectorAll("button")] : [];
  const cartBtn = btns.find((b) => b.querySelector("svg") && /bag|cart/i.test(b.innerHTML));
  return { badge: cartBtn?.textContent?.trim() || null };
});
console.log("[6] DOUBLE-CLICK badge:", JSON.stringify({ ...afterDouble, netEvents: netEvents.slice(0, 14) }));

// — [7] the FOCUS-WITHIN reveal question: Tab into the card's heart —
// Move the mouse AWAY first (so no hover state interferes), then keyboard-focus.
await page.mouse.move(512, 20, { steps: 8 });
await page.waitForTimeout(250);
await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid, ul, div.grid-cols-2");
  // start the Tab walk from the related section's first link
  const firstLink = grid.querySelector("a");
  firstLink?.focus();
});
await page.waitForTimeout(250);
const focusState1 = await page.evaluate(() => {
  const a = document.activeElement;
  const card = a?.closest("div.grid")?.children[0] || a?.closest("div.group, div[class*='group']");
  const addbar = card?.querySelector("div.absolute.inset-x-0.bottom-0, div[class*='translate-y']");
  const cs = addbar ? getComputedStyle(addbar) : null;
  return { active: a?.tagName + ":" + (a?.textContent || "").trim().slice(0, 20), addbarTransform: cs?.transform || null };
});
// Tab onward: heart button is next in the card
await page.keyboard.press("Tab");
await page.waitForTimeout(350);
const focusState2 = await page.evaluate(() => {
  const a = document.activeElement;
  const card = a?.closest("div.grid")?.children[0] || a?.closest("div.group, div[class*='group']");
  let addbarT = null, addBtnShadow = null;
  if (card) {
    const addbar = card.querySelector("div.absolute.inset-x-0.bottom-0, div[class*='translate-y']");
    addbarT = addbar ? getComputedStyle(addbar).transform : null;
    const addBtn = [...card.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
    addBtnShadow = addBtn ? getComputedStyle(addBtn).boxShadow.slice(0, 100) : null;
  }
  return {
    active: a?.tagName + ":" + (a?.getAttribute("aria-label") || a?.textContent || "").trim().slice(0, 24),
    addbarTransform: addbarT,
    addBtnFocusShadow: addBtnShadow,
  };
});
// Tab once more — the Add button itself
await page.keyboard.press("Tab");
await page.waitForTimeout(350);
const focusState3 = await page.evaluate(() => {
  const a = document.activeElement;
  const isAdd = /add to cart/i.test(a?.textContent || "");
  const cs = a ? getComputedStyle(a) : null;
  return {
    active: a?.tagName + ":" + (a?.textContent || a?.getAttribute("aria-label") || "").trim().slice(0, 24),
    isAddBtn: isAdd,
    boxShadow: cs?.boxShadow.slice(0, 110) || null,
    outline: cs?.outlineWidth + " " + cs?.outlineStyle + " " + cs?.outlineColor,
  };
});
console.log("[7] FOCUS WALK:", JSON.stringify({ focusState1, focusState2, focusState3 }));

// — [8] Enter-activation on the focused Add button (if focused) —
const enterTest = await page.evaluate(() => {
  const a = document.activeElement;
  return /add to cart/i.test(a?.textContent || "");
});
if (enterTest) {
  const net2 = [];
  page.on("request", (req) => {
    if (req.resourceType() === "xhr" || req.resourceType() === "fetch") net2.push("R:" + req.method());
  });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(600);
  const post = await page.evaluate(() => {
    const header = document.querySelector("header");
    const btns = header ? [...header.querySelectorAll("button")] : [];
    const cartBtn = btns.find((b) => b.querySelector("svg") && /bag|cart/i.test(b.innerHTML));
    return { badge: cartBtn?.textContent?.trim() || null, url: location.pathname };
  });
  console.log("[8] ENTER-ACTIVATION:", JSON.stringify({ post, net2: net2.slice(0, 6) }));
} else {
  console.log("[8] ENTER-ACTIVATION skipped (Add button not focused)");
}

await browser.close();
console.log("PROBE r59a COMPLETE");
