// Fast-loop variant: no waitForTimeout — expect-style tight pacing, to
// reproduce the 11th-click POST drop.
import { chromium } from "playwright-core";
const BASE = "http://localhost:3100";
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
let posts = 0;
page.on("request", (r) => {
  if (r.method() === "POST" && new URL(r.url()).pathname === "/login") {
    posts++;
    console.log(`[POST #${posts}]`);
  }
});
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
const box = page.locator("div.mb-4.p-3.rounded-lg");
const btn = page.locator("form button[type=submit]");
const email = `rl-fast-${Date.now()}@example.com`;
for (let i = 1; i <= 12; i++) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await btn.click();
  // tight pacing: poll the box like expect() does — NO fixed wait
  const t0 = Date.now();
  let txt = "";
  for (let p = 0; p < 100; p++) {
    txt = (await box.count()) ? ((await box.textContent()) ?? "").trim() : "";
    if (txt) break;
    await page.waitForTimeout(100);
  }
  console.log(`iter ${i}: box=${JSON.stringify(txt.slice(0, 44))} posts=${posts} (${Date.now() - t0}ms)`);
}
await browser.close();
