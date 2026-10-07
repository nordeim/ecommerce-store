"use client";

/**
 * AdminProductRow — product row with stock editing and visibility toggle
 * (calls admin server actions; role re-checked server-side).
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toggleProductActiveAction, updateProductStockAction } from "@/lib/actions/admin";
import { formatCents } from "@/lib/money";

export function AdminProductRow({
  product,
}: {
  product: {
    id: string;
    name: string;
    slug: string;
    image: string;
    price: number;
    categoryName: string;
    stock: number;
    isActive: boolean;
  };
}) {
  const router = useRouter();
  const [stock, setStock] = React.useState(String(product.stock));
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const saveStock = async () => {
    const value = Number(stock);
    if (!Number.isInteger(value) || value < 0) {
      setError("Stock must be a non-negative integer");
      return;
    }
    setPending(true);
    setError(null);
    const res = await updateProductStockAction(product.id, value);
    setPending(false);
    if (!res.ok) setError(res.error.message);
    else router.refresh();
  };

  const toggleActive = async () => {
    setPending(true);
    const res = await toggleProductActiveAction(product.id);
    setPending(false);
    if (!res.ok) setError(res.error.message);
    else router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border/50">
      <div className="flex items-center gap-3 min-w-0">
        { }
        <img src={product.image} alt={product.name} className="h-12 w-12 rounded-lg object-cover bg-secondary/30" />
        <div className="min-w-0">
          <p className="font-medium line-clamp-1">{product.name}</p>
          <p className="text-sm text-muted-foreground">
            {product.categoryName} · {formatCents(product.price)}
          </p>
          {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={product.isActive ? "secondary" : "destructive"} className="rounded-full">
          {product.isActive ? "Active" : "Hidden"}
        </Badge>
        <div className="flex items-center gap-2">
          <Input
            value={stock}
            onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
            className="w-20 text-center"
            aria-label={`Stock for ${product.name}`}
            inputMode="numeric"
          />
          <Button size="sm" variant="outline" className="rounded-xl" disabled={pending} onClick={() => void saveStock()}>
            Save
          </Button>
        </div>
        <Button
          size="icon"
          variant="ghost"
          aria-label={product.isActive ? `Hide ${product.name}` : `Show ${product.name}`}
          disabled={pending}
          onClick={() => void toggleActive()}
        >
          {product.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
