// Round-28 hero drift investigation: walks the LIVE reference carousel
// (next-button stepping, the round-26 methodology) and dumps every slide's
// image src + CTA href + copy; then does the same on the clone and diffs.
// Also captures the reference's product-card image inventory (the old
// slide media historically reappears as a product image).
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";
const CLONE = "http://localhost:3000";

const readSlide = (page) =>
  page.evaluate(() => {
    const out = [];
    const slides = document.querySelectorAll("[data-hero-slide], section a[href]");
    // fall back: the hero region is the first <section>
    const section = document.querySelector("section");
    if (section) {
      const imgs = section.querySelectorAll("img");
      imgs.forEach((img) => {
        const slide = img.closest("div")?.parentElement?.parentElement;
        out.push({
          img: img.getAttribute("src"),
          alt: img.getAttribute("alt"),
        });
      });
    }
    return out;
  });

const walk = async (ctx, base, label) => {
  const page = await ctx.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const results = { slides: [], ctas: [] };

  // Dump ALL hero images present in the DOM (active + inactive slides).
  const dump = await page.evaluate(() => {
    const section = document.querySelector("section");
    if (!section) return { imgs: [], links: [] };
    const imgs = [...section.querySelectorAll("img")].map((img) => ({
      src: img.getAttribute("src"),
      aria: img.getAttribute("aria-hidden"),
      natural: img.naturalWidth + "x" + img.naturalHeight,
    }));
    const links = [...section.querySelectorAll("a")].map((a) => ({
      href: a.getAttribute("href"),
      text: (a.textContent || "").trim().slice(0, 40),
    }));
    const text = section.textContent || "";
    return { imgs, links, text: text.slice(0, 600) };
  });
  results.slides = dump.imgs;
  results.ctas = dump.links;
  results.text = dump.text;

  // Step the carousel 6 times (2 full rotations), capturing the active
  // slide image each step to catch regenerated media per-slide.
  const activeSeq = [];
  for (let i = 0; i < 6; i++) {
    const snap = await page.evaluate(() => {
      const section = document.querySelector("section");
      if (!section) return null;
      const imgs = [...section.querySelectorAll("img")];
      const visible = imgs.filter((img) => img.getAttribute("aria-hidden") !== "true");
      return visible.map((img) => img.getAttribute("src"));
    });
    activeSeq.push(snap);
    // click the next control (the round-26 e466 anchor may have changed —
    // find a button/region with aria-label or chevron icon in the section)
    const clicked = await page.evaluate(() => {
      const section = document.querySelector("section");
      if (!section) return false;
      const cands = [...section.querySelectorAll('button, [role="button"], a')].filter((el) => {
        const r = el.getBoundingClientRect();
        const txt = (el.textContent || "").toLowerCase();
        const label = (el.getAttribute("aria-label") || "").toLowerCase();
        return (
          (label.includes("next") || txt.includes("next") || txt.includes(">")) && r.width > 0
        );
      });
      if (cands.length) {
        cands[cands.length - 1].click();
        return true;
      }
      return false;
    });
    if (!clicked) break;
    await page.waitForTimeout(1200);
  }
  results.activeSeq = activeSeq;
  await page.close();
  console.log(`\n===== ${label} =====`);
  console.log(JSON.stringify(results, null, 2).slice(0, 3000));
  return results;
};

// Reference product-image inventory (shop page).
const shopInventory = async (ctx, base, label) => {
  const page = await ctx.newPage();
  await page.goto(base + "/shop", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const inv = await page.evaluate(() => {
    const main = document.querySelector("main");
    if (!main) return [];
    return [...main.querySelectorAll("img")].map((i) => i.getAttribute("src"));
  });
  await page.close();
  console.log(`\n===== ${label} shop img inventory =====`);
  inv.forEach((s) => console.log("  ", s));
  return inv;
};

const browser = await chromium.launch();
const refCtx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const cloneCtx = await browser.newContext({ viewport: { width: 1024, height: 768 } });

// login both
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
console.log("ref login ->", await login(refCtx, REF, "sepnetflix2023@outlook.com", "$Abcd1234"));
console.log("clone login ->", await login(cloneCtx, CLONE, "john@example.com", "Demo1234!"));

await walk(refCtx, REF, "REFERENCE hero");
await walk(cloneCtx, CLONE, "CLONE hero");
await shopInventory(refCtx, REF, "REFERENCE");
await shopInventory(cloneCtx, CLONE, "CLONE");

await browser.close();
