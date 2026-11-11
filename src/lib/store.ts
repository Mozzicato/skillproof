import { cookies } from "next/headers";
import { cache } from "react";
import { currentUser, type User } from "./auth";
import { kv } from "./db";
import { DEMO_STUDENT_ID, seedStudent } from "./seed";
import { SESSION_COOKIE } from "./session";
import type { Curricula, Endorsement, EndorserRole, Student } from "./types";

interface Workspace {
  student: Student;
  curricula: Curricula;
}

export interface Viewer {
  mode: "account" | "demo";
  user: User | null;
}

function shortId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "student";
}

/** Signed-in people use their account's workspace. Everyone else gets a private copy of the judge demo. */
const workspaceKey = cache(async (): Promise<string> => {
  const user = await currentUser();
  if (user) return `u:${user.id}`;
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!session) throw new Error("No session cookie on this request.");
  return `d:${session}`;
});

async function writeWorkspace(key: string, workspace: Workspace): Promise<void> {
  await kv.set("workspace", key, workspace);
  await kv.set("portfolio", workspace.student.id, { workspace: key });
}

const currentWorkspace = cache(async (): Promise<Workspace> => {
  const key = await workspaceKey();
  const existing = await kv.get<Workspace>("workspace", key);
  if (existing) return existing;
  const created: Workspace = { student: seedStudent(`${DEMO_STUDENT_ID}-${shortId()}`), curricula: {} };
  await writeWorkspace(key, created);
  return created;
});

export async function getViewer(): Promise<Viewer> {
  const user = await currentUser();
  return { mode: user ? "account" : "demo", user };
}

export async function getStudent(): Promise<Student> {
  return (await currentWorkspace()).student;
}

export async function getCurricula(): Promise<Curricula> {
  return (await currentWorkspace()).curricula;
}

export async function saveStudent(student: Student): Promise<void> {
  await writeWorkspace(await workspaceKey(), { ...(await currentWorkspace()), student });
}

export async function saveCurriculum(department: string, topics: Curricula[string]): Promise<void> {
  const current = await currentWorkspace();
  await writeWorkspace(await workspaceKey(), { ...current, curricula: { ...current.curricula, [department]: topics } });
}

/** Only the judge demo can be reset, so nobody wipes a real account by accident. */
export async function resetDemo(): Promise<boolean> {
  if (await currentUser()) return false;
  const current = await currentWorkspace();
  await writeWorkspace(await workspaceKey(), { student: seedStudent(current.student.id), curricula: {} });
  return true;
}

/** A new account starts with no evidence at all. */
export async function createAccountWorkspace(userId: string, details: { name: string; department: string; university: string; targetRoleId: string }): Promise<void> {
  await writeWorkspace(`u:${userId}`, {
    curricula: {},
    student: {
      id: `${slug(details.name)}-${shortId()}`,
      name: details.name.trim(),
      department: details.department,
      university: details.university.trim(),
      targetRoleId: details.targetRoleId,
      claims: [],
      evidence: [],
      evaluations: [],
      cvFeedback: null,
    },
  });
}

/** Public portfolios are looked up by student id, which is separate from the private session. */
export async function findStudent(studentId: string): Promise<Student | null> {
  if (studentId === DEMO_STUDENT_ID) return seedStudent();
  const entry = await kv.get<{ workspace: string }>("portfolio", studentId);
  return entry ? ((await kv.get<Workspace>("workspace", entry.workspace))?.student ?? null) : null;
}

export interface Invite {
  workspace: string;
  role: EndorserRole;
  createdAt: string;
  usedAt?: string;
}

/** A private link the student gives to a lecturer, mentor or interviewer so they can vouch for skills. */
export async function createInvite(role: EndorserRole): Promise<string> {
  const token = crypto.randomUUID().replaceAll("-", "");
  await kv.set("invite", token, { workspace: await workspaceKey(), role, createdAt: new Date().toISOString() } satisfies Invite);
  return token;
}

export async function openInvite(token: string): Promise<{ invite: Invite; student: Student } | null> {
  const invite = await kv.get<Invite>("invite", token);
  if (!invite) return null;
  const workspace = await kv.get<Workspace>("workspace", invite.workspace);
  return workspace ? { invite, student: workspace.student } : null;
}

/** Each link can be used once. Returns false if the link is unknown or already used. */
export async function addEndorsements(token: string, endorsements: Endorsement[]): Promise<boolean> {
  const opened = await openInvite(token);
  if (!opened || opened.invite.usedAt) return false;
  const workspace = (await kv.get<Workspace>("workspace", opened.invite.workspace))!;
  const student = { ...workspace.student, endorsements: [...(workspace.student.endorsements ?? []), ...endorsements] };
  await writeWorkspace(opened.invite.workspace, { ...workspace, student });
  await kv.set("invite", token, { ...opened.invite, usedAt: new Date().toISOString() });
  return true;
}

/** Students with their own accounts, for the employer search. */
export async function accountStudents(): Promise<Student[]> {
  return (await kv.list<Workspace>("workspace", "u:")).map((w) => w.student);
}
