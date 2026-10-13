// Round-55 REFERENCE probe D: focus-visible ON the icon buttons — tab-walk
// from page load (NO body click — the r55d first-attempt lesson: a click at
// (10,400) lands in the hero and the tab sequence starts mid-page) through
// logo + 5 nav links to the search button (tab 7), heart (8), bag (9), user
// (10). Reads the computed outline/box-shadow (the ring-vs-global-outline
// question from r53).
// Run: node scripts/headericons-probe-r55d.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const report = (k, v) => console.log(`  ${k.padEnd(58)} ${v}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1 });

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
await page.goto(REF + "/", { waitUntil: "networkidle" });
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
      boxShadow: s.boxShadow.slice(0, 110),
      matchesFocusVisible: el.matches(":focus-visible"),
    };
  });

await page.mouse.move(10, 760); // park the pointer in the footer whitespace, no click
for (let i = 1; i <= 10; i++) {
  await page.keyboard.press("Tab");
  await page.waitForTimeout(150);
  const f = await readFocus();
  report(`ref tab ${i}`, JSON.stringify(f));
}

await browser.close();
console.log("\n[r55d REFERENCE icon-button focus-visible probe complete]");
