import { notFound } from "next/navigation";
import { DefenceExam, ProjectSubmit } from "@/components/client";
import { PageHead, formatDate } from "@/components/ui";
import { competency, project } from "@/lib/framework";
import { getStudent } from "@/lib/store";

const DEFENCE_LABEL = { defended: "Defended", partial: "Partly explained", failed: "Could not defend", "not-covered": "Not covered" } as const;

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const target = project(id);
  if (!target) notFound();
  const latest = getStudent().evaluations.filter((e) => e.projectId === target.id).at(-1);

  return (
    <div className="stack-lg">
      <PageHead title={target.title} intro={target.brief} />

      {latest && (
        <section className="panel stack">
          <div className="row between">
            <h2>Latest evaluation</h2>
            <span className="small muted">{formatDate(latest.createdAt)}</span>
          </div>
          <p>{latest.summary}</p>
          <ul className="list">
            {latest.results.map((r) => (
              <li key={r.criterionId} className="stack" style={{ gap: "0.4rem" }}>
                <div className="row between">
                  <h3>{competency(r.competencyId).name}: {r.score} of 100</h3>
                  {!r.verified && <span className="status bad">Not verified</span>}
                </div>
                <p className="small muted">{r.criterion}</p>
                {r.excerpt && <div><code className="excerpt">{r.excerpt}</code></div>}
                <p>{r.rationale}</p>
              </li>
            ))}
          </ul>
          <p><strong>Next step:</strong> {latest.nextStep}</p>
        </section>
      )}

      {latest?.submission && (
        <section className="panel stack" id="defence">
          <h2>Defend this work</h2>
          {latest.defence ? (
            <>
              <p>{latest.defence.feedback}</p>
              <ul className="list">
                {latest.defence.outcomes.map((o) => (
                  <li key={o.criterionId} className="stack" style={{ gap: "0.4rem" }}>
                    <div className="row between">
                      <h3>{competency(o.competencyId).name}</h3>
                      <span className={`status ${o.result === "defended" ? "good" : o.result === "failed" ? "bad" : "mid"}`}>{DEFENCE_LABEL[o.result]}</span>
                    </div>
                    {o.excerpt && <div><code className="excerpt">{o.excerpt}</code></div>}
                    <p>{o.rationale}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="muted">Answer three questions about your own submission. Skills you can explain are marked as defended and count for more. Skills you cannot explain are capped at 25. You get one attempt per submission.</p>
              <DefenceExam evaluationId={latest.id} />
            </>
          )}
        </section>
      )}

      <section className="panel stack">
        <h2>Rubric</h2>
        <ul className="list">
          {target.rubric.map((c) => <li key={c.id}><strong>{competency(c.competencyId).name}.</strong> {c.criterion}</li>)}
        </ul>
        <p className="small muted">Credit requires a passage from your own work. Anything the evaluator cannot quote from your submission scores zero.</p>
      </section>

      <section className="panel stack">
        <h2>{latest ? "Submit an improved version" : "Submit your work"}</h2>
        <ProjectSubmit projectId={target.id} deliverable={target.deliverable} />
      </section>
    </div>
  );
}
