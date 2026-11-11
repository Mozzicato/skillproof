import { NextResponse } from "next/server";
import { z } from "zod";
import { adaptiveScore, calibration, followsPath, mark, pathDescription } from "@/lib/assessment";
import { competency, role } from "@/lib/framework";
import { question } from "@/lib/questions";
import { getStudent, saveStudent } from "@/lib/store";
import { COMPETENCY_IDS, type AssessmentRun, type Claim, type Evidence } from "@/lib/types";

const Body = z.object({
  claims: z.partialRecord(z.enum(COMPETENCY_IDS), z.number().int().min(0).max(100)),
  answers: z
    .array(z.object({ questionId: z.string(), choice: z.string(), confidence: z.enum(["guess", "fairly", "certain"]) }))
    .min(1)
    .max(40),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Answer the questions and rate your confidence, then submit again." }, { status: 400 });

  const student = await getStudent();
  const required = role(student.targetRoleId).requirements;
  const skills = required.map((r) => r.competencyId);
  const answered = parsed.data.answers.map((a) => {
    const q = question(a.questionId);
    return { questionId: a.questionId, confidence: a.confidence, correct: q ? q.options[q.answerIndex] === a.choice : false };
  });
  if (!followsPath(skills, answered)) {
    return NextResponse.json({ error: "These answers do not match the questions you were given. Start the assessment again." }, { status: 400 });
  }

  const isReassessment = student.evidence.some((e) => e.source === "assessment");
  const createdAt = new Date().toISOString();
  const marked = mark(answered);
  const claimFor = (id: (typeof skills)[number]) => parsed.data.claims[id] ?? student.claims.find((c) => c.competencyId === id)?.level ?? null;

  const results = skills.flatMap((id) => {
    const items = marked.filter((m) => m.competencyId === id);
    return items.length ? [{ competencyId: id, claimed: claimFor(id), measured: adaptiveScore(items), items }] : [];
  });

  const evidence: Evidence[] = results.map((r, index) => ({
    id: `assess-${Date.now()}-${index}`,
    competencyId: r.competencyId,
    source: "assessment",
    score: r.measured,
    title: isReassessment ? "Reassessment" : "Baseline assessment",
    rationale: `Adaptive: ${pathDescription(r.items)}.`,
    createdAt,
  }));

  const cal = calibration(answered);
  const run: AssessmentRun = {
    id: `run-${Date.now()}`,
    createdAt,
    questionIds: answered.map((a) => a.questionId),
    calibration: cal.score,
    overconfident: cal.overconfident,
    underconfident: cal.underconfident,
    answered: answered.length,
    skills: results.map(({ competencyId, claimed, measured }) => ({ competencyId, claimed, measured })),
  };

  // The self-ratings become the student's claims, so the gap between claimed and proven stays visible everywhere.
  const rated = Object.entries(parsed.data.claims) as [Claim["competencyId"], number][];
  const claims: Claim[] = [
    ...student.claims.filter((c) => !(c.competencyId in parsed.data.claims)),
    ...rated.map(([competencyId, level]) => ({
      competencyId,
      level,
      text: student.claims.find((c) => c.competencyId === competencyId)?.text ?? `Rated own ${competency(competencyId).name} at ${level}`,
    })),
  ];

  await saveStudent({
    ...student,
    claims,
    evidence: [...student.evidence, ...evidence],
    assessments: [...(student.assessments ?? []), run],
  });
  return NextResponse.json({ run });
}
