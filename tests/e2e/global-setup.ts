import { execSync } from "node:child_process";
import path from "node:path";

/**
 * Playwright global setup: guarantee the isolated e2e database exists and
 * carries the demo seed, so every spec run starts from the same state.
 *
 * The database lives at <repo>/db/e2e.db (gitignored like every db/*.db).
 * `DATABASE_URL="file:../db/e2e.db"` resolves against prisma/ for the CLI
 * and against the schema anchor at runtime — one file, both tools.
 */
export default function globalSetup(): void {
  const repo = path.resolve(__dirname, "..", "..");
  const env = {
    ...process.env,
    DATABASE_URL: "file:../db/e2e.db",
  } as NodeJS.ProcessEnv;

  // Prefer bun (the documented runtime); fall back to npx tsx for npm users.
  const run = (cmd: string) =>
    execSync(cmd, { cwd: repo, env, stdio: "pipe" }).toString();

  // --accept-data-loss: bypasses prisma's interactive prompt on UNIQUE
  // constraint ADDITIONS (session-22's Order.stripePaymentIntentId). This
  // is a scratch, re-seeded-every-run database, and the constrained column
  // is newly added (all-NULL) — the flag is a prompt-suppressor, not a
  // data-loss acceptor in practice.
  try {
    run("bunx prisma db push --skip-generate --accept-data-loss");
  } catch {
    run("npx prisma db push --skip-generate --accept-data-loss");
  }
  try {
    run("bun prisma/seed.ts");
  } catch {
    run("npx tsx prisma/seed.ts");
  }
  // Clear transient state (carts, wishlists, spec users/addresses) so runs
  // are reproducible — the cart/wishlist specs assert absolute counts.
  try {
    run("bun prisma/e2e-reset.ts");
  } catch {
    run("npx tsx prisma/e2e-reset.ts");
  }
}
