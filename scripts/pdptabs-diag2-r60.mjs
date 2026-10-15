// Round-60 P10 diagnostic: the keyboard-focused trigger's ring lifecycle —
// raw boxShadow + :focus-visible at 60/400/1000ms after the Tab lands.
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r("TIMEOUT:" + what), ms))]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const lp = await ctx.newPage();
await withTimeout(lp.goto(CLONE + "/login", { waitUntil: "domcontentloaded" }), 25000, "login");
await withTimeout(lp.getByLabel("Email").fill("john@example.com"), 15000, "email");
await withTimeout(lp.getByLabel("Password").fill("Demo1234!"), 15000, "pw");
await withTimeout(lp.getByRole("button", { name: "Log in", exact: true }).click(), 15000, "login-click");
try {
  await withTimeout(lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }), 28000, "nav");
} catch {}
await lp.waitForTimeout(1200);
await lp.close();

const page = await ctx.newPage();
await page.goto(CLONE + "/product/wireless-headphones", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.locator('[role="tab"]', { hasText: "Reviews" }).click();
await page.waitForTimeout(400);
await page.evaluate(() => {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  window.scrollTo(0, 0);
});
await page.waitForTimeout(200);

let landed = null;
for (let i = 0; i < 60; i++) {
  await page.keyboard.press("Tab");
  const st = await page.evaluate(() => {
    const el = document.activeElement;
    if (el && el.getAttribute("role") === "tab") return (el.textContent || "").trim();
    return null;
  });
  if (st) { landed = { step: i + 1, text: st }; break; }
}
console.log("WALK:", JSON.stringify(landed));

const readAt = async (label) => {
  const r = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return { ae: null };
    const cs = getComputedStyle(el);
    return {
      ae: (el.textContent || "").trim().slice(0, 18) + "|" + el.tagName,
      m: el.matches(":focus-visible"),
      shadow: cs.boxShadow,
    };
  });
  console.log(`${label}:`, JSON.stringify(r));
};
await readAt("+60ms");
await page.waitForTimeout(340);
await readAt("+400ms");
await page.waitForTimeout(600);
await readAt("+1000ms");

await browser.close();
console.log("DIAG2 COMPLETE");
