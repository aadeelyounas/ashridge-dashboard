export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { localSeoTracker } from "@/lib/schema";

export async function GET() {
  try {
    const rows = await db.select().from(localSeoTracker);
    return NextResponse.json(rows);
  } catch (e) {
    console.error("seo GET error:", e);
    return NextResponse.json({ error: "Failed to fetch local SEO data" }, { status: 500 });
  }
}
