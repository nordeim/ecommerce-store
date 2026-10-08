// Calibrate the Round-16 axe-gate extension counts under EXACT E2E
// conditions (standalone server on :3100 with db/e2e.db at the fresh-reset
// canonical state, the suite's saved storageState) so the accessibility
// spec pins real numbers:
//   - MOBILE: the 6 shopper routes under devices["iPhone 14"]
//     (the same descriptor the E2E describe will use)
//   - ADMIN: the 4 console surfaces via the adminLogin flow (the
//     admin.spec pattern; the order detail reached via the ORD-2026-001
//     link — the cuid is not hardcodable)
import { chromium, devices } from "playwright-core";
import { readFileSync } from "node:fs";

const BASE = "http://localhost:3100";
const AXE = readFileSync("./node_modules/axe-core/axe.min.js", "utf8");
const STATE = JSON.parse(readFileSync("./tests/e2e/.auth/user.json", "utf8"));

const browser = await chromium.launch();

const runAxe = async (ctx, path, clickLink = null) => {
  const page = await ctx.newPage();
  if (clickLink) {
    await page.goto(BASE + clickLink, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: clickLinkName }).click();
    await page.waitForLoadState("networkidle");
  } else {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
  }
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
const clickLinkName = "ORD-2026-001";

// ---------- MOBILE (iPhone 14 + storageState — the E2E describe's exact shape) ----------
console.log("=== MOBILE (iPhone 14 + storageState, e2e DB) ===");
const mobile = await browser.newContext({ ...devices["iPhone 14"], storageState: { cookies: STATE.cookies, origins: STATE.origins ?? [] } });
for (const [desc, path] of Object.entries({
  home: "/", shop: "/shop", pdp: "/product/wireless-headphones", cart: "/cart", account: "/account",
})) {
  console.log(`${desc.padEnd(8)} ${await runAxe(mobile, path)}`);
}
// login (anon) at iPhone 14
const mobileAnon = await browser.newContext({ ...devices["iPhone 14"] });
{
  const page = await mobileAnon.newPage();
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.evaluate(AXE);
  const counts = await page.evaluate(async () => {
    const out = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
    return out.violations.map((v) => `${v.id}:${v.nodes.length}`);
  });
  console.log(`login    ${counts.join(", ") || "CLEAN"}`);
  await page.close();
}

// ---------- ADMIN (desktop, adminLogin flow) ----------
console.log("\n=== ADMIN (Desktop 1280x720, admin login, e2e DB) ===");
const adminCtx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
{
  const lp = await adminCtx.newPage();
  await lp.goto(BASE + "/login", { waitUntil: "networkidle" });
  await lp.getByLabel("Email").fill("admin@luxestore.com");
  await lp.getByLabel("Password").fill("Admin1234!");
  await lp.getByRole("button", { name: "Log in", exact: true }).click();
  await lp.waitForURL("**/account");
  await lp.close();
}
for (const [desc, path] of Object.entries({
  "admin-dashboard": "/admin",
  "admin-orders": "/admin/orders",
  "admin-products": "/admin/products",
})) {
  console.log(`${desc.padEnd(19)} ${await runAxe(adminCtx, path)}`);
}
// order detail: navigate via the ORD-2026-001 link (the admin.spec convention)
{
  const page = await adminCtx.newPage();
  await page.goto(BASE + "/admin/orders", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "ORD-2026-001" }).click();
  await page.waitForLoadState("networkidle");
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
  console.log(`admin-order-detail  ${counts.join(", ") || "CLEAN"}`);
  await page.close();
}

await browser.close();
