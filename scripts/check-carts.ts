import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  datasources: { db: { url: process.env.TARGET_DB ?? "file:../db/custom.db" } },
});

async function main() {
  const carts = await db.cart.findMany({ include: { items: true }, orderBy: { createdAt: "desc" }, take: 5 });
  for (const c of carts) {
    console.log(
      `cart ${c.id.slice(-8)} token=${c.token.slice(-6)} user=${c.userId ? c.userId.slice(-6) : "guest"} items=[${c.items
        .map((i) => `${i.id.slice(-8)} qty=${i.quantity} product=${i.productId.slice(-8)}`)
        .join(", ")}] created=${c.createdAt.toISOString()}`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
