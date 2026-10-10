import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/metadata";
import { AccountTabs, type OrderRow, type AddressRow } from "@/components/account/account-tabs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({ title: "Account", path: "/account" });

export default async function AccountPage() {
  const user = await getCurrentUser();
  // Session-6 (REDIRECT-1): carry the intent — after login the shopper
  // returns here instead of the generic account landing.
  if (!user) redirect("/login?redirect=/account");

  const [orders, addresses] = await Promise.all([
    db.order.findMany({
      where: { userId: user.id },
      orderBy: { placedAt: "desc" },
      include: { items: true },
    }),
    db.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
  ]);

  const orderRows: OrderRow[] = orders.map((o) => ({
    id: o.id,
    number: o.number,
    placedAt: o.placedAt.toISOString(),
    itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
    status: o.status,
    // Session-33 (CUSTOMER-MONEY-1): the money state rides the row — the
    // query already fetches the full order (include: { items: true } on
    // findMany returns every scalar column); the tab composes it through
    // the pure seam.
    paymentStatus: o.paymentStatus,
    total: o.total,
  }));

  const addressRows: AddressRow[] = addresses.map((a) => ({
    id: a.id,
    label: a.label,
    fullName: a.fullName,
    street: a.street,
    city: a.city,
    state: a.state,
    zip: a.zip,
    country: a.country,
    isDefault: a.isDefault,
  }));

  return (
    // session-12 (A11Y-MAIN-1): a <div>, NOT a <main> — the (storefront)
    // layout already renders the page's single <main> landmark (the
    // session-7 contract); a nested pair is invalid HTML and tripped axe's
    // landmark rules. flex-1 is layout-inert here either way (the parent
    // main is not a flex container).
    <div className="flex-1">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>
        <AccountTabs user={user} orders={orderRows} addresses={addressRows} />
      </div>
    </div>
  );
}
