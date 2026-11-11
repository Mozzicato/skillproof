"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CopyText, message, post } from "@/components/client";
import type { CompetencyId, EndorserRole } from "@/lib/types";

export function StartSprint({ label = "Start the sprint" }: { label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="stack" style={{ gap: "0.4rem" }}>
      <div>
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await post("/api/sprint", { action: "start" });
              router.push("/student/plan");
              router.refresh();
            } catch (err) {
              setError(message(err));
              setBusy(false);
            }
          }}
        >
          {busy ? "Starting" : label}
        </button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}

export function StopSprint() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="linkish"
      onClick={async () => {
        await post("/api/sprint", { action: "stop" });
        router.refresh();
      }}
    >
      Stop this sprint
    </button>
  );
}

export function InviteLink() {
  const [role, setRole] = useState<EndorserRole>("Lecturer");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="stack">
      <div className="import-row">
        <label className="field" style={{ flex: "1 1 14rem" }}>
          Who are you asking?
          <select value={role} onChange={(e) => { setRole(e.target.value as EndorserRole); setUrl(""); }}>
            <option value="Lecturer">A lecturer who has seen my work</option>
            <option value="Mentor">A mentor or supervisor</option>
            <option value="Employer">An interviewer or employer</option>
          </select>
        </label>
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const { path } = await post<{ path: string }>("/api/invite", { role });
              setUrl(`${window.location.origin}${path}`);
            } catch (err) {
              setError(message(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Creating" : "Create a private link"}
        </button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {url && (
        <div className="stack" style={{ gap: "0.4rem" }}>
          <code className="excerpt" style={{ wordBreak: "break-all" }}>{url}</code>
          <div className="row"><CopyText text={url} label="Copy link" /><span className="small muted">The link works once. Send it to them directly.</span></div>
        </div>
      )}
    </div>
  );
}

export function VouchForm({ token, skills }: { token: string; skills: { id: CompetencyId; name: string; score: number }[] }) {
  const [name, setName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [statement, setStatement] = useState("");
  const [chosen, setChosen] = useState<CompetencyId[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  if (done) {
    return <p className="notice" role="status">Thank you. Your confirmation now appears on the student&apos;s Skill Passport with your name and organisation.</p>;
  }
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await post("/api/vouch", { token, name, organisation, statement, skills: chosen });
          setDone(true);
        } catch (err) {
          setError(message(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <fieldset className="plain-fieldset stack" style={{ gap: "0.4rem" }}>
        <legend>Which skills have you seen this student use?</legend>
        {skills.map((s) => (
          <label key={s.id} className="answer" style={{ marginTop: 0 }}>
            <input type="checkbox" checked={chosen.includes(s.id)} onChange={(e) => setChosen(e.target.checked ? [...chosen, s.id] : chosen.filter((c) => c !== s.id))} />
            <span>{s.name} <span className="muted small">evidenced at {s.score}</span></span>
          </label>
        ))}
      </fieldset>
      <label className="field">Your name<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
      <label className="field">Your organisation and role<input value={organisation} onChange={(e) => setOrganisation(e.target.value)} autoComplete="organization" /></label>
      <label className="field">
        What did you see them do?
        <textarea value={statement} onChange={(e) => setStatement(e.target.value)} rows={4} placeholder="For example: I supervised their data cleaning project and asked them to explain each step." />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <div><button className="btn" disabled={busy || chosen.length === 0 || statement.trim().length < 20}>{busy ? "Saving" : "Confirm these skills"}</button></div>
    </form>
  );
}
