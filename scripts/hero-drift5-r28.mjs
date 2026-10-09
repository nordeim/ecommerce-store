// Round-28 hero drift probe v5: replicates the sweep's EXACT interleaved
// capture sequence and records the ACTIVE slide src at SCREENSHOT time on
// both sites — tests the carousel-phase-race hypothesis directly.
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
  await page.close();
  return new URL(page.url()).pathname;
};

const settle = async (page) => {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(1000);
};

const activeSlide = (page) =>
  page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img")].filter((i) => {
      const r = i.getBoundingClientRect();
      return r.width > 500 && r.y < 300;
    });
    const vis = imgs.find((i) => i.closest('[aria-hidden="true"]') === null);
    return (vis || imgs[0] || { getAttribute: () => "none" }).getAttribute("src")?.slice(45, 60);
  });

const browser = await chromium.launch();
const refCtx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const cloneCtx = await browser.newContext({ viewport: { width: 1024, height: 768 } });

console.log("ref login ->", await login(refCtx, REF, "sepnetflix2023@outlook.com", "$Abcd1234"));
console.log("clone login ->", await login(cloneCtx, CLONE, "john@example.com", "Demo1234!"));

for (let run = 1; run <= 3; run++) {
  const refPage = await refCtx.newPage();
  const clonePage = await cloneCtx.newPage();
  const t0 = Date.now();
  await refPage.goto(REF + "/", { waitUntil: "networkidle" });
  const tRef = Date.now() - t0;
  await clonePage.goto(CLONE + "/", { waitUntil: "networkidle" });
  const tClone = Date.now() - t0 - tRef;
  await settle(refPage);
  await settle(clonePage);
  const refShot1 = Date.now() - t0;
  const ra = await refPage.screenshot();
  const refSlide = await activeSlide(refPage);
  const cloneShot = Date.now() - t0;
  const ca = await clonePage.screenshot();
  const cloneSlide = await activeSlide(clonePage);
  console.log(
    `\nrun ${run}: ref goto ${tRef}ms, clone goto ${tClone}ms, ref shot @${refShot1}ms, clone shot @${cloneShot}ms`,
  );
  console.log(`  ref active slide:   ${refSlide}`);
  console.log(`  clone active slide: ${cloneSlide}`);
  // quick diff
  const A = PNG.sync.read(ra), B = PNG.sync.read(ca);
  let n = 0;
  for (let i = 0; i < A.data.length; i += 4) {
    if (
      Math.abs(A.data[i] - B.data[i]) > 16 ||
      Math.abs(A.data[i + 1] - B.data[i + 1]) > 16 ||
      Math.abs(A.data[i + 2] - B.data[i + 2]) > 16
    )
      n++;
  }
  console.log(`  diff: ${((n / (A.width * A.height)) * 100).toFixed(2)}% (${n} px)`);
  await refPage.close();
  await clonePage.close();
}
await browser.close();
