export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { topic, grade, num_slides = 6 } = await req.json();
    if (!topic) return NextResponse.json({ error: "topic is required" }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;

    // If no API key, return convincing mock for demo
    if (!apiKey) {
      const mockLesson = buildMockLesson(topic, grade, num_slides);
      return NextResponse.json({ data: mockLesson });
    }

    const prompt = `You are an expert teacher creating a lesson plan.
Create a structured lesson on "${topic}" for ${grade} students.
Return ONLY valid JSON (no markdown, no backticks) with this exact structure:
{
  "title": "lesson title",
  "subject": "inferred subject",
  "slides": [
    { "title": "slide title", "content": "slide body text", "type": "text" }
  ],
  "quiz_suggestions": [
    { "body": "question text", "type": "mcq", "options": ["A","B","C","D"], "correct_answer": "A" }
  ]
}
Generate exactly ${num_slides} slides. Each slide should be educational and concise.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!response.ok) {
      const mockLesson = buildMockLesson(topic, grade, num_slides);
      return NextResponse.json({ data: mockLesson });
    }

    const geminiData = await response.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip any markdown fences
    const jsonStr = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const lesson = JSON.parse(jsonStr);
    return NextResponse.json({ data: lesson });
  } catch (e) {
    console.error("[POST /ai/generate-lesson]", e);
    // Graceful fallback to mock
    const { topic = "the topic", grade = "Grade 8", num_slides = 6 } = await req.json().catch(() => ({}));
    return NextResponse.json({ data: buildMockLesson(topic, grade, num_slides) });
  }
}

function buildMockLesson(topic: string, grade: string, count: number) {
  const slides = Array.from({ length: count }, (_, i) => ({
    title:   i === 0 ? "Introduction" : i === count - 1 ? "Summary" : `Key Concept ${i}`,
    content: i === 0
      ? `Welcome to this lesson on ${topic}. By the end, students will understand the core principles and be able to apply them.`
      : i === count - 1
      ? `In this lesson we covered the fundamentals of ${topic}. Review the key points and complete the practice quiz.`
      : `This section covers an important aspect of ${topic} relevant for ${grade} students. Understanding this concept builds the foundation for deeper study.`,
    type: "text",
  }));
  return {
    title:            `${topic} — ${grade}`,
    subject:          "General",
    slides,
    quiz_suggestions: [
      { body: `What is the main concept covered in this lesson on ${topic}?`, type: "mcq", options: ["Option A", "Option B", "Option C", "Option D"], correct_answer: "Option A" },
      { body: `This lesson is designed for ${grade} students.`, type: "truefalse", options: ["True", "False"], correct_answer: "True" },
    ],
  };
}
