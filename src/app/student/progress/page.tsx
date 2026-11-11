import Link from "next/link";
import { ReadinessChart } from "@/components/client";
import { EvidenceItem, PageHead, formatDate } from "@/components/ui";
import { calibrationLabel } from "@/lib/calibration";
import { competency, role } from "@/lib/framework";
import { STALE_AFTER_DAYS, competencyScore, daysSince, lastProven, newestFirst, readinessHistory } from "@/lib/scoring";
import { getStudent } from "@/lib/store";

export default async function ProgressPage() {
  const student = (await getStudent());
  const target = role(student.targetRoleId);
  const history = readinessHistory(target.requirements, student.evidence);
  const firstDay = history[0]?.date;
  const baseline = student.evidence.filter((e) => firstDay && e.createdAt.slice(0, 10) === firstDay);
  const runs = [...(student.assessments ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="stack-lg">
      <PageHead title="Progress" intro="Whether new evidence has moved your scores since your baseline." />
      <div><Link className="btn" href="/student/assessment">Reassess now</Link></div>
      {history.length > 0 && <section className="panel"><ReadinessChart points={history} /></section>}
      <section className="panel table-scroll">
        <table>
          <thead><tr><th>Skill</th><th className="num">Baseline</th><th className="num">Now</th><th className="num">Change</th><th>Last proven</th></tr></thead>
          <tbody>
            {target.requirements.map((r) => {
              const before = competencyScore(baseline, r.competencyId);
              const now = competencyScore(student.evidence, r.competencyId);
              const change = before !== null && now !== null ? now - before : null;
              const last = lastProven(student.evidence, r.competencyId);
              const age = last ? daysSince(last) : null;
              return (
                <tr key={r.competencyId}>
                  <td>{competency(r.competencyId).name}</td>
                  <td className="num">{before ?? "–"}</td>
                  <td className="num">{now ?? "–"}</td>
                  <td className="num">{change === null ? "–" : change > 0 ? <span className="delta up">+{change}</span> : change}</td>
                  <td>{last ? <span className={age! > STALE_AFTER_DAYS ? "status mid" : undefined}>{formatDate(last)}{age! > STALE_AFTER_DAYS ? `, ${age} days ago` : ""}</span> : "–"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="small muted" style={{ marginTop: "0.75rem" }}>Evidence older than {STALE_AFTER_DAYS} days is flagged on your passport until you prove the skill again.</p>
      </section>
      {runs.length > 0 && (
        <section className="panel stack">
          <h2>Self-awareness over time</h2>
          <p className="muted">How closely your confidence matched your results in each assessment. Employers value people who know what they don&apos;t know.</p>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Assessment</th><th className="num">Score</th><th>Verdict</th><th className="num">Sure but wrong</th><th className="num">Guessed but right</th></tr></thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id}>
                    <td>{formatDate(run.createdAt)}</td>
                    <td className="num"><strong>{run.calibration}</strong></td>
                    <td>{calibrationLabel(run)}</td>
                    <td className="num">{run.overconfident}</td>
                    <td className="num">{run.underconfident}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
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
