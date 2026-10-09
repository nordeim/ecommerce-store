// Round-28 hero drift probe v4: replicates the sweep's EXACT capture flow
// (goto → networkidle → fonts.ready → 1000ms → screenshot) on home for
// both sites, recording the ACTIVE slide img + carousel state at capture
// time, then diffs the captures. Also dumps hero text-block computed
// styles to catch non-image drift.
import { chromium } from "playwright-core";
import { PNG } from "../node_modules/playwright-core/lib/utilsBundle.js";

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

const capture = async (ctx, base, label) => {
  const page = await ctx.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(1000);
  const state = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img")].filter((i) => {
      const r = i.getBoundingClientRect();
      return r.width > 500 && r.y < 300 && r.width > 0; // hero-sized
    });
    const h1 = document.querySelector("h1");
    return {
      heroImgs: imgs.map((i) => ({
        src: (i.getAttribute("src") || "").slice(0, 80),
        hidden: i.closest('[aria-hidden="true"]') !== null,
      })),
      h1: h1?.textContent,
      h1Styles: h1
        ? {
            color: getComputedStyle(h1).color,
            fontSize: getComputedStyle(h1).fontSize,
            fontWeight: getComputedStyle(h1).fontWeight,
            lineHeight: getComputedStyle(h1).lineHeight,
          }
        : null,
    };
  });
  const buf = await page.screenshot();
  await page.close();
  const png = PNG.sync.read(buf);
  console.log(`\n===== ${label} capture state =====`);
  console.log(JSON.stringify(state, null, 2));
  return { png, state };
};

const diffCount = (a, b) => {
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  let n = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * a.width + x) * 4;
      const j = (y * b.width + x) * 4;
      if (
        Math.abs(a.data[i] - b.data[j]) > 10 ||
        Math.abs(a.data[i + 1] - b.data[j + 1]) > 10 ||
        Math.abs(a.data[i + 2] - b.data[j + 2]) > 10
      )
        n++;
    }
  }
  return { n, pct: ((n / (w * h)) * 100).toFixed(2) };
};

const browser = await chromium.launch();
const refCtx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const cloneCtx = await browser.newContext({ viewport: { width: 1024, height: 768 } });

console.log("ref login ->", await login(refCtx, REF, "sepnetflix2023@outlook.com", "$Abcd1234"));
console.log("clone login ->", await login(cloneCtx, CLONE, "john@example.com", "Demo1234!"));

const ref = await capture(refCtx, REF, "REFERENCE");
const clone = await capture(cloneCtx, CLONE, "CLONE");

console.log("\n===== DIFF =====");
console.log(diffCount(ref.png, clone.png));
await browser.close();
