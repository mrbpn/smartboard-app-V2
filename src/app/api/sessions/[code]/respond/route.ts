import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { responses, quiz_sessions, questions } from "@/lib/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ code: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { code } = await params;
    const { question_id, student_alias, answer } = await req.json();

    if (!question_id || !student_alias || !answer)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // Get session
    const [sess] = await db.select().from(quiz_sessions)
      .where(eq(quiz_sessions.join_code, code)).limit(1);
    if (!sess) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (sess.status === "ended") return NextResponse.json({ error: "Session ended" }, { status: 410 });

    // Check correct answer
    const [question] = await db.select().from(questions)
      .where(eq(questions.id, question_id)).limit(1);
    const is_correct = question?.correct_answer === answer;

    const [response] = await db.insert(responses).values({
      session_id: sess.id, question_id,
      student_alias, answer, is_correct,
    }).returning();

    return NextResponse.json({ data: { ...response, is_correct } }, { status: 201 });
  } catch (e) {
    console.error("[POST /sessions/[code]/respond]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
