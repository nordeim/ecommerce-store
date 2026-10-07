"use client";

/**
 * VerifyEmailForm — the reference's post-signup verification screen (session-4,
 * AUTH-VERIFY-1). Structure captured live 2026-10-07: header block OUTSIDE the
 * card (primary Mail tile + text-3xl "Verify your email" + "We sent a code to
 * «email»"), then the card with a 6-slot OTP input (visual h-9 w-9 boxes over
 * a hidden one-time-code input), a full-width h-12 "Verify" button (disabled
 * until 6 digits), and "Didn't receive the code? Resend" (no feedback on
 * resend — reference parity). Wrong codes decrement a 5-attempt budget inside
 * the shared alert box.
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthErrorBox } from "@/app/(auth)/auth-error";
import { resendVerificationAction, verifyEmailAction } from "@/lib/actions/auth";

export function VerifyEmailForm({ email }: { email: string }) {
  const router = useRouter();
  const [state, formAction, pending] = React.useActionState(verifyEmailAction, null);
  const [code, setCode] = React.useState("");
  const [resending, setResending] = React.useState(false);

  React.useEffect(() => {
    if (state?.ok) {
      router.refresh();
      router.push("/account");
    }
  }, [state, router]);

  const digits = code.split("");

  async function resend() {
    setResending(true);
    await resendVerificationAction(email);
    setResending(false);
    // Reference parity: the resend gives NO visible feedback (verified live).
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
          <Mail className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Verify your email</h1>
        <p className="text-muted-foreground mt-2">We sent a code to {email || "your email"}</p>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
        {state && !state.ok && <AuthErrorBox message={state.error.message} />}

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="email" value={email} />

          {/* The reference's 6-box OTP affordance: one real input (labeled for
              a11y — superset; the reference's is unlabeled) overlaid invisibly
              on the visual boxes, inputmode=numeric, one-time-code. */}
          <div className="flex justify-center mb-6">
            <div className="relative flex items-center gap-2">
              <div className="flex items-center">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md"
                  >
                    {digits[i] ?? ""}
                  </div>
                ))}
              </div>
              <input
                type="text"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                aria-label="Verification code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="absolute inset-0 w-full opacity-0 cursor-text"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 font-medium" disabled={pending || code.length !== 6}>
            {pending ? "Verifying…" : "Verify"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            className="text-primary font-medium hover:underline disabled:opacity-50"
            disabled={resending}
            onClick={() => void resend()}
          >
            Resend
          </button>
        </p>
      </div>
    </div>
  );
}
