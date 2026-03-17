export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "image is required" }, { status: 400 });

    const groqKey   = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!groqKey && !geminiKey) {
      return NextResponse.json({ data: { text: "No OCR API key configured. Add GROQ_API_KEY (free at console.groq.com) to enable handwriting recognition." } });
    }

    const ocrPrompt = "Extract and transcribe ALL handwritten text, numbers, equations, and symbols visible on this whiteboard image. Return only the transcribed content, preserving the layout as much as possible. If nothing is written, say 'No text detected'.";

    let text = "";

    if (groqKey) {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.2-11b-vision-preview",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: ocrPrompt },
              { type: "image_url", image_url: { url: image } },
            ],
          }],
          temperature: 0.1,
          max_tokens: 1024,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        text = d.choices?.[0]?.message?.content ?? "";
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("[whiteboard/ocr] Groq error:", JSON.stringify(err));
      }
    }

    if (!text && geminiKey) {
      const base64 = image.replace(/^data:image\/\w+;base64,/, "");
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: ocrPrompt },
                { inline_data: { mime_type: "image/png", data: base64 } },
              ],
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
          }),
        }
      );
      if (res.ok) {
        const d = await res.json();
        text = d.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      }
    }

    return NextResponse.json({ data: { text: text || "No text detected." } });
  } catch (e) {
    console.error("[POST /whiteboard/ocr]", e);
    return NextResponse.json({ data: { text: "OCR failed. Please try again." } });
  }
}
