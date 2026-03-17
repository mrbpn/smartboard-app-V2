export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { templates } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const subject     = searchParams.get("subject");
    const grade_level = searchParams.get("grade");
    const type        = searchParams.get("type");

    const conditions = [eq(templates.is_builtin, true)];
    if (subject)     conditions.push(eq(templates.subject, subject));
    if (grade_level) conditions.push(eq(templates.grade_level, grade_level));
    if (type)        conditions.push(eq(templates.type, type as "lesson" | "simulation" | "quiz"));

    const rows = await db.select().from(templates).where(and(...conditions));
    return NextResponse.json({ data: rows });
  } catch (e) {
    console.error("[GET /templates]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
