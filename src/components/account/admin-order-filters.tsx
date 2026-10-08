"use client";

/**
 * AdminOrderFilters — the /admin/orders filter bar (search input + status
 * Select + Clear). Mirrors ShopFilters (the storefront's URL-deep-linkable
 * pattern): select changes and form submits push MERGED query params via
 * router.push, so every filter state is deep-linkable
 * (/admin/orders?status=delivered&q=ORD-2026-001). The input re-syncs from
 * the URL with the adjust-during-render pattern (the repo's convention for
 * URL-driven state — no setState-in-effect).
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADMIN_ORDER_STATUS_OPTIONS } from "@/lib/admin-orders";

type Props = {
  activeStatus: string;
  activeQuery: string;
};

export function AdminOrderFilters({ activeStatus, activeQuery }: Props) {
  const router = useRouter();
  const [q, setQ] = React.useState(activeQuery);

  // Adjust-during-render: keep the local input in sync when the URL's q
  // param changes (deep-links, the Clear button, chip removals).
  const [prevUrlQ, setPrevUrlQ] = React.useState(activeQuery);
  if (prevUrlQ !== activeQuery) {
    setPrevUrlQ(activeQuery);
    setQ(activeQuery);
  }

  const hasFilters = activeStatus !== "all" || !!activeQuery;

  const push = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams();
    if (activeStatus !== "all") params.set("status", activeStatus);
    if (q.trim()) params.set("q", q.trim());
    mutate(params);
    const qs = params.toString();
    router.push(qs ? `/admin/orders?${qs}` : "/admin/orders");
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-card rounded-2xl border border-border/50">
      <form
        className="relative flex-1 min-w-[200px]"
        onSubmit={(e) => {
          e.preventDefault();
          push(() => {});
        }}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by order number or email..."
          className="pl-9"
          aria-label="Search orders"
        />
      </form>

      <Select
        value={activeStatus}
        onValueChange={(v) => {
          push((params) => {
            if (v === "all") params.delete("status");
            else params.set("status", v);
          });
        }}
      >
        <SelectTrigger className="w-[150px]" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {ADMIN_ORDER_STATUS_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push("/admin/orders")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 h-9"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      )}
    </div>
  );
}
