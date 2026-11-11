import { z } from "zod";
import { competency, role } from "./framework";
import { competencyScore, gapRows, levelName, readiness } from "./scoring";
import type { Student } from "./types";

export const ChatBody = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(8000) }))
    .min(1)
    .max(40),
});

export const DEFENCE_QUESTIONS = 3;

export const DefenceBody = ChatBody.extend({ evaluationId: z.string() });

/** A plain-text picture of the student's evidence, for the coach and interviewer. */
export function studentContext(student: Student): string {
  const target = role(student.targetRoleId);
  const lines = gapRows(target.requirements, student.evidence, student.claims).map((row) => {
    const score = competencyScore(student.evidence, row.competencyId);
    return `- ${competency(row.competencyId).name}: evidenced ${score ?? "none"} (${levelName(score)}), required ${row.required}, status ${row.status}`;
  });
  return [
    `Student: ${student.name}, ${student.department}`,
    `Target role: ${target.title}`,
    `Readiness: ${readiness(target.requirements, student.evidence)} of 100`,
    "Skills:",
    ...lines,
  ].join("\n");
}
