// Session-20 axe differential (Round-20 pre-remediation measurement): the
// session-19 methodology extended to the round's NEW surface — the
// reference's /reset-password route (discovered via the round's SEO/sitemap
// differential: the reference's platform sitemap lists 10 app routes
// including /reset-password, which the clone does NOT ship — the clone
// renders its platform 404 there). The reference carries a REAL 2-state
// route: no token -> the "Invalid reset link" screen; any token -> the
// "New password" form. Both sides measured here (the clone side documents
// the gap: the 404 census), desktop AND mobile viewports, anonymous
// contexts, the SAME axe-core 4.14.0 build, the scrolled-reveal pass.
// Run: node scripts/axe-diff-session20.mjs   (server on :3000)
import { chromium, devices } from "playwright-core";
import { readFileSync } from "node:fs";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const CLONE = "http://localhost:3000";
const AXE = readFileSync("./node_modules/axe-core/axe.min.js", "utf8");
const IPHONE = devices["iPhone 14"];
const DESKTOP = { viewport: { width: 1280, height: 720 } };

// The reference's two reset-password states (anonymous surfaces).
const ROUTES = [
  { path: "/reset-password", desc: "reset (no token)" },
  { path: "/reset-password?token=diff-probe", desc: "reset (with token)" },
];

const runAxe = async (ctx, base, path) => {
  const page = await ctx.newPage();
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.evaluate(AXE); // define axe
  const results = await page.evaluate(async () => {
    // scroll to bottom to reveal lazy content (the session-12
    // whileInView methodology trap), then back to top.
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
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
  });
  await page.close();
  return results;
};

const browser = await chromium.launch();

// ---------- PART 1: desktop differential (1280x720, both sites, anon) ----------
console.log("=== RESET-PASSWORD — DESKTOP (1280x720, anonymous) ===");
const refDesktop = await browser.newContext({ ...DESKTOP });
const cloneDesktop = await browser.newContext({ ...DESKTOP });

for (const r of ROUTES) {
  const ref = await runAxe(refDesktop, REF, r.path);
  const clone = await runAxe(cloneDesktop, CLONE, r.path);
  const fmt = (v) => v.map((x) => `${x.id}(${x.nodes})`).join(", ") || "ZERO violations";
  console.log(`${r.desc.padEnd(18)} REF:  ${fmt(ref)}`);
  console.log(`${"".padEnd(18)} CLONE: ${fmt(clone)}`);
}

await refDesktop.close();
await cloneDesktop.close();

// ---------- PART 2: mobile differential (iPhone 14, both sites, anon) ----------
console.log("\n=== RESET-PASSWORD — MOBILE (iPhone 14 — 390x844, DPR 3, touch) ===");
const refMobile = await browser.newContext({ ...IPHONE });
const cloneMobile = await browser.newContext({ ...IPHONE });

for (const r of ROUTES) {
  const ref = await runAxe(refMobile, REF, r.path);
  const clone = await runAxe(cloneMobile, CLONE, r.path);
  const fmt = (v) => v.map((x) => `${x.id}(${x.nodes})`).join(", ") || "ZERO violations";
  console.log(`${r.desc.padEnd(18)} REF:  ${fmt(ref)}`);
  console.log(`${"".padEnd(18)} CLONE: ${fmt(clone)}`);
}

await refMobile.close();
await cloneMobile.close();
await browser.close();
console.log("\nDone. The reference side calibrates the pins for the new route;");
console.log("the clone side (its 404 census today) documents the parity gap.");
