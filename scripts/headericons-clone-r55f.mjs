// Round-55 CLONE probe F: the badge superset anatomy — add ONE item via the
// buy panel's ATC on the PDP, then RELOAD the home page (the r55e lesson: the
// home page's client store hydrated BEFORE the add — the badge needs a
// re-hydration to paint) and read the badge's class + computed + geometry.
// Run via: bash scripts/battery-runner.sh headericons-clone-r55f.mjs prod
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

// add ONE item on the PDP
const pdp = await ctx.newPage();
await pdp.goto(CLONE + "/product/wireless-headphones", { waitUntil: "networkidle" });
await pdp.waitForTimeout(800);
try {
  await pdp.getByRole("button", { name: /add to cart/i }).first().click({ timeout: 8000 });
  await pdp.waitForTimeout(1200);
  report("atc click", "OK");
} catch (e) { report("atc click", "FAILED " + e.message.split("\n")[0].slice(0, 60)); }
try { await pdp.keyboard.press("Escape"); } catch {}
await pdp.close();

// RELOAD home — the client store re-hydrates with the cart
const page = await ctx.newPage();
await page.goto(CLONE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const badge = await page.evaluate(() => {
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
    computed: {
      bg: s.backgroundColor, color: s.color, fontSize: s.fontSize, lineHeight: s.lineHeight,
      fontWeight: s.fontWeight, h: s.height, minW: s.minWidth, radius: s.borderRadius,
      pos: s.position, top: s.top, right: s.right, display: s.display, pad: s.padding,
    },
    geom: `span ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} | bag ${Math.round(br.x)},${Math.round(br.y)} ${Math.round(br.width)}x${Math.round(br.height)}`,
    aria: bag.getAttribute("aria-label"),
  };
});
report("clone badge (1 item, reloaded)", JSON.stringify(badge));

// the hover WITH the badge: does the accent hover still paint?
const bagBtn = page.locator("header button").filter({ has: page.locator("svg.lucide-shopping-bag") }).first();
try {
  await bagBtn.hover({ timeout: 8000 });
  await page.waitForTimeout(400);
  const cs = await bagBtn.evaluate((node) => {
    const s = getComputedStyle(node);
    return { bg: s.backgroundColor, color: s.color };
  });
  report("bag hover (with badge)", JSON.stringify(cs));
} catch (e) { report("bag hover", "FAILED " + e.message.split("\n")[0].slice(0, 50)); }

// clean up: remove the item (leave the demo cart as found)
const drawer = await ctx.newPage();
await drawer.goto(CLONE + "/cart", { waitUntil: "networkidle" });
await drawer.waitForTimeout(800);
try {
  await drawer.getByRole("button", { name: /remove/i }).first().click({ timeout: 6000 });
  await drawer.waitForTimeout(600);
  report("cleanup remove", "OK");
} catch { report("cleanup remove", "SKIPPED (manual)"); }
await drawer.close();

await browser.close();
console.log("\n[r55f CLONE badge anatomy probe complete]");
