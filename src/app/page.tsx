import Link from "next/link";
import { competency } from "@/lib/framework";
import { competencyScore, levelName } from "@/lib/scoring";
import { getStudent } from "@/lib/store";

export const dynamic = "force-dynamic";

const PORTALS = [
  { href: "/student", name: "Student", text: "Prove your skills, close your gaps and get matched to work." },
  { href: "/university", name: "University", text: "See where each department stands against what employers want." },
  { href: "/employer", name: "Employer", text: "Search graduates by demonstrated skill, then read the work." },
];

export default function Home() {
  const student = getStudent();
  const score = competencyScore(student.evidence, "python");
  const proof = student.evidence.find((e) => e.competencyId === "python" && e.excerpt);
  const claim = student.claims.find((c) => c.competencyId === "python");

  return (
    <main className="landing">
      <span className="brand">SkillProof</span>
      <section className="hero">
        <div>
          <h1>A CV says it. SkillProof shows the work.</h1>
          <p>Students earn every skill score with assessments, projects and interviews that anyone can inspect.</p>
        </div>
        <aside className="proof-sheet" aria-label="Example of a claim checked against evidence">
          {claim && <div className="proof-claim">{claim.text}</div>}
          {proof && (
            <div className="stack" style={{ gap: "0.5rem" }}>
              <div><code className="excerpt sweep">{proof.excerpt}</code></div>
              <p className="small muted">{proof.rationale}</p>
            </div>
          )}
          <div>
            <strong>{competency("python").name}: {score}, {levelName(score)}</strong>
            <div className="small muted">Sample student, from {student.evidence.filter((e) => e.competencyId === "python").length} pieces of evidence</div>
          </div>
        </aside>
      </section>
      <nav className="portals" aria-label="Choose a portal">
        {PORTALS.map((p) => (
          <Link className="portal" href={p.href} key={p.href}>
            <h2>{p.name}</h2>
            <span>{p.text}</span>
            <span aria-hidden="true" className="muted">Open</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
