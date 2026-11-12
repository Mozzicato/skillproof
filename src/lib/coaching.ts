import { calibrationLabel, latestRun } from "./calibration";
import { competency, role } from "./framework";
import { jobMatches, staleSkills } from "./scoring";
import type { Student } from "./types";

export type ActionTone = "good" | "mid" | "bad" | "";

/** What a coach or careers team should do next for one student, most urgent first. */
export function nextAction(s: Student, now = Date.now()): { label: string; tone: ActionTone } {
  const run = latestRun(s.assessments);
  const ready = jobMatches(s.evidence).filter((m) => m.missing.length === 0).length;
  const stale = staleSkills(role(s.targetRoleId).requirements.map((r) => r.competencyId), s.evidence, now);
  if (s.evidence.length === 0) return { label: "Not started: ask them to take the assessment", tone: "mid" };
  if (run && calibrationLabel(run) === "Overconfident") return { label: "Overconfident: book a feedback session", tone: "bad" };
  if (ready > 0) return { label: `Meets ${ready} ${ready === 1 ? "vacancy" : "vacancies"}: refer to employers`, tone: "good" };
  if (stale.length > 0) return { label: `Evidence ageing on ${stale.length} ${stale.length === 1 ? "skill" : "skills"}: invite to reassess`, tone: "mid" };
  if (s.sprint) return { label: `On a sprint for ${competency(s.sprint.competencyId).name}`, tone: "" };
  return { label: "Building evidence", tone: "" };
}

/** Date of the student's most recent evidence, or null if they have none. */
export function lastActive(s: Student): string | null {
  return s.evidence.reduce<string | null>((latest, e) => (!latest || e.createdAt > latest ? e.createdAt : latest), null);
}

/** Free coaches can follow a small group; the limit is on the pricing page. */
export const FREE_COACH_LEARNERS = 5;
