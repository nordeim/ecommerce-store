// Round-52 calibration probe C: the reference's PDP buy-panel — round B's
// follow-up: the HEART button (proper locator — the reference carries no
// aria-labels; the heart is the action row's LAST button / the lucide-heart
// carrier), the STEPPER family (container/buttons/span/hovers), the engine
// shadow scale, + the BUTTON VINTAGE census (default-size buttons on login +
// the PDP) for the py-2 size-default question.
// Run: node scripts/buypanel-probe-r52c.mjs
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/probe-r52c";
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

line("A. THE LOGIN BUTTON — the default-size vintage (no className overrides)");
const loginBtn = await lp.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => /^log in$/i.test((x.textContent || "").trim()));
  if (!b) return { found: false };
  const cs = getComputedStyle(b);
  return { found: true, cls: b.className, h: Math.round(b.getBoundingClientRect().height), padding: cs.padding, font: cs.fontSize + "/" + cs.fontWeight, radius: cs.borderRadius };
});
for (const [k, v] of Object.entries(loginBtn)) report(`loginBtn.${k}`, v);
await lp.close();

const page = await ctx.newPage();
await page.goto(REF + "/product/wireless-headphones", { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; });
await page.waitForTimeout(1500);

line("B. THE HEART — the action row's lucide-heart carrier");
const heartData = await page.evaluate(() => {
  const atc = [...document.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  let row = atc.parentElement;
  for (let i = 0; i < 4 && row; i++) {
    if (getComputedStyle(row).display.includes("flex") && row.querySelectorAll("button").length >= 3) break;
    row = row.parentElement;
  }
  const heart = [...row.querySelectorAll("button")].find((b) => {
    const svg = b.querySelector("svg");
    return svg && (svg.getAttribute("class") || "").includes("heart");
  });
  if (!heart) return { found: false };
  const cs = getComputedStyle(heart);
  const r = heart.getBoundingClientRect();
  const svg = heart.querySelector("svg");
  return {
    found: true, cls: heart.className, w: Math.round(r.width), h: Math.round(r.height),
    bg: cs.backgroundColor, border: cs.border, radius: cs.borderRadius, boxShadow: cs.boxShadow,
    color: cs.color, cursor: cs.cursor, padding: cs.padding, font: cs.fontSize + "/" + cs.fontWeight,
    ariaLabel: heart.getAttribute("aria-label"), ariaPressed: heart.getAttribute("aria-pressed"),
    svgCls: svg.getAttribute("class"), svgColor: getComputedStyle(svg).color, svgFill: getComputedStyle(svg).fill,
  };
});
for (const [k, v] of Object.entries(heartData)) report(`heart.${k}`, v);
const heartBtn = page.locator("main button").filter({ has: page.locator("svg.lucide-heart") }).last();
await heartBtn.hover();
await page.waitForTimeout(700);
const heartHover = await heartBtn.evaluate((el) => {
  const cs = getComputedStyle(el);
  return { bg: cs.backgroundColor, color: cs.color };
});
for (const [k, v] of Object.entries(heartHover)) report(`heartHover.${k}`, v);

line("C. THE STEPPER — container + buttons + span + hovers");
const stepperData = await page.evaluate(() => {
  const minus = [...document.querySelectorAll("button")].find((b) => {
    const svg = b.querySelector("svg");
    return svg && (svg.getAttribute("class") || "").includes("minus");
  });
  if (!minus) return { found: false };
  const box = minus.parentElement;
  const plus = [...box.querySelectorAll("button")].find((b) => {
    const svg = b.querySelector("svg");
    return svg && (svg.getAttribute("class") || "").includes("plus");
  });
  const span = box.querySelector("span");
  const bcs = getComputedStyle(box);
  const mcs = getComputedStyle(minus);
  const scs = getComputedStyle(span);
  return {
    found: true,
    boxCls: box.className, boxBorder: bcs.border, boxRadius: bcs.borderRadius,
    boxH: Math.round(box.getBoundingClientRect().height), boxW: Math.round(box.getBoundingClientRect().width),
    minusCls: minus.className, minusPadding: mcs.padding, minusBg: mcs.backgroundColor, minusCursor: mcs.cursor,
    minusRadius: mcs.borderRadius,
    plusCls: plus.className, plusOpacity: getComputedStyle(plus).opacity, plusCursor: getComputedStyle(plus).cursor,
    spanCls: span.className, spanFont: scs.fontSize + "/" + scs.fontWeight, spanPadding: scs.padding,
    spanMinW: scs.minWidth, spanColor: scs.color,
  };
});
for (const [k, v] of Object.entries(stepperData)) report(`stepper.${k}`, v);
const minusBtn = page.locator("main button").filter({ has: page.locator("svg.lucide-minus") }).first();
await minusBtn.hover();
await page.waitForTimeout(500);
const minusHover = await minusBtn.evaluate((el) => {
  const cs = getComputedStyle(el);
  return { bg: cs.backgroundColor, transition: cs.transitionDuration + " " + cs.transitionProperty.slice(0, 60) };
});
for (const [k, v] of Object.entries(minusHover)) report(`stepper.minusHover.${k}`, v);

line("D. THE ACTION ROW GEOMETRY — widths at 1024");
const geom = await page.evaluate(() => {
  const atc = [...document.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  let row = atc.parentElement;
  for (let i = 0; i < 4 && row; i++) {
    if (getComputedStyle(row).display.includes("flex") && row.querySelectorAll("button").length >= 3) break;
    row = row.parentElement;
  }
  const btns = [...row.querySelectorAll("button")];
  return {
    rowW: Math.round(row.getBoundingClientRect().width),
    widths: btns.map((b) => Math.round(b.getBoundingClientRect().width)).join(", "),
    atcFlex: getComputedStyle(atc).flexGrow + "/" + getComputedStyle(atc).flexBasis,
  };
});
for (const [k, v] of Object.entries(geom)) report(`geom.${k}`, v);

line("E. ENGINE — the reference's shadow scale");
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

// DOM dump of the action row
const dump = await page.evaluate(() => {
  const atc = [...document.querySelectorAll("button")].find((b) => /add to cart/i.test(b.textContent || ""));
  return atc ? atc.parentElement.outerHTML.slice(0, 2600) : "NOT FOUND";
});
writeFileSync(OUT + "/ref-action-row.html", dump);
console.log("\nDOM dump -> " + OUT + "/ref-action-row.html");
console.log("PROBE r52c COMPLETE");
