// Round-59 diagnostic: WHY was the addbar revealed at the 310 capture?
// Re-run the exact 309→310 sequence with state dumps at every step (the
// mouse position, the group's :hover, the addbar's translate).
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

const state = () => page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const card = grid.children[0];
  const group = card.querySelector("div.group");
  const addbar = card.querySelector("div.absolute.inset-x-0");
  const a = document.activeElement;
  return {
    addbar: getComputedStyle(addbar).translate,
    groupHover: group.matches(":hover"),
    active: a ? a.tagName + ":" + (a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 18) : "body",
    scrollY: Math.round(window.scrollY),
  };
});

await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  grid.children[0].scrollIntoView({ block: "center" });
});
await page.waitForTimeout(700);
console.log("[A] after scroll:", JSON.stringify(await state()));

// the 308 click (the mouse lands on the revealed Add button)
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
await page.waitForTimeout(850);
console.log("[B] after click:", JSON.stringify(await state()));

await page.waitForTimeout(2600);
console.log("[C] after toast death:", JSON.stringify(await state()));

await page.mouse.move(512, 20, { steps: 8 });
await page.waitForTimeout(400);
console.log("[D] after mouse away:", JSON.stringify(await state()));

await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  grid.querySelector("a")?.focus();
});
console.log("[E] after link focus:", JSON.stringify(await state()));

await page.keyboard.press("Tab"); // -> heart
await page.waitForTimeout(500);
console.log("[F] after Tab1 (heart):", JSON.stringify(await state()));

await page.keyboard.press("Tab"); // -> Add
await page.waitForTimeout(500);
console.log("[G] after Tab2 (Add):", JSON.stringify(await state()));

await page.waitForTimeout(1500);
console.log("[H] +1500ms later:", JSON.stringify(await state()));

await browser.close();
console.log("DIAGNOSTIC COMPLETE");
