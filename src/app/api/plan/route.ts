import { NextResponse } from "next/server";
import { z } from "zod";
import { getStudent, saveStudent } from "@/lib/store";

const Body = z.object({ tier: z.enum(["free", "pro"]) });

/** Practice upgrades only: this build takes no payment and stores no card details. */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose Free or Pro." }, { status: 400 });
  const student = await getStudent();
  const plan = parsed.data.tier === "pro" ? { tier: "pro" as const, since: new Date().toISOString(), via: "practice" as const } : { tier: "free" as const, since: new Date().toISOString() };
  await saveStudent({ ...student, plan });
  return NextResponse.json({ plan });
}
