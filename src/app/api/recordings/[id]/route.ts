import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { session_recordings } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const allowed = ["status", "video_url", "thumbnail_url", "duration_sec", "is_public", "title"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    const [updated] = await db
      .update(session_recordings)
      .set(updates as Parameters<ReturnType<typeof db.update>["set"]>[0])
      .where(and(eq(session_recordings.id, id), eq(session_recordings.teacher_id, session.userId)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error("[PATCH /recordings/[id]]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await db
      .delete(session_recordings)
      .where(and(eq(session_recordings.id, id), eq(session_recordings.teacher_id, session.userId)));

    return NextResponse.json({ data: { ok: true } });
  } catch (e) {
    console.error("[DELETE /recordings/[id]]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
