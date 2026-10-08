import type { Metadata } from "next";

import { pageMetadata } from "@/lib/metadata";
import { ResetPasswordForm } from "./reset-password-form";

// Session-20 (RESET-ROUTE-1): the reference ships a REAL /reset-password
// route (discovered via its own sitemap): no token -> the "Invalid reset
// link" screen; any token -> the "New password" form. og:url preserves
// the token query (measured on the reference with ?token=test123 — the
// /shop?category=x query-preserving precedent), so the metadata is
// generated per-request from the search params.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}): Promise<Metadata> {
  const { token } = await searchParams;
  const path = token ? `/reset-password?token=${encodeURIComponent(token)}` : "/reset-password";
  return pageMetadata({ title: "Reset Password", path });
}

// Session-14 (SEC-CSP-1): per-request CSP nonces require per-request
// rendering — see src/middleware.ts.
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={token ?? ""} />;
}
