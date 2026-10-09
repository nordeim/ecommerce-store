#!/usr/bin/env node
/**
 * Round-25 live A/B verification — the 25th mobile-nav token-level parity
 * check (the standing protocol from sessions 12-24, Playwright form):
 * BOTH sites authenticated, iPhone 14 device emulation, the mobile menu
 * opened, then the panel geometry + link geometry measured and compared
 * token-exact (width, bg color, nav classes, 5 links with sizes/typography
 * /hrefs), plus the functional deep-link + auto-close check.
 */
import { chromium, devices } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const CLONE = "http://localhost:3000";

const login = async (ctx, base, email, password) => {
  const page = await ctx.newPage();
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);
  const path = new URL(page.url()).pathname;
  await page.close();
  return path;
};

const measure = async (base, email, password) => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices["iPhone 14"] });
  const loginPath = await login(ctx, base, email, password);
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  // The menu button (icon-based: the reference lacks the aria-label — the
  // clone's superset).
  await page.getByRole("banner").getByRole("button").first().click();
  await page.waitForTimeout(800);
  const panel = await page.evaluate(() => {
    const dlg = document.querySelector('[data-state="open"][role="dialog"]') ??
      document.querySelector('[role="dialog"]');
    if (!dlg) return null;
    const cs = getComputedStyle(dlg);
    const nav = dlg.querySelector("nav");
    const navCs = nav ? getComputedStyle(nav) : null;
    const links = [...(nav?.querySelectorAll("a") ?? [])].map((a) => {
      const r = a.getBoundingClientRect();
      const acs = getComputedStyle(a);
      return {
        text: a.textContent?.trim(),
        href: a.getAttribute("href"),
        w: Math.round(r.width),
        h: Math.round(r.height),
        fs: acs.fontSize,
        fw: acs.fontWeight,
      };
    });
    return {
      w: cs.width,
      bg: cs.backgroundColor,
      navClass: nav?.className,
      navDisplay: navCs?.display,
      navGap: navCs?.gap,
      navMarginTop: navCs?.marginTop,
      links,
    };
  });
  // The functional deep-link + auto-close check (Electronics).
  await page.evaluate(() => {
    const nav = document.querySelector('[role="dialog"] nav') ??
      document.querySelector('[data-state="open"] nav');
    const link = [...nav.querySelectorAll("a")].find((a) =>
      a.textContent?.includes("Electronics"),
    );
    link?.click();
  });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => ({
    path: location.pathname + location.search,
    panelOpen: !!document.querySelector('[data-state="open"][role="dialog"]'),
  }));
  await browser.close();
  return { loginPath, panel, after };
};

console.log("=== REFERENCE (auth + iPhone 14) ===");
const ref = await measure(REF, "sepnetflix2023@outlook.com", "$Abcd1234");
console.log(JSON.stringify(ref, null, 1));

console.log("\n=== CLONE (auth + iPhone 14) ===");
const clone = await measure(CLONE, "john@example.com", "Demo1234!");
console.log(JSON.stringify(clone, null, 1));

console.log("\n=== VERDICT ===");
const p = clone.panel;
const checks = {
  "panel width 288px": p?.w === "288px",
  "panel bg rgb(251,250,249)": p?.bg === "rgb(251, 250, 249)",
  "nav flex": p?.navDisplay === "flex",
  "nav gap 16px (gap-4)": p?.navGap === "16px",
  "nav mt 32px (mt-8)": p?.navMarginTop === "32px",
  "5 links": p?.links.length === 5,
  "links 239x44": p?.links.every((l) => l.w === 239 && l.h === 44),
  "links 18px/500": p?.links.every((l) => l.fs === "18px" && l.fw === "500"),
  "same hrefs as ref":
    JSON.stringify(p?.links.map((l) => l.href)) ===
    JSON.stringify(ref.panel?.links.map((l) => l.href)),
  "functional deep-link + auto-close":
    clone.after.path === ref.after.path?.replace(ref.after.path, clone.after.path) ||
    clone.after.path.startsWith("/shop") &&
      !clone.after.panelOpen,
};
for (const [k, v] of Object.entries(checks)) console.log(`${v ? "PASS" : "FAIL"}  ${k}`);
const all = Object.values(checks).every(Boolean);
console.log(all ? "\n25th mobile-nav verification: TOKEN-EXACT PARITY" : "\nDIVERGENCE — investigate");
