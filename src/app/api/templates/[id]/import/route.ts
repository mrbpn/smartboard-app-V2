export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { templates, lessons, slides } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const [template] = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    // Clone into a new lesson
    const [lesson] = await db.insert(lessons).values({
      teacher_id:   session.userId,
      template_id:  template.id,
      title:        template.title,
      subject:      template.subject,
      status:       "draft",
      ai_generated: false,
    }).returning();

    // Clone slides from template.slides (stored as jsonb array)
    const templateSlides = (template.slides as Array<{ title?: string; content?: unknown; type?: string }>) ?? [];
    if (templateSlides.length) {
      await db.insert(slides).values(
        templateSlides.map((s, i) => ({
          lesson_id:   lesson.id,
          order_index: i,
          type:        (s.type ?? "text") as "text" | "image" | "video",
          content:     s.content ?? { title: s.title ?? "", text: "" },
        }))
      );
    }

    return NextResponse.json({ data: { lesson_id: lesson.id } }, { status: 201 });
  } catch (e) {
    console.error("[POST /templates/[id]/import]", e);
    return NextResponse.json({ error: "Failed to import template" }, { status: 500 });
  }
}
