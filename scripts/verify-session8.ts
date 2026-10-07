// Live re-verification of the session-8 remediation against the dev server.
// Mirrors scripts/verify-session7.ts (Playwright drives the real UI; direct
// connection — the session-6 proxy lesson). Run: bun scripts/verify-session8.ts
import { chromium } from "playwright";

const results: Array<{ check: string; ok: boolean; detail: string }> = [];
const pass = (check: string, ok: boolean, detail: string) => {
  results.push({ check, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} — ${check}: ${detail}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const BASE = "http://localhost:3000";

// --- 1. Login email label gap (SPACE-Y-INLINE-1) -------------------------
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
const loginGap = await page.evaluate(() => {
  const label = [...document.querySelectorAll("label")].find(
    (l) => l.textContent?.trim() === "Email",
  );
  const input = label?.parentElement?.querySelector("input");
  if (!label || !input) return -1;
  const lr = label.getBoundingClientRect();
  return input.getBoundingClientRect().y - (lr.y + lr.height);
});
pass("login email gap 11px", Math.abs(loginGap - 11) <= 1, `measured ${loginGap}px`);

// --- 2. Register card gaps ------------------------------------------------
await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
const regGaps = await page.evaluate(() => {
  return [...document.querySelectorAll("label")]
    .filter((l) => ["Email", "Password", "Confirm Password"].includes(l.textContent?.trim() ?? ""))
    .map((label) => {
      const input = label.parentElement?.querySelector("input");
      if (!input) return -1;
      const lr = label.getBoundingClientRect();
      return Math.round(input.getBoundingClientRect().y - (lr.y + lr.height));
    });
});
pass(
  "register gaps 11/11/11",
  regGaps.every((g) => Math.abs(g - 11) <= 1),
  `measured [${regGaps.join(", ")}]`,
);

// --- 3. Account tab panel gap (SPACE-TABS-1) ------------------------------
// (login first — account is gated; mirrors the E2E storageState path)
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.getByLabel("Email").fill("john@example.com");
await page.getByLabel("Password").fill("Demo1234!");
await page.getByRole("button", { name: "Log in" }).click();
await page.waitForURL("**/account", { timeout: 15_000 });
await page.waitForLoadState("networkidle");
const panelGap = await page.evaluate(() => {
  const list = document.querySelector('[role=tablist]');
  const panel = document.querySelector('[role=tabpanel]');
  if (!list || !panel) return -1;
  return (
    panel.getBoundingClientRect().y -
    (list.getBoundingClientRect().y + list.getBoundingClientRect().height)
  );
});
pass("account tab panel gap 24px", Math.abs(panelGap - 24) <= 1, `measured ${panelGap}px`);

// --- 4. Account profile label geometry (LABEL-BLOCK-1) --------------------
const profileGeom = await page.evaluate(() => {
  const label = [...document.querySelectorAll("label")].find(
    (l) => l.textContent?.trim() === "First Name",
  );
  const input = document.querySelector("#acc-first");
  if (!label || !input) return null;
  const lcs = getComputedStyle(label);
  const ics = getComputedStyle(input);
  const lr = label.getBoundingClientRect();
  return {
    display: lcs.display,
    inputMT: ics.marginTop,
    gap: Math.round(input.getBoundingClientRect().y - (lr.y + lr.height)),
  };
});
pass(
  "profile label inline + input mt 6px + gap 9px",
  profileGeom?.display === "inline" &&
    profileGeom?.inputMT === "6px" &&
    Math.abs((profileGeom?.gap ?? -1) - 9) <= 1,
  `display=${profileGeom?.display} mt=${profileGeom?.inputMT} gap=${profileGeom?.gap}px`,
);

// --- 5. PDP star row (STAR-RATE-1) -----------------------------------------
await page.goto(`${BASE}/product/wireless-headphones`, { waitUntil: "networkidle" });
const stars = await page.evaluate(() => {
  const row = document.querySelector('main [aria-label^="Rated"]');
  if (!row) return null;
  return {
    gap: getComputedStyle(row).columnGap,
    svgCount: row.querySelectorAll("svg.lucide-star").length,
    amber: row.querySelectorAll("svg.fill-amber-400").length,
    gray: row.querySelectorAll("svg.text-border").length,
  };
});
pass(
  "PDP stars: gap 4px, 5 svgs, 4 amber + 1 gray",
  stars?.gap === "4px" &&
    stars?.svgCount === 5 &&
    stars?.amber === 4 &&
    stars?.gray === 1,
  JSON.stringify(stars),
);

// --- 6. PDP breadcrumb (BREADCRUMB-1) --------------------------------------
const breadcrumb = await page.evaluate(() => {
  const nav = document.querySelector("main nav");
  const h1 = document.querySelector("main h1");
  if (!nav || !h1) return null;
  const ncs = getComputedStyle(nav);
  return {
    mb: ncs.marginBottom,
    gap: ncs.columnGap,
    h1Delta: Math.round(h1.getBoundingClientRect().y - nav.getBoundingClientRect().y),
  };
});
pass(
  "breadcrumb mb 32px, gap 8px, h1 delta 76",
  breadcrumb?.mb === "32px" &&
    breadcrumb?.gap === "8px" &&
    Math.abs((breadcrumb?.h1Delta ?? -1) - 76) <= 1,
  JSON.stringify(breadcrumb),
);

// --- 7. Feature icons (ICON-DRIFT-1) ---------------------------------------
const icons = await page.goto(`${BASE}/`, { waitUntil: "networkidle" }).then(() =>
  page.evaluate(() => {
    const main = document.querySelector("main");
    return {
      shield: main?.querySelectorAll("svg.lucide-shield").length ?? -1,
      rotateCcw: main?.querySelectorAll("svg.lucide-rotate-ccw").length ?? -1,
      shieldCheck: main?.querySelectorAll("svg.lucide-shield-check").length ?? -1,
      refreshCw: main?.querySelectorAll("svg.lucide-refresh-cw").length ?? -1,
    };
  }),
);
pass(
  "feature icons shield + rotate-ccw (0 shield-check/refresh-cw)",
  icons.shield >= 1 && icons.rotateCcw >= 1 && icons.shieldCheck === 0 && icons.refreshCw === 0,
  JSON.stringify(icons),
);

// --- 8. 404 titles (TITLE-404-1) --------------------------------------------
for (const [path, expected] of [
  ["/nonexistent-route-xyz", "Nonexistent Route Xyz | Lumina"],
  ["/foo/bar-baz", "Bar Baz | Lumina"],
  ["/products/42", "Products | Lumina"],
  ["/12345", "Lumina"],
] as const) {
  await page.goto(`${BASE}${path}`);
  const title = await page.title();
  pass(`404 title ${path}`, title === expected, `"${title}"`);
}
const quoted = await page
  .goto(`${BASE}/nonexistent-route-xyz`)
  .then(() => page.evaluate(() => document.body.innerText.includes('"nonexistent-route-xyz"')));
pass("404 body quotes the path", quoted === true, `quoted=${quoted}`);

// --- 9. Search category lowercase (SEARCH-CASE-1) ---------------------------
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.locator('header button[aria-label="Search"]').click();
await page.getByLabel("Search products").fill("headphones");
await page
  .locator("header button")
  .filter({ hasText: "Wireless Noise-Cancelling Headphones" })
  .first()
  .waitFor({ state: "visible", timeout: 10_000 });
const categoryText = await page.evaluate(() => {
  const btn = [...document.querySelectorAll("header button")].find((b) =>
    b.textContent?.includes("Wireless Noise-Cancelling Headphones"),
  );
  return btn?.querySelector("span.text-xs")?.textContent ?? null;
});
pass("search category lowercase", categoryText === "electronics", `"${categoryText}"`);

// --- 10. Mobile nav 8th standing verification -------------------------------
const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
await mobile.goto(`${BASE}/`, { waitUntil: "networkidle" });
await mobile.locator('header button[aria-label="Open navigation menu"]').click();
await mobile.waitForTimeout(600);
const mobileNav = await mobile.evaluate(() => {
  const d = document.querySelector('[role=dialog]');
  if (!d) return null;
  const r = d.getBoundingClientRect();
  const nav = d.querySelector("nav");
  return {
    w: Math.round(r.width),
    h: Math.round(r.height),
    x: Math.round(r.x),
    y: Math.round(r.y),
    navCls: nav?.className,
    links: nav ? [...nav.querySelectorAll("a")].map((a) => a.textContent.trim()) : null,
  };
});
pass(
  "mobile nav 288x844 @(0,0), flex gap-4, 5 links",
  mobileNav?.w === 288 &&
    mobileNav?.h === 844 &&
    mobileNav?.x === 0 &&
    mobileNav?.y === 0 &&
    mobileNav?.navCls === "flex flex-col gap-4 mt-8" &&
    mobileNav?.links?.length === 5,
  JSON.stringify({ ...mobileNav, links: mobileNav?.links?.join("|") }),
);
await mobile.close();

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks green`);
if (failed.length) {
  console.error("FAILED CHECKS:", failed.map((f) => f.check).join("; "));
  process.exit(1);
}
