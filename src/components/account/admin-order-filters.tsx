"use client";

/**
 * AdminOrderFilters — the /admin/orders filter bar (search input + status
 * Select + Clear). Mirrors ShopFilters (the storefront's URL-deep-linkable
 * pattern): select changes and form submits push MERGED query params via
 * router.push, so every filter state is deep-linkable
 * (/admin/orders?status=delivered&q=ORD-2026-001). The input re-syncs from
 * the URL with the adjust-during-render pattern (the repo's convention for
 * URL-driven state — no setState-in-effect).
 *
 * ORDER-WINDOW-1 (session-41, ADR-048): two `<Input type="date">` bounds
 * ("From date" / "To date") join the bar — the PAY-OPS-3 treatment
 * (session-26) applied to the console's fulfillment surface: an operator
 * triaging by time (end-of-day reconciliation, "the orders placed this
 * week") and the take-100 ceiling's reach-past tool. The inputs are
 * URL-controlled (the server re-renders the value from the parsed
 * ?from=/?to= on every navigation — the adjust-during-render contract for
 * free, same as the status Select); a change pushes MERGED params so
 * status/q/from/to always compose, and Clear resets everything (it pushes
 * the bare path). A bad bound never reaches the island: the seam's parser
 * already dropped it (the deep-link renders the unfiltered list, never an
 * error).
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADMIN_ORDER_STATUS_OPTIONS } from "@/lib/admin-orders";

type Props = {
  activeStatus: string;
  activeQuery: string;
  /** The URL's validated `?from=`/`?to=` bounds ("" when inactive). */
  activeFrom: string;
  activeTo: string;
};

export function AdminOrderFilters({ activeStatus, activeQuery, activeFrom, activeTo }: Props) {
  const router = useRouter();
  const [q, setQ] = React.useState(activeQuery);

  // Adjust-during-render: keep the local input in sync when the URL's q
  // param changes (deep-links, the Clear button, chip removals).
  const [prevUrlQ, setPrevUrlQ] = React.useState(activeQuery);
  if (prevUrlQ !== activeQuery) {
    setPrevUrlQ(activeQuery);
    setQ(activeQuery);
  }

  const hasFilters = activeStatus !== "all" || !!activeQuery || !!activeFrom || !!activeTo;

  const push = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams();
    if (activeStatus !== "all") params.set("status", activeStatus);
    if (q.trim()) params.set("q", q.trim());
    if (activeFrom) params.set("from", activeFrom);
    if (activeTo) params.set("to", activeTo);
    mutate(params);
    // Canonical param order (status, q, from, to) no matter which control
    // fired: the props are the PRE-navigation state, so a Select change
    // on a date-filtered URL appends status AFTER the stale from/to —
    // an unstable deep-link order (?from=…&status=…). Re-emitting in the
    // fixed order keeps every pushed URL deterministic (the session-26
    // canonical re-emission, the AdminPaymentFilters precedent).
    const ordered = new URLSearchParams();
    for (const key of ["status", "q", "from", "to"]) {
      const value = params.get(key);
      if (value) ordered.set(key, value);
    }
    const qs = ordered.toString();
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

      {/* ORDER-WINDOW-1 (session-41): the date-range bounds — URL-controlled
          (value = the parsed ?from=/?to=, re-rendered by the server on
          every push), so they compose with status/q with no local state
          to desync. Empty string is the controlled-input "no bound"
          value; the browser's date picker only emits valid YYYY-MM-DD. */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarRange className="h-4 w-4 shrink-0" aria-hidden />
        <Input
          type="date"
          value={activeFrom}
          aria-label="From date"
          className="w-[150px]"
          onChange={(e) => {
            const v = e.target.value;
            push((params) => {
              if (v) params.set("from", v);
              else params.delete("from");
            });
          }}
        />
        <span aria-hidden className="select-none">
          –
        </span>
        <Input
          type="date"
          value={activeTo}
          aria-label="To date"
          className="w-[150px]"
          onChange={(e) => {
            const v = e.target.value;
            push((params) => {
              if (v) params.set("to", v);
              else params.delete("to");
            });
          }}
        />
      </div>

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
