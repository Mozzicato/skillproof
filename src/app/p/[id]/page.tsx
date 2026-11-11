import Link from "next/link";
import { notFound } from "next/navigation";
import { EvidenceItem } from "@/components/ui";
import { COMPETENCIES } from "@/lib/framework";
import { competencyScore, levelName, newestFirst } from "@/lib/scoring";
import { findStudent } from "@/lib/store";
import { SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

export default async function PortfolioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await findStudent(id);
  if (!student) notFound();

  const proven = COMPETENCIES.flatMap((c) => {
    const score = competencyScore(student.evidence, c.id);
    return score === null ? [] : [{ skill: c, score }];
  }).sort((a, b) => b.score - a.score);

  return (
    <>
      <SiteHeader section="Evidence portfolio" />
      <main className="wide-page"><div className="wide stack-lg" style={{ maxWidth: 900 }}>
        <header className="page-head">
          <h1>{student.name}</h1>
          <p className="muted">{student.department}, {student.university}. Every score links to the work behind it.</p>
        </header>
        {proven.map(({ skill, score }) => {
          const applied = newestFirst(student.evidence).filter((e) => e.competencyId === skill.id && e.excerpt);
          return (
            <section className="panel stack" key={skill.id}>
              <div className="row between">
                <h2>{skill.name}</h2>
                <strong>{score}, {levelName(score)}</strong>
              </div>
              {applied.length === 0 ? (
                <p className="muted small">Assessment results only, with no applied work yet.</p>
              ) : (
                applied.map((item) => <EvidenceItem key={item.id} item={item} />)
              )}
            </section>
          );
        })}
      </div></main>
    </>
  );
}
