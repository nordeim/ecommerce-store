import type { Metadata } from "next";

import { VerifyEmailForm } from "./verify-email-form";

export const metadata: Metadata = {
  // The reference keeps the SPA's "Register | Lumina" title on this screen
  // (it never re-titles after the signup transition). The clone names the
  // route properly — registered as a deliberate divergence in AGENTS.md.
  title: "Verify Email",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return <VerifyEmailForm email={email ?? ""} />;
}
