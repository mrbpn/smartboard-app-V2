export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lessons, slides } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const [lesson] = await db.select().from(lessons)
      .where(and(eq(lessons.id, id), eq(lessons.teacher_id, session.userId)))
      .limit(1);
    if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const lessonSlides = await db.select().from(slides)
      .where(eq(slides.lesson_id, id))
      .orderBy(slides.order_index);

    return NextResponse.json({ data: { ...lesson, slides: lessonSlides } });
  } catch (e) {
    console.error("[GET /lessons/[id]]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();

    const allowed = ["title", "subject", "status", "ai_generated", "ai_prompt"];
    const updates: Record<string, unknown> = { updated_at: new Date() };
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    // Handle slides upsert if provided
    if (body.slides?.length) {
      await db.delete(slides).where(eq(slides.lesson_id, id));
      await db.insert(slides).values(
        body.slides.map((s: { title?: string; content?: unknown; type?: string; media_url?: string }, i: number) => ({
          lesson_id:   id,
          order_index: i,
          type:        (s.type ?? "text") as "text" | "image" | "video",
          content:     s.content ?? { title: s.title ?? "", text: "" },
          media_url:   s.media_url,
        }))
      );
    }

    const [updated] = await db.update(lessons)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set(updates as any)
      .where(and(eq(lessons.id, id), eq(lessons.teacher_id, session.userId)))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error("[PATCH /lessons/[id]]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    await db.update(lessons)
      .set({ deleted_at: new Date() })
      .where(and(eq(lessons.id, id), eq(lessons.teacher_id, session.userId)));

    return NextResponse.json({ data: { ok: true } });
  } catch (e) {
    console.error("[DELETE /lessons/[id]]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
