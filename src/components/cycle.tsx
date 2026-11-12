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
  const [email, setEmail] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [statement, setStatement] = useState("");
  const [chosen, setChosen] = useState<CompetencyId[]>([]);
  const [step, setStep] = useState<"details" | "code" | "done">("details");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState<{ domain: string; work: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(fn: () => Promise<void>) {
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
  const sendCode = () =>
    run(async () => {
      const sent = await post<{ mode: "sent" | "demo"; demoCode?: string }>("/api/vouch", { token, name, email, organisation, statement, skills: chosen });
      setDemoCode(sent.demoCode ?? null);
      setCode("");
      setStep("code");
    });

  if (step === "done" && verified) {
    return (
      <p className="notice" role="status">
        Thank you. Your confirmation now appears on the student&apos;s Skill Passport, marked as verified through a {verified.work ? "work" : "personal"} email at {verified.domain}. Your full address is never shown.
      </p>
    );
  }

  if (step === "code") {
    return (
      <form className="stack" onSubmit={(e) => { e.preventDefault(); run(async () => { const r = await post<{ verified: { domain: string; work: boolean } }>("/api/vouch/confirm", { token, code }); setVerified(r.verified); setStep("done"); }); }}>
        <div className="step-head">
          <span className="step-pill">Step 2 of 2</span>
          <h2>Check your email</h2>
          <p className="muted">We sent a six-digit code to <strong>{email}</strong>. It expires in 15 minutes. Your confirmation is published only after you enter it.</p>
        </div>
        {demoCode && (
          <p className="notice"><span className="badge judge">Demo mode</span> Email sending is not switched on in this build, so your code is shown here instead: <strong>{demoCode}</strong></p>
        )}
        <label className="field" style={{ maxWidth: "14rem" }}>
          Six-digit code
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="row">
          <button className="btn" disabled={busy || code.length !== 6}>{busy ? "Checking" : "Verify and publish"}</button>
          <button type="button" className="btn quiet" disabled={busy} onClick={sendCode}>Send a new code</button>
          <button type="button" className="linkish" onClick={() => setStep("details")}>Change my details</button>
        </div>
      </form>
    );
  }

  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); sendCode(); }}>
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
      <label className="field">
        Your work email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <span className="hint">We send a code to prove it is you. The passport shows only the domain, such as the university or company, never the address.</span>
      </label>
      <label className="field">Your organisation and role<input value={organisation} onChange={(e) => setOrganisation(e.target.value)} autoComplete="organization" /></label>
      <label className="field">
        What did you see them do?
        <textarea value={statement} onChange={(e) => setStatement(e.target.value)} rows={4} placeholder="For example: I supervised their data cleaning project and asked them to explain each step." />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <div><button className="btn" disabled={busy || chosen.length === 0 || statement.trim().length < 20 || !email.includes("@")}>{busy ? "Sending code" : "Send me a code"}</button></div>
    </form>
  );
}

export function CoachSetup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="import-row"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await post("/api/coaching", { action: "create", name });
          router.refresh();
        } catch (err) {
          setError(message(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field" style={{ flex: "1 1 16rem" }}>
        Your name, as learners will see it
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="For example: Ms Adaeze Obi, careers adviser" />
      </label>
      <button className="btn" disabled={busy || name.trim().length < 2}>{busy ? "Setting up" : "Start coaching"}</button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}

export function JoinCoach({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="stack">
      <div>
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await post("/api/coaching", { action: "join", token });
              router.push("/student");
              router.refresh();
            } catch (err) {
              setError(message(err));
              setBusy(false);
            }
          }}
        >
          {busy ? "Sharing" : "Share my progress"}
        </button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
