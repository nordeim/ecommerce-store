"use client";

/**
 * SearchBar — the header dropdown panel (`border-t border-border` strip with
 * input + Search button + X close button). Superset: a typeahead results
 * popover appears under the input while typing (keyboard + click navigates
 * to the PDP).
 *
 * Session-58 (SEARCH-PANEL-GEO-1): the form's three-child contract + the
 * enter/exit animations, measured live on the reference (the probes
 * scripts/search-panel-probe-r58[a0/a/a2/a3/a4/a5].mjs): (1) the Search
 * button ships the shadcn SM size (h-8 px-3 text-xs — 64x32, 12px/500);
 * (2) the form carries a THIRD control — the 36x36 ghost lucide-x that
 * closes the panel with the typed query SURVIVING the close/reopen (the
 * 876+8+64+8+36=992 form arithmetic only closes with all three children);
 * (3) the ENTER is a pure ~300ms opacity fade with NO transform (the
 * reference's framer-motion inline fade; the old slide-in-from-top-2 was a
 * session-1 port liberty never reference-measured); (4) the EXIT fades +
 * collapses the height over ~300ms before unmounting (the reference: h 61 →
 * 0 with opacity 1 → 0, both curves tracking; the strip's overflow-hidden
 * is the collapse's clipper — carried here EXIT-ONLY so the superset
 * popover stays unclipped while open, the session-46 contract).
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
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
  const stripRef = React.useRef<HTMLDivElement>(null);

  // Session-58 (SEARCH-PANEL-GEO-1) — the exit-animation state machine.
  // The reference's close is a ~300ms fade + height COLLAPSE (measured live:
  // h 61 → 51 → 27 → 11 → 4 → 1 → unmount; opacity tracking the same curve)
  // — NOT an instant unmount. The `closing` state keeps the strip mounted
  // one phase longer while the exit effect drives the collapse (the
  // adjust-state-during-render pattern — STATE, not a ref — the StoreProvider
  // precedent; the React Compiler refs rule forbids ref reads during render).
  const [closing, setClosing] = React.useState(false);
  const [lastOpen, setLastOpen] = React.useState(searchOpen);
  if (searchOpen !== lastOpen) {
    setLastOpen(searchOpen);
    // The flip to closed enters the exit phase; the flip to open resets it
    // (and the exit effect's cleanup drops any lingering inline styles —
    // the fast-toggle case re-enters through the enter animation cleanly).
    setClosing(!searchOpen);
  }

  // The exit driver: lock the measured height, clip, then collapse + fade
  // over 300ms `ease` (the reference's measured curve family); unmount after
  // the animation completes (~330ms — the unmount measured at ~330ms on the
  // reference). Runs only while `closing` is true and the strip is mounted.
  React.useEffect(() => {
    if (!closing) return;
    const el = stripRef.current;
    if (!el) return;
    const h = el.offsetHeight;
    el.style.height = `${h}px`;
    el.style.overflow = "hidden"; // the exit-only clipper (REGISTER: the reference carries it at rest too; the clone's superset popover needs it OFF while open — the session-46 fix)
    void el.offsetHeight; // force the reflow so the transition runs from the locked height
    el.style.transition = "height 0.3s ease, opacity 0.3s ease";
    el.style.height = "0px";
    el.style.opacity = "0";
    const t = setTimeout(() => setClosing(false), 330);
    return () => {
      clearTimeout(t);
      // The fast-toggle reopen (searchOpen flips true mid-exit): drop the
      // lingering exit styles so the reopened strip re-enters through the
      // enter animation cleanly (the class removal + re-add replays the
      // CSS keyframes). On the normal completion path the strip unmounts
      // immediately after — the reset is harmless.
      el.style.height = "";
      el.style.overflow = "";
      el.style.transition = "";
      el.style.opacity = "";
    };
  }, [closing]);

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

  if (!searchOpen && !closing) return null;
  // The exit phase renders the strip WITHOUT the enter animation class (the
  // inline-style collapse owns the visuals) and hides the popover (the
  // reference has no popover; the exit is the reference's own surface).
  const isExit = !searchOpen && closing;

  return (
    // Session-46 (SEARCH-BEHAVIOR-1): the strip's old overflow-hidden (the
    // initial port's slide-in companion) clipped the typeahead popover to a
    // 4px sliver — the superset feature was VISUALLY INVISIBLE since
    // session-8 while the E2E layer stayed green (Playwright's toBeVisible
    // is clipping-blind; the round's VLM verification caught it). The
    // overflow-hidden never served the animation (it clips the element's
    // CONTENT, not the transformed element itself) — removed, the popover
    // renders below the strip unclipped and the slide-in is unchanged.
    // Session-58 (SEARCH-PANEL-GEO-1): the ENTER is now the reference's pure
    // opacity fade (tw-animate-css fade-in = --tw-enter-opacity: 0, NO
    // translate — the measured reference fades with transform none
    // throughout); the EXIT's overflow-hidden lands via the inline style
    // above, exit-only, so the open-state popover stays unclipped.
    <div
      ref={stripRef}
      className={cn(
        "border-t border-border",
        !isExit && "animate-in fade-in duration-300",
      )}
    >
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
          {/* Session-58: the reference's sm form (measured 64x32, 12px/500 —
              the h-8 px-3 text-xs tokens; the default-size 79x36 was the
              session-1 port liberty). */}
          <Button type="submit" size="sm">
            Search
          </Button>
          {/* Session-58: the reference's THIRD form child (measured live —
              the 44px form-arithmetic gap the r58a2 enumeration closed): a
              36x36 ghost lucide-x that closes the panel, the typed query
              surviving the close/reopen. The aria-label is the clone's a11y
              superset (the reference carries none — the headericon-family
              discipline). */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close search"
            onClick={() => setSearchOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </form>
        {showSuggestions && !isExit && (
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
