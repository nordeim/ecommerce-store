import { describe, expect, it } from "vitest";
// Session-35 (CUSTOMER-TIMELINE-1): the customer-safe order-timeline seam —
// the operator→customer vocabulary mapping. The OrderEvent rows carry
// operator attribution in their notes ("processing → delivered by
// admin@luxestore.com" — updateOrderStatusAction's format) and operator
// vocabulary ("Refunded $79.99 via Stripe"); the customer timeline renders
// the STORY through a customer-safe label set and NEVER the raw note
// (R10-2: no operator vocabulary in the customer DOM). The row type has no
// note field — the leak is structurally impossible, and this suite pins
// that property. Pure module — no Prisma, no React (the order-* seam
// family: order-status, order-money-state, order-view-token).
import {
  customerOrderTimeline,
  formatTimelineDate,
} from "./order-timeline";

/** The structural input shape (the Prisma OrderEvent subset the seam reads). */
const ev = (
  id: string,
  type: string,
  note: string | null,
  createdAt: Date,
) => ({ id, type, note, createdAt });

describe("customerOrderTimeline — the customer-safe vocabulary", () => {
  it("placed renders 'Order placed'", () => {
    const rows = customerOrderTimeline([ev("e1", "placed", "Seeded demo order", new Date())]);
    expect(rows).toHaveLength(1);
    expect(rows[0].label).toBe("Order placed");
  });

  it("status_changed parses the action's note and composes STATUS_LABELS: 'Status updated to Delivered'", () => {
    const rows = customerOrderTimeline([
      ev("e1", "status_changed", "in_transit → delivered by admin@luxestore.com", new Date()),
    ]);
    expect(rows[0].label).toBe("Status updated to Delivered");
  });

  it("status_changed composes the in_transit label too ('Status updated to In Transit')", () => {
    const rows = customerOrderTimeline([
      ev("e1", "status_changed", "processing → in_transit by admin@luxestore.com", new Date()),
    ]);
    expect(rows[0].label).toBe("Status updated to In Transit");
  });

  it("an unknown new status renders the raw slug (the parse family's raw passthrough)", () => {
    const rows = customerOrderTimeline([
      ev("e1", "status_changed", "processing → weird_state by admin@luxestore.com", new Date()),
    ]);
    expect(rows[0].label).toBe("Status updated to weird_state");
  });

  it("a malformed note (no arrow) falls through to the calm 'Status updated'", () => {
    const rows = customerOrderTimeline([
      ev("e1", "status_changed", "something went sideways", new Date()),
    ]);
    expect(rows[0].label).toBe("Status updated");
  });

  it("a null note falls through to the calm 'Status updated'", () => {
    const rows = customerOrderTimeline([
      ev("e1", "status_changed", null, new Date()),
    ]);
    expect(rows[0].label).toBe("Status updated");
  });

  it("payment_succeeded renders 'Payment received' (session-22's wording)", () => {
    const rows = customerOrderTimeline([
      ev("e1", "payment_succeeded", null, new Date()),
    ]);
    expect(rows[0].label).toBe("Payment received");
  });

  it("payment_failed renders 'Payment failed'", () => {
    const rows = customerOrderTimeline([
      ev("e1", "payment_failed", null, new Date()),
    ]);
    expect(rows[0].label).toBe("Payment failed");
  });

  it("payment_refunded renders 'Payment refunded'", () => {
    const rows = customerOrderTimeline([
      ev("e1", "payment_refunded", "Refunded $79.99 via Stripe", new Date()),
    ]);
    expect(rows[0].label).toBe("Payment refunded");
  });

  // Session-36 (ORDER-TRACKING-1): the tracking_added event the admin
  // action writes when the operator records carrier + number — the
  // customer vocabulary is "Tracking added"; the note (which carries the
  // carrier/number + operator attribution) is structurally absent from
  // the row, exactly like every other type.
  it("tracking_added renders 'Tracking added' (session-36, ORDER-TRACKING-1)", () => {
    const rows = customerOrderTimeline([
      ev(
        "e1",
        "tracking_added",
        "UPS 1Z999AA10123456784 set by admin@luxestore.com",
        new Date(),
      ),
    ]);
    expect(rows[0].label).toBe("Tracking added");
  });

  it("an unknown event type renders the raw type (the paymentEventLabel raw-passthrough precedent)", () => {
    const rows = customerOrderTimeline([
      ev("e1", "note_added", "an operator's freeform note", new Date()),
    ]);
    expect(rows[0].label).toBe("note_added");
  });
});

describe("customerOrderTimeline — the row contract", () => {
  it("rows sort by createdAt ascending regardless of input order (the timeline reads oldest-first)", () => {
    const t0 = new Date("2026-03-28T15:04:05Z");
    const t1 = new Date("2026-03-30T09:00:00Z");
    const t2 = new Date("2026-04-02T11:30:00Z");
    const rows = customerOrderTimeline([
      ev("e3", "status_changed", "in_transit → delivered by admin@luxestore.com", t2),
      ev("e1", "placed", "Seeded demo order", t0),
      ev("e2", "status_changed", "processing → in_transit by admin@luxestore.com", t1),
    ]);
    expect(rows.map((r) => r.key)).toEqual(["e1", "e2", "e3"]);
    expect(rows.map((r) => r.label)).toEqual([
      "Order placed",
      "Status updated to In Transit",
      "Status updated to Delivered",
    ]);
  });

  it("the row carries the event's key (the React key) and instant (the rendered timestamp)", () => {
    const at = new Date("2026-02-22T14:03:30Z");
    const rows = customerOrderTimeline([ev("evt-x", "payment_refunded", "Refunded $79.99 via Stripe", at)]);
    expect(rows[0].key).toBe("evt-x");
    expect(rows[0].type).toBe("payment_refunded");
    expect(rows[0].at).toBe(at);
  });

  it("the operator note is STRUCTURALLY absent — the serialized rows carry no note fragment (R10-2)", () => {
    const rows = customerOrderTimeline([
      ev("e1", "status_changed", "processing → cancelled by admin@luxestore.com", new Date()),
      ev("e2", "payment_refunded", "Refunded $79.99 via Stripe", new Date()),
      ev("e3", "placed", "Seeded demo order", new Date()),
    ]);
    const serialized = JSON.stringify(rows);
    expect(serialized).not.toContain("admin@luxestore.com");
    expect(serialized).not.toContain("Seeded demo order");
    expect(serialized).not.toContain("Refunded");
  });

  it("the empty set renders the calm empty timeline (the admin's 'No events' surface family)", () => {
    expect(customerOrderTimeline([])).toEqual([]);
  });
});

describe("formatTimelineDate — the shared event timestamp", () => {
  // NOT pinned to a specific calendar day or clock time: toLocaleString
  // renders the runner's local time for a UTC instant (the formatOrderDate
  // precedent — the worker TZ is not a contract). The SHAPE is the pin:
  // the admin detail's exact option set ("Mar 28, 2026, 3:04 PM").
  it("renders the admin detail's en-US shape: 'Mon D, YYYY, H:MM AM/PM'", () => {
    expect(formatTimelineDate("2026-03-28T15:04:05Z")).toMatch(
      /^[A-Z][a-z]{2} \d{1,2}, \d{4}, \d{1,2}:\d{2} (AM|PM)$/,
    );
  });

  it("composes the same format the admin detail renders (the single-source extraction — drift is impossible)", () => {
    const iso = "2026-02-22T14:03:30Z";
    expect(formatTimelineDate(iso)).toBe(
      new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    );
  });
});
