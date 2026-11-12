import { NextResponse } from "next/server";
import { z } from "zod";
import { DATA_RULE, aiErrorResponse, structured, studentWork } from "@/lib/ai";
import { cvProjects, cvSkills, groundExperience, mentionsAny, unprovenNames } from "@/lib/cv";
import { role } from "@/lib/framework";
import { getStudent, saveStudent } from "@/lib/store";
import { COMPETENCY_IDS, type OptimisedCv } from "@/lib/types";

const Draft = z.object({
  headline: z.string().describe("Up to 12 words, naming the target role and the strongest evidenced skills"),
  summary: z.string().describe("Two or three sentences, using only the evidenced skills and projects listed"),
  skillLines: z.array(z.object({ competencyId: z.enum(COMPETENCY_IDS), line: z.string().describe("One positive line stating what the evidence shows the student can do. No weaknesses, hedging or scores; those belong in the tips") })),
  projects: z.array(z.object({ title: z.string(), bullets: z.array(z.string()).describe("Two achievement bullets based only on the rubric results given") })),
  experience: z.array(z.object({
    role: z.string(),
    organisation: z.string(),
    dates: z.string(),
    bullets: z.array(z.object({
      text: z.string().describe("A stronger, action-led rewrite for the target role"),
      source: z.string().describe("The exact passage from the CV this bullet rewrites, copied word for word"),
    })),
  })),
  education: z.array(z.object({ line: z.string(), source: z.string().describe("The exact passage from the CV, copied word for word") })),
  tips: z.array(z.string()).describe("Up to three specific ways to strengthen this CV with more evidence"),
});

/** Writes a CV for the target role from the student's evidence and their own CV text. */
export async function POST() {
  const student = await getStudent();
  const target = role(student.targetRoleId);
  const skills = cvSkills(student);
  if (skills.length === 0) return NextResponse.json({ error: "Take the assessment or submit a project first, so there is evidence to build a CV from." }, { status: 400 });
  const projects = cvProjects(student);
  const cvText = student.cvText ?? "";
  const unproven = unprovenNames(student);

  try {
    const draft = await structured({
      schema: Draft,
      system:
        `You write a one-page CV for a student applying for ${target.title}. ` +
        "Skills and their levels are already measured from evidence: describe only those, and never raise a level. " +
        `Do not claim these unproven skills anywhere: ${unproven.join(", ") || "none"}. ` +
        "Project bullets must follow from the rubric results given. " +
        "For experience and education, rewrite the student's own CV in strong, specific, action-led language, and copy the source passage word for word for every bullet. " +
        "Do not invent employers, dates, numbers or qualifications. Use UK English. " +
        DATA_RULE,
      user:
        `Target role: ${target.title}\n\nEvidenced skills:\n${skills.map((s) => `- ${s.competencyId} (${s.name}): ${s.score}/100, ${s.level}. Evidence: ${s.evidence}`).join("\n")}\n\n` +
        `Assessed projects:\n${projects.map((p) => `- ${p.title}\n  ${p.results.join("\n  ")}`).join("\n") || "none"}\n\n` +
        `Student's own CV:\n${cvText ? studentWork(cvText) : "(not provided)"}`,
    });

    const lines = new Map(draft.skillLines.map((l) => [l.competencyId, l.line]));
    const grounded = cvText ? groundExperience(draft.experience, draft.education, cvText) : { experience: [], education: [] };
    const safe = (text: string, fallback: string) => (mentionsAny(text, unproven) ? fallback : text);
    const top = skills.slice(0, 3).map((s) => s.name).join(", ");
    const cv: OptimisedCv = {
      targetRoleId: target.id,
      headline: safe(draft.headline, `${target.title} candidate: ${top}`),
      summary: safe(draft.summary, `${student.department} student aiming for ${target.title}, with evidenced skills in ${top}. Every skill below is scored from assessed work.`),
      skills: skills.map((s) => {
        const line = lines.get(s.competencyId);
        return { competencyId: s.competencyId, name: s.name, score: s.score, level: s.level, line: line && !mentionsAny(line, unproven) ? line : s.evidence };
      }),
      projects: draft.projects
        .filter((p) => projects.some((q) => q.title === p.title))
        .map((p) => ({ title: p.title, bullets: p.bullets.filter((b) => !mentionsAny(b, unproven)).slice(0, 3) })),
      ...grounded,
      tips: draft.tips.slice(0, 3),
      createdAt: new Date().toISOString(),
    };
    await saveStudent({ ...student, optimisedCv: cv });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
