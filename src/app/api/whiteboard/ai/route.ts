export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const VISION_PROMPTS: Record<string, string> = {
  read_board:   "Describe everything you see on this whiteboard clearly and concisely.",
  handwriting:  "Transcribe ALL handwritten text, numbers, equations, and symbols exactly as written. Preserve layout.",
  solve_math:   "Identify and solve all mathematical problems on this whiteboard. Show the final answer clearly.",
  step_by_step: "Look at the content on this whiteboard and provide a clear step-by-step explanation or solution.",
  diagram:      "Describe the diagram or visual structure on this whiteboard. Explain what it represents.",
  hints:        "Look at the problem or content on this whiteboard and provide helpful hints without giving the full answer.",
};

const TEXT_PROMPTS: Record<string, (text: string) => string> = {
  summarize:    (t) => `Summarize the following content in 3-5 bullet points:\n\n${t}`,
  explain:      (t) => `Explain the following content clearly for a student:\n\n${t}`,
  quiz:         (t) => `Create 3 quiz questions (with answers) based on:\n\n${t}`,
  define:       (t) => `Define the key terms and concepts in:\n\n${t}`,
  concept_map:  (t) => `Create a simple text-based concept map showing relationships in:\n\n${t}`,
  translate:    (t) => `Translate the following to simple, easy-to-understand English:\n\n${t}`,
  actions:      (t) => `List 3-5 actionable next steps based on:\n\n${t}`,
  lesson:       (t) => `Create a short structured lesson outline based on:\n\n${t}`,
  brainstorm:   (t) => `Brainstorm 8-10 related ideas, extensions, or connections for:\n\n${t}`,
};

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { action, image, text, question } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ data: { result: "⚠️ GEMINI_API_KEY is not configured. Add it in Vercel environment variables." } });
    }

    const isVision = action in VISION_PROMPTS;
    const isText   = action in TEXT_PROMPTS;
    const isAsk    = action === "ask";

    if (!isVision && !isText && !isAsk) {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    let parts: unknown[];

    if (isVision && image) {
      const base64 = image.replace(/^data:image\/\w+;base64,/, "");
      const mimeType = image.startsWith("data:image/jpeg") ? "image/jpeg" : "image/png";
      parts = [
        { text: VISION_PROMPTS[action] },
        { inline_data: { mime_type: mimeType, data: base64 } },
      ];
    } else if (isText && text) {
      parts = [{ text: TEXT_PROMPTS[action](text) }];
    } else if (isAsk) {
      const prompt = image
        ? `${question}\n\n(Context: the whiteboard image is attached)`
        : question;
      const base64 = image?.replace(/^data:image\/\w+;base64,/, "");
      const mime   = image?.startsWith("data:image/jpeg") ? "image/jpeg" : "image/png";
      parts = base64
        ? [{ text: prompt }, { inline_data: { mime_type: mime, data: base64 } }]
        : [{ text: prompt }];
    } else {
      return NextResponse.json({ data: { result: "Please provide image or text content." } });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("[whiteboard/ai] Gemini error:", JSON.stringify(err));
      const msg = err?.error?.message ?? `Gemini API error ${response.status}`;
      return NextResponse.json({ data: { result: `❌ ${msg}` } });
    }

    const geminiData = await response.json();
    const result = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response from AI.";
    return NextResponse.json({ data: { result } });
  } catch (e) {
    console.error("[POST /whiteboard/ai]", e);
    return NextResponse.json({ data: { result: "Something went wrong. Please try again." } });
  }
}
