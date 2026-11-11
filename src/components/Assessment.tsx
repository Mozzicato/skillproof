"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { message, post } from "@/components/client";
import { competency } from "@/lib/framework";
import type { Question } from "@/lib/types";

export function AssessmentForm({ questions, label }: { questions: Question[]; label: string }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  if (saved) {
    return (
      <div className="stack">
        <h2>Results saved</h2>
        <p>Your scores and skill gaps are updated.</p>
        <div className="row">
          <Link className="btn" href="/student/gaps">See my skill gaps</Link>
          <Link className="btn quiet" href="/student">Back to overview</Link>
        </div>
      </div>
    );
  }

  const question = questions[index];
  const last = index === questions.length - 1;
  const answered = answers[question.id] !== undefined;

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await post("/api/assessment", { answers });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <div className="row between small muted">
        <span>Question {index + 1} of {questions.length}</span>
        <span>{competency(question.competencyId).name}</span>
      </div>
      <div className="progress"><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
      <fieldset className="question" key={question.id}>
        <legend>{question.prompt}</legend>
        <div>
          {question.options.map((option, i) => (
            <label className="answer" key={option}>
              <input type="radio" name={question.id} checked={answers[question.id] === i} onChange={() => setAnswers({ ...answers, [question.id]: i })} />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row between">
        <button type="button" className="btn quiet" disabled={index === 0} onClick={() => setIndex(index - 1)}>Back</button>
        {last ? (
          <button type="button" className="btn" disabled={busy || !answered} onClick={submit}>{busy ? "Saving" : label}</button>
        ) : (
          <button type="button" className="btn" disabled={!answered} onClick={() => setIndex(index + 1)}>Next question</button>
        )}
      </div>
    </div>
  );
}
