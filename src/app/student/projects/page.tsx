import Link from "next/link";
import { PageHead, formatDate } from "@/components/ui";
import { PROJECTS, competency, project, role } from "@/lib/framework";
import { recommendProjects } from "@/lib/scoring";
import { getStudent } from "@/lib/store";

export default function ProjectsPage() {
  const student = getStudent();
  const recommended = recommendProjects(role(student.targetRoleId), student);
  const others = PROJECTS.filter((p) => !recommended.includes(p) && !student.evaluations.some((e) => e.projectId === p.id));

  return (
    <div className="stack-lg">
      <PageHead title="Recommended projects" intro="Practical work ordered by how much it closes your skill gaps. Each project is assessed against a published rubric." />
      <section className="panel">
        <h2>Do these next</h2>
        {recommended.length === 0 ? (
          <p className="muted" style={{ marginTop: "0.75rem" }}>No open project targets your current gaps.</p>
        ) : (
          <ul className="list">
            {recommended.map((p) => (
              <li key={p.id} className="stack" style={{ gap: "0.35rem" }}>
                <h3><Link href={`/student/projects/${p.id}`}>{p.title}</Link></h3>
                <p>{p.brief}</p>
                <p className="small muted">Proves {p.rubric.map((c) => competency(c.competencyId).name).join(", ")}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {others.length > 0 && (
        <section className="stack">
          <h2>Other projects</h2>
          <ul className="list">
            {others.map((p) => <li key={p.id}><Link href={`/student/projects/${p.id}`}>{p.title}</Link></li>)}
          </ul>
        </section>
      )}

      <section className="panel" id="submitted">
        <h2>Your evaluations</h2>
        {student.evaluations.length === 0 ? (
          <p className="muted" style={{ marginTop: "0.75rem" }}>Submit a project to see your first evaluation here.</p>
        ) : (
          <ul className="list">
            {[...student.evaluations].reverse().map((e) => (
              <li key={e.id} className="row between">
                <Link href={`/student/projects/${e.projectId}`}>{project(e.projectId)?.title}</Link>
                <span className="small muted">{formatDate(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
