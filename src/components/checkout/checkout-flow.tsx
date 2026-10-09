"use client";

/**
 * CheckoutFlow — the reference's 3-step wizard: Shipping Information →
 * Payment Method → Review & Place Order, with a sticky Order Summary aside.
 * Submits to the placeOrderAction server action; on success redirects to
 * the confirmation page (superset — the reference returns to home).
 */
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Lock, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { placeOrderAction } from "@/lib/actions/checkout";
import { isPublishableKeyConfigured } from "@/lib/stripe-config";
import type { CartDto } from "@/lib/cart";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { StripeCheckout } from "./stripe-pay";

type Defaults = {
  firstName: string;
  lastName: string;
  email: string;
};

type Step = 1 | 2 | 3;

export function CheckoutFlow({
  cart,
  defaults,
  stripeEnabled = false,
  publishableKey = null,
}: {
  cart: CartDto;
  defaults: Defaults;
  /** PAY-STRIPE-1 (session-22): true only when the server resolved a real
   *  secret — the reference-parity mock wizard stays the DEFAULT (OFF). */
  stripeEnabled?: boolean;
  publishableKey?: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>(1);
  const [state, formAction, pending] = React.useActionState(placeOrderAction, null);
  // The client mirror of the server config check (L16/R8-1: one truth
  // table — the two sides can never disagree).
  const stripeOn = stripeEnabled && isPublishableKeyConfigured(publishableKey);
  const [shipping, setShipping] = React.useState({
    firstName: defaults.firstName,
    lastName: defaults.lastName,
    email: defaults.email,
    address: "",
    city: "",
    state: "",
    zip: "",
  });
  const [payment, setPayment] = React.useState({ method: "card" as "card" | "paypal", cardNumber: "", cardExpiry: "", cardCvc: "" });

  React.useEffect(() => {
    if (state?.ok) {
      router.refresh();
      router.push(`/checkout/success?order=${encodeURIComponent(state.data.orderNumber)}`);
    }
  }, [state, router]);

  const shippingValid =
    shipping.firstName.trim() &&
    shipping.lastName.trim() &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(shipping.email) &&
    shipping.address.trim().length >= 3 &&
    shipping.city.trim().length >= 2 &&
    shipping.state.trim().length >= 2 &&
    /^\d{5}(-\d{4})?$/.test(shipping.zip);

  const cardValid =
    payment.method === "paypal" ||
    (payment.cardNumber.replace(/\D/g, "").length >= 13 &&
      /^\d{2}\/\d{2}$/.test(payment.cardExpiry) &&
      /^\d{3,4}$/.test(payment.cardCvc));

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 19);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
      <div>
        <Link href="/cart" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>

        {step === 1 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>
            <form
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (shippingValid) setStep(2);
              }}
            >
              <div>
                <Label className="mb-2 block" htmlFor="co-first">First Name</Label>
                <Input
                  id="co-first"
                  required
                  value={shipping.firstName}
                  onChange={(e) => setShipping((s) => ({ ...s, firstName: e.target.value }))}
                />
              </div>
              <div>
                <Label className="mb-2 block" htmlFor="co-last">Last Name</Label>
                <Input
                  id="co-last"
                  required
                  value={shipping.lastName}
                  onChange={(e) => setShipping((s) => ({ ...s, lastName: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-2 block" htmlFor="co-email">Email</Label>
                <Input
                  id="co-email"
                  required
                  type="email"
                  value={shipping.email}
                  onChange={(e) => setShipping((s) => ({ ...s, email: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-2 block" htmlFor="co-address">Address</Label>
                <Input
                  id="co-address"
                  required
                  value={shipping.address}
                  onChange={(e) => setShipping((s) => ({ ...s, address: e.target.value }))}
                  placeholder="123 Main St"
                />
              </div>
              <div>
                <Label className="mb-2 block" htmlFor="co-city">City</Label>
                <Input id="co-city" required value={shipping.city} onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block" htmlFor="co-state">State</Label>
                  <Input id="co-state" required value={shipping.state} onChange={(e) => setShipping((s) => ({ ...s, state: e.target.value }))} />
                </div>
                <div>
                  <Label className="mb-2 block" htmlFor="co-zip">ZIP</Label>
                  <Input
                    id="co-zip"
                    required
                    value={shipping.zip}
                    onChange={(e) => setShipping((s) => ({ ...s, zip: e.target.value }))}
                    placeholder="10001"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <Button type="submit" className="rounded-xl h-10 mt-4 sm:col-span-2 sm:w-fit" disabled={!shippingValid}>
                Continue to Payment
              </Button>
            </form>
          </section>
        )}

        {step === 2 && stripeOn && (
          // PAY-STRIPE-1 (session-22): the one-page embedded checkout — the
          // PaymentElement must stay mounted on the same page as the
          // confirm button, so steps 2+3 collapse when the real payment
          // path is live. The mock 3-step wizard below is the DEFAULT
          // (unconfigured) state — untouched reference parity.
          <StripeCheckout
            cart={cart}
            shipping={shipping}
            publishableKey={publishableKey}
            formAction={formAction}
            state={state}
            onBack={() => setStep(1)}
          />
        )}

        {step === 2 && !stripeOn && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Payment Method</h2>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (cardValid) setStep(3);
              }}
            >
              <RadioGroup
                value={payment.method}
                onValueChange={(v) => setPayment((p) => ({ ...p, method: v as "card" | "paypal" }))}
                className="gap-3"
              >
                <label
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors",
                    payment.method === "card" ? "border-primary bg-accent" : "border-border",
                  )}
                >
                  <RadioGroupItem value="card" />
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Credit / Debit Card</span>
                </label>
                <label
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors",
                    payment.method === "paypal" ? "border-primary bg-accent" : "border-border",
                  )}
                >
                  <RadioGroupItem value="paypal" />
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">PayPal</span>
                </label>
              </RadioGroup>

              {payment.method === "card" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-secondary/40">
                  <div className="sm:col-span-2">
                    <Label className="mb-2 block" htmlFor="co-card">Card Number</Label>
                    <Input
                      id="co-card"
                      required
                      value={payment.cardNumber}
                      onChange={(e) => setPayment((p) => ({ ...p, cardNumber: formatCardNumber(e.target.value) }))}
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                      autoComplete="cc-number"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block" htmlFor="co-exp">Expiry</Label>
                    <Input
                      id="co-exp"
                      required
                      value={payment.cardExpiry}
                      onChange={(e) => setPayment((p) => ({ ...p, cardExpiry: formatExpiry(e.target.value) }))}
                      placeholder="MM/YY"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block" htmlFor="co-cvc">CVC</Label>
                    <Input
                      id="co-cvc"
                      required
                      value={payment.cardCvc}
                      onChange={(e) => setPayment((p) => ({ ...p, cardCvc: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                      placeholder="123"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <Button type="button" variant="outline" className="rounded-xl h-10" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" className="rounded-xl h-10" disabled={!cardValid}>
                  Review Order
                </Button>
              </div>
            </form>
          </section>
        )}

        {step === 3 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Review &amp; Place Order</h2>
            <form action={formAction} className="flex flex-col gap-6">
              <input type="hidden" name="firstName" value={shipping.firstName} />
              <input type="hidden" name="lastName" value={shipping.lastName} />
              <input type="hidden" name="email" value={shipping.email} />
              <input type="hidden" name="address" value={shipping.address} />
              <input type="hidden" name="city" value={shipping.city} />
              <input type="hidden" name="state" value={shipping.state} />
              <input type="hidden" name="zip" value={shipping.zip} />
              <input type="hidden" name="paymentMethod" value={payment.method} />
              <input type="hidden" name="cardNumber" value={payment.cardNumber} />
              <input type="hidden" name="cardExpiry" value={payment.cardExpiry} />
              <input type="hidden" name="cardCvc" value={payment.cardCvc} />

              <div className="p-4 rounded-xl bg-secondary/40">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm">Shipping Address</h3>
                  <button type="button" className="text-sm text-primary hover:underline" onClick={() => setStep(1)}>
                    Edit
                  </button>
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
                  <button type="button" className="text-sm text-primary hover:underline" onClick={() => setStep(2)}>
                    Edit
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {payment.method === "card"
                    ? `Card ending in ${payment.cardNumber.replace(/\D/g, "").slice(-4) || "••••"}`
                    : "PayPal"}
                </p>
              </div>

              {state && !state.ok && (
                <p role="alert" className="text-sm text-destructive">
                  {state.error.message}
                </p>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="rounded-xl h-10" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="submit" className="rounded-xl h-10 flex-1" disabled={pending}>
                  <Lock className="h-4 w-4" />
                  {pending ? "Placing Order…" : `Place Order — ${formatCents(cart.total)}`}
                </Button>
              </div>
            </form>
          </section>
        )}
      </div>

      <aside className="p-6 bg-card rounded-2xl border border-border/50 shadow-sm lg:sticky lg:top-32">
        <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
        <div className="flex flex-col gap-3 mb-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="relative shrink-0">
                { }
                <img src={item.image} alt={item.name} className="h-14 w-14 rounded-lg object-cover bg-secondary/30" />
                <Badge className="absolute -top-2 -right-2 h-5 min-w-5 px-1 text-[10px] rounded-full">
                  {item.quantity}
                </Badge>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                <p className="text-xs text-muted-foreground">{formatCents(item.price)}</p>
              </div>
              <span className="text-sm font-medium">{formatCents(item.lineTotal)}</span>
            </div>
          ))}
        </div>
        <Separator className="mb-4" />
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCents(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium">{cart.shipping === 0 ? "Free" : formatCents(cart.shipping)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
            <span>Total</span>
            <span>{formatCents(cart.total)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
