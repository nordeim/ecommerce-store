// Round-48 calibration probe (d7): the FULL untruncated class strings of
// the reference's step-2 option boxes + the hover-state border + the card
// fields' group container's raw class. Run: node scripts/checkout-paystep-probe-r48g.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
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

const raw = await page.evaluate(() => {
  const radios = [...document.querySelectorAll("[role=radio], input[type=radio]")];
  const boxes = radios.map((r) => {
    let box = r.parentElement;
    while (box && box !== document.body) {
      const s = getComputedStyle(box);
      if (s.borderTopWidth !== "0px" || s.backgroundColor !== "rgba(0, 0, 0, 0)") return box;
      box = box.parentElement;
    }
    return null;
  }).filter(Boolean);
  // the card fields' group container: the parent of the card input's label-chain root
  const card = [...document.querySelectorAll("input")].find((i) => i.placeholder === "4242 4242 4242 4242");
  let fieldGroup = card ? card.closest("div:not([class=''])") : null;
  // walk up to the direct child of space-y-6
  let g = card;
  while (g?.parentElement && !/space-y-6/.test(String(g.parentElement.className))) g = g.parentElement;
  return {
    boxClasses: boxes.map((b) => b.getAttribute("class")),
    radioClass: radios[0]?.getAttribute("class"),
    cardFieldGroupClass: g?.parentElement?.className ?? null,
    cardFieldGroupClass2: g?.className ?? null,
    formClass: document.querySelector("form")?.getAttribute("class"),
  };
});
console.log(JSON.stringify(raw, null, 1));

// the hover state on the paypal box
const paypalBox = page.locator("[role=radio], input[type=radio]").nth(1);
await paypalBox.hover();
await page.waitForTimeout(500);
const hoverBorder = await page.evaluate(() => {
  const radios = [...document.querySelectorAll("[role=radio], input[type=radio]")];
  const box = radios[1]?.parentElement?.closest("div.rounded-xl") ?? radios[1]?.parentElement;
  return box ? getComputedStyle(box).borderColor : null;
});
console.log("hover border (paypal box):", hoverBorder);

await browser.close();
console.log("PROBE COMPLETE");
