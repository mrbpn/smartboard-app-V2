export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { image } = await req.json(); // base64 PNG data URL
    if (!image) return NextResponse.json({ error: "image is required" }, { status: 400 });

    // Strip data URL prefix to get raw base64
    const base64 = image.replace(/^data:image\/\w+;base64,/, "");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ data: { text: "No OCR API key configured. Add GEMINI_API_KEY to enable real handwriting recognition." } });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Extract and transcribe ALL handwritten text, numbers, equations, and symbols visible on this whiteboard image. Return only the transcribed content, preserving the layout as much as possible. If nothing is written, say 'No text detected'." },
              { inline_data: { mime_type: "image/png", data: base64 } },
            ],
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ data: { text: "OCR service unavailable. Please try again." } });
    }

    const geminiData = await response.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "No text detected.";
    return NextResponse.json({ data: { text } });
  } catch (e) {
    console.error("[POST /whiteboard/ocr]", e);
    return NextResponse.json({ data: { text: "OCR failed. Please try again." } });
  }
}
