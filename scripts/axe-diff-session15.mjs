// Session-15 axe differential (pre-remediation measurement): injects the
// SAME axe-core build (4.14.0 from the repo's node_modules) into both the
// reference and the clone on the pinned route set, then prints both
// violation profiles for the parity comparison (the session-12
// methodology, repeated to establish the current baseline before pinning
// it as a standing E2E gate).
// Run: node scripts/axe-diff-session15.mjs   (server on :3000)
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const CLONE = "http://localhost:3000";
const AXE = readFileSync("./node_modules/axe-core/axe.min.js", "utf8");

const ROUTES = [
  { path: "/", desc: "home" },
  { path: "/shop", desc: "shop" },
  { path: "/product/wireless-headphones", desc: "pdp" },
  { path: "/cart", desc: "cart" },
  { path: "/account", desc: "account" },
  { path: "/login", desc: "login", anon: true },
];

const runAxe = async (ctx, base, path) => {
  const page = await ctx.newPage();
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.evaluate(AXE); // define axe
  const results = await page.evaluate(async () => {
    // scroll to bottom to reveal lazy content (the session-12
    // whileInView methodology trap: framer-motion wrappers keep content
    // opacity:0 until scrolled)
    await new Promise((res) => {
      let y = 0;
      const iv = setInterval(() => {
        window.scrollBy(0, 400);
        y += 400;
        if (y > document.body.scrollHeight) { clearInterval(iv); res(); }
      }, 60);
    });
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
    const r = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, tags: v.tags.filter((t) => t.startsWith("wcag")).slice(0, 3) }));
  });
  await page.close();
  return results;
};

const browser = await chromium.launch();

// ref (operator account)
const refCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
{
  const lp = await refCtx.newPage();
  await lp.goto(REF + "/login", { waitUntil: "networkidle" });
  await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
  await lp.getByLabel("Password").fill("$Abcd1234");
  await lp.getByRole("button", { name: "Log in", exact: true }).click();
  await lp.waitForLoadState("networkidle");
  await lp.waitForTimeout(1200);
  await lp.close();
}
// clone (demo user)
const cloneCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
{
  const lp = await cloneCtx.newPage();
  await lp.goto(CLONE + "/login", { waitUntil: "networkidle" });
  await lp.getByLabel("Email").fill("john@example.com");
  await lp.getByLabel("Password").fill("Demo1234!");
  await lp.getByRole("button", { name: "Log in", exact: true }).click();
  await lp.waitForLoadState("networkidle");
  await lp.waitForTimeout(1200);
  await lp.close();
}
const refAnon = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const cloneAnon = await browser.newContext({ viewport: { width: 1280, height: 800 } });

const profile = {};
for (const r of ROUTES) {
  const ref = await runAxe(r.anon ? refAnon : refCtx, REF, r.path);
  const clone = await runAxe(r.anon ? cloneAnon : cloneCtx, CLONE, r.path);
  profile[r.desc] = { ref, clone };
  const refIds = ref.map((v) => `${v.id}(${v.nodes})`).join(", ") || "CLEAN";
  const cloneIds = clone.map((v) => `${v.id}(${v.nodes})`).join(", ") || "CLEAN";
  console.log(`${r.desc.padEnd(8)} REF : ${refIds}`);
  console.log(`${"".padEnd(8)} CLONE: ${cloneIds}`);
}
await browser.close();
console.log("\n(methodology: same axe build both sides; scrolled reveal per the session-12 whileInView trap)");
