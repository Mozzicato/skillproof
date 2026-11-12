import { NextResponse } from "next/server";
import { z } from "zod";
import { FREE_COACH_LEARNERS } from "@/lib/coaching";
import { createCoach, joinCoach } from "@/lib/store";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), name: z.string().trim().min(2, "Enter the name learners will see.").max(80) }),
  z.object({ action: z.literal("join"), token: z.string().min(10).max(64) }),
]);

const JOIN_ERRORS = {
  invalid: [404, "This coach link is not valid."],
  self: [400, "This is your own coach link. Send it to a learner."],
  full: [409, `This coach already follows ${FREE_COACH_LEARNERS} learners, the most the Free plan allows.`],
} as const;

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form and try again." }, { status: 400 });
  if (parsed.data.action === "create") {
    const coach = await createCoach(parsed.data.name);
    return NextResponse.json({ token: coach.token });
  }
  const result = await joinCoach(parsed.data.token, FREE_COACH_LEARNERS);
  if (result === "joined" || result === "already") return NextResponse.json({ result });
  const [status, error] = JOIN_ERRORS[result];
  return NextResponse.json({ error }, { status });
}
