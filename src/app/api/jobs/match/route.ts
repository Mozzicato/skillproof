import { NextResponse } from "next/server";
import { z } from "zod";
import { DATA_RULE, aiErrorResponse, structured, studentWork } from "@/lib/ai";
import { PROJECTS, competency } from "@/lib/framework";
import { clampScore, gapRows, isGrounded, readiness } from "@/lib/scoring";
import { getStudent } from "@/lib/store";
import { COMPETENCY_IDS, type CompetencyId, type Requirement } from "@/lib/types";

const Body = z.object({ description: z.string().min(40).max(30000) });

const Extraction = z.object({
  title: z.string(),
  requirements: z.array(
    z.object({
      competencyId: z.enum(COMPETENCY_IDS),
      level: z.number().int().describe("0 to 100: basic 45, working knowledge 60, strong 70, expert 85"),
      text: z.string().describe("The exact phrase from the advert stating this requirement"),
    }),
  ),
  otherSkills: z.array(z.string()).describe("Requirements that match none of the listed competency ids"),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Paste the full job advert first." }, { status: 400 });

  try {
    const extracted = await structured({
      schema: Extraction,
      system:
        "You read job adverts and map entry-level requirements to a fixed list of competency ids. " +
        "Copy the phrase that states each requirement word for word. Set the level from the seniority of the wording. " +
        DATA_RULE.replaceAll("the student", "the advert's author"),
      user: `Competency ids: ${COMPETENCY_IDS.join(", ")}\n\n${studentWork(parsed.data.description)}`,
    });

    const byCompetency = new Map<CompetencyId, Requirement>();
    for (const item of extracted.requirements) {
      if (!isGrounded(item.text, parsed.data.description)) continue;
      const level = Math.max(clampScore(item.level), byCompetency.get(item.competencyId)?.level ?? 0);
      byCompetency.set(item.competencyId, { competencyId: item.competencyId, level });
    }
    const requirements = [...byCompetency.values()];
    if (requirements.length === 0) {
      return NextResponse.json({ error: "No requirements in this advert match the skills SkillProof measures." }, { status: 422 });
    }

    const student = (await getStudent());
    const rows = gapRows(requirements, student.evidence, student.claims).map((row) => ({
      id: row.competencyId,
      name: competency(row.competencyId).name,
      required: row.required,
      score: row.score,
      status: row.status,
      project: row.shortfall > 0 ? (PROJECTS.find((p) => p.rubric.some((c) => c.competencyId === row.competencyId)) ?? null) : null,
    }));

    const levels = requirements.map((r) => r.level).sort((a, b) => a - b);
    const median = levels[Math.floor(levels.length / 2)];

    return NextResponse.json({
      title: extracted.title,
      readiness: readiness(requirements, student.evidence),
      rows: rows.map((r) => ({ ...r, project: r.project && { id: r.project.id, title: r.project.title } })),
      otherSkills: extracted.otherSkills,
      search: { skills: requirements.map((r) => r.competencyId), min: Math.min(Math.max(Math.round(median / 10) * 10, 40), 80) },
    });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
