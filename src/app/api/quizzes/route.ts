export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quizzes, questions } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const lesson_id = searchParams.get("lesson_id");

    const conditions = [eq(quizzes.teacher_id, session.userId)];
    if (lesson_id) conditions.push(eq(quizzes.lesson_id, lesson_id));

    const rows = await db.select().from(quizzes)
      .where(and(...conditions))
      .orderBy(desc(quizzes.updated_at));

    const withQuestions = await Promise.all(
      rows.map(async (q) => {
        const qs = await db.select().from(questions)
          .where(eq(questions.quiz_id, q.id))
          .orderBy(questions.order_index);
        return { ...q, questions: qs };
      })
    );

    return NextResponse.json({ data: withQuestions });
  } catch (e) {
    console.error("[GET /quizzes]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, lesson_id, time_limit_sec = 30, ai_generated = false, questions: qData } = await req.json();
    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

    const [quiz] = await db.insert(quizzes).values({
      teacher_id: session.userId,
      title, lesson_id, time_limit_sec, ai_generated,
    }).returning();

    if (qData?.length) {
      await db.insert(questions).values(
        qData.map((q: { body: string; type: string; options: string[]; correct_answer: string }, i: number) => ({
          quiz_id:        quiz.id,
          order_index:    i,
          body:           q.body,
          type:           q.type as "mcq" | "truefalse" | "open",
          options:        q.options,
          correct_answer: q.correct_answer,
        }))
      );
    }

    return NextResponse.json({ data: quiz }, { status: 201 });
  } catch (e) {
    console.error("[POST /quizzes]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
