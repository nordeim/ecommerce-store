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

// ---- session-41, ORDER-WINDOW-1 (ADR-048): the date-range window — the
// PAY-OPS-3 treatment applied to the orders surface (the only LIST surface
// without a time dimension; the take-100 ceiling's reach-past tool). The
// validation and boundary math compose the shared day-bounds seam
// (src/lib/day-bounds.ts — the session-35 formatTimelineDate precedent:
// two surfaces needing the same pure helper extract it), so both seams'
// date handling is identical by construction. These pins mirror the
// admin-payments PAY-OPS-3 family exactly.

describe("parseAdminOrderFilters (date bounds — ORDER-WINDOW-1)", () => {
  it("keeps a valid from/to pair", () => {
    expect(parseAdminOrderFilters({ from: "2026-03-01", to: "2026-03-31" })).toEqual({
      from: "2026-03-01",
      to: "2026-03-31",
    });
  });

  it("keeps from-only and to-only (open-ended)", () => {
    expect(parseAdminOrderFilters({ from: "2026-03-01" })).toEqual({ from: "2026-03-01" });
    expect(parseAdminOrderFilters({ to: "2026-03-31" })).toEqual({ to: "2026-03-31" });
  });

  it("drops bad shapes (never an error — the family contract)", () => {
    expect(parseAdminOrderFilters({ from: "03/01/2026" })).toEqual({});
    expect(parseAdminOrderFilters({ from: "2026-3-1" })).toEqual({});
    expect(parseAdminOrderFilters({ from: "2026-03-01T10:00:00Z" })).toEqual({});
    expect(parseAdminOrderFilters({ to: "not-a-date" })).toEqual({});
    expect(parseAdminOrderFilters({ from: "2026-13-01" })).toEqual({}); // no month 13
    expect(parseAdminOrderFilters({ to: "2026-02-30" })).toEqual({}); // no Feb 30
  });

  it("drops an inverted pair together (from > to)", () => {
    expect(parseAdminOrderFilters({ from: "2026-03-31", to: "2026-03-01" })).toEqual({});
  });

  it("keeps an equal pair (a one-day window)", () => {
    expect(parseAdminOrderFilters({ from: "2026-03-15", to: "2026-03-15" })).toEqual({
      from: "2026-03-15",
      to: "2026-03-15",
    });
  });

  it("takes the first value of array date params", () => {
    expect(parseAdminOrderFilters({ from: ["2026-03-01", "2026-01-01"] })).toEqual({
      from: "2026-03-01",
    });
  });

  it("composes dates with status and q", () => {
    expect(
      parseAdminOrderFilters({ status: "delivered", q: "ORD-2026", from: "2026-03-01", to: "2026-03-31" }),
    ).toEqual({ status: "delivered", q: "ORD-2026", from: "2026-03-01", to: "2026-03-31" });
  });
});

describe("buildAdminOrderWhere (the placedAt range — ORDER-WINDOW-1)", () => {
  it("from+to builds the UTC day-boundary range [fromStart, toEnd)", () => {
    expect(buildAdminOrderWhere({ from: "2026-03-01", to: "2026-03-31" })).toEqual({
      placedAt: { gte: new Date("2026-03-01T00:00:00.000Z"), lt: new Date("2026-04-01T00:00:00.000Z") },
    });
  });

  it("from-only and to-only build open-ended ranges", () => {
    expect(buildAdminOrderWhere({ from: "2026-03-01" })).toEqual({
      placedAt: { gte: new Date("2026-03-01T00:00:00.000Z") },
    });
    expect(buildAdminOrderWhere({ to: "2026-03-31" })).toEqual({
      placedAt: { lt: new Date("2026-04-01T00:00:00.000Z") },
    });
  });

  it("dates AND with the status branch (the flat shape's third key)", () => {
    expect(buildAdminOrderWhere({ status: "delivered", from: "2026-03-01", to: "2026-03-31" })).toEqual({
      status: "delivered",
      placedAt: { gte: new Date("2026-03-01T00:00:00.000Z"), lt: new Date("2026-04-01T00:00:00.000Z") },
    });
  });

  it("dates AND with the q branches", () => {
    expect(buildAdminOrderWhere({ q: "john@", from: "2026-03-01" })).toEqual({
      OR: [
        { number: { contains: "john@" } },
        { email: { contains: "john@" } },
      ],
      placedAt: { gte: new Date("2026-03-01T00:00:00.000Z") },
    });
  });

  it("the triple composition: status + q + dates", () => {
    expect(
      buildAdminOrderWhere({ status: "delivered", q: "ORD-2026", from: "2026-03-01", to: "2026-03-31" }),
    ).toEqual({
      status: "delivered",
      OR: [
        { number: { contains: "ORD-2026" } },
        { email: { contains: "ORD-2026" } },
      ],
      placedAt: { gte: new Date("2026-03-01T00:00:00.000Z"), lt: new Date("2026-04-01T00:00:00.000Z") },
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
