export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { geoScores } from "@/lib/schema";

export async function GET() {
  try {
    const rows = await db.select().from(geoScores).orderBy(geoScores.id);
    return NextResponse.json(rows);
  } catch (e) {
    console.error("geo GET error:", e);
    return NextResponse.json({ error: "Failed to fetch geo scores" }, { status: 500 });
  }
}
