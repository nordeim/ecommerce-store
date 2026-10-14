// Round-59 captures 306-310: the quick-add family's states — the related
// section (306), the addbar revealed (307), the click's toast + badge
// (308), the heart's focused outline (309), the Add's focused ring (310).
// Probe-first, read-only pages; the one cart add (308) is cleaned by
// dev-cleanup after the run (the r49 lesson). The server boots on :3001.
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3001";
const OUT = "docs/screenshots";
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

const rel = () => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  return (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
};
await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  grid.children[0].scrollIntoView({ block: "center" });
});
await page.waitForTimeout(700);

// [306] the related section at rest (the two-card grid, the addbar hidden)
await page.screenshot({ path: OUT + "/306-related-section-resting.png" });
console.log("306 saved");

// [307] the addbar revealed (the card hover)
const rect = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const r = grid.children[0].querySelector("div.group").getBoundingClientRect();
  return { cx: r.x + r.width / 2, cy: r.y + r.height * 0.25 };
});
await page.mouse.move(rect.cx, rect.cy, { steps: 6 });
await page.waitForTimeout(600);
const revealState = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  const addbar = grid.children[0].querySelector("div.absolute.inset-x-0");
  return getComputedStyle(addbar).translate;
});
console.log("307 addbar translate (expect 0px):", revealState);
await page.screenshot({ path: OUT + "/307-addbar-revealed.png" });
console.log("307 saved");

// [308] the click's toast + badge (capture ~800ms after the click)
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
const clickState = await page.evaluate(() => {
  const header = document.querySelector("header");
  const cartBtn = [...header.querySelectorAll("button")].find((b) => b.querySelector("svg") && /bag|cart/i.test(b.innerHTML));
  let toast = null;
  for (const d of document.querySelectorAll("body *")) {
    const st = getComputedStyle(d);
    if (st.position === "fixed" && /added to cart/i.test(d.textContent || "") && d.getBoundingClientRect().y > 500) {
      toast = d.textContent?.trim().slice(0, 40);
      break;
    }
  }
  return { badge: cartBtn?.getAttribute("aria-label"), toast };
});
console.log("308 click state:", JSON.stringify(clickState));
await page.screenshot({ path: OUT + "/308-quickadd-click-toast-badge.png" });
console.log("308 saved");

// [309] the heart's focused outline (the global rule) — wait for the toast to die first
await page.waitForTimeout(2600);
await page.mouse.move(512, 20, { steps: 8 });
await page.waitForTimeout(400);
await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  grid.querySelector("a")?.focus();
});
await page.keyboard.press("Tab"); // -> heart
await page.waitForTimeout(500);
const heartState = await page.evaluate(() => {
  const a = document.activeElement;
  const cs = getComputedStyle(a);
  return { active: (a?.getAttribute("aria-label") || "").slice(0, 30), outline: cs.outlineStyle + " " + cs.outlineWidth + " " + cs.outlineColor.slice(0, 24) };
});
console.log("309 heart focus:", JSON.stringify(heartState));
await page.screenshot({ path: OUT + "/309-heart-focus-outline.png" });
console.log("309 saved");

// [310] the Add button's focused ring (the orange 1px + shadow-lg)
await page.keyboard.press("Tab"); // -> Add
await page.waitForTimeout(500);
const addState = await page.evaluate(() => {
  const a = document.activeElement;
  const cs = getComputedStyle(a);
  return { active: (a?.textContent || "").trim().slice(0, 14), ring: cs.boxShadow.slice(0, 140) };
});
console.log("310 add focus:", JSON.stringify(addState));
await page.screenshot({ path: OUT + "/310-add-focus-ring.png" });
console.log("310 saved");

await browser.close();
console.log("CAPTURES 306-310 COMPLETE");
