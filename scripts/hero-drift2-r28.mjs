// Round-28 hero drift probe v2: targets the carousel div directly
// (aria-roledescription="carousel"), steps through slides via the next
// button, and dumps slide image srcs + CTA hrefs + copy on BOTH sites.
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

const walk = async (ctx, base, label) => {
  const page = await ctx.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000); // let a slide be fully visible

  const carousel = page.locator('[aria-roledescription="carousel"]');
  const out = { domImgs: [], ctas: [], copy: [], activeSeq: [] };

  out.domImgs = await page.evaluate(() => {
    const c = document.querySelector('[aria-roledescription="carousel"]');
    if (!c) return "NO CAROUSEL FOUND";
    return [...c.querySelectorAll("img")].map((img) => ({
      src: img.getAttribute("src"),
      hidden: img.closest('[aria-hidden="true"]') !== null,
    }));
  });

  out.ctas = await page.evaluate(() => {
    const c = document.querySelector('[aria-roledescription="carousel"]');
    if (!c) return [];
    return [...c.querySelectorAll("a")].map((a) => ({
      href: a.getAttribute("href"),
      text: (a.textContent || "").trim(),
    }));
  });

  out.copy = await page.evaluate(() => {
    const c = document.querySelector('[aria-roledescription="carousel"]');
    if (!c) return [];
    return (c.textContent || "").replace(/\s+/g, " ").slice(0, 300);
  });

  // Step 4 times (3 slides + 1 wrap), capturing the ACTIVE img each step.
  for (let i = 0; i < 4; i++) {
    const active = await page.evaluate(() => {
      const c = document.querySelector('[aria-roledescription="carousel"]');
      if (!c) return [];
      const slides = [...c.querySelectorAll("img")].filter(
        (img) => img.closest('[aria-hidden="true"]') === null,
      );
      return slides.map((img) => img.getAttribute("src"));
    });
    out.activeSeq.push(active);

    // find next button: inside/near the carousel, aria-label or chevron
    const clicked = await page.evaluate(() => {
      const c = document.querySelector('[aria-roledescription="carousel"]');
      if (!c) return "no carousel";
      // search carousel and its next 2 siblings for buttons
      const roots = [c, c.parentElement, c.nextElementSibling].filter(Boolean);
      for (const root of roots) {
        const btns = [...root.querySelectorAll("button")];
        const next = btns.find((b) => {
          const l = (b.getAttribute("aria-label") || "").toLowerCase();
          return l.includes("next") || l.includes(">");
        });
        if (next) {
          next.click();
          return "clicked:" + (next.getAttribute("aria-label") || "unlabeled");
        }
      }
      return "no next button found (" + btns_count() + " buttons)";
      function btns_count() {
        return roots.reduce((n, r) => n + r.querySelectorAll("button").length, 0);
      }
    });
    out.lastClick = clicked;
    await page.waitForTimeout(1400);
  }
  await page.close();
  console.log(`\n===== ${label} =====`);
  console.log(JSON.stringify(out, null, 2));
};

const browser = await chromium.launch();
const refCtx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const cloneCtx = await browser.newContext({ viewport: { width: 1024, height: 768 } });

console.log("ref login ->", await login(refCtx, REF, "sepnetflix2023@outlook.com", "$Abcd1234"));
console.log("clone login ->", await login(cloneCtx, CLONE, "john@example.com", "Demo1234!"));

await walk(refCtx, REF, "REFERENCE hero");
await walk(cloneCtx, CLONE, "CLONE hero");
await browser.close();
