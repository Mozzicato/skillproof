import { JobCheck } from "@/components/client";
import { PageHead } from "@/components/ui";
import { competency } from "@/lib/framework";
import { jobMatches } from "@/lib/scoring";
import { getStudent } from "@/lib/store";

export default async function OpportunitiesPage() {
  const matches = jobMatches((await getStudent()).evidence);
  return (
    <div className="stack-lg">
      <PageHead title="Jobs and internships" intro="Matched on the skills you have proven. These listings are fictional samples." />
      <section className="panel stack">
        <h2>Check a real job</h2>
        <p className="muted">Paste any advert to see which requirements your evidence already meets.</p>
        <JobCheck />
      </section>
      <ul className="list panel">
        {matches.map((m) => (
          <li key={m.job.id} className="stack" style={{ gap: "0.3rem" }}>
            <div className="row between">
              <h3>{m.job.title}, {m.job.company}</h3>
              <span className={`status ${m.missing.length === 0 ? "good" : "mid"}`}>{m.met} of {m.total} requirements proven</span>
            </div>
            <p className="small muted">{m.job.type}, {m.job.location}</p>
            {m.missing.length > 0 && (
              <p className="small">Still to prove: {m.missing.map((r) => `${competency(r.competencyId).name} (${r.level})`).join(", ")}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
