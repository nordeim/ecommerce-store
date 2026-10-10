"use client";

/**
 * StripeCheckout — the combined "Payment & Review" island (session-22,
 * PAY-STRIPE-1), mounted ONLY when Stripe is configured (the checkout page
 * resolves the env server-side and passes the flag + publishable key; the
 * isPublishableKeyConfigured mirror keeps the two sides in agreement).
 *
 * The one-page embedded checkout (Stripe's own recommended pattern — the
 * PaymentElement must stay mounted on the same page as the confirm button,
 * so steps 2+3 collapse into this panel when the real payment path is
 * live). The reference's resting wizard (mock card fields, 3 steps) is the
 * DEFAULT unconfigured state and is untouched — this surface is the
 * superset activation, visually harmonized with the same anatomy:
 * - the reference's radio pair (Credit/Debit Card + PayPal) with the same
 *   label classes,
 * - the mock card form's container (p-4 rounded-xl bg-secondary/40),
 * - the step-3 review cards (bg-secondary/40, Edit links),
 * - the Payment Element themed to the site tokens (the pinned v3 radius,
 *   the theme orange, the destructive red, Plus Jakarta Sans).
 *
 * Card data NEVER touches this app (PCI SAQ-A): the element is a Stripe
 * iframe; the only values that cross are the clientSecret (mount) and the
 * confirmed PaymentIntent id (placement).
 */
import * as React from "react";
// /pure — the LAZY loader entry: @stripe/stripe-js's DEFAULT module eagerly
// injects js.stripe.com/<train>/stripe.js at module-evaluation time (a
// Promise.resolve().then(getStripePromise()) at module scope — measured
// live: a third-party request fired on EVERY /checkout load, unconfigured).
// The /pure entry fetches ONLY when loadStripe(pk) is actually called —
// zero Stripe traffic unless the payment path is live. (The type-only
// import below stays on the default entry — types are erased at compile.)
import { loadStripe } from "@stripe/stripe-js/pure";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { CreditCard, Lock, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createPaymentIntentAction, type PaymentIntentSession } from "@/lib/actions/stripe";
import { isPublishableKeyConfigured } from "@/lib/stripe-config";
import type { CartDto } from "@/lib/cart";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/actions/auth";

type Shipping = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
};

// The site tokens, as hex, for the Element's iframe styling (the iframe
// cannot read the page's CSS — Stripe's appearance variables are the only
// channel). Mapped from src/app/globals.css @theme inline:
//   --color-primary: hsl(24 80% 50%) → #e66b1a
//   --color-foreground: hsl(240 10% 10%) → #1a1a1b
//   --color-card: hsl(0 0% 100%) → #ffffff
//   --color-muted-foreground: hsl(240 4% 46%) → #71717b
//   --color-destructive: hsl(0 84% 60%) → #ef4444 (the measured heart pin)
//   radius: the pinned v3 --radius-xl (12px)
const ELEMENT_APPEARANCE: StripeElementsOptions["appearance"] = {
  theme: "flat",
  variables: {
    colorPrimary: "#e66b1a",
    colorBackground: "#ffffff",
    colorText: "#1a1a1b",
    colorTextSecondary: "#71717b",
    colorDanger: "#ef4444",
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    borderRadius: "12px",
    spacingUnit: "4px",
  },
};

export function StripeCheckout({
  cart,
  shipping,
  publishableKey,
  formAction,
  state,
  onBack,
}: {
  cart: CartDto;
  shipping: Shipping;
  publishableKey: string | null;
  formAction: (formData: FormData) => void | Promise<void>;
  state: ActionResult<{ orderNumber: string; viewToken: string }> | null;
  onBack: () => void;
}) {
  const [method, setMethod] = React.useState<"card" | "paypal">("card");
  const [session, setSession] = React.useState<PaymentIntentSession | null>(null);
  const [sessionError, setSessionError] = React.useState<string | null>(null);

  // Adjust-state-during-render (the StoreProvider re-sync pattern — the
  // React Compiler forbids synchronous setState in effects): when the
  // placement rejects a STALE intent (the cart changed since the mint),
  // clear the session during render so the "Preparing…" state shows; the
  // mint effect below re-runs (session === null) and re-mints with the
  // fresh cart.
  const [lastSeenPlacement, setLastSeenPlacement] = React.useState(state);
  if (state !== lastSeenPlacement) {
    setLastSeenPlacement(state);
    if (state && !state.ok && /changed/i.test(state.error.message) && session !== null) {
      setSession(null);
    }
  }

  // The mint (mount + re-mint): the PaymentIntent is server-minted with
  // the deterministic idempotency key — re-mounts reuse the SAME intent;
  // the amount-mismatch retry lands here with a fresh cart → a fresh key
  // → a fresh amount. All setState calls live in the async callback (the
  // compiler-legal form).
  React.useEffect(() => {
    if (session !== null || sessionError !== null) return;
    let cancelled = false;
    createPaymentIntentAction({ ...shipping }).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setSession(result.data);
      } else {
        setSessionError(result.error.message);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session, sessionError, shipping]);

  const stripePromise = React.useMemo(
    () => (isPublishableKeyConfigured(publishableKey) ? loadStripe(publishableKey) : null),
    [publishableKey],
  );

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Payment &amp; Review</h2>
      <div className="flex flex-col gap-4">
        <RadioGroup
          value={method}
          onValueChange={(v) => setMethod(v as "card" | "paypal")}
          className="gap-3"
        >
          <label
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors",
              method === "card" ? "border-primary bg-accent" : "border-border",
            )}
          >
            <RadioGroupItem value="card" />
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Credit / Debit Card</span>
          </label>
          <label
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors",
              method === "paypal" ? "border-primary bg-accent" : "border-border",
            )}
          >
            <RadioGroupItem value="paypal" />
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">PayPal</span>
          </label>
        </RadioGroup>

        {method === "card" ? (
          stripePromise && session ? (
            <Elements
              key={session.clientSecret}
              stripe={stripePromise}
              options={{ clientSecret: session.clientSecret, appearance: ELEMENT_APPEARANCE }}
            >
              <CardPaymentPanel
                cart={cart}
                shipping={shipping}
                intentId={session.paymentIntentId}
                formAction={formAction}
                state={state}
                onBack={onBack}
              />
            </Elements>
          ) : (
            <div className="p-4 rounded-xl bg-secondary/40 text-sm text-muted-foreground" role="status">
              {sessionError ?? "Preparing secure card payment\u2026"}
              {sessionError && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-3 h-7 rounded-lg text-xs"
                  onClick={() => setSessionError(null)}
                >
                  Try again
                </Button>
              )}
            </div>
          )
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <HiddenCheckoutFields shipping={shipping} paymentMethod="paypal" stripePaymentIntentId="" />
            <ReviewCards shipping={shipping} paymentLabel="PayPal" />
            {state && !state.ok && (
              <p role="alert" className="text-sm text-destructive">
                {state.error.message}
              </p>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="rounded-xl h-10" onClick={onBack}>
                Back
              </Button>
              <Button type="submit" className="rounded-xl h-10 flex-1">
                <Lock className="h-4 w-4" />
                Place Order — {formatCents(cart.total)}
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

/**
 * The card branch — everything inside <Elements>: the PaymentElement
 * (Stripe's iframe — card data never leaves it), the review cards, and the
 * single Pay button that confirms then places.
 */
function CardPaymentPanel({
  cart,
  shipping,
  intentId,
  formAction,
  state,
  onBack,
}: {
  cart: CartDto;
  shipping: Shipping;
  intentId: string;
  formAction: (formData: FormData) => void | Promise<void>;
  state: ActionResult<{ orderNumber: string; viewToken: string }> | null;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const formRef = React.useRef<HTMLFormElement>(null);
  const intentFieldRef = React.useRef<HTMLInputElement>(null);
  const [elementComplete, setElementComplete] = React.useState(false);
  const [payError, setPayError] = React.useState<string | null>(null);
  const [paying, setPaying] = React.useState(false);

  async function handlePay() {
    if (!stripe || !elements) return;
    setPaying(true);
    setPayError(null);
    try {
      // Submit the element's details (validation runs inside the iframe).
      const submitted = await elements.submit();
      if (submitted.error) {
        setPayError(submitted.error.message ?? "Please check your card details.");
        setPaying(false);
        return;
      }
      // Confirm (and, with test cards, capture) — no redirect: we stay to
      // place the order ourselves (the webhook backstop covers a tab death
      // between confirm and place).
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });
      if (error) {
        setPayError(error.message ?? "Your payment could not be completed. Please try again.");
        setPaying(false);
        return;
      }
      if (paymentIntent?.status !== "succeeded") {
        // Additional verification pending (e.g. 3DS redirect flow) — the
        // honest copy; the customer can retry once it settles.
        setPayError("Your payment needs more time to process. Please wait a moment and try again.");
        setPaying(false);
        return;
      }
      // Confirmed: carry the intent id into the placement form via a direct
      // DOM write (deterministic — no state-flush race), then submit.
      if (intentFieldRef.current) intentFieldRef.current.value = paymentIntent.id;
      formRef.current?.requestSubmit();
    } catch {
      setPayError("We could not process your payment. Please try again.");
      setPaying(false);
    }
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <HiddenCheckoutFields shipping={shipping} paymentMethod="card" stripePaymentIntentId={intentId} intentFieldRef={intentFieldRef} />
      <div className="grid grid-cols-1 gap-4 p-4 rounded-xl bg-secondary/40">
        <PaymentElement
          onChange={(e) => setElementComplete(e.complete)}
          options={{ layout: "tabs" }}
        />
      </div>

      <ReviewCards shipping={shipping} paymentLabel="Card (secured by Stripe)" />

      {(payError ?? (state && !state.ok ? state.error.message : null)) && (
        <p role="alert" className="text-sm text-destructive">
          {payError ?? (state && !state.ok ? state.error.message : null)}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="rounded-xl h-10" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          className="rounded-xl h-10 flex-1"
          disabled={paying || !elementComplete || !stripe}
          onClick={() => void handlePay()}
        >
          <Lock className="h-4 w-4" />
          {paying ? "Paying\u2026" : `Pay — ${formatCents(cart.total)}`}
        </Button>
      </div>
    </form>
  );
}

function HiddenCheckoutFields({
  shipping,
  paymentMethod,
  stripePaymentIntentId,
  intentFieldRef,
}: {
  shipping: Shipping;
  paymentMethod: "card" | "paypal";
  stripePaymentIntentId: string;
  intentFieldRef?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      <input type="hidden" name="firstName" value={shipping.firstName} />
      <input type="hidden" name="lastName" value={shipping.lastName} />
      <input type="hidden" name="email" value={shipping.email} />
      <input type="hidden" name="address" value={shipping.address} />
      <input type="hidden" name="city" value={shipping.city} />
      <input type="hidden" name="state" value={shipping.state} />
      <input type="hidden" name="zip" value={shipping.zip} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />
      {/* The confirmed intent id — written by the confirm handler BEFORE
          requestSubmit (direct DOM write, no state race). */}
      <input ref={intentFieldRef} type="hidden" name="stripePaymentIntentId" defaultValue={stripePaymentIntentId} />
    </>
  );
}

function ReviewCards({ shipping, paymentLabel }: { shipping: Shipping; paymentLabel: string }) {
  return (
    <>
      <div className="p-4 rounded-xl bg-secondary/40">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm">Shipping Address</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {shipping.firstName} {shipping.lastName}
          <br />
          {shipping.address}
          <br />
          {shipping.city}, {shipping.state} {shipping.zip}
          <br />
          United States
        </p>
      </div>
      <div className="p-4 rounded-xl bg-secondary/40">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm">Payment</h3>
        </div>
        <p className="text-sm text-muted-foreground">{paymentLabel}</p>
      </div>
    </>
  );
}
