// Round-59 probe A4/B4 combined: the related section @375 (the mobile pass —
// the r58 convention). The reference + the clone, the resting geometry of the
// section (grid cols, card size, addbar, Add button) at the iPhone-class
// viewport. Run twice: REF=reference URL or CLONE. Usage:
//   node quickadd-mobile-r59.mjs ref|clone  (clone needs :3000 up)
import { chromium } from "playwright-core";

const which = process.argv[2] || "ref";
const BASE = which === "ref" ? "https://fuzzy-lumina-style-hub.base44.app" : "http://localhost:3000";
const EMAIL = which === "ref" ? "sepnetflix2023@outlook.com" : "john@example.com";
const PW = which === "ref" ? "$Abcd1234" : "Demo1234!";
const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r("TIMEOUT:" + what), ms))]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 664 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const lp = await ctx.newPage();
await withTimeout(lp.goto(BASE + "/login", { waitUntil: "domcontentloaded" }), 25000, "login-goto");
await withTimeout(lp.getByLabel("Email").fill(EMAIL), 15000, "email-fill");
await withTimeout(lp.getByLabel("Password").fill(PW), 15000, "pw-fill");
await withTimeout(lp.getByRole("button", { name: "Log in", exact: true }).click(), 15000, "login-click");
try {
  await withTimeout(lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }), 28000, "login-nav");
} catch {}
await lp.waitForTimeout(1200);
await lp.close();

const page = await ctx.newPage();
await withTimeout(page.goto(BASE + "/product/wireless-headphones", { waitUntil: "domcontentloaded" }), 30000, "pdp-goto");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1200);

const m = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  if (!relH2) return { error: "no related h2" };
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const group = card.querySelector("div.group") || card;
  const addbar = card.querySelector("div.absolute.inset-x-0.bottom-0");
  const addBtn = [...card.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const heart = [...card.querySelectorAll("button")].find((b) => b.querySelector("svg") && !/add to cart/i.test(b.textContent || ""));
  const r = group.getBoundingClientRect();
  const ab = addBtn.getBoundingClientRect();
  const hb = heart.getBoundingClientRect();
  const gridCs = getComputedStyle(grid);
  const addbarCs = getComputedStyle(addbar);
  return {
    gridCls: grid.getAttribute("class"),
    gridCols: gridCs.gridTemplateColumns,
    card: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    addbar: { translate: addbarCs.translate, w: Math.round(addbar.getBoundingClientRect().width), p: addbarCs.padding },
    addBtn: { w: Math.round(ab.width), h: Math.round(ab.height), font: getComputedStyle(addBtn).fontSize },
    heart: { w: Math.round(hb.width), h: Math.round(hb.height), x: Math.round(hb.x), y: Math.round(hb.y) },
    cardCount: grid.children.length,
  };
});
console.log("[" + which + " @375] RELATED:", JSON.stringify(m, null, 1));
await browser.close();
console.log("PROBE r59-mobile-" + which + " COMPLETE");
