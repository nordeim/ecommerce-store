"use client";

/**
 * MobileNav — Sheet sliding in from the LEFT (w-72), matching the reference.
 *
 * Tailwind v4 trap-log note: this panel stacks links with `gap-4` (flex),
 * NOT `space-y-*` — a `space-y-*` container whose children carry explicit
 * `mt-*` renders different gaps on v4 vs v3 (v4's :where() selector drops
 * to zero specificity). Keep the gap-based layout.
 */
import Link from "next/link";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useStore } from "./store-provider";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=electronics", label: "Electronics" },
  { href: "/shop?category=clothing", label: "Clothing" },
  { href: "/shop?category=accessories", label: "Accessories" },
];

export function MobileNav() {
  const { mobileNavOpen, setMobileNavOpen } = useStore();
  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetContent side="left" className="w-72 sm:max-w-sm">
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <nav className="flex flex-col gap-4 mt-8" aria-label="Mobile">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileNavOpen(false)}
              className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
