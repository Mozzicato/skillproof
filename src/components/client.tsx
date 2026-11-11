"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { competency } from "@/lib/framework";
import type { HistoryPoint } from "@/lib/scoring";

const DEFENCE_QUESTIONS = 3;
import type { CompetencyId, ProjectEvaluation } from "@/lib/types";

export async function post<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "The request failed. Try again.");
  return data as T;
}

export function message(error: unknown): string {
  return error instanceof Error ? error.message : "The request failed. Try again.";
}

export function RoleSelect({ value, roles }: { value: string; roles: { id: string; title: string }[] }) {
  const router = useRouter();
  return (
    <label className="role-select">
      Target role
      <select
        value={value}
        onChange={async (e) => {
          await post("/api/role", { roleId: e.target.value });
          router.refresh();
        }}
      >
        {roles.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
      </select>
    </label>
  );
}

export function ResetDemo() {
  const router = useRouter();
  return (
    <button
      className="linkish"
      onClick={async () => {
        await post("/api/reset", {});
        router.refresh();
      }}
    >
      Reset sample data
    </button>
  );
}

type ChatMessage = { role: "user" | "assistant"; content: string };

async function streamInto(url: string, messages: ChatMessage[], onText: (text: string) => void, extra: object = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...extra, messages }),
  });
  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? "The request failed. Try again.");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    onText(text);
  }
}

export function Coach({ suggestions }: { suggestions: string[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send(text: string) {
    const history: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    setDraft("");
    setBusy(true);
    setError("");
    try {
      await streamInto("/api/coach", history, (reply) =>
        setMessages([...history, { role: "assistant", content: reply }]),
      );
    } catch (err) {
      setMessages(messages);
      setDraft(text);
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      {messages.length === 0 && (
        <div className="prompts">
          <h2>Start with a question</h2>
          {suggestions.map((s) => (
            <button key={s} className="btn" disabled={busy} onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}
      <div className="chat" aria-live="polite">
        {messages.map((m, i) => <div key={i} className={`msg ${m.role}`}>{m.content}</div>)}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) send(draft.trim());
        }}
      >
        <input type="text" aria-label="Message to your coach" placeholder="Ask about your skills or next steps" value={draft} onChange={(e) => setDraft(e.target.value)} style={{ flex: "1 1 16rem", width: "auto" }} />
        <button className="btn" disabled={busy || !draft.trim()}>{busy ? "Replying" : "Send"}</button>
      </form>
    </div>
  );
}

type InterviewReview = { feedback: string; skills: { name: string; score: number; rationale: string }[] };

const START: ChatMessage = { role: "user", content: "I am ready. Please ask your first question." };

export function Interview() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState<InterviewReview | null>(null);
  const answers = messages.filter((m) => m.role === "user").length - 1;

  async function advance(history: ChatMessage[]) {
    setMessages(history);
    setBusy(true);
    setError("");
    try {
      await streamInto("/api/interview", history, (reply) =>
        setMessages([...history, { role: "assistant", content: reply }]),
      );
    } catch (err) {
      setError(message(err));
      setMessages(history.length === 1 ? [] : history.slice(0, -1));
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setBusy(true);
    setError("");
    try {
      setReview(await post<InterviewReview>("/api/interview/finish", { messages }));
      router.refresh();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  if (review) {
    return (
      <div className="panel stack">
        <h2>Interview review</h2>
        <p>{review.feedback}</p>
        {review.skills.length === 0 ? (
          <p className="muted">Your answers did not give enough evidence to score a skill.</p>
        ) : (
          <ul className="list">
            {review.skills.map((s) => (
              <li key={s.name}><strong>{s.name}: {s.score}</strong><p>{s.rationale}</p></li>
            ))}
          </ul>
        )}
        <button className="btn quiet" style={{ justifySelf: "start" }} onClick={() => { setReview(null); setMessages([]); }}>Start another interview</button>
      </div>
    );
  }

  return (
    <div className="stack">
      {messages.length === 0 && <div><button className="btn" disabled={busy} onClick={() => advance([START])}>Start interview</button></div>}
      <div className="chat" aria-live="polite">
        {messages.slice(1).map((m, i) => <div key={i} className={`msg ${m.role}`}>{m.content}</div>)}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {messages.length > 0 && (
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            const text = draft.trim();
            setDraft("");
            advance([...messages, { role: "user", content: text }]);
          }}
        >
          <textarea aria-label="Your answer" style={{ minHeight: "7rem" }} value={draft} onChange={(e) => setDraft(e.target.value)} />
          <div className="row">
            <button className="btn" disabled={busy || !draft.trim()}>Send answer</button>
            <button type="button" className="btn quiet" disabled={busy || answers < 1} onClick={finish}>Finish and get scored</button>
          </div>
        </form>
      )}
    </div>
  );
}

export function DefenceExam({ evaluationId }: { evaluationId: string }) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const answers = Math.max(messages.filter((m) => m.role === "user").length - 1, 0);
  const complete = answers >= DEFENCE_QUESTIONS;

  async function advance(history: ChatMessage[]) {
    setMessages(history);
    setBusy(true);
    setError("");
    try {
      await streamInto("/api/projects/defence", history, (reply) =>
        setMessages([...history, { role: "assistant", content: reply }]),
        { evaluationId },
      );
    } catch (err) {
      setError(message(err));
      setMessages(history.length === 1 ? [] : history.slice(0, -1));
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setBusy(true);
    setError("");
    try {
      await post("/api/projects/defence/finish", { evaluationId, messages });
      router.refresh();
    } catch (err) {
      setError(message(err));
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      {messages.length === 0 && (
        <div><button className="btn" disabled={busy} onClick={() => advance([START])}>Start my defence</button></div>
      )}
      <div className="chat" aria-live="polite">
        {messages.slice(1).map((m, i) => <div key={i} className={`msg ${m.role}`}>{m.content}</div>)}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {complete ? (
        <div><button className="btn" disabled={busy} onClick={finish}>{busy ? "Scoring your defence" : "Finish and get scored"}</button></div>
      ) : messages.length > 0 && (
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            const text = draft.trim();
            if (!text) return;
            setDraft("");
            const history: ChatMessage[] = [...messages, { role: "user", content: text }];
            if (answers + 1 >= DEFENCE_QUESTIONS) setMessages(history);
            else advance(history);
          }}
        >
          <label className="field">
            Answer {answers + 1} of {DEFENCE_QUESTIONS}
            <textarea style={{ minHeight: "7rem" }} value={draft} onChange={(e) => setDraft(e.target.value)} onPaste={(e) => e.preventDefault()} />
          </label>
          <p className="small muted">Type your answer yourself. Pasting is turned off here.</p>
          <div><button className="btn" disabled={busy || !draft.trim()}>Send answer</button></div>
        </form>
      )}
    </div>
  );
}

type JobCheckResult = {
  title: string;
  readiness: number;
  rows: { id: string; name: string; required: number; score: number | null; status: string; project: { id: string; title: string } | null }[];
  otherSkills: string[];
  search: { skills: string[]; min: number };
};

export function JobCheck() {
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<JobCheckResult | null>(null);

  return (
    <div className="stack">
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            setResult(await post<JobCheckResult>("/api/jobs/match", { description }));
          } catch (err) {
            setError(message(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="field">Job advert<textarea style={{ minHeight: "9rem" }} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <div><button className="btn" disabled={busy || description.trim().length < 40}>{busy ? "Reading the advert" : "Check this job"}</button></div>
      </form>
      {result && (
        <div className="stack" aria-live="polite">
          <h3>{result.title}: {result.readiness} of 100 ready</h3>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Skill</th><th className="num">Required</th><th className="num">Evidenced</th><th>Status</th><th>Close it with</th></tr></thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td className="num">{r.required}</td>
                    <td className="num">{r.score ?? "–"}</td>
                    <td>{r.status}</td>
                    <td>{r.project ? <a href={`/student/projects/${r.project.id}`}>{r.project.title}</a> : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.otherSkills.length > 0 && <p className="small muted">Also asked for, not measured here: {result.otherSkills.join(", ")}</p>}
        </div>
      )}
    </div>
  );
}

export function EmployerAdvertSearch() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const { search } = await post<JobCheckResult>("/api/jobs/match", { description });
          const query = new URLSearchParams(search.skills.map((s) => ["skill", s]));
          query.set("min", String(search.min));
          router.push(`/employer?${query}`);
        } catch (err) {
          setError(message(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">Or paste your job advert<textarea style={{ minHeight: "6.5rem" }} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <div><button className="btn quiet" disabled={busy || description.trim().length < 40}>{busy ? "Reading the advert" : "Search from advert"}</button></div>
    </form>
  );
}

export function CurriculumForm({ departments }: { departments: string[] }) {
  const router = useRouter();
  const [department, setDepartment] = useState(departments[0]);
  const [syllabus, setSyllabus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await post("/api/curriculum", { department, syllabus });
          setSyllabus("");
          router.refresh();
        } catch (err) {
          setError(message(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">Department
        <select value={department} onChange={(e) => setDepartment(e.target.value)}>
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>
      </label>
      <label className="field">Syllabus text<textarea style={{ minHeight: "9rem" }} value={syllabus} onChange={(e) => setSyllabus(e.target.value)} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <div><button className="btn" disabled={busy || syllabus.trim().length < 40}>{busy ? "Mapping the syllabus" : "Map this syllabus"}</button></div>
    </form>
  );
}

export function ProjectSubmit({ projectId, deliverable }: { projectId: string; deliverable: string }) {
  const router = useRouter();
  const [submission, setSubmission] = useState("");
  const [link, setLink] = useState("");
  const [repo, setRepo] = useState("");
  const [imported, setImported] = useState("");
  const [importing, setImporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function importRepo() {
    setImporting(true);
    setError("");
    setImported("");
    try {
      const r = await post<{ text: string; link: string; files: number; commits: number }>("/api/github", { url: repo });
      setSubmission(r.text);
      setLink(r.link);
      setImported(`Imported ${r.files} files and ${r.commits} commit messages. Add a short note at the end if the brief asks for one.`);
    } catch (err) {
      setError(message(err));
    } finally {
      setImporting(false);
    }
  }

  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await post<{ evaluation: ProjectEvaluation }>("/api/projects/evaluate", { projectId, submission, link });
          setImported("");
          setRepo("");
          setSubmission("");
          setLink("");
          router.refresh();
        } catch (err) {
          setError(message(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="import-row">
        <label className="field" style={{ flex: "1 1 16rem" }}>
          Import from a public GitHub repository
          <input type="url" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="https://github.com/you/project" />
        </label>
        <button type="button" className="btn quiet" disabled={importing || !repo.includes("github.com/")} onClick={importRepo}>
          {importing ? "Reading the repository" : "Import code"}
        </button>
      </div>
      {imported && <p className="small" role="status">{imported}</p>}
      <label className="field">Your work<textarea value={submission} onChange={(e) => setSubmission(e.target.value)} placeholder={deliverable} rows={12} spellCheck={false} /></label>
      <label className="field">Portfolio or repository link (optional)<input type="url" value={link} onChange={(e) => setLink(e.target.value)} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <div><button className="btn" disabled={busy || submission.trim().length < 40}>{busy ? "Evaluating against the rubric" : "Submit for evaluation"}</button></div>
    </form>
  );
}

export function ResumeAnalyzer() {
  const router = useRouter();
  const [cv, setCv] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await post("/api/resume", { cv });
          setCv("");
          router.refresh();
        } catch (err) {
          setError(message(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">CV text<textarea value={cv} onChange={(e) => setCv(e.target.value)} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <div><button className="btn" disabled={busy || cv.trim().length < 40}>{busy ? "Checking your CV" : "Check my CV"}</button></div>
    </form>
  );
}

export function CopyText({ text, label = "Copy CV text" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn quiet btn-sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }}
    >
      {copied ? "Copied" : label}
    </button>
  );
}

export function ReadinessChart({ points }: { points: HistoryPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  // Drawn at the real container width so labels stay readable on phones.
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    if (!box.current) return;
    const observer = new ResizeObserver(([entry]) => setW(Math.max(260, Math.round(entry.contentRect.width))));
    observer.observe(box.current);
    return () => observer.disconnect();
  }, []);
  const H = 200, L = 34, R = 14, T = 26, B = 28;
  const x = (i: number) => (points.length === 1 ? L : L + (i / (points.length - 1)) * (W - L - R));
  const y = (v: number) => T + (1 - v / 100) * (H - T - B);
  const label = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)} ${y(p.readiness)}`).join(" ");
  const shown = active ?? points.length - 1;

  return (
    <div className="chart" ref={box}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Readiness over time: ${points.map((p) => `${label(p.date)} ${p.readiness}`).join(", ")}`}
        onPointerLeave={() => setActive(null)}
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - box.left) / box.width) * W;
          let nearest = 0;
          points.forEach((_, i) => { if (Math.abs(x(i) - px) < Math.abs(x(nearest) - px)) nearest = i; });
          setActive(nearest);
        }}
      >
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#cfe5e1" />
            <text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#475569">{v}</text>
          </g>
        ))}
        <path d={path} fill="none" stroke="#0d9488" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <line x1={x(shown)} x2={x(shown)} y1={T} y2={H - B} stroke="#0b302d" strokeOpacity="0.3" />
        {points.map((p, i) => <circle key={p.date} cx={x(i)} cy={y(p.readiness)} r="4.5" fill="#0d9488" stroke="#fff" strokeWidth="2" />)}
        {points.map((p, i) => (
          <text key={p.date} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} fontSize="11" fill="#475569">{label(p.date)}</text>
        ))}
      </svg>
      <div className="chart-tip" style={{ left: `${(Math.min(Math.max(x(shown), 60), W - 60) / W) * 100}%` }}>
        {label(points[shown].date)}: {points[shown].readiness}
      </div>
    </div>
  );
}

export function CompetencyPicker({ id, name, checked }: { id: CompetencyId; name: string; checked: boolean }) {
  return (
    <label className="option" style={{ padding: 0 }}>
      <input type="checkbox" name="skill" value={id} defaultChecked={checked} />
      <span>{name}</span>
    </label>
  );
}
