export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lessons, slides } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { lesson_id, num_questions = 5, type = "mcq" } = await req.json();
    if (!lesson_id) return NextResponse.json({ error: "lesson_id is required" }, { status: 400 });

    // Fetch lesson content to build context
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lesson_id)).limit(1);
    const lessonSlides = await db.select().from(slides).where(eq(slides.lesson_id, lesson_id));

    const lessonContext = lessonSlides
      .map((s) => {
        const c = s.content as Record<string, string>;
        return `${c.title ?? ""}: ${c.text ?? ""}`;
      })
      .join("\n");

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ data: buildMockQuestions(lesson?.title ?? "the lesson", num_questions, type) });
    }

    const prompt = `You are a teacher creating quiz questions.
Based on this lesson content about "${lesson?.title}":
${lessonContext}

Create exactly ${num_questions} quiz questions of type "${type}".
Return ONLY valid JSON (no markdown, no backticks):
{
  "questions": [
    {
      "body": "question text",
      "type": "${type}",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A"
    }
  ]
}
For truefalse, options must be ["True", "False"].
For open, options can be empty [].`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ data: buildMockQuestions(lesson?.title ?? "the lesson", num_questions, type) });
    }

    const geminiData = await response.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonStr = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(jsonStr);
    return NextResponse.json({ data: parsed.questions });
  } catch (e) {
    console.error("[POST /ai/generate-quiz]", e);
    return NextResponse.json({ data: buildMockQuestions("the lesson", 5, "mcq") });
  }
}

function buildMockQuestions(topic: string, count: number, type: string) {
  return Array.from({ length: count }, (_, i) => ({
    body:           `Question ${i + 1} about ${topic}?`,
    type,
    options:        type === "truefalse" ? ["True", "False"] : type === "open" ? [] : ["Option A", "Option B", "Option C", "Option D"],
    correct_answer: type === "truefalse" ? "True" : type === "open" ? "" : "Option A",
  }));
}
