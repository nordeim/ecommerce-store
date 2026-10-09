// Round-28 hero drift probe v3: dumps ALL images on home (both sites) with
// viewport positions + sizes, plus the first 400 chars of visible text
// below the header — finds the reference's hero shape empirically.
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const CLONE = "http://localhost:3000";

const login = async (ctx, base, email, password) => {
  const page = await ctx.newPage();
  await page.goto(base + "/login", { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  const path = new URL(page.url()).pathname;
  await page.close();
  return path;
};

const dump = async (ctx, base, label) => {
  const page = await ctx.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  const data = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img")].map((img) => {
      const r = img.getBoundingClientRect();
      return {
        src: (img.getAttribute("src") || "").slice(0, 90),
        y: Math.round(r.y + window.scrollY),
        w: Math.round(r.width),
        h: Math.round(r.height),
        visible: r.width > 0 && r.height > 0,
      };
    });
    // hero text: the first big text block below header (y 100-700)
    const h1 = document.querySelector("h1");
    const heroText = h1 ? h1.textContent : null;
    const body = document.body;
    return { imgs, heroText, url: location.pathname };
  });
  await page.close();
  console.log(`\n===== ${label} (login landed ${data.url}) =====`);
  console.log("h1:", data.heroText);
  data.imgs
    .filter((i) => i.visible && i.y < 800)
    .forEach((i) => console.log(`  y=${i.y} ${i.w}x${i.h}  ${i.src}`));
};

const browser = await chromium.launch();
const refCtx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const cloneCtx = await browser.newContext({ viewport: { width: 1024, height: 768 } });

console.log("ref login ->", await login(refCtx, REF, "sepnetflix2023@outlook.com", "$Abcd1234"));
console.log("clone login ->", await login(cloneCtx, CLONE, "john@example.com", "Demo1234!"));

await dump(refCtx, REF, "REFERENCE home imgs (y<800)");
await dump(cloneCtx, CLONE, "CLONE home imgs (y<800)");
await browser.close();
