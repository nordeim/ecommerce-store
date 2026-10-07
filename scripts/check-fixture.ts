import { PrismaClient } from "@prisma/client";

const db = new PrismaClient({
  datasources: { db: { url: process.env.TARGET_DB } },
});

async function main() {
  const u = await db.user.findUnique({ where: { email: "unverified@example.com" } });
  console.log(
    process.env.TARGET_DB,
    "->",
    u ? `verified=${u.emailVerified} attempts=${u.verificationAttempts} expires=${u.verificationExpiresAt?.toISOString()}` : "fixture missing",
  );
  const count = await db.user.count();
  console.log("  users:", count);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
