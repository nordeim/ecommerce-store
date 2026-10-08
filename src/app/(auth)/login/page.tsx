import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { LoginForm } from "./login-form";

export const metadata: Metadata = pageMetadata({ title: "Login", path: "/login" });

// Session-6 (REDIRECT-1): /account and /admin send anonymous visitors here
// with ?redirect=<their path>; the server page reads it (searchParams — the
// route is therefore dynamic) and hands it to the client island, which
// validates it (same-origin relative paths only) before honoring it.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm redirectTo={params.redirect} />;
}
