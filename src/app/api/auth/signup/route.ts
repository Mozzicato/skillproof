import { NextResponse } from "next/server";
import { z } from "zod";
import { createUser, startSession } from "@/lib/auth";
import { DEPARTMENTS } from "@/lib/cohort";
import { ROLES } from "@/lib/framework";
import { createAccountWorkspace } from "@/lib/store";

const Body = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80, "Use 80 characters or fewer."),
  email: z.string().trim().email("Enter an email address like name@example.com."),
  password: z.string().min(8, "Use at least 8 characters.").max(200, "Use 200 characters or fewer."),
  university: z.string().trim().min(2, "Enter your university.").max(120, "Use 120 characters or fewer."),
  department: z.string().refine((d) => DEPARTMENTS.some((x) => x.name === d) || d === "Other", "Choose your department."),
  targetRoleId: z.string().refine((r) => ROLES.some((x) => x.id === r), "Choose a target role."),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue.message, field: String(issue.path[0] ?? "") }, { status: 400 });
  }
  const { name, email, password, ...details } = parsed.data;

  const user = await createUser(name, email, password);
  if (!user) {
    return NextResponse.json({ error: "An account with this email already exists. Sign in instead.", field: "email" }, { status: 409 });
  }
  await createAccountWorkspace(user.id, { name, ...details });
  await startSession(user.id);
  return NextResponse.json({ ok: true });
}
