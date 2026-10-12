// Round-48 calibration probe (d4): the CLONE side of the step-2 style diff
// (the r48c reference half completed; the sandbox reaped the standalone
// server between tool calls — this runs inside the same invocation as the
// boot). Measures exactly what r48c measured on the reference.
// Run: (server must be up on :3000) node scripts/checkout-paystep-probe-r48d.mjs
import { chromium } from "playwright-core";

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
  };
});

const browser = await chromium.launch();
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
for (const [label, value] of [["First Name", "Ada"], ["Last Name", "Lovelace"], ["Email", "ada@example.com"], ["Address", "123 Main St"], ["City", "New York"], ["State", "NY"], ["ZIP", "10001"]]) {
  await main.getByLabel(label).fill(value);
}
await cpage.getByRole("button", { name: "Continue to Payment" }).click();
await cpage.waitForTimeout(1200);
line("CLONE");
report("C1 resting (card selected)", JSON.stringify(await styleDump(cpage)));
await cpage.locator("label").filter({ hasText: /paypal/i }).first().click();
await cpage.waitForTimeout(900);
report("C2 after PayPal selection", JSON.stringify(await styleDump(cpage)));
report("C3 card-block visibility (paypal)", JSON.stringify(await visibilityCheck(cpage)));
await cpage.screenshot({ path: "/tmp/probe-r48/clone-step2-paypal-selected.png", fullPage: true });
await cctx.close();
await browser.close();
console.log("\nPROBE COMPLETE");
