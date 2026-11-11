import { NextResponse } from "next/server";
import { z } from "zod";
import { createInvite } from "@/lib/store";

const Body = z.object({ role: z.enum(["Lecturer", "Mentor", "Employer"]) });

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose who you are asking." }, { status: 400 });
  const token = await createInvite(parsed.data.role);
  return NextResponse.json({ path: `/vouch/${token}` });
}
