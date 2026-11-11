import { ArrowRight, BadgeCheck, GraduationCap, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ClaimSheet, type MarkedClaim } from "@/components/ClaimSheet";
import { SiteHeader } from "@/components/SiteHeader";
import { COHORT_SIZE, DEPARTMENTS, cohort, departmentMean } from "@/lib/cohort";
import { COMPETENCIES, competency, role } from "@/lib/framework";
import { claimVerdict, competencyScore, gapRows, newestFirst, readiness } from "@/lib/scoring";
import { seedStudent } from "@/lib/seed";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: BadgeCheck, title: "Scores from evidence", text: "A skill only scores when an assessment, project or interview shows it. Claims on a CV count for nothing." },
  { icon: ShieldCheck, title: "Project defence", text: "Students answer questions about their own submitted work, so copied work stands out." },
  { icon: GraduationCap, title: "Curriculum gap map", text: "Universities see what each department teaches against what employers ask for." },
  { icon: Search, title: "Search by proven skill", text: "Employers filter graduates by demonstrated skill, then read the work behind each score." },
];

const STEPS = [
  { title: "Assess", text: "A short assessment sets a baseline for the role you want." },
  { title: "Prove", text: "Projects are marked against a rubric, quoting your own work." },
  { title: "Defend", text: "Explain your work under questioning to raise its trust level." },
  { title: "Connect", text: "Match to jobs on what you can show, not what you claim." },
];

export default function Home() {
  const sample = seedStudent();
  const target = role(sample.targetRoleId);
  const score = readiness(target.requirements, sample.evidence);
  const rows = gapRows(target.requirements, sample.evidence, sample.claims);

  const claims: MarkedClaim[] = sample.claims.map((c) => {
    const proven = competencyScore(sample.evidence, c.competencyId);
    const best = newestFirst(sample.evidence).find((e) => e.competencyId === c.competencyId && e.excerpt)
      ?? newestFirst(sample.evidence).find((e) => e.competencyId === c.competencyId);
    return {
      id: c.competencyId,
      skill: competency(c.competencyId).name,
      text: c.text,
      mark: proven === null ? "No proof" : `${proven} proven`,
      verdict: claimVerdict(c.level, proven),
      excerpt: best?.excerpt,
      rationale: best?.rationale ?? "Nothing has been submitted for this skill yet.",
    };
  });

  const topCandidates = [...cohort()].sort((a, b) => b.scores.sql + b.scores.python - a.scores.sql - a.scores.python).slice(0, 3);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div>
            <h1>A CV says it. SkillProof shows the work.</h1>
            <p className="hero-lead">Students earn every skill score with assessments, projects and interviews that anyone can inspect.</p>
            <div className="row hero-actions">
              <Link className="btn" href="/signup">Create your free account</Link>
              <Link className="btn accent" href="/student">Open the judge demo</Link>
            </div>
            <p className="judge-note"><span className="badge judge">For judges</span>The demo opens a sample student with work already scored. Your changes stay private to your browser.</p>
          </div>
          <ClaimSheet name={sample.name} claims={claims} />
        </section>

        <div className="band">
          <section className="section">
            <div className="section-head">
              <h2>Built around proof, for everyone involved</h2>
              <p className="muted">One evidence record serves students, universities and employers.</p>
            </div>
            <div className="features">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div className="feature" key={title}>
                  <span className="feature-icon"><Icon size={22} aria-hidden="true" /></span>
                  <h3>{title}</h3>
                  <p className="small muted">{text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="section">
          <div className="section-head">
            <h2>How a student becomes job ready</h2>
          </div>
          <ol className="steps">
            {STEPS.map((s) => (
              <li key={s.title}>
                <h3>{s.title}</h3>
                <p className="small muted" style={{ marginTop: "0.3rem" }}>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="band">
          <section className="section">
            <div className="section-head">
              <h2>Choose your view</h2>
            </div>
            <div className="portals">
              <Link className="portal" href="/student">
                <div><h3>Students</h3><p className="small muted">Prove your skills, close your gaps and get matched to work.</p></div>
                <div className="portal-preview">
                  <strong>{score} of 100 ready</strong>
                  <div className="meter">{rows.map((r) => <span key={r.competencyId} className={r.status.replace(" ", "")} />)}</div>
                  <p className="small muted" style={{ marginTop: "0.5rem" }}>Sample student, {target.title}</p>
                </div>
                <span className="portal-link">Open the judge demo <ArrowRight size={16} aria-hidden="true" /></span>
              </Link>
              <Link className="portal" href="/university">
                <div><h3>Universities</h3><p className="small muted">See what each department teaches against what employers want.</p></div>
                <div className="portal-preview mini-heat" aria-hidden="true">
                  {DEPARTMENTS.flatMap((d) => COMPETENCIES.map((c) => (
                    <span key={d.name + c.id} style={{ background: `color-mix(in oklab, #0d9488 ${Math.round((Math.min(departmentMean(d.name, c.id), 90) / 90) * 88 + 6)}%, white)` }} />
                  )))}
                </div>
                <span className="portal-link">Open the university view <ArrowRight size={16} aria-hidden="true" /></span>
              </Link>
              <Link className="portal" href="/employer">
                <div><h3>Employers</h3><p className="small muted">Search graduates by demonstrated skill, then read the work.</p></div>
                <div className="portal-preview mini-list" aria-hidden="true">
                  {topCandidates.map((c) => <div key={c.id}><span>{c.name}</span><span>SQL {c.scores.sql}</span></div>)}
                </div>
                <span className="portal-link">Open the employer view <ArrowRight size={16} aria-hidden="true" /></span>
              </Link>
            </div>
          </section>
        </div>

        <section className="section">
          <div className="cta-band">
            <div className="stack" style={{ gap: "0.4rem" }}>
              <h2>Start proving your skills today</h2>
              <p>Free for students. Your first assessment takes about five minutes.</p>
            </div>
            <div className="row">
              <Link className="btn accent" href="/signup">Create your free account</Link>
              <Link className="btn quiet" href="/login">Sign in</Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-foot small muted">
        {sample.name} is a sample student. The {COHORT_SIZE.toLocaleString()} university and employer records are simulated.
      </footer>
    </>
  );
}
