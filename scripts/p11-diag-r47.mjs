// Round-47 P11 diagnostic: drive the same 11-wrong-login loop against the
// E2E server on :3100 and log every box + POST count, to find why the 11th
// attempt is not blocked by the fixed-window limiter.
import { chromium } from "playwright-core";

const BASE = "http://localhost:3100";
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

let posts = 0;
page.on("request", (r) => {
  if (r.method() === "POST" && new URL(r.url()).pathname === "/login") {
    posts++;
    console.log(`  [POST #${posts}] action header: ${r.headers()["next-action"]?.slice(0, 12) ?? "(none)"}`);
  }
});

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
const box = page.locator("div.mb-4.p-3.rounded-lg");
const btn = page.locator("form button[type=submit]");
const email = `rl-diag-${Date.now()}@example.com`;
console.log(`email: ${email}`);

for (let i = 1; i <= 12; i++) {
  const emailVal = await page.getByLabel("Email").inputValue();
  const pwVal = await page.getByLabel("Password", { exact: true }).inputValue();
  console.log(`iter ${i}: pre-fill email="${emailVal}" pw-len=${pwVal.length} btn="${(await btn.textContent())?.trim()}"`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await btn.click();
  await page.waitForTimeout(1200);
  const txt = (await box.count()) ? await box.textContent() : "(no box)";
  console.log(`iter ${i}: box = ${JSON.stringify(txt?.trim())} | posts=${posts}`);
}
await browser.close();
