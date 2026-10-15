// Round-60 probe F: the REFERENCE's keyboard-focused tab trigger — the
// two-sided truth's reference half (the r60a2 [8] walk failed on the
// body.focus no-op + 25-step cap; this walk blurs first and walks 40).
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

// blur reset + walk up to 40 tabs
await page.evaluate(() => {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
});
await page.waitForTimeout(200);
let found = null;
for (let i = 0; i < 40; i++) {
  await page.keyboard.press("Tab");
  await page.waitForTimeout(60);
  const st = await page.evaluate(() => {
    const el = document.activeElement;
    if (el && el.getAttribute("role") === "tab") {
      const cs = getComputedStyle(el);
      return {
        text: el.textContent.trim(),
        outline: cs.outline, outlineStyle: cs.outlineStyle, outlineColor: cs.outlineColor, outlineWidth: cs.outlineWidth,
        boxShadow: cs.boxShadow, tabIndex: el.tabIndex,
      };
    }
    return null;
  });
  if (st) { found = { tabsWalked: i + 1, ...st }; break; }
}
console.log("[1] KEYBOARD-FOCUSED TRIGGER (reference):", JSON.stringify(found, null, 1));

// settle 300ms then re-read (mid-transition vs settled)
if (found) {
  await page.waitForTimeout(300);
  const settled = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el.getAttribute("role") !== "tab") return null;
    const cs = getComputedStyle(el);
    return { text: el.textContent.trim(), boxShadow: cs.boxShadow, outlineStyle: cs.outlineStyle, outlineColor: cs.outlineColor, outlineWidth: cs.outlineWidth };
  });
  console.log("[2] SETTLED (reference):", JSON.stringify(settled, null, 1));

  // ArrowRight from the focused trigger
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  const afterArrow = await page.evaluate(() => {
    const el = document.activeElement;
    const triggers = [...document.querySelectorAll('[role="tab"]')];
    if (!el || el.getAttribute("role") !== "tab") return { active: el ? el.tagName : null };
    return {
      active: el.textContent.trim(),
      selected: el.getAttribute("aria-selected"),
      triggerTabIndices: triggers.map((t) => t.tabIndex),
    };
  });
  console.log("[3] AFTER ARROW-RIGHT (reference):", JSON.stringify(afterArrow, null, 1));
}

await browser.close();
console.log("PROBE F COMPLETE");
