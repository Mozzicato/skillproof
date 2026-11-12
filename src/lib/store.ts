import { cookies } from "next/headers";
import { cache } from "react";
import { currentUser, type User } from "./auth";
import { kv } from "./db";
import { sampleStudent } from "./roster";
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

/** Demo copies are named `<sample id>-<8 hex>`, so the sample they came from can be recovered. */
export function sampleBase(id: string): string {
  return id.replace(/-[0-9a-f]{8}$/, "");
}

/** Only the judge demo can be reset, so nobody wipes a real account by accident. */
export async function resetDemo(): Promise<boolean> {
  if (await currentUser()) return false;
  const current = await currentWorkspace();
  const student = sampleStudent(sampleBase(current.student.id), current.student.id) ?? seedStudent(current.student.id);
  await writeWorkspace(await workspaceKey(), { student, curricula: {} });
  return true;
}

/** Lets a judge explore the product as any sample student. Accounts cannot switch. */
export async function switchDemo(sampleId: string): Promise<boolean> {
  if (await currentUser()) return false;
  const student = sampleStudent(sampleId, `${sampleId}-${shortId()}`);
  if (!student) return false;
  await writeWorkspace(await workspaceKey(), { student, curricula: (await currentWorkspace()).curricula });
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
  const sample = sampleStudent(studentId);
  if (sample) return sample;
  const entry = await kv.get<{ workspace: string }>("portfolio", studentId);
  const student = entry ? ((await kv.get<Workspace>("workspace", entry.workspace))?.student ?? null) : null;
  // A demo workspace may have switched to another sample since this id was issued.
  return student?.id === studentId ? student : null;
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

export interface Coach {
  name: string;
  token: string;
  learners: { workspace: string; joinedAt: string }[];
  createdAt: string;
}

/** The coach profile belonging to the current account or demo session, if any. */
export async function getCoach(): Promise<Coach | null> {
  return kv.get<Coach>("coach", await workspaceKey());
}

export async function createCoach(name: string): Promise<Coach> {
  const key = await workspaceKey();
  const existing = await kv.get<Coach>("coach", key);
  if (existing) return existing;
  const coach: Coach = { name: name.trim(), token: crypto.randomUUID().replaceAll("-", ""), learners: [], createdAt: new Date().toISOString() };
  await kv.set("coach", key, coach);
  await kv.set("coachjoin", coach.token, { coach: key });
  return coach;
}

/** Each learner's current record, newest joiner first. Learners whose workspace is gone are skipped. */
export async function coachLearners(coach: Coach): Promise<{ student: Student; joinedAt: string }[]> {
  const rows = await Promise.all(
    coach.learners.map(async (l) => ({ student: (await kv.get<Workspace>("workspace", l.workspace))?.student, joinedAt: l.joinedAt })),
  );
  return rows.filter((r): r is { student: Student; joinedAt: string } => Boolean(r.student)).reverse();
}

export async function openCoachInvite(token: string): Promise<{ key: string; coach: Coach } | null> {
  const entry = await kv.get<{ coach: string }>("coachjoin", token);
  const coach = entry ? await kv.get<Coach>("coach", entry.coach) : null;
  return entry && coach ? { key: entry.coach, coach } : null;
}

/** Shares the current student's progress with a coach. */
export async function joinCoach(token: string, limit: number): Promise<"joined" | "already" | "full" | "self" | "invalid"> {
  const opened = await openCoachInvite(token);
  if (!opened) return "invalid";
  const key = await workspaceKey();
  if (key === opened.key) return "self";
  if (opened.coach.learners.some((l) => l.workspace === key)) return "already";
  if (opened.coach.learners.length >= limit) return "full";
  const joinedAt = new Date().toISOString();
  await kv.set("coach", opened.key, { ...opened.coach, learners: [...opened.coach.learners, { workspace: key, joinedAt }] });
  const workspace = await currentWorkspace();
  await writeWorkspace(key, { ...workspace, student: { ...workspace.student, coach: { name: opened.coach.name, joinedAt } } });
  return "joined";
}

/** Students with their own accounts, for the employer search. */
export async function accountStudents(): Promise<Student[]> {
  return (await kv.list<Workspace>("workspace", "u:")).map((w) => w.student);
}
