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
  summarize:   (t) => `Summarize the following content in 3-5 bullet points:\n\n${t}`,
  explain:     (t) => `Explain the following content clearly for a student:\n\n${t}`,
  quiz:        (t) => `Create 3 quiz questions (with answers) based on:\n\n${t}`,
  define:      (t) => `Define the key terms and concepts in:\n\n${t}`,
  concept_map: (t) => `Create a simple text-based concept map showing relationships in:\n\n${t}`,
  translate:   (t) => `Translate the following to simple, easy-to-understand English:\n\n${t}`,
  actions:     (t) => `List 3-5 actionable next steps based on:\n\n${t}`,
  lesson:      (t) => `Create a short structured lesson outline based on:\n\n${t}`,
  brainstorm:  (t) => `Brainstorm 8-10 related ideas, extensions, or connections for:\n\n${t}`,
};

async function callGroqText(key: string, prompt: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });
  if (!res.ok) return "";
  const d = await res.json();
  return d.choices?.[0]?.message?.content ?? "";
}

async function callGroqVision(key: string, prompt: string, imageDataUrl: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.2-11b-vision-preview",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      }],
      temperature: 0.2,
      max_tokens: 1024,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[whiteboard/ai] Groq vision error:", JSON.stringify(err));
    return "";
  }
  const d = await res.json();
  return d.choices?.[0]?.message?.content ?? "";
}

async function callGemini(key: string, parts: unknown[]): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    }
  );
  if (!res.ok) return "";
  const d = await res.json();
  return d.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { action, image, text, question } = await req.json();
    const groqKey   = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!groqKey && !geminiKey) {
      return NextResponse.json({ data: { result: "⚠️ No AI API key configured. Add GROQ_API_KEY (free at console.groq.com) in Vercel environment variables." } });
    }

    const isVision = action in VISION_PROMPTS;
    const isText   = action in TEXT_PROMPTS;
    const isAsk    = action === "ask";

    if (!isVision && !isText && !isAsk) {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    let result = "";

    if (isVision && image) {
      if (groqKey) {
        result = await callGroqVision(groqKey, VISION_PROMPTS[action], image);
      }
      if (!result && geminiKey) {
        const base64  = image.replace(/^data:image\/\w+;base64,/, "");
        const mime    = image.startsWith("data:image/jpeg") ? "image/jpeg" : "image/png";
        result = await callGemini(geminiKey, [
          { text: VISION_PROMPTS[action] },
          { inline_data: { mime_type: mime, data: base64 } },
        ]);
      }
    } else if (isText && text) {
      if (groqKey) result = await callGroqText(groqKey, TEXT_PROMPTS[action](text));
      if (!result && geminiKey) result = await callGemini(geminiKey, [{ text: TEXT_PROMPTS[action](text) }]);
    } else if (isAsk) {
      const prompt = question ?? "What do you see on this whiteboard?";
      if (image && groqKey) {
        result = await callGroqVision(groqKey, prompt, image);
      } else if (groqKey) {
        result = await callGroqText(groqKey, prompt);
      }
      if (!result && geminiKey) {
        const base64 = image?.replace(/^data:image\/\w+;base64,/, "");
        const mime   = image?.startsWith("data:image/jpeg") ? "image/jpeg" : "image/png";
        const parts  = base64
          ? [{ text: prompt }, { inline_data: { mime_type: mime, data: base64 } }]
          : [{ text: prompt }];
        result = await callGemini(geminiKey, parts);
      }
    } else {
      return NextResponse.json({ data: { result: "Please provide image or text content." } });
    }

    if (!result) {
      const hint = !groqKey
        ? "⚠️ AI provider not responding. Add GROQ_API_KEY (free at console.groq.com) in Vercel → Settings → Environment Variables, then redeploy."
        : "⚠️ AI returned an empty response. Please try again.";
      return NextResponse.json({ data: { result: hint } });
    }

    return NextResponse.json({ data: { result } });
  } catch (e) {
    console.error("[POST /whiteboard/ai]", e);
    return NextResponse.json({ data: { result: "Something went wrong. Please try again." } });
  }
}
