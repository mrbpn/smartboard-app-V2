export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lessons, slides } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { eq, isNull, and, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status  = searchParams.get("status");
    const subject = searchParams.get("subject");

    const conditions = [
      eq(lessons.teacher_id, session.userId),
      isNull(lessons.deleted_at),
    ];
    if (status)  conditions.push(eq(lessons.status, status as "draft" | "published"));
    if (subject) conditions.push(eq(lessons.subject, subject));

    const rows = await db
      .select()
      .from(lessons)
      .where(and(...conditions))
      .orderBy(desc(lessons.updated_at));

    // Attach slides for each lesson
    const withSlides = await Promise.all(
      rows.map(async (lesson) => {
        const lessonSlides = await db
          .select()
          .from(slides)
          .where(eq(slides.lesson_id, lesson.id))
          .orderBy(slides.order_index);
        return { ...lesson, slides: lessonSlides };
      })
    );

    return NextResponse.json({ data: withSlides });
  } catch (e) {
    console.error("[GET /lessons]", e);
    return NextResponse.json({ error: "Failed to fetch lessons" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, subject, status = "draft", ai_generated = false, ai_prompt, template_id, slides: slideData } = body;

    if (!title || !subject)
      return NextResponse.json({ error: "title and subject are required" }, { status: 400 });

    const [lesson] = await db.insert(lessons).values({
      teacher_id: session.userId,
      title, subject,
      status: status as "draft" | "published",
      ai_generated, ai_prompt, template_id,
    }).returning();

    // Insert slides if provided
    if (slideData?.length) {
      await db.insert(slides).values(
        slideData.map((s: { title?: string; content?: unknown; type?: string; media_url?: string }, i: number) => ({
          lesson_id:   lesson.id,
          order_index: i,
          type:        (s.type ?? "text") as "text" | "image" | "video",
          content:     s.content ?? { title: s.title ?? "", text: "" },
          media_url:   s.media_url,
        }))
      );
    }

    return NextResponse.json({ data: lesson }, { status: 201 });
  } catch (e) {
    console.error("[POST /lessons]", e);
    return NextResponse.json({ error: "Failed to create lesson" }, { status: 500 });
  }
}
