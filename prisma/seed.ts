/**
 * LUXE Store — idempotent seed.
 *
 * Natural-key upserts only: running it twice produces the same state.
 * Demo fixtures mirror the reference storefront so the account dashboard
 * renders the same order history (ORD-2026-001/002/003) after login.
 *
 * Run: bun prisma/seed.ts   (or: bun run db:seed)
 */
import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { scryptHash } from "../src/lib/password";
import { hashResetToken } from "../src/lib/reset-token";

const db = new PrismaClient();

const CATEGORIES = [
  { slug: "electronics", name: "Electronics", icon: "Monitor", sortOrder: 1 },
  { slug: "clothing", name: "Clothing", icon: "Shirt", sortOrder: 2 },
  { slug: "home-living", name: "Home & Living", icon: "Sofa", sortOrder: 3 },
  { slug: "accessories", name: "Accessories", icon: "Watch", sortOrder: 4 },
  { slug: "sports", name: "Sports", icon: "Dumbbell", sortOrder: 5 },
  { slug: "beauty", name: "Beauty", icon: "Sparkles", sortOrder: 6 },
];

const IMG = "https://media.base44.com/images/public/69d296f5d1237b9a1afec899";

// Prices in CENTS. compareAtPrice drives the "-N%" destructive badge.
const PRODUCTS = [
  {
    slug: "wireless-headphones",
    name: "Wireless Noise-Cancelling Headphones",
    category: "electronics",
    price: 29999,
    compareAtPrice: 39999,
    rating: 4.8,
    reviewCount: 234,
    badge: "Best Seller",
    image: `${IMG}/54a27de93_generated_4ebfd375.png`,
    description:
      "Premium over-ear headphones with active noise cancellation, 30-hour battery life, and superior sound quality.",
    features: ["Active Noise Cancellation", "30hr Battery", "Bluetooth 5.3", "Hi-Res Audio"],
    isTrending: true,
    isOnSale: true,
    sortOrder: 1,
    createdAt: new Date("2026-01-01T00:00:00Z"),
  },
  {
    slug: "smart-speaker",
    name: "Smart Home Speaker Pro",
    category: "electronics",
    price: 19999,
    compareAtPrice: 24999,
    rating: 4.7,
    reviewCount: 489,
    badge: "Top Rated",
    image: `${IMG}/bd2ea109c_generated_1e68b900.png`,
    description:
      "Room-filling sound with smart assistant integration. Control your smart home devices with your voice.",
    features: ["Voice Control", "Multi-Room Audio", "Smart Hub", "360° Sound"],
    isTrending: true,
    isOnSale: true,
    sortOrder: 4,
    createdAt: new Date("2026-01-04T00:00:00Z"),
  },
  {
    slug: "running-shoes",
    name: "Running Shoes Ultra Boost",
    category: "sports",
    price: 15999,
    compareAtPrice: 19999,
    rating: 4.6,
    reviewCount: 678,
    badge: "Popular",
    image: `${IMG}/c61ba8f28_generated_2c485dc5.png`,
    description:
      "Lightweight and responsive running shoes with energy-return technology and breathable mesh.",
    features: ["Boost Midsole", "Primeknit Upper", "Continental Grip", "Energy Return"],
    isTrending: true,
    isOnSale: true,
    sortOrder: 6,
    createdAt: new Date("2026-01-06T00:00:00Z"),
  },
  {
    slug: "vitamin-c-serum",
    name: "Vitamin C Serum",
    category: "beauty",
    price: 3499,
    compareAtPrice: 4499,
    rating: 4.8,
    reviewCount: 1023,
    badge: "Best Seller",
    image: `${IMG}/48e92ee9a_generated_9eb9d832.png`,
    description:
      "Brightening vitamin C serum with hyaluronic acid. Reduces dark spots for a radiant glow.",
    features: ["15% Vitamin C", "Hyaluronic Acid", "Fragrance-Free", "Dermatologist Tested"],
    isTrending: true,
    isOnSale: true,
    sortOrder: 7,
    createdAt: new Date("2026-01-07T00:00:00Z"),
  },
  {
    slug: "leather-watch",
    name: "Minimalist Leather Watch",
    category: "accessories",
    price: 18900,
    compareAtPrice: null,
    rating: 4.6,
    reviewCount: 156,
    badge: "New",
    image: `${IMG}/4cadd0e2a_generated_a024aace.png`,
    description:
      "Elegant minimalist watch with genuine Italian leather strap and sapphire crystal glass.",
    features: ["Japanese Quartz", "Sapphire Crystal", "Genuine Leather", "3ATM Water Resistant"],
    isNewArrival: true,
    sortOrder: 2,
    createdAt: new Date("2026-01-02T00:00:00Z"),
  },
  {
    slug: "titanium-sunglasses",
    name: "Titanium Sunglasses",
    category: "accessories",
    price: 24500,
    compareAtPrice: 29500,
    rating: 4.5,
    reviewCount: 98,
    badge: "Premium",
    image: `${IMG}/5ac8bff54_generated_1c8c7fa9.png`,
    description:
      "Ultra-lightweight titanium frame sunglasses with polarized lenses and UV400 protection.",
    features: ["Titanium Frame", "Polarized Lenses", "UV400 Protection", "Adjustable Fit"],
    isNewArrival: true,
    isOnSale: true,
    sortOrder: 9,
    createdAt: new Date("2026-01-09T00:00:00Z"),
  },
  {
    slug: "silk-pajama",
    name: "Silk Pajama Set",
    category: "clothing",
    price: 12999,
    compareAtPrice: null,
    rating: 4.9,
    reviewCount: 189,
    badge: "Luxury",
    image: `${IMG}/445ef9ef5_generated_71e55ada.png`,
    description:
      "Pure mulberry silk pajama set for ultimate comfort and luxury. Gift box included.",
    features: ["22-Momme Silk", "Mulberry Silk", "Pajama Pouch", "Machine Washable"],
    isNewArrival: true,
    sortOrder: 12,
    createdAt: new Date("2026-01-12T00:00:00Z"),
  },
  {
    slug: "organic-cotton-tee",
    name: "Organic Cotton Oversized Tee",
    category: "clothing",
    price: 4999,
    compareAtPrice: 6999,
    rating: 4.5,
    reviewCount: 312,
    badge: "Eco",
    image: `${IMG}/9204df901_generated_29256073.png`,
    description:
      "Ultra-soft organic cotton t-shirt with a relaxed oversized fit. Sustainably sourced.",
    features: ["GOTS Certified", "240gsm Fabric", "Reinforced Collar", "Eco Dyes"],
    isOnSale: true,
    sortOrder: 3,
    createdAt: new Date("2026-01-03T00:00:00Z"),
  },
  {
    slug: "ceramic-planter",
    name: "Ceramic Planter Set",
    category: "home-living",
    price: 7999,
    compareAtPrice: null,
    rating: 4.9,
    reviewCount: 87,
    badge: null,
    image: `${IMG}/b0af9a447_generated_382e8f30.png`,
    description:
      "Set of 3 handcrafted ceramic planters in varying sizes. Perfect for succulents and herbs.",
    features: ["Hand Glazed", "Drainage Holes", "Saucers Included", "Frost Resistant"],
    sortOrder: 5,
    createdAt: new Date("2026-01-05T00:00:00Z"),
  },
  {
    slug: "linen-blanket",
    name: "Linen Throw Blanket",
    category: "home-living",
    price: 8999,
    compareAtPrice: null,
    rating: 4.7,
    reviewCount: 145,
    badge: null,
    image: `${IMG}/37a728d86_generated_eb83b916.png`,
    description:
      "Luxuriously soft linen throw blanket, naturally temperature-regulating and machine washable.",
    features: ["European Flax", "Stonewashed", "OEKO-TEX", "Gets Softer Over Time"],
    sortOrder: 8,
    createdAt: new Date("2026-01-08T00:00:00Z"),
  },
  {
    slug: "yoga-mat",
    name: "Yoga Mat Premium",
    category: "sports",
    price: 6999,
    compareAtPrice: null,
    rating: 4.8,
    reviewCount: 267,
    badge: null,
    image: `${IMG}/b255626cd_generated_8b3963ae.png`,
    description:
      "Extra-thick premium yoga mat with alignment lines and non-slip surface.",
    features: ["Natural Rubber", "6mm Cushioning", "Alignment Guides", "Carry Strap"],
    sortOrder: 10,
    createdAt: new Date("2026-01-10T00:00:00Z"),
  },
  {
    slug: "charging-pad",
    name: "Wireless Charging Pad",
    category: "electronics",
    price: 3999,
    compareAtPrice: 5999,
    rating: 4.4,
    reviewCount: 512,
    badge: "Sale",
    image: `${IMG}/23b88426a_generated_16dbaa9a.png`,
    description:
      "Fast wireless charging pad compatible with all Qi-enabled devices with LED indicator.",
    features: ["15W Fast Charge", "Qi Certified", "Slim Design", "LED Indicator"],
    isOnSale: true,
    sortOrder: 11,
    createdAt: new Date("2026-01-11T00:00:00Z"),
  },
];

const HERO_SLIDES = [
  {
    promo: "Up to 40% Off",
    title: "Spring Collection 2026",
    subtitle: "Discover the latest trends in fashion and lifestyle",
    cta: "Shop Now",
    href: "/shop",
    image: `${IMG}/7cfe01108_generated_076a6d07.png`,
  },
  {
    promo: "New Arrivals",
    title: "Tech Essentials",
    subtitle: "Premium gadgets for modern living",
    cta: "Explore",
    href: "/shop?category=electronics",
    image: `${IMG}/f0ae76854_generated_31ca432d.png`,
  },
  {
    promo: "Free Shipping",
    title: "Home & Comfort",
    subtitle: "Transform your living space with curated pieces",
    cta: "Browse",
    href: "/shop?category=home-living",
    image: `${IMG}/54a27de93_generated_4ebfd375.png`,
  },
];

async function main() {
  // ---- Categories (natural key: slug) --------------------------------------
  const catIds = new Map<string, string>();
  for (const c of CATEGORIES) {
    const row = await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon, sortOrder: c.sortOrder },
      create: c,
    });
    catIds.set(c.slug, row.id);
  }

  // ---- Products (natural key: slug) ----------------------------------------
  for (const p of PRODUCTS) {
    const data = {
      name: p.name,
      description: p.description,
      categoryId: catIds.get(p.category)!,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      rating: p.rating,
      reviewCount: p.reviewCount,
      badge: p.badge,
      image: p.image,
      features: JSON.stringify(p.features),
      stock: 25,
      isTrending: p.isTrending ?? false,
      isNewArrival: p.isNewArrival ?? false,
      isOnSale: p.isOnSale ?? false,
      isActive: true,
      sortOrder: p.sortOrder,
      createdAt: p.createdAt,
    };
    await db.product.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data } });
  }

  // ---- Demo user (john@example.com — the reference account persona) --------
  const demoHash = scryptHash("Demo1234!");
  const demo = await db.user.upsert({
    where: { email: "john@example.com" },
    // Session-4: seeded accounts are pre-verified (they predate the
    // verification gate; an unverified demo user would lock the demo).
    update: { emailVerified: true },
    create: {
      email: "john@example.com",
      passwordHash: demoHash,
      name: "John Doe",
      firstName: "John",
      lastName: "Doe",
      phone: "+1 (555) 123-4567",
      role: "user",
      emailVerified: true,
    },
  });

  await db.address.upsert({
    where: { id: "demo-address-main" },
    update: {},
    create: {
      id: "demo-address-main",
      userId: demo.id,
      label: "Home",
      fullName: "John Doe",
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "United States",
      isDefault: true,
    },
  });

  // ---- Admin user (superset: staff console) --------------------------------
  await db.user.upsert({
    where: { email: "admin@luxestore.com" },
    update: { role: "admin", emailVerified: true },
    create: {
      email: "admin@luxestore.com",
      passwordHash: scryptHash("Admin1234!"),
      name: "Store Admin",
      firstName: "Store",
      lastName: "Admin",
      role: "admin",
      emailVerified: true,
    },
  });

  // ---- Unverified fixture (session-4, AUTH-VERIFY-1) -----------------------
  // A deterministic 6-digit code (123456) so E2E can drive the verify-email
  // happy path WITHOUT the AUTH_REQUIRE_EMAIL_VERIFICATION flag: the screen
  // and verifyEmailAction work regardless of the gate. The upsert always
  // refreshes the hash + expiry so repeated seeds never go stale.
  await db.user.upsert({
    where: { email: "unverified@example.com" },
    update: {
      passwordHash: demoHash,
      emailVerified: false,
      verificationHash: scryptHash("123456"),
      verificationExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      verificationAttempts: 0,
    },
    create: {
      email: "unverified@example.com",
      passwordHash: demoHash,
      name: "Unverified Fixture",
      emailVerified: false,
      verificationHash: scryptHash("123456"),
      verificationExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      verificationAttempts: 0,
    },
  });

  // ---- Reset fixture (session-20, RESET-ROUTE-1) ----------------------------
  // A dedicated user whose password the reset spec rotates (john@example.com
  // stays untouched so the demo/storageState login budget is unaffected —
  // the login rate limit is keyed per IP+email). Carries the deterministic
  // token "reset-fixture-token" (scrypt-hashed) so E2E can drive the
  // /reset-password?token= happy path without the email seam.
  const resetHash = scryptHash("Reset1234!");
  await db.user.upsert({
    where: { email: "resetuser@example.com" },
    update: { passwordHash: resetHash },
    create: {
      email: "resetuser@example.com",
      passwordHash: resetHash,
      name: "Reset Fixture",
    },
  });
  await db.passwordResetToken.deleteMany({ where: {} });
  await db.passwordResetToken.create({
    data: {
      tokenHash: hashResetToken("reset-fixture-token"),
      userId: (
        await db.user.findUnique({
          where: { email: "resetuser@example.com" },
          select: { id: true },
        })
      )!.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  // ---- Demo order history (mirrors the reference account page) -------------
  const bySlug = new Map<string, { id: string; price: number; name: string; image: string }>();
  for (const p of PRODUCTS) {
    const row = await db.product.findUnique({ where: { slug: p.slug } });
    if (row) bySlug.set(p.slug, { id: row.id, price: row.price, name: row.name, image: row.image });
  }

  const demoOrders = [
    {
      number: "ORD-2026-001",
      status: "delivered",
      placedAt: new Date("2026-03-28T15:04:05Z"),
      items: [
        { slug: "wireless-headphones", qty: 1 },
        { slug: "organic-cotton-tee", qty: 1 },
      ],
      total: null, // derived from line items
    },
    {
      number: "ORD-2026-002",
      status: "in_transit",
      placedAt: new Date("2026-03-15T10:22:00Z"),
      items: [{ slug: "leather-watch", qty: 1 }],
      total: null,
    },
    {
      number: "ORD-2026-003",
      status: "delivered",
      placedAt: new Date("2026-02-20T18:45:30Z"),
      items: [
        { slug: "smart-speaker", qty: 1 },
        { slug: "titanium-sunglasses", qty: 1 },
        { slug: "ceramic-planter", qty: 1 },
      ],
      // The reference account page renders $524.97 for this order (its mock
      // data); line items sum to 524.98, so the display total is pinned.
      total: 52497,
    },
  ];

  for (const o of demoOrders) {
    const lineData = o.items.map((i) => {
      const p = bySlug.get(i.slug)!;
      return { productId: p.id, nameSnapshot: p.name, imageSnapshot: p.image, unitPrice: p.price, quantity: i.qty };
    });
    const subtotal = o.total ?? lineData.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const existing = await db.order.findUnique({ where: { number: o.number } });
    if (existing) continue;
    await db.order.create({
      data: {
        number: o.number,
        userId: demo.id,
        email: demo.email,
        status: o.status,
        subtotal,
        shipping: 0,
        total: subtotal,
        shippingAddress: JSON.stringify({
          fullName: "John Doe",
          street: "123 Main Street",
          city: "New York",
          state: "NY",
          zip: "10001",
          country: "United States",
        }),
        paymentMethod: "card",
        cardLast4: "4242",
        placedAt: o.placedAt,
        items: { create: lineData },
        events: { create: { type: "placed", note: "Seeded demo order" } },
      },
    });
  }

  // ---- Stripe payment-ops demo fixtures (session-24, PAY-OPS-1) --------
  // ORD-2026-003 doubles as the Stripe-paid demo order (the order-detail
  // Charge row's seeded instance), and the canonical StripeEvent set gives
  // the /admin/payments surface its demo content. The seed SKIPS existing
  // orders, so the paid columns are ALSO restored idempotently below —
  // a DB seeded before session-24 converges on re-run.
  await db.order.update({
    where: { number: "ORD-2026-003" },
    data: {
      stripePaymentIntentId: "pi_demo_fixture_003",
      paymentStatus: "paid",
    },
  });
  const stripeEvents = [
    {
      eventId: "evt_demo_fixture_s",
      type: "payment_intent.succeeded",
      paymentIntentId: "pi_demo_fixture_003",
      // ORD-2026-003's pinned display total — the placed row's magnitude.
      amount: 52497,
      receivedAt: new Date("2026-02-20T18:45:40Z"),
    },
    {
      eventId: "evt_demo_fixture_f",
      type: "payment_intent.payment_failed",
      paymentIntentId: "pi_demo_fixture_004",
      // The attempted amount (minor units).
      amount: 8999,
      receivedAt: new Date("2026-02-21T09:12:00Z"),
    },
    {
      eventId: "evt_demo_fixture_r",
      type: "charge.refunded",
      paymentIntentId: "pi_demo_fixture_005",
      // The refunded amount (minor units).
      amount: 7999,
      receivedAt: new Date("2026-02-22T14:03:00Z"),
    },
    {
      // Session-25, PAY-OPS-2a: the refund-needed family's seeded instance
      // — a succeeded event with NO linked order (exactly the
      // deterministic-failure shape the webhook records + 200s per
      // ADR-031). The family filter's demonstrability fixture.
      // Session-30, REASON-TRAIL-1: the row carries the canonical
      // deterministic-failure code — the coherent story for a $149.00
      // succeeded intent with NO order is an amount mismatch (the webhook
      // refused a payment that did not match the server-derived cart) —
      // so the payments surface renders the family's WHY.
      eventId: "evt_demo_fixture_n",
      type: "payment_intent.succeeded",
      paymentIntentId: "pi_demo_fixture_006",
      amount: 14900,
      failureReason: "amount-mismatch",
      receivedAt: new Date("2026-02-23T11:27:00Z"),
    },
  ];
  for (const e of stripeEvents) {
    await db.stripeEvent.upsert({
      where: { eventId: e.eventId },
      create: e,
      update: e,
    });
  }

  const counts = {
    categories: await db.category.count(),
    products: await db.product.count(),
    users: await db.user.count(),
    orders: await db.order.count(),
  };
  console.log("[seed] done:", counts, "hero slides:", HERO_SLIDES.length);
  console.log("[seed] demo login: john@example.com / Demo1234!");
  console.log("[seed] admin login: admin@luxestore.com / Admin1234!");
}

main()
  .catch((e) => {
    console.error("[seed] failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
