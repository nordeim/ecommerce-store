import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Star rating — amber-400 filled stars matching the reference (h-4 on PDP,
 * h-3.5 on cards). Fractions round to half-stars via partial fill overlap.
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
  const clamped = Math.max(0, Math.min(5, rating));
  const full = Math.floor(clamped);
  const fraction = clamped - full;
  return (
    <div className={`flex items-center gap-0.5 ${className}`} aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="relative inline-flex">
          <Star className={`${dimension} text-border`} />
          {i < full && (
            <Star className={`${dimension} fill-amber-400 text-amber-400 absolute inset-0`} />
          )}
          {i === full && fraction >= 0.25 && fraction < 0.75 && (
            <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
              <StarHalf className={`${dimension} fill-amber-400 text-amber-400`} />
            </span>
          )}
          {i === full && fraction >= 0.75 && (
            <Star className={`${dimension} fill-amber-400 text-amber-400 absolute inset-0`} />
          )}
        </span>
      ))}
    </div>
  );
}
