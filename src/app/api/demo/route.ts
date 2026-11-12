import { NextResponse } from "next/server";
import { z } from "zod";
import { switchDemo } from "@/lib/store";

const Body = z.object({ studentId: z.string().min(1).max(60) });

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a sample student." }, { status: 400 });
  if (!(await switchDemo(parsed.data.studentId))) {
    return NextResponse.json({ error: "Only the judge demo can switch students, and only to a sample student." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
