import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = pageMetadata({ title: "Forgot Password", path: "/forgot-password" });

// Session-14 (SEC-CSP-1): per-request CSP nonces require per-request
// rendering — see src/middleware.ts.
export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
