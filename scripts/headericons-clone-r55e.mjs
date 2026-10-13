// Round-55 CLONE probe E: focus-visible ON the icon buttons (tab-walk from
// page load, no click — the r55d lesson) + the badge superset anatomy with an
// item in the cart (the ATC locator scoped to the buy panel — the r55c
// strict-mode lesson).
// Run via: bash scripts/battery-runner.sh headericons-clone-r55e.mjs prod
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const report = (k, v) => console.log(`  ${k.padEnd(58)} ${v}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

const lp = await ctx.newPage();
await lp.goto(CLONE + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await lp.getByLabel("Password").fill("$Abcd1234");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try { await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 }); } catch {}
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
await lp.close();

const page = await ctx.newPage();
await page.goto(CLONE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const readFocus = () =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return "none";
    const s = getComputedStyle(el);
    const svg = el.querySelector("svg");
    return {
      tag: el.tagName,
      svg: svg ? svg.getAttribute("class") : null,
      outline: s.outlineStyle + " " + s.outlineWidth + " " + s.outlineColor,
      outlineOffset: s.outlineOffset,
      boxShadow: s.boxShadow.slice(0, 110),
      matchesFocusVisible: el.matches(":focus-visible"),
    };
  });

await page.mouse.move(10, 760);
for (let i = 1; i <= 10; i++) {
  await page.keyboard.press("Tab");
  await page.waitForTimeout(150);
  const f = await readFocus();
  report(`clone tab ${i}`, JSON.stringify(f));
}

// ---- the badge: add ONE item via the buy panel's ATC (scoped: the FIRST
// Add to Cart button — the buy panel precedes related products in the DOM).
const pdp = await ctx.newPage();
await pdp.goto(CLONE + "/product/wireless-headphones", { waitUntil: "networkidle" });
await pdp.waitForTimeout(800);
try {
  await pdp.getByRole("button", { name: /add to cart/i }).first().click({ timeout: 8000 });
  await pdp.waitForTimeout(1200);
} catch (e) { report("atc click", "FAILED " + e.message.split("\n")[0].slice(0, 60)); }
try { await pdp.keyboard.press("Escape"); } catch {}
await pdp.close();

const badge = await page.evaluate(async () => {
  await new Promise((r) => setTimeout(r, 400));
  const header = document.querySelector("header");
  const bag = [...header.querySelectorAll("button")].find((b) => b.querySelector("svg.lucide-shopping-bag"));
  if (!bag) return "bag not found";
  const span = bag.querySelector("span");
  if (!span) return { badge: false, aria: bag.getAttribute("aria-label") };
  const s = getComputedStyle(span);
  const r = span.getBoundingClientRect();
  const br = bag.getBoundingClientRect();
  return {
    badge: true, text: span.textContent.trim(),
    cls: span.getAttribute("class"),
    computed: { bg: s.backgroundColor, color: s.color, fontSize: s.fontSize, fontWeight: s.fontWeight, h: s.height, minW: s.minWidth, radius: s.borderRadius, pos: s.position, display: s.display, pad: s.padding, zIndex: s.zIndex },
    geom: `span ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} | bag ${Math.round(br.x)},${Math.round(br.y)} ${Math.round(br.width)}x${Math.round(br.height)}`,
    aria: bag.getAttribute("aria-label"),
  };
});
report("clone badge (1 item)", JSON.stringify(badge));

await browser.close();
console.log("\n[r55e CLONE focus + badge probe complete]");
