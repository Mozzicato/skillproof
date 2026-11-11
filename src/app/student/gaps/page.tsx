import Link from "next/link";
import { StartSprint } from "@/components/cycle";
import { PageHead, Status } from "@/components/ui";
import { JOBS, PROJECTS, competency, role } from "@/lib/framework";
import { POINTS_PER_WEEK, gapPriorities, gapRows } from "@/lib/scoring";
import { getStudent } from "@/lib/store";

export default async function GapsPage() {
  const student = await getStudent();
  const target = role(student.targetRoleId);
  const priorities = gapPriorities(target, student);
  const met = gapRows(target.requirements, student.evidence, student.claims).filter((r) => r.shortfall === 0);
  const first = priorities[0];

  return (
    <div className="stack-lg">
      <PageHead title="Skill gaps" intro={`Your evidenced scores against what a ${target.title} needs, ordered by what closing each gap is worth in jobs.`} />

      {first && (
        <section className="next-up">
          <h2>Close {competency(first.competencyId).name} first</h2>
          <p>
            {first.unlocks.length > 0
              ? <>It is the only thing standing between you and {first.unlocks.length === 1 ? "this vacancy" : `${first.unlocks.length} vacancies`}: <strong>{first.unlocks.map((j) => `${j.title} at ${j.company}`).join(", ")}</strong>.</>
              : first.blocks.length > 0
                ? <>It is holding you back from {first.blocks.length} of {JOBS.length} vacancies, including <strong>{first.blocks[0].job.title} at {first.blocks[0].job.company}</strong>.</>
                : <>It is asked for in {first.demand.length} of {JOBS.length} current vacancies.</>}
            {" "}You are {first.shortfall} points short, about {first.weeks} {first.weeks === 1 ? "week" : "weeks"} of focused work.
          </p>
          {student.sprint ? <Link className="btn" href="/student/plan">Open my sprint</Link> : <StartSprint label="Start a two-week sprint on it" />}
        </section>
      )}

      <section className="panel table-scroll">
        <table>
          <thead>
            <tr><th>Skill</th><th className="num">Short by</th><th>Holding you back from</th><th className="num">Vacancies asking</th><th className="num">Weeks</th><th>Prove it with</th></tr>
          </thead>
          <tbody>
            {priorities.map((row) => {
              const fix = PROJECTS.find((p) => p.rubric.some((c) => c.competencyId === row.competencyId));
              return (
                <tr key={row.competencyId}>
                  <td><Link href={`/student/skills/${row.competencyId}`}>{competency(row.competencyId).name}</Link><br /><Status value={row.status} /></td>
                  <td className="num">{row.shortfall}<span className="muted small"> of {row.required}</span></td>
                  <td>
                    {row.blocks.length === 0 ? (
                      <span className="muted">No current vacancy</span>
                    ) : (
                      row.blocks.map((m) => (
                        <div key={m.job.id}>
                          <strong>{m.job.title}</strong> <span className="muted small">{m.job.company}</span>
                          {m.missing.length === 1 && <span className="unlock-tag">only thing missing</span>}
                        </div>
                      ))
                    )}
                  </td>
                  <td className="num">{row.demand.length} of {JOBS.length}</td>
                  <td className="num">{row.weeks}</td>
                  <td>{fix ? <Link href={`/student/projects/${fix.id}`}>{fix.title}</Link> : "–"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="small muted" style={{ marginTop: "0.75rem" }}>
          Weeks are an estimate at {POINTS_PER_WEEK} points of proven progress a week. Vacancies are the fictional sample set.
        </p>
      </section>

      {met.length > 0 && (
        <p className="muted">Already met: {met.map((r) => competency(r.competencyId).name).join(", ")}.</p>
      )}
    </div>
  );
}
