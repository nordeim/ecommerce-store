// Round-48 calibration probe (d6): the reference's step-2 GEOMETRY — the
// card fields' layout (stacked vs grid, widths, gaps) + the option boxes'
// metrics + the gaps between the groups. Completes the calibration table.
// Run: node scripts/checkout-paystep-probe-r48f.mjs
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
await page.waitForLoadState("networkidle");

const geo = await page.evaluate(() => {
  const pick = (ph) => [...document.querySelectorAll("input")].find((i) => i.placeholder === ph);
  const card = pick("4242 4242 4242 4242"), exp = pick("MM/YY"), cvc = pick("123");
  const rb = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
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
  const labels = [...document.querySelectorAll("label")].filter((l) => /paypal|credit/i.test(l.textContent ?? ""));
  return {
    cardBox: card ? rb(card) : null,
    expBox: exp ? rb(exp) : null,
    cvcBox: cvc ? rb(cvc) : null,
    optionBoxes: boxes.map((b) => rb(b)),
    optionLabels: labels.map((l) => {
      const r = l.getBoundingClientRect();
      return { text: (l.textContent ?? "").trim().slice(0, 24), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), fontSize: getComputedStyle(l).fontSize, weight: getComputedStyle(l).fontWeight, color: getComputedStyle(l).color };
    }),
    // the label texts next to each radio: also the label ABOVE each input? find the text labels for the card fields
    fieldLabels: [...document.querySelectorAll("label")].map((l) => {
      const t = (l.textContent ?? "").trim();
      if (/card number|expir|cvc|cvv|security/i.test(t)) {
        const r = l.getBoundingClientRect();
        return { text: t.slice(0, 24), y: Math.round(r.y), x: Math.round(r.x), fontSize: getComputedStyle(l).fontSize };
      }
      return null;
    }).filter(Boolean),
    icons: [...document.querySelectorAll("label svg, [role=radio] svg, button[role=radio] svg")].map((s) => ({ cls: String(s.className.baseVal ?? s.className).slice(0, 40), parent: s.closest("div, label")?.className?.slice?.(0, 50) ?? "?" })),
  };
});
console.log(JSON.stringify(geo, null, 1));

await browser.close();
console.log("PROBE COMPLETE");
