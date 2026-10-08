import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = pageMetadata({ title: "Forgot Password", path: "/forgot-password" });

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
