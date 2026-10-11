// Round-44 audit probe v2: the reference's checkout VALIDATION anatomy via
// the DRAWER path (PDP add -> header cart button -> drawer -> Checkout link
// — the r38 protocol; a direct /checkout goto renders the empty state when
// the client cart isn't hydrated). Measures: the step-1 gate on invalid
// input, the card formatter, and the edit-back state preservation.
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/audit-r44";
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

// login
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

// PDP -> add to cart
const page = await ctx.newPage();
await page.goto(REF + "/product/wireless-headphones", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
const addBtn = page.getByRole("button", { name: /add to cart/i }).first();
console.log("addBtn count:", await addBtn.count());
if (await addBtn.count()) {
  await addBtn.click();
  await page.waitForTimeout(1500);
}

// header cart button -> drawer
const headerCart = page.getByRole("button", { name: /cart/i }).first();
console.log("headerCart count:", await headerCart.count());
await headerCart.click();
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT + "/ref-drawer.png" });

const drawerText = await page.evaluate(() => {
  const d = document.querySelector("[role=dialog], [data-radix-panel]");
  return d?.textContent?.replace(/\s+/g, " ").slice(0, 400) ?? "NO DIALOG";
});
console.log("DRAWER TEXT:", drawerText);

// drawer -> Checkout link
const checkoutLink = page.locator("[role=dialog] a, [data-radix-panel] a, [role=dialog] button, [data-radix-panel] button").filter({ hasText: /checkout/i }).first();
console.log("checkoutLink count:", await checkoutLink.count());
if (await checkoutLink.count()) {
  await checkoutLink.click();
  await page.waitForTimeout(2500);
  await page.waitForLoadState("networkidle");
  console.log("CHECKOUT URL:", new URL(page.url()).pathname);
  await page.screenshot({ path: OUT + "/ref-checkout-step1.png", fullPage: true });

  const step1 = await page.evaluate(() => {
    const out = { h1: [], h2: [], inputs: [], buttons: [] };
    document.querySelectorAll("h1").forEach((h) => out.h1.push(h.textContent?.trim()));
    document.querySelectorAll("h2").forEach((h) => out.h2.push(h.textContent?.trim()));
    document.querySelectorAll("main input, form input").forEach((i) =>
      out.inputs.push({ id: i.id, type: i.type, label: i.getAttribute("aria-label") ?? i.name, ph: i.placeholder, auto: i.autocomplete })
    );
    document.querySelectorAll("main button, form button").forEach((b) => out.buttons.push({ text: b.textContent?.trim(), disabled: b.disabled }));
    return out;
  });
  console.log("STEP1:", JSON.stringify(step1, null, 1));

  // PROBE 1: the per-field gate
  const cont = page.getByRole("button", { name: /continue/i }).first();
  if (await cont.count()) {
    console.log("P1 resting disabled:", await cont.isDisabled());
    const set = async (label, value) => {
      const loc = page.getByLabel(label, { exact: false }).first();
      if (await loc.count()) { await loc.fill(value); await page.waitForTimeout(250); return true; }
      console.log("  (label not found:", label, ")");
      return false;
    };
    await set("First Name", "Ada"); await set("Last Name", "Lovelace");
    await set("Email", "ada@example.com"); await set("Address", "123 Main St");
    await set("City", "New York"); await set("State", "NY"); await set("ZIP", "10001");
    console.log("P1 all-valid disabled:", await cont.isDisabled());
    await set("Email", "ada@example");
    console.log("P1 bad-email disabled:", await cont.isDisabled());
    await set("Email", "ada@example.com"); await set("ZIP", "abcde");
    console.log("P1 bad-zip disabled:", await cont.isDisabled());
    await set("ZIP", "10001"); await set("Address", "12");
    console.log("P1 short-address disabled:", await cont.isDisabled());
    await set("Address", "123 Main St");
    console.log("P1 restored disabled:", await cont.isDisabled());

    if (!(await cont.isDisabled())) {
      await cont.click();
      await page.waitForTimeout(2000);
      await page.waitForLoadState("networkidle");
      console.log("AFTER CONTINUE URL:", new URL(page.url()).pathname);
      await page.screenshot({ path: OUT + "/ref-step2.png", fullPage: true });
      const step2 = await page.evaluate(() => {
        const out = { h2: [], buttons: [], inputs: [] };
        document.querySelectorAll("h2").forEach((h) => out.h2.push(h.textContent?.trim()));
        document.querySelectorAll("main button, form button").forEach((b) => out.buttons.push({ text: b.textContent?.trim(), disabled: b.disabled }));
        document.querySelectorAll("main input, form input").forEach((i) => out.inputs.push({ id: i.id, label: i.getAttribute("aria-label") ?? i.name, ph: i.placeholder }));
        return out;
      });
      console.log("STEP2:", JSON.stringify(step2, null, 1));

      // PROBE 2: card formatting (type raw digits)
      const cardInput = page.getByLabel(/card number/i).first();
      if (await cardInput.count()) {
        await cardInput.pressSequentially("4242424242424242", { delay: 25 });
        await page.waitForTimeout(300);
        console.log("P2 card after type:", JSON.stringify(await cardInput.inputValue()));
        const review = page.getByRole("button", { name: /review/i }).first();
        if (await review.count()) console.log("P2 review disabled (no exp/cvc):", await review.isDisabled());
      }

      // PROBE 3: step2 Back -> step1 preserved?
      const back = page.getByRole("button", { name: /back/i }).first();
      if (await back.count()) {
        await back.click();
        await page.waitForTimeout(1500);
        const vals = await page.evaluate(() => {
          const v = {};
          document.querySelectorAll("main input, form input").forEach((i) => {
            const l = i.getAttribute("aria-label") ?? i.name ?? i.id;
            if (l && i.type !== "hidden") v[l] = i.value;
          });
          return v;
        });
        console.log("P3 step1 values after back:", JSON.stringify(vals));
        await page.screenshot({ path: OUT + "/ref-step1-after-back.png", fullPage: true });
      }
    }
  }
}
await browser.close();
