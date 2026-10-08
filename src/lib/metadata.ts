import type { Metadata } from "next";

/**
 * Social/PWA head layer — reference parity (session-9, METADATA-OG-1).
 *
 * The reference renders a complete OpenGraph/Twitter/PWA head set on every
 * route. Pattern decoded live 2026-10-08 across 10 route probes:
 *
 *   og:title       = the document title ("Shop | Lumina"; the PDP and unknown
 *                    routes use the humanized-slug title; home is "Lumina")
 *   og:description = "«Page» on Lumina. " + SITE_DESC on static pages;
 *                    plain SITE_DESC on home, PDP and unknown routes
 *   og:image       = the site logo (site-wide — the PDP also uses the LOGO,
 *                    not the product image)
 *   og:url         = canonical URL, QUERY PRESERVED (/shop?category=x keeps
 *                    the param), og:type = website, og:site_name = Lumina
 *   twitter:title/description/image mirror og; twitter:card
 *   ("summary_large_image") + twitter:url render on every route EXCEPT the
 *   PDP, which carries title/description/image but NEITHER card NOR url
 *   (that card-less shape cannot be expressed through the Metadata API —
 *   see the PDP page's React 19-hoisted <meta> elements)
 *   PWA metas site-wide: mobile-web-app-capable, apple-mobile-web-app-
 *   status-bar-style, apple-mobile-web-app-title (root layout, via
 *   appleWebApp — Next emits mobile-web-app-capable itself)
 *
 * Engine note: Next's twitter resolver force-defaults twitter:card to
 * "summary_large_image" whenever the typed twitter field carries images —
 * omitting `card` here still renders it, which is exactly what every
 * non-PDP route wants; `twitter:url` has no typed key and rides in `other`.
 */
export const SITE_DESCRIPTION =
  "An elegant, high-end e-commerce destination offering curated essentials for a modern lifestyle.";

export const OG_IMAGE_URL =
  "https://media.base44.com/images/public/69d296f5d1237b9a1afec899/76cff797e_logo.png/v1/fill/w_1200,h_630/76cff797e_logo.png";

const OG_IMAGES = [{ url: OG_IMAGE_URL }];

export type PageMetadataOptions = {
  /** Page title WITHOUT the " | Lumina" suffix (the template appends it). */
  title: string;
  /** Canonical path, including any query string ("/shop?category=electronics"). */
  path: string;
  /**
   * true = the plain description (home / PDP-style routes);
   * false/undefined = "«title» on Lumina. " prefix (static pages).
   */
  plain?: boolean;
  /** Emit the BARE title (home: "Lumina", no template suffix). */
  bare?: boolean;
  /** Canonical origin override (defaults to NEXT_PUBLIC_SITE_URL). */
  siteUrl?: string;
};

function resolveSiteUrl(override?: string): string {
  return override ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** Build the reference's per-route head set. */
export function pageMetadata({
  title,
  path,
  plain = false,
  bare = false,
  siteUrl,
}: PageMetadataOptions): Metadata {
  const origin = resolveSiteUrl(siteUrl);
  const url = path === "/" ? origin : origin + path;
  const description = plain
    ? SITE_DESCRIPTION
    : `${title} on Lumina. ${SITE_DESCRIPTION}`;
  const fullTitle = bare ? title : `${title} | Lumina`;

  return {
    title: bare ? { absolute: title } : title,
    description,
    openGraph: {
      title: fullTitle,
      description,
      url,
      type: "website",
      siteName: "Lumina",
      images: OG_IMAGES,
    },
    twitter: {
      title: fullTitle,
      description,
      images: OG_IMAGES,
    },
    other: {
      "twitter:url": url,
    },
  };
}
