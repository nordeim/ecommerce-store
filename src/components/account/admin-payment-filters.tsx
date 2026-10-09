"use client";

/**
 * AdminPaymentFilters — the /admin/payments filter bar (search input +
 * event-family Select + Clear). Mirrors AdminOrderFilters (the
 * ADMIN-SEARCH-1 pattern, itself mirroring ShopFilters): select changes
 * and form submits push MERGED query params via router.push, so every
 * filter state is deep-linkable (/admin/payments?family=succeeded&q=pi_).
 * The input re-syncs from the URL with the adjust-during-render pattern
 * (the repo's convention for URL-driven state — no setState-in-effect).
 *
 * PAY-OPS-3 (session-26): two `<Input type="date">` bounds ("From date"
 * / "To date") join the bar — an operator triaging refund-needed
 * payments narrows to "the events that arrived in THIS window". The
 * inputs are URL-controlled (the server re-renders the value from the
 * parsed `?from=`/`?to=` on every navigation — the adjust-during-render
 * contract for free, same as the family Select); a change pushes MERGED
 * params so family/q/from/to always compose, and Clear resets
 * everything (it pushes the bare path). A bad bound never reaches the
 * island: the seam's parser already dropped it (the deep-link renders
 * the unfiltered list, never an error).
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADMIN_PAYMENT_FAMILY_OPTIONS } from "@/lib/admin-payments";

type Props = {
  activeFamily: string;
  activeQuery: string;
  /** The URL's validated `?from=`/`?to=` bounds ("" when inactive). */
  activeFrom: string;
  activeTo: string;
};

export function AdminPaymentFilters({ activeFamily, activeQuery, activeFrom, activeTo }: Props) {
  const router = useRouter();
  const [q, setQ] = React.useState(activeQuery);

  // Adjust-during-render: keep the local input in sync when the URL's q
  // param changes (deep-links, the Clear button, chip removals).
  const [prevUrlQ, setPrevUrlQ] = React.useState(activeQuery);
  if (prevUrlQ !== activeQuery) {
    setPrevUrlQ(activeQuery);
    setQ(activeQuery);
  }

  const hasFilters = activeFamily !== "all" || !!activeQuery || !!activeFrom || !!activeTo;

  const push = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams();
    if (activeFamily !== "all") params.set("family", activeFamily);
    if (q.trim()) params.set("q", q.trim());
    if (activeFrom) params.set("from", activeFrom);
    if (activeTo) params.set("to", activeTo);
    mutate(params);
    // Canonical param order (family, q, from, to) no matter which control
    // fired: the props are the PRE-navigation state, so a Select change
    // on a date-filtered URL appends family AFTER the stale from/to —
    // an unstable deep-link order (?from=…&family=…). Re-emitting in the
    // fixed order keeps every pushed URL deterministic.
    const ordered = new URLSearchParams();
    for (const key of ["family", "q", "from", "to"]) {
      const value = params.get(key);
      if (value) ordered.set(key, value);
    }
    const qs = ordered.toString();
    router.push(qs ? `/admin/payments?${qs}` : "/admin/payments");
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
          placeholder="Search by payment intent or event id..."
          className="pl-9"
          aria-label="Search payment events"
        />
      </form>

      <Select
        value={activeFamily}
        onValueChange={(v) => {
          push((params) => {
            if (v === "all") params.delete("family");
            else params.set("family", v);
          });
        }}
      >
        <SelectTrigger className="w-[150px]" aria-label="Filter by family">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Families</SelectItem>
          {ADMIN_PAYMENT_FAMILY_OPTIONS.map((f) => (
            <SelectItem key={f.value} value={f.value}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* PAY-OPS-3 (session-26): the date-range bounds — URL-controlled
          (value = the parsed ?from=/?to=, re-rendered by the server on
          every push), so they compose with family/q with no local state
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
          onClick={() => router.push("/admin/payments")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 h-9"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      )}
    </div>
  );
}
