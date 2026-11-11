import { NextResponse } from "next/server";
import { z } from "zod";
import { role } from "@/lib/framework";
import { SPRINT_DAYS, proposeSprint } from "@/lib/scoring";
import { getStudent, saveStudent } from "@/lib/store";

const Body = z.object({ action: z.enum(["start", "stop"]) });

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Unknown sprint action." }, { status: 400 });
  const student = await getStudent();

  if (parsed.data.action === "stop") {
    await saveStudent({ ...student, sprint: null });
    return NextResponse.json({ sprint: null });
  }

  const plan = proposeSprint(role(student.targetRoleId), student);
  if (!plan) return NextResponse.json({ error: "You have no gaps left to close for this role." }, { status: 400 });
  const startedAt = new Date();
  const sprint = { ...plan, startedAt: startedAt.toISOString(), dueAt: new Date(startedAt.getTime() + SPRINT_DAYS * 86_400_000).toISOString() };
  await saveStudent({ ...student, sprint });
  return NextResponse.json({ sprint });
}
