// Round-42 DEV-MODE census (the deliverable's own proof surface): the same
// route walk as census-session42.mjs, but against `bun run dev` — the README's
// documented primary workflow. Pre-fix (ADR-049): every route reported the
// React eval-CSP console error ("eval() is not supported in this
// environment…") + the nextjs-portal dev-tools badge painted "01 Issue" at
// the bottom-left of every viewport. Post-fix: the dev CSP carries
// 'unsafe-eval' (React's documented dev requirement) and the census must be
// CLEAN — zero console errors, zero pageerrors, zero dev-tool badges.
// Run via: bash scripts/battery-runner.sh census-dev-session42.mjs dev
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
await lp.goto(CLONE + "/login", { waitUntil: "load", timeout: 30000 });
await lp.getByLabel("Email").fill("john@example.com");
await lp.getByLabel("Password").fill("Demo1234!");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
try {
  await lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 25000 });
} catch { /* the walk reports the state it finds */ }
await lp.waitForLoadState("load");
await lp.waitForTimeout(1200);
await lp.close();

let bad = 0;
let badges = 0;
for (const r of ROUTES) {
  const page = await ctx.newPage();
  const errs = [], perrs = [];
  page.on("console", m => { if (m.type() === "error") errs.push(m.text().slice(0, 110)); });
  page.on("pageerror", e => perrs.push(String(e).slice(0, 110)));
  try { await page.goto(CLONE + r, { waitUntil: "load", timeout: 30000 }); }
  catch { /* sitemap/robots are not networkidle-able necessarily */ }
  await page.waitForTimeout(800);
  // the dev-tools badge check: the nextjs-portal's [data-next-badge-root]
  // is ALWAYS MOUNTED in dev (it is the "Open issues overlay" trigger) —
  // it only BECOMES VISIBLE when the dev overlay has ≥1 issue (pre-fix:
  // 101x36 "01 Issue" at the bottom-left of every viewport). The honest
  // check is geometric: a painted badge (width > 0) fails; a collapsed
  // (0x0, zero-issue) badge is the clean state. (Guarded: some routes
  // redirect while logged in — the context may be destroyed mid-evaluate;
  // a destroyed context reads as no badge.)
  let badge = false;
  try {
    badge = await page.evaluate(() => {
      const portal = document.querySelector("nextjs-portal");
      const root = portal?.shadowRoot?.querySelector("[data-next-badge-root]");
      if (!root) return false;
      const r = root.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
  } catch { /* navigation destroyed the context — no badge observable */ }
  if (badge) badges++;
  const status = errs.length + perrs.length === 0 && !badge ? "CLEAN" : "ERRORS";
  if (status === "ERRORS") { bad++; console.log(r, "->", JSON.stringify({ errs, perrs, badge })); }
  else console.log(status.padEnd(6), r);
  await page.close();
}

console.log(bad === 0
  ? `\nDEV CENSUS CLEAN: ${ROUTES.length} routes — zero console errors, zero dev-tool badges (ADR-049 working)`
  : `\n${bad} ROUTES WITH ERRORS — the dev-mode carve-out is NOT working`);
await browser.close();
