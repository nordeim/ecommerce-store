// Round-49 calibration probe: the reference's QUANTITY-STEPPER BOUNDARY
// STATES, measured live (the pin family's parity ground truth). The prior
// rounds pinned the PDP stepper's happy path (cart.spec: "PDP add respects
// the quantity stepper") and the clone's own stock clamps (stock.spec) —
// but the BOUNDARY behavior was never measured on the reference:
//
//   A  PDP stepper  the resting anatomy (qty=1) · the minus-at-1 fate
//                   (disabled? no-op? decrement-to-0?) · the plus ceiling
//                   (any cap? 99? none?) · the qty display format
//   B  drawer       the stepper anatomy at qty=1 · the minus-at-1 fate ·
//                   the plus-at-high-qty fate · the row after boundary hits
//
// Read-only against the reference (its cart is localStorage-cosmetic).
// Run: node scripts/stepper-probe-r49.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/probe-r49";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const report = (k, v) => console.log(`  ${k.padEnd(44)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

// login (the reference storefront is login-gated — the S46 lesson)
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

// ---------------------------------------------------------------------------
// A — the PDP stepper
// ---------------------------------------------------------------------------
line("A1: PDP stepper resting anatomy (qty=1)");
await page.goto(REF + "/product/wireless-headphones", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT + "/a1-pdp-resting.png", fullPage: true });

const pdpStepper = await page.evaluate(() => {
  // find the stepper: a bordered flex row with minus/plus buttons around a number
  const btns = [...document.querySelectorAll("button")];
  const minus = btns.find((b) => b.querySelector("svg.lucide-minus, svg.lucide-min"));
  const plus = btns.find((b) => b.querySelector("svg.lucide-plus"));
  if (!minus || !plus) return { found: false, btnCount: btns.length };
  const container = minus.parentElement === plus.parentElement ? minus.parentElement : null;
  const qtyEl = container ? [...container.children].find((c) => c !== minus && c !== plus) : null;
  const cs = (el) => (el ? getComputedStyle(el) : null);
  const dump = (el, name) => {
    if (!el) return null;
    const s = cs(el);
    return {
      tag: el.tagName,
      ariaLabel: el.getAttribute("aria-label"),
      disabled: el.disabled === true || el.getAttribute("aria-disabled"),
      className: (el.getAttribute("class") || "").slice(0, 120),
      text: el.textContent?.trim().slice(0, 20),
      opacity: s?.opacity,
      cursor: s?.cursor,
    };
  };
  return {
    found: true,
    container: container ? { tag: container.tagName, className: (container.getAttribute("class") || "").slice(0, 140), display: cs(container)?.display, gap: cs(container)?.gap, border: cs(container)?.borderRadius } : null,
    minus: dump(minus, "minus"),
    plus: dump(plus, "plus"),
    qty: qtyEl ? { tag: qtyEl.tagName, text: qtyEl.textContent?.trim(), className: (qtyEl.getAttribute("class") || "").slice(0, 120), minWidth: cs(qtyEl)?.minWidth, padding: cs(qtyEl)?.padding, fontWeight: cs(qtyEl)?.fontWeight } : null,
  };
});
console.log(JSON.stringify(pdpStepper, null, 1).slice(0, 2400));

line("A2: PDP minus-at-1 fate (click it)");
const minusBtn = page.locator("button", { has: page.locator("svg.lucide-minus") }).first();
const minusBefore = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-minus"));
  return { disabled: b?.disabled, ariaDisabled: b?.getAttribute("aria-disabled") };
});
report("minus before click", JSON.stringify(minusBefore));
await minusBtn.click({ timeout: 5000 }).catch((e) => report("minus click", "THREW: " + e.message.split("\n")[0]));
await page.waitForTimeout(1200);
const afterMinus1 = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-minus"));
  const p = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-plus"));
  const c = b?.parentElement;
  const qtyEl = c ? [...c.children].find((ch) => ch !== b && ch !== p) : null;
  return { qty: qtyEl?.textContent?.trim(), atc: [...document.querySelectorAll("button")].find((x) => /add to cart/i.test(x.textContent || ""))?.textContent?.trim() };
});
report("state after minus-at-1", JSON.stringify(afterMinus1));
await page.screenshot({ path: OUT + "/a2-pdp-after-minus-at-1.png", fullPage: true });

line("A3: PDP plus ceiling (click plus 8x from qty 1)");
for (let i = 0; i < 8; i++) {
  await page.locator("button", { has: page.locator("svg.lucide-plus") }).first().click({ timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(250);
}
const afterPlus8 = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-minus"));
  const p = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-plus"));
  const c = b?.parentElement;
  const qtyEl = c ? [...c.children].find((ch) => ch !== b && ch !== p) : null;
  return {
    qty: qtyEl?.textContent?.trim(),
    plusDisabled: p?.disabled === true || p?.getAttribute("aria-disabled"),
    plusOpacity: p ? getComputedStyle(p).opacity : null,
    plusCursor: p ? getComputedStyle(p).cursor : null,
  };
});
report("state after +8", JSON.stringify(afterPlus8));
await page.screenshot({ path: OUT + "/a3-pdp-after-plus8.png", fullPage: true });

line("A4: PDP minus from 9 down to 1 — the floor (8 clicks)");
for (let i = 0; i < 8; i++) {
  await page.locator("button", { has: page.locator("svg.lucide-minus") }).first().click({ timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(250);
}
const floorState = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-minus"));
  const p = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-plus"));
  const c = b?.parentElement;
  const qtyEl = c ? [...c.children].find((ch) => ch !== b && ch !== p) : null;
  return {
    qty: qtyEl?.textContent?.trim(),
    minusDisabled: b?.disabled === true || b?.getAttribute("aria-disabled"),
    minusOpacity: b ? getComputedStyle(b).opacity : null,
    minusCursor: b ? getComputedStyle(b).cursor : null,
  };
});
report("floor state (qty should be 1)", JSON.stringify(floorState));

// ---------------------------------------------------------------------------
// B — the drawer stepper
// ---------------------------------------------------------------------------
line("B1: drawer stepper at qty=1");
// ensure qty 1 on the PDP, add, open the drawer via the header cart button
const qtyNow = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-minus"));
  const p = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-plus"));
  const c = b?.parentElement;
  const qtyEl = c ? [...c.children].find((ch) => ch !== b && ch !== p) : null;
  return Number(qtyEl?.textContent?.trim() ?? "1");
});
if (qtyNow !== 1) {
  // reset by reload (the PDP stepper state is component-local)
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
}
await page.getByRole("button", { name: "Add to Cart" }).first().click();
await page.waitForTimeout(2500);
await page.locator("header button").filter({ has: page.locator("svg.lucide-shopping-bag") }).click();
await page.waitForTimeout(2000);
await page.screenshot({ path: OUT + "/b1-drawer-qty1.png", fullPage: false });

const drawerStepper = await page.evaluate(() => {
  const dlg = document.querySelector("[role=dialog], [data-state=open]");
  if (!dlg) return { found: false };
  const btns = [...dlg.querySelectorAll("button")];
  const minus = btns.find((b) => b.querySelector("svg.lucide-minus, svg.lucide-min"));
  const plus = btns.find((b) => b.querySelector("svg.lucide-plus"));
  if (!minus || !plus) return { found: true, btnLabels: btns.map((b) => b.getAttribute("aria-label") || b.textContent?.trim().slice(0, 24)).slice(0, 12) };
  const container = minus.parentElement === plus.parentElement ? minus.parentElement : null;
  const qtyEl = container ? [...container.children].find((c) => c !== minus && c !== plus) : null;
  const row = container?.closest("div");
  return {
    found: true,
    minus: { ariaLabel: minus.getAttribute("aria-label"), disabled: minus.disabled === true || minus.getAttribute("aria-disabled"), className: (minus.getAttribute("class") || "").slice(0, 120), opacity: getComputedStyle(minus).opacity, cursor: getComputedStyle(minus).cursor },
    plus: { ariaLabel: plus.getAttribute("aria-label"), disabled: plus.disabled === true || plus.getAttribute("aria-disabled"), className: (plus.getAttribute("class") || "").slice(0, 120), opacity: getComputedStyle(plus).opacity },
    qty: qtyEl ? { text: qtyEl.textContent?.trim(), className: (qtyEl.getAttribute("class") || "").slice(0, 100) } : null,
    container: container ? { className: (container.getAttribute("class") || "").slice(0, 120), borderRadius: getComputedStyle(container).borderRadius } : null,
  };
});
console.log(JSON.stringify(drawerStepper, null, 1).slice(0, 2200));

line("B2: drawer minus-at-1 fate (click it)");
const dMinus = page.locator("[role=dialog] button", { has: page.locator("svg.lucide-minus") }).first();
const drawerMinusBefore = await page.evaluate(() => {
  const dlg = document.querySelector("[role=dialog], [data-state=open]");
  const b = dlg ? [...dlg.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-minus")) : null;
  return { disabled: b?.disabled, ariaDisabled: b?.getAttribute("aria-disabled") };
});
report("drawer minus before click", JSON.stringify(drawerMinusBefore));
await dMinus.click({ timeout: 5000 }).catch((e) => report("drawer minus click", "THREW: " + e.message.split("\n")[0]));
await page.waitForTimeout(1500);
const drawerAfterMinus = await page.evaluate(() => {
  const dlg = document.querySelector("[role=dialog], [data-state=open]");
  if (!dlg) return { dialog: "gone" };
  const btns = [...dlg.querySelectorAll("button")];
  const minus = btns.find((b) => b.querySelector("svg.lucide-minus"));
  const plus = btns.find((b) => b.querySelector("svg.lucide-plus"));
  const container = minus?.parentElement;
  const qtyEl = container ? [...container.children].find((c) => c !== minus && c !== plus) : null;
  const rows = dlg.querySelectorAll("img, [class*=border-b]").length;
  const empty = dlg.textContent?.includes("cart is empty");
  return { qty: qtyEl?.textContent?.trim(), minusStill: !!minus, rowishCount: rows, emptyState: empty ?? null, heading: dlg.querySelector("h2")?.textContent?.trim() };
});
report("drawer after minus-at-1", JSON.stringify(drawerAfterMinus));
await page.screenshot({ path: OUT + "/b2-drawer-after-minus-at-1.png", fullPage: false });

line("B3: drawer plus at high qty (6 clicks — the ceiling question)");
// if the row survived, click plus 6 times and watch for a cap or error copy
for (let i = 0; i < 6; i++) {
  await page.locator("[role=dialog] button", { has: page.locator("svg.lucide-plus") }).first().click({ timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(350);
}
const drawerAfterPlus = await page.evaluate(() => {
  const dlg = document.querySelector("[role=dialog], [data-state=open]");
  if (!dlg) return { dialog: "gone" };
  const btns = [...dlg.querySelectorAll("button")];
  const minus = btns.find((b) => b.querySelector("svg.lucide-minus"));
  const plus = btns.find((b) => b.querySelector("svg.lucide-plus"));
  const container = minus?.parentElement;
  const qtyEl = container ? [...container.children].find((c) => c !== minus && c !== plus) : null;
  const totals = [...dlg.querySelectorAll("p, span, div")].map((e) => e.textContent?.trim()).filter((t) => /^\$[\d,.]+$/.test(t || ""));
  return {
    qty: qtyEl?.textContent?.trim(),
    plusDisabled: plus?.disabled === true || plus?.getAttribute("aria-disabled"),
    errorCopy: dlg.textContent?.match(/[Ss]orry|[Ll]imit|[Mm]ax|[Oo]nly \d+ left/) ? dlg.textContent?.match(/[Ss]orry[^.]*|[Ll]imit[^.]*|[Mm]ax[^.]*|[Oo]nly \d+ left[^.]*/)?.[0] : null,
    moneyTexts: totals.slice(0, 6),
  };
});
report("drawer after +6", JSON.stringify(drawerAfterPlus));
await page.screenshot({ path: OUT + "/b3-drawer-after-plus6.png", fullPage: false });

await browser.close();
console.log("\nPROBE COMPLETE — captures in " + OUT);
