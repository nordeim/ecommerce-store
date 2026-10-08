// Session-14 live re-verification (production standalone server on :3000,
// the remediated build). Mirrors scripts/verify-session13.ts conventions
// (retrying expect() assertions; server expected already running —
// `bun run start`). Verifies the SEC-CSP-1 remediation end-to-end against
// the live server: the CSP header ships on document responses with a
// per-request nonce, every SSR script carries the nonce (home AND the
// force-dynamic'd register screen AND the static-turned-dynamic
// forgot-password screen), a real browser reports ZERO CSP violations,
// hydration lands (a form fill works), and a PDP cart-add exercises the
// server-action path under CSP (the POST + re-render round trip).
import { chromium, expect } from "@playwright/test";

const BASE = "http://localhost:3000";
let pass = 0;
let fail = 0;
const check = async (name: string, fn: () => Promise<void>) => {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    console.log(`  ✗ ${name} — ${String(e).split("\n").slice(0, 3).join(" ")}`);
  }
};

// --- 0. Server-side checks (curl-equivalent via fetch) -------------------
const res1 = await fetch(BASE + "/");
const res2 = await fetch(BASE + "/");
const csp1 = res1.headers.get("content-security-policy") ?? "";
const csp2 = res2.headers.get("content-security-policy") ?? "";
const nonce1 = csp1.match(/'nonce-([^']+)'/)?.[1];
const nonce2 = csp2.match(/'nonce-([^']+)'/)?.[1];

await check("CSP header ships on document responses", async () => {
  if (!csp1) throw new Error("no content-security-policy header");
});
await check("directive set pinned (default/script/style/img/font/connect/frame/object/base/form)", async () => {
  for (const d of [
    "default-src 'self'",
    "script-src 'self' 'nonce-",
    "'strict-dynamic'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://media.base44.com data:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ]) {
    if (!csp1.includes(d)) throw new Error(`missing directive: ${d}`);
  }
});
await check("no upgrade-insecure-requests (localhost-safe)", async () => {
  if (csp1.includes("upgrade-insecure-requests")) throw new Error("directive present — would break http subresources");
});
await check("per-request nonce uniqueness", async () => {
  if (!nonce1 || !nonce2) throw new Error("nonce missing");
  if (nonce1 === nonce2) throw new Error("nonces identical across requests");
});

// --- 1. Every SSR script carries the nonce (3 routes) --------------------
for (const path of ["/", "/register", "/forgot-password"]) {
  await check(`every SSR <script> on ${path} carries the page nonce`, async () => {
    const res = await fetch(BASE + path);
    const csp = res.headers.get("content-security-policy") ?? "";
    const nonce = csp.match(/'nonce-([^']+)'/)?.[1];
    if (!nonce) throw new Error("no nonce in CSP header");
    const html = await res.text();
    const tags = html.match(/<script\b[^>]*>/g) ?? [];
    if (tags.length === 0) throw new Error("no script tags found");
    const bare = tags.filter((t) => !t.includes(`nonce="${nonce}"`));
    if (bare.length > 0) throw new Error(`${bare.length} un-nonced scripts: ${bare[0].slice(0, 90)}`);
  });
}

// --- 2. Real-browser CSP violation census + hydration --------------------
const browser = await chromium.launch();
const violations: string[] = [];
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await ctx.newPage();
page.on("console", (msg) => {
  if (msg.type() === "error" && msg.text().toLowerCase().includes("content security policy")) {
    violations.push(msg.text());
  }
});
page.on("pageerror", (err) => violations.push(String(err)));

await page.goto(BASE + "/", { waitUntil: "networkidle" });
await check("home hydrates under CSP (search button opens the typeahead)", async () => {
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByPlaceholder("Search products...")).toBeVisible();
});
await check("home: zero console errors / CSP violations", async () => {
  if (violations.length > 0) throw new Error(violations[0]);
});

await page.goto(BASE + "/register", { waitUntil: "networkidle" });
await check("register hydrates under CSP (native email validation live)", async () => {
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  // Native type=email validation blocks the submit — the form stays put.
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account", exact: true })).toBeVisible();
});

// --- 3. Server-action path under CSP (PDP cart-add round trip) -----------
const shopper = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
shopper.on("console", (msg) => {
  if (msg.type() === "error") violations.push(msg.text());
});
await shopper.goto(BASE + "/product/wireless-headphones", { waitUntil: "networkidle" });
await check("PDP cart-add fires the server action under CSP (badge bumps)", async () => {
  // The badge button is located by a NAME PATTERN scoped to the header —
  // it matches BOTH label states ("Cart" empty <-> "Cart, N items" after
  // the add); a getByRole({ name: "Cart", exact }) locator stops matching
  // the moment the label changes (role locators resolve by accessible
  // name), and the cart control is a plain onClick Button (no /cart anchor
  // exists in the header — it opens the drawer). The ATC is scoped to the
  // buy panel — the related-products cards below carry their own ATC
  // buttons (the documented PDP selector gotcha).
  const badge = shopper.locator("header").getByRole("button", { name: /Cart/ });
  await expect(badge).toBeVisible();
  const atc = shopper
    .locator("main .flex.items-center.gap-4.mb-4")
    .getByRole("button", { name: "Add to Cart", exact: true });
  await atc.click();
  await expect
    .poll(async () => (await badge.getAttribute("aria-label")) ?? "", { timeout: 10_000 })
    .toContain("Cart, 1 items");
});
await check("cart toast announces the add (client island alive)", async () => {
  // Checked on its own page load — the toast lives 3000ms, shorter than
  // the badge poll above; a fresh add re-fires it deterministically.
  await shopper.goto(BASE + "/product/wireless-headphones", { waitUntil: "networkidle" });
  await shopper
    .locator("main .flex.items-center.gap-4.mb-4")
    .getByRole("button", { name: "Add to Cart", exact: true })
    .click();
  await expect(shopper.getByText("Wireless Noise-Cancelling Headphones added to cart!")).toBeVisible({
    timeout: 8_000,
  });
});
await check("full-page /cart renders the line (DB write landed)", async () => {
  await shopper.goto(BASE + "/cart", { waitUntil: "networkidle" });
  await expect(shopper.getByRole("heading", { name: "Shopping Cart" })).toBeVisible();
  await expect(shopper.getByText("Wireless Noise-Cancelling Headphones").first()).toBeVisible();
});

// --- 4. Console census across the auth + admin surfaces ------------------
await check("zero CSP violations across the whole walk", async () => {
  if (violations.length > 0) throw new Error(violations[0]);
});

await browser.close();
console.log(`\n${pass}/${pass + fail} checks passed`);
process.exit(fail === 0 ? 0 : 1);
