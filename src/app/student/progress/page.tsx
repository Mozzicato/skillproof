import Link from "next/link";
import { ReadinessChart } from "@/components/client";
import { EvidenceItem, PageHead } from "@/components/ui";
import { competency, role } from "@/lib/framework";
import { competencyScore, newestFirst, readinessHistory } from "@/lib/scoring";
import { getStudent } from "@/lib/store";

export default async function ProgressPage() {
  const student = (await getStudent());
  const target = role(student.targetRoleId);
  const history = readinessHistory(target.requirements, student.evidence);
  const firstDay = history[0]?.date;
  const baseline = student.evidence.filter((e) => firstDay && e.createdAt.slice(0, 10) === firstDay);

  return (
    <div className="stack-lg">
      <PageHead title="Progress" intro="Whether new evidence has moved your scores since your baseline." />
      <div><Link className="btn" href="/student/assessment">Reassess now</Link></div>
      {history.length > 0 && <section className="panel"><ReadinessChart points={history} /></section>}
      <section className="panel table-scroll">
        <table>
          <thead><tr><th>Skill</th><th className="num">Baseline</th><th className="num">Now</th><th className="num">Change</th></tr></thead>
          <tbody>
            {target.requirements.map((r) => {
              const before = competencyScore(baseline, r.competencyId);
              const now = competencyScore(student.evidence, r.competencyId);
              const change = before !== null && now !== null ? now - before : null;
              return (
                <tr key={r.competencyId}>
                  <td>{competency(r.competencyId).name}</td>
                  <td className="num">{before ?? "–"}</td>
                  <td className="num">{now ?? "–"}</td>
                  <td className="num">{change === null ? "–" : change > 0 ? `+${change}` : change}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <section className="panel">
        <h2>Evidence timeline</h2>
        {student.evidence.length === 0 ? (
          <p className="muted" style={{ marginTop: "0.75rem" }}>No evidence yet. <Link href="/student/assessment">Take the assessment</Link> to record your first scores.</p>
        ) : (
          <ul className="list">
            {newestFirst(student.evidence).map((item) => <li key={item.id}><EvidenceItem item={item} showSkill /></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
