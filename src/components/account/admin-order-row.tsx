"use client";

/**
 * AdminOrderRow — order row with an inline status Select that calls the
 * updateOrderStatusAction server action (admin-gated server-side). The
 * order number links to the detail page (session-7, ADMIN-DETAIL-1).
 */
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateOrderStatusAction } from "@/lib/actions/admin";
import { formatCents } from "@/lib/money";

const STATUSES = [
  { value: "processing", label: "Processing" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function AdminOrderRow({
  order,
}: {
  order: {
    id: string;
    number: string;
    email: string;
    status: string;
    total: number;
    itemCount: number;
    placedAt: string;
  };
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const change = async (status: string) => {
    setPending(true);
    setError(null);
    const res = await updateOrderStatusAction(order.id, status);
    setPending(false);
    if (!res.ok) setError(res.error.message);
    else router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border/50">
      <div>
        <p className="font-medium">
          <Link href={`/admin/orders/${order.id}`} className="hover:text-primary transition-colors">
            {order.number}
          </Link>
        </p>
        <p className="text-sm text-muted-foreground">
          {order.email} · {order.itemCount} items ·{" "}
          {new Date(order.placedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
      <div className="flex items-center gap-4">
        <Badge variant="secondary" className="rounded-full capitalize">
          {order.status.replace("_", " ")}
        </Badge>
        <span className="font-semibold">{formatCents(order.total)}</span>
        <Select value={order.status} onValueChange={(v) => void change(v)} disabled={pending}>
          <SelectTrigger className="w-[150px]" aria-label={`Change status for ${order.number}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
