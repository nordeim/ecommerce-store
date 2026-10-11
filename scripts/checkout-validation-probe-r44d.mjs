// Round-44 probe v4: patient drawer path — let the add-to-cart toast expire
// (3000ms lifetime) before clicking the header cart button, then the drawer's
// Checkout link, then measure the validation anatomy.
import { chromium } from "playwright-core";
const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/audit-r44";
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
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
await page.getByRole("button", { name: /add to cart/i }).first().click();
// let the toast expire (3000ms lifetime) — it overlays the header
await page.waitForTimeout(4200);
const cartBtn = page.getByRole("button", { name: /cart/i }).first();
await cartBtn.click();
await page.waitForTimeout(2500);
await page.screenshot({ path: OUT + "/v4-drawer.png" });
const drawer = await page.evaluate(() => {
  const d = document.querySelector("[role=dialog], [data-state=open]");
  return { found: !!d, text: d?.textContent?.replace(/\s+/g, " ").slice(0, 400) ?? null };
});
console.log("DRAWER:", JSON.stringify(drawer));

if (drawer.found) {
  const co = page.locator("[role=dialog] a, [data-state=open] a").filter({ hasText: /checkout/i }).first();
  console.log("checkout link:", await co.count());
  if (await co.count()) {
    await co.click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState("networkidle");
    console.log("CHECKOUT URL:", new URL(page.url()).pathname);
    await page.screenshot({ path: OUT + "/v4-step1.png", fullPage: true });

    const step1 = await page.evaluate(() => {
      const out = { h2: [], inputs: [], buttons: [] };
      document.querySelectorAll("h2").forEach((h) => out.h2.push(h.textContent?.trim()));
      document.querySelectorAll("main input, form input").forEach((i) =>
        out.inputs.push({ id: i.id, type: i.type, label: i.getAttribute("aria-label") ?? i.name, ph: i.placeholder, auto: i.autocomplete })
      );
      document.querySelectorAll("main button, form button").forEach((b) => out.buttons.push({ text: b.textContent?.trim(), disabled: b.disabled }));
      return out;
    });
    console.log("STEP1:", JSON.stringify(step1, null, 1));

    const cont = page.getByRole("button", { name: /continue/i }).first();
    if (await cont.count()) {
      console.log("P1 resting disabled:", await cont.isDisabled());
      const set = async (label, value) => {
        const loc = page.getByLabel(label, { exact: false }).first();
        if (await loc.count()) { await loc.fill(value); await page.waitForTimeout(300); return true; }
        console.log("  (no label:", label, ")");
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
        await page.waitForTimeout(2500);
        await page.waitForLoadState("networkidle");
        await page.screenshot({ path: OUT + "/v4-step2.png", fullPage: true });
        const step2 = await page.evaluate(() => {
          const out = { h2: [], buttons: [], inputs: [] };
          document.querySelectorAll("h2").forEach((h) => out.h2.push(h.textContent?.trim()));
          document.querySelectorAll("main button, form button").forEach((b) => out.buttons.push({ text: b.textContent?.trim(), disabled: b.disabled }));
          document.querySelectorAll("main input, form input").forEach((i) => out.inputs.push({ id: i.id, label: i.getAttribute("aria-label") ?? i.name, ph: i.placeholder }));
          return out;
        });
        console.log("STEP2:", JSON.stringify(step2, null, 1));

        const cardInput = page.getByLabel(/card number/i).first();
        if (await cardInput.count()) {
          await cardInput.pressSequentially("4242424242424242", { delay: 25 });
          await page.waitForTimeout(400);
          console.log("P2 card after type:", JSON.stringify(await cardInput.inputValue()));
        }
        const back = page.getByRole("button", { name: /back/i }).first();
        if (await back.count()) {
          await back.click();
          await page.waitForTimeout(1800);
          const vals = await page.evaluate(() => {
            const v = {};
            document.querySelectorAll("main input, form input").forEach((i) => {
              const l = i.getAttribute("aria-label") ?? i.name ?? i.id;
              if (l && i.type !== "hidden") v[l] = i.value;
            });
            return v;
          });
          console.log("P3 step1 after back:", JSON.stringify(vals));
          await page.screenshot({ path: OUT + "/v4-step1-after-back.png", fullPage: true });
        }
      }
    }
  }
}
await browser.close();
