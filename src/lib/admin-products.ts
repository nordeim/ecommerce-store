/**
 * Admin products filters (session-27, ADMIN-PRODUCTS-1) — the pure seam
 * behind /admin/products' URL-deep-linkable filter state (?q= +
 * ?category= + ?visibility=), the console trifecta's completion: the
 * orders surface got session-13's ADMIN-SEARCH-1 and the payments
 * surface got sessions 24-26's PAY-OPS-1/2/3; the products list was the
 * last of the three console LIST surfaces rendering a bare list. The
 * admin surface is a superset, so it gets the lib-seam treatment (repo
 * convention: unit-pinned here, E2E in tests/e2e/admin.spec.ts).
 *
 * Contract: `q` is trimmed and matched with SQLite `contains`
 * (ASCII-case-insensitive LIKE) against the product name OR slug — the
 * two identifiers an operator relays. `category` validates against the
 * canonical slug set the PAGE fetches from the DB (passed as pure input
 * — the same query feeds the island's Select options; the seam never
 * imports Prisma and never hard-codes the catalog, so a future category
 * validates the day it is seeded — the placedIntentIds precedent,
 * session-25): anything else falls through to undefined so a bad
 * deep-link renders the unfiltered list, never an error (the family
 * contract). `visibility` validates against the two canonical values
 * (active / hidden) — the eye-toggle seam's list-level answer
 * ("which products did I hide?").
 *
 * `buildAdminProductWhere` composes the Prisma `where` with the
 * composable-AND refactor (session-26's pattern): each active dimension
 * contributes ONE AND element — q (the name/slug OR), category (the
 * relation filter — no id mapping needed), visibility (isActive) — one
 * element renders bare (the historical single-filter shapes), two or
 * more AND together. No filters → {} (the unfiltered list).
 */

/** The canonical visibility values the visibility Select writes. */
export const ADMIN_PRODUCT_VISIBILITY_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "hidden", label: "Hidden" },
] as const;

const CANONICAL_VISIBILITIES = new Set<string>(
  ADMIN_PRODUCT_VISIBILITY_OPTIONS.map((o) => o.value),
);

export type AdminProductFilters = {
  q?: string;
  category?: string;
  visibility?: string;
};

export type AdminProductWhere = {
  OR?: Array<{ name: { contains: string } } | { slug: { contains: string } }>;
  category?: { slug: string };
  isActive?: boolean;
  AND?: Array<
    | { OR: NonNullable<AdminProductWhere["OR"]> }
    | { category: { slug: string } }
    | { isActive: boolean }
  >;
};

/**
 * Parse the raw searchParams record (the `Record<string, string |
 * string[] | undefined>` Next delivers) into the validated filter state.
 * Array params take their first value (the ?q=a&q=b shape), unknown keys
 * are ignored, invalid categories/visibilities are dropped.
 */
export function parseAdminProductFilters(
  params: Record<string, string | string[] | undefined>,
  categorySlugs: string[],
): AdminProductFilters {
  const one = (k: string): string | undefined => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const qRaw = one("q")?.trim();

  const categoryRaw = one("category");
  const category =
    categoryRaw && categorySlugs.includes(categoryRaw) ? categoryRaw : undefined;

  const visibilityRaw = one("visibility");
  const visibility =
    visibilityRaw && CANONICAL_VISIBILITIES.has(visibilityRaw) ? visibilityRaw : undefined;

  return { q: qRaw || undefined, category, visibility };
}

/**
 * Build the Prisma `where` for the filtered product query. Each active
 * dimension contributes ONE AND element (q → the name/slug OR element,
 * category → the relation element, visibility → the isActive element);
 * one element renders bare, two or more AND together — the composition
 * keeps every single-filter shape minimal and every combination
 * predictable (the session-26 composable-AND pattern).
 */
export function buildAdminProductWhere(filters: AdminProductFilters): AdminProductWhere {
  const and: NonNullable<AdminProductWhere["AND"]> = [];

  if (filters.q) {
    and.push({
      OR: [{ name: { contains: filters.q } }, { slug: { contains: filters.q } }],
    });
  }

  if (filters.category) {
    and.push({ category: { slug: filters.category } });
  }

  if (filters.visibility === "active") {
    and.push({ isActive: true });
  } else if (filters.visibility === "hidden") {
    and.push({ isActive: false });
  }

  if (and.length === 0) return {};
  if (and.length === 1) return and[0];
  return { AND: and };
}
