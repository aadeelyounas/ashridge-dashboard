export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contentQueue } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.select().from(contentQueue).orderBy(contentQueue.id);
    return NextResponse.json(rows);
  } catch (e) {
    console.error("pipeline GET error:", e);
    return NextResponse.json({ error: "Failed to fetch pipeline" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (id) {
      const updated = await db
        .update(contentQueue)
        .set({ ...fields, updatedAt: new Date() })
        .where(eq(contentQueue.id, id))
        .returning();
      return NextResponse.json(updated[0]);
    }

    const inserted = await db.insert(contentQueue).values(fields).returning();
    return NextResponse.json(inserted[0], { status: 201 });
  } catch (e) {
    console.error("pipeline POST error:", e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const updated = await db
      .update(contentQueue)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(contentQueue.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (e) {
    console.error("pipeline PATCH error:", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await db.delete(contentQueue).where(eq(contentQueue.id, parseInt(id)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("pipeline DELETE error:", e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
