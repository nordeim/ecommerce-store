import { describe, expect, it } from "vitest";

import {
  ADMIN_PRODUCT_VISIBILITY_OPTIONS,
  buildAdminProductWhere,
  parseAdminProductFilters,
} from "./admin-products";

// Admin products filters (session-27, ADMIN-PRODUCTS-1): the
// /admin/products console list takes a URL-deep-linkable filter state
// (?q= + ?category= + ?visibility=) exactly like the /admin/orders
// (session-13, ADMIN-SEARCH-1) and /admin/payments (sessions 24-26,
// PAY-OPS-1/2/3) filter bars — the console trifecta's last surface.
// The admin surface is a superset, so it gets the lib-seam treatment
// per repo convention. The Prisma application is E2E-covered in
// tests/e2e/admin.spec.ts.
//
// The category set is PURE INPUT (the page passes the slugs fetched
// from the DB — the same query feeds the island's Select options):
// the seam never imports Prisma and never hard-codes the catalog (a
// future 7th category validates the day it is seeded — the
// placedIntentIds precedent, session-25).

const SLUGS = [
  "electronics",
  "clothing",
  "home-living",
  "accessories",
  "sports",
  "beauty",
];

describe("parseAdminProductFilters", () => {
  it("returns no filters for empty params", () => {
    expect(parseAdminProductFilters({}, SLUGS)).toEqual({});
  });

  it("trims and keeps the query", () => {
    expect(parseAdminProductFilters({ q: "  headphones  " }, SLUGS)).toEqual({
      q: "headphones",
    });
  });

  it("drops an empty/whitespace query", () => {
    expect(parseAdminProductFilters({ q: "   " }, SLUGS)).toEqual({});
  });

  it("takes the first value of array params (the ?q=a&q=b shape)", () => {
    expect(parseAdminProductFilters({ q: ["head", "pad"] }, SLUGS)).toEqual({
      q: "head",
    });
    expect(parseAdminProductFilters({ category: ["sports", "beauty"] }, SLUGS)).toEqual({
      category: "sports",
    });
  });

  it("keeps a category present in the passed slug set", () => {
    expect(parseAdminProductFilters({ category: "electronics" }, SLUGS)).toEqual({
      category: "electronics",
    });
    expect(parseAdminProductFilters({ category: "home-living" }, SLUGS)).toEqual({
      category: "home-living",
    });
  });

  it("drops a category absent from the passed slug set (bad deep-links fall through, never error)", () => {
    expect(parseAdminProductFilters({ category: "not-a-slug" }, SLUGS)).toEqual({});
    expect(parseAdminProductFilters({ category: "Electronics" }, SLUGS)).toEqual({});
    expect(parseAdminProductFilters({ category: "electronics" }, ["sports"])).toEqual({});
  });

  it("keeps the two canonical visibility values and drops anything else", () => {
    expect(parseAdminProductFilters({ visibility: "active" }, SLUGS)).toEqual({
      visibility: "active",
    });
    expect(parseAdminProductFilters({ visibility: "hidden" }, SLUGS)).toEqual({
      visibility: "hidden",
    });
    expect(parseAdminProductFilters({ visibility: "Active" }, SLUGS)).toEqual({});
    expect(parseAdminProductFilters({ visibility: "bogus" }, SLUGS)).toEqual({});
  });

  it("keeps a fully-composed filter state", () => {
    expect(
      parseAdminProductFilters(
        { q: " speaker ", category: "electronics", visibility: "active" },
        SLUGS,
      ),
    ).toEqual({ q: "speaker", category: "electronics", visibility: "active" });
  });

  it("drops every invalid dimension independently (valid keys survive)", () => {
    expect(
      parseAdminProductFilters({ q: "tee", category: "bogus", visibility: "nope" }, SLUGS),
    ).toEqual({ q: "tee" });
  });

  it("ignores unknown keys", () => {
    expect(parseAdminProductFilters({ status: "delivered", family: "succeeded" }, SLUGS)).toEqual(
      {},
    );
  });

  it("exposes the canonical visibility Select options", () => {
    expect(ADMIN_PRODUCT_VISIBILITY_OPTIONS).toEqual([
      { value: "active", label: "Active" },
      { value: "hidden", label: "Hidden" },
    ]);
  });
});

describe("buildAdminProductWhere", () => {
  it("returns {} for no filters (the unfiltered list)", () => {
    expect(buildAdminProductWhere({})).toEqual({});
  });

  it("q-only renders the bare name/slug OR element", () => {
    expect(buildAdminProductWhere({ q: "headphones" })).toEqual({
      OR: [{ name: { contains: "headphones" } }, { slug: { contains: "headphones" } }],
    });
  });

  it("category-only renders the bare relation element", () => {
    expect(buildAdminProductWhere({ category: "electronics" })).toEqual({
      category: { slug: "electronics" },
    });
  });

  it("visibility-only renders the bare isActive element", () => {
    expect(buildAdminProductWhere({ visibility: "active" })).toEqual({ isActive: true });
    expect(buildAdminProductWhere({ visibility: "hidden" })).toEqual({ isActive: false });
  });

  it("q+category AND the two elements", () => {
    expect(buildAdminProductWhere({ q: "speaker", category: "electronics" })).toEqual({
      AND: [
        { OR: [{ name: { contains: "speaker" } }, { slug: { contains: "speaker" } }] },
        { category: { slug: "electronics" } },
      ],
    });
  });

  it("category+visibility AND the two elements", () => {
    expect(buildAdminProductWhere({ category: "sports", visibility: "hidden" })).toEqual({
      AND: [{ category: { slug: "sports" } }, { isActive: false }],
    });
  });

  it("all three dimensions AND in the canonical order (q, category, visibility)", () => {
    expect(
      buildAdminProductWhere({ q: "mat", category: "sports", visibility: "active" }),
    ).toEqual({
      AND: [
        { OR: [{ name: { contains: "mat" } }, { slug: { contains: "mat" } }] },
        { category: { slug: "sports" } },
        { isActive: true },
      ],
    });
  });
});
