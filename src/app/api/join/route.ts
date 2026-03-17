export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quiz_sessions, quizzes, questions as questionsTable } from "@/lib/schema";
import { eq } from "drizzle-orm";

// GET /api/join?code=XK7F2A — get quiz info + questions by join code (no auth required for students)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    if (!code) return NextResponse.json({ error: "code is required" }, { status: 400 });

    const [session] = await db
      .select()
      .from(quiz_sessions)
      .where(eq(quiz_sessions.join_code, code.toUpperCase()))
      .limit(1);

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (!session.is_active) return NextResponse.json({ error: "Session has ended" }, { status: 410 });

    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, session.quiz_id))
      .limit(1);

    const qs = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.quiz_id, session.quiz_id))
      .orderBy(questionsTable.order_index);

    return NextResponse.json({
      data: {
        session_id: session.id,
        quiz_title: quiz?.title ?? "Quiz",
        time_limit_sec: quiz?.time_limit_sec ?? 30,
        questions: qs.map((q) => ({
          id: q.id,
          body: q.body,
          type: q.type,
          options: q.options,
          correct: q.correct_answer,
        })),
      },
    });
  } catch (e) {
    console.error("[GET /api/join]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/join — submit an answer
export async function POST(req: Request) {
  try {
    const { session_id, question_id, student_alias, answer, is_correct } = await req.json();
    const { responses } = await import("@/lib/schema");

    await db.insert(responses).values({
      session_id,
      question_id,
      student_alias,
      answer,
      is_correct,
    });

    return NextResponse.json({ data: { ok: true } });
  } catch (e) {
    console.error("[POST /api/join]", e);
    return NextResponse.json({ error: "Failed to submit answer" }, { status: 500 });
  }
}
