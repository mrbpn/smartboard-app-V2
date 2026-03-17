export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quiz_sessions } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { generateJoinCode } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: quiz_id } = await params;
    const body = await req.json().catch(() => ({}));
    const is_hybrid = body.is_hybrid ?? false;

    // Generate unique join code
    let join_code = generateJoinCode();
    // Simple collision check — retry once if needed
    try {
      const [row] = await db.insert(quiz_sessions)
        .values({ quiz_id, join_code, is_hybrid, status: "waiting" })
        .returning();
      return NextResponse.json({ data: row }, { status: 201 });
    } catch {
      join_code = generateJoinCode() + Math.floor(Math.random() * 9);
      const [row] = await db.insert(quiz_sessions)
        .values({ quiz_id, join_code, is_hybrid, status: "waiting" })
        .returning();
      return NextResponse.json({ data: row }, { status: 201 });
    }
  } catch (e) {
    console.error("[POST /quizzes/[id]/sessions]", e);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
