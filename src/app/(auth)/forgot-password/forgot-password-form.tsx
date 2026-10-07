"use client";

/**
 * ForgotPasswordForm — the reference's standalone reset screen:
 * primary mail tile + "Reset password" heading, card with an icon-led
 * email input (`pl-10 h-12`), full-width "Send reset link" button, and a
 * "Back to log in" link below the card. On submit the form is REPLACED by
 * the neutral anti-enumeration confirmation (the server action never
 * reveals whether the account exists). Structure captured live on the
 * reference (2026-10-07).
 */
import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthErrorBox } from "@/app/(auth)/auth-error";
import { requestPasswordResetAction } from "@/lib/actions/auth";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = React.useActionState(requestPasswordResetAction, null);
  const sent = state?.ok === true;

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
          <Mail className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Reset password</h1>
        <p className="text-muted-foreground mt-2">We&apos;ll send you a link to reset it</p>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
        {sent ? (
          <p className="text-sm text-foreground text-center">
            If an account exists with that email, you&apos;ll receive a password reset link shortly.
          </p>
        ) : (
          <>
            {state && !state.ok && (
              <AuthErrorBox
                message={state.error.message ?? Object.values(state.error.fieldErrors ?? {})[0] ?? "Something went wrong"}
              />
            )}
            {/* No noValidate — native type=email validation, like the
                reference (session-4, FP-VALID-1). */}
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
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
                    placeholder="you@example.com"
                    required
                    className="pl-10 h-12"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 font-medium" disabled={pending}>
                {pending ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          </>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        <Link href="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="h-3 w-3 inline mr-1" aria-hidden="true" />
          Back to log in
        </Link>
      </p>
    </div>
  );
}
