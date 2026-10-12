// Round-52 calibration probe B: the REFERENCE's PDP BUY-PANEL action family —
// the ATC Button's resting + hover anatomy (the bare-shadow question), the
// outline heart's anatomy + hover, the stepper container + buttons' hovers,
// the qty span. Login-gated, computed styles as the ground truth.
// Run: node scripts/buypanel-probe-r52b.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/probe-r52b";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const report = (k, v) => console.log(`  ${k.padEnd(46)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

// login
const lp = await ctx.newPage();
await lp.goto(REF + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await lp.getByLabel("Password").fill("$Abcd1234");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try { await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }); } catch {}
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
await lp.close();

const page = await ctx.newPage();
await page.goto(REF + "/product/wireless-headphones", { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(1500);

line("A. THE ACTION ROW — locate + resting anatomy");
// Find the row containing the ATC + heart (the reference's DOM shape first)
const rowDump = await page.evaluate(() => {
  const atc = [...document.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  if (!atc) return { found: false };
  let row = atc.parentElement;
  for (let i = 0; i < 4 && row; i++) {
    const cs = getComputedStyle(row);
    if (cs.display.includes("flex") && /cart|wishlist|quantity/i.test(row.textContent || "")) break;
    row = row.parentElement;
  }
  if (!row) return { found: false };
  const cs = getComputedStyle(row);
  return { found: true, tag: row.tagName, cls: row.className, display: cs.display, gap: cs.columnGap, mb: cs.marginBottom, childButtons: row.querySelectorAll("button").length };
});
for (const [k, v] of Object.entries(rowDump)) report(`row.${k}`, v);

line("B. THE ATC BUTTON — resting + hover");
const atcData = await page.evaluate(() => {
  const atc = [...document.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  if (!atc) return { found: false };
  const cs = getComputedStyle(atc);
  const r = atc.getBoundingClientRect();
  return {
    found: true,
    cls: atc.className,
    w: Math.round(r.width), h: Math.round(r.height),
    bg: cs.backgroundColor, color: cs.color, radius: cs.borderRadius,
    boxShadow: cs.boxShadow, font: cs.fontSize + "/" + cs.fontWeight,
    gap: cs.columnGap, padding: cs.padding,
    transition: cs.transitionDuration + " " + cs.transitionProperty.slice(0, 80),
    cursor: cs.cursor,
    svgCls: atc.querySelector("svg") ? atc.querySelector("svg").className.baseVal || atc.querySelector("svg").getAttribute("class") : null,
    svgSize: atc.querySelector("svg") ? getComputedStyle(atc.querySelector("svg")).width : null,
  };
});
for (const [k, v] of Object.entries(atcData)) report(`atc.${k}`, v);

const atcBtn = page.getByRole("button", { name: /add to cart/i }).first();
await atcBtn.hover();
await page.waitForTimeout(700);
const atcHover = await atcBtn.evaluate((el) => {
  const cs = getComputedStyle(el);
  return { bg: cs.backgroundColor, boxShadow: cs.boxShadow, cursor: cs.cursor, color: cs.color };
});
for (const [k, v] of Object.entries(atcHover)) report(`atcHover.${k}`, v);

line("C. THE HEART BUTTON — resting + hover");
const heartData = await page.evaluate(() => {
  const atc = [...document.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  let row = atc.parentElement;
  for (let i = 0; i < 4 && row; i++) {
    if (getComputedStyle(row).display.includes("flex") && row.querySelectorAll("button").length >= 3) break;
    row = row.parentElement;
  }
  const heart = [...row.querySelectorAll("button")].find((b) => b.querySelector("svg") && !/add to cart|quantity/i.test((b.textContent || "") + (b.getAttribute("aria-label") || "")));
  if (!heart) return { found: false };
  const cs = getComputedStyle(heart);
  const r = heart.getBoundingClientRect();
  const svg = heart.querySelector("svg");
  return {
    found: true, cls: heart.className, w: Math.round(r.width), h: Math.round(r.height),
    bg: cs.backgroundColor, border: cs.border, radius: cs.borderRadius, boxShadow: cs.boxShadow,
    color: cs.color, cursor: cs.cursor,
    ariaLabel: heart.getAttribute("aria-label"),
    svgColor: svg ? getComputedStyle(svg).color : null,
  };
});
for (const [k, v] of Object.entries(heartData)) report(`heart.${k}`, v);
const heartBtn = page.locator("button[aria-label*='wishlist']").first();
await heartBtn.hover();
await page.waitForTimeout(700);
const heartHover = await heartBtn.evaluate((el) => {
  const cs = getComputedStyle(el);
  return { bg: cs.backgroundColor, color: cs.color, boxShadow: cs.boxShadow };
});
for (const [k, v] of Object.entries(heartHover)) report(`heartHover.${k}`, v);

line("D. THE STEPPER — container + buttons + span + hovers");
const stepperData = await page.evaluate(() => {
  const minus = document.querySelector('button[aria-label="Decrease quantity"]');
  if (!minus) return { found: false };
  const box = minus.parentElement;
  const plus = box.querySelector('button[aria-label="Increase quantity"]');
  const span = box.querySelector("span");
  const bcs = getComputedStyle(box);
  const mcs = getComputedStyle(minus);
  const scs = getComputedStyle(span);
  return {
    found: true,
    boxCls: box.className, boxBorder: bcs.border, boxRadius: bcs.borderRadius,
    boxH: Math.round(box.getBoundingClientRect().height),
    minusCls: minus.className, minusPadding: mcs.padding, minusBg: mcs.backgroundColor, minusCursor: mcs.cursor,
    plusCls: plus.className, plusOpacity: getComputedStyle(plus).opacity, plusCursor: getComputedStyle(plus).cursor,
    spanCls: span.className, spanFont: scs.fontSize + "/" + scs.fontWeight, spanPadding: scs.padding,
    spanMinW: scs.minWidth, spanColor: scs.color,
  };
});
for (const [k, v] of Object.entries(stepperData)) report(`stepper.${k}`, v);
const minusBtn = page.getByRole("button", { name: "Decrease quantity" });
await minusBtn.hover();
await page.waitForTimeout(500);
const minusHover = await minusBtn.evaluate((el) => {
  const cs = getComputedStyle(el);
  return { bg: cs.backgroundColor, transition: cs.transitionDuration + " " + cs.transitionProperty.slice(0, 60) };
});
for (const [k, v] of Object.entries(minusHover)) report(`stepper.minusHover.${k}`, v);

line("E. ENGINE — the reference's shadow scale (v3)");
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

// DOM dump of the action row for the structure register
const dump = await page.evaluate(() => {
  const atc = [...document.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  return atc ? atc.parentElement.outerHTML.slice(0, 2400) : "NOT FOUND";
});
(await import("node:fs")).default.writeFileSync(OUT + "/ref-action-row.html", dump);
console.log("\nDOM dump -> " + OUT + "/ref-action-row.html");
console.log("PROBE r52b COMPLETE");
