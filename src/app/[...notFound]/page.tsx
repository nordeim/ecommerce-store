import type { Metadata } from "next";
import { Platform404 } from "@/components/store/platform-404";
import { notFoundPageTitle } from "@/lib/format";

/**
 * Unknown-route catch-all (session-8, TITLE-404-1).
 *
 * The reference's SPA titles unknown routes from the LAST path segment
 * containing a letter, humanized ("/nonexistent-route-xyz" -> "Nonexistent
 * Route Xyz | Lumina", "/foo/bar-baz" -> "Bar Baz | Lumina", "/products/42"
 * -> "Products | Lumina", "/12345" -> plain "Lumina") — the same rule it
 * applies to unknown PDP slugs (session-7, TITLE-NF-1). Next's static
 * not-found boundary carries no path context, so this page IS the 404 for
 * every unmatched path: it renders the identical platform-404 UI (shared
 * component) with the path-aware title. Known routes are all more
 * specific than a catch-all, and nothing in the app calls notFound() —
 * `src/app/not-found.tsx` stays as the boundary insurance.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ notFound: string[] }>;
}): Promise<Metadata> {
  const { notFound: segments } = await params;
  const title = notFoundPageTitle(segments);
  if (title === null) {
    // No letter-bearing segment (e.g. /12345): the reference keeps the
    // plain default — bypass the "%s | Lumina" template.
    return { title: { absolute: "Lumina" } };
  }
  return { title };
}

export default async function CatchAllNotFoundPage({
  params,
}: {
  params: Promise<{ notFound: string[] }>;
}) {
  const { notFound: segments } = await params;
  return <Platform404 path={segments.join("/")} />;
}
