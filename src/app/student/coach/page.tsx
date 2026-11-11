import Link from "next/link";
import { Coach } from "@/components/client";
import { PageHead, Status } from "@/components/ui";
import { competency, role } from "@/lib/framework";
import { gapRows } from "@/lib/scoring";
import { getStudent } from "@/lib/store";

export default async function CoachPage() {
  const student = (await getStudent());
  const gaps = gapRows(role(student.targetRoleId).requirements, student.evidence, student.claims).filter((r) => r.shortfall > 0).slice(0, 3);
  return (
    <div>
      <PageHead title="Career coach" intro="Advice based on what you have proven, not on what your CV says." />
      <div className="split">
        <section className="panel">
          <Coach suggestions={["What should I work on first?", "Am I ready to apply for internships?", "How do I prove my SQL skills?"]} />
        </section>
        <aside className="stack">
          <h2>What the coach sees</h2>
          <ul className="list">
            {gaps.map((g) => (
              <li key={g.competencyId} className="row between" style={{ padding: "0.6rem 0" }}>
                <Link href={`/student/skills/${g.competencyId}`}>{competency(g.competencyId).name}</Link>
                <Status value={g.status} />
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
