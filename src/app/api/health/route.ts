import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, status: "ok", db: true });
  } catch (e) {
    console.error("[health]", e);
    return NextResponse.json({ ok: false, status: "degraded", db: false }, { status: 503 });
  }
}
