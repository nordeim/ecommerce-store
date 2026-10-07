"use client";

/**
 * RegisterForm — the reference's standalone registration screen (session-4
 * rebuild). Structure captured live 2026-10-07: header block OUTSIDE the
 * card (primary UserPlus tile + text-3xl "Create your account" + sub), then
 * the card (border-border) with the h-12 Google button, the line-and-label
 * "or" divider, the error box (when present), and a space-y-4 form of
 * icon-led h-12 inputs (Mail / Lock / Lock). Reference parity: NO name field
 * (display name derived server-side from the email local part, ADR-010).
 */
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthErrorBox } from "@/app/(auth)/auth-error";
import { registerAction } from "@/lib/actions/auth";

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction, pending] = React.useActionState(registerAction, null);
  const [email, setEmail] = React.useState("");

  React.useEffect(() => {
    if (state?.ok) {
      if (state.data.verificationRequired) {
        // Session-4 (AUTH-VERIFY-1): the reference routes fresh signups to
        // the verify-email screen (no session until the code is confirmed).
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      router.refresh();
      router.push("/account");
    }
  }, [state, router, email]);

  // The reference renders ONE alert box with the first error message —
  // field-level errors (short password) surface there too, not under the
  // inputs (measured live: "Password must be at least 8 characters long").
  const boxMessage =
    state && !state.ok
      ? state.error.message ?? Object.values(state.error.fieldErrors ?? {})[0]
      : undefined;

  return (
    // Centering + background come from the (auth) group layout (reference:
    // standalone screen, no site chrome).
    <div className="w-full max-w-md">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
          <UserPlus className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create your account</h1>
        <p className="text-muted-foreground mt-2">Sign up to get started</p>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
        <Button variant="outline" className="w-full h-12 text-sm font-medium mb-6" type="button">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5 mr-2">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.97 10.97 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84Z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground">or</span>
          </div>
        </div>

        {boxMessage && <AuthErrorBox message={boxMessage} />}

        {/* No noValidate — the reference relies on native validation
            (session-4, FP-VALID-1). */}
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="pl-10 h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="••••••••"
                className="pl-10 h-12"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="••••••••"
                className="pl-10 h-12"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 font-medium" disabled={pending}>
            {pending ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
