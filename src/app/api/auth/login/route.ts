import { NextResponse } from "next/server";
import { z } from "zod";
import { findUserByEmail, startSession, verifyPassword } from "@/lib/auth";

const Body = z.object({ email: z.string().max(320), password: z.string().max(200) });

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !parsed.data.email.trim() || !parsed.data.password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }
  const user = await findUserByEmail(parsed.data.email);
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "That email and password do not match an account." }, { status: 401 });
  }
  await startSession(user.id);
  return NextResponse.json({ ok: true });
}
