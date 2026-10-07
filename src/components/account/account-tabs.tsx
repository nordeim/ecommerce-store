"use client";

/**
 * AccountTabs — the account dashboard: Profile / Orders / Addresses /
 * Settings. Byte-parity with the reference (pill TabsList, Personal
 * Information card with avatar block, order history rows with status
 * badges, address cards with Default badge, password form).
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SessionUser } from "@/lib/auth";
import { changePasswordAction, saveAddressAction, updateProfileAction } from "@/lib/actions/account";
import { logoutAction, type ActionResult } from "@/lib/actions/auth";
import { useStore } from "@/components/store/store-provider";
import { formatCents } from "@/lib/money";

export type OrderRow = {
  id: string;
  number: string;
  placedAt: string;
  itemCount: number;
  status: string;
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

const STATUS_STYLES: Record<string, string> = {
  delivered: "bg-emerald-100 text-emerald-700",
  in_transit: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  delivered: "Delivered",
  in_transit: "In Transit",
  processing: "Processing",
  cancelled: "Cancelled",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
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
    <Tabs defaultValue="profile" className="space-y-6">
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

      <TabsContent value="profile" className="mt-2">
        <div className="border bg-card text-card-foreground shadow rounded-2xl">
          <div className="flex flex-col space-y-1.5 p-6">
            <div className="font-semibold leading-none tracking-tight">Personal Information</div>
          </div>
          <div className="p-6 pt-0 space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-semibold text-primary">
                {initials(user.name)}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <form action={profileAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block" htmlFor="acc-first">First Name</Label>
                <Input id="acc-first" name="firstName" defaultValue={user.firstName ?? ""} required />
                {fieldError(profileState, "firstName") && (
                  <p className="text-xs text-destructive mt-1">{fieldError(profileState, "firstName")}</p>
                )}
              </div>
              <div>
                <Label className="mb-2 block" htmlFor="acc-last">Last Name</Label>
                <Input id="acc-last" name="lastName" defaultValue={user.lastName ?? ""} required />
                {fieldError(profileState, "lastName") && (
                  <p className="text-xs text-destructive mt-1">{fieldError(profileState, "lastName")}</p>
                )}
              </div>
              <div>
                <Label className="mb-2 block" htmlFor="acc-email">Email</Label>
                <Input id="acc-email" name="email" type="email" defaultValue={user.email} required />
                {fieldError(profileState, "email") && (
                  <p className="text-xs text-destructive mt-1">{fieldError(profileState, "email")}</p>
                )}
              </div>
              <div>
                <Label className="mb-2 block" htmlFor="acc-phone">Phone</Label>
                <Input id="acc-phone" name="phone" defaultValue={user.phone ?? ""} placeholder="+1 (555) 123-4567" />
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
              <Button type="submit" className="rounded-xl mt-4 sm:col-span-2 sm:w-fit" disabled={profilePending}>
                {profilePending ? "Saving…" : "Save Changes"}
              </Button>
            </form>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="orders" className="mt-2">
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
              <div className="flex flex-col gap-3">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{o.number}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(o.placedAt)} · {o.itemCount} {o.itemCount === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          STATUS_STYLES[o.status] ?? "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {STATUS_LABELS[o.status] ?? o.status}
                      </span>
                      <span className="font-semibold">{formatCents(o.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="addresses" className="mt-2">
        <div className="border bg-card text-card-foreground shadow rounded-2xl">
          <div className="flex items-center justify-between p-6">
            <div className="font-semibold leading-none tracking-tight">Saved Addresses</div>
            <Button
              size="sm"
              className="rounded-xl"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      {a.isDefault && <Badge className="rounded-full">Default</Badge>}
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">{a.label}</span>
                    </div>
                    <p className="font-medium">{a.fullName}</p>
                    <p className="text-sm text-muted-foreground">{a.street}</p>
                    <p className="text-sm text-muted-foreground">
                      {a.city}, {a.state} {a.zip}
                    </p>
                    <p className="text-sm text-muted-foreground">{a.country}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl mt-3"
                      onClick={() => {
                        setEditingAddress(a);
                        setShowAddressForm(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="settings" className="mt-2">
        <div className="flex flex-col gap-6">
          <div className="border bg-card text-card-foreground shadow rounded-2xl">
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="font-semibold leading-none tracking-tight">Account Settings</div>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <form action={passwordAction} className="grid grid-cols-1 gap-4 max-w-md">
                <div>
                  <Label className="mb-2 block" htmlFor="acc-cp">Current Password</Label>
                  <Input id="acc-cp" name="currentPassword" type="password" autoComplete="current-password" required />
                  {fieldError(passwordState, "currentPassword") && (
                    <p className="text-xs text-destructive mt-1">{fieldError(passwordState, "currentPassword")}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-2 block" htmlFor="acc-np">New Password</Label>
                  <Input id="acc-np" name="newPassword" type="password" autoComplete="new-password" required />
                  {fieldError(passwordState, "newPassword") && (
                    <p className="text-xs text-destructive mt-1">{fieldError(passwordState, "newPassword")}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-2 block" htmlFor="acc-cfp">Confirm Password</Label>
                  <Input id="acc-cfp" name="confirmPassword" type="password" autoComplete="new-password" required />
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
                <Button type="submit" className="rounded-xl w-fit" disabled={passwordPending}>
                  {passwordPending ? "Updating…" : "Update Password"}
                </Button>
              </form>

              <div className="pt-6 border-t border-border">
                <h3 className="font-semibold mb-1">Notifications</h3>
                <p className="text-sm text-muted-foreground">Email notification preferences coming soon.</p>
              </div>

              <div className="pt-6 border-t border-border flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Session</h3>
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
