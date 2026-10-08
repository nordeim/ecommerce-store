"use client";

/**
 * HeroCarousel — 3 slides with 5s auto-advance, prev/next buttons, dot
 * pagination. Structure/classes are a byte-parity port of the reference.
 *
 * Tailwind v4 trap-log note: the overlay uses the arbitrary
 * `bg-[linear-gradient(...)]` form because v4 interpolates
 * `bg-gradient-to-r` in oklab, which shifts the computed gradient away from
 * the reference's sRGB interpolation (trap log #3).
 */
import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  promo: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image: string;
};

const AUTO_ADVANCE_MS = 5000;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = React.useState(0);
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAuto = React.useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const startAuto = React.useCallback(() => {
    stopAuto();
    timer.current = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTO_ADVANCE_MS);
  }, [slides.length, stopAuto]);

  const go = React.useCallback(
    (next: number) => {
      setIndex(((next % slides.length) + slides.length) % slides.length);
    },
    [slides.length],
  );

  React.useEffect(() => {
    startAuto();
    return stopAuto;
  }, [startAuto, stopAuto]);

  if (slides.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl lg:rounded-3xl mx-4 sm:mx-6 mt-4 group"
      onMouseEnter={stopAuto}
      onMouseLeave={startAuto}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      <div className="relative h-[50vh] sm:h-[55vh] lg:h-[65vh]">
        {slides.map((slide, i) => (
          <div
            key={slide.title}
            className={cn("absolute inset-0 transition-opacity duration-700", i === index ? "opacity-100" : "opacity-0")}
            aria-hidden={i !== index}
          >
            { }
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
            {/* sRGB-interpolated overlay (v4 oklab trap) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(0_0_0/0.6),rgb(0_0_0/0.3),transparent)]" />
          </div>
        ))}

        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto w-full px-8 sm:px-12">
            <div className="max-w-lg">
              {slides.map((slide, i) => (
                <div
                  key={slide.title}
                  className={cn(
                    "transition-all duration-700",
                    i === index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 absolute",
                  )}
                  aria-hidden={i !== index}
                >
                  <span className="inline-block bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
                    {slide.promo}
                  </span>
                  {/* Trap 10 (session-10, HERO-LH-1): the reference's class
                      string is byte-identical INCLUDING leading-tight, but
                      v3 emits responsive text utilities in media layers
                      after base utilities, so sm:text-4xl / lg:text-5xl
                      re-override leading-tight with their own line-heights
                      (40px / 48px) at >=640 / >=1024; v4 lets the base
                      leading-tight (1.25 -> 45/60px) win at every width.
                      The two pins restore the v3 cascade values. */}
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight sm:leading-[2.5rem] lg:leading-none">
                    {slide.title}
                  </h1>
                  <p className="text-white/80 text-base sm:text-lg mb-6">{slide.subtitle}</p>
                  <Link
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-full px-8 shadow-lg"
                    href={slide.href}
                  >
                    {slide.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          onClick={() => go(index - 1)}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          onClick={() => go(index + 1)}
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.title}
              type="button"
              aria-label={`Go to slide ${i + 1}: ${slide.title}`}
              aria-current={i === index}
              // Reference dot classes (measured live): h-2 rounded-full
              // transition-all duration-300; active w-8 bg-white, inactive
              // w-2 bg-white/50 — NO hover variant.
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === index ? "w-8 bg-white" : "w-2 bg-white/50",
              )}
              onClick={() => {
                go(i);
                startAuto();
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
