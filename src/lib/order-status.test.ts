import { describe, expect, it } from "vitest";
// Session-34 (CUSTOMER-ORDER-DETAIL-1): the order-status vocabulary seam —
// the reference-measured badge classes + labels the account family renders
// (the history rows since session-9, the customer order-detail since this
// round). Pure module — no Prisma, no React: both the client tabs and the
// server detail page import the SAME source (a "use client" module's
// plain-object exports are client references — not importable from server
// components; the seam extraction is the fix).
import {
  STATUS_LABELS,
  STATUS_STYLES,
  formatOrderDate,
} from "./order-status";

describe("STATUS_STYLES — the reference-measured badge classes (session-9, ACCOUNT-ORDER-ROW-1)", () => {
  it("delivered is the primary variant with the shadow (measured live: bg-primary rgb(230,107,26), white text)", () => {
    expect(STATUS_STYLES.delivered).toContain("bg-primary");
    expect(STATUS_STYLES.delivered).toContain("text-primary-foreground");
    expect(STATUS_STYLES.delivered).toContain("shadow");
  });

  it("in_transit, processing and cancelled are the secondary variant (measured live: bg-secondary rgb(242,240,237))", () => {
    for (const s of ["in_transit", "processing", "cancelled"] as const) {
      expect(STATUS_STYLES[s]).toContain("bg-secondary");
      expect(STATUS_STYLES[s]).toContain("text-secondary-foreground");
      expect(STATUS_STYLES[s]).not.toContain("bg-primary");
    }
  });

  it("all four canonical fulfillment statuses are present", () => {
    expect(Object.keys(STATUS_STYLES).sort()).toEqual([
      "cancelled",
      "delivered",
      "in_transit",
      "processing",
    ]);
  });
});

describe("STATUS_LABELS — the pill copy", () => {
  it("maps the four canonical statuses to their display labels", () => {
    expect(STATUS_LABELS.delivered).toBe("Delivered");
    expect(STATUS_LABELS.in_transit).toBe("In Transit");
    expect(STATUS_LABELS.processing).toBe("Processing");
    expect(STATUS_LABELS.cancelled).toBe("Cancelled");
  });

  it("an unknown status has NO mapping — the consumer's ?? fall-through renders the raw value (the parse family's fall-through philosophy)", () => {
    // The vocabulary is intentionally open: statuses arrive as Strings
    // (the SQLite contract — no enums), and an unmeasured status renders
    // raw rather than guessed (the session-9 measured-live discipline).
    expect(STATUS_LABELS.returned as string | undefined).toBeUndefined();
    expect(STATUS_STYLES.returned as string | undefined).toBeUndefined();
  });
});

describe("formatOrderDate — the account family's short date", () => {
  // NOT pinned to a specific calendar day: toLocaleDateString renders the
  // runner's local date for a UTC instant (a fixed ISO timestamp shifts a
  // calendar day under different runner TZs — the worker TZ is not a
  // contract). The SHAPE is the contract: "Mon DD, YYYY" (en-US short).
  // Both consumers' exact renderings are E2E-pinned ("Mar 28, 2026 · 2
  // items" — account.spec; the detail page's Placed row).
  it("renders the en-US short-month format", () => {
    const rendered = formatOrderDate("2026-03-28T12:00:00Z");
    expect(rendered).toMatch(/^[A-Z][a-z]{2} \d{1,2}, 2026$/);
  });

  it("renders a four-digit year and a comma", () => {
    expect(formatOrderDate("2026-01-05T12:00:00Z")).toMatch(/, 2026$/);
  });
});
