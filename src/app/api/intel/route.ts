export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { intelItems } from "@/lib/schema";
import { proxyAuth } from "@/lib/proxy";
import { desc } from "drizzle-orm";

export async function GET(req: Request) {
  const auth = proxyAuth(req);
  if (auth) return auth;
  const rows = await db.select().from(intelItems).orderBy(desc(intelItems.recordedAt));
  return NextResponse.json(rows);
}
