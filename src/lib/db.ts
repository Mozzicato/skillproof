import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

/** A small key-value store: Postgres on Vercel, a JSON file on a laptop without a database. */
export interface Kv {
  get<T>(ns: string, key: string): Promise<T | null>;
  set(ns: string, key: string, value: unknown): Promise<void>;
  /** Inserts only if the key is free. Returns false when it already exists. */
  insert(ns: string, key: string, value: unknown): Promise<boolean>;
  delete(ns: string, key: string): Promise<void>;
  list<T>(ns: string, prefix: string, limit?: number): Promise<T[]>;
}

function postgres(url: string): Kv {
  const sql = neon(url);
  let ready: Promise<unknown> | undefined;
  const table = () =>
    (ready ??= sql`CREATE TABLE IF NOT EXISTS kv (
      ns text NOT NULL,
      key text NOT NULL,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (ns, key)
    )`);

  return {
    async get(ns, key) {
      await table();
      const rows = await sql`SELECT value FROM kv WHERE ns = ${ns} AND key = ${key}`;
      return rows.length > 0 ? rows[0].value : null;
    },
    async set(ns, key, value) {
      await table();
      await sql`INSERT INTO kv (ns, key, value) VALUES (${ns}, ${key}, ${JSON.stringify(value)}::jsonb)
        ON CONFLICT (ns, key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
    },
    async insert(ns, key, value) {
      await table();
      const rows = await sql`INSERT INTO kv (ns, key, value) VALUES (${ns}, ${key}, ${JSON.stringify(value)}::jsonb)
        ON CONFLICT (ns, key) DO NOTHING RETURNING key`;
      return rows.length > 0;
    },
    async delete(ns, key) {
      await table();
      await sql`DELETE FROM kv WHERE ns = ${ns} AND key = ${key}`;
    },
    async list(ns, prefix, limit = 200) {
      await table();
      const rows = await sql`SELECT value FROM kv WHERE ns = ${ns} AND key LIKE ${`${prefix}%`}
        ORDER BY updated_at DESC LIMIT ${limit}`;
      return rows.map((r) => r.value);
    },
  };
}

function file(): Kv {
  const location = path.join(process.cwd(), ".data", "kv.json");
  const holder = globalThis as unknown as { skillproofKv?: Record<string, unknown> };
  const all = () => {
    if (!holder.skillproofKv) {
      try {
        holder.skillproofKv = JSON.parse(fs.readFileSync(location, "utf8")) as Record<string, unknown>;
      } catch {
        holder.skillproofKv = {};
      }
    }
    return holder.skillproofKv;
  };
  const flush = () => {
    fs.mkdirSync(path.dirname(location), { recursive: true });
    fs.writeFileSync(location, JSON.stringify(all(), null, 2));
  };
  const id = (ns: string, key: string) => `${ns}\u0000${key}`;
  return {
    async get(ns, key) {
      return (all()[id(ns, key)] ?? null) as never;
    },
    async set(ns, key, value) {
      all()[id(ns, key)] = value;
      flush();
    },
    async insert(ns, key, value) {
      if (id(ns, key) in all()) return false;
      all()[id(ns, key)] = value;
      flush();
      return true;
    },
    async delete(ns, key) {
      delete all()[id(ns, key)];
      flush();
    },
    async list(ns, prefix, limit = 200) {
      const start = id(ns, prefix);
      return Object.entries(all()).filter(([k]) => k.startsWith(start)).slice(0, limit).map(([, v]) => v) as never;
    },
  };
}

export const kv: Kv = process.env.DATABASE_URL ? postgres(process.env.DATABASE_URL) : file();
