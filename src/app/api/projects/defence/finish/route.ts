import { NextResponse } from "next/server";
import { z } from "zod";
import { DATA_RULE, aiErrorResponse, structured, studentWork } from "@/lib/ai";
import { DEFENCE_QUESTIONS, DefenceBody } from "@/lib/chat";
import { clampScore, defenceResult, isGrounded } from "@/lib/scoring";
import { getStudent, saveStudent } from "@/lib/store";
import type { DefenceOutcome, Evidence } from "@/lib/types";

const Review = z.object({
  feedback: z.string(),
  outcomes: z.array(
    z.object({
      criterionId: z.string(),
      addressed: z.boolean().describe("False if no question or answer in the transcript touched this criterion"),
      band: z.number().int().describe("0 could not explain the work, 1 weak, 2 partial, 3 solid, 4 excellent"),
      rationale: z.string(),
      excerpt: z.string().nullable().describe("A verbatim quote from the student's answers, or null if there is none"),
    }),
  ),
});

export async function POST(request: Request) {
  const parsed = DefenceBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Answer the questions first." }, { status: 400 });

  const student = getStudent();
  const evaluation = student.evaluations.find((e) => e.id === parsed.data.evaluationId);
  if (!evaluation?.submission) return NextResponse.json({ error: "This project has no submission to defend." }, { status: 404 });
  if (evaluation.defence) return NextResponse.json({ error: "This project has already been defended." }, { status: 409 });

  const answers = parsed.data.messages.filter((m) => m.role === "user").slice(1).map((m) => m.content);
  if (answers.length < DEFENCE_QUESTIONS) {
    return NextResponse.json({ error: `Answer all ${DEFENCE_QUESTIONS} questions before finishing.` }, { status: 400 });
  }

  // Only criteria that earned credit from the original submission can be defended.
  const criteria = evaluation.results.filter((r) => r.verified && r.score > 0);

  try {
    const transcript = parsed.data.messages
      .slice(1)
      .map((m) => `${m.role === "user" ? "Student" : "Examiner"}: ${m.content}`)
      .join("\n\n");

    const review = await structured({
      schema: Review,
      system:
        "You judge whether a student's spoken-style answers show that they understand the project they submitted. " +
        "For each criterion, say whether the transcript addressed it, and give a band from 0 to 4. Judge the answers rather than the original submission. " +
        "An admission of not knowing is band 0. " +
        "A confident answer that does not match the code is weak. Copy the most relevant passage of the student's answers word for word. " +
        "In the feedback, give two sentences to the student. " +
        DATA_RULE,
      user:
        "Criteria:\n" +
        criteria.map((c) => `- ${c.criterionId}: ${c.criterion}`).join("\n") +
        `\n\nOriginal submission:\n${studentWork(evaluation.submission)}` +
        `\n\nDefence transcript:\n${studentWork(transcript)}`,
    });

    const answerText = answers.join("\n");
    const outcomes: DefenceOutcome[] = criteria.flatMap((criterion) => {
      const graded = review.outcomes.find((o) => o.criterionId === criterion.criterionId);
      if (!graded) return [];
      const grounded = isGrounded(graded.excerpt, answerText);
      const band = clampScore(graded.band, 4);
      return [
        {
          criterionId: criterion.criterionId,
          competencyId: criterion.competencyId,
          band,
          rationale: graded.rationale,
          excerpt: grounded ? graded.excerpt : null,
          result: graded.addressed ? defenceResult(band, grounded) : "not-covered",
        },
      ];
    });

    const evidence: Evidence[] = student.evidence.map((item) => {
      if (item.evaluationId !== evaluation.id) return item;
      const result = outcomes.find((o) => o.criterionId === item.criterionId)?.result;
      return result === "defended" || result === "failed" ? { ...item, defence: result } : item;
    });

    saveStudent({
      ...student,
      evidence,
      evaluations: student.evaluations.map((e) =>
        e.id === evaluation.id
          ? { ...e, defence: { feedback: review.feedback, outcomes, createdAt: new Date().toISOString() } }
          : e,
      ),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
