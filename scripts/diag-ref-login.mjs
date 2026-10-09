// Diagnose the reference login (v2): track navigations, wait, screenshot.
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
page.on("framenavigated", (f) => {
  if (f === page.mainFrame()) console.log("NAV ->", f.url());
});
await page.goto(REF + "/login", { waitUntil: "networkidle" });
await page.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await page.getByLabel("Password").fill("$Abcd1234");
await page.getByRole("button", { name: "Log in", exact: true }).click();
try {
  await page.waitForLoadState("networkidle", { timeout: 15000 });
} catch {}
await page.waitForTimeout(4000);
console.log("FINAL URL:", page.url());
try {
  const h1 = await page.evaluate(() => document.querySelector("h1")?.textContent);
  console.log("H1:", h1);
  const body = await page.evaluate(() => document.body.innerText.slice(0, 400));
  console.log("BODY:", body);
} catch (e) { console.log("eval err", e.message); }
await page.screenshot({ path: "/tmp/ref-login-diag.png" }).catch(() => {});
await browser.close();
