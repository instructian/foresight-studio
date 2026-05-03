import type { NextFunction, Request, Response } from "express";
import { nanoid } from "nanoid";
import { FILES, mutate, readJson } from "./store";
import type { RosterFile, RosterMember } from "./seed";

export interface SessionsFile {
  sessions: Record<string, { userId: string; createdAt: string }>;
}

const SESSION_COOKIE = "foresight_sid";
const COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export interface SessionUserContext {
  member: RosterMember;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      session?: SessionUserContext;
    }
  }
}

async function getSessionUser(sid: string): Promise<RosterMember | null> {
  const sessions = await readJson<SessionsFile>(FILES.sessions, {
    sessions: {},
  });
  const entry = sessions.sessions[sid];
  if (!entry) return null;
  const roster = await readJson<RosterFile>(FILES.roster, {
    members: [],
    instructorPasscodeHash: null,
    instructorPasscodeSalt: null,
  });
  return roster.members.find((m) => m.id === entry.userId) ?? null;
}

export async function createSession(userId: string): Promise<string> {
  const sid = nanoid(24);
  await mutate<SessionsFile>(FILES.sessions, { sessions: {} }, (current) => ({
    sessions: {
      ...current.sessions,
      [sid]: { userId, createdAt: new Date().toISOString() },
    },
  }));
  return sid;
}

export async function destroySession(sid: string): Promise<void> {
  await mutate<SessionsFile>(FILES.sessions, { sessions: {} }, (current) => {
    const next = { ...current.sessions };
    delete next[sid];
    return { sessions: next };
  });
}

export function setSessionCookie(res: Response, sid: string): void {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export function getSidFromReq(req: Request): string | null {
  const cookies = (req as unknown as { cookies?: Record<string, string> })
    .cookies;
  return cookies?.[SESSION_COOKIE] ?? null;
}

export async function attachSession(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const sid = getSidFromReq(req);
  if (sid) {
    const member = await getSessionUser(sid);
    if (member) {
      req.session = { member };
    }
  }
  next();
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.session) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  next();
}

export function requireInstructor(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.session) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (req.session.member.role !== "instructor") {
    res.status(403).json({ error: "Instructor access only" });
    return;
  }
  next();
}
