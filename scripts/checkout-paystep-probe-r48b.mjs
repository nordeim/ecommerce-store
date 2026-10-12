// Round-48 calibration probe (d2): the definitive payment-step measurements
// the first pass could not reach — the reference's card inputs are
// PLACEHOLDER-ONLY (no accessible labels — itself a finding: the clone's
// <Label> elements are a superset). Placeholder-based locators this pass:
//
//   A  the CVC input behavior (letters typed? overflow? maxlength?)
//   B  the expiry input behavior (the slash? raw?)
//   C  the PayPal radio's REAL selected state (aria-checked) + the card
//      block's fate (do the placeholder inputs unmount?) + the radio's
//      own styling when selected
//   D  the step-3 Back -> step-2 state: method + card values
//   E  the step-2 resting radio defaults + the option icons
// Run: node scripts/checkout-paystep-probe-r48b.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const report = (k, v) => console.log(`  ${k.padEnd(44)} ${v}`);
const line = (t) => console.log(`\n=== ${t} ===`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

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
await page.waitForTimeout(1200);
await page.getByRole("button", { name: "Add to Cart" }).first().click();
await page.waitForTimeout(4000);
await page.locator("header button").filter({ has: page.locator("svg.lucide-shopping-bag") }).click();
await page.waitForTimeout(2500);
await page.locator("[role=dialog] a, [data-state=open] a").filter({ hasText: /checkout/i }).first().click();
await page.waitForTimeout(3000);
await page.waitForLoadState("networkidle");

const set = async (label, value) => {
  const loc = page.getByLabel(label, { exact: false }).first();
  if (await loc.count()) { await loc.fill(value); await page.waitForTimeout(300); return true; }
  console.log("  (no label:", label, ")");
  return false;
};
await set("First Name", "Ada"); await set("Last Name", "Lovelace");
await set("Email", "ada@example.com"); await set("Address", "123 Main St");
await set("City", "New York"); await set("State", "NY"); await set("ZIP", "10001");
await page.getByRole("button", { name: /continue/i }).first().click();
await page.waitForTimeout(2500);
await page.waitForLoadState("networkidle");

line("E. step 2 — the radio defaults + icons");
const radioState = () => page.evaluate(() => {
  const radios = [...document.querySelectorAll("[role=radio], input[type=radio]")];
  return radios.map((r) => {
    const l = r.closest("label");
    return {
      value: r.getAttribute("value") ?? r.dataset.value ?? r.id ?? null,
      checked: r.getAttribute("aria-checked") ?? String(r.checked),
      labelText: (l?.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40),
      hasCardSvg: !!(l?.querySelector("svg.lucide-credit-card, svg[class*=credit]")),
      hasWalletSvg: !!(l?.querySelector("svg.lucide-wallet, svg[class*=wallet]")),
      border: l ? getComputedStyle(l).borderColor : null,
      bg: l ? getComputedStyle(l).backgroundColor : null,
    };
  });
});
console.log(JSON.stringify(await radioState(), null, 1));

line("A. the CVC input behavior");
const cvc = page.getByPlaceholder("123").first();
const exp = page.getByPlaceholder("MM/YY").first();
const card = page.getByPlaceholder("4242 4242 4242 4242").first();
report("A0 inputs present (card/exp/cvc)", `${await card.count()}/${await exp.count()}/${await cvc.count()}`);
if (await cvc.count()) {
  const attrs = await cvc.evaluate((i) => ({ type: i.type, maxlen: i.getAttribute("maxlength"), inputmode: i.getAttribute("inputmode"), auto: i.autocomplete }));
  report("A0b CVC attrs", JSON.stringify(attrs));
  await cvc.pressSequentially("12a4b56", { delay: 30 });
  await page.waitForTimeout(400);
  report("A1 CVC typed '12a4b56' ->", JSON.stringify(await cvc.inputValue()));
  await cvc.fill(""); await cvc.pressSequentially("123456", { delay: 25 });
  await page.waitForTimeout(300);
  report("A2 CVC typed '123456' ->", JSON.stringify(await cvc.inputValue()));
}

line("B. the expiry input behavior");
if (await exp.count()) {
  const attrs = await exp.evaluate((i) => ({ maxlen: i.getAttribute("maxlength"), inputmode: i.getAttribute("inputmode"), auto: i.autocomplete }));
  report("B0 Expiry attrs", JSON.stringify(attrs));
  await exp.fill(""); await exp.pressSequentially("1228", { delay: 30 });
  await page.waitForTimeout(400);
  report("B1 Expiry typed '1228' ->", JSON.stringify(await exp.inputValue()));
  await exp.fill(""); await exp.pressSequentially("1", { delay: 30 });
  await page.waitForTimeout(300);
  report("B2 Expiry typed '1' ->", JSON.stringify(await exp.inputValue()));
}

line("C. the card input overflow");
if (await card.count()) {
  const attrs = await card.evaluate((i) => ({ maxlen: i.getAttribute("maxlength"), inputmode: i.getAttribute("inputmode"), auto: i.autocomplete }));
  report("C0 Card attrs", JSON.stringify(attrs));
  await card.fill(""); await card.pressSequentially("42424242424242424242", { delay: 20 });
  await page.waitForTimeout(400);
  report("C1 Card typed 20 digits ->", JSON.stringify(await card.inputValue()));
  // restore a valid 16
  await card.fill("4242424242424242");
  await page.waitForTimeout(300);
}

line("D. the PayPal branch — the real selected state + the card block's fate");
const paypalLabel = page.locator("label").filter({ hasText: /paypal/i }).first();
await paypalLabel.click();
await page.waitForTimeout(1000);
const afterPaypal = await page.evaluate(() => {
  const radios = [...document.querySelectorAll("[role=radio], input[type=radio]")].map((r) => ({
    value: r.getAttribute("value") ?? r.dataset.value ?? r.id ?? null,
    checked: r.getAttribute("aria-checked") ?? String(r.checked),
  }));
  const inputs = [...document.querySelectorAll("main input, form input")].map((i) => i.placeholder).filter(Boolean);
  return { radios, placeholders: inputs };
});
console.log("  D1 after PayPal click:", JSON.stringify(afterPaypal, null, 1));

// the radio's OWN styling (not the label's) when selected
const radioStyling = await page.evaluate(() => {
  const r = [...document.querySelectorAll("[role=radio], input[type=radio]")].find((x) => {
    const v = x.getAttribute("value") ?? x.dataset.value ?? x.id ?? "";
    return /paypal/i.test(v) || /paypal/i.test(x.closest("label")?.textContent ?? "");
  });
  if (!r) return null;
  const s = getComputedStyle(r);
  return { borderColor: s.borderColor, bg: s.backgroundColor, dotVisible: !!r.querySelector("[data-state=checked], svg") };
});
report("D2 the PayPal radio's own styling", JSON.stringify(radioStyling));

// D3 — toggle back to card: the values' fate
const cardLabel = page.locator("label").filter({ hasText: /credit/i }).first();
await cardLabel.click();
await page.waitForTimeout(1000);
const afterBack = await page.evaluate(() => {
  const inputs = [...document.querySelectorAll("main input, form input")];
  return inputs.map((i) => ({ ph: i.placeholder, value: i.value })).filter((x) => x.ph);
});
console.log("  D3 after toggle-back to card:", JSON.stringify(afterBack, null, 1));

// D4 — PayPal -> Review -> step 3 -> Back: the method + values' fate
await paypalLabel.click();
await page.waitForTimeout(800);
const review = page.getByRole("button", { name: /review/i }).first();
await review.click();
await page.waitForTimeout(2200);
await page.waitForLoadState("networkidle");
const step3h2 = await page.evaluate(() => [...document.querySelectorAll("h2")].map((h) => h.textContent?.trim()));
report("D4 step-3 h2 (PayPal path)", JSON.stringify(step3h2));
const back = page.getByRole("button", { name: /back/i }).first();
await back.click();
await page.waitForTimeout(1500);
const afterStep3Back = await page.evaluate(() => {
  const radios = [...document.querySelectorAll("[role=radio], input[type=radio]")].map((r) => ({
    value: r.getAttribute("value") ?? r.dataset.value ?? r.id ?? null,
    checked: r.getAttribute("aria-checked") ?? String(r.checked),
  }));
  const inputs = [...document.querySelectorAll("main input, form input")].map((i) => ({ ph: i.placeholder, value: i.value })).filter((x) => x.ph);
  return { radios, inputs };
});
console.log("  D5 after step-3 Back (PayPal path):", JSON.stringify(afterStep3Back, null, 1));

await browser.close();
console.log("\nPROBE COMPLETE");
