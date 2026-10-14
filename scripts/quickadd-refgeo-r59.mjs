// Round-59 THE CROSS-ENGINE QUESTION: does the REFERENCE's addbar (v3
// transform-based translate-y-full) ALSO geometrically reveal when its Add
// button is focused? The r59a [7] walk read only the COMPUTED transform
// (matrix ...56 = hidden); the geometry (rect + hit test) was never read.
// If the reference also reveals -> the shared engine trait (parity). If it
// stays hidden -> the clone's focus-reveal is a REAL divergence.
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
await page.waitForTimeout(600);

const probe = (tag) => page.evaluate((t) => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const group = card.querySelector("div.group") || card; // the reference's card IS the group (r59a2)
  const link = group.querySelector("a");
  const addbar = card.querySelector("div.absolute.inset-x-0");
  const btn = [...card.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const ar = addbar.getBoundingClientRect();
  const br = btn.getBoundingClientRect();
  const lr = link.getBoundingClientRect();
  const at = (x, y) => {
    const el = document.elementFromPoint(x, y);
    return el ? (el.textContent || el.tagName).trim().slice(0, 16) : "null";
  };
  return {
    tag: t,
    linkBottom: Math.round(lr.bottom),
    addbarRect: [Math.round(ar.y), Math.round(ar.bottom)],
    btnRect: [Math.round(br.y), Math.round(br.bottom)],
    computedTransform: getComputedStyle(addbar).transform,
    hitAtNatural: at(br.x + br.width / 2, lr.bottom - 28),
    hitAtTranslated: at(br.x + br.width / 2, lr.bottom + 28),
    btnFocused: document.activeElement === btn,
    scrollY: Math.round(window.scrollY),
  };
}, tag);

console.log(JSON.stringify(await probe("ref-a-rest")));
await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const btn = [...card.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  btn.focus();
});
await page.waitForTimeout(400);
console.log(JSON.stringify(await probe("ref-b-script-focused")));
await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  [...grid.children[0].querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""))?.blur();
});
await page.waitForTimeout(400);
console.log(JSON.stringify(await probe("ref-c-blurred")));

// and the keyboard walk form (the r59a [7] instrument, now with geometry)
await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  grid.querySelector("a")?.focus();
});
await page.keyboard.press("Tab");
await page.keyboard.press("Tab");
await page.waitForTimeout(400);
console.log(JSON.stringify(await probe("ref-d-tab-walk-add-focused")));

await browser.close();
console.log("REFERENCE GEOMETRY PROBE COMPLETE");
