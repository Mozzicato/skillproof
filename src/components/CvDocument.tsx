import { role } from "@/lib/framework";
import type { OptimisedCv, Student } from "@/lib/types";

export function CvDocument({ student, cv, passportUrl }: { student: Student; cv: OptimisedCv; passportUrl: string }) {
  return (
    <article className="cv-doc">
      <header>
        <h2>{student.name}</h2>
        <p className="cv-headline">{cv.headline}</p>
        <p className="small muted">{student.department}, {student.university}. Applying for {role(cv.targetRoleId).title}. Verified Skill Passport: {passportUrl}</p>
      </header>
      <p>{cv.summary}</p>
      <section>
        <h3>Skills, scored from evidence</h3>
        <ul className="cv-skills">
          {cv.skills.map((s) => (
            <li key={s.competencyId}><strong>{s.name}</strong> <span className="cv-level">{s.level}, {s.score}/100</span><br /><span className="small">{s.line}</span></li>
          ))}
        </ul>
      </section>
      {cv.projects.length > 0 && (
        <section>
          <h3>Assessed projects</h3>
          {cv.projects.map((p) => (
            <div key={p.title} className="cv-entry"><strong>{p.title}</strong><ul>{p.bullets.map((b) => <li key={b}>{b}</li>)}</ul></div>
          ))}
        </section>
      )}
      {cv.experience.length > 0 && (
        <section>
          <h3>Experience</h3>
          {cv.experience.map((e) => (
            <div key={e.role + e.organisation} className="cv-entry">
              <strong>{e.role}, {e.organisation}</strong>{e.dates && <span className="small muted"> {e.dates}</span>}
              <ul>{e.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
            </div>
          ))}
        </section>
      )}
      {cv.education.length > 0 && (
        <section>
          <h3>Education</h3>
          <ul>{cv.education.map((e) => <li key={e}>{e}</li>)}</ul>
        </section>
      )}
    </article>
  );
}
