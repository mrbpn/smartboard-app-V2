export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { hashPassword, signToken } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password)
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const hash = await hashPassword(password);
    if (hash !== user.password_hash)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const token = await signToken({ userId: user.id, email: user.email });
    const cookieStore = await cookies();
    cookieStore.set("sb_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });

    return NextResponse.json({
      data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token }
    });
  } catch (e) {
    console.error("[login]", e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
