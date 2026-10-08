// Session-12 live re-verification (production standalone server on :3000).
// Mirrors scripts/verify-session11.ts. Run: bun scripts/verify-session12.ts
// Checks the four remediations against the running server:
//   1. single <main> per page on the 4 affected routes (A11Y-MAIN-1)
//   2. toast region nameless + aria-live (A11Y-ARIA-1)
//   3. PDP rating row role="img" + label (A11Y-ARIA-2)
//   4. the four security response headers (SEC-HEADERS-1)
import { devices, chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:3000";
let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (ok) {
    pass++;
  } else {
    fail++;
  }
};

const browser = await chromium.launch();

const login = async (page: import("playwright").Page) => {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("john@example.com");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForURL("**/account", { timeout: 15_000 });
  await page.waitForLoadState("networkidle");
};

// --- authed context for the gated routes -----------------------------------
const ctx = await browser.newContext();
const page = await ctx.newPage();
await login(page);

// 1. single <main> on the four affected routes
for (const path of ["/account", "/wishlist", "/checkout", "/checkout/success"]) {
  await page.goto(`${BASE}${path}`, { waitUntil: "load" });
  const mains = await page.locator("main").count();
  check(`A11Y-MAIN-1 ${path}: exactly one <main>`, mains === 1, `${mains} main(s)`);
}

// 2. toast region — nameless live region
await page.goto(`${BASE}/`, { waitUntil: "load" });
const region = page.locator("div.fixed.bottom-6.right-6");
const regionCount = await region.count();
const ariaLive = regionCount ? await region.first().getAttribute("aria-live") : null;
const ariaLabel = regionCount ? await region.first().getAttribute("aria-label") : null;
check("A11Y-ARIA-1 toast region present", regionCount === 1, `${regionCount} node(s)`);
check("A11Y-ARIA-1 region aria-live=polite", ariaLive === "polite", String(ariaLive));
check("A11Y-ARIA-1 region carries NO aria-label", ariaLabel === null, JSON.stringify(ariaLabel));

// 3. PDP rating row — labeled image role
await page.goto(`${BASE}/product/wireless-headphones`, { waitUntil: "load" });
const rating = page.locator('main div[aria-label^="Rated"]');
const ratingRole = await rating.getAttribute("role");
const ratingLabel = await rating.getAttribute("aria-label");
check("A11Y-ARIA-2 rating row role=img", ratingRole === "img", String(ratingRole));
check("A11Y-ARIA-2 rating row label intact", ratingLabel === "Rated 4.8 out of 5", String(ratingLabel));
// the star glyphs stay decorative
const stars = await rating.locator("svg").count();
const hiddenStars = await rating.locator('svg[aria-hidden="true"]').count();
check("A11Y-ARIA-2 5 decorative star glyphs", stars === 5 && hiddenStars === 5, `${stars}/${hiddenStars}`);

await ctx.close();

// 4. security headers (unauthed request is fine)
const resp = await browser.newContext().then((c) => c.newPage()).then((p) => p.request.get(`${BASE}/`));
const h = resp.headers();
check("SEC-HEADERS-1 referrer-policy", h["referrer-policy"] === "strict-origin-when-cross-origin", String(h["referrer-policy"]));
check("SEC-HEADERS-1 x-content-type-options", h["x-content-type-options"] === "nosniff", String(h["x-content-type-options"]));
check("SEC-HEADERS-1 strict-transport-security", h["strict-transport-security"] === "max-age=31536000", String(h["strict-transport-security"]));
check("SEC-HEADERS-1 x-frame-options", h["x-frame-options"] === "DENY", String(h["x-frame-options"]));

// --- mobile-nav 12th verification (standing user priority) ------------------
const iphone = devices["iPhone 14"];
const mctx = await browser.newContext({ ...iphone });
const mpage = await mctx.newPage();
await mpage.goto(`${BASE}/`, { waitUntil: "load" });
await mpage.evaluate(() => {
  const btns = [...document.querySelectorAll("header button")];
  const hamburger = btns.find((b) => b.querySelector("svg.lucide-menu")) as HTMLButtonElement | undefined;
  (hamburger ?? (btns[0] as HTMLButtonElement | undefined))?.click();
});
await mpage.waitForTimeout(600);
const mnav = await mpage.evaluate(() => {
  const nav = document.querySelector("nav.flex.flex-col");
  const panels = document.querySelectorAll("[data-state=open]");
  const cs = nav ? getComputedStyle(panels[panels.length - 1]) : null;
  return {
    navCls: nav ? nav.className.toString() : null,
    panelCls: panels.length ? panels[panels.length - 1].className.toString() : null,
    pad: cs ? cs.padding : null,
    gap: cs ? cs.gap : null,
    bg: cs ? cs.backgroundColor : null,
    links: nav ? [...nav.querySelectorAll("a")].map((a) => `${a.textContent.trim()}@${Math.round(a.getBoundingClientRect().width)}x${Math.round(a.getBoundingClientRect().height)}/${getComputedStyle(a).fontSize}/${getComputedStyle(a).fontWeight}`) : [],
  };
});
check("MOBILE-NAV-12 nav flex-col gap-4 mt-8", mnav.navCls === "flex flex-col gap-4 mt-8", String(mnav.navCls));
check("MOBILE-NAV-12 panel pad 24px / gap 16px", mnav.pad === "24px" && mnav.gap === "16px", `${mnav.pad}/${mnav.gap}`);
check("MOBILE-NAV-12 panel bg rgb(251, 250, 249)", mnav.bg === "rgb(251, 250, 249)", String(mnav.bg));
check(
  "MOBILE-NAV-12 five links @239x44/18px/500",
  mnav.links.length === 5 && mnav.links.every((l) => l.endsWith("@239x44/18px/500")),
  mnav.links.join(" | "),
);
await mctx.close();

await browser.close();
console.log(`\n${pass} passed, ${fail} failed (of ${pass + fail})`);
process.exit(fail === 0 ? 0 : 1);
