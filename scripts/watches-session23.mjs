// Round-22 standing watches: typeahead (the reference fires ZERO search
// network requests — its dropdown is client-side) + carousel cadence (both
// sites flip at the same ~5s stable interval). agent-browser sessions are
// already authenticated; this script uses fresh contexts for network
// instrumentation (the documented pattern from session-21).
import { chromium } from "playwright-core";

const REF = "https://fuzzy-lumina-style-hub.base44.app";

// ---- Typeahead watch: instrument fetch + XHR on the reference, type into
// its search, count search-shaped network requests.
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });

// login to ref
const lp = await ctx.newPage();
await lp.goto(REF + "/login", { waitUntil: "networkidle" });
await lp.getByLabel("Email").fill("sepnetflix2023@outlook.com");
await lp.getByLabel("Password").fill("$Abcd1234");
await lp.getByRole("button", { name: "Log in", exact: true }).click();
await lp.waitForLoadState("networkidle");
await lp.waitForTimeout(1500);
await lp.close();

const page = await ctx.newPage();
const searchRequests = [];
page.on("request", (req) => {
  const u = req.url();
  if (/search|typeahead|suggest|\/api\/|autocomplete/i.test(u) && !u.includes("base44.app/")) {
    searchRequests.push(u);
  }
});
await page.goto(REF + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
// open the search dropdown (the icon button) + type
const searchBtn = page.locator("header button:has(svg.lucide-search)").first();
await searchBtn.click();
await page.waitForTimeout(600);
await page.keyboard.type("head", { delay: 200 });
await page.waitForTimeout(1500);
console.log("TYPEAHEAD (ref): search-shaped network requests =", searchRequests.length, searchRequests.length ? JSON.stringify(searchRequests) : "");

// ---- Carousel cadence watch (clone, :3000): measure the active-slide
// flip interval.
const ctx2 = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const p2 = await ctx2.newPage();
await p2.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p2.waitForTimeout(500);
const flips = await p2.evaluate(() => new Promise((resolve) => {
  const times = [];
  const h1s = [...document.querySelectorAll("h1")];
  const probe = () => {
    // the carousel's active slide h1 text changes on flip
    const active = document.querySelector("[aria-hidden='false'] h1")?.textContent
      ?? h1s.find((h) => h.offsetParent !== null)?.textContent ?? "?";
    return active;
  };
  let last = probe();
  const t0 = performance.now();
  const iv = setInterval(() => {
    const cur = probe();
    if (cur !== last) {
      times.push(Math.round(performance.now() - t0));
      last = cur;
      if (times.length >= 3) { clearInterval(iv); resolve(times); }
    }
  }, 250);
  setTimeout(() => { clearInterval(iv); resolve(times); }, 16000);
}));
console.log("CAROUSEL (clone): flip intervals (ms) =", JSON.stringify(flips));

// ---- SEO re-verify (the standing round instruction): sitemap census +
// robots rule block + JSON-LD nodes.
const p3 = await ctx2.newPage();
const sitemap = await p3.goto("http://localhost:3000/sitemap.xml", { waitUntil: "domcontentloaded" });
const sitemapXml = await p3.content();
const locs = (sitemapXml.match(/<loc>/g) || []).length;
console.log("SEO sitemap:", sitemap?.status(), sitemap?.headers()["content-type"], "— <loc> URLs:", locs);
const robots = await p3.goto("http://localhost:3000/robots.txt");
console.log("SEO robots:", robots?.status(), robots?.headers()["content-type"]);
const home = await p3.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
const homeJsonLd = await p3.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent)));
const orgNode = homeJsonLd.find((n) => n["@type"] === "Organization");
const wsNode = homeJsonLd.find((n) => n["@type"] === "WebSite");
console.log("SEO JSON-LD (home): Organization =", !!orgNode, "· WebSite =", !!wsNode);
const pdp = await p3.goto("http://localhost:3000/product/wireless-headphones", { waitUntil: "domcontentloaded" });
const pdpJsonLd = await p3.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent)));
const prodNode = pdpJsonLd.find((n) => n["@type"] === "Product");
console.log("SEO JSON-LD (pdp): Product =", !!prodNode, "· offers.price =", prodNode?.offers?.price, prodNode?.offers?.priceCurrency);

await browser.close();
console.log("WATches complete");
