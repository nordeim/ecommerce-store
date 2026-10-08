import type { Metadata } from "next";

import { pageMetadata } from "@/lib/metadata";
import { VerifyEmailForm } from "./verify-email-form";

// The reference keeps the SPA's "Register | Lumina" title on this screen
// (it never re-titles after the signup transition). The clone names the
// route properly — registered as a deliberate divergence in AGENTS.md.
// og layer follows the static-page pattern (session-9).
export const metadata: Metadata = pageMetadata({ title: "Verify Email", path: "/verify-email" });

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return <VerifyEmailForm email={email ?? ""} />;
}
