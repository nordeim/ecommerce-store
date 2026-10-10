"use client";

/**
 * AdminTrackingForm (session-36, ORDER-TRACKING-1, ADR-044) — the order
 * detail's "where's my order" write surface: the operator records the
 * carrier + tracking number on the Shipping card (the compact stock-form
 * anatomy — `pending` disables, `!res.ok` renders the message in the
 * row-island's text-xs destructive pair, success `router.refresh()`).
 *
 * Pre-filled with the current columns so the operator can set OR update
 * (the action's overwrite semantics: a different pair replaces the
 * columns and appends the auditable tracking_added event; the IDENTICAL
 * pair is a no-op). The customer-side read composes the SAME vocabulary
 * through the orderTrackingView seam — the render and the write can
 * never disagree.
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setOrderTrackingAction } from "@/lib/actions/admin";

export function AdminTrackingForm({
  orderId,
  orderNumber,
  carrier,
  trackingNumber,
}: {
  orderId: string;
  orderNumber: string;
  carrier: string | null;
  trackingNumber: string | null;
}) {
  const router = useRouter();
  const [carrierValue, setCarrierValue] = React.useState(carrier ?? "");
  const [trackingValue, setTrackingValue] = React.useState(trackingNumber ?? "");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const save = async () => {
    setPending(true);
    setError(null);
    const res = await setOrderTrackingAction(orderId, carrierValue, trackingValue);
    setPending(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    router.refresh();
  };

  return (
    <div
      className="mt-4 pt-4 border-t border-border/50"
      data-testid="tracking-form"
    >
      <p className="text-sm font-medium mb-2">Tracking</p>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={carrierValue}
          onChange={(e) => setCarrierValue(e.target.value)}
          className="w-36"
          aria-label={`Carrier for ${orderNumber}`}
          placeholder="UPS, FedEx, USPS, DHL…"
          disabled={pending}
        />
        <Input
          value={trackingValue}
          onChange={(e) => setTrackingValue(e.target.value)}
          className="w-48 flex-1 min-w-0"
          aria-label={`Tracking number for ${orderNumber}`}
          placeholder="Tracking number"
          disabled={pending}
        />
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => void save()}
          disabled={pending}
        >
          <Truck className="h-4 w-4" aria-hidden="true" />
          Save tracking
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive mt-1" data-testid="tracking-error">
          {error}
        </p>
      )}
    </div>
  );
}
