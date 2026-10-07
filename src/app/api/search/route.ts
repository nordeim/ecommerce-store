import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searchSchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Search typeahead — GET /api/search?q=…&limit=…
 * Zod-validated, rate-limited (60/min/IP), case-insensitive name contains.
 */
export async function GET(request: NextRequest) {
  const ip = clientIp(request.headers);
  const rl = rateLimit(`search:${ip}`, 60, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const params = request.nextUrl.searchParams;
  const parsed = searchSchema.safeParse({
    q: params.get("q") ?? "",
    limit: Number(params.get("limit") ?? 6),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid query" }, { status: 400 });
  }

  const { q, limit } = parsed.data;
  const products = await db.product.findMany({
    where: { isActive: true, name: { contains: q } },
    include: { category: true },
    take: limit,
    orderBy: [{ sortOrder: "asc" }],
  });

  return NextResponse.json({
    results: products.map((p) => ({
      slug: p.slug,
      name: p.name,
      categoryName: p.category.name,
      price: p.price,
      image: p.image,
    })),
  });
}
