export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { session_recordings } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const lesson_id = searchParams.get("lesson_id");
    const status    = searchParams.get("status");

    const conditions = [eq(session_recordings.teacher_id, session.userId)];
    if (lesson_id) conditions.push(eq(session_recordings.lesson_id, lesson_id));
    if (status)    conditions.push(eq(session_recordings.status, status as "recording" | "processing" | "ready"));

    const rows = await db
      .select()
      .from(session_recordings)
      .where(and(...conditions))
      .orderBy(desc(session_recordings.recorded_at));

    return NextResponse.json({ data: rows });
  } catch (e) {
    console.error("[GET /recordings]", e);
    return NextResponse.json({ error: "Failed to fetch recordings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { lesson_id, title } = await req.json();
    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

    const [recording] = await db
      .insert(session_recordings)
      .values({ teacher_id: session.userId, lesson_id, title, status: "recording" })
      .returning();

    return NextResponse.json({ data: recording }, { status: 201 });
  } catch (e) {
    console.error("[POST /recordings]", e);
    return NextResponse.json({ error: "Failed to create recording" }, { status: 500 });
  }
}
