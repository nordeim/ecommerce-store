// Round-47 clone-side calibration: the auth family's Zod error ground truth.
// Verifies (against the REAL schemas in src/lib/validation.ts):
//   1. short password (matching confirm)      -> exactly ONE issue, the length copy
//   2. short password (MISMATCHED confirm)     -> the base issue wins, the refine never runs
//   3. 129-char password (matching)            -> the max-boundary copy
//   4. valid-length password + mismatch        -> the refine copy
//   5. the exact fieldErrors maps the actions build
// Run: bun scripts/zod-groundtruth-r47.mjs
import {
  registerSchema,
  resetPasswordSchema,
  loginSchema,
} from "../src/lib/validation.ts";

const show = (label, result) => {
  if (result.success) {
    console.log(`[OK-PARSE] ${label}: parsed (no issue)`);
    return;
  }
  const issues = result.error.issues.map((i) => `${i.path.join(".")}: "${i.message}"`);
  const fieldErrors = Object.fromEntries(
    result.error.issues.map((i) => [i.path[0]?.toString() ?? "", i.message]),
  );
  console.log(`[FAIL] ${label}`);
  console.log(`       message(issues[0]) = "${result.error.issues[0]?.message ?? "Invalid input"}"`);
  console.log(`       issues            = ${JSON.stringify(issues)}`);
  console.log(`       fieldErrors       = ${JSON.stringify(fieldErrors)}`);
};

console.log("=== registerSchema ===");
show("short+match   (abc/abc)", registerSchema.safeParse({ email: "probe@example.com", password: "abc", confirmPassword: "abc" }));
show("short+mismatch(abc/xyz)", registerSchema.safeParse({ email: "probe@example.com", password: "abc", confirmPassword: "xyz" }));
show("129-char+match", registerSchema.safeParse({ email: "probe@example.com", password: "x".repeat(129), confirmPassword: "x".repeat(129) }));
show("129-char+mismatch", registerSchema.safeParse({ email: "probe@example.com", password: "x".repeat(129), confirmPassword: "y".repeat(129) }));
show("valid+mismatch", registerSchema.safeParse({ email: "probe@example.com", password: "ValidPass123!", confirmPassword: "different!" }));

console.log("\n=== resetPasswordSchema ===");
show("reset short+match", resetPasswordSchema.safeParse({ token: "bogus", password: "abc", confirmPassword: "abc" }));
show("reset short+mismatch", resetPasswordSchema.safeParse({ token: "bogus", password: "abc", confirmPassword: "xyz" }));
show("reset valid+mismatch", resetPasswordSchema.safeParse({ token: "bogus", password: "ValidPass123!", confirmPassword: "different!" }));

console.log("\n=== loginSchema ===");
show("login short password", loginSchema.safeParse({ email: "probe@example.com", password: "x" }));
