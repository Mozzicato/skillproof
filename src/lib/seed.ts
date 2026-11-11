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
      { id: "e1", competencyId: "python", source: "assessment", score: 50, title: "Baseline assessment", rationale: "1 of 2 Python questions correct.", createdAt: "2026-09-08T09:00:00.000Z" },
      { id: "e2", competencyId: "sql", source: "assessment", score: 50, title: "Baseline assessment", rationale: "1 of 2 SQL questions correct.", createdAt: "2026-09-08T09:00:00.000Z" },
      { id: "e3", competencyId: "data-wrangling", source: "assessment", score: 50, title: "Baseline assessment", rationale: "1 of 2 data wrangling questions correct.", createdAt: "2026-09-08T09:00:00.000Z" },
      { id: "e4", competencyId: "visualisation", source: "assessment", score: 50, title: "Baseline assessment", rationale: "1 of 2 data visualisation questions correct.", createdAt: "2026-09-08T09:00:00.000Z" },
      { id: "e5", competencyId: "statistics", source: "assessment", score: 0, title: "Baseline assessment", rationale: "0 of 2 statistics questions correct.", createdAt: "2026-09-08T09:00:00.000Z" },
      { id: "e6", competencyId: "communication", source: "assessment", score: 100, title: "Baseline assessment", rationale: "2 of 2 communication questions correct.", createdAt: "2026-09-08T09:00:00.000Z" },
      { id: "e7", competencyId: "problem-solving", source: "assessment", score: 50, title: "Baseline assessment", rationale: "1 of 2 problem solving questions correct.", createdAt: "2026-09-08T09:00:00.000Z" },
      { id: "e8", competencyId: "python", source: "project", score: 75, title: "Clean a messy sales export", criterion: "Code is correct, readable and organised into sensible steps", rationale: "Clear single-purpose functions and correct use of pandas.", excerpt: "def standardise_dates(df):", evaluationId: "eval-1", criterionId: "c1", createdAt: "2026-10-14T11:20:00.000Z" },
      { id: "e9", competencyId: "data-wrangling", source: "project", score: 50, title: "Clean a messy sales export", criterion: "Handles duplicates, date formats and invalid quantities with explicit rules", rationale: "Duplicates and dates are handled; invalid quantities are silently discarded.", excerpt: "df = df[df['qty'] > 0]", evaluationId: "eval-1", criterionId: "c2", createdAt: "2026-10-14T11:20:00.000Z" },
      { id: "e10", competencyId: "communication", source: "project", score: 50, title: "Clean a messy sales export", criterion: "The note lets a non-programmer understand what changed and why", rationale: "Lists the steps, but does not say why they matter to the shop.", excerpt: "I removed duplicate rows and fixed dates.", evaluationId: "eval-1", criterionId: "c3", createdAt: "2026-10-14T11:20:00.000Z" },
      { id: "e11", competencyId: "statistics", source: "assessment", score: 50, title: "Reassessment", rationale: "1 of 2 statistics questions correct.", createdAt: "2026-11-02T09:00:00.000Z" },
      { id: "e12", competencyId: "sql", source: "assessment", score: 100, title: "Reassessment", rationale: "2 of 2 SQL questions correct.", createdAt: "2026-11-02T09:00:00.000Z" },
    ],
  };
}
