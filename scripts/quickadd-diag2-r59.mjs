// Round-59 definitive diagnostic: re-run the EXACT capture sequence
// (306-310) with state dumps (scrollY, addbar translate, group hover,
// the mouse's client position) before EACH screenshot — find the moment
// the addbar flips to revealed in the 310 capture.
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
await page.waitForTimeout(1200);

const state = (tag) => page.evaluate((t) => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const group = card.querySelector("div.group");
  const addbar = card.querySelector("div.absolute.inset-x-0");
  const a = document.activeElement;
  const btn = [...card.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const br = btn.getBoundingClientRect();
  return {
    tag: t, url: location.pathname, scrollY: Math.round(window.scrollY),
    addbar: getComputedStyle(addbar).translate, groupHover: group.matches(":hover"),
    btnRect: { y: Math.round(br.y), h: Math.round(br.height) },
    active: a ? (a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 16) : "body",
  };
}, tag);

await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  grid.children[0].scrollIntoView({ block: "center" });
});
await page.waitForTimeout(700);
console.log(JSON.stringify(await state("pre-306")));

const rect = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const r = grid.children[0].querySelector("div.group").getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height * 0.25 };
});
await page.mouse.move(rect.cx, rect.cy, { steps: 6 });
await page.waitForTimeout(600);
console.log(JSON.stringify(await state("pre-307")));

const addRect = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const addBtn = [...card.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  const r = addBtn.getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
});
console.log("addRect (measured while hovered):", JSON.stringify(addRect));
await page.mouse.click(addRect.cx, addRect.cy);
await page.waitForTimeout(850);
console.log(JSON.stringify(await state("pre-308")));

await page.waitForTimeout(2600);
await page.mouse.move(512, 20, { steps: 8 });
await page.waitForTimeout(400);
console.log(JSON.stringify(await state("pre-309-mouseaway")));

await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  grid.querySelector("a")?.focus();
});
await page.keyboard.press("Tab");
await page.waitForTimeout(500);
console.log(JSON.stringify(await state("pre-309-shot")));

await page.keyboard.press("Tab");
await page.waitForTimeout(500);
console.log(JSON.stringify(await state("pre-310-shot")));
await page.waitForTimeout(2000);
console.log(JSON.stringify(await state("pre-310-shot+2s")));

await browser.close();
console.log("DEFINITIVE DIAGNOSTIC COMPLETE");
