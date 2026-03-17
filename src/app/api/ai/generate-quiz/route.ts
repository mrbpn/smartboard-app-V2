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

    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lesson_id)).limit(1);
    const lessonSlides = await db.select().from(slides).where(eq(slides.lesson_id, lesson_id));

    const lessonContext = lessonSlides
      .map((s) => {
        const c = s.content as Record<string, string>;
        return `${c.title ?? ""}: ${c.text ?? ""}`;
      })
      .join("\n");

    const groqKey   = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!groqKey && !geminiKey) {
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

    let rawText = "";

    if (groqKey) {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        rawText = d.choices?.[0]?.message?.content ?? "";
      }
    }

    if (!rawText && geminiKey) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
          }),
        }
      );
      if (res.ok) {
        const d = await res.json();
        rawText = d.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      }
    }

    if (!rawText) {
      return NextResponse.json({ data: buildMockQuestions(lesson?.title ?? "the lesson", num_questions, type) });
    }

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
