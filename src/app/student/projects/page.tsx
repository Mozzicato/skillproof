import Link from "next/link";
import { PageHead, formatDate } from "@/components/ui";
import { PROJECTS, competency, project, role } from "@/lib/framework";
import { recommendProjects } from "@/lib/scoring";
import { getStudent } from "@/lib/store";
import type { Project } from "@/lib/types";

function ProjectRow({ item }: { item: Project }) {
  return (
    <li className="project">
      <div className="stack">
        <h3 style={{ fontSize: "1.25rem" }}>{item.title}</h3>
        <p>{item.brief}</p>
        <div className="chips">{item.rubric.map((c) => <span className="chip" key={c.id}>{competency(c.competencyId).name}</span>)}</div>
      </div>
      <Link className="btn" href={`/student/projects/${item.id}`}>Start project</Link>
    </li>
  );
}

export default async function ProjectsPage() {
  const student = (await getStudent());
  const recommended = recommendProjects(role(student.targetRoleId), student);
  const others = PROJECTS.filter((p) => !recommended.includes(p) && !student.evaluations.some((e) => e.projectId === p.id));

  return (
    <div className="stack-lg">
      <PageHead title="Recommended projects" intro="Practical work, starting with what closes your skill gaps fastest. Each project is marked against a published rubric." />
      <section>
        {recommended.length === 0 ? (
          <p className="muted">No open project targets your current gaps. Check your <Link href="/student/gaps">skill gaps</Link> or reassess.</p>
        ) : (
          <ul className="list">{recommended.map((p) => <ProjectRow key={p.id} item={p} />)}</ul>
        )}
      </section>

      {others.length > 0 && (
        <section className="stack">
          <h2>Other projects</h2>
          <ul className="list">{others.map((p) => <ProjectRow key={p.id} item={p} />)}</ul>
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
