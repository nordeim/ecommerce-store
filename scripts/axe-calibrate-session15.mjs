// Calibrate the axe-core violation counts under EXACT E2E conditions
// (standalone server on :3100 with db/e2e.db, Desktop Chrome 1280x720,
// storageState-authenticated) so the accessibility spec pins real numbers.
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const BASE = "http://localhost:3100";
const AXE = readFileSync("./node_modules/axe-core/axe.min.js", "utf8");

// Reuse the E2E suite's saved storageState (produced by auth.setup)
const STATE = JSON.parse(readFileSync("./tests/e2e/.auth/user.json", "utf8"));

const ROUTES = [
  { path: "/", desc: "home" },
  { path: "/shop", desc: "shop" },
  { path: "/product/wireless-headphones", desc: "pdp" },
  { path: "/cart", desc: "cart" },
  { path: "/account", desc: "account" },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, storageState: { cookies: STATE.cookies, origins: STATE.origins ?? [] } });

for (const r of ROUTES) {
  const page = await ctx.newPage();
  await page.goto(BASE + r.path, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.evaluate(AXE);
  const counts = await page.evaluate(async () => {
    await new Promise((res) => {
      let y = 0;
      const iv = setInterval(() => {
        window.scrollBy(0, 400); y += 400;
        if (y > document.body.scrollHeight) { clearInterval(iv); res(); }
      }, 60);
    });
    window.scrollTo(0, 0);
    await new Promise((r2) => setTimeout(r2, 300));
    const out = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
    return out.violations.map((v) => `${v.id}:${v.nodes.length}`);
  });
  console.log(`${r.desc.padEnd(8)} ${counts.join(", ") || "CLEAN"}`);
  await page.close();
}

// login (anon)
const anon = await browser.newContext({ viewport: { width: 1280, height: 720 } });
{
  const page = await anon.newPage();
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.evaluate(AXE);
  const counts = await page.evaluate(async () => {
    const out = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
    return out.violations.map((v) => `${v.id}:${v.nodes.length}`);
  });
  console.log(`login    ${counts.join(", ") || "CLEAN"}`);
  await page.close();
}
await browser.close();
