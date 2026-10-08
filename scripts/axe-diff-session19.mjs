// Session-19 axe differential (Round-19 pre-remediation measurement): the
// session-15/16 methodology extended to the round's NEW surface — the
// remaining AUTH SCREENS (register / forgot-password / verify-email), the
// nominated round-19 completion candidate: the standing axe gate covers
// login (desktop + mobile) but NOT the rest of the auth family, though the
// family shares one anatomy (header block outside the card, icon-led
// inputs, tinted error box). A defect introduced on register/forgot/
// verify-email passes the standing gate forever — the A11Y-GATE-2
// structural-blindness story, now for the auth family's remaining routes.
// Measured on BOTH sites (the reference carries the same family), desktop
// AND mobile viewports, anonymous contexts (the auth screens render
// standalone for anon visitors — the auth.spec pattern).
// Same axe build (4.14.0 from the repo's node_modules) on every side; the
// scrolled-reveal pass per the session-12 whileInView trap.
// Run: node scripts/axe-diff-session19.mjs   (server on :3000)
import { chromium, devices } from "playwright-core";
import { readFileSync } from "node:fs";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const CLONE = "http://localhost:3000";
const AXE = readFileSync("./node_modules/axe-core/axe.min.js", "utf8");
const IPHONE = devices["iPhone 14"];
const DESKTOP = { viewport: { width: 1280, height: 720 } };

// All three auth screens are anonymous surfaces (standalone, no chrome).
const ROUTES = [
  { path: "/register", desc: "register" },
  { path: "/forgot-password", desc: "forgot-password" },
  { path: "/verify-email", desc: "verify-email" },
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
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
  });
  await page.close();
  return results;
};

const browser = await chromium.launch();

// ---------- PART 1: desktop differential (1280x720, both sites, anon) ----------
console.log("=== AUTH SCREENS — DESKTOP (1280x720, anonymous) ===");
const refDesktop = await browser.newContext({ ...DESKTOP });
const cloneDesktop = await browser.newContext({ ...DESKTOP });

for (const r of ROUTES) {
  const ref = await runAxe(refDesktop, REF, r.path);
  const clone = await runAxe(cloneDesktop, CLONE, r.path);
  const fmt = (v) => v.map((x) => `${x.id}(${x.nodes})`).join(", ") || "ZERO violations";
  console.log(`${r.desc.padEnd(16)} REF:  ${fmt(ref)}`);
  console.log(`${"".padEnd(16)} CLONE: ${fmt(clone)}`);
}

await refDesktop.close();
await cloneDesktop.close();

// ---------- PART 2: mobile differential (iPhone 14, both sites, anon) ----------
console.log("\n=== AUTH SCREENS — MOBILE (iPhone 14 — 390x844, DPR 3, touch) ===");
const refMobile = await browser.newContext({ ...IPHONE });
const cloneMobile = await browser.newContext({ ...IPHONE });

for (const r of ROUTES) {
  const ref = await runAxe(refMobile, REF, r.path);
  const clone = await runAxe(cloneMobile, CLONE, r.path);
  const fmt = (v) => v.map((x) => `${x.id}(${x.nodes})`).join(", ") || "ZERO violations";
  console.log(`${r.desc.padEnd(16)} REF:  ${fmt(ref)}`);
  console.log(`${"".padEnd(16)} CLONE: ${fmt(clone)}`);
}

await refMobile.close();
await cloneMobile.close();
await browser.close();
console.log("\nDone. The parity contract: the clone's census must be {color-contrast}-only (or better);");
console.log("any OTHER rule firing on the clone is a regression against the aria superset.");
