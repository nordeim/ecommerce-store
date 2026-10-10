/**
 * The customer-safe order timeline (session-35, CUSTOMER-TIMELINE-1,
 * ADR-043) — the operator→customer vocabulary mapping.
 *
 * WHY THIS SEAM EXISTS: the OrderEvent rows carry the order's story, but
 * their NOTES are operator territory — `status_changed` embeds actor
 * attribution ("processing → delivered by admin@luxestore.com", the
 * updateOrderStatusAction format) and the refund note carries operator
 * vocabulary ("Refunded $79.99 via Stripe"). The operator console renders
 * the notes (ADR-015); the customer NEVER does (R10-2: no operator
 * vocabulary in the customer DOM). This seam maps each event to a
 * customer-safe label and a row shape with NO note field — the leak is
 * structurally impossible, not merely filtered.
 *
 * The module boundary follows the data (the order-* seam family:
 * order-status, order-money-state, order-view-token) — pure, Prisma-free,
 * importable from server components and tests alike.
 */
import { STATUS_LABELS } from "./order-status";

/** The row the customer timeline renders — key (React), type (the icon
 *  vocabulary), label (the customer-safe copy), at (the instant). */
export interface CustomerTimelineRow {
  key: string;
  type: string;
  label: string;
  at: Date;
}

/** The OrderEvent subset the seam reads (the Prisma row's shape). */
export interface TimelineEventInput {
  id: string;
  type: string;
  note: string | null;
  createdAt: Date;
}

/**
 * The updateOrderStatusAction note format: "{old} → {new} by {actor}".
 * Extracts the NEW status slug; returns null when the note doesn't match
 * (null note, no arrow, empty segment) — the caller falls through to the
 * calm generic label (the parse family's fall-through philosophy: render
 * raw or calm, never guess).
 */
function parseStatusTransition(note: string | null): string | null {
  if (!note) return null;
  const afterArrow = note.split("→")[1];
  if (!afterArrow) return null;
  const next = afterArrow.split(/\s+by\s+/)[0].trim();
  return next.length > 0 ? next : null;
}

/** The customer-safe label for one event — the vocabulary map. */
function customerEventLabel(event: TimelineEventInput): string {
  switch (event.type) {
    case "placed":
      return "Order placed";
    case "status_changed": {
      // The new status composes the session-34 STATUS_LABELS seam — the
      // timeline's words are the SAME words the pill and history rows
      // render (single source; an unmeasured status renders raw).
      const next = parseStatusTransition(event.note);
      return next ? `Status updated to ${STATUS_LABELS[next] ?? next}` : "Status updated";
    }
    case "payment_succeeded":
      // Session-22's paid wording — the confirmation's money line says
      // "Payment received — charged by Stripe."; the timeline's compact
      // form keeps the first two words.
      return "Payment received";
    case "payment_failed":
      return "Payment failed";
    case "payment_refunded":
      return "Payment refunded";
    case "tracking_added":
      // Session-36 (ORDER-TRACKING-1): the admin tracking action's event —
      // the customer vocabulary; the note ("«carrier» «number» set by
      // «actor»") is operator territory and structurally absent from the
      // row type. The tracking LINE (the carrier + number + track link)
      // renders from the order's columns via the order-tracking seam.
      return "Tracking added";
    default:
      // The paymentEventLabel raw-passthrough precedent: an unknown type
      // renders itself — never guessed, never swallowed.
      return event.type;
  }
}

/**
 * Maps OrderEvent rows to the customer-safe timeline, oldest-first (the
 * story reads chronologically — the admin detail's ordering). The input
 * array is never mutated.
 */
export function customerOrderTimeline(events: TimelineEventInput[]): CustomerTimelineRow[] {
  return events
    .slice()
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((event) => ({
      key: event.id,
      type: event.type,
      label: customerEventLabel(event),
      at: event.createdAt,
    }));
}

/**
 * The timeline timestamp — the admin detail's exact en-US format ("Mar
 * 28, 2026, 3:04 PM"), extracted so the customer card and the operator
 * detail render ONE source (the drift-proofing rule). NOT unit-pinned to
 * a calendar day or clock time (a fixed UTC instant renders different
 * local values under different runner TZs — the formatOrderDate
 * precedent; the E2E pins the TZ-safe date part via the consumers).
 */
export function formatTimelineDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
