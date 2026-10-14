// Round-59 probe B3: the clone's heart FOCUS OUTLINE (the r59b2 gap — only
// the reference's heart outline was measured; the clone's heart carries no
// focus classes so the global `* { outline-ring/50 }` + the UA's
// :focus-visible auto style should render the SAME visible outline the
// reference shows (the heronav P4 precedent). Also: the :focus-visible
// match state + the Add button's outline (focus-visible:outline-none).
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
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

// keyboard walk: link -> heart -> Add (the same instrument as r59a3)
await page.mouse.move(512, 20, { steps: 8 });
await page.waitForTimeout(300);
await page.evaluate(() => {
  const h2s = [...document.querySelectorAll("h2")];
  const relH2 = h2s.find((h) => /also like/i.test(h.textContent || ""));
  const grid = (relH2.closest("section") || relH2.parentElement).querySelector("div.grid");
  grid.querySelector("a")?.focus();
});
await page.keyboard.press("Tab"); // -> heart
await page.waitForTimeout(400);
const heart = await page.evaluate(() => {
  const a = document.activeElement;
  const cs = getComputedStyle(a);
  return {
    active: a?.tagName + ":" + (a?.getAttribute("aria-label") || "no-aria").slice(0, 30),
    matchesFocusVisible: a?.matches(":focus-visible"),
    outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor,
    boxShadowFULL: cs.boxShadow,
  };
});
console.log("[1] CLONE HEART FOCUS:", JSON.stringify(heart, null, 1));

await page.keyboard.press("Tab"); // -> Add button
await page.waitForTimeout(400);
const add = await page.evaluate(() => {
  const a = document.activeElement;
  const cs = getComputedStyle(a);
  return {
    active: a?.tagName + ":" + (a?.textContent || "").trim().slice(0, 14),
    matchesFocusVisible: a?.matches(":focus-visible"),
    outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor,
  };
});
console.log("[2] CLONE ADD FOCUS:", JSON.stringify(add));

// the reference comparison note: her arrow — for the record, the global rule
const globalRule = await page.evaluate(() => {
  for (const sheet of document.styleSheets) {
    try {
      for (const r of sheet.cssRules) {
        if (r.selectorText && r.selectorText.includes("*") && r.style && r.style.outlineColor) {
          return { selector: r.selectorText, outlineColor: r.style.outlineColor };
        }
      }
    } catch {}
  }
  return null;
});
console.log("[3] GLOBAL OUTLINE RULE:", JSON.stringify(globalRule));

await browser.close();
console.log("PROBE r59b3 COMPLETE");
