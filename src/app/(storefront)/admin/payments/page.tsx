import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, Search, Webhook } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { AdminPaymentFilters } from "@/components/account/admin-payment-filters";
import { Button } from "@/components/ui/button";
import { resolveStripeConfig } from "@/lib/stripe-config";
import { formatCents } from "@/lib/money";
import {
  buildAdminPaymentWhere,
  parseAdminPaymentFilters,
  resolvePaymentEventOutcome,
} from "@/lib/admin-payments";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · Payments",
};

// Admin payment-ops surface (session-24, PAY-OPS-1, ADR-032; refined
// session-25, PAY-OPS-2, ADR-033; session-26, PAY-OPS-3): the
// StripeEvent log — the webhook backstop's write path (sessions 22/23)
// finally has its read surface. Every event's OUTCOME is derived from DB
// state: a succeeded event resolves to the placed order (deep link) or to
// the refund-needed family (the deterministic failures the webhook
// records + 200s — amount mismatch, stock-short, unusable metadata,
// vanished cart); failed events and ignored types render their own honest
// copy. Session-25: the refund-needed family is a first-class FILTER (the
// operator's most actionable signal) and every row renders its AMOUNT
// beside the outcome ("how much needs refunding?"). Session-26
// (PAY-OPS-3): the `?from=`/`?to=` date-range bounds — the seam validates
// strict YYYY-MM-DD (bad deep-links render the unfiltered list, never an
// error) and composes the `receivedAt` UTC-day-boundary clause with the
// family + q branches. The take stays
// bounded at 100; the count line makes the filtered size visible so
// truncation can never read as "everything".
const TAKE = 100;

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/admin/payments");
  if (!isAdmin(user)) redirect("/");

  const params = await searchParams;
  const filters = parseAdminPaymentFilters(params);

  // The refund-needed family (session-25, PAY-OPS-2a): the seam's
  // "succeeded AND not linked to any placed order" needs the placed-intent
  // set — ONE bounded query (orders holding a Stripe intent). The E2E
  // deep-link test fails if this fetch is ever dropped (every succeeded
  // event would render as refund-needed).
  let placedIntentIds: string[] | undefined;
  if (filters.family === "refund-needed") {
    const placedOrders = await db.order.findMany({
      where: { stripePaymentIntentId: { not: null } },
      select: { stripePaymentIntentId: true },
    });
    placedIntentIds = placedOrders
      .map((o) => o.stripePaymentIntentId)
      .filter((id): id is string => id !== null);
  }

  const where = buildAdminPaymentWhere(filters, placedIntentIds);

  const [events, total] = await Promise.all([
    db.stripeEvent.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      take: TAKE,
    }),
    db.stripeEvent.count({ where }),
  ]);

  // Outcome resolution in ONE query (no N+1): the orders holding any of
  // this page's intent ids, keyed by intent for the row loop.
  const intentIds = [
    ...new Set(events.map((e) => e.paymentIntentId).filter((id): id is string => !!id)),
  ];
  const ordersByIntent = new Map<string, { id: string; number: string }>();
  if (intentIds.length > 0) {
    const orders = await db.order.findMany({
      where: { stripePaymentIntentId: { in: intentIds } },
      select: { id: true, number: true, stripePaymentIntentId: true },
    });
    for (const o of orders) {
      if (o.stripePaymentIntentId) ordersByIntent.set(o.stripePaymentIntentId, { id: o.id, number: o.number });
    }
  }
  const orderByIntent = (intentId: string) => {
    const o = ordersByIntent.get(intentId);
    return o ? { orderId: o.id, orderNumber: o.number } : undefined;
  };

  // The configuration status is operator context (admin-only surface —
  // the R10-2 customer-copy rule does not apply here): demo mode means
  // the checkout renders the reference-parity flow and the events below
  // are fixture data.
  const stripeConfig = resolveStripeConfig(process.env);

  const countLabel =
    total > TAKE
      ? `${TAKE}+ of ${total} payment events`
      : `${total} ${total === 1 ? "payment event" : "payment events"}`;

  return (
    <div className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button asChild variant="ghost" size="sm" className="rounded-xl">
            <Link href="/admin">← Admin</Link>
          </Button>
          <h1 className="text-3xl font-bold">Payments</h1>
        </div>

        <div
          className="flex items-center gap-2 mb-6 p-4 bg-secondary/40 rounded-xl text-sm text-muted-foreground"
          role="status"
        >
          <Webhook className="h-4 w-4 shrink-0" />
          {stripeConfig.serverConfigured
            ? "Stripe is configured — live payment events from the webhook appear below."
            : "Stripe is in demo mode — the checkout renders the demo flow. Events below are fixture data."}
        </div>

        <AdminPaymentFilters
          activeFamily={filters.family ?? "all"}
          activeQuery={filters.q ?? ""}
          activeFrom={filters.from ?? ""}
          activeTo={filters.to ?? ""}
        />

        <p className="text-sm text-muted-foreground mb-4">{countLabel}</p>

        {/* A11Y-HEADING-1 (session-25): the sr-only h2 labels the list
            region so the page's heading order is h1 → h2 → (empty-state h3 /
            the footer's h3 columns) — the console LIST family's
            best-practice heading-order observation resolved. */}
        <h2 className="sr-only">Payment event list</h2>

        {events.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm">
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Search className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No payment events match your filters</h3>
              <p className="text-muted-foreground mb-4">
                Try a different event family, payment intent, event id, or date range.
              </p>
              <Button asChild>
                <Link href="/admin/payments">Clear all filters</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm">
            <div className="p-6 pt-0">
              <div className="flex flex-col gap-3">
                {events.map((e) => {
                  const outcome = resolvePaymentEventOutcome(
                    { type: e.type, paymentIntentId: e.paymentIntentId },
                    orderByIntent,
                  );
                  return (
                    <div
                      key={e.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/50"
                    >
                      <div className="min-w-0">
                        <p className="font-medium flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                          {e.type}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
                          {e.eventId}
                          {e.paymentIntentId ? ` · ${e.paymentIntentId}` : ""}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {e.receivedAt.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        {/* PAY-OPS-2b (session-25): the magnitude beside the
                            outcome — the operator's first question ("how much
                            needs refunding?"). Null for payload shapes that
                            carry no amount + pre-session-25 rows. */}
                        {e.amount != null && (
                          <p className="text-sm font-semibold mb-0.5">{formatCents(e.amount)}</p>
                        )}
                        {outcome.kind === "placed" ? (
                          <Link
                            href={`/admin/orders/${outcome.orderId}`}
                            className="text-sm font-medium text-primary hover:underline transition-colors"
                          >
                            {outcome.orderNumber} placed
                          </Link>
                        ) : outcome.kind === "refund-needed" ? (
                          <p className="text-sm font-medium text-destructive">
                            No order — refund via Stripe dashboard
                          </p>
                        ) : outcome.kind === "failed" ? (
                          <p className="text-sm font-medium text-muted-foreground">Payment failed</p>
                        ) : (
                          <p className="text-sm font-medium text-muted-foreground">Ignored</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
