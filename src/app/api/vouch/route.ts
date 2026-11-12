import { NextResponse } from "next/server";
import { z } from "zod";
import { kv } from "@/lib/db";
import { competencyScore } from "@/lib/scoring";
import { openInvite } from "@/lib/store";
import { COMPETENCY_IDS, type CompetencyId } from "@/lib/types";
import { CODE_MINUTES, hashCode, newCode, sendCode } from "@/lib/verify";

const Body = z.object({
  token: z.string().min(10).max(64),
  name: z.string().trim().min(2, "Enter your name.").max(80),
  email: z.string().trim().email("Enter the email address you use at work.").max(160),
  organisation: z.string().trim().min(2, "Enter your organisation.").max(120),
  statement: z.string().trim().min(20, "Say in a sentence or two what you saw the student do.").max(600),
  skills: z.array(z.enum(COMPETENCY_IDS)).min(1, "Choose at least one skill.").max(10),
});

export interface PendingVouch {
  name: string;
  email: string;
  organisation: string;
  statement: string;
  skills: CompetencyId[];
  codeHash: string;
  expiresAt: string;
  attempts: number;
}

/** Step one: check the form, then send a code to the person's email. Nothing is published until the code is entered. */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form and try again." }, { status: 400 });
  const { token, skills, ...details } = parsed.data;

  const opened = await openInvite(token);
  if (!opened) return NextResponse.json({ error: "This link is not valid." }, { status: 404 });
  if (opened.invite.usedAt) return NextResponse.json({ error: "This link has already been used." }, { status: 409 });

  // People can only vouch for skills the student already has evidence for, so a vouch adds weight to proof rather than replacing it.
  const evidenced = skills.filter((id) => competencyScore(opened.student.evidence, id) !== null);
  if (evidenced.length === 0) return NextResponse.json({ error: "Choose a skill the student has evidence for." }, { status: 400 });

  const code = newCode();
  const mode = await sendCode(details.email, code, opened.student.name).catch((err: Error) => err);
  if (mode instanceof Error) return NextResponse.json({ error: mode.message }, { status: 502 });
  await kv.set("vouchcode", token, {
    ...details,
    skills: evidenced,
    codeHash: hashCode(token, code),
    expiresAt: new Date(Date.now() + CODE_MINUTES * 60000).toISOString(),
    attempts: 0,
  } satisfies PendingVouch);

  return NextResponse.json(mode === "demo" ? { mode, demoCode: code } : { mode });
}
