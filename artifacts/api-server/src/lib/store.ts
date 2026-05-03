import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(process.cwd(), "data");

const queues: Map<string, Promise<unknown>> = new Map();

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readJson<T>(name: string, fallback: T): Promise<T> {
  await ensureDir();
  const file = path.join(DATA_DIR, name);
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return fallback;
    }
    throw err;
  }
}

export async function writeJson<T>(name: string, data: T): Promise<void> {
  await ensureDir();
  const previous = queues.get(name) ?? Promise.resolve();
  const next = previous.then(async () => {
    const file = path.join(DATA_DIR, name);
    const tmp = `${file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await fs.rename(tmp, file);
  });
  queues.set(
    name,
    next.catch(() => undefined),
  );
  await next;
}

export async function mutate<T>(
  name: string,
  fallback: T,
  fn: (current: T) => T | Promise<T>,
): Promise<T> {
  const previous = queues.get(name) ?? Promise.resolve();
  let result!: T;
  const next = previous.then(async () => {
    const current = await readJson<T>(name, fallback);
    const updated = await fn(current);
    await ensureDir();
    const file = path.join(DATA_DIR, name);
    const tmp = `${file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(updated, null, 2), "utf8");
    await fs.rename(tmp, file);
    result = updated;
  });
  queues.set(
    name,
    next.catch(() => undefined),
  );
  await next;
  return result;
}

export async function appendJsonl(name: string, entry: unknown): Promise<void> {
  await ensureDir();
  const previous = queues.get(name) ?? Promise.resolve();
  const next = previous.then(async () => {
    const file = path.join(DATA_DIR, name);
    await fs.appendFile(file, `${JSON.stringify(entry)}\n`, "utf8");
  });
  queues.set(
    name,
    next.catch(() => undefined),
  );
  await next;
}

export async function readJsonl<T>(name: string): Promise<T[]> {
  await ensureDir();
  const file = path.join(DATA_DIR, name);
  try {
    const raw = await fs.readFile(file, "utf8");
    return raw
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as T);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

export const FILES = {
  roster: "roster.json",
  config: "config.json",
  signals: "signals.json",
  trends: "trends.json",
  collections: "collections.json",
  scenarios: "scenarios.json",
  comments: "comments.json",
  sessions: "sessions.json",
  events: "events.jsonl",
} as const;
