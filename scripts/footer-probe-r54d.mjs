// Round-54 REFERENCE probe D: the exact bottom-row DOM structure (the parent
// div + every child's tag/class) — the byte-parity target for the policy-span
// fix. Also the first-column logo span. Run: node scripts/footer-probe-r54d.mjs
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const report = (k, v) => console.log(`  ${k.padEnd(56)} ${v}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

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

const structure = await page.evaluate(() => {
  const footer = document.querySelector("footer");
  if (!footer) return { found: false };
  const rows = [...footer.querySelectorAll("div")].filter((d) => getComputedStyle(d).display.includes("flex") && d.textContent.includes("©"));
  const row = rows[rows.length - 1];
  if (!row) return { found: false };
  const parent = row.parentElement;
  const read = (el) => ({ tag: el.tagName, cls: (el.className || "").toString(), text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60) });
  return {
    found: true,
    row: read(row),
    rowChildren: [...row.children].map(read),
    parent: read(parent),
    // the logo span (first column)
    logo: (() => {
      const span = [...footer.querySelectorAll("span")].find((s) => /^LUXE$/i.test(s.textContent.trim()));
      return span ? read(span) : null;
    })(),
    // the first column's heading inventory: is there an h3 above the logo?
    firstColHeadings: (() => {
      const grid = footer.querySelector(".grid");
      const col1 = grid ? grid.firstElementChild : null;
      return col1 ? { tag: col1.tagName, childTags: [...col1.children].map((c) => c.tagName + ":" + (c.textContent || "").trim().slice(0, 18)) } : null;
    })(),
  };
});
for (const [k, v] of Object.entries(structure)) report(k, JSON.stringify(v));

await browser.close();
console.log("\n[r54d REFERENCE bottom-row structure probe complete]");
