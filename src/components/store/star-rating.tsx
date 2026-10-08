import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Star rating — the reference's FLAT form (session-8, STAR-RATE-1): exactly
 * 5 direct Star glyphs in a `flex items-center gap-1` row; floor(rating)
 * carry `fill-amber-400 text-amber-400`, the rest render muted
 * (`text-border`). Measured live on the reference across 4.8/4.5/4.6
 * products: ALWAYS floor(rating) amber + (5 - floor) gray — no rounding,
 * no half-stars. (The prior track+overlay structure with gap-0.5 rounded
 * 4.8 up to 5 amber stars and drifted the row's spacing.)
 *
 * The `sm` size (h-3.5) is kept for API compatibility; the PDP is the only
 * live callsite today (cards use the pinned single-star + number form).
 */
export function StarRating({
  rating,
  size = "sm",
  className = "",
}: {
  rating: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const dimension = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  const filled = Math.floor(Math.max(0, Math.min(5, rating)));
  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      role="img"
      aria-label={`Rated ${rating} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={cn(
            dimension,
            i < filled ? "fill-amber-400 text-amber-400" : "text-border",
          )}
        />
      ))}
    </div>
  );
}
