// Round-52 sanity probe A (CLONE side): the PDP buy-panel's action-row family —
// the ATC Button's computed anatomy (the bare `shadow` class under v4 is the
// audit question), the outline heart, the stepper buttons' hover states, the
// qty span. Sharpens the calibration probe design before the reference walk.
// Run (via battery): bash scripts/battery-runner.sh buypanel-clone-r52a.mjs prod
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const report = (k, v) => console.log(`  ${k.padEnd(46)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

// login (the PDP is public, but match the battery convention)
const lp = await ctx.newPage();
await lp.goto(CLONE + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("john@example.com");
await lp.getByLabel("Password").fill("Demo1234!");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try { await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }); } catch {}
await lp.close();

const page = await ctx.newPage();
await page.goto(CLONE + "/product/wireless-headphones", { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(1200);

line("A. THE ACTION ROW — resting anatomy");
const row = await page.evaluate(() => {
  const el = document.querySelector("main .flex.items-center.gap-4.mb-4");
  if (!el) return { found: false };
  const cs = getComputedStyle(el);
  return { found: true, cls: el.className, display: cs.display, gap: cs.columnGap, mb: cs.marginBottom };
});
for (const [k, v] of Object.entries(row)) report(`row.${k}`, v);

line("B. THE ATC BUTTON — the bare-shadow question");
const atc = await page.evaluate(() => {
  const row = document.querySelector("main .flex.items-center.gap-4.mb-4");
  const btn = [...row.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  if (!btn) return { found: false };
  const cs = getComputedStyle(btn);
  const r = btn.getBoundingClientRect();
  return {
    found: true,
    cls: btn.className,
    w: Math.round(r.width), h: Math.round(r.height),
    bg: cs.backgroundColor, color: cs.color,
    radius: cs.borderRadius,
    boxShadow: cs.boxShadow,
    font: cs.fontSize + "/" + cs.fontWeight,
    gap: cs.columnGap,
    padding: cs.padding,
    transition: cs.transitionDuration + " " + cs.transitionProperty,
    svgSize: btn.querySelector("svg") ? getComputedStyle(btn.querySelector("svg")).width : null,
  };
});
for (const [k, v] of Object.entries(atc)) report(`atc.${k}`, v);

line("C. THE ATC HOVER — /90");
const atcBtn = page.locator("main .flex.items-center.gap-4.mb-4").getByRole("button", { name: "Add to Cart" });
await atcBtn.hover();
await page.waitForTimeout(700);
const atcHover = await atcBtn.evaluate((el) => {
  const cs = getComputedStyle(el);
  return { bg: cs.backgroundColor, boxShadow: cs.boxShadow, cursor: cs.cursor };
});
for (const [k, v] of Object.entries(atcHover)) report(`atcHover.${k}`, v);

line("D. THE OUTLINE HEART — anatomy + hover");
const heart = page.locator("main .flex.items-center.gap-4.mb-4").getByRole("button", { name: /wishlist/ });
const heartRest = await heart.evaluate((el) => {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    cls: el.className, w: Math.round(r.width), h: Math.round(r.height),
    bg: cs.backgroundColor, border: cs.border, radius: cs.borderRadius,
    boxShadow: cs.boxShadow, color: cs.color, cursor: cs.cursor,
  };
});
for (const [k, v] of Object.entries(heartRest)) report(`heart.${k}`, v);
await heart.hover();
await page.waitForTimeout(700);
const heartHover = await heart.evaluate((el) => {
  const cs = getComputedStyle(el);
  return { bg: cs.backgroundColor, color: cs.color, boxShadow: cs.boxShadow };
});
for (const [k, v] of Object.entries(heartHover)) report(`heartHover.${k}`, v);

line("E. THE STEPPER — container + buttons' hover + the qty span");
const stepper = await page.evaluate(() => {
  const row = document.querySelector("main .flex.items-center.gap-4.mb-4");
  const box = row.querySelector("div.flex.items-center.border");
  const minus = box.querySelector('button[aria-label="Decrease quantity"]');
  const plus = box.querySelector('button[aria-label="Increase quantity"]');
  const span = box.querySelector("span");
  const bcs = getComputedStyle(box);
  const mcs = getComputedStyle(minus);
  const scs = getComputedStyle(span);
  return {
    boxCls: box.className, boxBorder: bcs.border, boxRadius: bcs.borderRadius, boxH: Math.round(box.getBoundingClientRect().height),
    minusCls: minus.className, minusPadding: mcs.padding, minusBg: mcs.backgroundColor, minusTransition: mcs.transitionDuration + " " + mcs.transitionProperty,
    spanCls: span.className, spanFont: scs.fontSize + "/" + scs.fontWeight, spanPadding: scs.padding, spanMinW: scs.minWidth, spanColor: scs.color,
  };
});
for (const [k, v] of Object.entries(stepper)) report(`stepper.${k}`, v);
const minus = page.getByRole("button", { name: "Decrease quantity" });
await minus.hover();
await page.waitForTimeout(500);
const minusHover = await minus.evaluate((el) => getComputedStyle(el).backgroundColor);
report("stepper.minusHoverBg", minusHover);

line("F. GLOBALS — the shadow scale pins in the live engine");
const shadows = await page.evaluate(() => {
  const probe = document.createElement("div");
  probe.className = "shadow";
  document.body.appendChild(probe);
  const bare = getComputedStyle(probe).boxShadow;
  probe.className = "shadow-sm";
  const sm = getComputedStyle(probe).boxShadow;
  probe.remove();
  return { bare, sm };
});
report("engine.shadow(bare)", shadows.bare);
report("engine.shadow-sm", shadows.sm);

await browser.close();
console.log("\nPROBE r52a COMPLETE");
