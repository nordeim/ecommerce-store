// Round-59 micro-test: at the pre-310 moment (the Add keyboard-focused,
// mouse away), read EVERYTHING on the addbar: its own rect, the computed
// translate, the resolved --tw-translate-y, the ACTUAL CSS selector match
// (:is(:where(.group):hover *)), the group's :hover chain, and the
// elementFromPoint at the button's rect center — settle the contradiction
// between btnRect y=388 (revealed geometry) and translate "0px 100%".
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3001";
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

await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  grid.children[0].scrollIntoView({ block: "center" });
});
await page.waitForTimeout(500);

// hover the card, click the revealed Add (the capture sequence), mouse away, walk
const rect = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const r = grid.children[0].querySelector("div.group").getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height * 0.25 };
});
await page.mouse.move(rect.cx, rect.cy, { steps: 6 });
await page.waitForTimeout(600);
const addRect = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const addBtn = [...card.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const r = addBtn.getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
});
await page.mouse.click(addRect.cx, addRect.cy);
await page.waitForTimeout(600);
await page.mouse.move(512, 20, { steps: 8 });
await page.waitForTimeout(500);
await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  grid.querySelector("a")?.focus();
});
await page.keyboard.press("Tab");
await page.waitForTimeout(400);
await page.keyboard.press("Tab");
await page.waitForTimeout(600);

const micro = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const group = card.querySelector("div.group");
  const addbar = card.querySelector("div.absolute.inset-x-0");
  const btn = [...card.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const cs = getComputedStyle(addbar);
  const ar = addbar.getBoundingClientRect();
  const br = btn.getBoundingClientRect();
  const csAfter = getComputedStyle(addbar).translate; // re-read AFTER the rects (order test)
  const at = document.elementFromPoint(br.x + br.width / 2, br.y + br.height / 2);
  return {
    addbarRect: { y: Math.round(ar.y), h: Math.round(ar.height) },
    btnRect: { y: Math.round(br.y), h: Math.round(br.height) },
    computedTranslate: cs.translate,
    computedTranslateAfterRects: csAfter,
    twVar: cs.getPropertyValue("--tw-translate-y"),
    cssSelectorMatch: addbar.matches(":is(:where(.group):hover *)"),
    groupHover: group.matches(":hover"),
    groupHoverAnyAncestor: (function () {
      let el = group.parentElement;
      while (el) { if (el.matches(":hover")) return el.tagName + "." + (el.className || "").toString().slice(0, 40); el = el.parentElement; }
      return null;
    })(),
    btnMatchesSelector: btn.matches(":is(:where(.group):hover *)"),
    hitAtBtnCenter: at ? at.tagName + ":" + (at.getAttribute("aria-label") || at.textContent || "").trim().slice(0, 16) : "null",
    scrollY: Math.round(window.scrollY),
  };
});
console.log(JSON.stringify(micro, null, 1));
await browser.close();
console.log("MICRO-TEST COMPLETE");
