export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { localSeoTracker } from "@/lib/schema";
import { proxyAuth } from "@/lib/proxy";

export async function GET(req: Request) {
  const auth = proxyAuth(req);
  if (auth) return auth;
  const rows = await db.select().from(localSeoTracker);
  return NextResponse.json(rows);
}
