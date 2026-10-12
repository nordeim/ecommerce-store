// Round-48 calibration probe: the reference's CHECKOUT PAYMENT-STEP STATES,
// measured live (the pin family's parity ground truth). The session-44
// probes measured the step-1 gate (NEVER disabled), the card formatter
// (none), the step-2 Back reset, and the step-3 anatomy (no summary cards,
// no Edit). This probe measures what session-44 did NOT:
//
//   A  step 2   the resting radio anatomy · the Review gate resting state ·
//               the CVC/expiry input behavior (formatting? letters? max
//               length?) · the CVC-empty + expiry-empty gate paths ·
//               the full-valid gate open
//   B  step 2   the PayPal branch — the card block's fate · the gate with
//               ZERO card data · the selected styling · the toggle-back
//               preservation · the step-3 payment copy
//   C  step 3   the Place Order label (price? lock icon?) · the Back
//               button · the step-3 Back -> step-2 preservation · the
//               click-through behavior (label during flight, navigation)
//
// Read-only against the reference (the mock checkout cannot write our
// clone's DB; the click-through lands on the reference's own mock
// confirmation/home).
// Run: node scripts/checkout-paystep-probe-r48.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/probe-r48";
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });
const report = (k, v) => console.log(`  ${k.padEnd(40)} ${v}`);
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

const page = await ctx.newPage();
await page.goto(REF + "/product/wireless-headphones", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.getByRole("button", { name: "Add to Cart" }).first().click();
await page.waitForTimeout(4000);
await page.locator("header button").filter({ has: page.locator("svg.lucide-shopping-bag") }).click();
await page.waitForTimeout(2500);
const co = page.locator("[role=dialog] a, [data-state=open] a").filter({ hasText: /checkout/i }).first();
await co.click();
await page.waitForTimeout(3000);
await page.waitForLoadState("networkidle");
console.log("CHECKOUT URL:", new URL(page.url()).pathname);

// fill step 1 valid + advance
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
console.log("STEP2 URL:", new URL(page.url()).pathname);
await page.screenshot({ path: OUT + "/step2-resting.png", fullPage: true });

const step2Dump = () => page.evaluate(() => {
  const out = { h2: [], radios: [], labels: [], inputs: [], buttons: [] };
  document.querySelectorAll("h2").forEach((h) => out.h2.push(h.textContent?.trim()));
  document.querySelectorAll("[role=radio], input[type=radio]").forEach((r) =>
    out.radios.push({ value: r.getAttribute("value") ?? r.dataset.value ?? null, checked: r.getAttribute("aria-checked") ?? r.checked, label: r.closest("label")?.textContent?.replace(/\s+/g, " ").trim().slice(0, 60) ?? null })
  );
  document.querySelectorAll("main input, form input").forEach((i) =>
    out.inputs.push({ label: i.getAttribute("aria-label") ?? i.name ?? i.id, type: i.type, ph: i.placeholder, auto: i.autocomplete, maxlen: i.getAttribute("maxlength") })
  );
  document.querySelectorAll("main button, form button").forEach((b) => out.buttons.push({ text: b.textContent?.trim().replace(/\s+/g, " "), disabled: b.hasAttribute("disabled"), hasLockSvg: !!b.querySelector("svg.lucide-lock, svg[class*=lock]") }));
  return out;
});

line("A. step 2 — the resting anatomy + the gate paths");
console.log(JSON.stringify(await step2Dump(), null, 1));

const review = page.getByRole("button", { name: /review/i }).first();
if (await review.count()) {
  report("A1 Review resting disabled", await review.isDisabled());

  // A2 — the CVC behavior: letters + overflow
  const cvc = page.getByLabel(/cvc|security code|cvv/i).first();
  if (await cvc.count()) {
    await cvc.pressSequentially("12a4b56", { delay: 30 });
    await page.waitForTimeout(400);
    report("A2 CVC typed '12a4b56' ->", JSON.stringify(await cvc.inputValue()));
    await cvc.fill("");
    await cvc.pressSequentially("12345", { delay: 30 });
    await page.waitForTimeout(300);
    report("A2b CVC typed '12345' ->", JSON.stringify(await cvc.inputValue()));
    await cvc.fill("");
  } else { console.log("  (no CVC input found)"); }

  // A3 — the expiry behavior
  const exp = page.getByLabel(/expir/i).first();
  if (await exp.count()) {
    await exp.pressSequentially("1228", { delay: 30 });
    await page.waitForTimeout(400);
    report("A3 Expiry typed '1228' ->", JSON.stringify(await exp.inputValue()));
  } else { console.log("  (no Expiry input found)"); }

  // A4 — the card fill (raw, the session-44 finding: no formatting)
  const card = page.getByLabel(/card number/i).first();
  if (await card.count()) {
    await card.pressSequentially("4242424242424242", { delay: 25 });
    await page.waitForTimeout(400);
    report("A4 Card typed 16 raw ->", JSON.stringify(await card.inputValue()));
  }

  // A5 — full-valid gate state
  report("A5 Review after full-valid card", await review.isDisabled());

  // A6 — the CVC-empty path
  if (await cvc.count()) {
    await cvc.fill("");
    await page.waitForTimeout(400);
    report("A6 Review with CVC EMPTY", await review.isDisabled());
    await cvc.fill("123");
    await page.waitForTimeout(400);
    report("A6b Review with CVC '123'", await review.isDisabled());
  }

  // A7 — the expiry-empty path
  if (await exp.count()) {
    await exp.fill("");
    await page.waitForTimeout(400);
    report("A7 Review with Expiry EMPTY", await review.isDisabled());
    await exp.fill("12/28");
    await page.waitForTimeout(400);
    report("A7b Review with Expiry restored", await review.isDisabled());
  }

  // A8 — the CVC short path (1-2 digits)
  if (await cvc.count()) {
    await cvc.fill("12");
    await page.waitForTimeout(400);
    report("A8 Review with CVC '12' (short)", await review.isDisabled());
    await cvc.fill("1234");
    await page.waitForTimeout(400);
    report("A8b Review with CVC '1234' (Amex)", await review.isDisabled());
    await cvc.fill("123");
  }

  line("B. step 2 — the PayPal branch");
  // B1 — click the PayPal option
  const paypalOpt = page.locator("label").filter({ hasText: /paypal/i }).first();
  const paypalAny = page.getByText("PayPal", { exact: true }).first();
  const payBtn = (await paypalOpt.count()) ? paypalOpt : paypalAny;
  await payBtn.click();
  await page.waitForTimeout(900);
  const cardBlockVisible = await page.getByLabel(/card number/i).count();
  report("B1 card block present after PayPal", cardBlockVisible);
  report("B2 Review (PayPal, zero card data)", await review.isDisabled());
  await page.screenshot({ path: OUT + "/step2-paypal.png", fullPage: true });

  // B3 — the selected styling
  const styling = await page.evaluate(() => {
    const labels = [...document.querySelectorAll("label")].filter((l) => /paypal|credit/i.test(l.textContent ?? ""));
    return labels.map((l) => ({
      text: (l.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40),
      border: getComputedStyle(l).borderColor,
      bg: getComputedStyle(l).backgroundColor,
    }));
  });
  console.log("  B3 label styling:", JSON.stringify(styling));

  // B4 — toggle back to card: do the values survive?
  const cardOpt = page.locator("label").filter({ hasText: /credit/i }).first();
  if (await cardOpt.count()) {
    await cardOpt.click();
    await page.waitForTimeout(900);
    const cvc2 = page.getByLabel(/cvc|security code|cvv/i).first();
    const exp2 = page.getByLabel(/expir/i).first();
    const card2 = page.getByLabel(/card number/i).first();
    report("B4 after toggle-back card count", await card2.count());
    if (await card2.count()) {
      report("B4b card value", JSON.stringify(await card2.inputValue()));
      report("B4c expiry value", JSON.stringify(await exp2.inputValue()));
      report("B4d cvc value", JSON.stringify(await cvc2.inputValue()));
      report("B4e Review after toggle-back", await review.isDisabled());
    }
  }

  line("C. step 3 — the Place Order anatomy");
  // back to PayPal for the step-3 payment copy measurement
  await payBtn.click();
  await page.waitForTimeout(700);
  if (!(await review.isDisabled())) {
    await review.click();
    await page.waitForTimeout(2500);
    await page.waitForLoadState("networkidle");
    console.log("STEP3 URL:", new URL(page.url()).pathname);
    await page.screenshot({ path: OUT + "/step3-paypal.png", fullPage: true });
    const step3 = await page.evaluate(() => {
      const out = { h2: [], buttons: [], paymentCopy: [] };
      document.querySelectorAll("h2").forEach((h) => out.h2.push(h.textContent?.trim()));
      document.querySelectorAll("main button, form button").forEach((b) => out.buttons.push({ text: b.textContent?.trim().replace(/\s+/g, " "), disabled: b.hasAttribute("disabled"), hasLockSvg: !!b.querySelector("svg.lucide-lock, svg[class*=lock]") }));
      document.querySelectorAll("main p, main div").forEach((d) => { const t = (d.textContent ?? "").trim(); if (/paypal/i.test(t) && t.length < 40) out.paymentCopy.push(t); });
      return out;
    });
    console.log("  C1 step3 dump:", JSON.stringify(step3, null, 1));

    // C2 — step-3 Back -> step-2: preservation?
    const back = page.getByRole("button", { name: /back/i }).first();
    if (await back.count()) {
      await back.click();
      await page.waitForTimeout(1500);
      const card3 = page.getByLabel(/card number/i).first();
      const paypalSel = await page.evaluate(() => {
        const r = [...document.querySelectorAll("[role=radio], input[type=radio]")].find((x) => /paypal/i.test(x.closest("label")?.textContent ?? "") || x.getAttribute("value") === "paypal");
        return r ? (r.getAttribute("aria-checked") ?? r.checked) : null;
      });
      report("C2 after step-3 Back, PayPal still selected", paypalSel);
      report("C2b card input count (block visible?)", await card3.count());

      // C3 — walk to card + review, then the Place Order label on the CARD path
      const cardOpt2 = page.locator("label").filter({ hasText: /credit/i }).first();
      if (await cardOpt2.count()) {
        await cardOpt2.click();
        await page.waitForTimeout(700);
        if (!(await review.isDisabled())) {
          await review.click();
          await page.waitForTimeout(2000);
          const placeBtn = page.getByRole("button", { name: /place order/i }).first();
          if (await placeBtn.count()) {
            const lbl = await placeBtn.textContent();
            report("C3 Place Order label (card path)", JSON.stringify((lbl ?? "").replace(/\s+/g, " ").trim()));
            const lock = await placeBtn.evaluate((b) => !!b.querySelector("svg.lucide-lock, svg[class*=lock]"));
            report("C3b Place Order carries lock icon", lock);
            const summary = await page.evaluate(() => {
              const t = [...document.querySelectorAll("aside, main div")].map((d) => d.textContent ?? "").join(" ");
              const m = t.match(/Total\s*\$[\d.]+/);
              return m ? m[0] : null;
            });
            report("C3c a Total figure on the page", JSON.stringify(summary));
            await page.screenshot({ path: OUT + "/step3-card.png", fullPage: true });

            // C4 — the click-through: the label during flight + the landing
            const nonGet = [];
            const handler = (r) => { if (r.method() !== "GET") nonGet.push(`${r.method()} ${r.url().slice(-40)}`); };
            page.on("request", handler);
            await placeBtn.click();
            await page.waitForTimeout(1200);
            let flightLabel = null;
            try {
              flightLabel = await placeBtn.textContent({ timeout: 1200 });
            } catch { /* it may unmount */ }
            report("C4 label 1.2s after click", JSON.stringify((flightLabel ?? "(unmounted)").replace(/\s+/g, " ").trim()));
            await page.waitForTimeout(4000);
            await page.waitForLoadState("networkidle").catch(() => {});
            report("C4b landing URL", new URL(page.url()).pathname);
            report("C4c non-GET requests", nonGet.length ? nonGet.join(" ; ") : "NONE");
            await page.screenshot({ path: OUT + "/after-place.png", fullPage: true });
            page.off("request", handler);
          }
        }
      }
    }
  }
}

await browser.close();
console.log("\nPROBE COMPLETE");
