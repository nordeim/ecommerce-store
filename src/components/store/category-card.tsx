import Link from "next/link";
import {
  Dumbbell,
  Headphones,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Sofa,
  Sparkles,
  Shirt,
  Truck,
  Watch,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Monitor,
  Shirt,
  Sofa,
  Watch,
  Dumbbell,
  Sparkles,
};

/** Category showcase card — lucide icon in a rounded accent square (reference parity). */
export function CategoryCard({ name, slug, icon }: { name: string; slug: string; icon: string }) {
  const Icon = CATEGORY_ICONS[icon] ?? Sparkles;
  return (
    <Link
      className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
      href={`/shop?category=${slug}`}
    >
      <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center group-hover:bg-primary/10 transition-colors">
        <Icon className="h-6 w-6 text-accent-foreground group-hover:text-primary transition-colors" />
      </div>
      <span className="text-sm font-medium">{name}</span>
    </Link>
  );
}

/** The four-feature trust bar (Free Shipping / Secure Payment / ...). */
const FEATURES = [
  { icon: Truck, title: "Free Shipping", text: "On orders over $100" },
  { icon: ShieldCheck, title: "Secure Payment", text: "100% secure checkout" },
  { icon: RefreshCw, title: "30-Day Returns", text: "Hassle-free returns" },
  { icon: Headphones, title: "24/7 Support", text: "Dedicated support team" },
];

export function FeatureBar() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
              <f.icon className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{f.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{f.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
