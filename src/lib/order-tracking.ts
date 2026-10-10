/**
 * The order-tracking view seam (session-36, ORDER-TRACKING-1, ADR-044) —
 * the "where's my order" affordance's read vocabulary.
 *
 * WHY THIS SEAM EXISTS: the order's carrier + trackingNumber columns are
 * its RESTING state (like cardLast4 — rendered from the row, never
 * derived from events), but the customer-safe READ of that state is a
 * composition: the calm state when either side is missing, the canonical
 * carrier map (the public tracking URLs), the case-insensitive key match
 * (the operator types "UPS" or "ups" — both link), and the raw
 * passthrough for unknown carriers (the number renders, just not
 * linked). Both detail surfaces (the customer Shipping card and the
 * operator console) compose THIS seam — the DASH-ALERT-1 rule: one
 * source, the surfaces can never disagree.
 *
 * The module boundary follows the data (the order-* seam family:
 * order-status, order-money-state, order-timeline) — pure, Prisma-free,
 * importable from server components and tests alike.
 */

/** The tracking read row — a discriminated union (the order-money-state
 *  precedent): the calm state carries NO fields, so nothing can leak
 *  into a row that does not render. `href` is null when the carrier is
 *  unknown (the raw passthrough — the number still renders). */
export type OrderTrackingView =
  | { visible: false }
  | { visible: true; carrierLabel: string; trackingCode: string; href: string | null };

/** The canonical carriers: the label + the public tracking URL template
 *  (the code is encodeURIComponent-substituted). Keyed lowercase — the
 *  match normalizes (trim + toLowerCase), so "UPS", "ups", and " ups "
 *  all compose the same link. The template URLs are the carriers' own
 *  public tracking pages (no affiliate parameters, no third-party
 *  shorteners). */
const TRACKING_CARRIERS: Record<string, { label: string; hrefTemplate: string }> = {
  ups: {
    label: "UPS",
    hrefTemplate: "https://www.ups.com/track?tracknum={code}",
  },
  fedex: {
    label: "FedEx",
    hrefTemplate: "https://www.fedex.com/fedextrack/?trknbr={code}",
  },
  usps: {
    label: "USPS",
    hrefTemplate: "https://tools.usps.com/go/TrackConfirmAction?tLabels={code}",
  },
  dhl: {
    label: "DHL",
    hrefTemplate: "https://www.dhl.com/us-en/home/tracking.html?tracking-id={code}",
  },
};

/**
 * Composes the tracking read row from the order's columns. The calm
 * state: either side null/empty/whitespace → { visible: false } with NO
 * renderable fields (the orderRefundLineView precedent — nothing can
 * leak into a row that does not render). A KNOWN carrier composes the
 * canonical label + the encoded tracking URL; an UNKNOWN carrier passes
 * its raw label through with no link (the parse family's fall-through
 * philosophy: render raw or calm, never guess).
 */
export function orderTrackingView(
  carrier: string | null,
  trackingNumber: string | null,
): OrderTrackingView {
  const carrierKey = carrier?.trim() ?? "";
  const code = trackingNumber?.trim() ?? "";
  if (carrierKey.length === 0 || code.length === 0) {
    return { visible: false };
  }
  const known = TRACKING_CARRIERS[carrierKey.toLowerCase()];
  if (!known) {
    // The raw passthrough: the operator's carrier vocabulary renders
    // verbatim (trimmed), the number renders, no link is composed.
    return { visible: true, carrierLabel: carrierKey, trackingCode: code, href: null };
  }
  return {
    visible: true,
    carrierLabel: known.label,
    trackingCode: code,
    href: known.hrefTemplate.replace("{code}", encodeURIComponent(code)),
  };
}
