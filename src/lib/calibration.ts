import type { AssessmentRun, Confidence } from "./types";

/** Safe for the browser: no questions or answers in here. */

/** The chance of being right that each confidence level implies. Four options make a pure guess 25%. */
export const CONFIDENCE_P: Record<Confidence, number> = { guess: 0.25, fairly: 0.7, certain: 0.95 };

export const CONFIDENCE_LABEL: Record<Confidence, string> = { guess: "Guessing", fairly: "Fairly sure", certain: "Certain" };

export type CalibrationLabel = "Well calibrated" | "Overconfident" | "Underconfident" | "Mixed";

export function calibrationLabel(run: Pick<AssessmentRun, "calibration" | "overconfident" | "underconfident">): CalibrationLabel {
  if (run.calibration >= 80) return "Well calibrated";
  if (run.overconfident > run.underconfident) return "Overconfident";
  if (run.underconfident > run.overconfident) return "Underconfident";
  return "Mixed";
}

export function latestRun(runs: AssessmentRun[] | undefined): AssessmentRun | null {
  return runs?.length ? [...runs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] : null;
}
