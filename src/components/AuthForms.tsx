"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Failure = { error: string; field?: string };

async function send(url: string, body: unknown): Promise<Failure | null> {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (response.ok) return null;
  const data = await response.json().catch(() => ({}));
  return { error: data.error ?? "Something went wrong. Try again.", field: data.field };
}

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {hint && <span className="hint" id={`${id}-hint`}>{hint}</span>}
      {children}
      {error && <span className="field-error" id={`${id}-error`}>{error}</span>}
    </div>
  );
}

function PasswordInput({ id, autoComplete, invalid }: { id: string; autoComplete: string; invalid: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="input-wrap">
      <input id={id} name={id} type={visible ? "text" : "password"} autoComplete={autoComplete} required minLength={autoComplete === "new-password" ? 8 : undefined} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : `${id}-hint`} />
      <button type="button" className="icon-btn" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible(!visible)}>
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}

function useAuthForm(url: string) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const result = await send(url, Object.fromEntries(new FormData(event.currentTarget)));
    setBusy(false);
    setFailure(result);
    if (!result) {
      router.push("/student");
      router.refresh();
      return;
    }
    // Move focus to the field that needs fixing, so keyboard and screen reader users land on it.
    const target = result.field ? form.current?.querySelector<HTMLElement>(`[name="${result.field}"]`) : null;
    (target ?? form.current?.querySelector<HTMLElement>("[role=alert]"))?.focus();
  }

  const errorFor = (field: string) => (failure?.field === field ? failure.error : undefined);
  return { form, failure, busy, onSubmit, errorFor };
}

export function SignUpForm({ departments, roles }: { departments: string[]; roles: { id: string; title: string }[] }) {
  const { form, failure, busy, onSubmit, errorFor } = useAuthForm("/api/auth/signup");
  return (
    <form ref={form} className="auth-form" onSubmit={onSubmit} noValidate>
      {failure && !failure.field && <p className="error" role="alert" tabIndex={-1}>{failure.error}</p>}
      <Field id="name" label="Full name" error={errorFor("name")}>
        <input id="name" name="name" autoComplete="name" required aria-invalid={!!errorFor("name")} aria-describedby={errorFor("name") ? "name-error" : undefined} />
      </Field>
      <Field id="email" label="Email" error={errorFor("email")}>
        <input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!errorFor("email")} aria-describedby={errorFor("email") ? "email-error" : undefined} />
      </Field>
      <Field id="password" label="Password" hint="At least 8 characters." error={errorFor("password")}>
        <PasswordInput id="password" autoComplete="new-password" invalid={!!errorFor("password")} />
      </Field>
      <Field id="university" label="University" error={errorFor("university")}>
        <input id="university" name="university" autoComplete="organization" required aria-invalid={!!errorFor("university")} aria-describedby={errorFor("university") ? "university-error" : undefined} />
      </Field>
      <div className="form-row">
        <Field id="department" label="Department" error={errorFor("department")}>
          <select id="department" name="department" defaultValue={departments[0]}>
            {departments.map((d) => <option key={d}>{d}</option>)}
            <option>Other</option>
          </select>
        </Field>
        <Field id="targetRoleId" label="Role you are aiming for" error={errorFor("targetRoleId")}>
          <select id="targetRoleId" name="targetRoleId" defaultValue={roles[0].id}>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </Field>
      </div>
      <button className="btn btn-block" disabled={busy}>{busy ? "Creating your account" : "Create account"}</button>
      <p className="small muted">Already have an account? <Link href="/login">Sign in</Link></p>
    </form>
  );
}

export function SignInForm() {
  const { form, failure, busy, onSubmit } = useAuthForm("/api/auth/login");
  return (
    <form ref={form} className="auth-form" onSubmit={onSubmit} noValidate>
      {failure && <p className="error" role="alert" tabIndex={-1}>{failure.error}</p>}
      <Field id="email" label="Email">
        <input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field id="password" label="Password">
        <PasswordInput id="password" autoComplete="current-password" invalid={false} />
      </Field>
      <button className="btn btn-block" disabled={busy}>{busy ? "Signing in" : "Sign in"}</button>
      <p className="small muted">New to SkillProof? <Link href="/signup">Create an account</Link></p>
    </form>
  );
}

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="linkish"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
