export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agentActivity } from "@/lib/schema";
import { proxyAuth } from "@/lib/proxy";
import { desc } from "drizzle-orm";

export async function GET(req: Request) {
  const auth = proxyAuth(req);
  if (auth) return auth;
  const rows = await db.select().from(agentActivity).orderBy(desc(agentActivity.ranAt)).limit(50);
  return NextResponse.json(rows);
}
