import { NextResponse } from "next/server";
import { z } from "zod";
import { competencyScore } from "@/lib/scoring";
import { addEndorsements, openInvite } from "@/lib/store";
import { COMPETENCY_IDS, type Endorsement } from "@/lib/types";

const Body = z.object({
  token: z.string().min(10).max(64),
  name: z.string().trim().min(2, "Enter your name.").max(80),
  organisation: z.string().trim().min(2, "Enter your organisation.").max(120),
  statement: z.string().trim().min(20, "Say in a sentence or two what you saw the student do.").max(600),
  skills: z.array(z.enum(COMPETENCY_IDS)).min(1, "Choose at least one skill.").max(10),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form and try again." }, { status: 400 });

  const opened = await openInvite(parsed.data.token);
  if (!opened) return NextResponse.json({ error: "This link is not valid." }, { status: 404 });
  if (opened.invite.usedAt) return NextResponse.json({ error: "This link has already been used." }, { status: 409 });

  // People can only vouch for skills the student already has evidence for, so a vouch adds weight to proof rather than replacing it.
  const evidenced = parsed.data.skills.filter((id) => competencyScore(opened.student.evidence, id) !== null);
  if (evidenced.length === 0) return NextResponse.json({ error: "Choose a skill the student has evidence for." }, { status: 400 });

  const createdAt = new Date().toISOString();
  const endorsements: Endorsement[] = evidenced.map((competencyId, i) => ({
    id: `end-${Date.now()}-${i}`,
    competencyId,
    name: parsed.data.name,
    role: opened.invite.role,
    organisation: parsed.data.organisation,
    statement: parsed.data.statement,
    createdAt,
  }));
  if (!(await addEndorsements(parsed.data.token, endorsements))) {
    return NextResponse.json({ error: "This link has already been used." }, { status: 409 });
  }
  return NextResponse.json({ added: endorsements.length });
}
