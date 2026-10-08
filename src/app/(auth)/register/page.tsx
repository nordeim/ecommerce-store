import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = pageMetadata({ title: "Register", path: "/register" });

// Session-14 (SEC-CSP-1): the CSP middleware mints a per-request nonce,
// which requires per-request rendering — this auth screen (and
// forgot-password) opted out of static prerendering so its scripts can
// carry the nonce. Every other auth route was already dynamic.
export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return <RegisterForm />;
}
