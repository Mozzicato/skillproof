import Link from "next/link";
import { ReadinessChart } from "@/components/client";
import { SkillBar, SkillLegend } from "@/components/ui";
import { competency, project, role } from "@/lib/framework";
import { gapRows, readiness, readinessHistory, recommendProjects } from "@/lib/scoring";
import { getStudent } from "@/lib/store";

export default function StudentOverview() {
  const student = getStudent();
  const target = role(student.targetRoleId);
  const score = readiness(target.requirements, student.evidence);
  const rows = gapRows(target.requirements, student.evidence, student.claims);
  const history = readinessHistory(target.requirements, student.evidence);
  const biggest = rows[0];
  const next = recommendProjects(target, student).find((p) => p.rubric.some((c) => c.competencyId === biggest.competencyId));
  const undefended = student.evaluations.find((e) => e.submission && !e.defence);

  return (
    <div className="stack-lg">
      <header className="overview">
        <div>
          <div className="figure">{score}</div>
          <div className="muted small">of 100 ready for {target.title}</div>
          <div className="small"><strong>{rows.filter((r) => r.status === "Met").length} of {rows.length}</strong> requirements fully met</div>
        </div>
        <div className="stack">
          <h1>Your evidence so far</h1>
          {biggest.shortfall > 0 ? (
            <p>
              Your largest gap is <strong>{competency(biggest.competencyId).name}</strong>.{" "}
              {next ? <>Complete <Link href={`/student/projects/${next.id}`}>{next.title.toLowerCase()}</Link> to prove it.</> : <>Submit an improved project or <Link href="/student/assessment">reassess</Link> to raise it.</>}
            </p>
          ) : (
            <p>Your evidence meets every requirement for this role. <Link href="/student/opportunities">See matching jobs</Link>.</p>
          )}
        </div>
      </header>

      {undefended && (
        <p className="notice">
          <strong>“{project(undefended.projectId)?.title}” is not defended yet.</strong>{" "}
          <Link href={`/student/projects/${undefended.projectId}#defence`}>Answer three questions about it</Link> to raise your trust level.
        </p>
      )}

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

      {history.length > 0 && (
        <section className="panel stack">
          <h2>Readiness over time</h2>
          <ReadinessChart points={history} />
        </section>
      )}
    </div>
  );
}
