// Round-46 probe part B: the reference's /shop?search= RESULTS PAGE — the
// plural count copy ("N products found"), the multi-match rendering, and the
// case-insensitivity of the results query. Plus the API-shape check: does the
// reference expose any /api/search-like JSON endpoint at all?
import { chromium } from "playwright-core";
const REF = "https://fuzzy-lumina-style-hub.base44.app";
const OUT = "/tmp/audit-r46";
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

const withTimeout = (p, ms, what) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r("TIMEOUT:" + what), ms))]);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });

// The reference gates the storefront behind login (r46 first-hand). Log in.
const withTimeout2 = (p, ms, what) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r("TIMEOUT:" + what), ms))]);
const lp = await ctx.newPage();
await withTimeout2(lp.goto(REF + "/login", { waitUntil: "domcontentloaded" }), 25000, "login-goto");
await withTimeout2(lp.getByLabel("Email").fill("sepnetflix2023@outlook.com"), 15000, "email-fill");
await withTimeout2(lp.getByLabel("Password").fill("$Abcd1234"), 15000, "pw-fill");
await withTimeout2(lp.getByRole("button", { name: "Log in", exact: true }).click(), 15000, "login-click");
await withTimeout2(lp.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20000 }), 22000, "login-nav");
await lp.waitForTimeout(1500);
await lp.close();

const page = await ctx.newPage();

const readShop = async (query) => {
  await withTimeout(
    page.goto(REF + "/shop?search=" + encodeURIComponent(query), { waitUntil: "domcontentloaded", timeout: 30000 }),
    35000,
    "goto-" + query,
  );
  await page.waitForTimeout(3500);
  const u = new URL(page.url());
  const data = await page.evaluate(() => {
    const main = document.querySelector("main");
    const text = main?.textContent?.replace(/\s+/g, " ") ?? "";
    const h1 = main?.querySelector("h1")?.textContent?.trim() ?? null;
    const countMatch = text.match(/(\d+)\s+products?\s+found/);
    const cards = main?.querySelectorAll("[class*='group'], a[href*='/product/']").length ?? 0;
    return {
      h1,
      countLine: countMatch ? countMatch[0] : null,
      cards,
      textHead: text.slice(0, 300),
    };
  });
  return { url: u.pathname + u.search, ...data };
};

// 1. The multi-match plural: "wireless" should match 2 products on the clone
//    (Wireless Noise-Cancelling Headphones + Wireless Charging Pad). What
//    does the REFERENCE render?
console.log("REF shop?search=wireless:", JSON.stringify(await readShop("wireless")));
await page.screenshot({ path: OUT + "/ref-shop-wireless.png" });

// 2. The singular (control — already pinned as reference-parity on the clone)
console.log("REF shop?search=headphones:", JSON.stringify(await readShop("headphones")));

// 3. Case-insensitivity: uppercase query
console.log("REF shop?search=SERUM:", JSON.stringify(await readShop("SERUM")));

// 4. The no-match (control — the empty state is pinned reference-parity)
console.log("REF shop?search=zzzqqq:", JSON.stringify(await readShop("zzzqqq")));

// 5. Does the reference expose a search API at all? (The clone's typeahead
//    hits /api/search — the reference's own routes are unknown; probe the
//    obvious candidates and record the status codes.)
for (const path of ["/api/search?q=serum", "/api/search?query=serum"]) {
  try {
    const res = await ctx.request.get(REF + path);
    console.log("REF " + path + " ->", res.status());
  } catch (e) {
    console.log("REF " + path + " -> ERR:", e.message);
  }
}

await browser.close();
console.log("PROBE B DONE");
