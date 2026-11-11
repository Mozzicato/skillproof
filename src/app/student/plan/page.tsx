import { Check } from "lucide-react";
import Link from "next/link";
import { StartSprint, StopSprint } from "@/components/cycle";
import { PageHead, formatDate } from "@/components/ui";
import { JOBS, competency, project, role } from "@/lib/framework";
import { SPRINT_DAYS, competencyScore, daysSince, gapPriorities, proposeSprint, sprintSteps } from "@/lib/scoring";
import { getStudent } from "@/lib/store";

export default async function PlanPage() {
  const student = await getStudent();
  const target = role(student.targetRoleId);
  const sprint = student.sprint;

  if (!sprint) {
    const proposal = proposeSprint(target, student);
    const gap = proposal && gapPriorities(target, student).find((g) => g.competencyId === proposal.competencyId);
    const work = proposal && project(proposal.projectId);
    return (
      <div className="stack-lg">
        <PageHead title="Sprint plan" intro="Two weeks, one gap, and the exact proof that will close it. Each step ticks itself when the evidence arrives." />
        {proposal && work && gap ? (
          <section className="panel stack">
            <h2>Suggested: prove {competency(proposal.competencyId).name}</h2>
            <dl className="contract">
              <div><dt>Why this gap</dt><dd>
                {gap.unlocks.length
                  ? `It is the only thing standing between you and ${gap.unlocks.map((j) => `${j.title} at ${j.company}`).join(", ")}.`
                  : gap.blocks.length
                    ? `It is holding you back from ${gap.blocks.map((m) => `${m.job.title} at ${m.job.company}`).join(", ")}, and ${gap.demand.length} of ${JOBS.length} vacancies ask for it.`
                    : `${gap.demand.length} of ${JOBS.length} vacancies ask for it.`}
                {` You are ${gap.shortfall} points short.`}
              </dd></div>
              <div><dt>The proof that counts</dt><dd>“{work.title}”, scoring {proposal.target} or more on: {work.rubric.find((c) => c.id === proposal.criterionId)?.criterion}</dd></div>
              <div><dt>Then</dt><dd>Defend it in three questions, and reassess.</dd></div>
            </dl>
            <StartSprint label={`Start a ${SPRINT_DAYS}-day sprint`} />
          </section>
        ) : (
          <p className="empty">You meet every requirement for {target.title}. <Link href="/student/passport">Share your Skill Passport</Link></p>
        )}
      </div>
    );
  }

  const work = project(sprint.projectId)!;
  const criterion = work.rubric.find((c) => c.id === sprint.criterionId)!;
  const steps = sprintSteps(sprint, student, work.title, criterion.criterion);
  const doneCount = steps.filter((s) => s.done).length;
  const nextIndex = steps.findIndex((s) => !s.done);
  const day = Math.min(daysSince(sprint.startedAt) + 1, SPRINT_DAYS);
  const overdue = Date.now() > new Date(sprint.dueAt).getTime();
  const actions = [
    { href: `/student/projects/${work.id}`, label: "Open the project" },
    { href: `/student/projects/${work.id}`, label: "Improve and resubmit" },
    { href: `/student/projects/${work.id}#defence`, label: "Start my defence" },
    { href: "/student/assessment", label: "Reassess now" },
  ];
  const score = competencyScore(student.evidence, sprint.competencyId);

  return (
    <div className="stack-lg">
      <PageHead title={`Sprint: prove ${competency(sprint.competencyId).name}`} intro={`Started ${formatDate(sprint.startedAt)}, due ${formatDate(sprint.dueAt)}. Steps tick themselves when the evidence arrives, never because you say so.`} />
      <section className="panel stack">
        <div className="row between">
          <strong>{doneCount} of {steps.length} steps proven</strong>
          <span className={overdue && nextIndex !== -1 ? "status bad" : "small muted"}>{overdue && nextIndex !== -1 ? "Past the due date" : `Day ${day} of ${SPRINT_DAYS}`}</span>
        </div>
        <div className="progress"><span style={{ width: `${(doneCount / steps.length) * 100}%` }} /></div>
        <ol className="sprint-steps">
          {steps.map((step, i) => (
            <li key={step.label} className={step.done ? "done" : i === nextIndex ? "current" : undefined}>
              <span className="tick" aria-hidden="true">{step.done ? <Check size={16} /> : i + 1}</span>
              <span>{step.label}{step.done && <span className="sr-only">, done</span>}</span>
              {i === nextIndex && <Link className="btn btn-sm" href={actions[i].href}>{actions[i].label}</Link>}
            </li>
          ))}
        </ol>
        {nextIndex === -1 && (
          <div className="notice">
            Sprint complete. {competency(sprint.competencyId).name} is now evidenced at <strong>{score}</strong> against {sprint.target} required.
          </div>
        )}
        <div className="row between">
          <Link href={`/student/coach`}>Stuck? Ask the coach about {competency(sprint.competencyId).name}</Link>
          {nextIndex === -1 ? <StartSprint label="Start the next sprint" /> : <StopSprint />}
        </div>
      </section>
    </div>
  );
}
