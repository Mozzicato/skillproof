import Link from "next/link";
import { CompetencyPicker, EmployerAdvertSearch } from "@/components/client";
import { COHORT_SIZE, DEPARTMENTS, cohort } from "@/lib/cohort";
import { COMPETENCIES, competency } from "@/lib/framework";
import { competencyScore } from "@/lib/scoring";
import { SiteHeader } from "@/components/SiteHeader";
import { sampleStudents } from "@/lib/roster";
import { accountStudents } from "@/lib/store";
import { latestRun } from "@/lib/calibration";
import { COMPETENCY_IDS, type CompetencyId, type Student } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  name: string;
  department: string;
  scores: Partial<Record<CompetencyId, number>>;
  kind: "account" | "sample" | "simulated";
  calibration?: number;
  vouches?: number;
}

type Search = Promise<{ skill?: string | string[]; min?: string; department?: string }>;

export default async function EmployerPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const requested = [params.skill ?? ["sql", "python"]].flat();
  const skills = COMPETENCY_IDS.filter((id) => requested.includes(id));
  const min = [40, 50, 60, 70, 80].includes(Number(params.min)) ? Number(params.min) : 50;
  const department = DEPARTMENTS.some((d) => d.name === params.department) ? params.department! : "";

  const toRow = (s: Student, kind: Row["kind"]): Row => ({
    id: s.id,
    name: s.name,
    department: s.department,
    kind,
    scores: Object.fromEntries(COMPETENCY_IDS.map((id) => [id, competencyScore(s.evidence, id) ?? 0])),
    calibration: latestRun(s.assessments)?.calibration,
    vouches: s.endorsements?.length ?? 0,
  });
  const accounts = (await accountStudents()).filter((s) => s.evidence.length > 0).map((s) => toRow(s, "account"));
  const pool: Row[] = [...accounts, ...sampleStudents().map((s) => toRow(s, "sample")), ...cohort().map((s) => ({ ...s, kind: "simulated" as const }))];
  const rank = { account: 0, sample: 1, simulated: 2 };
  const average = (r: Row) => skills.reduce((acc, id) => acc + (r.scores[id] ?? 0), 0) / Math.max(skills.length, 1);
  const matches = pool
    .filter((r) => (!department || r.department === department) && skills.every((id) => (r.scores[id] ?? 0) >= min))
    .sort((a, b) => rank[a.kind] - rank[b.kind] || average(b) - average(a));

  return (
    <>
      <SiteHeader section="Employer dashboard" />
      <main className="wide-page"><div className="wide stack-lg">
        <header className="page-head">
          <h1>Find graduates by what they can do</h1>
          <p className="notice">Students with their own accounts are listed first, then {sampleStudents().length} sample students with full portfolios. The {COHORT_SIZE.toLocaleString()} simulated students fill out the search to show how it works at scale.</p>
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
                <tr><th>Candidate</th><th>Department</th>{skills.map((id) => <th key={id} className="num">{competency(id).name}</th>)}<th className="num">Self-awareness</th><th className="num">Confirmed by people</th><th>Evidence</th></tr>
              </thead>
              <tbody>
                {matches.slice(0, 25).map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.department}</td>
                    {skills.map((id) => <td key={id} className="num">{r.scores[id]}</td>)}
                    <td className="num">{r.calibration ?? "–"}</td>
                    <td className="num">{r.kind === "simulated" ? "–" : r.vouches}</td>
                    <td>
                      {r.kind === "simulated" ? (
                        <span className="badge">Simulated</span>
                      ) : (
                        <span className="row" style={{ gap: "0.5rem" }}>
                          <Link href={`/p/${r.id}`}>View portfolio</Link>
                          <span className={`badge ${r.kind === "account" ? "good" : "judge"}`}>{r.kind === "account" ? "Registered" : "Sample student"}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div></main>
    </>
  );
}
