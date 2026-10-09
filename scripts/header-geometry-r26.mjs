// Round-26 audit: header geometry A/B (ref vs clone, 1024x768, authenticated)
// — measures the banner/nav/search element boxes to explain the header
// pixel-diff band (rows 53-67).
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const CLONE = "http://localhost:3000";

const measure = async (base, email, password) => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForLoadState("networkidle");
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const header = await page.evaluate(() => {
    const nav = document.querySelector("nav");
    const banner = nav?.closest("header, [role='banner'], body > div, body > *") ?? document.body;
    const links = [...(nav?.querySelectorAll("a") ?? [])].map((a) => {
      const r = a.getBoundingClientRect();
      return { text: a.textContent.trim(), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    });
    const bannerBox = banner?.getBoundingClientRect();
    const navBox = nav?.getBoundingClientRect();
    const search = banner?.querySelector("input");
    const searchBox = search?.getBoundingClientRect();
    // the icon buttons (heart, cart, menu) right cluster — scoped to the
    // banner's immediate vicinity (siblings of the nav's parent)
    const cluster = nav?.parentElement?.parentElement;
    const buttons = [...(cluster?.querySelectorAll("button") ?? [])].map((b) => {
      const r = b.getBoundingClientRect();
      if (r.width === 0) return null;
      return { aria: b.getAttribute("aria-label") ?? "(icon)", x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    }).filter(Boolean);
    return {
      banner: { y: Math.round(bannerBox?.y ?? -1), h: Math.round(bannerBox?.height ?? -1) },
      nav: navBox ? { x: Math.round(navBox.x), y: Math.round(navBox.y), w: Math.round(navBox.width), h: Math.round(navBox.height) } : null,
      links,
      search: search ? { x: Math.round(searchBox.x), y: Math.round(searchBox.y), w: Math.round(searchBox.width), h: Math.round(searchBox.height) } : null,
      buttons,
    };
  });
  await browser.close();
  return header;
};

console.log("=== REF header ===");
const ref = await measure(REF, "sepnetflix2023@outlook.com", "$Abcd1234");
console.log(JSON.stringify(ref, null, 1));

console.log("=== CLONE header ===");
const clone = await measure(CLONE, "john@example.com", "Demo1234!");
console.log(JSON.stringify(clone, null, 1));
