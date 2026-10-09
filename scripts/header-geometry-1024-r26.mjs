// Round-26 audit: header geometry A/B at 1024x768 (the sweep viewport) —
// role-based nav discovery (the reference has no <nav> tag; its top nav
// is a div with the links Home/Shop/Electronics/Clothing/Accessories).
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
    const nav =
      document.querySelector('[role="navigation"]') ??
      [...document.querySelectorAll("nav,div")].find(
        (d) =>
          d.querySelector("a") &&
          d.textContent.includes("Electronics") &&
          d.textContent.includes("Accessories") &&
          d.getBoundingClientRect().height < 60,
      );
    const bar = nav?.closest("div");
    const barBox = bar?.getBoundingClientRect();
    const logo = [...(bar?.querySelectorAll("a") ?? [])].find((a) => a.textContent.includes("LUXE"));
    const logoBox = logo?.getBoundingClientRect();
    const navBox = nav?.getBoundingClientRect();
    const navCs = nav ? getComputedStyle(nav) : null;
    const links = [...(nav?.querySelectorAll("a") ?? [])].map((a) => {
      const r = a.getBoundingClientRect();
      return [a.textContent.trim(), Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
    });
    const btns = [...(bar?.querySelectorAll("button") ?? [])]
      .filter((b) => b.getBoundingClientRect().width > 0)
      .map((b) => {
        const r = b.getBoundingClientRect();
        return [
          b.getAttribute("aria-label") ?? b.querySelector("svg")?.getAttribute("class") ?? "(icon)",
          Math.round(r.x),
          Math.round(r.width),
          Math.round(r.height),
        ];
      });
    return {
      bar: { y: Math.round(barBox?.y ?? -1), h: Math.round(barBox?.height ?? -1) },
      logo: logoBox
        ? { x: Math.round(logoBox.x), y: Math.round(logoBox.y), w: Math.round(logoBox.width), h: Math.round(logoBox.height) }
        : null,
      nav: navBox ? { x: Math.round(navBox.x), y: Math.round(navBox.y), w: Math.round(navBox.width) } : null,
      navCS: navCs ? { display: navCs.display, gap: navCs.gap, justify: navCs.justifyContent } : null,
      links,
      buttons: btns,
    };
  });
  await browser.close();
  return header;
};

console.log("=== REF header (1024x768) ===");
const ref = await measure(REF, "sepnetflix2023@outlook.com", "$Abcd1234");
console.log(JSON.stringify(ref));

console.log("=== CLONE header (1024x768) ===");
const clone = await measure(CLONE, "john@example.com", "Demo1234!");
console.log(JSON.stringify(clone));
