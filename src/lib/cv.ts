import { COMPETENCIES, competency, project, role } from "./framework";
import { competencyScore, isGrounded, levelName, newestFirst } from "./scoring";
import type { CompetencyId, OptimisedCv, Student } from "./types";

/** Skills a CV may list: evidenced at 40 or more, ordered by what the target role needs, then by score. */
export function cvSkills(student: Student) {
  const needed = role(student.targetRoleId).requirements.map((r) => r.competencyId);
  return COMPETENCIES.flatMap((c) => {
    const score = competencyScore(student.evidence, c.id);
    if (score === null || score < 40) return [];
    const best = newestFirst(student.evidence).find((e) => e.competencyId === c.id && e.excerpt) ?? newestFirst(student.evidence).find((e) => e.competencyId === c.id)!;
    return [{ competencyId: c.id, name: c.name, score, level: levelName(score), evidence: `${best.title}: ${best.rationale}` }];
  }).sort((a, b) => Number(needed.includes(b.competencyId)) - Number(needed.includes(a.competencyId)) || b.score - a.score);
}

export function cvProjects(student: Student) {
  return student.evaluations.map((e) => ({
    title: project(e.projectId)?.title ?? "Project",
    results: e.results.map((r) => `${competency(r.competencyId).name} ${r.score}/100: ${r.rationale}${e.defence?.outcomes.find((o) => o.criterionId === r.criterionId)?.result === "defended" ? " (defended in person)" : ""}`),
  }));
}

/** Names of skills the student has not evidenced, which the CV text must not claim. */
export function unprovenNames(student: Student): string[] {
  const allowed = new Set(cvSkills(student).map((s) => s.competencyId));
  return COMPETENCIES.filter((c) => !allowed.has(c.id) && c.category === "Technical").map((c) => c.name);
}

export function mentionsAny(text: string, names: string[]): boolean {
  const lower = text.toLowerCase();
  return names.some((n) => new RegExp(`\\b${n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(lower));
}

/** Keeps only experience and education the student's own CV supports, word for word. */
export function groundExperience(
  items: { role: string; organisation: string; dates: string; bullets: { text: string; source: string }[] }[],
  education: { line: string; source: string }[],
  cvText: string,
): Pick<OptimisedCv, "experience" | "education"> {
  return {
    experience: items
      .filter((i) => isGrounded(i.organisation, cvText) || isGrounded(i.role, cvText))
      .map((i) => ({ role: i.role, organisation: i.organisation, dates: i.dates, bullets: i.bullets.filter((b) => isGrounded(b.source, cvText)).map((b) => b.text) }))
      .filter((i) => i.bullets.length > 0),
    education: education.filter((e) => isGrounded(e.source, cvText)).map((e) => e.line),
  };
}

export function cvPlainText(student: Student, cv: OptimisedCv): string {
  const lines = [student.name, cv.headline, `${student.department}, ${student.university}`, "", cv.summary, "", "SKILLS (scored from evidence)"];
  cv.skills.forEach((s) => lines.push(`${s.name}, ${s.level} (${s.score}/100): ${s.line}`));
  if (cv.projects.length) { lines.push("", "ASSESSED PROJECTS"); cv.projects.forEach((p) => { lines.push(p.title); p.bullets.forEach((b) => lines.push(`- ${b}`)); }); }
  if (cv.experience.length) { lines.push("", "EXPERIENCE"); cv.experience.forEach((e) => { lines.push(`${e.role}, ${e.organisation}${e.dates ? `, ${e.dates}` : ""}`); e.bullets.forEach((b) => lines.push(`- ${b}`)); }); }
  if (cv.education.length) { lines.push("", "EDUCATION", ...cv.education); }
  return lines.join("\n");
}

export type CvSkill = ReturnType<typeof cvSkills>[number];
export type { CompetencyId };
