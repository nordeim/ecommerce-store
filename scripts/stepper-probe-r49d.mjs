// Round-49 probe D: the reference's BUTTON CURSOR contract — the steppers
// measured cursor:pointer (r49 A1/B1) while the clone's v4.3.3 preflight
// gives plain buttons cursor:default. Is the reference's pointer a PLATFORM
// rule (every button) or scoped? Measures the cursor + computed styles of
// every reachable button family on the reference.
// Run: node scripts/stepper-probe-r49d.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const report = (k, v) => console.log(`  ${k.padEnd(46)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

const lp = await ctx.newPage();
await lp.goto(REF + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await lp.getByLabel("Password").fill("$Abcd1234");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try {
  await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
} catch { /* report what we find */ }
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
await lp.close();
console.log("login ok");

const page = await ctx.newPage();

const cursorSweep = (label) =>
  page.evaluate((lbl) => {
    const btns = [...document.querySelectorAll("button")];
    return {
      label: lbl,
      total: btns.length,
      cursorCounts: btns.reduce((m, b) => {
        const c = getComputedStyle(b).cursor;
        m[c] = (m[c] ?? 0) + 1;
        return m;
      }, {}),
      samples: btns.slice(0, 20).map((b) => ({
        name: (b.getAttribute("aria-label") || b.textContent?.trim() || b.querySelector("svg")?.getAttribute("class") || "?").slice(0, 34),
        cursor: getComputedStyle(b).cursor,
        disabled: b.disabled === true,
      })),
    };
  }, label);

line("PDP — every button's cursor");
await page.goto(REF + "/product/wireless-headphones", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const pdp = await cursorSweep("pdp");
report("cursor census", JSON.stringify(pdp.cursorCounts));
pdp.samples.slice(0, 14).forEach((s) => report(`  ${s.name}`, `${s.cursor}${s.disabled ? " (disabled)" : ""}`));

line("HOME — every button's cursor");
await page.goto(REF + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1800);
const home = await cursorSweep("home");
report("cursor census", JSON.stringify(home.cursorCounts));
home.samples.slice(0, 14).forEach((s) => report(`  ${s.name}`, `${s.cursor}${s.disabled ? " (disabled)" : ""}`));

line("LOGIN — the auth surface's cursor (logged out context)");
const ctx2 = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const lpage = await ctx2.newPage();
await lpage.goto(REF + "/login", { waitUntil: "networkidle" });
await lpage.waitForTimeout(1500);
const login = await lpage.evaluate(() => {
  const btns = [...document.querySelectorAll("button")];
  return btns.map((b) => ({
    name: (b.textContent?.trim() || b.getAttribute("aria-label") || "?").slice(0, 34),
    cursor: getComputedStyle(b).cursor,
  }));
});
login.forEach((s) => report(`  ${s.name}`, s.cursor));

line("PLATFORM RULE CHECK — a synthetic plain button");
const synth = await page.evaluate(() => {
  const b = document.createElement("button");
  b.textContent = "synthetic";
  document.body.appendChild(b);
  const c = getComputedStyle(b).cursor;
  b.remove();
  return c;
});
report("synthetic bare <button> cursor", synth);

await browser.close();
console.log("\nPROBE D COMPLETE");
