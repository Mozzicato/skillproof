import Link from "next/link";
import {
  COHORT_SIZE,
  DEPARTMENTS,
  cohort,
  departmentMean,
  employerDemand,
  meetsRequirements,
  needingTechnicalTraining,
  percentAtLeast,
} from "@/lib/cohort";
import { CurriculumForm } from "@/components/client";
import { SiteHeader } from "@/components/SiteHeader";
import { COMPETENCIES, JOBS, competency } from "@/lib/framework";
import { getCurricula } from "@/lib/store";
import type { CompetencyId } from "@/lib/types";

export const dynamic = "force-dynamic";

/** One hue from pale to deep; darker means a stronger demonstrated score. */
function heat(value: number) {
  const t = Math.min(value, 90) / 90;
  return {
    background: `color-mix(in oklab, #0d9488 ${Math.round(t * 88 + 6)}%, white)`,
    color: t > 0.85 ? "#fff" : "#0b302d",
  };
}

export default async function UniversityPage() {
  const students = cohort();
  const strongCommunicators = students.filter((s) => s.scores.communication >= 70).length;
  const curricula = await getCurricula();
  const taughtIn = (d: (typeof DEPARTMENTS)[number]) => curricula[d.name]?.map((t) => t.competencyId) ?? d.taught;
  const untaughtCount = (id: CompetencyId) => DEPARTMENTS.filter((d) => !taughtIn(d).includes(id)).length;
  const mapped = DEPARTMENTS.filter((d) => curricula[d.name]);
  const widestGap = [...COMPETENCIES].sort(
    (a, b) => employerDemand(b.id) * untaughtCount(b.id) - employerDemand(a.id) * untaughtCount(a.id),
  )[0];

  return (
    <>
      <SiteHeader section="University dashboard" />
      <main className="wide-page"><div className="wide stack-lg">
        <header className="page-head">
          <h1>Sample University: career readiness</h1>
          <p className="notice">This dashboard uses a simulated cohort of {COHORT_SIZE.toLocaleString()} students to show how the view works at scale.</p>
        </header>

        <section className="stats">
          <div className="stat"><b>{percentAtLeast("digital-literacy", 60)}%</b>of students have strong digital literacy (60 or above)</div>
          <div className="stat"><b>{strongCommunicators}</b>students demonstrate strong communication (70 or above)</div>
          <div className="stat"><b>{needingTechnicalTraining()}</b>students need additional technical training (no technical skill at 50)</div>
        </section>

        <section className="panel stack">
          <h2>What departments teach, what students demonstrate, what employers want</h2>
          <p>
            <mark>{widestGap.name} is requested in {employerDemand(widestGap.id)}% of vacancies, but {untaughtCount(widestGap.id)} of {DEPARTMENTS.length} departments do not teach it.</mark>
          </p>
          <div className="legend">
            <span>Cell value: average demonstrated score, darker is higher</span>
            <span><i className="key untaught" style={{ background: "transparent" }} />Not taught in the department&apos;s curriculum</span>
          </div>
          <div className="table-scroll">
            <table className="heat">
              <thead>
                <tr><th />{COMPETENCIES.map((c) => <th key={c.id}>{c.name}</th>)}</tr>
              </thead>
              <tbody>
                {DEPARTMENTS.map((d) => (
                  <tr key={d.name}>
                    <td className="rowhead">{d.name}</td>
                    {COMPETENCIES.map((c) => {
                      const value = departmentMean(d.name, c.id);
                      const taught = taughtIn(d).includes(c.id);
                      return (
                        <td key={c.id} className={taught ? undefined : "untaught"} style={heat(value)} title={`${d.name}, ${c.name}: ${value}${taught ? "" : ", not taught"}`}>{value}</td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td className="rowhead demand">Share of vacancies asking</td>
                  {COMPETENCIES.map((c) => <td key={c.id} className="demand">{employerDemand(c.id)}%</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel stack">
          <h2>Map a real syllabus</h2>
          <p className="muted">Paste a department&apos;s syllabus to replace its sample curriculum in the table above.</p>
          <CurriculumForm departments={DEPARTMENTS.map((d) => d.name)} />
          {mapped.map((d) => (
            <div key={d.name} className="stack" style={{ gap: "0.4rem" }}>
              <h3>{d.name}: taught, according to its syllabus</h3>
              <ul className="list">
                {curricula[d.name].map((t) => (
                  <li key={t.competencyId}><strong>{competency(t.competencyId).name}.</strong> <mark>{t.quote}</mark></li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="panel table-scroll">
          <h2>Students who meet current vacancies</h2>
          <table style={{ marginTop: "0.75rem" }}>
            <thead><tr><th>Vacancy (fictional sample)</th><th>Type</th><th className="num">Students who qualify</th></tr></thead>
            <tbody>
              {JOBS.map((job) => (
                <tr key={job.id}>
                  <td>{job.title}, {job.company}</td>
                  <td>{job.type}</td>
                  <td className="num">{students.filter((s) => meetsRequirements(s, job.requirements)).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div></main>
    </>
  );
}
