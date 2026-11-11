import { NextResponse } from "next/server";
import { z } from "zod";
import { QUESTIONS, competency, role } from "@/lib/framework";
import { getStudent, saveStudent } from "@/lib/store";
import type { Evidence } from "@/lib/types";

const Body = z.object({ answers: z.record(z.string(), z.number().int()) });

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Answer the questions, then submit again." }, { status: 400 });

  const student = getStudent();
  const required = role(student.targetRoleId).requirements;
  const isReassessment = student.evidence.some((e) => e.source === "assessment");
  const createdAt = new Date().toISOString();

  const evidence: Evidence[] = required.flatMap((requirement, index) => {
    const questions = QUESTIONS.filter((q) => q.competencyId === requirement.competencyId);
    const answered = questions.filter((q) => parsed.data.answers[q.id] !== undefined);
    if (answered.length === 0) return [];
    const correct = answered.filter((q) => parsed.data.answers[q.id] === q.answerIndex).length;
    return [
      {
        id: `assess-${Date.now()}-${index}`,
        competencyId: requirement.competencyId,
        source: "assessment" as const,
        score: Math.round((correct / answered.length) * 100),
        title: isReassessment ? "Reassessment" : "Baseline assessment",
        rationale: `${correct} of ${answered.length} ${competency(requirement.competencyId).name} questions correct.`,
        createdAt,
      },
    ];
  });

  if (evidence.length === 0) return NextResponse.json({ error: "Answer at least one question." }, { status: 400 });
  saveStudent({ ...student, evidence: [...student.evidence, ...evidence] });
  return NextResponse.json({ added: evidence.length });
}
