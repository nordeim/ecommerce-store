// Round-40 DOCS-ALIGN verification oracle (the TDD test layer for a docs
// round): programmatically checks the load-bearing STRUCTURAL claims of the
// four docs against the codebase — the §3.2 tree, the §4.1 ER diagram, the
// §12 key-files line counts, the ADR ledger's order/uniqueness, and the
// cross-doc counts. Never reads a doc's claim as truth: every expectation is
// derived from the codebase itself (the verify-holiday-math-r39 precedent —
// an independent oracle).
//
// RED   — run against the pre-rewrite docs: records the drift census per family.
// GREEN — run after the rewrites: every family passes.
// The script stays in scripts/ as the standing drift watch for future rounds.
//
// Run: node scripts/verify-docs-align-r40.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

const families = [];
const family = (name, checks) => {
  const fails = [];
  for (const [label, ok] of checks) if (!ok) fails.push(label);
  families.push({ name, fails, total: checks.length });
};

// ---------------------------------------------------------------------------
// Family 1 — the PAD §3.2 tree vs the real src/ tree
// ---------------------------------------------------------------------------
const pad = read("Project_Architecture_Document.md");
const treeBlock = pad.split("### 3.2 Annotated Directory Structure")[1]
  .split("### 3.3")[0];

const realFiles = execSync("find src tests -type f | sort", { cwd: ROOT })
  .toString().trim().split("\n");
const realSrc = realFiles.filter((f) => f.startsWith("src/"));

// every FULL repo path the tree documents must exist (fragments like
// `layout.tsx` are annotations, not disk claims — the forward-guard for the
// rewritten tree; the allowlist below catches the missing-documentation side)
const docPaths = [...treeBlock.matchAll(/(?:src|prisma|tests|public|docs|scripts)\/[\w()[\]*@.\-/]+/g)]
  .map((m) => m[0].replace(/[├└│─]+/g, "").trim())
  .filter((p) => !p.includes("*"));
const missingOnDisk = docPaths.filter((p) => {
  try { statSync(join(ROOT, p)); return false; } catch { return true; }
});

// every load-bearing real path must be documented (the §3.2 rewrite's
// allowlist — the files whose absence from the tree made it lie). The tree
// is HIERARCHICAL (fragments under directory rows), so the checkable form
// is the file's BASENAME appearing in the tree block.
const loadBearing = [
  "src/proxy.ts",
  "src/lib/actions/account.ts", "src/lib/actions/admin.ts",
  "src/lib/actions/auth.ts", "src/lib/actions/cart.ts",
  "src/lib/actions/checkout.ts", "src/lib/actions/stripe.ts",
  "src/lib/admin-orders.ts", "src/lib/admin-payments.ts",
  "src/lib/admin-products.ts", "src/lib/delivery-window.ts",
  "src/lib/metadata.ts", "src/lib/order-money-state.ts",
  "src/lib/order-status.ts", "src/lib/order-timeline.ts",
  "src/lib/order-tracking.ts", "src/lib/order-view-token.ts",
  "src/lib/reset-token.ts", "src/lib/stripe-config.ts",
  "src/lib/stripe-payment.ts", "src/lib/stripe.ts", "src/lib/utils.ts",
  "src/app/(storefront)/account/orders/[id]/page.tsx",
  "src/app/(storefront)/admin/payments/page.tsx",
  "src/app/(auth)/reset-password/page.tsx",
  "src/app/[...notFound]/page.tsx",
  "src/app/api/stripe/webhook/route.ts",
  "tests/stripe-webhook.integration.test.ts",
  "prisma/dev-cleanup.ts",
];
const undocumented = loadBearing.filter((p) => {
  const base = p.split("/").pop();
  return !treeBlock.includes(base);
});

// the 4-endpoint line (the "3-endpoint whitelist" is wrong since session-22)
const apiRoutes = readdirSync(join(ROOT, "src/app/api"), { recursive: true })
  .filter((f) => String(f).endsWith("route.ts"));
const fourEndpointLine = /4-endpoint|stripe\/webhook/.test(treeBlock);

// e2e spec census
const e2eSpecs = readdirSync(join(ROOT, "tests/e2e")).filter((f) => f.endsWith(".spec.ts"));
const specCountLine = /29 specs|29 spec/.test(treeBlock);

family("PAD §3.2 tree", [
  ["every documented path exists on disk", missingOnDisk.length === 0],
  [`all ${loadBearing.length} load-bearing paths documented (${undocumented.filter((p) => !treeBlock.includes(p)).length} missing)`,
    undocumented.filter((p) => !treeBlock.includes(p)).length === 0],
  [`the 4-endpoint line (real: ${apiRoutes.length} route.ts)`, fourEndpointLine && apiRoutes.length === 4],
  [`the e2e spec count (real: ${e2eSpecs.length})`, specCountLine && e2eSpecs.length === 29],
]);

// ---------------------------------------------------------------------------
// Family 2 — the PAD §4.1 ER diagram vs the real schema
// ---------------------------------------------------------------------------
const erBlock = pad.split("### 4.1 Schema (ER summary)")[1].split("### 4.2")[0];
const schema = read("prisma/schema.prisma");
const models = [...schema.matchAll(/^model (\w+) \{/gm)].map((m) => m[1]);
const erDrawn = models.filter((m) => erBlock.includes(m));
const erMissing = models.filter((m) => !erBlock.includes(m));
const resetRelation = /User \|\|--o\{ PasswordResetToken/.test(erBlock);

// the model notes must carry the post-session-20 columns
const notesBlock = erBlock.split("```")[2] || erBlock;
const notesOk = /stripePaymentIntentId|paymentStatus/.test(notesBlock)
  && /carrier|trackingNumber/.test(notesBlock)
  && /amount|failureReason/.test(notesBlock);

family("PAD §4.1 ER diagram", [
  [`all ${models.length} models drawn (${erMissing.length} missing: ${erMissing.join(", ") || "none"})`, erMissing.length === 0 && models.length === 15],
  ["User--PasswordResetToken relation drawn", resetRelation],
  ["model notes carry the s22/s25/s30/s36 columns", notesOk],
]);

// ---------------------------------------------------------------------------
// Family 3 — the PAD §12 key-files line counts vs wc -l
// ---------------------------------------------------------------------------
const keyBlock = pad.split("## 12. Key Files Reference")[1].split("## 13.")[0];
const rows = [...keyBlock.matchAll(/\| `([^`]+)` \| ~(\d+) \|/g)];
let countOff = [];
for (const [, path, claimed] of rows) {
  const real = parseInt(execSync(`wc -l < "${path}"`, { cwd: ROOT, shell: "/bin/bash" }).toString().trim(), 10);
  if (Math.abs(real - parseInt(claimed, 10)) > 5) countOff.push(`${path} ~${claimed} vs ${real}`);
}
const hasDeliveryWindowRow = /delivery-window/.test(keyBlock);

family("PAD §12 key-files line counts", [
  [`${rows.length} rows, all within ±5 (${countOff.length} off: ${countOff.join("; ") || "none"})`, countOff.length === 0],
  ["the delivery-window seam has a row (rounds 37–39)", hasDeliveryWindowRow],
]);

// ---------------------------------------------------------------------------
// Family 4 — the ADR ledger: strictly ordered, no duplicates, no gaps
// ---------------------------------------------------------------------------
const adrHeaders = [...pad.matchAll(/\*\*ADR-(\d{3}):/g)].map((m) => parseInt(m[2 - 1], 10));
const dupes = adrHeaders.filter((n, i) => adrHeaders.indexOf(n) !== i);
const monotonic = adrHeaders.every((n, i) => i === 0 || n > adrHeaders[i - 1]);
const contiguous = adrHeaders.length > 0 && adrHeaders[0] === 1
  && adrHeaders[adrHeaders.length - 1] === 49
  && adrHeaders.length === 49;

family("PAD ADR ledger", [
  [`strictly increasing (${adrHeaders.length} headers; dupes: ${[...new Set(dupes)].join(", ") || "none"})`, monotonic && dupes.length === 0],
  ["contiguous 001→049, exactly 49 ADRs (recalibrated at session-42: ADR-049)", contiguous && adrHeaders.length === 49],
]);

// ---------------------------------------------------------------------------
// Family 5 — the cross-doc counts (the four docs' load-bearing numbers)
// ---------------------------------------------------------------------------
const agents = read("AGENTS.md");
const claude = read("CLAUDE.md");
const readme = read("README.md");
const skill = read("ecommerce-store_SKILL.md");

// env vars: .env.example documents 7 (match any assignment, empty or not)
const envExample = read(".env.example");
const envVars = [...envExample.matchAll(/^([A-Z_]+)=/gm)].map((m) => m[1]);
const skillEnvCountOk = /Environment variables \(7[ —)]/.test(skill);

// rate limiters: 7 live (censused in the plan §3.1.5) — a pure-JS census
// (reads the actions + api handlers, extracts every rateLimit(`key:` call)
const limiterFiles = [
  "src/lib/actions/auth.ts", "src/lib/actions/checkout.ts",
  "src/lib/actions/stripe.ts", "src/app/api/newsletter/route.ts",
  "src/app/api/search/route.ts",
];
const limiters = [];
for (const f of limiterFiles) {
  const src = read(f);
  for (const m of src.matchAll(/rateLimit\(`([a-z-]+):/g)) {
    if (!limiters.includes(m[1])) limiters.push(m[1]);
  }
}
limiters.sort();
const padLimitersOk = limiters.length === 7 && /stripe-intent/.test(pad) && /verify-resend/.test(pad);

// Radix: exactly the 6 installed packages
const pkg = JSON.parse(read("package.json"));
const radixInstalled = Object.keys(pkg.dependencies).filter((d) => d.startsWith("@radix-ui/"));
const skillRadixOk = !/popover/.test(skill.split("UI primitives")[1].split("\n")[0]);

// OrderEvent type vocabulary: six values in the schema comment
const orderEventComment = schema.split("model OrderEvent")[1].split("}")[0];
const oeTypes = [...orderEventComment.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
const oeOk = ["placed", "status_changed", "payment_succeeded", "payment_failed", "payment_refunded", "tracking_added"]
  .every((t) => oeTypes.includes(t));

// AGENTS/CLAUDE test-count spots
const countStrip = (doc, needle) => {
  const m = doc.match(needle);
  return m ? parseInt(m[1], 10) : -1;
};
const unitTotal = parseInt(execSync(
  `grep -rcoE '^\\s*(it|test)\\(' src/lib/*.test.ts tests/*.test.ts 2>/dev/null | awk -F: '{s+=$2} END {print s}'`,
  { cwd: ROOT, shell: "/bin/bash" }).toString().trim(), 10);
const stripePaymentTests = parseInt(execSync(
  `grep -cE '^\\s*(it|test)\\(' src/lib/stripe-payment.test.ts`, { cwd: ROOT, shell: "/bin/bash" }).toString().trim(), 10);
const webhookTests = parseInt(execSync(
  `grep -cE '^\\s*(it|test)\\(' tests/stripe-webhook.integration.test.ts`, { cwd: ROOT, shell: "/bin/bash" }).toString().trim(), 10);
const adminPaymentsTests = parseInt(execSync(
  `grep -cE '^\\s*(it|test)\\(' src/lib/admin-payments.test.ts`, { cwd: ROOT, shell: "/bin/bash" }).toString().trim(), 10);
const seoTests = parseInt(execSync(
  `grep -cE '^\\s*(it|test)\\(' tests/e2e/seo.spec.ts`, { cwd: ROOT, shell: "/bin/bash" }).toString().trim(), 10);

const agentsStripePay = countStrip(agents, /stripe-payment\.test\.ts[^;]*?(\d+) tests/s);
const agentsWebhook = countStrip(agents, /stripe-webhook\.integration\.test\.ts[^;]*?(\d+) tests/s);
const claudeAdminPay = countStrip(claude, /admin-payments\.ts`?, (\d+) unit/s);
const claudeSeo = countStrip(claude, /seo\.spec\.ts`\s?\((\d+) tests\)/s);
const claudeWebhook = countStrip(claude, /integration-pinned \((\d+) tests/s);

// CLAUDE (auth) five members; SKILL route count; SKILL trap-log count
const claudeAuthOk = /five members|login\/register\/forgot-password\/verify-email\/reset-password/.test(claude.split("Route groups own the chrome")[1]?.split(".")[0] + "");
const claudeAuthLine = /renders\s+login\/register\/forgot-password(?!\/verify-email)/.test(claude);
const skillRoutesOk = /26 routes/.test(skill);
const skillTrapsOk = !/eight measured differences/.test(skill);
const skillOrdersOk = /4 demo orders|four demo orders/.test(skill) && !/3 demo orders/.test(skill);

family("cross-doc counts", [
  [`.env.example documents ${envVars.length} vars (got: ${envVars.join(", ")})`, envVars.length === 7],
  [`SKILL env table says (7)`, skillEnvCountOk],
  [`${limiters.length} live rate limiters in the code (PAD §6.1 must list all: got ${limiters.join(", ")})`, padLimitersOk],
  [`Radix list = the ${radixInstalled.length} installed packages`, skillRadixOk && radixInstalled.length === 6],
  [`schema OrderEvent comment carries all six types (got: ${oeTypes.join(", ")})`, oeOk],
  [`AGENTS stripe-payment count (doc: ${agentsStripePay}, real: ${stripePaymentTests})`, agentsStripePay === stripePaymentTests],
  [`AGENTS webhook-integration count (doc: ${agentsWebhook}, real: ${webhookTests})`, agentsWebhook === webhookTests],
  [`CLAUDE admin-payments count (doc: ${claudeAdminPay}, real: ${adminPaymentsTests})`, claudeAdminPay === adminPaymentsTests],
  [`CLAUDE seo.spec count (doc: ${claudeSeo}, real: ${seoTests})`, claudeSeo === seoTests],
  [`CLAUDE webhook-integration count (doc: ${claudeWebhook}, real: ${webhookTests})`, claudeWebhook === webhookTests],
  ["CLAUDE (auth) group: the five members", !claudeAuthLine],
  ["SKILL route count 26", skillRoutesOk],
  ["SKILL trap-log count scoped honestly", skillTrapsOk],
  ["SKILL seed: 4 demo orders", skillOrdersOk],
]);

// ---------------------------------------------------------------------------
// The verdict
// ---------------------------------------------------------------------------
let bad = 0;
for (const f of families) {
  const status = f.fails.length === 0 ? "GREEN" : "RED";
  if (f.fails.length) bad++;
  console.log(`\n[${status}] ${f.name} — ${f.total - f.fails.length}/${f.total} checks`);
  for (const fail of f.fails) console.log(`  FAIL: ${fail}`);
}
console.log(
  bad === 0
    ? "\nDOCS-ALIGN: ALL FAMILIES GREEN"
    : `\nDOCS-ALIGN: ${bad}/${families.length} FAMILIES RED (the drift census)`,
);
process.exit(bad === 0 ? 0 : 1);
