import type { Student } from "./types";

export const DEMO_STUDENT_ID = "sam-okoro";

const SAMPLE_SUBMISSION = `import pandas as pd

def remove_duplicates(df):
    return df.drop_duplicates()

def standardise_dates(df):
    df['date'] = pd.to_datetime(df['date'], format='mixed', dayfirst=True)
    return df

def clean(df):
    df = remove_duplicates(df)
    df = standardise_dates(df)
    df = df[df['qty'] > 0]
    return df

Note for the shop: I removed duplicate rows and fixed dates.`;

/** A sample student part-way through the cycle, so every screen has something to show. */
export function seedStudent(id: string = DEMO_STUDENT_ID): Student {
  return {
    id,
    name: "Sam Okoro",
    department: "Statistics",
    university: "Sample University",
    targetRoleId: "data-analyst",
    cvFeedback: null,
    sprint: null,
    assessments: [
      {
        id: "run-1",
        createdAt: "2026-09-08T09:00:00.000Z",
        questionIds: ["py4", "py2", "sql1", "sql3", "dw1", "dw2", "vz2", "vz5", "st1", "st3", "cm1", "cm5", "ps1", "ps5"],
        calibration: 61,
        overconfident: 5,
        underconfident: 2,
        answered: 14,
        skills: [
          { competencyId: "python", claimed: 85, measured: 60 },
          { competencyId: "sql", claimed: 75, measured: 35 },
          { competencyId: "data-wrangling", claimed: 70, measured: 60 },
          { competencyId: "visualisation", claimed: 70, measured: 50 },
          { competencyId: "statistics", claimed: null, measured: 10 },
          { competencyId: "communication", claimed: 80, measured: 90 },
          { competencyId: "problem-solving", claimed: null, measured: 60 },
        ],
      },
      {
        id: "run-2",
        createdAt: "2026-11-02T09:00:00.000Z",
        questionIds: ["st2", "st4", "sql2", "sql6"],
        calibration: 79,
        overconfident: 0,
        underconfident: 1,
        answered: 4,
        skills: [
          { competencyId: "statistics", claimed: null, measured: 35 },
          { competencyId: "sql", claimed: 75, measured: 90 },
        ],
      },
    ],
    endorsements: [
      {
        id: "end-1",
        competencyId: "python",
        name: "Dr Ada Mensah",
        role: "Lecturer",
        organisation: "Sample University, Department of Statistics",
        statement: "I supervised this cleaning script in our data lab. Sam wrote it and explained the date handling to me in person.",
        evaluationId: "eval-1",
        createdAt: "2026-10-20T15:00:00.000Z",
        verified: { domain: "sample-university.example", work: true, at: "2026-10-20T15:00:00.000Z" },
      },
    ],
    claims: [
      { competencyId: "python", level: 85, text: "Advanced Python developer" },
      { competencyId: "sql", level: 75, text: "Strong SQL skills" },
      { competencyId: "data-wrangling", level: 70, text: "Experienced in data cleaning" },
      { competencyId: "visualisation", level: 70, text: "Skilled at building dashboards" },
      { competencyId: "communication", level: 80, text: "Excellent communicator" },
    ],
    evaluations: [
      {
        id: "eval-1",
        projectId: "sales-cleaning",
        submission: SAMPLE_SUBMISSION,
        summary: "The script removes duplicates and standardises dates, but negative quantities are dropped without explanation.",
        nextStep: "State a rule for negative quantities, for example treating them as returns, and apply it explicitly.",
        createdAt: "2026-10-14T11:20:00.000Z",
        results: [
          { criterionId: "c1", competencyId: "python", criterion: "Code is correct, readable and organised into sensible steps", score: 75, rationale: "Clear single-purpose functions and correct use of pandas.", excerpt: "def standardise_dates(df):", verified: true },
          { criterionId: "c2", competencyId: "data-wrangling", criterion: "Handles duplicates, date formats and invalid quantities with explicit rules", score: 50, rationale: "Duplicates and dates are handled; invalid quantities are silently discarded.", excerpt: "df = df[df['qty'] > 0]", verified: true },
          { criterionId: "c3", competencyId: "communication", criterion: "The note lets a non-programmer understand what changed and why", score: 50, rationale: "Lists the steps, but does not say why they matter to the shop.", excerpt: "I removed duplicate rows and fixed dates.", verified: true },
        ],
      },
    ],
    evidence: [
      { id: "e1", competencyId: "python", source: "assessment", score: 60, title: "Baseline assessment", rationale: "Adaptive: medium question right, then hard question wrong (certain).", createdAt: "2026-09-08T09:00:00.000Z" },
      { id: "e2", competencyId: "sql", source: "assessment", score: 35, title: "Baseline assessment", rationale: "Adaptive: medium question wrong (certain), then easy question right (fairly sure).", createdAt: "2026-09-08T09:00:00.000Z" },
      { id: "e3", competencyId: "data-wrangling", source: "assessment", score: 60, title: "Baseline assessment", rationale: "Adaptive: medium question right, then hard question wrong (fairly sure).", createdAt: "2026-09-08T09:00:00.000Z" },
      { id: "e4", competencyId: "visualisation", source: "assessment", score: 50, title: "Baseline assessment", rationale: "Adaptive: medium question right (guessing), then hard question wrong (guessing).", createdAt: "2026-09-08T09:00:00.000Z" },
      { id: "e5", competencyId: "statistics", source: "assessment", score: 10, title: "Baseline assessment", rationale: "Adaptive: medium question wrong (fairly sure), then easy question wrong (fairly sure).", createdAt: "2026-09-08T09:00:00.000Z" },
      { id: "e6", competencyId: "communication", source: "assessment", score: 90, title: "Baseline assessment", rationale: "Adaptive: medium question right (certain), then hard question right (certain).", createdAt: "2026-09-08T09:00:00.000Z" },
      { id: "e7", competencyId: "problem-solving", source: "assessment", score: 60, title: "Baseline assessment", rationale: "Adaptive: medium question right, then hard question wrong (fairly sure).", createdAt: "2026-09-08T09:00:00.000Z" },
      { id: "e8", competencyId: "python", source: "project", score: 75, title: "Clean a messy sales export", criterion: "Code is correct, readable and organised into sensible steps", rationale: "Clear single-purpose functions and correct use of pandas.", excerpt: "def standardise_dates(df):", evaluationId: "eval-1", criterionId: "c1", createdAt: "2026-10-14T11:20:00.000Z" },
      { id: "e9", competencyId: "data-wrangling", source: "project", score: 50, title: "Clean a messy sales export", criterion: "Handles duplicates, date formats and invalid quantities with explicit rules", rationale: "Duplicates and dates are handled; invalid quantities are silently discarded.", excerpt: "df = df[df['qty'] > 0]", evaluationId: "eval-1", criterionId: "c2", createdAt: "2026-10-14T11:20:00.000Z" },
      { id: "e10", competencyId: "communication", source: "project", score: 50, title: "Clean a messy sales export", criterion: "The note lets a non-programmer understand what changed and why", rationale: "Lists the steps, but does not say why they matter to the shop.", excerpt: "I removed duplicate rows and fixed dates.", evaluationId: "eval-1", criterionId: "c3", createdAt: "2026-10-14T11:20:00.000Z" },
      { id: "e11", competencyId: "statistics", source: "assessment", score: 35, title: "Reassessment", rationale: "Adaptive: medium question wrong (guessing), then easy question right (fairly sure).", createdAt: "2026-11-02T09:00:00.000Z" },
      { id: "e12", competencyId: "sql", source: "assessment", score: 90, title: "Reassessment", rationale: "Adaptive: medium question right (certain), then hard question right (fairly sure).", createdAt: "2026-11-02T09:00:00.000Z" },
    ],
  };
}
