import { QUESTIONS, question } from "./questions";
import { clampScore } from "./scoring";
import { CONFIDENCE_LABEL, CONFIDENCE_P } from "./calibration";
import type { CompetencyId, Confidence, Question } from "./types";

/** Questions asked per skill: one medium, then one harder or easier depending on the answer. */
export const PER_SKILL = 2;

export { CONFIDENCE_LABEL, CONFIDENCE_P, calibrationLabel, latestRun, type CalibrationLabel } from "./calibration";

export interface Answered {
  questionId: string;
  correct: boolean;
  confidence?: Confidence;
}

export interface MarkedItem extends Answered {
  competencyId: CompetencyId;
  level: number;
}

/** The difficulty the next question for a skill should have, or null when the skill is finished. */
function nextLevel(items: MarkedItem[]): number | null {
  if (items.length === 0) return 2;
  if (items.length === 1) return items[0].correct ? 3 : 1;
  return null;
}

/**
 * Picks the next question at the difficulty the path calls for. Within that difficulty, questions this student
 * has seen in earlier assessments are used only when nothing fresh is left. Difficulty always wins over freshness.
 */
export function nextQuestion(skills: CompetencyId[], answered: Answered[], seen: Set<string>): Question | null {
  const marked = mark(answered);
  const used = new Set(answered.map((a) => a.questionId));
  const freshFirst = (list: Question[]) => [...list].sort((a, b) => Number(seen.has(a.id)) - Number(seen.has(b.id)));
  for (const skill of skills) {
    const level = nextLevel(marked.filter((m) => m.competencyId === skill));
    if (level === null) continue;
    const pool = QUESTIONS.filter((q) => q.competencyId === skill && !used.has(q.id));
    const atLevel = pool.filter((q) => q.level === level);
    const choice = freshFirst(atLevel.length ? atLevel : pool)[0];
    if (choice) return choice;
  }
  return null;
}

export function mark(answered: Answered[]): MarkedItem[] {
  return answered.flatMap((a) => {
    const q = question(a.questionId);
    return q ? [{ ...a, competencyId: q.competencyId, level: q.level }] : [];
  });
}

/** True when the answers follow the adaptive path, so nobody can pick only the questions they like. */
export function followsPath(skills: CompetencyId[], answered: Answered[]): boolean {
  const marked = mark(answered);
  if (marked.length !== answered.length) return false;
  return skills.every((skill) => {
    const items = marked.filter((m) => m.competencyId === skill);
    if (items.length > PER_SKILL) return false;
    return items.every((item, i) => {
      const expected = nextLevel(items.slice(0, i));
      const available = QUESTIONS.some((q) => q.competencyId === skill && q.level === expected);
      return !available || item.level === expected;
    });
  });
}

/**
 * The measured score for one skill. Answering a hard question proves more than an easy one.
 * A lucky guess is worth less than knowing, and a confident wrong answer costs more than an honest guess.
 */
export function adaptiveScore(items: MarkedItem[]): number {
  if (items.length === 0) return 0;
  const [first, second] = items;
  let score = first.correct ? 60 : 20;
  if (second) score = first.correct ? (second.correct ? 90 : 60) : second.correct ? 35 : 10;
  for (const item of items) {
    if (item.confidence === "certain" && !item.correct) score -= 10;
    if (item.confidence === "guess" && item.correct) score -= 10;
  }
  return clampScore(score);
}

export function pathDescription(items: MarkedItem[]): string {
  const names = ["", "easy", "medium", "hard"];
  return items
    .map((i) => `${names[i.level]} question ${i.correct ? "right" : "wrong"}${i.confidence ? ` (${CONFIDENCE_LABEL[i.confidence].toLowerCase()})` : ""}`)
    .join(", then ");
}

/** 0 to 100: how close each stated confidence was to the result. 100 means the student always knew whether they knew. */
export function calibration(items: Answered[]): { score: number; overconfident: number; underconfident: number } {
  const rated = items.filter((i): i is Answered & { confidence: Confidence } => i.confidence !== undefined);
  if (rated.length === 0) return { score: 0, overconfident: 0, underconfident: 0 };
  const error = rated.reduce((sum, i) => sum + Math.abs(CONFIDENCE_P[i.confidence] - (i.correct ? 1 : 0)), 0) / rated.length;
  return {
    score: clampScore((1 - error) * 100),
    overconfident: rated.filter((i) => i.confidence !== "guess" && !i.correct).length,
    underconfident: rated.filter((i) => i.confidence === "guess" && i.correct).length,
  };
}
