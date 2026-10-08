// Live re-verification of the session-9 remediation against the dev server.
// Mirrors scripts/verify-session8.ts (Playwright drives the real UI; direct
// connection). Run: bun scripts/verify-session9.ts
import { chromium } from "@playwright/test";

const results: Array<{ check: string; ok: boolean; detail: string }> = [];
const pass = (check: string, ok: boolean, detail: string) => {
  results.push({ check, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} — ${check}: ${detail}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const BASE = "http://localhost:3000";

// (login first — account is gated)
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" } as const);
await page.waitForTimeout(2500);
await page.getByLabel("Email").fill("john@example.com");
await page.getByLabel("Password").fill("Demo1234!");
await page.getByRole("button", { name: "Log in" }).click();
await page.waitForURL("**/account");

// --- 1. Profile Save button — flow child, fit-content (ACCOUNT-BTN-W-1) --
const saveBtn = await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) =>
    /Save Changes/.test(b.textContent ?? ""),
  );
  if (!btn) return null;
  const r = btn.getBoundingClientRect();
  return {
    w: Math.round(r.width),
    parent: (btn.parentElement as HTMLElement).tagName,
    margin: getComputedStyle(btn).marginTop,
  };
});
pass(
  "profile Save button flow child + mt-4 (desktop)",
  saveBtn?.parent === "FORM" && saveBtn.margin === "16px",
  `parent=${saveBtn?.parent} mt=${saveBtn?.margin}`,
);

// --- 2. Mobile Save button width (ACCOUNT-BTN-W-1) ------------------------
const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
await mobile.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" } as const);
await mobile.getByLabel("Email").fill("john@example.com");
await mobile.getByLabel("Password").fill("Demo1234!");
await mobile.getByRole("button", { name: "Log in" }).click();
await mobile.waitForURL("**/account");
const mobileW = await mobile.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find((b) =>
    /Save Changes/.test(b.textContent ?? ""),
  );
  return Math.round(btn?.getBoundingClientRect().width ?? -1);
});
pass(
  "mobile Save button fit-content (<=140px, was 308)",
  mobileW >= 110 && mobileW <= 140,
  `measured ${mobileW}px (reference 127px)`,
);

// --- 3. Sort trigger width (SORT-W-1) --------------------------------------
await page.goto(`${BASE}/shop`, { waitUntil: "domcontentloaded" } as const);
const sortW = await page.evaluate(() => {
  const sel = document.querySelector('button[aria-label="Sort products"]');
  return Math.round(sel?.getBoundingClientRect().width ?? -1);
});
pass("shop sort trigger 150px", sortW === 150, `measured ${sortW}px`);

// --- 4. Account order rows (ACCOUNT-ORDER-ROW-1) --------------------------
await page.goto(`${BASE}/account`, { waitUntil: "domcontentloaded" } as const);
await page.getByRole("tab", { name: "Orders" }).click();
const rows = await page.evaluate(() => {
  const panel = document.querySelector('[role=tabpanel][data-state="active"]');
  const row = [...panel?.querySelectorAll("div") ?? []].find(
    (d) => d.className.includes("justify-between") && /ORD-2026-001/.test(d.textContent ?? ""),
  );
  if (!row) return null;
  const cs = getComputedStyle(row);
  const number = row.querySelector("p");
  const total = [...row.querySelectorAll("span")].find((s) => /^\$/.test(s.textContent ?? ""));
  const badge = [...row.querySelectorAll("span")].find(
    (e) => (e.textContent ?? "").trim() === "Delivered",
  );
  const container = row.parentElement;
  const row2 = container?.children[1] as HTMLElement | undefined;
  return {
    bg: cs.backgroundColor,
    border: cs.borderTopWidth,
    numberW: number ? getComputedStyle(number).fontWeight : null,
    totalW: total ? getComputedStyle(total).fontWeight : null,
    badgeBg: badge ? getComputedStyle(badge).backgroundColor : null,
    badgeH: badge ? Math.round(badge.getBoundingClientRect().height) : null,
    gap: row2
      ? Math.round(
          row2.getBoundingClientRect().y -
            (row.getBoundingClientRect().y + row.getBoundingClientRect().height),
        )
      : null,
    container: container?.className ?? null,
  };
});
const bgOk = rows?.bg
  ? /rgba\(242, 240, 237, 0\.3\)|lab\([\d.]+ [\d.]+ [\d.]+ \/ 0\.3\)/.test(rows.bg)
  : false;
pass(
  "order row bg-secondary/30 + no border",
  bgOk && rows?.border === "0px",
  `bg=${rows?.bg} border=${rows?.border}`,
);
pass(
  "order number semibold + total bold",
  rows?.numberW === "600" && rows?.totalW === "700",
  `weights ${rows?.numberW}/${rows?.totalW}`,
);
pass(
  "Delivered badge primary (rgb(230,107,26))",
  rows?.badgeBg === "rgb(230, 107, 26)" && (rows?.badgeH ?? 0) === 22,
  `bg=${rows?.badgeBg} h=${rows?.badgeH}px`,
);
pass("order row gap 16px (space-y-4)", rows?.gap === 16, `gap=${rows?.gap} container=${rows?.container}`);

// mobile stacking
await mobile.goto(`${BASE}/account`, { waitUntil: "domcontentloaded" } as const);
await mobile.getByRole("tab", { name: "Orders" }).click();
const stacked = await mobile.evaluate(() => {
  const panel = document.querySelector('[role=tabpanel][data-state="active"]');
  const row = [...panel?.querySelectorAll("div") ?? []].find(
    (d) => d.className.includes("justify-between") && /ORD-2026-001/.test(d.textContent ?? ""),
  );
  if (!row) return null;
  const cs = getComputedStyle(row);
  const [left, right] = [...row.children] as HTMLElement[];
  return {
    dir: cs.flexDirection,
    stacks: right.getBoundingClientRect().y >= left.getBoundingClientRect().bottom - 1,
  };
});
pass(
  "order rows stack on mobile",
  stacked?.dir === "column" && stacked?.stacks === true,
  `dir=${stacked?.dir} stacks=${stacked?.stacks}`,
);
await mobile.close();

// --- 5. Head metas: home / shop / shop?query / PDP (METADATA-OG-1) --------
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" } as const);
const homeMeta = await page.evaluate(() => {
  const g = (sel: string) => document.querySelector(sel)?.getAttribute("content") ?? null;
  return {
    ogTitle: g('meta[property="og:title"]'),
    ogDesc: g('meta[property="og:description"]'),
    ogImage: g('meta[property="og:image"]'),
    ogUrl: g('meta[property="og:url"]'),
    ogType: g('meta[property="og:type"]'),
    ogSite: g('meta[property="og:site_name"]'),
    twCard: g('meta[name="twitter:card"]'),
    twUrl: g('meta[name="twitter:url"]'),
    capable: g('meta[name="mobile-web-app-capable"]'),
    appleTitle: g('meta[name="apple-mobile-web-app-title"]'),
    appleStatus: g('meta[name="apple-mobile-web-app-status-bar-style"]'),
    desc: g('meta[name="description"]'),
  };
});
const SITE_DESC = "An elegant, high-end e-commerce destination offering curated essentials for a modern lifestyle.";
const LOGO_OG = "https://media.base44.com/images/public/69d296f5d1237b9a1afec899/76cff797e_logo.png/v1/fill/w_1200,h_630/76cff797e_logo.png";
pass(
  "home og set (plain pattern + PWA)",
  homeMeta.ogTitle === "Lumina" &&
    homeMeta.ogDesc === SITE_DESC &&
    homeMeta.ogImage === LOGO_OG &&
    homeMeta.ogUrl === BASE &&
    homeMeta.ogType === "website" &&
    homeMeta.ogSite === "Lumina" &&
    homeMeta.twCard === "summary_large_image" &&
    homeMeta.twUrl === BASE &&
    homeMeta.capable === "yes" &&
    homeMeta.appleTitle === "Lumina" &&
    homeMeta.appleStatus === "black" &&
    homeMeta.desc === SITE_DESC,
  JSON.stringify(homeMeta).slice(0, 140),
);

await page.goto(`${BASE}/shop`, { waitUntil: "domcontentloaded" } as const);
const shopMeta = await page.evaluate(() => {
  const g = (sel: string) => document.querySelector(sel)?.getAttribute("content") ?? null;
  return {
    ogTitle: g('meta[property="og:title"]'),
    ogDesc: g('meta[property="og:description"]'),
    ogUrl: g('meta[property="og:url"]'),
    twUrl: g('meta[name="twitter:url"]'),
    desc: g('meta[name="description"]'),
  };
});
pass(
  "shop og set (prefixed pattern)",
  shopMeta.ogTitle === "Shop | Lumina" &&
    shopMeta.ogDesc === `Shop on Lumina. ${SITE_DESC}` &&
    shopMeta.ogUrl === `${BASE}/shop` &&
    shopMeta.twUrl === `${BASE}/shop` &&
    shopMeta.desc === `Shop on Lumina. ${SITE_DESC}`,
  JSON.stringify(shopMeta).slice(0, 120),
);

await page.goto(`${BASE}/shop?category=electronics`, { waitUntil: "domcontentloaded" } as const);
const shopQ = await page.evaluate(() =>
  document.querySelector('meta[property="og:url"]')?.getAttribute("content") ?? null,
);
pass("shop og:url preserves query", shopQ === `${BASE}/shop?category=electronics`, shopQ ?? "null");

await page.goto(`${BASE}/product/wireless-headphones`, { waitUntil: "domcontentloaded" } as const);
const pdpMeta = await page.evaluate(() => {
  const g = (sel: string) => document.querySelector(sel)?.getAttribute("content") ?? null;
  const c = (sel: string) => document.querySelectorAll(sel).length;
  return {
    ogTitle: g('meta[property="og:title"]'),
    ogDesc: g('meta[property="og:description"]'),
    ogImage: g('meta[property="og:image"]'),
    ogUrl: g('meta[property="og:url"]'),
    twTitle: g('meta[name="twitter:title"]'),
    twCardCount: c('meta[name="twitter:card"]'),
    twUrlCount: c('meta[name="twitter:url"]'),
    ogTitleCount: c('meta[property="og:title"]'),
    title: document.title,
  };
});
pass(
  "PDP og set (humanized slug + logo + NO card/url)",
  pdpMeta.ogTitle === "Wireless Headphones | Lumina" &&
    pdpMeta.ogDesc === SITE_DESC &&
    pdpMeta.ogImage === LOGO_OG &&
    pdpMeta.ogUrl === `${BASE}/product/wireless-headphones` &&
    pdpMeta.twTitle === "Wireless Headphones | Lumina" &&
    pdpMeta.twCardCount === 0 &&
    pdpMeta.twUrlCount === 0 &&
    pdpMeta.ogTitleCount === 1 &&
    pdpMeta.title === "Wireless Headphones | Lumina",
  JSON.stringify(pdpMeta).slice(0, 140),
);

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks green`);
if (failed.length > 0) {
  console.error("FAILED:", failed.map((f) => f.check).join("; "));
  process.exit(1);
}
