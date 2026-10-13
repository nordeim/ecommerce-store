// r57 diagnostic 2: the full OrderEvent dump on custom.db (all orders,
// with ids) + the DB file's mtime — the fixtures existed at seed time
// (09:13) but are absent now; find what state the file is actually in.
// Run: bun scripts/diag-db-events2-r57.ts
import { PrismaClient } from "@prisma/client";
import { statSync } from "node:fs";

console.log("custom.db mtime:", statSync("db/custom.db").mtime.toISOString());
console.log("e2e.db     mtime:", statSync("db/e2e.db").mtime.toISOString());

const p = new PrismaClient({ datasources: { db: { url: "file:../db/custom.db" } } });
const evts = await p.orderEvent.findMany({
  orderBy: { createdAt: "asc" },
});
console.log(`custom.db OrderEvent count: ${evts.length}`);
for (const e of evts) {
  console.log(`  ${e.id} type=${e.type} order=${e.orderId.slice(-6)} at=${e.createdAt.toISOString()}`);
}
const orders = await p.order.findMany({ select: { number: true, id: true, carrier: true, trackingNumber: true } });
for (const o of orders) console.log(`ORDER ${o.number} id=...${o.id.slice(-6)} carrier=${o.carrier} track=${o.trackingNumber}`);
await p.$disconnect();
