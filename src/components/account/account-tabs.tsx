"use client";

/**
 * AccountTabs — the account dashboard: Profile / Orders / Addresses /
 * Settings. Byte-parity with the reference (pill TabsList, Personal
 * Information card with the User-icon avatar block, order history rows with
 * status badges, address cards with the highlighted Default card, password
 * form under a "Change Password" heading).
 */
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogOut,
  MapPin,
  Package,
  Settings,
  User as UserIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SessionUser } from "@/lib/auth";
import { changePasswordAction, saveAddressAction, updateProfileAction } from "@/lib/actions/account";
import { logoutAction, type ActionResult } from "@/lib/actions/auth";
import { useStore } from "@/components/store/store-provider";
import { formatCents } from "@/lib/money";
// Session-33 (CUSTOMER-MONEY-1): the customer-side money-state seam — the
// order-history row's refund line (pure, unit-pinned).
import { orderRefundLineView } from "@/lib/order-money-state";
// Session-34 (CUSTOMER-ORDER-DETAIL-1): the status vocabulary seam — the
// reference-measured badge classes + labels + the account family's short
// date, extracted from this module so the customer order-detail SERVER
// page shares the single source (a "use client" module's plain-object
// exports are client references — not importable from server components).
import { STATUS_LABELS, STATUS_STYLES, formatOrderDate } from "@/lib/order-status";

export type OrderRow = {
  id: string;
  number: string;
  placedAt: string;
  itemCount: number;
  status: string;
  /** The order's money state (null = the reference-parity demo path). */
  paymentStatus: string | null;
  total: number;
};

export type AddressRow = {
  id: string;
  label: string;
  fullName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
};

// Reference badge anatomy (session-9, ACCOUNT-ORDER-ROW-1): the badge
// vocabulary now lives in the seam module (src/lib/order-status.ts,
// session-34) — STATUS_STYLES + STATUS_LABELS imported above.

function formatDate(iso: string): string {
  return formatOrderDate(iso);
}

export function AccountTabs({
  user,
  orders,
  addresses,
}: {
  user: SessionUser;
  orders: OrderRow[];
  addresses: AddressRow[];
}) {
  const router = useRouter();
  const { setUser } = useStore();
  const [profileState, profileAction, profilePending] = React.useActionState(updateProfileAction, null);
  const [passwordState, passwordAction, passwordPending] = React.useActionState(changePasswordAction, null);
  const [addressState, addressAction, addressPending] = React.useActionState(saveAddressAction, null);
  const [editingAddress, setEditingAddress] = React.useState<AddressRow | null>(null);
  const [showAddressForm, setShowAddressForm] = React.useState(false);

  // Adjust-during-render: when the address action transitions to success,
  // collapse the form (avoids setState-in-effect cascades).
  const [lastAddressState, setLastAddressState] = React.useState(addressState);
  if (addressState !== lastAddressState) {
    setLastAddressState(addressState);
    if (addressState?.ok) {
      setShowAddressForm(false);
      setEditingAddress(null);
    }
  }

  // Refresh server data after successful mutations (external system).
  React.useEffect(() => {
    if (profileState?.ok || addressState?.ok) {
      router.refresh();
    }
  }, [profileState, addressState, router]);

  const fieldError = (state: ActionResult<null> | null, field: string) =>
    state && !state.ok ? state.error.fieldErrors?.[field] : undefined;

  return (
    // NO space-y-* on the Tabs root (session-8, SPACE-TABS-1): v4's
    // space-y-6 lands margin-block-end on the TabsList AND stacks with the
    // TabsContent base mt-6 (margins don't collapse against an inline-flex
    // sibling) — 24+24=48px. The reference renders a 24px gap via v3's
    // margin-top-on-panel; the base mt-6 alone supplies the same 24px here
    // (the PDP tabs work the same way).
    <Tabs defaultValue="profile">
      <TabsList>
        <TabsTrigger value="profile">
          <UserIcon className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="orders">
          <Package className="h-4 w-4" />
          Orders
        </TabsTrigger>
        <TabsTrigger value="addresses">
          <MapPin className="h-4 w-4" />
          Addresses
        </TabsTrigger>
        <TabsTrigger value="settings">
          <Settings className="h-4 w-4" />
          Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <div className="border bg-card text-card-foreground shadow rounded-2xl">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="font-semibold leading-none tracking-tight">Personal Information</div>
          </div>
          <div className="p-6 pt-0 space-y-4">
            <div className="flex items-center gap-4 mb-6">
              {/* Reference parity: the avatar is the lucide User glyph in a
                  bg-primary/10 circle (not initials). */}
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <form action={profileAction}>
              {/* Reference structure (session-9, ACCOUNT-BTN-W-1): the
                  fields live in their OWN grid; the Save button is a FLOW
                  sibling of the grid carrying mt-4 — an inline-flex button
                  in flow sizes to its content on EVERY viewport (mobile
                  127px). The session-8 grid-child approach matched desktop
                  computed values but grid items STRETCH by default, and the
                  sm:col-span-2/sm:w-fit constraints only applied ≥640px —
                  mobile rendered full-width (308px vs the reference's
                  127px). */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  {/* Reference field geometry (session-8, LABEL-BLOCK-1): inline
                      label + Input mt-1.5 — matches the reference's measured 18px
                      inline label line-box and 6px input margin. */}
                  <Label htmlFor="acc-first">First Name</Label>
                  <Input id="acc-first" name="firstName" defaultValue={user.firstName ?? ""} required className="mt-1.5" />
                  {fieldError(profileState, "firstName") && (
                    <p className="text-xs text-destructive mt-1">{fieldError(profileState, "firstName")}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="acc-last">Last Name</Label>
                  <Input id="acc-last" name="lastName" defaultValue={user.lastName ?? ""} required className="mt-1.5" />
                  {fieldError(profileState, "lastName") && (
                    <p className="text-xs text-destructive mt-1">{fieldError(profileState, "lastName")}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="acc-email">Email</Label>
                  <Input id="acc-email" name="email" type="email" defaultValue={user.email} required className="mt-1.5" />
                  {fieldError(profileState, "email") && (
                    <p className="text-xs text-destructive mt-1">{fieldError(profileState, "email")}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="acc-phone">Phone</Label>
                  <Input id="acc-phone" name="phone" defaultValue={user.phone ?? ""} placeholder="+1 (555) 123-4567" className="mt-1.5" />
                </div>
                {profileState && !profileState.ok && !profileState.error.fieldErrors && (
                  <p role="alert" className="text-sm text-destructive col-span-full">
                    {profileState.error.message}
                  </p>
                )}
                {profileState?.ok && (
                  <p role="status" aria-label="Profile saved" className="text-sm text-emerald-600 col-span-full">
                    Profile updated.
                  </p>
                )}
              </div>
              {/* mt-4 (the reference's own class): 16px below the grid on
                  every viewport — a single flow margin, nothing stacks. */}
              <Button type="submit" className="rounded-xl mt-4" disabled={profilePending}>
                {profilePending ? "Saving…" : "Save Changes"}
              </Button>
            </form>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="orders">
        <div className="border bg-card text-card-foreground shadow rounded-2xl">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="font-semibold leading-none tracking-tight">Order History</div>
          </div>
          <div className="p-6 pt-0">
            {orders.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No orders yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => {
                  // Session-33 (CUSTOMER-MONEY-1): the money line — composed
                  // through the pure seam, rendered ONLY when visible (the
                  // calm state: demo-path and paid rows keep the reference's
                  // exact anatomy; only the exceptional money state earns
                  // the line — the alert-fatigue lesson).
                  const money = orderRefundLineView(o.paymentStatus, o.total);
                  return (
                    <div
                      key={o.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-secondary/30 rounded-xl gap-3"
                    >
                      <div>
                        {/* Session-34 (CUSTOMER-ORDER-DETAIL-1): the number
                            is a LINK to the customer order-detail route —
                            the admin-console precedent ("order numbers
                            link to it"). The <p> KEEPS font-semibold and
                            the anchor inherits color/decoration via the
                            Tailwind preflight (`a { color: inherit;
                            text-decoration: inherit }`) — the resting
                            visual is byte-identical (a zero-visual-delta
                            superset affordance, the footer-deep-link
                            precedent; registered in the divergence log). */}
                        <p className="font-semibold">
                          <Link href={`/account/orders/${o.id}`}>{o.number}</Link>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(o.placedAt)} · {o.itemCount} {o.itemCount === 1 ? "item" : "items"}
                        </p>
                        {money.visible && (
                          <p className="text-sm text-muted-foreground">{money.text}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full ${
                            STATUS_STYLES[o.status] ??
                            "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          }`}
                        >
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                        <span className="font-bold">{formatCents(o.total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="addresses">
        <div className="border bg-card text-card-foreground shadow rounded-2xl">
          <div className="space-y-1.5 p-6 flex flex-row items-center justify-between">
            <div className="font-semibold leading-none tracking-tight">Saved Addresses</div>
            {/* Reference: outline "Add New" (transparent, 1px border, 8px
                radius) — NOT the primary fill. */}
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => {
                setEditingAddress(null);
                setShowAddressForm((v) => !v || editingAddress !== null);
              }}
            >
              Add New
            </Button>
          </div>
          <div className="p-6 pt-0">
            {showAddressForm || editingAddress ? (
              <form
                key={editingAddress?.id ?? "new"}
                action={addressAction}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 mb-6 rounded-xl bg-secondary/40"
              >
                <input type="hidden" name="id" value={editingAddress?.id ?? ""} />
                <div>
                  <Label className="mb-2 block" htmlFor="addr-label">Label</Label>
                  <Input id="addr-label" name="label" defaultValue={editingAddress?.label ?? "Home"} required />
                </div>
                <div>
                  <Label className="mb-2 block" htmlFor="addr-name">Full Name</Label>
                  <Input id="addr-name" name="fullName" defaultValue={editingAddress?.fullName ?? user.name} required />
                </div>
                <div className="sm:col-span-2">
                  <Label className="mb-2 block" htmlFor="addr-street">Street Address</Label>
                  <Input id="addr-street" name="street" defaultValue={editingAddress?.street ?? ""} required placeholder="123 Main St" />
                  {fieldError(addressState, "street") && (
                    <p className="text-xs text-destructive mt-1">{fieldError(addressState, "street")}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-2 block" htmlFor="addr-city">City</Label>
                  <Input id="addr-city" name="city" defaultValue={editingAddress?.city ?? ""} required />
                </div>
                <div>
                  <Label className="mb-2 block" htmlFor="addr-state">State</Label>
                  <Input id="addr-state" name="state" defaultValue={editingAddress?.state ?? ""} required />
                </div>
                <div>
                  <Label className="mb-2 block" htmlFor="addr-zip">ZIP Code</Label>
                  <Input id="addr-zip" name="zip" defaultValue={editingAddress?.zip ?? ""} required placeholder="10001" />
                  {fieldError(addressState, "zip") && (
                    <p className="text-xs text-destructive mt-1">{fieldError(addressState, "zip")}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-2 block" htmlFor="addr-country">Country</Label>
                  <Input id="addr-country" name="country" defaultValue={editingAddress?.country ?? "United States"} required />
                </div>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    name="isDefault"
                    defaultChecked={editingAddress?.isDefault ?? addresses.length === 0}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  Set as default address
                </label>
                {addressState && !addressState.ok && (
                  <p role="alert" className="text-sm text-destructive col-span-full">
                    {addressState.error.message}
                  </p>
                )}
                <div className="flex gap-2 sm:col-span-2">
                  <Button type="submit" className="rounded-xl" disabled={addressPending}>
                    {addressPending ? "Saving…" : "Save Address"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddress(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : null}

            {addresses.length === 0 && !showAddressForm ? (
              <div className="py-12 text-center">
                <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No saved addresses yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {addresses.map((a) => (
                  <div
                    key={a.id}
                    className={
                      a.isDefault
                        ? // Reference: the default address is the highlighted
                          // card — 2px primary/20 border over the secondary wash.
                          "p-4 bg-secondary/30 rounded-xl border-2 border-primary/20"
                        : "p-4 rounded-xl border border-border/50"
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        {a.isDefault && <Badge className="rounded-full mb-2">Default</Badge>}
                        <p className="font-medium">{a.fullName}</p>
                        <p className="text-sm text-muted-foreground">{a.street}</p>
                        <p className="text-sm text-muted-foreground">
                          {a.city}, {a.state} {a.zip}
                        </p>
                        <p className="text-sm text-muted-foreground">{a.country}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAddress(a);
                          setShowAddressForm(false);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="settings">
        <div className="flex flex-col gap-6">
          <div className="border bg-card text-card-foreground shadow rounded-2xl">
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="font-semibold leading-none tracking-tight">Account Settings</div>
            </div>
            {/* Reference anatomy: space-y-6 content, "Change Password" h3
                (font-medium mb-2), fields in a space-y-3 max-w-md column
                (labels plain, inputs mt-1.5), a full-width Separator between
                sections. */}
            <div className="p-6 pt-0 space-y-6">
              <div>
                <h3 className="font-medium mb-2">Change Password</h3>
                <form action={passwordAction} className="space-y-3 max-w-md" noValidate>
                  <div>
                    <Label htmlFor="acc-cp">Current Password</Label>
                    <Input id="acc-cp" name="currentPassword" type="password" autoComplete="current-password" required className="mt-1.5" />
                    {fieldError(passwordState, "currentPassword") && (
                      <p className="text-xs text-destructive mt-1">{fieldError(passwordState, "currentPassword")}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="acc-np">New Password</Label>
                    <Input id="acc-np" name="newPassword" type="password" autoComplete="new-password" required className="mt-1.5" />
                    {fieldError(passwordState, "newPassword") && (
                      <p className="text-xs text-destructive mt-1">{fieldError(passwordState, "newPassword")}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="acc-cfp">Confirm Password</Label>
                    <Input id="acc-cfp" name="confirmPassword" type="password" autoComplete="new-password" required className="mt-1.5" />
                    {fieldError(passwordState, "confirmPassword") && (
                      <p className="text-xs text-destructive mt-1">{fieldError(passwordState, "confirmPassword")}</p>
                    )}
                  </div>
                  {passwordState && !passwordState.ok && !passwordState.error.fieldErrors && (
                    <p role="alert" className="text-sm text-destructive">
                      {passwordState.error.message}
                    </p>
                  )}
                  {passwordState?.ok && (
                    <p role="status" aria-label="Password updated" className="text-sm text-emerald-600">
                      Password updated.
                    </p>
                  )}
                  <Button type="submit" className="rounded-xl" disabled={passwordPending}>
                    {passwordPending ? "Updating…" : "Update Password"}
                  </Button>
                </form>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Notifications</h3>
                <p className="text-sm text-muted-foreground">Email notification preferences coming soon.</p>
              </div>

              {/* Superset (documented divergence): the reference has NO logout
                  anywhere on the account page — a production store needs one. */}
              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium mb-2">Session</h3>
                  <p className="text-sm text-muted-foreground">Log out of this device.</p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl gap-2"
                  onClick={async () => {
                    await logoutAction();
                    // The (storefront) layout — and with it the client store
                    // — survives client-side navigation, so clear the user
                    // explicitly or the header keeps the logged-in icon.
                    setUser(null);
                    router.refresh();
                    router.push("/");
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
