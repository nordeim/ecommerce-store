import { expect, test } from "@playwright/test";

// SEO standing gate (session-20, SEO-GATE-1 + JSON-LD-1).
//
// The round-20 SEO differential measured the layer on BOTH sites: the
// clone's sitemap is the SEO SUPERSET (5 curated public routes + ALL 12
// product URLs with lastModified — the reference's platform sitemap lists
// 10 app routes incl. private ones and ZERO products); the clone's robots
// correctly disallows the private families (/admin /account /checkout
// /api — the reference's allow-all); NEITHER site ships structured data —
// the clone adds Organization + WebSite (home) and Product + offers
// (PDP) as the production-SEO superset members.
//
// Until this spec, NOTHING pinned the layer: a route/schema refactor
// could silently drop the product URLs (the superset's core value),
// break the robots rules, or corrupt the structured data. The pins below
// run on every `test:e2e`.
//
// Origin note: the E2E server runs with NEXT_PUBLIC_SITE_URL unset, so
// sitemap/robots/og all resolve to the documented fallback origin
// (http://localhost:3000) — pinning the fallback also pins the "set it
// in production" contract in .env.example.

const FALLBACK_ORIGIN = "http://localhost:3000";

test.describe("seo", () => {
  test("sitemap.xml serves the curated route set with product URLs (session-20, SEO-GATE-1)", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/xml");
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    // 5 curated static routes + the 12 seeded product URLs = 17.
    expect(locs).toHaveLength(17);
    // The static set, in the pinned order with the pinned priorities.
    expect(locs[0]).toBe(FALLBACK_ORIGIN); // home (no trailing slash — the sitemap.ts contract)
    const entry = (url: string) => {
      const i = locs.indexOf(url);
      const block = xml.slice(xml.indexOf(`<loc>${url}</loc>`), xml.indexOf("</url>", xml.indexOf(`<loc>${url}</loc>`)));
      return { i, block, found: i >= 0 };
    };
    const home = entry(FALLBACK_ORIGIN); // home (no trailing slash)
    expect(home.found).toBe(true);
    expect(home.block).toContain("<priority>1</priority>");
    expect(home.block).toContain("<changefreq>daily</changefreq>");
    const shop = entry(`${FALLBACK_ORIGIN}/shop`);
    expect(shop.found).toBe(true);
    expect(shop.block).toContain("<priority>0.9</priority>");
    const wishlist = entry(`${FALLBACK_ORIGIN}/wishlist`);
    expect(wishlist.found).toBe(true);
    expect(wishlist.block).toContain("<priority>0.3</priority>");
    const login = entry(`${FALLBACK_ORIGIN}/login`);
    expect(login.found).toBe(true);
    expect(login.block).toContain("<priority>0.2</priority>");
    const register = entry(`${FALLBACK_ORIGIN}/register`);
    expect(register.found).toBe(true);
    expect(register.block).toContain("<priority>0.2</priority>");
  });

  test("sitemap.xml carries every active product URL with lastmod (session-20, SEO-GATE-1)", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    const xml = await res.text();
    // The 12 seeded slugs (the seed's isActive catalog, sortOrder order).
    const slugs = [
      "wireless-headphones",
      "leather-watch",
      "organic-cotton-tee",
      "smart-speaker",
      "ceramic-planter",
      "running-shoes",
      "vitamin-c-serum",
      "linen-blanket",
      "titanium-sunglasses",
      "yoga-mat",
      "charging-pad",
      "silk-pajama",
    ];
    for (const slug of slugs) {
      const url = `${FALLBACK_ORIGIN}/product/${slug}`;
      expect(xml, `product URL for ${slug}`).toContain(`<loc>${url}</loc>`);
      const block = xml.slice(xml.indexOf(`<loc>${url}</loc>`), xml.indexOf("</url>", xml.indexOf(`<loc>${url}</loc>`)));
      expect(block, `${slug} lastmod`).toContain("<lastmod>");
      expect(block, `${slug} priority`).toContain("<priority>0.8</priority>");
      expect(block, `${slug} changefreq`).toContain("<changefreq>weekly</changefreq>");
    }
  });

  test("robots.txt pins the private-family disallow rules (session-20, SEO-GATE-1)", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/plain");
    const body = await res.text();
    expect(body).toContain("User-Agent: *");
    expect(body).toContain("Allow: /");
    expect(body).toContain("Disallow: /admin");
    expect(body).toContain("Disallow: /account");
    expect(body).toContain("Disallow: /checkout");
    expect(body).toContain("Disallow: /api");
    expect(body).toContain(`Sitemap: ${FALLBACK_ORIGIN}/sitemap.xml`);
  });

  test("the home page carries Organization + WebSite structured data (session-20, JSON-LD-1)", async ({ page }) => {
    await page.goto("/");
    const nodes = await page.evaluate(() =>
      Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s) =>
        JSON.parse(s.textContent ?? "null"),
      ),
    );
    const org = nodes.find((n) => n && n["@type"] === "Organization");
    expect(org).toBeTruthy();
    expect(org.name).toBe("Lumina");
    expect(org.url).toBe(FALLBACK_ORIGIN);
    const site = nodes.find((n) => n && n["@type"] === "WebSite");
    expect(site).toBeTruthy();
    expect(site.name).toBe("Lumina");
    expect(site.url).toBe(FALLBACK_ORIGIN);
  });

  test("the PDP carries Product structured data with the real offer (session-20, JSON-LD-1)", async ({ page }) => {
    await page.goto("/product/wireless-headphones");
    const product = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s) =>
        JSON.parse(s.textContent ?? "null"),
      );
      return nodes.find((n) => n && n["@type"] === "Product") ?? null;
    });
    expect(product).toBeTruthy();
    expect(product.name).toBe("Wireless Noise-Cancelling Headphones");
    expect(product.image).toBeTruthy();
    expect(product.offers.price).toBe(299.99); // schema.org decimal USD, not integer cents
    expect(product.offers.priceCurrency).toBe("USD");
    expect(product.offers.availability).toContain("InStock");
    // The seeded rating (4.8 / 234) feeds aggregateRating.
    expect(product.aggregateRating.ratingValue).toBe(4.8);
    expect(product.aggregateRating.reviewCount).toBe(234);
  });

  test("unknown product slugs carry NO Product node (session-20, JSON-LD-1)", async ({ page }) => {
    await page.goto("/product/does-not-exist");
    const hasProduct = await page.evaluate(() =>
      Array.from(document.querySelectorAll('script[type="application/ld+json"]')).some((s) => {
        try {
          return JSON.parse(s.textContent ?? "null")?.["@type"] === "Product";
        } catch {
          return false;
        }
      }),
    );
    expect(hasProduct).toBe(false);
  });
});
