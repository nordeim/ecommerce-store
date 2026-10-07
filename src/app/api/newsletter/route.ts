import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Newsletter subscribe — POST /api/newsletter { email }
 * Zod-validated, rate-limited (10/10min/IP), idempotent upsert.
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  const rl = rateLimit(`newsletter:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, message: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid email address." },
      { status: 400 },
    );
  }

  try {
    await db.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      update: {},
      create: { email: parsed.data.email },
    });
    return NextResponse.json({ ok: true, message: "Thanks for subscribing!" });
  } catch (e) {
    console.error("[newsletter]", e);
    return NextResponse.json({ ok: false, message: "Could not subscribe. Please try again." }, { status: 500 });
  }
}
