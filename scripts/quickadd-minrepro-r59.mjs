// Round-59 MINIMAL REPRO: does keyboard focus on the Add button VISUALLY
// reveal the clone's addbar? Two cases: (1) NO hover history — walk to the
// Add on a fresh page; (2) after a hover+away cycle (the translate settled
// at 100%). The instrument: the RECT (geometry = the visual truth) vs the
// computed translate (which may report the pre-focus value). Plus the
// paint check: elementFromPoint at the revealed position.
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

const read = (tag) => page.evaluate((t) => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const addbar = card.querySelector("div.absolute.inset-x-0");
  const btn = [...card.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const ar = addbar.getBoundingClientRect();
  const br = btn.getBoundingClientRect();
  const a = document.activeElement;
  return {
    tag: t,
    addbarRectY: Math.round(ar.y), // 376 = natural/revealed; 432 = translated/hidden
    btnRectY: Math.round(br.y),    // 388 = revealed; 444 = hidden
    computedTranslate: getComputedStyle(addbar).translate,
    computedTransform: getComputedStyle(addbar).transform,
    active: a ? (a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 14) : "body",
    focusVisible: a === btn ? a.matches(":focus-visible") : null,
  };
}, tag);

// CASE 1: NO hover history — walk straight to the Add.
await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  grid.querySelector("a")?.focus();
});
await page.keyboard.press("Tab");
await page.waitForTimeout(300);
await page.keyboard.press("Tab");
await page.waitForTimeout(400);
console.log(JSON.stringify(await read("case1-no-hover-add-focused")));
await page.keyboard.press("Escape"); // no-op; blur via body
await page.evaluate(() => document.activeElement?.blur?.());
await page.waitForTimeout(300);
console.log(JSON.stringify(await read("case1-blurred")));

// CASE 2: hover cycle first (reveal → hide settled), then walk.
const rect = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const r = grid.children[0].querySelector("div.group").getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height * 0.25 };
});
await page.mouse.move(rect.cx, rect.cy, { steps: 6 });
await page.waitForTimeout(600);
console.log(JSON.stringify(await read("case2-hovered")));
await page.mouse.move(512, 20, { steps: 8 });
await page.waitForTimeout(600);
console.log(JSON.stringify(await read("case2-mouse-away-settled")));
await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  grid.querySelector("a")?.focus();
});
await page.keyboard.press("Tab");
await page.waitForTimeout(300);
await page.keyboard.press("Tab");
await page.waitForTimeout(400);
console.log(JSON.stringify(await read("case2-add-focused")));
await page.waitForTimeout(1500);
console.log(JSON.stringify(await read("case2-add-focused+1500ms")));

await browser.close();
console.log("MINIMAL REPRO COMPLETE");
