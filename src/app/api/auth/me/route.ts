export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const allowed = ["name", "email", "avatar_url"];
    const updates: Record<string, unknown> = { updated_at: new Date() };
    for (const key of allowed) {
      if (key in body && body[key] !== undefined) updates[key] = body[key];
    }

    const [updated] = await db
      .update(users)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set(updates as any)
      .where(eq(users.id, session.userId))
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role, avatar_url: users.avatar_url });

    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error("[PATCH /auth/me]", e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [user] = await db.select({
      id: users.id, name: users.name, email: users.email,
      role: users.role, avatar_url: users.avatar_url, created_at: users.created_at,
    }).from(users).where(eq(users.id, session.userId)).limit(1);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ data: user });
  } catch (e) {
    console.error("[me]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
