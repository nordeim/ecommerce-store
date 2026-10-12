// Round-49 VLM reconciliation v3: capture the REFERENCE's own PDP stepper
// element at qty 1 (enabled minus, opacity 1 — the measured ground truth)
// and run the IDENTICAL pixel-zone analysis. If the reference's minus icon
// also renders at the same lightness as the clone's, the "dimmed" look is
// the icon's natural rendering at 16px (sub-pixel stroke alignment) — the
// VLM's "disabled" read is world knowledge over pixels, and the clone
// matches the reference exactly.
import { chromium } from "playwright-core";
import { PNG } from "../node_modules/playwright-core/lib/utilsBundle.js";
import { readFileSync } from "node:fs";

const REF = "https://fuzzy-lumina-style-hub.base44.app";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
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
await page.waitForTimeout(1500);

// the reference's stepper container: the div wrapping the minus/plus buttons
const container = page.locator("button svg.lucide-minus").first().locator("xpath=ancestor::div[1]");
await container.screenshot({ path: "/tmp/ref-stepper-element.png" });

const truth = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-minus"));
  const p = [...document.querySelectorAll("button")].find((x) => x.querySelector("svg.lucide-plus"));
  return {
    minus: { disabled: b?.disabled === true, opacity: b ? getComputedStyle(b).opacity : null, svgColor: b ? getComputedStyle(b.querySelector("svg")).color : null },
    plus: { disabled: p?.disabled === true, opacity: p ? getComputedStyle(p).opacity : null },
  };
});
console.log("[REF DOM truth]", JSON.stringify(truth));

const zone = (data, width, height, x0, x1, y0, y1) => {
  let darkest = 255, sum = 0, n = 0, dark4 = 0;
  for (let y = Math.max(0, y0); y < Math.min(y1, height); y++) {
    for (let x = Math.max(0, x0); x < Math.min(x1, width); x++) {
      const i = (y * width + x) * 4;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < darkest) darkest = lum;
      if (lum < 120) dark4++;
      sum += lum; n++;
    }
  }
  return { darkest: Math.round(darkest), avg: Math.round(sum / Math.max(1, n)), sub120: dark4 };
};

for (const [label, path] of [["REFERENCE", "/tmp/ref-stepper-element.png"], ["CLONE", "/tmp/stepper-element.png"]]) {
  try {
    const png = PNG.sync.read(readFileSync(path));
    const { width, height, data } = png;
    const m = zone(data, width, height, 8, 36, 8, height - 8);
    const p = zone(data, width, height, width - 36, width - 8, 8, height - 8);
    console.log(`[${label} pixels] minus zone: darkest ${m.darkest} sub120 ${m.sub120} avg ${m.avg} | plus zone: darkest ${p.darkest} sub120 ${p.sub120} avg ${p.avg}`);
  } catch (e) {
    console.log(`[${label}] missing capture: ${path}`);
  }
}

await browser.close();
console.log("\nIf REFERENCE minus zone ~ CLONE minus zone (within a few luminance points), the icons render IDENTICALLY — the VLM's 'disabled' read is a world-knowledge misread of a naturally-light 16px glyph.");
