export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agentActivity, agentStatus } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const [activity, status] = await Promise.all([
      db.select().from(agentActivity).orderBy(desc(agentActivity.ranAt)).limit(50),
      db.select().from(agentStatus),
    ]);
    return NextResponse.json({ activity, status });
  } catch (e) {
    console.error("agents GET error:", e);
    return NextResponse.json({ error: "Failed to fetch agent data" }, { status: 500 });
  }
}
