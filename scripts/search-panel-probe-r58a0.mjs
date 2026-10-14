// Round-58 probe A0: enumerate the reference's header buttons to find the
// search trigger (the r46a lesson: try each button until an input appears).
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
await withTimeout(page.goto(REF + "/", { waitUntil: "domcontentloaded", timeout: 30000 }), 35000, "home-goto");
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1500);

// enumerate the header's buttons: aria-labels + inner svg names + text
const buttons = await page.evaluate(() => {
  const header = document.querySelector("header");
  return [...(header?.querySelectorAll("button") || [])].map((b, i) => {
    const svg = b.querySelector("svg");
    return {
      i,
      aria: b.getAttribute("aria-label"),
      text: (b.textContent || "").trim().slice(0, 30),
      svgCls: svg ? (svg.getAttribute("class") || "").slice(0, 60) : null,
      asChild: b.querySelector("a") ? "has-a" : null,
    };
  });
});
console.log("HEADER BUTTONS:", JSON.stringify(buttons, null, 1));

// try each button; report which one opens an input
for (let i = 0; i < buttons.length; i++) {
  const before = await page.locator("header input").count();
  if (before > 0) break;
  try {
    await page.locator("header button").nth(i).click({ timeout: 4000 });
  } catch { continue; }
  await page.waitForTimeout(700);
  const after = await page.locator("header input").count();
  console.log(`btn[${i}] aria=${buttons[i].aria} -> input count ${before}→${after}`);
  if (after > 0) {
    const html = await page.evaluate(() => {
      const input = document.querySelector("header input");
      return input ? input.closest("form")?.parentElement?.parentElement?.className + " || " + input.closest("form")?.parentElement?.className : null;
    });
    console.log("  OPENED. strip/container classes:", html);
    break;
  }
}
await browser.close();
