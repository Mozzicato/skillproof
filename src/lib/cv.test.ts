import { describe, expect, it } from "vitest";
import { cvSkills, groundExperience, mentionsAny, unprovenNames } from "./cv";
import { sniff, tidy } from "./cvfile";
import { sampleStudent } from "./roster";

const CV = `Sales assistant, Harbour Stores, 2024 to 2025
Handled customer queries at the till and restocked shelves every morning.
BSc Business Administration, Sample University, expected 2027`;

describe("optimised CV rules", () => {
  it("lists only skills evidenced at 40 or more, with role requirements first", () => {
    const daniel = sampleStudent("daniel-reyes")!;
    const skills = cvSkills(daniel);
    expect(skills.every((s) => s.score >= 40)).toBe(true);
    expect(skills.map((s) => s.name)).not.toContain("Python");
    expect(unprovenNames(daniel)).toContain("Python");
  });

  it("drops experience and education that the student's own CV does not contain", () => {
    const result = groundExperience(
      [
        { role: "Sales assistant", organisation: "Harbour Stores", dates: "2024 to 2025", bullets: [
          { text: "Resolved customer queries at the point of sale", source: "Handled customer queries at the till" },
          { text: "Increased sales by 40%", source: "increased sales by 40%" },
        ] },
        { role: "Data intern", organisation: "Made Up Ltd", dates: "2023", bullets: [{ text: "Built dashboards", source: "Built dashboards" }] },
      ],
      [{ line: "BSc Business Administration", source: "BSc Business Administration, Sample University" }, { line: "MSc Data Science", source: "MSc Data Science" }],
      CV,
    );
    expect(result.experience).toEqual([{ role: "Sales assistant", organisation: "Harbour Stores", dates: "2024 to 2025", bullets: ["Resolved customer queries at the point of sale"] }]);
    expect(result.education).toEqual(["BSc Business Administration"]);
  });

  it("spots unproven skill names as whole words", () => {
    expect(mentionsAny("Strong Python and SQL skills", ["Python"])).toBe(true);
    expect(mentionsAny("Pythonic thinking", ["Python"])).toBe(false);
  });
});

describe("CV files", () => {
  const bytes = (s: string) => new TextEncoder().encode(s);
  it("recognises files by their content, not just their name", () => {
    expect(sniff(bytes("%PDF-1.7 ..."), "cv.txt")).toBe("pdf");
    expect(sniff(new Uint8Array([0x50, 0x4b, 3, 4]), "cv.docx")).toBe("docx");
    expect(sniff(bytes("plain text cv"), "cv.txt")).toBe("text");
    expect(sniff(new Uint8Array([0x4d, 0x5a, 0, 0]), "cv.pdf")).toBeNull();
    expect(sniff(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0]), "cv.doc")).toBeNull();
  });

  it("tidies extracted whitespace", () => {
    expect(tidy("Name   Here\r\n\r\n\r\n\r\nSkills\t  SQL ")).toBe("Name Here\n\nSkills SQL");
  });
});
