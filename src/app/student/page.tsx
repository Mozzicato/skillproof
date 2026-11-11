import Link from "next/link";
import { ReadinessChart } from "@/components/client";
import { SkillBar, SkillLegend, TrustLabel } from "@/components/ui";
import { competency, project, role } from "@/lib/framework";
import { gapRows, readiness, readinessHistory, recommendProjects, skillTrust, type Trust } from "@/lib/scoring";
import { getStudent } from "@/lib/store";

const TRUST_ORDER: Trust[] = ["Defended", "AI-evaluated", "Assessed", "Could not defend", "Claimed only", "No evidence"];

export default async function StudentOverview() {
  const student = (await getStudent());
  const target = role(student.targetRoleId);
  const score = readiness(target.requirements, student.evidence);
  const rows = gapRows(target.requirements, student.evidence, student.claims);
  const history = readinessHistory(target.requirements, student.evidence);
  const biggest = rows[0];
  const next = recommendProjects(target, student).find((p) => p.rubric.some((c) => c.competencyId === biggest.competencyId));
  const undefended = student.evaluations.find((e) => e.submission && !e.defence);
  const met = rows.filter((r) => r.status === "Met").length;
  const close = rows.filter((r) => r.status === "Close").length;
  const trust = TRUST_ORDER.map((level) => ({
    level,
    count: target.requirements.filter((r) => skillTrust(student.evidence, student.claims, r.competencyId) === level).length,
  })).filter((t) => t.count > 0);

  return (
    <div className="stack-lg">
      <section className="scoreboard">
        <div className="gauge" role="img" aria-label={`Readiness ${score} of 100`}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#e8f1f4" strokeWidth="10" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="#0d9488" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(score / 100) * 326.7} 326.7`} />
          </svg>
          <div className="gauge-value"><b>{score}</b><span>of 100</span></div>
        </div>
        <div>
          <h1>Your readiness</h1>
          <p className="muted">Out of 100 for {target.title}, using only what you have proven.</p>
          <div className="meter" aria-hidden="true">
            {rows.map((r) => <span key={r.competencyId} className={r.status.replace(" ", "")} title={`${competency(r.competencyId).name}: ${r.status}`} />)}
          </div>
          <p className="small" style={{ marginTop: "0.4rem" }}>
            <strong>{met} of {rows.length}</strong> requirements met{close > 0 ? `, ${close} close` : ""}
          </p>
        </div>
        <div className="next-up">
          {student.evidence.length === 0 ? (
            <>
              <h2>Start with your assessment</h2>
              <p className="small">About five minutes. It sets your baseline, and every score after that comes from your own work.</p>
              <Link className="btn" href="/student/assessment">Start the assessment</Link>
            </>
          ) : undefended ? (
            <>
              <h2>Defend your work</h2>
              <p className="small">Answer three questions about “{project(undefended.projectId)?.title}” to raise your trust level.</p>
              <Link className="btn" href={`/student/projects/${undefended.projectId}#defence`}>Start my defence</Link>
              {biggest.shortfall > 0 && next && (
                <p className="small">Then close your largest gap, {competency(biggest.competencyId).name}, with <Link href={`/student/projects/${next.id}`}>this project</Link>.</p>
              )}
            </>
          ) : biggest.shortfall > 0 ? (
            <>
              <h2>Prove {competency(biggest.competencyId).name}</h2>
              <p className="small">This is your largest gap, {biggest.shortfall} points short.</p>
              {next ? <Link className="btn" href={`/student/projects/${next.id}`}>Open the project</Link> : <Link className="btn" href="/student/assessment">Reassess now</Link>}
            </>
          ) : (
            <>
              <h2>You meet every requirement</h2>
              <Link className="btn" href="/student/opportunities">See matching jobs</Link>
            </>
          )}
        </div>
      </section>

      <section className="panel stack">
        <div className="row between">
          <h2>What you claim and what you have proven</h2>
          <SkillLegend />
        </div>
        <div className="skills">
          {target.requirements.map((r) => (
            <SkillBar key={r.competencyId} id={r.competencyId} evidence={student.evidence} claims={student.claims} required={r.level} href={`/student/skills/${r.competencyId}`} />
          ))}
        </div>
        <p className="small muted">Claims never raise a score. Select a skill to see the evidence behind it.</p>
      </section>

      <div className="split">
        {history.length > 0 && (
          <section className="panel stack">
            <h2>Readiness over time</h2>
            <ReadinessChart points={history} />
          </section>
        )}
        <section className="panel stack">
          <h2>Strength of your proof</h2>
          <ul className="list">
            {trust.map((t) => (
              <li key={t.level} className="row between" style={{ padding: "0.55rem 0" }}>
                <TrustLabel value={t.level} />
                <strong>{t.count} {t.count === 1 ? "skill" : "skills"}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
