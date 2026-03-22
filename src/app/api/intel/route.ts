export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { intelItems } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(intelItems)
      .orderBy(desc(intelItems.recordedAt));
    return NextResponse.json(rows);
  } catch (e) {
    console.error("intel GET error:", e);
    return NextResponse.json({ error: "Failed to fetch intel items" }, { status: 500 });
  }
}
