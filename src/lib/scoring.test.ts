import { describe, expect, it } from "vitest";
import { claimVerdict, clampScore, competencyScore, defenceResult, gapRows, isGrounded, readiness, readinessHistory, skillTrust } from "./scoring";
import type { Evidence } from "./types";

const ev = (over: Partial<Evidence>): Evidence => ({
  id: Math.random().toString(),
  competencyId: "python",
  source: "assessment",
  score: 50,
  title: "t",
  rationale: "r",
  createdAt: "2026-09-01T10:00:00.000Z",
  ...over,
});

describe("competencyScore", () => {
  it("returns null without evidence, even if a claim exists elsewhere", () => {
    expect(competencyScore([], "python")).toBeNull();
  });

  it("weights newer evidence more, so improvement raises the score", () => {
    const older = ev({ score: 40, createdAt: "2026-09-01T10:00:00.000Z" });
    const newer = ev({ score: 80, createdAt: "2026-10-01T10:00:00.000Z" });
    expect(competencyScore([older, newer], "python")).toBeGreaterThan(60);
  });

  it("weights projects above assessments of the same age", () => {
    const quiz = ev({ score: 100, source: "assessment", createdAt: "2026-09-02T10:00:00.000Z" });
    const project = ev({ score: 40, source: "project", createdAt: "2026-09-02T10:00:00.000Z" });
    const reversed = competencyScore([ev({ ...project, source: "assessment" }), ev({ ...quiz, source: "project" })], "python")!;
    expect(reversed).toBeGreaterThan(competencyScore([quiz, project], "python")!);
  });
});

describe("readiness", () => {
  const reqs = [
    { competencyId: "python" as const, level: 50 },
    { competencyId: "sql" as const, level: 50 },
  ];

  it("counts missing evidence as zero", () => {
    expect(readiness(reqs, [ev({ score: 100 })])).toBe(50);
  });

  it("caps each requirement at fully met", () => {
    expect(readiness(reqs, [ev({ score: 100 }), ev({ competencyId: "sql", score: 100 })])).toBe(100);
  });

  it("builds a history with one point per evidence day", () => {
    const history = readinessHistory(reqs, [
      ev({ score: 25, createdAt: "2026-09-01T10:00:00.000Z" }),
      ev({ competencyId: "sql", score: 50, createdAt: "2026-09-08T10:00:00.000Z" }),
    ]);
    expect(history).toEqual([
      { date: "2026-09-01", readiness: 25 },
      { date: "2026-09-08", readiness: 75 },
    ]);
  });
});

describe("gapRows and claims", () => {
  it("does not let a claim close a gap", () => {
    const [row] = gapRows([{ competencyId: "python", level: 70 }], [], [{ competencyId: "python", level: 95, text: "Expert" }]);
    expect(row.status).toBe("No evidence");
    expect(row.shortfall).toBe(70);
    expect(row.claimed).toBe(95);
  });

  it("gives claim verdicts", () => {
    expect(claimVerdict(80, null)).toBe("Unproven");
    expect(claimVerdict(80, 50)).toBe("Partly proven");
    expect(claimVerdict(80, 76)).toBe("Proven");
  });
});

describe("isGrounded", () => {
  const source = "def clean(df):\n    df = df.drop_duplicates()\n    return df";

  it("accepts a real quote across reflowed whitespace", () => {
    expect(isGrounded("def clean(df): df = df.drop_duplicates()", source)).toBe(true);
  });

  it("rejects quotes the student never wrote", () => {
    expect(isGrounded("df.merge(other, on='id')", source)).toBe(false);
  });

  it("rejects empty and trivially short quotes", () => {
    expect(isGrounded(null, source)).toBe(false);
    expect(isGrounded("df", source)).toBe(false);
  });
});

describe("project defence", () => {
  it("caps work the student could not explain", () => {
    expect(competencyScore([ev({ source: "project", score: 100, defence: "failed" })], "python")).toBe(25);
  });

  it("gives defended work more weight than undefended work", () => {
    const older = ev({ source: "project", score: 40, createdAt: "2026-09-01T10:00:00.000Z" });
    const plain = ev({ source: "project", score: 90, createdAt: "2026-10-01T10:00:00.000Z" });
    expect(competencyScore([older, { ...plain, defence: "defended" }], "python")!).toBeGreaterThan(competencyScore([older, plain], "python")!);
  });

  it("needs a real quote to count as defended", () => {
    expect(defenceResult(4, true)).toBe("defended");
    expect(defenceResult(4, false)).toBe("partial");
    expect(defenceResult(2, true)).toBe("partial");
    expect(defenceResult(1, false)).toBe("failed");
  });

  it("reports the strongest proof behind a skill", () => {
    const claims = [{ competencyId: "sql" as const, level: 90, text: "Expert" }];
    expect(skillTrust([], claims, "sql")).toBe("Claimed only");
    expect(skillTrust([], claims, "python")).toBe("No evidence");
    expect(skillTrust([ev({}), ev({ source: "project", defence: "defended" })], [], "python")).toBe("Defended");
    expect(skillTrust([ev({}), ev({ source: "project", defence: "failed" })], [], "python")).toBe("Assessed");
  });
});

describe("clampScore", () => {
  it("keeps model numbers in range", () => {
    expect(clampScore(140)).toBe(100);
    expect(clampScore(-3)).toBe(0);
    expect(clampScore(Number.NaN)).toBe(0);
    expect(clampScore(7, 4)).toBe(4);
  });
});
