import { NextResponse } from "next/server";
import { z } from "zod";
import { DATA_RULE, aiErrorResponse, structured, studentWork } from "@/lib/ai";
import { assessmentTask } from "@/lib/framework";
import { cappedBand, isGrounded } from "@/lib/scoring";
import { getStudent, saveStudent } from "@/lib/store";
import type { Evidence } from "@/lib/types";

const Body = z.object({ answer: z.string().min(20).max(8000) });

const Grading = z.object({
  weaknesses: z.array(z.string()).describe("Every specific flaw, gap or unhandled case"),
  band: z.number().int().describe("0 absent, 1 weak, 2 partial, 3 solid, 4 excellent"),
  rationale: z.string(),
  excerpt: z.string().nullable().describe("A verbatim quote copied from the student's answer, or null if there is none"),
});

/** The applied task at the end of the assessment. Same rule as projects: no verbatim quote, no credit. */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Write a little more before submitting your answer." }, { status: 400 });

  const student = await getStudent();
  const task = assessmentTask(student.targetRoleId);
  try {
    const grading = await structured({
      schema: Grading,
      system:
        "You grade a short applied task in a career readiness assessment. Be a strict marker. " +
        "Band 3 is correct entry-level work. Band 4 is rare and means a senior reviewer would accept it unchanged. " +
        "Check the logic, not just the form, and list every flaw before choosing a band. " +
        "Give a one or two sentence rationale and copy the most relevant passage word for word as the excerpt. " +
        DATA_RULE,
      user: `Task: ${task.prompt}\nCriterion: ${task.criterion}\n\n${studentWork(parsed.data.answer)}`,
    });
    const verified = isGrounded(grading.excerpt, parsed.data.answer);
    const score = verified ? cappedBand(grading.band, grading.weaknesses.length) * 25 : 0;
    const rationale = verified ? grading.rationale : `No verifiable passage supports a score. ${grading.rationale}`;

    if (score > 0) {
      const evidence: Evidence = {
        id: `task-${Date.now()}`,
        competencyId: task.competencyId,
        source: "assessment",
        score,
        title: "Assessment task",
        criterion: task.criterion,
        rationale,
        excerpt: grading.excerpt ?? undefined,
        createdAt: new Date().toISOString(),
      };
      await saveStudent({ ...student, evidence: [...student.evidence, evidence] });
    }
    return NextResponse.json({ score, rationale, excerpt: verified ? grading.excerpt : null, weaknesses: grading.weaknesses.slice(0, 3) });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
