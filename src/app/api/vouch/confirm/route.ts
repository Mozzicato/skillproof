import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { kv } from "@/lib/db";
import { addEndorsements, openInvite } from "@/lib/store";
import type { Endorsement } from "@/lib/types";
import { MAX_ATTEMPTS, emailDomain, hashCode, isWorkEmail } from "@/lib/verify";
import type { PendingVouch } from "../route";

const Body = z.object({ token: z.string().min(10).max(64), code: z.string().trim().regex(/^\d{6}$/, "Enter the six-digit code.") });

/** Step two: the code proves the person controls the email address; only then is the confirmation published. */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter the six-digit code." }, { status: 400 });
  const { token, code } = parsed.data;

  const opened = await openInvite(token);
  if (!opened) return NextResponse.json({ error: "This link is not valid." }, { status: 404 });
  if (opened.invite.usedAt) return NextResponse.json({ error: "This link has already been used." }, { status: 409 });

  const pending = await kv.get<PendingVouch>("vouchcode", token);
  if (!pending) return NextResponse.json({ error: "Start again: fill in the form to get a new code." }, { status: 400 });
  if (Date.parse(pending.expiresAt) < Date.now() || pending.attempts >= MAX_ATTEMPTS) {
    await kv.delete("vouchcode", token);
    return NextResponse.json({ error: "This code has expired. Send yourself a new one." }, { status: 410 });
  }
  const expected = Buffer.from(pending.codeHash, "hex");
  if (!timingSafeEqual(expected, Buffer.from(hashCode(token, code), "hex"))) {
    await kv.set("vouchcode", token, { ...pending, attempts: pending.attempts + 1 });
    const left = MAX_ATTEMPTS - pending.attempts - 1;
    return NextResponse.json({ error: left > 0 ? `That code is not right. ${left} ${left === 1 ? "try" : "tries"} left.` : "That code is not right. Send yourself a new one." }, { status: 400 });
  }

  const at = new Date().toISOString();
  const verified = { domain: emailDomain(pending.email), work: isWorkEmail(pending.email), at };
  const endorsements: Endorsement[] = pending.skills.map((competencyId, i) => ({
    id: `end-${Date.now()}-${i}`,
    competencyId,
    name: pending.name,
    role: opened.invite.role,
    organisation: pending.organisation,
    statement: pending.statement,
    createdAt: at,
    verified,
  }));
  if (!(await addEndorsements(token, endorsements))) return NextResponse.json({ error: "This link has already been used." }, { status: 409 });
  await kv.delete("vouchcode", token);
  return NextResponse.json({ added: endorsements.length, verified });
}
