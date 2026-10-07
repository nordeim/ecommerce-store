"use client";

/**
 * NewsletterForm — footer subscribe island. Posts to /api/newsletter
 * (Zod-validated, rate-limited) and shows an inline success/error line.
 */
import * as React from "react";
import { Button } from "@/components/ui/button";

export function NewsletterForm() {
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = React.useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (res.ok && data.ok) {
        setState("done");
        setMessage("Thanks for subscribing!");
        setEmail("");
      } else {
        setState("error");
        setMessage(data.message ?? "Could not subscribe. Please try again.");
      }
    } catch {
      setState("error");
      setMessage("Could not subscribe. Please try again.");
    }
  };

  return (
    <div>
      <form className="flex gap-2" onSubmit={submit}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          aria-label="Email address"
          className="flex h-9 w-full rounded-md border px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-background/10 border-background/20 text-background placeholder:text-background/40"
        />
        <Button type="submit" disabled={state === "loading"}>
          {state === "loading" ? "Joining…" : "Join"}
        </Button>
      </form>
      {message && (
        <p
          role="status"
          aria-label="Newsletter status"
          className={`text-xs mt-2 ${state === "done" ? "text-background/70" : "text-red-300"}`}
        >
          {message}
        </p>
      )}
      <p className="text-xs text-background/40 mt-3">By subscribing, you agree to our Privacy Policy.</p>
    </div>
  );
}
