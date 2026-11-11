import { NextResponse } from "next/server";
import { z } from "zod";
import { DATA_RULE, aiErrorResponse, structured, studentWork } from "@/lib/ai";
import { project } from "@/lib/framework";
import { cappedBand, isGrounded } from "@/lib/scoring";
import { getStudent, saveStudent } from "@/lib/store";
import type { CriterionResult, Evidence, ProjectEvaluation } from "@/lib/types";

const Body = z.object({
  projectId: z.string(),
  submission: z.string().min(40).max(40000),
  link: z.string().max(500).optional(),
});

const Grading = z.object({
  summary: z.string(),
  nextStep: z.string(),
  criteria: z.array(
    z.object({
      criterionId: z.string(),
      weaknesses: z.array(z.string()).describe("Every specific flaw, gap or unhandled case in this part of the work"),
      band: z.number().int().describe("0 absent, 1 weak, 2 partial, 3 solid, 4 excellent"),
      rationale: z.string(),
      excerpt: z.string().nullable().describe("A verbatim quote copied from the student's work, or null if there is none"),
    }),
  ),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Paste at least a few lines of your work before submitting." }, { status: 400 });
  }
  const target = project(parsed.data.projectId);
  if (!target) return NextResponse.json({ error: "That project does not exist." }, { status: 404 });

  try {
    const grading = await structured({
      schema: Grading,
      system:
        "You assess student project work against a rubric for a career readiness platform. " +
        "Grade only what the work shows, and never credit skills that are merely stated. " +
        "Be a strict marker. Band 3 is competent entry-level work. Band 4 is rare and means work that a senior reviewer would accept with no changes. " +
        "Check logic as well as form: a query that runs but does not answer the brief cannot earn band 3. " +
        "Before choosing a band, look hard for flaws such as wrong edge cases, unstated assumptions, missing validation or unsupported conclusions, and list each one. " +
        "For every criterion, give a band from 0 to 4, a rationale of one or two sentences, " +
        "and copy the single most relevant passage word for word as the excerpt. " +
        DATA_RULE,
      user:
        `Project: ${target.title}\nBrief: ${target.brief}\n\nRubric:\n` +
        target.rubric.map((c) => `- ${c.id}: ${c.criterion}`).join("\n") +
        `\n\n${studentWork(parsed.data.submission)}`,
    });

    const createdAt = new Date().toISOString();
    // The score is set here rather than by the model: no verbatim quote means no credit.
    const results: CriterionResult[] = target.rubric.map((criterion) => {
      const graded = grading.criteria.find((c) => c.criterionId === criterion.id);
      const verified = isGrounded(graded?.excerpt, parsed.data.submission);
      return {
        criterionId: criterion.id,
        competencyId: criterion.competencyId,
        criterion: criterion.criterion,
        score: verified && graded ? cappedBand(graded.band, graded.weaknesses.length) * 25 : 0,
        rationale: graded
          ? verified
            ? graded.rationale
            : `No verifiable passage supports this criterion. ${graded.rationale}`
          : "This criterion was not assessed.",
        excerpt: verified && graded ? graded.excerpt : null,
        verified,
      };
    });

    const evaluation: ProjectEvaluation = {
      id: `eval-${Date.now()}`,
      projectId: target.id,
      link: parsed.data.link || undefined,
      submission: parsed.data.submission,
      summary: grading.summary,
      nextStep: grading.nextStep,
      results,
      createdAt,
    };

    // A zero means nothing was demonstrated, which is an absence of evidence rather than evidence.
    const evidence: Evidence[] = results
      .filter((r) => r.verified && r.score > 0)
      .map((r, i) => ({
        id: `project-${Date.now()}-${i}`,
        evaluationId: evaluation.id,
        criterionId: r.criterionId,
        competencyId: r.competencyId,
        source: "project",
        score: r.score,
        title: target.title,
        criterion: r.criterion,
        rationale: r.rationale,
        excerpt: r.excerpt ?? undefined,
        createdAt,
      }));

    const student = (await getStudent());
    await saveStudent({
      ...student,
      evaluations: [...student.evaluations, evaluation],
      evidence: [...student.evidence, ...evidence],
    });
    return NextResponse.json({ evaluation });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
