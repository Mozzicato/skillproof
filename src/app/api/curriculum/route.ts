import { NextResponse } from "next/server";
import { z } from "zod";
import { DATA_RULE, aiErrorResponse, structured, studentWork } from "@/lib/ai";
import { DEPARTMENTS } from "@/lib/cohort";
import { isGrounded } from "@/lib/scoring";
import { saveCurriculum } from "@/lib/store";
import { COMPETENCY_IDS, type CompetencyId } from "@/lib/types";

const Body = z.object({ department: z.string(), syllabus: z.string().min(40).max(60000) });

const Extraction = z.object({
  taught: z.array(
    z.object({
      competencyId: z.enum(COMPETENCY_IDS),
      quote: z.string().describe("The exact phrase from the syllabus showing this is taught"),
    }),
  ),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !DEPARTMENTS.some((d) => d.name === parsed.data.department)) {
    return NextResponse.json({ error: "Choose a department and paste its syllabus." }, { status: 400 });
  }

  try {
    const { taught } = await structured({
      schema: Extraction,
      system:
        "You read university syllabi and identify which competencies are actively taught. " +
        "Include a competency only if the syllabus teaches or assesses it, and copy the phrase showing that word for word. " +
        DATA_RULE.replaceAll("the student", "the syllabus author"),
      user: `Competency ids: ${COMPETENCY_IDS.join(", ")}\n\n${studentWork(parsed.data.syllabus)}`,
    });

    const seen = new Set<CompetencyId>();
    const topics = taught.filter((t) => {
      if (seen.has(t.competencyId) || !isGrounded(t.quote, parsed.data.syllabus)) return false;
      seen.add(t.competencyId);
      return true;
    });

    if (topics.length === 0) {
      return NextResponse.json({ error: "No skills SkillProof measures were found in this syllabus." }, { status: 422 });
    }
    saveCurriculum(parsed.data.department, topics);
    return NextResponse.json({ topics: topics.length });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
