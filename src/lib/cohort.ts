import { COMPETENCIES, JOBS } from "./framework";
import type { CompetencyId, Requirement } from "./types";

/**
 * A SIMULATED cohort for the university and employer demos. These are generated
 * numbers, not real students, and every screen using them says so.
 */
export const COHORT_SIZE = 2000;

export interface CohortStudent {
  id: string;
  name: string;
  department: string;
  scores: Record<CompetencyId, number>;
}

type Profile = Record<CompetencyId, number>;

interface Department {
  name: string;
  share: number;
  profile: Profile;
  taught: CompetencyId[];
}

export const DEPARTMENTS: Department[] = [
  {
    name: "Computer Science", share: 0.24,
    profile: { python: 66, javascript: 62, sql: 54, "data-wrangling": 42, visualisation: 34, statistics: 40, "git-testing": 52, communication: 42, "problem-solving": 63, "digital-literacy": 74 },
    taught: ["python", "javascript", "sql", "git-testing", "problem-solving", "digital-literacy"],
  },
  {
    name: "Statistics", share: 0.13,
    profile: { python: 50, javascript: 16, sql: 38, "data-wrangling": 55, visualisation: 52, statistics: 76, "git-testing": 18, communication: 46, "problem-solving": 58, "digital-literacy": 60 },
    taught: ["python", "statistics", "data-wrangling", "visualisation", "problem-solving"],
  },
  {
    name: "Economics", share: 0.16,
    profile: { python: 24, javascript: 8, sql: 22, "data-wrangling": 40, visualisation: 44, statistics: 62, "git-testing": 8, communication: 58, "problem-solving": 52, "digital-literacy": 56 },
    taught: ["statistics", "communication", "visualisation"],
  },
  {
    name: "Business Administration", share: 0.21,
    profile: { python: 12, javascript: 8, sql: 18, "data-wrangling": 28, visualisation: 40, statistics: 38, "git-testing": 5, communication: 68, "problem-solving": 50, "digital-literacy": 50 },
    taught: ["communication", "problem-solving"],
  },
  {
    name: "Engineering", share: 0.17,
    profile: { python: 46, javascript: 20, sql: 20, "data-wrangling": 36, visualisation: 38, statistics: 54, "git-testing": 24, communication: 40, "problem-solving": 70, "digital-literacy": 62 },
    taught: ["python", "statistics", "problem-solving"],
  },
  {
    name: "Mass Communication", share: 0.09,
    profile: { python: 6, javascript: 12, sql: 8, "data-wrangling": 16, visualisation: 42, statistics: 24, "git-testing": 4, communication: 76, "problem-solving": 46, "digital-literacy": 58 },
    taught: ["communication", "digital-literacy"],
  },
];

const FIRST = ["Ada", "Tunde", "Zainab", "Kofi", "Maya", "Ibrahim", "Lena", "Chidi", "Priya", "Noah", "Amina", "Daniel", "Sade", "Yusuf", "Grace", "Emeka", "Fatima", "Jordan", "Ngozi", "Kwame"];
const LAST = ["Bello", "Mensah", "Okafor", "Patel", "Hassan", "Adeyemi", "Clarke", "Nwosu", "Diallo", "Ibekwe", "Owusu", "Reyes", "Sesay", "Lawal", "Tembo", "Eze"];

/** Small deterministic generator, so the cohort is identical on every load. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function build(): CohortStudent[] {
  const random = mulberry32(20261111);
  const normal = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  const students: CohortStudent[] = [];
  DEPARTMENTS.forEach((dept) => {
    const count = Math.round(COHORT_SIZE * dept.share);
    for (let i = 0; i < count; i++) {
      const ability = normal() * 8;
      const scores = {} as Profile;
      COMPETENCIES.forEach((c) => {
        scores[c.id] = Math.min(100, Math.max(0, Math.round(dept.profile[c.id] + ability + normal() * 12)));
      });
      students.push({
        id: `sim-${students.length + 1}`,
        name: `${FIRST[Math.floor(random() * FIRST.length)]} ${LAST[Math.floor(random() * LAST.length)]}`,
        department: dept.name,
        scores,
      });
    }
  });
  return students;
}

let cached: CohortStudent[] | null = null;

export function cohort(): CohortStudent[] {
  cached ??= build();
  return cached;
}

export function meetsRequirements(student: CohortStudent, requirements: Requirement[]): boolean {
  return requirements.every((r) => student.scores[r.competencyId] >= r.level);
}

export function departmentMean(department: string, id: CompetencyId): number {
  const group = cohort().filter((s) => s.department === department);
  return Math.round(group.reduce((acc, s) => acc + s.scores[id], 0) / group.length);
}

export function percentAtLeast(id: CompetencyId, level: number): number {
  const all = cohort();
  return Math.round((all.filter((s) => s.scores[id] >= level).length / all.length) * 100);
}

/** Share of the listed vacancies that ask for each competency. */
export function employerDemand(id: CompetencyId): number {
  return Math.round((JOBS.filter((j) => j.requirements.some((r) => r.competencyId === id)).length / JOBS.length) * 100);
}

export const TECHNICAL_IDS: CompetencyId[] = COMPETENCIES.filter((c) => c.category === "Technical").map((c) => c.id);

/** Students whose best technical score is still below a working level. */
export function needingTechnicalTraining(): number {
  return cohort().filter((s) => Math.max(...TECHNICAL_IDS.map((id) => s.scores[id])) < 50).length;
}
