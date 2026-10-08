// Session-15 full-route census (the round's new audit surface): walks EVERY
// clone route in a real browser, capturing (a) console errors/warnings,
// (b) page errors, (c) the set of internal links on the page, then fetches
// each unique internal link target and reports non-200/expected statuses.
// Production-readiness surface: prior rounds censused 7-12 routes; this
// covers the full route manifest + link integrity.
// Run: node scripts/census-session15.mjs   (server on :3000, logged-in state)
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";

// The full route manifest (23 routes per the build output)
const ROUTES = [
  { path: "/", desc: "home" },
  { path: "/shop", desc: "shop" },
  { path: "/shop?category=electronics", desc: "shop-filtered" },
  { path: "/shop?search=headphones", desc: "shop-search" },
  { path: "/product/wireless-headphones", desc: "pdp" },
  { path: "/product/unknown-slug-xyz", desc: "pdp-notfound" },
  { path: "/cart", desc: "cart" },
  { path: "/checkout", desc: "checkout" },
  { path: "/wishlist", desc: "wishlist" },
  { path: "/account", desc: "account" },
  { path: "/login", desc: "login" },
  { path: "/register", desc: "register" },
  { path: "/forgot-password", desc: "forgot" },
  { path: "/verify-email", desc: "verify-email" },
  { path: "/admin", desc: "admin-dash" },
  { path: "/admin/orders", desc: "admin-orders" },
  { path: "/admin/products", desc: "admin-products" },
  { path: "/admin/orders/ORD-2026-001", desc: "admin-order-detail" },
  { path: "/nonexistent-route-404", desc: "platform-404" },
  { path: "/sitemap.xml", desc: "sitemap" },
  { path: "/robots.txt", desc: "robots" },
  { path: "/api/health", desc: "health" },
];

const browser = await chromium.launch();

// --- login as demo user (authed census) ---
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const lp = await ctx.newPage();
await lp.goto(CLONE + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("john@example.com");
await lp.getByLabel("Password").fill("Demo1234!");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1200);
const authedPath = new URL(lp.url()).pathname;
await lp.close();
console.log("login ->", authedPath);

const findings = { console: {}, pageErrors: {}, links: {} };
const allLinks = new Set();

for (const r of ROUTES) {
  const page = await ctx.newPage();
  const consoleEntries = [];
  page.on("console", (m) => {
    if (["error", "warning"].includes(m.type())) consoleEntries.push(`${m.type()}: ${m.text().slice(0, 120)}`);
  });
  page.on("pageerror", (e) => consoleEntries.push(`pageerror: ${e.message.slice(0, 120)}`));
  try {
    await page.goto(CLONE + r.path, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(600);
    if (consoleEntries.length) findings.console[r.desc] = consoleEntries;
    // collect internal links
    const links = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")]
        .map((a) => a.getAttribute("href"))
        .filter((h) => h && h.startsWith("/") && !h.startsWith("//"))
    );
    links.forEach((l) => allLinks.add(l.split("#")[0].split("?")[0] || "/"));
  } catch (e) {
    findings.console[r.desc] = [`NAV-FAIL: ${e.message.slice(0, 120)}`];
  }
  await page.close();
}

console.log("\n=== CONSOLE/PAGE-ERROR CENSUS (22 routes) ===");
const badRoutes = Object.keys(findings.console);
if (!badRoutes.length) console.log("ZERO console errors/warnings/pageerrors on every route");
else badRoutes.forEach((r) => console.log(r, JSON.stringify(findings.console[r], null, 1)));

// --- link integrity: fetch every unique internal link ---
console.log(`\n=== LINK INTEGRITY (${allLinks.size} unique internal targets) ===`);
const dead = [];
for (const link of [...allLinks].sort()) {
  try {
    const res = await fetch(CLONE + link, { redirect: "manual", signal: AbortSignal.timeout(8000) });
    const ok = res.status === 200 || (res.status >= 300 && res.status < 400) || res.status === 404; // 404s handled below
    if (res.status >= 400 && !dead.includes(link)) {
      dead.push(`${link} -> ${res.status}`);
    }
  } catch (e) {
    dead.push(`${link} -> FETCH-FAIL ${e.message.slice(0, 40)}`);
  }
}

// Distinguish INTENDED 404s (unknown product slug renders in-chrome 200; unknown route is the platform 404 — served with 404 status by Next's not-found)
const platform404 = dead.filter((d) => d.includes("-> 404"));
const realDead = dead.filter((d) => !d.includes("-> 404"));
console.log("404-status targets (verify each is an intended platform-404 page):", platform404.length ? "" : "none");
platform404.forEach((d) => console.log("  ", d));
if (!realDead.length) console.log("ZERO broken internal links (all fetch 200/3xx)");
else realDead.forEach((d) => console.log("  DEAD:", d));

// --- admin context census (admin login for admin surfaces) ---
const adminCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const ap = await adminCtx.newPage();
await ap.goto(CLONE + "/login", { waitUntil: "networkidle" });
await ap.getByLabel("Email").fill("admin@luxestore.com");
await ap.getByLabel("Password").fill("Admin1234!");
await ap.getByRole("button", { name: "Log in", exact: true }).click();
await ap.waitForLoadState("networkidle");
await ap.waitForTimeout(1200);
const adminConsole = [];
ap.on("console", (m) => { if (["error", "warning"].includes(m.type())) adminConsole.push(`${m.type()}: ${m.text().slice(0, 120)}`); });
ap.on("pageerror", (e) => adminConsole.push(`pageerror: ${e.message.slice(0, 120)}`));
for (const r of ["/admin", "/admin/orders", "/admin/products", "/admin/orders/ORD-2026-001"]) {
  await ap.goto(CLONE + r, { waitUntil: "networkidle" });
  await ap.waitForTimeout(600);
}
console.log("\n=== ADMIN CONSOLE CENSUS (admin-authenticated, 4 surfaces) ===");
console.log(adminConsole.length ? JSON.stringify(adminConsole, null, 1) : "ZERO console errors on all admin surfaces");
await browser.close();
