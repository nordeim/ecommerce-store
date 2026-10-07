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
      "Room-filling sound with voice control, multi-room audio, and smart home hub integration built in.",
    features: ["Voice Control", "Multi-Room Audio", "Smart Hub", "360° Sound"],
    isTrending: true,
    isOnSale: true,
    sortOrder: 2,
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
      "Responsive cushioning and breathable knit upper engineered for daily miles and long runs alike.",
    features: ["Boost Midsole", "Primeknit Upper", "Continental Grip", "Energy Return"],
    isTrending: true,
    isOnSale: true,
    sortOrder: 3,
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
      "Brightening serum with 15% stabilized vitamin C, hyaluronic acid, and vitamin E for radiant skin.",
    features: ["15% Vitamin C", "Hyaluronic Acid", "Fragrance-Free", "Dermatologist Tested"],
    isTrending: true,
    isOnSale: true,
    sortOrder: 4,
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
      "Japanese quartz movement, genuine leather strap, and a scratch-resistant sapphire crystal face.",
    features: ["Japanese Quartz", "Sapphire Crystal", "Genuine Leather", "3ATM Water Resistant"],
    isNewArrival: true,
    sortOrder: 5,
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
      "Featherweight titanium frames with polarized UV400 lenses and adjustable silicone nose pads.",
    features: ["Titanium Frame", "Polarized Lenses", "UV400 Protection", "Adjustable Fit"],
    isNewArrival: true,
    isOnSale: true,
    sortOrder: 6,
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
      "22-momme mulberry silk set with a relaxed fit, mother-of-pearl buttons, and a matching pouch.",
    features: ["22-Momme Silk", "Mulberry Silk", "Pajama Pouch", "Machine Washable"],
    isNewArrival: true,
    sortOrder: 7,
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
      "Heavyweight GOTS-certified organic cotton with a boxy fit and dropped shoulders.",
    features: ["GOTS Certified", "240gsm Fabric", "Reinforced Collar", "Eco Dyes"],
    isOnSale: true,
    sortOrder: 8,
  },
  {
    slug: "ceramic-planter",
    name: "Ceramic Planter Set",
    category: "home-living",
    price: 7999,
    compareAtPrice: null,
    rating: 4.7,
    reviewCount: 203,
    badge: null,
    image: `${IMG}/b0af9a447_generated_382e8f30.png`,
    description:
      "Set of three hand-glazed stoneware planters with drainage holes and matching saucers.",
    features: ["Hand Glazed", "Drainage Holes", "Saucers Included", "Frost Resistant"],
    sortOrder: 9,
  },
  {
    slug: "linen-blanket",
    name: "Linen Throw Blanket",
    category: "home-living",
    price: 8999,
    compareAtPrice: null,
    rating: 4.8,
    reviewCount: 167,
    badge: null,
    image: `${IMG}/37a728d86_generated_eb83b916.png`,
    description:
      "Stonewashed European flax linen throw that breathes in summer and insulates in winter.",
    features: ["European Flax", "Stonewashed", "OEKO-TEX", "Gets Softer Over Time"],
    sortOrder: 10,
  },
  {
    slug: "yoga-mat",
    name: "Yoga Mat Premium",
    category: "sports",
    price: 6999,
    compareAtPrice: null,
    rating: 4.6,
    reviewCount: 341,
    badge: null,
    image: `${IMG}/b255626cd_generated_8b3963ae.png`,
    description:
      "6mm natural rubber mat with an anti-slip microfiber surface and alignment guides.",
    features: ["Natural Rubber", "6mm Cushioning", "Alignment Guides", "Carry Strap"],
    sortOrder: 11,
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
      "15W fast wireless charger with a non-slip surface and foreign-object detection.",
    features: ["15W Fast Charge", "Qi Certified", "Slim Design", "LED Indicator"],
    isOnSale: true,
    sortOrder: 12,
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
    };
    await db.product.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data } });
  }

  // ---- Demo user (john@example.com — the reference account persona) --------
  const demoHash = scryptHash("Demo1234!");
  const demo = await db.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      email: "john@example.com",
      passwordHash: demoHash,
      name: "John Doe",
      firstName: "John",
      lastName: "Doe",
      phone: "+1 (555) 123-4567",
      role: "user",
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
    update: { role: "admin" },
    create: {
      email: "admin@luxestore.com",
      passwordHash: scryptHash("Admin1234!"),
      name: "Store Admin",
      firstName: "Store",
      lastName: "Admin",
      role: "admin",
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
