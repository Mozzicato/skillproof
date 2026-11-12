import { describe, expect, it } from "vitest";
import { role } from "./framework";
import { ROSTER, sampleStudent, sampleStudents } from "./roster";
import { competencyScore, isGrounded, readiness } from "./scoring";

describe("sample roster", () => {
  it("has unique student ids", () => {
    const ids = sampleStudents().map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("quotes every project excerpt word for word from the submission, as the grader requires", () => {
    for (const s of ROSTER) {
      for (const ev of s.evaluations) {
        for (const r of ev.results) expect(isGrounded(r.excerpt, ev.submission!), `${s.id} ${ev.projectId} ${r.criterionId}`).toBe(true);
      }
    }
  });

  it("only has confirmations for skills that already have evidence", () => {
    for (const s of ROSTER) {
      for (const e of s.endorsements ?? []) expect(competencyScore(s.evidence, e.competencyId), `${s.id} ${e.competencyId}`).not.toBeNull();
    }
  });

  it("covers a spread of readiness, not ten copies of one story", () => {
    const scores = ROSTER.map((s) => readiness(role(s.targetRoleId).requirements, s.evidence));
    expect(Math.max(...scores) - Math.min(...scores)).toBeGreaterThan(30);
  });

  it("caps work the student could not defend", () => {
    const daniel = sampleStudent("daniel-reyes")!;
    expect(daniel.evidence.filter((e) => e.defence === "failed").length).toBeGreaterThan(0);
  });

  it("rebuilds a sample under a new id for a private demo copy", () => {
    const copy = sampleStudent("lena-clarke", "lena-clarke-1a2b3c4d")!;
    expect(copy.id).toBe("lena-clarke-1a2b3c4d");
    expect(copy.name).toBe("Lena Clarke");
    expect(sampleStudent("nobody")).toBeNull();
  });
});
