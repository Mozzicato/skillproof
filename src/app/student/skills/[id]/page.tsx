import { notFound } from "next/navigation";
import { EvidenceItem, PageHead, Status } from "@/components/ui";
import { COMPETENCIES } from "@/lib/framework";
import { claimVerdict, competencyScore, levelName, newestFirst } from "@/lib/scoring";
import { getStudent } from "@/lib/store";

export default async function SkillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const skill = COMPETENCIES.find((c) => c.id === id);
  if (!skill) notFound();

  const student = (await getStudent());
  const items = newestFirst(student.evidence).filter((e) => e.competencyId === skill.id);
  const score = competencyScore(student.evidence, skill.id);
  const claim = student.claims.find((c) => c.competencyId === skill.id);

  return (
    <div className="stack-lg">
      <PageHead title={skill.name} intro={skill.description} />
      <section className="stats">
        <div className="stat"><b>{score ?? "–"}</b>{levelName(score)}, evidenced score</div>
        {claim && (
          <div className="stat">
            <b>{claim.level}</b>
            Claimed: “{claim.text}” <Status value={claimVerdict(claim.level, score)} />
          </div>
        )}
        <div className="stat"><b>{items.length}</b>pieces of evidence</div>
      </section>
      <section className="panel">
        <h2>Evidence behind this score</h2>
        {items.length === 0 ? (
          <p className="muted" style={{ marginTop: "0.75rem" }}>Nothing yet. Take the assessment or submit a project that covers this skill.</p>
        ) : (
          <ul className="list">
            {items.map((item) => <li key={item.id}><EvidenceItem item={item} /></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
