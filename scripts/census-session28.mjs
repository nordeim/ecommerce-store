// Round-24 full-route console census: walk every manifest route on the clone
// (:3000, authenticated) and assert ZERO console errors / pageerrors.
import { chromium } from "playwright-core";

const CLONE = "http://localhost:3000";
const ROUTES = ["/", "/shop", "/shop?category=electronics", "/shop?sort=top-rated",
  "/product/wireless-headphones", "/product/nonexistent-slug", "/cart", "/wishlist",
  "/checkout", "/checkout/success", "/account", "/login", "/register",
  "/forgot-password", "/verify-email", "/reset-password", "/reset-password?token=x",
  "/admin", "/admin/orders", "/admin/orders/ORD-2026-001", "/admin/products",
  "/nonexistent-route", "/sitemap.xml", "/robots.txt"];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
// login (demo user)
const lp = await ctx.newPage();
await lp.goto(CLONE + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("john@example.com");
await lp.getByLabel("Password").fill("Demo1234!");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1200);
await lp.close();

let bad = 0;
for (const r of ROUTES) {
  const page = await ctx.newPage();
  const errs = [], perrs = [];
  page.on("console", m => { if (m.type() === "error") errs.push(m.text().slice(0, 110)); });
  page.on("pageerror", e => perrs.push(String(e).slice(0, 110)));
  try { await page.goto(CLONE + r, { waitUntil: "networkidle", timeout: 20000 }); }
  catch { /* sitemap/robots are not networkidle-able necessarily */ }
  await page.waitForTimeout(600);
  const status = errs.length + perrs.length === 0 ? "CLEAN" : "ERRORS";
  if (status === "ERRORS") { bad++; console.log(r, "->", JSON.stringify({ errs, perrs })); }
  else console.log(status.padEnd(6), r);
  await page.close();
}
// admin pass
const actx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const ap = await actx.newPage();
await ap.goto(CLONE + "/login", { waitUntil: "networkidle" });
await ap.getByLabel("Email").fill("admin@luxestore.com");
await ap.getByLabel("Password").fill("Admin1234!");
await ap.getByRole("button", { name: "Log in", exact: true }).click();
await ap.waitForLoadState("networkidle");
await ap.waitForTimeout(1200);
for (const r of ["/admin", "/admin/orders", "/admin/products", "/admin/payments", "/admin/payments?family=succeeded&q=pi", "/admin/payments?family=other", "/admin/payments?family=refund-needed", "/admin/products?q=headphone", "/admin/products?category=electronics", "/admin/products?visibility=hidden", "/admin/products?category=electronics&q=speaker"]) {
  const page = await actx.newPage();
  const errs = [], perrs = [];
  page.on("console", m => { if (m.type() === "error") errs.push(m.text().slice(0, 110)); });
  page.on("pageerror", e => perrs.push(String(e).slice(0, 110)));
  await page.goto(CLONE + r, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  console.log((errs.length + perrs.length === 0 ? "CLEAN" : "ERRORS").padEnd(6), "admin" + r);
  if (errs.length || perrs.length) { bad++; console.log(r, JSON.stringify({ errs, perrs })); }
  await page.close();
}
console.log(bad === 0 ? "\nCENSUS CLEAN: " + ROUTES.length + " routes + 11 admin (payments x4 + products filters x4)" : "\n" + bad + " ROUTES WITH ERRORS");
await browser.close();
