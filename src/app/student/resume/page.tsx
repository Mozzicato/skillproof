import Link from "next/link";
import { CopyText, OptimiseCv, ResumeAnalyzer } from "@/components/client";
import { CvDocument } from "@/components/CvDocument";
import { siteOrigin } from "@/components/passport";
import { cvPlainText } from "@/lib/cv";
import { PageHead, Status } from "@/components/ui";
import { COMPETENCIES, competency, project, role } from "@/lib/framework";
import { claimVerdict, competencyScore, levelName } from "@/lib/scoring";
import { getStudent } from "@/lib/store";

export default async function ResumePage() {
  const student = (await getStudent());
  const target = role(student.targetRoleId);

  const skillLines = COMPETENCIES.flatMap((c) => {
    const score = competencyScore(student.evidence, c.id);
    return score !== null && score >= 40 ? [`${c.name}: ${levelName(score)} (evidenced score ${score})`] : [];
  });
  const projectLines = student.evaluations.map((e) => {
    const strongest = [...e.results].sort((a, b) => b.score - a.score)[0];
    return `${project(e.projectId)?.title}: scored ${strongest.score} of 100 for ${competency(strongest.competencyId).name} on a published rubric`;
  });
  const cv = [student.name, `${student.department}, ${student.university}`, `Target role: ${target.title}`, "", "Skills", ...skillLines, "", "Assessed projects", ...projectLines].join("\n");

  return (
    <div className="stack-lg">
      <PageHead title="CV" intro="See which claims in your CV are backed by evidence, and generate a CV made only of what you have proven." />

      {student.claims.length === 0 ? (
        <div className="empty">
          <h2>No CV claims yet</h2>
          <p className="muted">Paste your CV below. SkillProof will find each skill you claim and check it against your evidence.</p>
        </div>
      ) : (
      <section className="panel table-scroll">
        <h2>Your claims against your evidence</h2>
        <table style={{ marginTop: "0.75rem" }}>
          <thead><tr><th>Skill</th><th>CV says</th><th className="num">Claimed</th><th className="num">Evidenced</th><th>Verdict</th></tr></thead>
          <tbody>
            {student.claims.map((c) => {
              const score = competencyScore(student.evidence, c.competencyId);
              return (
                <tr key={c.competencyId}>
                  <td>{competency(c.competencyId).name}</td>
                  <td>{c.text}</td>
                  <td className="num">{c.level}</td>
                  <td className="num">{score ?? "–"}</td>
                  <td><Status value={claimVerdict(c.level, score)} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      )}

      {student.cvFeedback && (
        <section className="panel stack">
          <h2>CV feedback</h2>
          <div><h3>Strengths</h3><ul>{student.cvFeedback.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>
          <div><h3>Improve</h3><ul>{student.cvFeedback.improvements.map((s) => <li key={s}>{s}</li>)}</ul></div>
        </section>
      )}

      <section className="panel stack">
        <h2>Upload or paste your CV</h2>
        <ResumeAnalyzer />
      </section>

      <section className="panel stack">
        <div className="row between">
          <div className="stack" style={{ gap: "0.3rem" }}>
            <h2>Your optimised CV</h2>
            <p className="small muted">Written for {target.title}. Skill levels come only from your evidence, and every experience line must trace back to your own CV, so nothing is invented.</p>
          </div>
          {student.optimisedCv && (
            <div className="row">
              <CopyText text={cvPlainText(student, student.optimisedCv)} label="Copy as text" />
              <Link className="btn quiet btn-sm" href="/student/resume/cv">Download as PDF</Link>
            </div>
          )}
        </div>
        {student.optimisedCv ? (
          <>
            <CvDocument student={student} cv={student.optimisedCv} passportUrl={`${await siteOrigin()}/p/${student.id}`} />
            {student.optimisedCv.tips.length > 0 && (
              <div className="notice"><strong>Make it stronger:</strong><ul style={{ margin: "0.4rem 0 0" }}>{student.optimisedCv.tips.map((t) => <li key={t}>{t}</li>)}</ul></div>
            )}
            <OptimiseCv label="Write it again" />
          </>
        ) : (
          <>
            <p>{student.cvText ? "We will use your evidence and the CV you checked above." : "Upload or paste your CV above first to include your experience and education, or generate one from your evidence alone."}</p>
            <OptimiseCv label="Generate my optimised CV" />
            <details>
              <summary className="small">Preview the plain evidence summary</summary>
              <div className="row" style={{ marginTop: "0.5rem" }}><CopyText text={cv} /></div>
              <pre style={{ whiteSpace: "pre-wrap", margin: "0.5rem 0 0" }}>{cv}</pre>
            </details>
          </>
        )}
      </section>
    </div>
  );
}
