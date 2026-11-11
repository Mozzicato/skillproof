import Link from "next/link";
import { CompetencyPicker, EmployerAdvertSearch } from "@/components/client";
import { COHORT_SIZE, DEPARTMENTS, cohort } from "@/lib/cohort";
import { COMPETENCIES, competency } from "@/lib/framework";
import { competencyScore } from "@/lib/scoring";
import { getStudent } from "@/lib/store";
import { COMPETENCY_IDS, type CompetencyId } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  name: string;
  department: string;
  scores: Partial<Record<CompetencyId, number>>;
  real: boolean;
}

type Search = Promise<{ skill?: string | string[]; min?: string; department?: string }>;

export default async function EmployerPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const requested = [params.skill ?? ["sql", "python"]].flat();
  const skills = COMPETENCY_IDS.filter((id) => requested.includes(id));
  const min = [40, 50, 60, 70, 80].includes(Number(params.min)) ? Number(params.min) : 50;
  const department = DEPARTMENTS.some((d) => d.name === params.department) ? params.department! : "";

  const student = getStudent();
  const sampleStudent: Row = {
    id: student.id,
    name: student.name,
    department: student.department,
    real: true,
    scores: Object.fromEntries(COMPETENCY_IDS.map((id) => [id, competencyScore(student.evidence, id) ?? 0])),
  };
  const pool: Row[] = [sampleStudent, ...cohort().map((s) => ({ ...s, real: false }))];
  const average = (r: Row) => skills.reduce((acc, id) => acc + (r.scores[id] ?? 0), 0) / Math.max(skills.length, 1);
  const matches = pool
    .filter((r) => (!department || r.department === department) && skills.every((id) => (r.scores[id] ?? 0) >= min))
    .sort((a, b) => Number(b.real) - Number(a.real) || average(b) - average(a));

  return (
    <>
      <div className="topbar row between"><Link href="/" className="brand">SkillProof</Link><span>Employer dashboard</span></div>
      <main className="wide stack-lg">
        <header className="page-head">
          <h1>Find graduates by what they can do</h1>
          <p className="notice">Results include {COHORT_SIZE.toLocaleString()} simulated students. Only {student.name}, the sample student, has a full evidence portfolio.</p>
        </header>

        <form className="panel stack" method="get">
          <fieldset>
            <legend>Skills needed</legend>
            <div className="stats" style={{ gap: "0.35rem 1rem", gridTemplateColumns: "repeat(auto-fill, minmax(13rem, 1fr))" }}>
              {COMPETENCIES.map((c) => <CompetencyPicker key={c.id} id={c.id} name={c.name} checked={skills.includes(c.id)} />)}
            </div>
          </fieldset>
          <div className="row" style={{ alignItems: "end" }}>
            <label className="field" style={{ flex: "1 1 12rem" }}>
              Minimum evidenced score
              <select name="min" defaultValue={min}>{[40, 50, 60, 70, 80].map((v) => <option key={v} value={v}>{v}</option>)}</select>
            </label>
            <label className="field" style={{ flex: "1 1 12rem" }}>
              Department
              <select name="department" defaultValue={department}>
                <option value="">Any department</option>
                {DEPARTMENTS.map((d) => <option key={d.name}>{d.name}</option>)}
              </select>
            </label>
            <button className="btn">Search graduates</button>
          </div>
        </form>

        <section className="panel"><EmployerAdvertSearch /></section>

        <section className="panel table-scroll">
          <h2>{matches.length.toLocaleString()} {matches.length === 1 ? "candidate meets" : "candidates meet"} these requirements</h2>
          {matches.length === 0 ? (
            <p className="muted" style={{ marginTop: "0.75rem" }}>Lower the minimum score or remove a skill to widen the search.</p>
          ) : (
            <table style={{ marginTop: "0.75rem" }}>
              <thead>
                <tr><th>Candidate</th><th>Department</th>{skills.map((id) => <th key={id} className="num">{competency(id).name}</th>)}<th>Evidence</th></tr>
              </thead>
              <tbody>
                {matches.slice(0, 25).map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.department}</td>
                    {skills.map((id) => <td key={id} className="num">{r.scores[id]}</td>)}
                    <td>{r.real ? <Link href={`/p/${r.id}`}>View portfolio</Link> : <span className="muted small">Simulated</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </>
  );
}
