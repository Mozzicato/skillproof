import { NextResponse } from "next/server";
import { z } from "zod";
import { DATA_RULE, aiErrorResponse, structured, studentWork } from "@/lib/ai";
import { clampScore, isGrounded } from "@/lib/scoring";
import { getStudent, saveStudent } from "@/lib/store";
import { COMPETENCY_IDS, type Claim } from "@/lib/types";

const Body = z.object({ cv: z.string().min(40).max(30000) });

const Analysis = z.object({
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  claims: z.array(
    z.object({
      competencyId: z.enum(COMPETENCY_IDS),
      level: z.number().int().describe("0 to 100: beginner 25, familiar 45, proficient 65, strong 75, advanced 85, expert 95"),
      text: z.string().describe("The exact phrase from the CV making this claim"),
    }),
  ),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Paste the text of your CV first." }, { status: 400 });

  try {
    const analysis = await structured({
      schema: Analysis,
      system:
        "You analyse student CVs. Find each skill claim that maps to one of the listed competency ids, " +
        "keeping at most the strongest claim per competency, and copy the phrase word for word. " +
        "Give up to three strengths and three specific improvements to the CV itself. " +
        DATA_RULE,
      user: `Competency ids: ${COMPETENCY_IDS.join(", ")}\n\n${studentWork(parsed.data.cv)}`,
    });

    const seen = new Set<string>();
    const claims: Claim[] = analysis.claims
      .filter((c) => isGrounded(c.text, parsed.data.cv) && !seen.has(c.competencyId) && seen.add(c.competencyId))
      .map((c) => ({ competencyId: c.competencyId, level: clampScore(c.level), text: c.text }));

    const student = getStudent();
    saveStudent({ ...student, claims, cvFeedback: { strengths: analysis.strengths, improvements: analysis.improvements } });
    return NextResponse.json({ claims: claims.length });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
