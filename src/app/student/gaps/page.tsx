import Link from "next/link";
import { PageHead, Status } from "@/components/ui";
import { PROJECTS, competency, role } from "@/lib/framework";
import { gapRows } from "@/lib/scoring";
import { getStudent } from "@/lib/store";

export default async function GapsPage() {
  const student = (await getStudent());
  const target = role(student.targetRoleId);
  const rows = gapRows(target.requirements, student.evidence, student.claims);
  return (
    <div>
      <PageHead title="Skill gaps" intro={`Your evidenced scores against what a ${target.title} needs, largest gap first.`} />
      <div className="panel table-scroll">
        <table>
          <thead>
            <tr><th>Skill</th><th className="num">Required</th><th className="num">Evidenced</th><th className="num">Short by</th><th>Status</th><th>Close it with</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const fix = PROJECTS.find((p) => p.rubric.some((c) => c.competencyId === row.competencyId));
              return (
                <tr key={row.competencyId}>
                  <td><Link href={`/student/skills/${row.competencyId}`}>{competency(row.competencyId).name}</Link></td>
                  <td className="num">{row.required}</td>
                  <td className="num">{row.score ?? "–"}</td>
                  <td className="num">{row.shortfall}</td>
                  <td><Status value={row.status} /></td>
                  <td>{row.shortfall > 0 && fix ? <Link href={`/student/projects/${fix.id}`}>{fix.title}</Link> : "–"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
