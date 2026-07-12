import { NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/auth/session";
import { getOrCreateDevUser } from "@/lib/db/store";

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const user = await getOrCreateDevUser(email.trim().toLowerCase());
  await setSession({ userId: user.id, email: user.email });

  return NextResponse.json({ user });
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: session });
}

export async function DELETE() {
  const { clearSession } = await import("@/lib/auth/session");
  await clearSession();
  return NextResponse.json({ ok: true });
}
