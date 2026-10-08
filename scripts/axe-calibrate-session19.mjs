// Calibrate the Round-19 auth-screens axe-gate counts under EXACT E2E
// conditions (standalone server on :3100 with db/e2e.db at the fresh-reset
// canonical state, ANONYMOUS contexts — the auth screens render standalone
// for anon visitors, the auth.spec/login-gate pattern) so the accessibility
// spec pins real numbers:
//   - DESKTOP: the 3 auth screens (register / forgot-password /
//     verify-email) at 1280x720, anon context
//   - MOBILE: the same 3 screens under devices["iPhone 14"] (the same
//     descriptor the E2E describe will spread into its newContext)
// The auth screens are DB-independent anonymous surfaces, so the counts
// are expected byte-identical to the live differential (2/2/1) — the
// calibration CONFIRMS the invariance (the admin-gate precedent).
// Run: node scripts/axe-calibrate-session19.mjs   (after e2e-reset, :3100 up)
import { chromium, devices } from "playwright-core";
import { readFileSync } from "node:fs";

const BASE = "http://localhost:3100";
const AXE = readFileSync("./node_modules/axe-core/axe.min.js", "utf8");

const ROUTES = [
  { path: "/register", desc: "register" },
  { path: "/forgot-password", desc: "forgot-password" },
  { path: "/verify-email", desc: "verify-email" },
];

const browser = await chromium.launch();

const runAxe = async (ctx, path) => {
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.evaluate(AXE);
  const counts = await page.evaluate(async () => {
    await new Promise((res) => {
      let y = 0;
      const iv = setInterval(() => {
        window.scrollBy(0, 400); y += 400;
        if (y > document.body.scrollHeight) { clearInterval(iv); res(); }
      }, 60);
    });
    window.scrollTo(0, 0);
    await new Promise((r2) => setTimeout(r2, 300));
    const out = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
    return out.violations.map((v) => `${v.id}:${v.nodes.length}`);
  });
  await page.close();
  return counts.join(", ") || "CLEAN";
};

// ---------- DESKTOP (1280x720, anonymous — the E2E describe's exact shape) ----------
console.log("=== DESKTOP (1280x720, anon, e2e conditions) ===");
const desktop = await browser.newContext({ viewport: { width: 1280, height: 720 } });
for (const r of ROUTES) {
  console.log(`${r.desc.padEnd(16)} ${await runAxe(desktop, r.path)}`);
}
await desktop.close();

// ---------- MOBILE (iPhone 14, anonymous — the E2E describe's exact shape) ----------
console.log("\n=== MOBILE (iPhone 14, anon, e2e conditions) ===");
const mobile = await browser.newContext({ ...devices["iPhone 14"] });
for (const r of ROUTES) {
  console.log(`${r.desc.padEnd(16)} ${await runAxe(mobile, r.path)}`);
}
await mobile.close();

await browser.close();
console.log("\nExpected (live differential): {color-contrast} at 2/2/1, both viewports.");
