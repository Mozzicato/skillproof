import type { Metadata } from "next";
import Link from "next/link";
import { CopyText } from "@/components/client";
import { CoachSetup } from "@/components/cycle";
import { siteOrigin } from "@/components/passport";
import { SiteHeader } from "@/components/SiteHeader";
import { formatDate } from "@/components/ui";
import { latestRun } from "@/lib/calibration";
import { FREE_COACH_LEARNERS, lastActive, nextAction } from "@/lib/coaching";
import { competency, role } from "@/lib/framework";
import { sampleStudent } from "@/lib/roster";
import { readiness } from "@/lib/scoring";
import { coachLearners, getCoach } from "@/lib/store";
import type { Student } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Coach dashboard | SkillProof AI" };

const SAMPLE_LEARNERS = ["daniel-reyes", "kwame-owusu", "chidi-nwosu", "grace-tembo"];

function LearnerTable({ rows }: { rows: { student: Student; joinedAt?: string }[] }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr><th>Learner</th><th className="num">Readiness</th><th className="num">Self-awareness</th><th>Current sprint</th><th>Last evidence</th><th>Next step</th></tr>
        </thead>
        <tbody>
          {rows.map(({ student: s }) => {
            const target = role(s.targetRoleId);
            const action = nextAction(s);
            const last = lastActive(s);
            return (
              <tr key={s.id}>
                <td><Link href={`/p/${s.id}`}>{s.name}</Link><br /><span className="small muted">{target.title}</span></td>
                <td className="num">{readiness(target.requirements, s.evidence)}</td>
                <td className="num">{latestRun(s.assessments)?.calibration ?? "–"}</td>
                <td>{s.sprint ? <>{competency(s.sprint.competencyId).name}<br /><span className="small muted">due {formatDate(s.sprint.dueAt)}</span></> : <span className="muted">None</span>}</td>
                <td>{last ? formatDate(last) : <span className="muted">None yet</span>}</td>
                <td><span className={`status ${action.tone}`}>{action.label}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function CoachPage() {
  const coach = await getCoach();
  const learners = coach ? await coachLearners(coach) : [];
  const samples = SAMPLE_LEARNERS.map((id) => ({ student: sampleStudent(id)! }));

  return (
    <>
      <SiteHeader section="Coach dashboard" />
      <main className="wide-page"><div className="wide stack-lg">
        <header className="page-head">
          <h1>Follow your learners by what they can prove</h1>
          <p className="muted">Invite up to {FREE_COACH_LEARNERS} learners free. You see each learner&apos;s evidenced readiness, self-awareness and sprint, and what to do next with them. Learners choose to share and can see who they share with.</p>
        </header>

        <section className="panel stack">
          {coach ? (
            <>
              <div className="row between">
                <h2>Invite learners</h2>
                <span className="badge">{learners.length} of {FREE_COACH_LEARNERS} learners, Free plan</span>
              </div>
              <p className="muted">Send this link to a learner. When they open it and choose to share, they appear below.</p>
              <div className="row">
                <code className="excerpt" style={{ wordBreak: "break-all" }}>{`${await siteOrigin()}/join/${coach.token}`}</code>
                <CopyText text={`${await siteOrigin()}/join/${coach.token}`} label="Copy link" />
              </div>
            </>
          ) : (
            <>
              <h2>Set up your coach profile</h2>
              <CoachSetup />
            </>
          )}
        </section>

        {coach && (
          <section className="panel stack">
            <h2>Your learners</h2>
            {learners.length === 0 ? <p className="muted">No one has joined yet. Learners appear here as soon as they accept your link.</p> : <LearnerTable rows={learners} />}
          </section>
        )}

        <section className="panel stack">
          <div className="stack" style={{ gap: "0.35rem" }}>
            <h2>Sample learners</h2>
            <p className="small muted">Four fictional students, so you can see the view before anyone joins.</p>
          </div>
          <LearnerTable rows={samples} />
        </section>
      </div></main>
    </>
  );
}
