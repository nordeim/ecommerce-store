import { describe, expect, it } from "vitest";

import {
  OG_IMAGE_URL,
  SITE_DESCRIPTION,
  pageMetadata,
} from "./metadata";

// Session-9 (METADATA-OG-1): the reference renders a full OpenGraph/Twitter
// head layer on every route. Pattern decoded live 2026-10-08 across 10 route
// probes:
//   og:title       = document title ("Shop | Lumina"; PDP/unknown use the
//                    humanized-slug title; home is bare "Lumina")
//   og:description = "«Page» on Lumina. " + SITE_DESC on static pages;
//                    plain SITE_DESC on home, PDP and unknown routes
//   og:image       = the site logo (site-wide — the PDP uses the LOGO too)
//   og:url         = canonical URL, query preserved
//   twitter:card   = "summary_large_image" + twitter:url on static pages;
//                    the PDP renders NEITHER
describe("pageMetadata (session-9, METADATA-OG-1)", () => {
  // Next's Twitter/OpenGraph head types are unions where some keys only
  // exist on specific variants — read them through a minimal structural view.
  const ogOf = (m: import("next").Metadata): Record<string, unknown> | undefined =>
    (m.openGraph as unknown as Record<string, unknown> | undefined) ?? undefined;

  it("exposes the reference's exact site description and og image", () => {
    expect(SITE_DESCRIPTION).toBe(
      "An elegant, high-end e-commerce destination offering curated essentials for a modern lifestyle.",
    );
    expect(OG_IMAGE_URL).toBe(
      "https://media.base44.com/images/public/69d296f5d1237b9a1afec899/76cff797e_logo.png/v1/fill/w_1200,h_630/76cff797e_logo.png",
    );
  });

  it("builds the static-page pattern: prefixed description + card + twitter url", () => {
    const m = pageMetadata({ title: "Shop", path: "/shop" });
    expect(m.title).toBe("Shop");
    expect(m.description).toBe(`Shop on Lumina. ${SITE_DESCRIPTION}`);
    expect(m.openGraph?.title).toBe("Shop | Lumina");
    expect(ogOf(m)?.description).toBe(`Shop on Lumina. ${SITE_DESCRIPTION}`);
    expect(ogOf(m)?.url).toBe("http://localhost:3000/shop");
    expect(ogOf(m)?.type).toBe("website");
    expect(ogOf(m)?.siteName).toBe("Lumina");
    expect(m.openGraph?.images).toEqual([{ url: OG_IMAGE_URL }]);
    // The builder omits `card` — Next's resolver defaults it to
    // summary_large_image at render time (the smoke E2E pins the rendered
    // tag); the unit contract is that the typed twitter field EXISTS.
    expect(m.twitter).toBeDefined();
    expect(m.twitter?.title).toBe("Shop | Lumina");
    expect(m.twitter?.images).toEqual([{ url: OG_IMAGE_URL }]);
    expect(m.other?.["twitter:url"]).toBe("http://localhost:3000/shop");
  });

  it("builds the plain pattern (home/404): no description prefix", () => {
    const m = pageMetadata({
      title: "Wireless Headphones",
      path: "/product/wireless-headphones",
      plain: true,
    });
    expect(m.description).toBe(SITE_DESCRIPTION);
    expect(ogOf(m)?.description).toBe(SITE_DESCRIPTION);
    expect(m.openGraph?.title).toBe("Wireless Headphones | Lumina");
    // The card-less PDP twitter shape is NOT this helper's job — the PDP
    // renders React 19-hoisted <meta> elements instead (Next's resolver
    // force-defaults the card when the typed field carries images).
    expect(m.other?.["twitter:url"]).toBe("http://localhost:3000/product/wireless-headphones");
  });

  it("maps the bare home route to the site origin and bare title", () => {
    const m = pageMetadata({ title: "Lumina", path: "/", bare: true, plain: true });
    expect(m.title).toEqual({ absolute: "Lumina" });
    expect(ogOf(m)?.url).toBe("http://localhost:3000");
    expect(m.openGraph?.title).toBe("Lumina");
    // Home carries the typed twitter field (the engine defaults the card —
    // smoke E2E pins the rendered tag).
    expect(m.twitter).toBeDefined();
  });

  it("preserves query strings in the canonical og:url (shop filters)", () => {
    const m = pageMetadata({ title: "Shop", path: "/shop?category=electronics" });
    expect(ogOf(m)?.url).toBe("http://localhost:3000/shop?category=electronics");
    expect(m.other?.["twitter:url"]).toBe("http://localhost:3000/shop?category=electronics");
  });

  it("honors an explicit site origin override", () => {
    const m = pageMetadata({ title: "Cart", path: "/cart", siteUrl: "https://shop.example.com" });
    expect(ogOf(m)?.url).toBe("https://shop.example.com/cart");
  });
});
