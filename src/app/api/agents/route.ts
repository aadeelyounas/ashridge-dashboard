export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agentActivity } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(agentActivity)
      .orderBy(desc(agentActivity.ranAt))
      .limit(50);
    return NextResponse.json(rows);
  } catch (e) {
    console.error("agents GET error:", e);
    return NextResponse.json({ error: "Failed to fetch agent activity" }, { status: 500 });
  }
}
