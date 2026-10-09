"use client";

/**
 * AdminProductFilters — the /admin/products filter bar (search input +
 * category Select + visibility Select + Clear). Mirrors
 * AdminPaymentFilters/AdminOrderFilters (the ADMIN-SEARCH-1 pattern,
 * itself mirroring ShopFilters): select changes and form submits push
 * MERGED query params via router.push, so every filter state is
 * deep-linkable (/admin/products?category=electronics&q=speaker). The
 * input re-syncs from the URL with the adjust-during-render pattern
 * (the repo's convention for URL-driven state — no setState-in-effect).
 *
 * session-27, ADMIN-PRODUCTS-1: the console trifecta's last LIST
 * surface. The category options arrive from the PAGE (the same DB
 * query that feeds the parser's validation set — value slug, label
 * name); the visibility options are the seam's canonical pair (the
 * eye-toggle seam's list-level answer). The pushed URL re-emits params
 * in the CANONICAL order (category, q, visibility) no matter which
 * control fired — the props are the PRE-navigation state, so a Select
 * change would otherwise append its key after the stale values (the
 * session-26 URL-order lesson applied from the start); Clear resets
 * everything (it pushes the bare path). A bad category value never
 * reaches the island: the seam's parser already dropped it (the
 * deep-link renders the unfiltered list, never an error).
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADMIN_PRODUCT_VISIBILITY_OPTIONS } from "@/lib/admin-products";

type CategoryOption = { slug: string; name: string };

type Props = {
  activeQuery: string;
  activeCategory: string;
  activeVisibility: string;
  categories: CategoryOption[];
};

export function AdminProductFilters({
  activeQuery,
  activeCategory,
  activeVisibility,
  categories,
}: Props) {
  const router = useRouter();
  const [q, setQ] = React.useState(activeQuery);

  // Adjust-during-render: keep the local input in sync when the URL's q
  // param changes (deep-links, the Clear button).
  const [prevUrlQ, setPrevUrlQ] = React.useState(activeQuery);
  if (prevUrlQ !== activeQuery) {
    setPrevUrlQ(activeQuery);
    setQ(activeQuery);
  }

  const hasFilters =
    activeCategory !== "all" || activeVisibility !== "all" || !!activeQuery;

  const push = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams();
    if (activeCategory !== "all") params.set("category", activeCategory);
    if (q.trim()) params.set("q", q.trim());
    if (activeVisibility !== "all") params.set("visibility", activeVisibility);
    mutate(params);
    // Canonical param order (category, q, visibility) no matter which
    // control fired: the props are the PRE-navigation state, so a Select
    // change on a query-filtered URL would append its key AFTER the
    // stale q — an unstable deep-link order. Re-emitting in the fixed
    // order keeps every pushed URL deterministic (the session-26
    // canonical re-emission, applied from the start).
    const ordered = new URLSearchParams();
    for (const key of ["category", "q", "visibility"]) {
      const value = params.get(key);
      if (value) ordered.set(key, value);
    }
    const qs = ordered.toString();
    router.push(qs ? `/admin/products?${qs}` : "/admin/products");
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
          placeholder="Search by name or slug..."
          className="pl-9"
          aria-label="Search products"
        />
      </form>

      <Select
        value={activeCategory}
        onValueChange={(v) => {
          push((params) => {
            if (v === "all") params.delete("category");
            else params.set("category", v);
          });
        }}
      >
        <SelectTrigger className="w-[150px]" aria-label="Filter by category">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.slug} value={c.slug}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={activeVisibility}
        onValueChange={(v) => {
          push((params) => {
            if (v === "all") params.delete("visibility");
            else params.set("visibility", v);
          });
        }}
      >
        <SelectTrigger className="w-[130px]" aria-label="Filter by visibility">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {ADMIN_PRODUCT_VISIBILITY_OPTIONS.map((v) => (
            <SelectItem key={v.value} value={v.value}>
              {v.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 h-9"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      )}
    </div>
  );
}
