"use client";

/**
 * ResetPasswordForm — the reference's /reset-password screen (session-20,
 * RESET-ROUTE-1). Both states captured live 2026-10-09:
 *
 *   no token   -> "Invalid reset link": triangle-alert icon tile, h1 +
 *                 sub in the header block OUTSIDE the card, the card with
 *                 the explanatory copy, and the below-card "Request a new
 *                 link" link to /forgot-password.
 *   any token  -> "New password": lock icon tile, h1 + sub, the card with
 *                 the form (two icon-led h-12 password inputs — "New
 *                 Password"/"Confirm Password", the family's
 *                 `••••••••` placeholders + autoComplete="new-password" —
 *                 and the w-full h-12 "Reset password" button).
 *
 * The error box is the family's shared tinted box (AuthErrorBox), first
 * child of the card above the form: "Invalid or expired reset token"
 * (bogus/expired token on submit — measured live). Mismatched passwords
 * surface "Passwords do not match" (the register copy — measured firing
 * BEFORE the server's token check). On success the action rotated the
 * password, consumed the token, and deleted every session — this island
 * routes to /login (no auto-login: the reference's post-success state is
 * unmeasurable; the no-session redirect is the registered superset
 * decision).
 */
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthErrorBox } from "@/app/(auth)/auth-error";
import { resetPasswordAction } from "@/lib/actions/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, formAction, pending] = React.useActionState(resetPasswordAction, null);
  const [mismatch, setMismatch] = React.useState<string | null>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const confirmRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (state?.ok) {
      router.push("/login");
    }
  }, [state, router]);

  // The no-token state: the reference's "Invalid reset link" screen.
  if (!token) {
    return (
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <TriangleAlert className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Invalid reset link</h1>
          <p className="text-muted-foreground mt-2">
            This password reset link is missing or invalid
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          <p className="text-sm text-foreground text-center">
            The link you used appears to be incomplete. Please request a new password reset
            email.
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link href="/forgot-password" className="text-primary font-medium hover:underline">
            Request a new link
          </Link>
        </p>
      </div>
    );
  }

  // The with-token state: the reference's "New password" form.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Client-side match check FIRST (measured: fires before the server's
    // token validation on the reference).
    if (passwordRef.current?.value !== confirmRef.current?.value) {
      e.preventDefault();
      setMismatch("Passwords do not match");
      return;
    }
    setMismatch(null);
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
          <Lock className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">New password</h1>
        <p className="text-muted-foreground mt-2">Enter your new password below</p>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
        {mismatch ? (
          <AuthErrorBox message={mismatch} />
        ) : (
          state !== null && !state.ok && <AuthErrorBox message={state.error.message} />
        )}

        <form action={formAction} onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="token" value={token} />

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
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
                ref={passwordRef}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm Password</Label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="confirm"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="••••••••"
                className="pl-10 h-12"
                ref={confirmRef}
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 font-medium" disabled={pending}>
            {pending ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
