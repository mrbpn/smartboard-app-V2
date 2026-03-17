export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quizzes, questions } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [quiz] = await db.select().from(quizzes)
      .where(and(eq(quizzes.id, id), eq(quizzes.teacher_id, session.userId)))
      .limit(1);

    if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const qs = await db.select().from(questions)
      .where(eq(questions.quiz_id, id))
      .orderBy(questions.order_index);

    return NextResponse.json({ data: { ...quiz, questions: qs } });
  } catch (e) {
    console.error("[GET /quizzes/[id]]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const allowed = ["title", "time_limit_sec"];
    const updates: Record<string, unknown> = { updated_at: new Date() };
    for (const key of allowed) {
      if (key in body && body[key] !== undefined) updates[key] = body[key];
    }

    const [updated] = await db.update(quizzes)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set(updates as any)
      .where(and(eq(quizzes.id, id), eq(quizzes.teacher_id, session.userId)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error("[PATCH /quizzes/[id]]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await db.delete(questions).where(eq(questions.quiz_id, id));
    await db.delete(quizzes)
      .where(and(eq(quizzes.id, id), eq(quizzes.teacher_id, session.userId)));

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /quizzes/[id]]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
