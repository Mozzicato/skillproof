import { describe, expect, it } from "vitest";
import { adaptiveScore, calibration, calibrationLabel, followsPath, mark, nextQuestion } from "./assessment";
import { role } from "./framework";
import { QUESTIONS } from "./questions";
import { gapPriorities, gapValue, growth, proposeSprint, sprintSteps, staleSkills } from "./scoring";
import { seedStudent } from "./seed";
import type { CompetencyId } from "./types";

const level = (id: string) => QUESTIONS.find((q) => q.id === id)!.level;

describe("question bank", () => {
  it("has two questions at every difficulty for each skill a role needs", () => {
    const skills = new Set(["python", "javascript", "sql", "data-wrangling", "visualisation", "statistics", "git-testing", "communication", "problem-solving"]);
    for (const skill of skills) {
      for (const l of [1, 2, 3]) {
        expect(QUESTIONS.filter((q) => q.competencyId === skill && q.level === l), `${skill} level ${l}`).toHaveLength(2);
      }
    }
  });

  it("has unique ids and valid answers", () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    for (const q of QUESTIONS) expect(q.options[q.answerIndex]).toBeDefined();
  });
});

describe("adaptive path", () => {
  const skills: CompetencyId[] = ["sql"];

  it("starts at medium, goes up after a right answer and down after a wrong one", () => {
    const first = nextQuestion(skills, [], new Set())!;
    expect(first.level).toBe(2);
    expect(nextQuestion(skills, [{ questionId: first.id, correct: true }], new Set())!.level).toBe(3);
    expect(nextQuestion(skills, [{ questionId: first.id, correct: false }], new Set())!.level).toBe(1);
  });

  it("finishes a skill after two questions", () => {
    const first = nextQuestion(skills, [], new Set())!;
    const second = nextQuestion(skills, [{ questionId: first.id, correct: true }], new Set())!;
    expect(nextQuestion(skills, [{ questionId: first.id, correct: true }, { questionId: second.id, correct: true }], new Set())).toBeNull();
  });

  it("prefers questions the student has not seen", () => {
    const first = nextQuestion(skills, [], new Set())!;
    const fresh = nextQuestion(skills, [], new Set([first.id]))!;
    expect(fresh.id).not.toBe(first.id);
    expect(fresh.level).toBe(2);
  });

  it("keeps the right difficulty even when every question at it has been seen", () => {
    const mediums = QUESTIONS.filter((q) => q.competencyId === "sql" && q.level === 2).map((q) => q.id);
    expect(nextQuestion(skills, [], new Set(mediums))!.level).toBe(2);
  });

  it("rejects answers that skip the path", () => {
    const medium = QUESTIONS.find((q) => q.competencyId === "sql" && q.level === 2)!;
    const easy = QUESTIONS.find((q) => q.competencyId === "sql" && q.level === 1)!;
    const hard = QUESTIONS.find((q) => q.competencyId === "sql" && q.level === 3)!;
    expect(followsPath(skills, [{ questionId: medium.id, correct: true }, { questionId: hard.id, correct: true }])).toBe(true);
    expect(followsPath(skills, [{ questionId: medium.id, correct: true }, { questionId: easy.id, correct: true }])).toBe(false);
    expect(followsPath(skills, [{ questionId: easy.id, correct: true }])).toBe(false);
  });
});

describe("adaptive score", () => {
  const items = (a: boolean, b: boolean, ca?: "guess" | "fairly" | "certain", cb?: "guess" | "fairly" | "certain") =>
    mark([{ questionId: "sql1", correct: a, confidence: ca }, { questionId: a ? "sql5" : "sql3", correct: b, confidence: cb }]);

  it("rewards harder questions", () => {
    expect(level("sql5")).toBe(3);
    expect(adaptiveScore(items(true, true))).toBe(90);
    expect(adaptiveScore(items(true, false))).toBe(60);
    expect(adaptiveScore(items(false, true))).toBe(35);
    expect(adaptiveScore(items(false, false))).toBe(10);
  });

  it("discounts lucky guesses and penalises confident mistakes", () => {
    expect(adaptiveScore(items(true, true, "guess", "certain"))).toBe(80);
    expect(adaptiveScore(items(true, false, "certain", "certain"))).toBe(50);
  });
});

describe("calibration", () => {
  it("is high when confidence matches results", () => {
    const result = calibration([
      { questionId: "a", correct: true, confidence: "certain" },
      { questionId: "b", correct: false, confidence: "guess" },
    ]);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(calibrationLabel({ calibration: result.score, ...result })).toBe("Well calibrated");
  });

  it("flags students who are sure of wrong answers", () => {
    const result = calibration([
      { questionId: "a", correct: false, confidence: "certain" },
      { questionId: "b", correct: false, confidence: "certain" },
      { questionId: "c", correct: true, confidence: "certain" },
    ]);
    expect(result.overconfident).toBe(2);
    expect(calibrationLabel({ calibration: result.score, ...result })).toBe("Overconfident");
  });
});

describe("cycle stages", () => {
  const student = seedStudent();
  const target = role(student.targetRoleId);

  it("ranks gaps by the jobs closing them would unlock", () => {
    const priorities = gapPriorities(target, student);
    expect(priorities.length).toBeGreaterThan(0);
    for (const p of priorities) expect(p.shortfall).toBeGreaterThan(0);
    const score = gapValue;
    for (let i = 1; i < priorities.length; i++) expect(score(priorities[i - 1])).toBeGreaterThanOrEqual(score(priorities[i]));
  });

  it("proposes a sprint on the top gap with a project criterion that proves it", () => {
    const plan = proposeSprint(target, student)!;
    expect(plan.competencyId).toBe(gapPriorities(target, student)[0].competencyId);
  });

  it("ticks sprint steps only from evidence", () => {
    const sprint = { competencyId: "data-wrangling" as const, projectId: "sales-cleaning", criterionId: "c2", target: 70, startedAt: "2026-10-01T00:00:00.000Z", dueAt: "2026-10-15T00:00:00.000Z" };
    const steps = sprintSteps(sprint, student, "Clean", "rules");
    expect(steps.map((s) => s.done)).toEqual([true, false, false, false]);
    const sqlSprint = { ...sprint, competencyId: "sql" as const, projectId: "sql-retention", criterionId: "c1" };
    expect(sprintSteps(sqlSprint, student, "SQL", "joins")[3].done).toBe(true);
  });

  it("flags evidence older than the limit and reports growth", () => {
    const stale = staleSkills(["visualisation", "sql"], student.evidence, new Date("2026-11-11").getTime());
    expect(stale.map((s) => s.competencyId)).toEqual(["visualisation"]);
    expect(growth(student.evidence, "sql")).toMatchObject({ from: 35, since: "2026-09-08" });
  });
});
