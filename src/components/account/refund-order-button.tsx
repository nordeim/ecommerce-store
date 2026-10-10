"use client";

/**
 * RefundOrderButton (session-32, REFUND-ACTION-1, ADR-040) — the order
 * detail's refund control: a two-step inline confirm (the GitHub
 * destructive-action pattern — no dialog dependency, CSP-safe,
 * deterministic in E2E) that calls refundOrderAction.
 *
 * The anatomy mirrors admin-order-row.tsx exactly: `pending` disables,
 * `!res.ok` renders the message in the row-island's text-xs
 * destructive pair (post-interaction only — never in a census load),
 * success renders the calm confirmation + router.refresh(). The
 * resting button carries the ICON-ONLY destructive accent
 * (border-destructive/30 + the RotateCcw glyph — never destructive
 * TEXT: the ~3.9:1 contrast lesson, the DASH-ALERT-1 precedent).
 *
 * The action never writes refund state — the webhook's charge.refunded
 * reflection owns that transition — so even on success the button stays
 * mounted until the webhook lands and revalidatePath re-renders the
 * page with the reflected (ineligible) state.
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refundOrderAction } from "@/lib/actions/admin";

export function RefundOrderButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const confirm = async () => {
    setPending(true);
    setError(null);
    const res = await refundOrderAction(orderId);
    setPending(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setDone(true);
    setConfirming(false);
    router.refresh();
  };

  if (done) {
    return (
      <p className="text-xs text-muted-foreground mt-3" data-testid="refund-feedback">
        Refund initiated for {orderNumber} — the order updates when Stripe confirms.
      </p>
    );
  }

  return (
    <div className="mt-3" data-testid="refund-control">
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/30 rounded-xl"
            onClick={() => void confirm()}
            disabled={pending}
          >
            Confirm refund
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl"
            onClick={() => setConfirming(false)}
            disabled={pending}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="border-destructive/30 rounded-xl"
          onClick={() => setConfirming(true)}
          disabled={pending}
        >
          <RotateCcw className="text-destructive" aria-hidden="true" />
          Refund payment
        </Button>
      )}
      {error && (
        <p className="text-xs text-destructive mt-1" data-testid="refund-error">
          {error}
        </p>
      )}
    </div>
  );
}
