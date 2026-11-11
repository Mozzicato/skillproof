"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { message, post } from "@/components/client";
import { CONFIDENCE_LABEL, calibrationLabel } from "@/lib/calibration";
import { competency } from "@/lib/framework";
import type { AssessmentRun, CompetencyId, Confidence } from "@/lib/types";

type Served = { id: string; competencyId: CompetencyId; prompt: string; options: string[]; fresh: boolean };
type Next = { done: boolean; total: number; question?: Served };
type Answer = { questionId: string; choice: string; confidence: Confidence };
type TaskResult = { score: number; rationale: string; excerpt: string | null; weaknesses: string[] };

const LEVELS = [
  { at: 0, name: "Beginner" },
  { at: 40, name: "Developing" },
  { at: 60, name: "Proficient" },
  { at: 80, name: "Advanced" },
];
const levelFor = (n: number) => [...LEVELS].reverse().find((l) => n >= l.at)!.name;

export function AssessmentFlow({
  skills,
  initialClaims,
  task,
  previousCalibration,
  previousLabel,
  reassess,
}: {
  skills: CompetencyId[];
  initialClaims: Partial<Record<CompetencyId, number>>;
  task: { prompt: string; skill: string };
  previousCalibration: number | null;
  previousLabel: string | null;
  reassess: boolean;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"claim" | "questions" | "task" | "results">("claim");
  const [claims, setClaims] = useState<Record<string, number>>(() => Object.fromEntries(skills.map((s) => [s, initialClaims[s] ?? 50])));
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [current, setCurrent] = useState<Served | null>(null);
  const [total, setTotal] = useState(skills.length * 2);
  const [choice, setChoice] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [run, setRun] = useState<AssessmentRun | null>(null);
  const [taskAnswer, setTaskAnswer] = useState("");
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Kept from the first render: once results are saved the page refreshes and the prop becomes this run's score.
  const [previous] = useState(previousCalibration);

  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  async function advance(list: Answer[]) {
    const next = await post<Next>("/api/assessment/next", { answers: list.map(({ questionId, choice }) => ({ questionId, choice })) });
    setTotal(next.total);
    if (next.done || !next.question) {
      const saved = await post<{ run: AssessmentRun }>("/api/assessment", { claims, answers: list });
      setRun(saved.run);
      setPhase("task");
      router.refresh();
      return;
    }
    setCurrent(next.question);
    setChoice(null);
    setConfidence(null);
  }

  if (phase === "claim") {
    return (
      <div className="stack">
        {previous !== null && previousLabel && (
          <p className="notice">
            Last time your self-awareness was <strong>{previous}, {previousLabel.toLowerCase()}</strong>.
            {reassess && " You will get questions you have not seen before wherever the bank allows."}
          </p>
        )}
        <div className="step-head">
          <span className="step-pill">Step 1 of 3</span>
          <h2>First, rate yourself</h2>
          <p className="muted">Say how good you think you are at each skill. This never raises your score. We compare it with what you show next, because knowing what you don&apos;t know is a skill employers look for.</p>
        </div>
        <div className="claim-sliders">
          {skills.map((id) => (
            <label key={id} className="claim-slider">
              <span className="row between">
                <strong>{competency(id).name}</strong>
                <span className="small"><b>{claims[id]}</b> <span className="muted">{levelFor(claims[id])}</span></span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={claims[id]}
                aria-valuetext={`${claims[id]}, ${levelFor(claims[id])}`}
                onChange={(e) => setClaims({ ...claims, [id]: Number(e.target.value) })}
              />
            </label>
          ))}
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <div>
          <button type="button" className="btn" disabled={busy} onClick={() => act(async () => { await advance([]); setPhase("questions"); })}>
            {busy ? "Preparing questions" : "Start the questions"}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "questions" && current) {
    const number = answers.length + 1;
    return (
      <div className="stack">
        <div className="row between small muted">
          <span>Step 2 of 3. Question {number} of {total}</span>
          <span>{competency(current.competencyId).name}{reassess && current.fresh ? ", new question" : ""}</span>
        </div>
        <div className="progress"><span style={{ width: `${(number / total) * 100}%` }} /></div>
        <fieldset className="question" key={current.id}>
          <legend>{current.prompt}</legend>
          <div>
            {current.options.map((option) => (
              <label className="answer" key={option}>
                <input type="radio" name={current.id} checked={choice === option} onChange={() => setChoice(option)} />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="confidence" disabled={choice === null}>
          <legend>How sure are you?</legend>
          <div className="segmented">
            {(Object.keys(CONFIDENCE_LABEL) as Confidence[]).map((c) => (
              <label key={c} className="segment">
                <input type="radio" name={`${current.id}-confidence`} checked={confidence === c} onChange={() => setConfidence(c)} />
                <span>{CONFIDENCE_LABEL[c]}</span>
              </label>
            ))}
          </div>
          <p className="hint">A lucky guess counts for less than knowing. Being certain and wrong costs more than an honest guess.</p>
        </fieldset>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="row between">
          <span className="small muted">Questions get harder or easier as you answer, so there is no going back.</span>
          <button
            type="button"
            className="btn"
            disabled={busy || !choice || !confidence}
            onClick={() =>
              act(async () => {
                const list = [...answers, { questionId: current.id, choice: choice!, confidence: confidence! }];
                await advance(list);
                setAnswers(list);
              })
            }
          >
            {busy ? "Saving" : number === total ? "Finish questions" : "Next question"}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "task") {
    return (
      <div className="stack">
        <div className="step-head">
          <span className="step-pill">Step 3 of 3</span>
          <h2>Show it: one short task</h2>
          <p className="muted">Recognising an answer is not the same as producing one. About five minutes. It is graded against a rubric, and credit needs a passage the grader can quote from your answer.</p>
        </div>
        <p className="task-brief"><strong>{task.skill}.</strong> {task.prompt}</p>
        <label className="field">Your answer<textarea value={taskAnswer} onChange={(e) => setTaskAnswer(e.target.value)} rows={10} spellCheck={false} /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="row">
          <button
            type="button"
            className="btn"
            disabled={busy || taskAnswer.trim().length < 20}
            onClick={() =>
              act(async () => {
                setTaskResult(await post<TaskResult>("/api/assessment/task", { answer: taskAnswer }));
                setPhase("results");
                router.refresh();
              })
            }
          >
            {busy ? "Grading your answer" : "Submit my answer"}
          </button>
          <button type="button" className="btn quiet" disabled={busy} onClick={() => setPhase("results")}>Skip the task</button>
        </div>
      </div>
    );
  }

  if (phase === "results" && run) {
    const label = calibrationLabel(run);
    return (
      <div className="stack-lg">
        <div className="calibration">
          <div className="calibration-score">
            <b>{run.calibration}</b>
            <span>self-awareness</span>
          </div>
          <div className="stack" style={{ gap: "0.35rem" }}>
            <h2>{label}</h2>
            <p>
              {run.overconfident > 0 ? `You were sure of ${run.overconfident} ${run.overconfident === 1 ? "answer" : "answers"} that turned out wrong` : "You were never sure of a wrong answer"}
              {run.underconfident > 0 ? `, and guessed ${run.underconfident} that you actually knew.` : "."}
              {previous !== null && ` Last time you scored ${previous}.`}
            </p>
            <p className="small muted">How closely your confidence matched your results, out of 100. Employers see this on your passport.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Skill and verdict</th><th className="num">You said</th><th className="num">You showed</th></tr></thead>
            <tbody>
              {run.skills.map((s) => {
                const diff = s.claimed === null ? null : s.claimed - s.measured;
                return (
                  <tr key={s.competencyId}>
                    <td>
                      {competency(s.competencyId).name}
                      <br />
                      {diff === null ? null : Math.abs(diff) <= 10 ? <span className="status good">Accurate</span> : diff > 0 ? <span className="status bad">Overrated by {diff}</span> : <span className="status mid">Underrated by {-diff}</span>}
                    </td>
                    <td className="num">{s.claimed ?? "–"}</td>
                    <td className="num"><strong>{s.measured}</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {taskResult && (
          <section className="stack" style={{ gap: "0.4rem" }}>
            <h3>Applied task: {taskResult.score} of 100</h3>
            {taskResult.excerpt && <div><code className="excerpt">{taskResult.excerpt}</code></div>}
            <p>{taskResult.rationale}</p>
            {taskResult.weaknesses.length > 0 && <ul className="small">{taskResult.weaknesses.map((w) => <li key={w}>{w}</li>)}</ul>}
          </section>
        )}
        <div className="row">
          <Link className="btn" href="/student/gaps">See which gap to close first</Link>
          <Link className="btn quiet" href="/student">Back to overview</Link>
        </div>
      </div>
    );
  }

  return <p className="muted">Loading</p>;
}
