export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { hashPassword, signToken } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0)
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const password_hash = await hashPassword(password);
    const [user] = await db.insert(users).values({ name, email, password_hash }).returning();

    const token = await signToken({ userId: user.id, email: user.email });
    const cookieStore = await cookies();
    cookieStore.set("sb_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });

    return NextResponse.json({
      data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token }
    }, { status: 201 });
  } catch (e) {
    console.error("[register]", e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
