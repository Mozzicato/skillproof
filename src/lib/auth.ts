import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { cache } from "react";
import { kv } from "./db";
import { AUTH_COOKIE } from "./session";

const derive = promisify(scrypt) as (password: string, salt: Buffer, length: number) => Promise<Buffer>;
const SESSION_DAYS = 30;

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

interface SessionRecord {
  userId: string;
  expiresAt: string;
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await derive(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await derive(password, Buffer.from(salt, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

/** Creates the user record. Returns null if the email is already registered. */
export async function createUser(name: string, email: string, password: string): Promise<User | null> {
  const user: User = {
    id: randomUUID(),
    email: normaliseEmail(email),
    name: name.trim(),
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  if (!(await kv.insert("email", user.email, { userId: user.id }))) return null;
  await kv.set("user", user.id, user);
  return user;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const entry = await kv.get<{ userId: string }>("email", normaliseEmail(email));
  return entry ? kv.get<User>("user", entry.userId) : null;
}

export async function startSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await kv.set("session", token, { userId, expiresAt: expiresAt.toISOString() } satisfies SessionRecord);
  (await cookies()).set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.VERCEL === "1",
    expires: expiresAt,
    path: "/",
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (token) await kv.delete("session", token);
  jar.delete(AUTH_COOKIE);
}

/** The signed-in user for this request, or null for visitors using the judge demo. */
export const currentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const session = await kv.get<SessionRecord>("session", token);
  if (!session || session.expiresAt < new Date().toISOString()) return null;
  return kv.get<User>("user", session.userId);
});
