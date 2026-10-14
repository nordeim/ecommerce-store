// Round-59 ABSOLUTE minimal repro: (a) the addbar's rect at rest;
// (b) script .focus() on the Add button directly (no Tab walk); (c) the
// rect; (d) blur; (e) the rect. Plus the DEFINITIVE VISUAL instruments:
// elementFromPoint at BOTH candidate positions (the natural [photo-bottom]
// and the translated [info-block]) — which one holds the button?
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

const probe = (tag) => page.evaluate((t) => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const group = card.querySelector("div.group");
  const link = group.querySelector("a"); // the image Link (the containing block)
  const addbar = card.querySelector("div.absolute.inset-x-0");
  const btn = [...card.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const ar = addbar.getBoundingClientRect();
  const br = btn.getBoundingClientRect();
  const lr = link.getBoundingClientRect();
  const at = (x, y) => {
    const el = document.elementFromPoint(x, y);
    return el ? (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 16) : "null";
  };
  return {
    tag: t,
    linkBottom: Math.round(lr.bottom),
    addbarRect: [Math.round(ar.y), Math.round(ar.bottom)],
    btnRect: [Math.round(br.y), Math.round(br.bottom)],
    hitAtNatural: at(br.x + br.width / 2, lr.bottom - 28), // the natural (revealed) button zone
    hitAtTranslated: at(br.x + br.width / 2, lr.bottom + 28), // the translated (hidden) button zone
    btnMatchesHoverSel: btn.matches(":is(:where(.group):hover *)"),
    linkFocused: document.activeElement === link,
    btnFocused: document.activeElement === btn,
  };
}, tag);

console.log(JSON.stringify(await probe("a-rest")));
await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const btn = [...card.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  btn.focus();
});
await page.waitForTimeout(400);
console.log(JSON.stringify(await probe("b-script-focused")));
await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  [...grid.children[0].querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""))?.blur();
});
await page.waitForTimeout(400);
console.log(JSON.stringify(await probe("c-blurred")));

await browser.close();
console.log("ABSOLUTE MINIMAL COMPLETE");
