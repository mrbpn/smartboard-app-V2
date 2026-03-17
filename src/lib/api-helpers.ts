import { NextResponse } from "next/server";
import { getSession } from "./auth";

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export function withAuth(
  handler: (req: Request, session: { userId: string; email: string }, ...args: unknown[]) => Promise<NextResponse>
) {
  return async (req: Request, ...args: unknown[]) => {
    try {
      const session = await requireAuth();
      return await handler(req, session, ...args);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      if (msg === "UNAUTHORIZED") return err("Unauthorized", 401);
      console.error("[API Error]", msg);
      return err("Internal server error", 500);
    }
  };
}
