import { NextResponse } from "next/server";
import { z } from "zod";
import { ROLES } from "@/lib/framework";
import { getStudent, saveStudent } from "@/lib/store";

const Body = z.object({ roleId: z.string() });

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !ROLES.some((r) => r.id === parsed.data.roleId)) {
    return NextResponse.json({ error: "Choose one of the listed roles." }, { status: 400 });
  }
  await saveStudent({ ...(await getStudent()), targetRoleId: parsed.data.roleId });
  return NextResponse.json({ ok: true });
}
