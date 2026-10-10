// Session-35: verify the timeline fixtures in the dev DB (post-seed).
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const orders = await db.order.findMany({
  where: { number: { startsWith: "ORD-2026" } },
  include: { events: { orderBy: { createdAt: "asc" } } },
});
for (const o of orders.sort((a, b) => a.number.localeCompare(b.number))) {
  console.log(
    o.number,
    o.status,
    "-",
    o.events
      .map((e) => `${e.type}@${e.createdAt.toISOString().slice(0, 16)}${e.id.startsWith("evt-ord") ? "(fixture)" : ""}`)
      .join(" | "),
  );
}
await db.$disconnect();
