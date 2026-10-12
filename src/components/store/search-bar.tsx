"use client";

/**
 * SearchBar — the header dropdown panel (`border-t border-border` strip with
 * input + Search button). Superset: a typeahead results popover appears under
 * the input while typing (keyboard + click navigates to the PDP).
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "./store-provider";
import { cn } from "@/lib/utils";

type Suggestion = {
  slug: string;
  name: string;
  categoryName: string;
  price: number;
  image: string;
};

export function SearchBar() {
  const { searchOpen, setSearchOpen } = useStore();
  const [query, setQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Session-46 (SEARCH-BEHAVIOR-1): the typed query + the cached
  // suggestions are PRESERVED across close/reopen — measured live on the
  // reference (probe r46a2: type "serum" -> toggle-close -> reopen -> the
  // input STILL CARRIES "serum"). The old reset-on-close block was a
  // session-8-era choice the live reference contradicts; removing it keeps
  // the query in the input and lets the cached popover re-appear on reopen
  // (the superset detail — the reference has no popover to preserve).

  // Focus the input when the panel opens (external system — the DOM).
  React.useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [searchOpen]);

  // Escape closes the panel.
  React.useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, setSearchOpen]);

  // Debounced typeahead (250ms, AbortController per keystroke). Suggestions
  // visibility is DERIVED from the query, so clearing never needs an effect.
  const q = query.trim();
  const showSuggestions = q.length >= 2 && (suggestions.length > 0 || loading);
  React.useEffect(() => {
    if (q.length < 2) return;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=6`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`search ${res.status}`);
        const data = (await res.json()) as { results: Suggestion[] };
        setSuggestions(data.results ?? []);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.error("[SearchBar] typeahead failed", e);
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchOpen(false);
    router.push(`/shop?search=${encodeURIComponent(q)}`);
  };

  if (!searchOpen) return null;

  return (
    // Session-46 (SEARCH-BEHAVIOR-1): the strip's old overflow-hidden (the
    // initial port's slide-in companion) clipped the typeahead popover to a
    // 4px sliver — the superset feature was VISUALLY INVISIBLE since
    // session-8 while the E2E layer stayed green (Playwright's toBeVisible
    // is clipping-blind; the round's VLM verification caught it). The
    // overflow-hidden never served the animation (it clips the element's
    // CONTENT, not the transformed element itself) — removed, the popover
    // renders below the strip unclipped and the slide-in is unchanged.
    <div className="border-t border-border animate-in slide-in-from-top-2 duration-300">
      <div className="max-w-7xl mx-auto px-4 py-3 relative">
        <form className="flex gap-2" onSubmit={submit} role="search">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="flex-1"
            aria-label="Search products"
          />
          <Button type="submit">Search</Button>
        </form>
        {showSuggestions && (
          <div className="absolute left-4 right-4 mt-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50">
            {loading && suggestions.length === 0 && (
              <p className="px-4 py-3 text-sm text-muted-foreground">Searching…</p>
            )}
            {suggestions.map((s) => (
              <button
                key={s.slug}
                type="button"
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent transition-colors"
                onClick={() => {
                  setSearchOpen(false);
                  router.push(`/product/${s.slug}`);
                }}
              >
                <img src={s.image} alt="" className="h-10 w-10 rounded-md object-cover bg-secondary/30" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">{s.name}</span>
                  {/* Reference renders the suggestion's category lowercase
                      ("electronics") even though its badges elsewhere render
                      capitalized — measured live (session-8, SEARCH-CASE-1). */}
                  <span className="block text-xs text-muted-foreground">{s.categoryName.toLowerCase()}</span>
                </span>
                <span className="text-sm font-semibold">${(s.price / 100).toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
