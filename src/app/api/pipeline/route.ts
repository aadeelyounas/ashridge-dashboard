export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pipelineItems, contentQueue } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const [pipeline, queue] = await Promise.all([
      db.select().from(pipelineItems).orderBy(pipelineItems.id),
      db.select().from(contentQueue).orderBy(contentQueue.id),
    ]);
    return NextResponse.json({ pipeline, queue });
  } catch (e) {
    console.error("pipeline GET error:", e);
    return NextResponse.json({ error: "Failed to fetch pipeline" }, { status: 500 });
  }
}
