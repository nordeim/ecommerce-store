import { describe, expect, it } from "vitest";
// Session-36 (ORDER-TRACKING-1, ADR-044): the order-tracking view seam —
// the "where's my order" affordance's read vocabulary. The order's
// carrier + trackingNumber columns are its RESTING state (like cardLast4);
// this seam composes the customer-safe read row: the calm state when
// either side is missing ({ visible: false } — the orderRefundLineView
// precedent), the canonical carrier map (ups/fedex/usps/dhl → the label +
// the public tracking URL with the code encodeURIComponent-substituted),
// the case-insensitive + whitespace-trimmed key match (the operator types
// "UPS" or " ups " — both link), and the raw passthrough for unknown
// carriers (the number renders, just not linked — the parse family's
// fall-through philosophy). Pure module — no Prisma, no React (the
// order-* seam family: order-status, order-money-state, order-timeline).
import { orderTrackingView } from "./order-tracking";

describe("orderTrackingView — the calm state", () => {
  it("null carrier and null tracking number render nothing (the calm state)", () => {
    expect(orderTrackingView(null, null)).toEqual({ visible: false });
  });

  it("a set carrier with a missing tracking number stays calm (the pair contract)", () => {
    expect(orderTrackingView("UPS", null)).toEqual({ visible: false });
  });

  it("a tracking number with a missing carrier stays calm (the pair contract)", () => {
    expect(orderTrackingView(null, "1Z999AA10123456784")).toEqual({ visible: false });
  });

  it("empty/whitespace strings are treated as missing (the trim contract)", () => {
    expect(orderTrackingView("", "")).toEqual({ visible: false });
    expect(orderTrackingView("   ", "1Z999AA10123456784")).toEqual({ visible: false });
    expect(orderTrackingView("UPS", "   ")).toEqual({ visible: false });
  });
});

describe("orderTrackingView — the canonical carriers", () => {
  it("UPS composes the label, the code, and the public tracking URL", () => {
    expect(orderTrackingView("UPS", "1Z999AA10123456784")).toEqual({
      visible: true,
      carrierLabel: "UPS",
      trackingCode: "1Z999AA10123456784",
      href: "https://www.ups.com/track?tracknum=1Z999AA10123456784",
    });
  });

  it("the key match is case-insensitive and whitespace-trimmed ('  ups ' links identically)", () => {
    expect(orderTrackingView("  ups ", "1Z999AA10123456784")).toEqual({
      visible: true,
      carrierLabel: "UPS",
      trackingCode: "1Z999AA10123456784",
      href: "https://www.ups.com/track?tracknum=1Z999AA10123456784",
    });
  });

  it("FedEx composes its canonical URL template", () => {
    expect(orderTrackingView("FedEx", "771283940293")).toEqual({
      visible: true,
      carrierLabel: "FedEx",
      trackingCode: "771283940293",
      href: "https://www.fedex.com/fedextrack/?trknbr=771283940293",
    });
  });

  it("USPS composes its canonical URL template", () => {
    expect(orderTrackingView("USPS", "9400111899223197428490")).toEqual({
      visible: true,
      carrierLabel: "USPS",
      trackingCode: "9400111899223197428490",
      href: "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223197428490",
    });
  });

  it("DHL composes its canonical URL template", () => {
    expect(orderTrackingView("DHL", "JD0146000038348")).toEqual({
      visible: true,
      carrierLabel: "DHL",
      trackingCode: "JD0146000038348",
      href: "https://www.dhl.com/us-en/home/tracking.html?tracking-id=JD0146000038348",
    });
  });

  it("the code is URL-encoded into the template (a space becomes %20)", () => {
    expect(orderTrackingView("FedEx", "7712 8839 4029")).toEqual({
      visible: true,
      carrierLabel: "FedEx",
      trackingCode: "7712 8839 4029",
      href: "https://www.fedex.com/fedextrack/?trknbr=7712%208839%204029",
    });
  });
});

describe("orderTrackingView — the raw passthrough (unknown carriers)", () => {
  it("an unknown carrier renders its raw label with NO link (the number still shows)", () => {
    expect(orderTrackingView("Royal Mail", "AB123456789GB")).toEqual({
      visible: true,
      carrierLabel: "Royal Mail",
      trackingCode: "AB123456789GB",
      href: null,
    });
  });
});
