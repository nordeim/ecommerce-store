// r57 diagnostic: compare OrderEvent rows between db/custom.db (dev) and
// db/e2e.db — the timeline row counts diverged (dev: 1 circle; e2e: 3).
// Run: bun scripts/diag-db-events-r57.ts
import { PrismaClient } from "@prisma/client";

for (const url of ["file:../db/custom.db", "file:../db/e2e.db"]) {
  const p = new PrismaClient({ datasources: { db: { url } } });
  const orders = await p.order.findMany({
    where: { number: { startsWith: "ORD-2026-00" } },
    include: { events: true },
  });
  console.log(`\n=== ${url} ===`);
  for (const o of orders.slice(0, 2)) {
    console.log(
      `${o.number} status=${o.status} events=[${o.events
        .map((e) => `${e.type}@${e.createdAt.toISOString().slice(0, 10)}`)
        .sort()
        .join(", ")}]`
    );
  }
  await p.$disconnect();
}
