import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { whiteboard_snapshots } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const lesson_id = searchParams.get("lesson_id");

    const conditions = [eq(whiteboard_snapshots.teacher_id, session.userId)];
    if (lesson_id) conditions.push(eq(whiteboard_snapshots.lesson_id, lesson_id));

    const rows = await db.select().from(whiteboard_snapshots)
      .where(and(...conditions))
      .orderBy(desc(whiteboard_snapshots.updated_at));

    return NextResponse.json({ data: rows });
  } catch (e) {
    console.error("[GET /whiteboard/snapshots]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { lesson_id, strokes, ocr_text, thumbnail_url } = await req.json();
    if (!strokes) return NextResponse.json({ error: "strokes required" }, { status: 400 });

    const [snapshot] = await db.insert(whiteboard_snapshots).values({
      teacher_id: session.userId,
      lesson_id, strokes, ocr_text, thumbnail_url,
    }).returning();

    return NextResponse.json({ data: snapshot }, { status: 201 });
  } catch (e) {
    console.error("[POST /whiteboard/snapshots]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
