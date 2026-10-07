import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";

const SHOP_LINKS = [
  { label: "All Products", href: "/shop" },
  { label: "Electronics", href: "/shop?category=electronics" },
  { label: "Clothing", href: "/shop?category=clothing" },
  { label: "Accessories", href: "/shop?category=accessories" },
  { label: "Home & Living", href: "/shop?category=home-living" },
  { label: "Sports", href: "/shop?category=sports" },
  { label: "Beauty", href: "/shop?category=beauty" },
];

const COMPANY_LINKS = ["About Us", "Careers", "Press", "Sustainability", "Affiliate Program"];

export function Footer() {
  return (
    <footer className="bg-foreground text-background mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Logo className="mb-4" />
            <p className="text-sm text-background/60 leading-relaxed mb-6">
              Curated collection of premium products for modern living. Quality meets style in every piece.
            </p>
            <div className="flex flex-col gap-2 text-sm text-background/60">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>hello@luxestore.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>New York, NY 10001</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Shop</h3>
            <ul className="space-y-3">
              {SHOP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link className="text-sm text-background/60 hover:text-background transition-colors" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((label) => (
                <li key={label}>
                  <span className="text-sm text-background/60 hover:text-background transition-colors cursor-pointer">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Stay Updated</h3>
            <p className="text-sm text-background/60 mb-4">Subscribe for exclusive offers and new arrivals.</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/40">&copy; 2026 LUXE Store. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-background/40">
            <span className="hover:text-background transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-background transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-background transition-colors cursor-pointer">Cookie Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
