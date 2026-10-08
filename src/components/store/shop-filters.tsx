"use client";

/**
 * ShopFilters — the PLP filter bar (search input + category/price/sort
 * selects + Clear). Navigates via router.push with merged query params so
 * every filter state is deep-linkable, matching the reference's URL shape
 * (/shop?category=…&search=…&sort=…&price=…).
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  categories: { slug: string; name: string }[];
  activeCategory: string;
  activePrice: string;
  activeSort: string;
  activeSearch: string;
};

const PRICE_OPTIONS = [
  { value: "all", label: "All Prices" },
  { value: "under-50", label: "Under $50" },
  { value: "50-100", label: "$50 - $100" },
  { value: "100-200", label: "$100 - $200" },
  { value: "over-200", label: "Over $200" },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "Newest" },
];

export function ShopFilters({ categories, activeCategory, activePrice, activeSort, activeSearch }: Props) {
  const router = useRouter();
  const [search, setSearch] = React.useState(activeSearch);

  // Adjust-during-render: keep the local input in sync when the URL's search
  // param changes (avoids setState-in-effect cascades).
  const [prevUrlSearch, setPrevUrlSearch] = React.useState(activeSearch);
  if (prevUrlSearch !== activeSearch) {
    setPrevUrlSearch(activeSearch);
    setSearch(activeSearch);
  }

  const hasFilters = activeCategory !== "all" || activePrice !== "all" || activeSort !== "featured" || !!activeSearch;

  const push = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams();
    if (activeCategory !== "all") params.set("category", activeCategory);
    if (search.trim()) params.set("search", search.trim());
    if (activePrice !== "all") params.set("price", activePrice);
    if (activeSort !== "featured") params.set("sort", activeSort);
    mutate(params);
    const qs = params.toString();
    router.push(qs ? `/shop?${qs}` : "/shop");
  };

  const setParam = (key: string, value: string) => {
    push((params) => {
      if (value === "all" || value === "featured") params.delete(key);
      else params.set(key, value);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8 p-4 bg-card rounded-2xl border border-border/50">
      <form
        className="relative flex-1 min-w-[200px]"
        onSubmit={(e) => {
          e.preventDefault();
          push(() => {});
        }}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="pl-9"
          aria-label="Search products"
        />
      </form>

      <Select value={activeCategory} onValueChange={(v) => setParam("category", v)}>
        <SelectTrigger className="w-[160px]" aria-label="Filter by category">
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

      <Select value={activePrice} onValueChange={(v) => setParam("price", v)}>
        <SelectTrigger className="w-[150px]" aria-label="Filter by price">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRICE_OPTIONS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={activeSort} onValueChange={(v) => setParam("sort", v)}>
        {/* w-[150px] (session-9, SORT-W-1): the reference's sort trigger
            class ends w-[150px] (measured live, computed 150px) — the clone
            had shipped w-[170px]. */}
        <SelectTrigger className="w-[150px]" aria-label="Sort products">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push("/shop")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 h-9"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      )}
    </div>
  );
}
