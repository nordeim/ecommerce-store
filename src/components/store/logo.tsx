import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link className={`flex items-center gap-2 ${className}`} href="/">
      <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
        <ShoppingBag className="h-4 w-4 text-primary-foreground" />
      </div>
      <span className="text-xl font-bold tracking-tight">LUXE</span>
    </Link>
  );
}
