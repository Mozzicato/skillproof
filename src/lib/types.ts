export const COMPETENCY_IDS = [
  "python",
  "javascript",
  "sql",
  "data-wrangling",
  "visualisation",
  "statistics",
  "git-testing",
  "communication",
  "problem-solving",
  "digital-literacy",
] as const;

export type CompetencyId = (typeof COMPETENCY_IDS)[number];

export interface Competency {
  id: CompetencyId;
  name: string;
  category: "Technical" | "Professional";
  description: string;
}

export interface Requirement {
  competencyId: CompetencyId;
  level: number;
}

export interface Role {
  id: string;
  title: string;
  requirements: Requirement[];
}

/** 1 easy, 2 medium, 3 hard. The assessment starts at medium and moves up or down. */
export type Difficulty = 1 | 2 | 3;

export interface Question {
  id: string;
  competencyId: CompetencyId;
  level: Difficulty;
  prompt: string;
  options: string[];
  answerIndex: number;
}

export type Confidence = "guess" | "fairly" | "certain";

/** A short open task in the assessment, graded by AI against a rubric. */
export interface AssessmentTask {
  roleId: string;
  competencyId: CompetencyId;
  prompt: string;
  criterion: string;
}

export interface SkillResult {
  competencyId: CompetencyId;
  claimed: number | null;
  measured: number;
}

/** One completed assessment, kept so the next one can use fresh questions and show calibration. */
export interface AssessmentRun {
  id: string;
  createdAt: string;
  questionIds: string[];
  /** 0 to 100: how closely the student's confidence matched their results. */
  calibration: number;
  overconfident: number;
  underconfident: number;
  answered: number;
  skills: SkillResult[];
}

/** A two-week commitment to close one gap, with the proof that will count. */
export interface Sprint {
  competencyId: CompetencyId;
  projectId: string;
  criterionId: string;
  target: number;
  startedAt: string;
  dueAt: string;
}

export type EndorserRole = "Lecturer" | "Mentor" | "Employer";

export interface Endorsement {
  id: string;
  competencyId: CompetencyId;
  name: string;
  role: EndorserRole;
  organisation: string;
  statement: string;
  evaluationId?: string;
  createdAt: string;
}

export interface RubricCriterion {
  id: string;
  competencyId: CompetencyId;
  criterion: string;
}

export interface Project {
  id: string;
  title: string;
  brief: string;
  deliverable: string;
  rubric: RubricCriterion[];
}

export interface Job {
  id: string;
  company: string;
  title: string;
  type: "Internship" | "Entry-level";
  location: string;
  requirements: Requirement[];
}

export type EvidenceSource = "assessment" | "project" | "interview";

export interface Evidence {
  id: string;
  competencyId: CompetencyId;
  source: EvidenceSource;
  score: number;
  title: string;
  rationale: string;
  criterion?: string;
  excerpt?: string;
  evaluationId?: string;
  criterionId?: string;
  defence?: "defended" | "failed";
  createdAt: string;
}

export type DefenceResultKind = "defended" | "partial" | "failed" | "not-covered";

export interface DefenceOutcome {
  criterionId: string;
  competencyId: CompetencyId;
  band: number;
  rationale: string;
  excerpt: string | null;
  result: DefenceResultKind;
}

export interface Defence {
  feedback: string;
  outcomes: DefenceOutcome[];
  createdAt: string;
}

/** What a department teaches, taken from an uploaded syllabus, keyed by department. */
export type Curricula = Record<string, { competencyId: CompetencyId; quote: string }[]>;

export interface Claim {
  competencyId: CompetencyId;
  level: number;
  text: string;
}

export interface CriterionResult {
  criterionId: string;
  competencyId: CompetencyId;
  criterion: string;
  score: number;
  rationale: string;
  excerpt: string | null;
  verified: boolean;
}

export interface ProjectEvaluation {
  id: string;
  projectId: string;
  link?: string;
  summary: string;
  nextStep: string;
  results: CriterionResult[];
  submission?: string;
  defence?: Defence;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  department: string;
  university: string;
  targetRoleId: string;
  claims: Claim[];
  evidence: Evidence[];
  evaluations: ProjectEvaluation[];
  cvFeedback: { strengths: string[]; improvements: string[] } | null;
  assessments?: AssessmentRun[];
  sprint?: Sprint | null;
  endorsements?: Endorsement[];
}
