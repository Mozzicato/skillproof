import { describe, expect, it } from "vitest";
import { nextAction } from "./coaching";
import { sampleStudent } from "./roster";
import { emailDomain, hashCode, isWorkEmail, newCode } from "./verify";

describe("confirmation emails", () => {
  it("treats personal mailboxes as personal and organisation domains as work", () => {
    expect(isWorkEmail("ada@gmail.com")).toBe(false);
    expect(isWorkEmail("Ada@Outlook.com")).toBe(false);
    expect(isWorkEmail("ada.mensah@unilag.edu.ng")).toBe(true);
    expect(isWorkEmail("not-an-email")).toBe(false);
    expect(emailDomain(" Ada@Unilag.EDU.ng ")).toBe("unilag.edu.ng");
  });

  it("issues six-digit codes and binds each hash to its invite", () => {
    expect(newCode()).toMatch(/^\d{6}$/);
    expect(hashCode("token-a", "123456")).not.toBe(hashCode("token-b", "123456"));
    expect(hashCode("token-a", "123456")).toBe(hashCode("token-a", "123456"));
  });
});

describe("coach next steps", () => {
  it("flags an overconfident learner before anything else", () => {
    expect(nextAction(sampleStudent("daniel-reyes")!).tone).toBe("bad");
  });

  it("asks a learner with no evidence to start", () => {
    const empty = { ...sampleStudent("grace-tembo")!, evidence: [], assessments: [] };
    expect(nextAction(empty).label).toMatch(/Not started/);
  });
});
