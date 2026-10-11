// Round-44 audit probe: the reference site's checkout VALIDATION anatomy —
// the step-1 gate behavior on invalid input (email/zip), the card-field
// formatting, and the edit-back navigation's state preservation. Read-only
// against the reference; the measurements calibrate the pin-density sweep's
// second installment (CHECKOUT-VALIDATION-1).
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/audit-r44";
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

// login (operator account)
const lp = await ctx.newPage();
await lp.goto(REF + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await lp.getByLabel("Password").fill("$Abcd1234");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try {
  await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
} catch { /* fall through */ }
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
await lp.close();

// build a cart: shop -> first product -> add to cart
const page = await ctx.newPage();
await page.goto(REF + "/shop", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const card = page.locator("a[href*='/product/']").first();
const href = await card.getAttribute("href");
console.log("first product href:", href);
await page.goto(REF + href, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const addBtn = page.getByRole("button", { name: /add to cart/i }).first();
if (await addBtn.count()) {
  await addBtn.click();
  await page.waitForTimeout(1200);
  console.log("add-to-cart clicked on PDP");
}

// checkout step 1
await page.goto(REF + "/checkout", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
console.log("checkout URL:", new URL(page.url()).pathname);
await page.screenshot({ path: OUT + "/ref-step1-rest.png", fullPage: true });

// --- PROBE 1: the step-1 resting gate + per-field invalid states ---
const step1 = await page.evaluate(() => {
  const out = { h2: [], inputs: [], buttons: [] };
  document.querySelectorAll("h2").forEach((h) => out.h2.push(h.textContent?.trim()));
  document.querySelectorAll("input").forEach((i) =>
    out.inputs.push({ id: i.id, type: i.type, label: i.getAttribute("aria-label") ?? i.name, placeholder: i.placeholder })
  );
  document.querySelectorAll("button").forEach((b) => out.buttons.push({ text: b.textContent?.trim(), disabled: b.disabled }));
  return out;
});
console.log("STEP1 STRUCTURE:", JSON.stringify(step1, null, 1));

const cont = page.getByRole("button", { name: /continue/i }).first();
if (await cont.count()) {
  const restingDisabled = await cont.isDisabled();
  console.log("P1 resting Continue disabled:", restingDisabled);

  // fill everything EXCEPT an invalid email
  const fill = async (label, value) => {
    const loc = page.getByLabel(label, { exact: false }).first();
    if (await loc.count()) { await loc.fill(value); return true; }
    return false;
  };
  const labels = ["First Name", "Last Name", "Email", "Address", "City", "State", "ZIP"];
  const valid = { "First Name": "Ada", "Last Name": "Lovelace", "Email": "ada@example.com", "Address": "123 Main St", "City": "New York", "State": "NY", "ZIP": "10001" };
  for (const l of labels) await fill(l, valid[l]);
  await page.waitForTimeout(400);
  console.log("P1 all-valid Continue disabled:", await cont.isDisabled());

  // invalid email (no TLD)
  await fill("Email", "ada@example");
  await page.waitForTimeout(400);
  console.log("P1 bad-email Continue disabled:", await cont.isDisabled());

  // invalid zip (letters)
  await fill("Email", "ada@example.com");
  await fill("ZIP", "abcde");
  await page.waitForTimeout(400);
  console.log("P1 bad-zip Continue disabled:", await cont.isDisabled());

  // short address
  await fill("ZIP", "10001");
  await fill("Address", "12");
  await page.waitForTimeout(400);
  console.log("P1 short-address Continue disabled:", await cont.isDisabled());

  // restore + continue
  await fill("Address", "123 Main St");
  await page.waitForTimeout(400);
  const canContinue = !(await cont.isDisabled());
  console.log("P1 restored Continue enabled:", canContinue);
  if (canContinue) {
    await cont.click();
    await page.waitForTimeout(1500);
    await page.waitForLoadState("networkidle");
    console.log("after continue, URL:", new URL(page.url()).pathname);
    await page.screenshot({ path: OUT + "/ref-step2.png", fullPage: true });
    const step2 = await page.evaluate(() => {
      const out = { h2: [], buttons: [], cardInputs: [] };
      document.querySelectorAll("h2").forEach((h) => out.h2.push(h.textContent?.trim()));
      document.querySelectorAll("button").forEach((b) => out.buttons.push({ text: b.textContent?.trim(), disabled: b.disabled }));
      document.querySelectorAll("input").forEach((i) => {
        if (/card|exp|cvc|cvv/i.test(i.id + i.name + (i.getAttribute("aria-label") ?? "")))
          out.cardInputs.push({ id: i.id, label: i.getAttribute("aria-label") ?? i.name, placeholder: i.placeholder });
      });
      return out;
    });
    console.log("STEP2 STRUCTURE:", JSON.stringify(step2, null, 1));

    // --- PROBE 2: the card formatter + gate ---
    const cardNum = page.locator("input").filter({ hasNot: page.locator("[data-nope]") }).nth(0);
    const cardInput = page.getByLabel(/card number/i).first();
    if (await cardInput.count()) {
      await cardInput.fill("4242424242424242");
      await page.waitForTimeout(300);
      console.log("P2 card value after fill:", JSON.stringify(await cardInput.inputValue()));
      await cardInput.fill("");
      await cardInput.pressSequentially("4242424242424242", { delay: 20 });
      await page.waitForTimeout(300);
      console.log("P2 card value after type:", JSON.stringify(await cardInput.inputValue()));
    } else {
      console.log("P2 no card-number input found");
    }

    // --- PROBE 3: edit-back navigation (step2 back -> step1 preserved?) ---
    const back = page.getByRole("button", { name: /back/i }).first();
    if (await back.count()) {
      await back.click();
      await page.waitForTimeout(1200);
      console.log("after back, URL:", new URL(page.url()).pathname);
      const preserved = await page.evaluate(() => {
        const vals = {};
        document.querySelectorAll("input").forEach((i) => {
          const l = i.getAttribute("aria-label") ?? i.name ?? i.id;
          if (l) vals[l] = i.value;
        });
        return vals;
      });
      console.log("P3 step-1 values after back:", JSON.stringify(preserved, null, 1));
      await page.screenshot({ path: OUT + "/ref-step1-after-back.png", fullPage: true });
    } else {
      console.log("P3 no Back button on step 2");
    }
  }
} else {
  console.log("NO Continue button found — step structure:", JSON.stringify(step1));
}

await browser.close();
