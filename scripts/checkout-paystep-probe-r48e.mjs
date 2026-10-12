// Round-48 calibration probe (d5): the REFERENCE's step-2 STRUCTURE — the
// full ancestor chains. The VLM descriptions show BOXED option rows, but the
// r48c label-level probe measured unstyled labels — the box must be a
// PARENT. This probe dumps: (1) each radio's ancestor chain (4 levels:
// tag/class/bg/border/radius/padding), (2) the card input's FULL ancestor
// chain to body, (3) whether the card inputs sit INSIDE the card option's
// box (the nesting hypothesis).
// Run: node scripts/checkout-paystep-probe-r48e.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const report = (k, v) => console.log(`  ${k}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });

// login
const lp = await ctx.newPage();
await lp.goto(REF + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await lp.getByLabel("Password").fill("$Abcd1234");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try { await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }); } catch {}
await lp.waitForTimeout(1500);
await lp.close();

const page = await ctx.newPage();
await page.goto(REF + "/product/wireless-headphones", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.getByRole("button", { name: "Add to Cart" }).first().click();
await page.waitForTimeout(4000);
await page.locator("header button").filter({ has: page.locator("svg.lucide-shopping-bag") }).click();
await page.waitForTimeout(2500);
await page.locator("[role=dialog] a, [data-state=open] a").filter({ hasText: /checkout/i }).first().click();
await page.waitForTimeout(3000);
await page.waitForLoadState("networkidle");
for (const [label, value] of [["First Name", "Ada"], ["Last Name", "Lovelace"], ["Email", "ada@example.com"], ["Address", "123 Main St"], ["City", "New York"], ["State", "NY"], ["ZIP", "10001"]]) {
  const loc = page.getByLabel(label, { exact: false }).first();
  if (await loc.count()) await loc.fill(value);
}
await page.waitForTimeout(300);
await page.getByRole("button", { name: /continue/i }).first().click();
await page.waitForTimeout(2500);
await page.waitForLoadState("networkidle");

const dump = await page.evaluate(() => {
  const fmt = (el) => {
    const s = getComputedStyle(el);
    return `<${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 70)}" bg=${s.backgroundColor === "rgba(0, 0, 0, 0)" ? "-" : s.backgroundColor} border=${s.borderColor}/${s.borderTopWidth} radius=${s.borderRadius} pad=${s.padding}>`;
  };
  const chain = (el, n) => {
    const out = [];
    let cur = el;
    while (cur && cur !== document.body && out.length < n) {
      out.push(fmt(cur));
      cur = cur.parentElement;
    }
    return out;
  };

  // the radios' chains
  const radios = [...document.querySelectorAll("[role=radio], input[type=radio]")];
  const radioChains = radios.map((r) => ({
    value: r.getAttribute("value") ?? r.dataset.value ?? r.id,
    chain: chain(r, 4),
  }));

  // the card input's full chain to body
  const cardInput = [...document.querySelectorAll("input")].find((i) => i.placeholder === "4242 4242 4242 4242");
  const cardChain = cardInput ? chain(cardInput, 8) : null;

  // the nesting hypothesis: is the card input inside the CARD OPTION's box?
  let nested = null;
  if (cardInput) {
    const cardRadio = radios.find((r) => (r.getAttribute("value") ?? r.id) === "card");
    if (cardRadio) {
      // find the styled box ancestor of the card radio
      let box = cardRadio.parentElement;
      while (box && box !== document.body) {
        const s = getComputedStyle(box);
        if (s.borderTopWidth !== "0px" || s.backgroundColor !== "rgba(0, 0, 0, 0)") break;
        box = box.parentElement;
      }
      nested = box ? box.contains(cardInput) : false;
    }
  }

  // the option boxes' styling when selected vs not (paypal click happens after this dump)
  return { radioChains, cardChain, nested };
});
console.log("=== THE RADIOS' ANCESTOR CHAINS ===");
report(JSON.stringify(dump.radioChains, null, 1));
console.log("\n=== THE CARD INPUT'S ANCESTOR CHAIN (8 levels) ===");
report(JSON.stringify(dump.cardChain, null, 1));
console.log("\n=== the card input nested inside the card option's box:", dump.nested, "===");

// the selection styling delta: measure the option boxes before/after paypal click
const boxStyle = () => page.evaluate(() => {
  const radios = [...document.querySelectorAll("[role=radio], input[type=radio]")];
  return radios.map((r) => {
    let box = r.parentElement;
    while (box && box !== document.body) {
      const s = getComputedStyle(box);
      if (s.borderTopWidth !== "0px" || s.backgroundColor !== "rgba(0, 0, 0, 0)") return { value: r.getAttribute("value") ?? r.id, checked: r.getAttribute("aria-checked") ?? String(r.checked), boxClass: String(box.className).slice(0, 80), bg: s.backgroundColor, border: s.borderColor, radius: s.borderRadius, pad: s.padding };
      box = box.parentElement;
    }
    return { value: r.getAttribute("value") ?? r.id, box: null };
  });
});
console.log("\n=== OPTION BOXES (card selected — resting) ===");
console.log(JSON.stringify(await boxStyle(), null, 1));
await page.locator("label").filter({ hasText: /paypal/i }).first().click();
await page.waitForTimeout(1000);
console.log("\n=== OPTION BOXES (paypal selected) ===");
console.log(JSON.stringify(await boxStyle(), null, 1));

await browser.close();
console.log("\nPROBE COMPLETE");
