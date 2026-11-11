import { JOBS, PROJECTS } from "./framework";
import type {
  Claim,
  CompetencyId,
  DefenceResultKind,
  Evidence,
  EvidenceSource,
  Job,
  Project,
  Requirement,
  Role,
  Sprint,
  Student,
} from "./types";

/** Applied work counts for more than a multiple-choice baseline. */
const SOURCE_WEIGHT: Record<EvidenceSource, number> = { project: 1, interview: 0.8, assessment: 0.5 };
/** Each older item counts for this share of the next newer one, so improvement shows up. */
const RECENCY_DECAY = 0.7;
/** Work the student has explained in person counts for more. */
const DEFENDED_BONUS = 1.25;
/** Work the student could not explain cannot score above this. */
const FAILED_DEFENCE_CAP = 25;

export function newestFirst(evidence: Evidence[]): Evidence[] {
  return [...evidence].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** The evidenced score for one competency. Claims never enter this calculation. */
export function competencyScore(evidence: Evidence[], id: CompetencyId): number | null {
  const items = newestFirst(evidence).filter((e) => e.competencyId === id);
  if (items.length === 0) return null;
  let total = 0;
  let weights = 0;
  items.forEach((e, i) => {
    const bonus = e.defence === "defended" ? DEFENDED_BONUS : 1;
    const w = SOURCE_WEIGHT[e.source] * bonus * RECENCY_DECAY ** i;
    total += (e.defence === "failed" ? Math.min(e.score, FAILED_DEFENCE_CAP) : e.score) * w;
    weights += w;
  });
  return Math.round(total / weights);
}

export type Trust = "Defended" | "AI-evaluated" | "Assessed" | "Could not defend" | "Claimed only" | "No evidence";

export function evidenceTrust(e: Evidence): Trust {
  if (e.defence === "defended") return "Defended";
  if (e.defence === "failed") return "Could not defend";
  return e.source === "assessment" ? "Assessed" : "AI-evaluated";
}

/** The strongest kind of proof behind a skill. A claim alone is never more than "Claimed only". */
export function skillTrust(evidence: Evidence[], claims: Claim[], id: CompetencyId): Trust {
  const found = evidence.filter((e) => e.competencyId === id).map(evidenceTrust);
  for (const level of ["Defended", "AI-evaluated", "Assessed", "Could not defend"] as const) {
    if (found.includes(level)) return level;
  }
  return claims.some((c) => c.competencyId === id) ? "Claimed only" : "No evidence";
}

/** A high band needs a real quote. A low band stands without one, since a blank answer has nothing to quote. */
export function defenceResult(band: number, grounded: boolean): DefenceResultKind {
  if (band <= 1) return "failed";
  return band >= 3 && grounded ? "defended" : "partial";
}

export function levelName(score: number | null): string {
  if (score === null) return "No evidence";
  if (score >= 80) return "Advanced";
  if (score >= 60) return "Proficient";
  if (score >= 40) return "Developing";
  return "Beginner";
}

/** 0 to 100: how far evidenced skills cover a set of requirements. Missing evidence counts as zero. */
export function readiness(requirements: Requirement[], evidence: Evidence[]): number {
  if (requirements.length === 0) return 0;
  const sum = requirements.reduce((acc, r) => {
    const score = competencyScore(evidence, r.competencyId) ?? 0;
    return acc + Math.min(score / r.level, 1);
  }, 0);
  return Math.round((sum / requirements.length) * 100);
}

export type GapStatus = "Met" | "Close" | "Gap" | "No evidence";

export interface GapRow {
  competencyId: CompetencyId;
  required: number;
  score: number | null;
  claimed: number | null;
  shortfall: number;
  status: GapStatus;
}

export function gapRows(requirements: Requirement[], evidence: Evidence[], claims: Claim[]): GapRow[] {
  return requirements
    .map((r): GapRow => {
      const score = competencyScore(evidence, r.competencyId);
      const claim = claims.find((c) => c.competencyId === r.competencyId);
      const shortfall = Math.max(r.level - (score ?? 0), 0);
      const status: GapStatus =
        score === null ? "No evidence" : shortfall === 0 ? "Met" : shortfall <= 15 ? "Close" : "Gap";
      return { competencyId: r.competencyId, required: r.level, score, claimed: claim?.level ?? null, shortfall, status };
    })
    .sort((a, b) => b.shortfall - a.shortfall);
}

export type ClaimVerdict = "Proven" | "Partly proven" | "Unproven";

export function claimVerdict(claimed: number, score: number | null): ClaimVerdict {
  if (score === null) return "Unproven";
  if (score >= claimed - 5) return "Proven";
  return "Partly proven";
}

export interface HistoryPoint {
  date: string;
  readiness: number;
}

/** Readiness after each day on which evidence was added. */
export function readinessHistory(requirements: Requirement[], evidence: Evidence[]): HistoryPoint[] {
  const days = [...new Set(evidence.map((e) => e.createdAt.slice(0, 10)))].sort();
  return days.map((date) => ({
    date,
    readiness: readiness(requirements, evidence.filter((e) => e.createdAt.slice(0, 10) <= date)),
  }));
}

export function recommendProjects(role: Role, student: Student): Project[] {
  const gaps = gapRows(role.requirements, student.evidence, student.claims);
  const done = new Set(student.evaluations.map((e) => e.projectId));
  const value = (p: Project) =>
    p.rubric.reduce((acc, c) => acc + (gaps.find((g) => g.competencyId === c.competencyId)?.shortfall ?? 0), 0);
  return PROJECTS.filter((p) => !done.has(p.id) && value(p) > 0).sort((a, b) => value(b) - value(a));
}

export interface JobMatch {
  job: Job;
  met: number;
  total: number;
  readiness: number;
  missing: Requirement[];
}

export function jobMatches(evidence: Evidence[]): JobMatch[] {
  return JOBS.map((job) => {
    const missing = job.requirements.filter((r) => (competencyScore(evidence, r.competencyId) ?? 0) < r.level);
    return {
      job,
      met: job.requirements.length - missing.length,
      total: job.requirements.length,
      readiness: readiness(job.requirements, evidence),
      missing,
    };
  }).sort((a, b) => b.readiness - a.readiness);
}

export interface CycleStep {
  name: "Assess" | "Identify" | "Develop" | "Demonstrate" | "Reassess" | "Connect";
  done: boolean;
}

export function cycleStatus(role: Role, student: Student): CycleStep[] {
  const sources = new Set(student.evidence.map((e) => e.source));
  const assessed = sources.has("assessment");
  const demonstrated = sources.has("project") || sources.has("interview");
  const assessmentDays = new Set(
    student.evidence.filter((e) => e.source === "assessment").map((e) => e.createdAt.slice(0, 10)),
  );
  const matched = jobMatches(student.evidence).some((m) => m.missing.length === 0);
  return [
    { name: "Assess", done: assessed },
    { name: "Identify", done: assessed },
    { name: "Develop", done: Boolean(student.sprint) || student.evaluations.length > 0 },
    { name: "Demonstrate", done: demonstrated },
    { name: "Reassess", done: assessmentDays.size > 1 },
    { name: "Connect", done: matched || (student.endorsements?.length ?? 0) > 0 },
  ];
}

/** Points a student can typically add to one skill in a week of focused practice. An estimate, shown as one. */
export const POINTS_PER_WEEK = 10;

export interface GapPriority extends GapRow {
  /** Vacancies that ask for this skill at all. */
  demand: Job[];
  /** Vacancies where this skill is the only thing missing, so closing it makes the student eligible. */
  unlocks: Job[];
  /** Vacancies the student does not yet qualify for partly because of this skill. */
  blocks: JobMatch[];
  weeks: number;
}

export function gapValue(gap: Pick<GapPriority, "unlocks" | "blocks" | "demand">): number {
  return gap.unlocks.length * 3 + gap.blocks.length * 2 + gap.demand.length;
}

/** Gaps ordered by what closing them is worth: jobs it alone unlocks, then jobs it holds back, then how often it is asked for. */
export function gapPriorities(role: Role, student: Student): GapPriority[] {
  const matches = jobMatches(student.evidence);
  return gapRows(role.requirements, student.evidence, student.claims)
    .filter((row) => row.shortfall > 0)
    .map((row) => {
      const blocks = matches.filter((m) => m.missing.some((r) => r.competencyId === row.competencyId));
      return {
        ...row,
        demand: JOBS.filter((j) => j.requirements.some((r) => r.competencyId === row.competencyId)),
        unlocks: blocks.filter((m) => m.missing.length === 1).map((m) => m.job),
        blocks,
        weeks: Math.max(1, Math.ceil(row.shortfall / POINTS_PER_WEEK)),
      };
    })
    .sort((a, b) => gapValue(b) - gapValue(a) || b.shortfall - a.shortfall);
}

export const SPRINT_DAYS = 14;

/** The sprint SkillProof suggests: the most valuable gap, and the project criterion that would prove it. */
export function proposeSprint(role: Role, student: Student): Omit<Sprint, "startedAt" | "dueAt"> | null {
  const done = new Set(student.evaluations.map((e) => e.projectId));
  for (const gap of gapPriorities(role, student)) {
    const candidates = PROJECTS.filter((p) => p.rubric.some((c) => c.competencyId === gap.competencyId));
    const pick = candidates.find((p) => !done.has(p.id)) ?? candidates[0];
    if (!pick) continue;
    const criterion = pick.rubric.find((c) => c.competencyId === gap.competencyId)!;
    return { competencyId: gap.competencyId, projectId: pick.id, criterionId: criterion.id, target: gap.required };
  }
  return null;
}

export interface SprintStep {
  label: string;
  done: boolean;
}

/** Each step of a sprint is ticked by evidence, never by the student saying it is done. */
export function sprintSteps(sprint: Sprint, student: Student, projectTitle: string, criterion: string): SprintStep[] {
  const latest = student.evaluations
    .filter((e) => e.projectId === sprint.projectId && e.createdAt >= sprint.startedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const result = latest?.results.find((r) => r.criterionId === sprint.criterionId);
  const outcome = latest?.defence?.outcomes.find((o) => o.criterionId === sprint.criterionId);
  const reassessed = (student.assessments ?? []).some(
    (run) => run.createdAt >= sprint.startedAt && run.skills.some((s) => s.competencyId === sprint.competencyId),
  );
  return [
    { label: `Submit “${projectTitle}”`, done: Boolean(latest) },
    { label: `Score ${sprint.target} or more on: ${criterion}`, done: (result?.score ?? 0) >= sprint.target },
    { label: "Defend that work in three questions", done: outcome?.result === "defended" },
    { label: "Reassess to confirm the change", done: reassessed },
  ];
}

/** Evidence older than this is flagged so students re-prove it. Scores are not reduced; the date is shown. */
export const STALE_AFTER_DAYS = 60;

export function lastProven(evidence: Evidence[], id: CompetencyId): string | null {
  return newestFirst(evidence).find((e) => e.competencyId === id)?.createdAt ?? null;
}

export function daysSince(iso: string, now = Date.now()): number {
  return Math.floor((now - new Date(iso).getTime()) / 86_400_000);
}

export function staleSkills(ids: CompetencyId[], evidence: Evidence[], now = Date.now()): { competencyId: CompetencyId; days: number }[] {
  return ids.flatMap((id) => {
    const last = lastProven(evidence, id);
    const days = last ? daysSince(last, now) : null;
    return days !== null && days > STALE_AFTER_DAYS ? [{ competencyId: id, days }] : [];
  });
}

/** Score on the first day this skill had evidence, against the score now. */
export function growth(evidence: Evidence[], id: CompetencyId): { from: number; to: number; since: string } | null {
  const items = evidence.filter((e) => e.competencyId === id);
  if (items.length === 0) return null;
  const firstDay = items.map((e) => e.createdAt.slice(0, 10)).sort()[0];
  const from = competencyScore(items.filter((e) => e.createdAt.slice(0, 10) === firstDay), id)!;
  return { from, to: competencyScore(items, id)!, since: firstDay };
}

/**
 * AI-quoted evidence only counts if the quote really appears in the student's text.
 * Whitespace is normalised because models and editors reflow lines.
 */
export function isGrounded(excerpt: string | null | undefined, source: string): boolean {
  if (!excerpt) return false;
  const normalise = (s: string) => s.replace(/\s+/g, " ").trim();
  const quote = normalise(excerpt);
  return quote.length >= 8 && normalise(source).includes(quote);
}

/** Full marks are only possible when the marker found nothing wrong. */
export function cappedBand(band: number, weaknessCount: number): number {
  return Math.min(clampScore(band, 4), weaknessCount > 0 ? 3 : 4);
}

export function clampScore(n: number, max = 100): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(Math.round(n), 0), max);
}
