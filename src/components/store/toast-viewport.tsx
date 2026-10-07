"use client";

/**
 * ToastViewport — the reference's add-to-cart / add-to-wishlist toast
 * subsystem (session-4, TOAST-1). Anatomy captured live 2026-10-07:
 *
 *   region: div.fixed.bottom-6.right-6.z-[100].flex.flex-col.gap-2
 *   item:   div.bg-foreground.text-background.px-4.py-3.rounded-xl.shadow-2xl
 *           .flex.items-center.gap-2.text-sm.font-medium.max-w-xs
 *   icon:   lucide CircleCheckBig, h-4 w-4 text-primary shrink-0
 *   copy:   "«Product name» added to cart!" / "… added to wishlist!"
 *
 * Timing: 3000ms auto-dismiss (measured 3.35s end-to-end incl. render);
 * enter springs from opacity-0 / translateY(16px) scale(0.96) — approximated
 * with a bouncy CSS bezier via @starting-style (the reference uses a JS
 * spring); exit rises to translateY(-10px) scale(0.95) then unmounts.
 * Rapid adds stack without dedupe (verified live).
 *
 * Deliberate divergences (registered in AGENTS.md): the region is
 * pointer-events-none (the reference's toasts are inert on click — verified
 * — and click-through keeps the fixed overlay from eating drawer-Checkout
 * clicks) and carries aria-live="polite" (a11y superset).
 */
import { CircleCheckBig } from "lucide-react";

export type ToastItem = {
  id: number;
  message: string;
  exiting: boolean;
};

export function ToastViewport({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-item bg-foreground text-background px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-medium max-w-xs${t.exiting ? " toast-exiting" : ""}`}
        >
          <CircleCheckBig className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          {t.message}
        </div>
      ))}
    </div>
  );
}
