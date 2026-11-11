import fs from "node:fs";
import path from "node:path";
import { seedStudent } from "./seed";
import type { Curricula, Student } from "./types";

const FILE = path.join(process.cwd(), ".data", "store.json");

interface AppData {
  student: Student;
  curricula: Curricula;
}

// Next.js can load this module more than once in development, so the copy lives on globalThis.
const holder = globalThis as unknown as { skillproofData?: AppData };

function data(): AppData {
  if (holder.skillproofData) return holder.skillproofData;
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, "utf8")) as Partial<AppData>;
    if (parsed.student) {
      holder.skillproofData = { student: parsed.student, curricula: parsed.curricula ?? {} };
      return holder.skillproofData;
    }
  } catch {
    // No saved data yet, so fall through to the sample data.
  }
  holder.skillproofData = { student: seedStudent(), curricula: {} };
  return holder.skillproofData;
}

function write(next: AppData): void {
  holder.skillproofData = next;
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(next, null, 2));
  } catch (error) {
    // Read-only hosts keep the data in memory for the life of the server.
    console.warn("Could not write data to disk:", error);
  }
}

export function getStudent(): Student {
  return data().student;
}

export function saveStudent(student: Student): void {
  write({ ...data(), student });
}

export function getCurricula(): Curricula {
  return data().curricula;
}

export function saveCurriculum(department: string, topics: Curricula[string]): void {
  const current = data();
  write({ ...current, curricula: { ...current.curricula, [department]: topics } });
}

export function resetStudent(): void {
  write({ student: seedStudent(), curricula: {} });
}
