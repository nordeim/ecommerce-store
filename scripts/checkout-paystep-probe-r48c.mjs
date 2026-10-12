// Round-48 calibration probe (d3): the computed-STYLE diff of the step-2
// selected states — reference vs clone — plus the reference's card-block
// VISIBILITY proof when PayPal is selected (the round-46 lesson: DOM
// presence is NOT visibility; the honest check is a bounding box + the
// elementsFromPoint hit-test).
//
//   R1  reference: label border/bg for BOTH options, resting (card selected)
//   R2  reference: the same after PayPal selection + the radio's own style
//   R3  reference: the card block's VISIBILITY under PayPal (bbox + hit-test)
//   R4  reference: the card block's CONTAINER styling (the box the clone
//       renders as bg-secondary/40 rounded-xl — what does the reference use?)
//   C1  clone (production standalone :3000): the same four measurements
// Run: node scripts/checkout-paystep-probe-r48c.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const CLONE = "http://localhost:3000";
const report = (k, v) => console.log(`  ${k.padEnd(46)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

const styleDump = (page) => page.evaluate(() => {
  const out = { labels: [], radios: [], cardContainer: null };
  const labels = [...document.querySelectorAll("label")].filter((l) => /paypal|credit/i.test(l.textContent ?? ""));
  for (const l of labels) {
    const s = getComputedStyle(l);
    out.labels.push({
      text: (l.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 30),
      border: s.borderColor, bg: s.backgroundColor, radius: s.borderRadius, pad: s.padding,
    });
  }
  const radios = [...document.querySelectorAll("[role=radio], input[type=radio]")];
  for (const r of radios) {
    const s = getComputedStyle(r);
    out.radios.push({
      value: r.getAttribute("value") ?? r.dataset.value ?? r.id, checked: r.getAttribute("aria-checked") ?? String(r.checked),
      border: s.borderColor, bg: s.backgroundColor, w: s.width, h: s.height,
    });
  }
  // the card block's container: the nearest common ancestor box of the
  // card-number input that has a visible background or border
  const cardInput = [...document.querySelectorAll("input")].find((i) => i.placeholder === "4242 4242 4242 4242");
  if (cardInput) {
    let el = cardInput.parentElement;
    while (el && el !== document.body) {
      const s = getComputedStyle(el);
      if (s.backgroundColor !== "rgba(0, 0, 0, 0)" || s.borderTopWidth !== "0px") {
        out.cardContainer = { tag: el.tagName, cls: String(el.className).slice(0, 80), bg: s.backgroundColor, border: s.borderColor, radius: s.borderRadius, pad: s.padding };
        break;
      }
      el = el.parentElement;
    }
  }
  return out;
});

const visibilityCheck = (page) => page.evaluate(() => {
  const cardInput = [...document.querySelectorAll("input")].find((i) => i.placeholder === "4242 4242 4242 4242");
  if (!cardInput) return { present: false };
  const r = cardInput.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const hits = document.elementsFromPoint(cx, cy);
  return {
    present: true, visible: r.width > 0 && r.height > 0,
    bbox: `${Math.round(r.width)}x${Math.round(r.height)}`,
    hitSelfOrChild: hits.includes(cardInput),
    topElement: hits[0]?.tagName ?? null,
    opacity: getComputedStyle(cardInput).opacity,
    clip: getComputedStyle(cardInput.parentElement).overflow,
  };
});

const browser = await chromium.launch();

// ---------- REFERENCE ----------
line("REFERENCE — login + cart + step 2");
const rctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const lp = await rctx.newPage();
await lp.goto(REF + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await lp.getByLabel("Password").fill("$Abcd1234");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try { await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }); } catch {}
await lp.waitForTimeout(1500);
await lp.close();
const rpage = await rctx.newPage();
await rpage.goto(REF + "/product/wireless-headphones", { waitUntil: "networkidle" });
await rpage.waitForTimeout(1200);
await rpage.getByRole("button", { name: "Add to Cart" }).first().click();
await rpage.waitForTimeout(4000);
await rpage.locator("header button").filter({ has: rpage.locator("svg.lucide-shopping-bag") }).click();
await rpage.waitForTimeout(2500);
await rpage.locator("[role=dialog] a, [data-state=open] a").filter({ hasText: /checkout/i }).first().click();
await rpage.waitForTimeout(3000);
await rpage.waitForLoadState("networkidle");
for (const [label, value] of [["First Name", "Ada"], ["Last Name", "Lovelace"], ["Email", "ada@example.com"], ["Address", "123 Main St"], ["City", "New York"], ["State", "NY"], ["ZIP", "10001"]]) {
  const loc = rpage.getByLabel(label, { exact: false }).first();
  if (await loc.count()) await loc.fill(value);
}
await rpage.waitForTimeout(300);
await rpage.getByRole("button", { name: /continue/i }).first().click();
await rpage.waitForTimeout(2500);
await rpage.waitForLoadState("networkidle");

report("R1 resting (card selected)", JSON.stringify(await styleDump(rpage)));
await rpage.locator("label").filter({ hasText: /paypal/i }).first().click();
await rpage.waitForTimeout(1000);
report("R2 after PayPal selection", JSON.stringify(await styleDump(rpage)));
report("R3 card-block visibility (paypal)", JSON.stringify(await visibilityCheck(rpage)));
await rpage.screenshot({ path: "/tmp/probe-r48/ref-step2-paypal-selected.png", fullPage: true });

// toggle back and re-check resting visibility (sanity)
await rpage.locator("label").filter({ hasText: /credit/i }).first().click();
await rpage.waitForTimeout(800);
report("R4 card-block visibility (card)", JSON.stringify(await visibilityCheck(rpage)));
await rctx.close();

// ---------- CLONE (the production standalone on :3000) ----------
line("CLONE — the production standalone :3000");
const cctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const cpage = await cctx.newPage();
await cpage.goto(CLONE + "/product/wireless-headphones", { waitUntil: "networkidle" });
await cpage.getByRole("button", { name: "Add to Cart" }).first().click();
await cpage.waitForTimeout(1500);
await cpage.locator("header button").filter({ has: cpage.locator("svg.lucide-shopping-bag") }).click();
await cpage.waitForTimeout(1200);
await cpage.getByRole("dialog").getByRole("link", { name: "Checkout" }).click();
await cpage.waitForTimeout(2000);
const main = cpage.getByRole("main");
for (const [label, value] of [["Address", "123 Main St"], ["City", "New York"], ["State", "NY"], ["ZIP", "10001"]]) {
  await main.getByLabel(label).fill(value);
}
await cpage.getByRole("button", { name: "Continue to Payment" }).click();
await cpage.waitForTimeout(1200);
report("C1 resting (card selected)", JSON.stringify(await styleDump(cpage)));
await cpage.locator("label").filter({ hasText: /paypal/i }).first().click();
await cpage.waitForTimeout(900);
report("C2 after PayPal selection", JSON.stringify(await styleDump(cpage)));
report("C3 card-block visibility (paypal)", JSON.stringify(await visibilityCheck(cpage)));
await cpage.screenshot({ path: "/tmp/probe-r48/clone-step2-paypal-selected.png", fullPage: true });
await cctx.close();

await browser.close();
console.log("\nPROBE COMPLETE");
