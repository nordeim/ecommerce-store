// Session-16 axe differential (Round-16 pre-remediation measurement): the
// session-15 methodology extended to the round's two NEW surfaces —
//   (a) MOBILE viewports: the same 6 pinned routes measured on BOTH sites
//       under iPhone 14 emulation (390x844, DPR 3, touch, mobile UA) — the
//       mobile parity profile has never been measured with axe (15 rounds of
//       mobile-nav geometry verifications, but no mobile a11y census);
//   (b) ADMIN surfaces (clone-only — superset surface, no reference
//       counterpart): /admin, /admin/orders, /admin/products and the order
//       detail, a desktop census establishing the admin a11y baseline.
// Same axe build (4.14.0 from the repo's node_modules) on every side; the
// scrolled-reveal pass per the session-12 whileInView trap.
// Run: node scripts/axe-diff-session16.mjs   (server on :3000)
import { chromium, devices } from "playwright-core";
import { readFileSync } from "node:fs";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const CLONE = "http://localhost:3000";
const AXE = readFileSync("./node_modules/axe-core/axe.min.js", "utf8");
const IPHONE = devices["iPhone 14"];

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
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
  });
  await page.close();
  return results;
};

const login = async (ctx, base, email, password) => {
  const page = await ctx.newPage();
  await page.goto(base + "/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);
  const path = new URL(page.url()).pathname;
  await page.close();
  return path;
};

const browser = await chromium.launch();

// ---------- PART 1: mobile differential (iPhone 14, both sites) ----------
console.log("=== MOBILE (iPhone 14 — 390x844, DPR 3, touch) ===");
const refMobile = await browser.newContext({ ...IPHONE });
const refMobilePath = await login(refMobile, REF, "sepnetflix2023@outlook.com", "$Abcd1234");
console.log("ref login ->", refMobilePath);
const cloneMobile = await browser.newContext({ ...IPHONE });
const cloneMobilePath = await login(cloneMobile, CLONE, "john@example.com", "Demo1234!");
console.log("clone login ->", cloneMobilePath);
if (cloneMobilePath !== "/account") {
  console.error("CLONE AUTH FAILED — aborting (L22)");
  process.exit(1);
}
const refAnonM = await browser.newContext({ ...IPHONE });
const cloneAnonM = await browser.newContext({ ...IPHONE });

const mobileProfile = {};
for (const r of ROUTES) {
  const ref = await runAxe(r.anon ? refAnonM : refMobile, REF, r.path);
  const clone = await runAxe(r.anon ? cloneAnonM : cloneMobile, CLONE, r.path);
  mobileProfile[r.desc] = { ref, clone };
  const refIds = ref.map((v) => `${v.id}(${v.nodes})`).join(", ") || "CLEAN";
  const cloneIds = clone.map((v) => `${v.id}(${v.nodes})`).join(", ") || "CLEAN";
  console.log(`${r.desc.padEnd(8)} REF : ${refIds}`);
  console.log(`${"".padEnd(8)} CLONE: ${cloneIds}`);
}

// ---------- PART 2: admin census (clone-only, desktop) ----------
console.log("\n=== ADMIN (clone-only, Desktop 1280x720) ===");
const adminCtx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const adminPath = await login(adminCtx, CLONE, "admin@luxestore.com", "Admin1234!");
console.log("admin login ->", adminPath);
if (adminPath !== "/account") {
  console.error("ADMIN AUTH FAILED — aborting");
  process.exit(1);
}

// fetch a seeded order id for the detail route (the canonical ORD-2026-001)
const idPage = await adminCtx.newPage();
await idPage.goto(CLONE + "/admin/orders", { waitUntil: "networkidle" });
const orderId = await idPage.evaluate(() => {
  const link = document.querySelector('a[href^="/admin/orders/"][href*="cm"]');
  return link ? link.getAttribute("href").split("/").pop() : null;
});
await idPage.close();
console.log("order detail id ->", orderId);

const ADMIN_ROUTES = [
  { path: "/admin", desc: "admin-dashboard" },
  { path: "/admin/orders", desc: "admin-orders" },
  { path: "/admin/products", desc: "admin-products" },
  ...(orderId ? [{ path: `/admin/orders/${orderId}`, desc: "admin-order-detail" }] : []),
];

const adminProfile = {};
for (const r of ADMIN_ROUTES) {
  const clone = await runAxe(adminCtx, CLONE, r.path);
  adminProfile[r.desc] = clone;
  const cloneIds = clone.map((v) => `${v.id}(${v.nodes})`).join(", ") || "CLEAN";
  console.log(`${r.desc.padEnd(19)} CLONE: ${cloneIds}`);
}

await browser.close();
console.log("\n(methodology: same axe build every side; scrolled reveal per the session-12 whileInView trap)");
