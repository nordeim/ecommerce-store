// Round-49 clone-side calibration: the CLONE's stepper boundary states
// (pre-fix baseline for the RED pins, then the post-fix GREEN proof).
// Measures the SAME states as the reference probes (r49/r49b):
//   C1  PDP stepper at qty=1: minus disabled? opacity? classes?
//   C2  drawer stepper at qty=1: minus disabled? opacity? classes?
//   C3  (post-fix only) drawer minus-at-1 click → row removed?
//   C4  PDP stepper container radius + qty span anatomy
// Run via: bash scripts/battery-runner.sh stepper-clone-r49c.mjs prod
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const report = (k, v) => console.log(`  ${k.padEnd(44)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

// login (the demo user — john@example.com / Demo1234!)
const lp = await ctx.newPage();
await lp.goto(CLONE + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("john@example.com");
await lp.getByLabel("Password").fill("Demo1234!");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
await lp.waitForURL("**/account", { timeout: 15000 });
await lp.waitForLoadState("networkidle");
await lp.close();
console.log("login ok");

const page = await ctx.newPage();

// clean the cart first (the drawer trash loop — the helpers convention)
await page.goto(CLONE + "/", { waitUntil: "networkidle" });
await page.locator("header button").filter({ has: page.locator("svg.lucide-shopping-bag") }).click();
await page.waitForTimeout(1500);
for (let guard = 0; guard < 30; guard++) {
  const rm = page.getByRole("dialog").getByLabel(/^Remove /).first();
  if (!(await rm.isVisible().catch(() => false))) break;
  await rm.click();
  await page.waitForTimeout(350);
}
await page.keyboard.press("Escape");
await page.waitForTimeout(600);

line("C1: PDP stepper at qty=1 (pre-fix: minus disabled?)");
await page.goto(CLONE + "/product/wireless-headphones", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const pdp = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-minus"));
  const p = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-plus"));
  const c = b?.parentElement;
  const qtyEl = c ? [...c.children].find((ch) => ch !== b && ch !== p) : null;
  return {
    minus: b && { ariaLabel: b.getAttribute("aria-label"), disabled: b.disabled === true, className: b.getAttribute("class") || "", opacity: getComputedStyle(b).opacity, cursor: getComputedStyle(b).cursor },
    plus: p && { ariaLabel: p.getAttribute("aria-label"), disabled: p.disabled === true, className: p.getAttribute("class") || "" },
    qty: qtyEl && { text: qtyEl.textContent?.trim(), className: qtyEl.getAttribute("class") || "" },
    container: c && { className: c.getAttribute("class") || "", borderRadius: getComputedStyle(c).borderRadius },
  };
});
console.log(JSON.stringify(pdp, null, 1).slice(0, 1800));

line("C2: drawer stepper at qty=1");
await page.getByRole("button", { name: "Add to Cart" }).first().click();
await page.waitForTimeout(1800);
await page.locator("header button").filter({ has: page.locator("svg.lucide-shopping-bag") }).click();
await page.waitForTimeout(1500);
const drawer = await page.evaluate(() => {
  const els = [...document.querySelectorAll("[role=dialog],[data-state=open]")];
  const dlg = els.find((e) => /Cart \(\d+\)/.test(e.textContent || ""));
  if (!dlg) return { found: false };
  const btns = [...dlg.querySelectorAll("button")];
  const minus = btns.find((b) => b.querySelector("svg.lucide-minus"));
  const plus = btns.find((b) => b.querySelector("svg.lucide-plus"));
  const c = minus?.parentElement;
  const qtyEl = c ? [...c.children].find((ch) => ch !== minus && ch !== plus) : null;
  return {
    found: true,
    heading: dlg.querySelector("h2")?.textContent?.trim(),
    minus: minus && { ariaLabel: minus.getAttribute("aria-label"), disabled: minus.disabled === true, className: minus.getAttribute("class") || "", opacity: getComputedStyle(minus).opacity, cursor: getComputedStyle(minus).cursor },
    plus: plus && { ariaLabel: plus.getAttribute("aria-label"), disabled: plus.disabled === true, className: plus.getAttribute("class") || "" },
    qty: qtyEl && { text: qtyEl.textContent?.trim(), className: qtyEl.getAttribute("class") || "" },
    container: c && { className: c.getAttribute("class") || "", borderRadius: getComputedStyle(c).borderRadius },
  };
});
console.log(JSON.stringify(drawer, null, 1).slice(0, 1800));

line("C3: drawer minus-at-1 click (pre-fix: disabled → nothing?)");
await page.getByRole("dialog").getByLabel(/Decrease quantity/).first().click({ timeout: 4000, force: true }).catch((e) => report("click", "THREW: " + e.message.split("\n")[0].slice(0, 90)));
await page.waitForTimeout(1200);
const after = await page.evaluate(() => {
  const els = [...document.querySelectorAll("[role=dialog],[data-state=open]")];
  const dlg = els.find((e) => /Cart \(\d+\)/.test(e.textContent || ""));
  if (!dlg) return { found: false };
  return {
    found: true,
    heading: dlg.querySelector("h2")?.textContent?.trim(),
    imgs: dlg.querySelectorAll("img").length,
    emptyMsg: /cart is empty/.test(dlg.textContent || ""),
  };
});
report("after forced minus-at-1 click", JSON.stringify(after));

await browser.close();
console.log("\nCLONE CALIBRATION COMPLETE");
