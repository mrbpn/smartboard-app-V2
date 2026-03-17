import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lessons, quizzes, session_recordings, responses, quiz_sessions } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { eq, isNull, and, gte, count, avg } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const uid = session.userId;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [
      totalLessons,
      totalQuizzes,
      totalRecordings,
      lessonsThisWeek,
    ] = await Promise.all([
      db.select({ count: count() }).from(lessons)
        .where(and(eq(lessons.teacher_id, uid), isNull(lessons.deleted_at))),
      db.select({ count: count() }).from(quizzes)
        .where(eq(quizzes.teacher_id, uid)),
      db.select({ count: count() }).from(session_recordings)
        .where(eq(session_recordings.teacher_id, uid)),
      db.select({ count: count() }).from(lessons)
        .where(and(
          eq(lessons.teacher_id, uid),
          isNull(lessons.deleted_at),
          gte(lessons.updated_at, oneWeekAgo)
        )),
    ]);

    // Avg quiz score across all sessions by this teacher
    const teacherQuizIds = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.teacher_id, uid));

    const sessionIds = teacherQuizIds.length
      ? await db
          .select({ id: quiz_sessions.id })
          .from(quiz_sessions)
          .where(eq(quiz_sessions.quiz_id, teacherQuizIds[0].id))
      : [];

    let avgScore = 0;
    let activeStudents = 0;

    if (sessionIds.length) {
      const scoreData = await db
        .select({ avg: avg(responses.is_correct) })
        .from(responses)
        .where(eq(responses.session_id, sessionIds[0].id));
      avgScore = Math.round(Number(scoreData[0]?.avg ?? 0) * 100);

      const studentData = await db
        .select({ alias: responses.student_alias })
        .from(responses)
        .where(eq(responses.session_id, sessionIds[0].id));
      activeStudents = new Set(studentData.map((r) => r.alias)).size;
    }

    // Weekly score trend (last 6 data points, mocked for now)
    const weeklyTrend = [
      { week: "W1", score: 65 },
      { week: "W2", score: 70 },
      { week: "W3", score: 72 },
      { week: "W4", score: 68 },
      { week: "W5", score: avgScore || 78 },
      { week: "W6", score: avgScore || 82 },
    ];

    return NextResponse.json({
      data: {
        total_lessons:      totalLessons[0]?.count     ?? 0,
        total_quizzes:      totalQuizzes[0]?.count     ?? 0,
        total_recordings:   totalRecordings[0]?.count  ?? 0,
        lessons_this_week:  lessonsThisWeek[0]?.count  ?? 0,
        avg_quiz_score:     avgScore,
        active_students:    activeStudents,
        weekly_trend:       weeklyTrend,
      },
    });
  } catch (e) {
    console.error("[GET /analytics]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
