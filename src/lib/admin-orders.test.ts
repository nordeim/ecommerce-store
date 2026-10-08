import { describe, expect, it } from "vitest";

import {
  ADMIN_ORDER_STATUS_OPTIONS,
  buildAdminOrderWhere,
  parseAdminOrderFilters,
} from "./admin-orders";

// Admin order-list filters (session-13, ADMIN-SEARCH-1): the /admin/orders
// surface takes a URL-deep-linkable filter state (?status= + ?q=) exactly
// like the shop's filter bar. The parsing/where-building is a pure seam
// (page-local in the shop for reference-parity reasons; the admin surface
// is a superset, so it gets the lib-seam treatment per repo convention).
// The Prisma application is E2E-covered in tests/e2e/admin.spec.ts.

describe("parseAdminOrderFilters", () => {
  it("returns no filters for empty params", () => {
    expect(parseAdminOrderFilters({})).toEqual({});
  });

  it("keeps a canonical status", () => {
    expect(parseAdminOrderFilters({ status: "delivered" })).toEqual({ status: "delivered" });
    expect(parseAdminOrderFilters({ status: "in_transit" })).toEqual({ status: "in_transit" });
    expect(parseAdminOrderFilters({ status: "processing" })).toEqual({ status: "processing" });
    expect(parseAdminOrderFilters({ status: "cancelled" })).toEqual({ status: "cancelled" });
  });

  it("drops non-canonical statuses (case-sensitive contract)", () => {
    expect(parseAdminOrderFilters({ status: "Delivered" })).toEqual({});
    expect(parseAdminOrderFilters({ status: "bogus" })).toEqual({});
    expect(parseAdminOrderFilters({ status: "" })).toEqual({});
  });

  it("trims the free-text query and drops it when empty", () => {
    expect(parseAdminOrderFilters({ q: "  ORD-2026-001  " })).toEqual({ q: "ORD-2026-001" });
    expect(parseAdminOrderFilters({ q: "   " })).toEqual({});
    expect(parseAdminOrderFilters({ q: "" })).toEqual({});
  });

  it("takes the first value of array params (the ?q=a&q=b shape)", () => {
    expect(parseAdminOrderFilters({ q: ["ORD-2026-001", "ORD-2026-002"] })).toEqual({
      q: "ORD-2026-001",
    });
    expect(parseAdminOrderFilters({ status: ["delivered", "processing"] })).toEqual({
      status: "delivered",
    });
  });

  it("combines status and query", () => {
    expect(parseAdminOrderFilters({ status: "delivered", q: "john@" })).toEqual({
      status: "delivered",
      q: "john@",
    });
  });

  it("ignores unrelated params", () => {
    expect(parseAdminOrderFilters({ page: "2", sort: "bogus" })).toEqual({});
  });
});

describe("buildAdminOrderWhere", () => {
  it("returns an empty where for no filters (the unfiltered list)", () => {
    expect(buildAdminOrderWhere({})).toEqual({});
  });

  it("builds an exact status match for status-only filters", () => {
    expect(buildAdminOrderWhere({ status: "delivered" })).toEqual({ status: "delivered" });
  });

  it("builds the number+email contains branches for query-only filters", () => {
    expect(buildAdminOrderWhere({ q: "ORD-2026" })).toEqual({
      OR: [
        { number: { contains: "ORD-2026" } },
        { email: { contains: "ORD-2026" } },
      ],
    });
  });

  it("combines both filter kinds (AND of status + OR)", () => {
    expect(buildAdminOrderWhere({ status: "delivered", q: "john@" })).toEqual({
      status: "delivered",
      OR: [
        { number: { contains: "john@" } },
        { email: { contains: "john@" } },
      ],
    });
  });
});

describe("ADMIN_ORDER_STATUS_OPTIONS", () => {
  it("matches the status combobox contract (the four canonical statuses)", () => {
    // The AdminOrderRow combobox writes exactly these values
    // (src/lib/actions/admin.ts ORDER_STATUSES) — the filter select must
    // offer the same set or filtering by a written status would be
    // impossible.
    expect(ADMIN_ORDER_STATUS_OPTIONS.map((o) => o.value)).toEqual([
      "processing",
      "in_transit",
      "delivered",
      "cancelled",
    ]);
    expect(ADMIN_ORDER_STATUS_OPTIONS.every((o) => o.label.length > 0)).toBe(true);
  });
});
