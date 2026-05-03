import { Router, type IRouter } from "express";
import { nanoid } from "nanoid";
import {
  attachSession,
  clearSessionCookie,
  createSession,
  destroySession,
  getSidFromReq,
  setSessionCookie,
} from "../lib/auth";
import { FILES, mutate, readJson } from "../lib/store";
import {
  type RosterFile,
  type RosterMember,
  verifyPasscode,
} from "../lib/seed";

const router: IRouter = Router();

router.use(attachSession);

router.get("/auth/me", (req, res) => {
  if (!req.session) {
    res.json({ id: null, name: null, role: null, signedIn: false });
    return;
  }
  const m = req.session.member;
  res.json({ id: m.id, name: m.name, role: m.role, signedIn: true });
});

router.post("/auth/pick-name", async (req, res) => {
  const body = req.body as { rosterId?: string | null; newName?: string | null };
  let member: RosterMember | undefined;
  if (body.rosterId) {
    const roster = await readJson<RosterFile>(FILES.roster, {
      members: [],
      instructorPasscodeHash: null,
      instructorPasscodeSalt: null,
    });
    member = roster.members.find((m) => m.id === body.rosterId);
    if (!member) {
      res.status(400).json({ error: "Roster entry not found" });
      return;
    }
    if (member.role === "instructor") {
      res
        .status(400)
        .json({ error: "Use instructor login for instructor accounts" });
      return;
    }
  } else if (body.newName && body.newName.trim().length > 0) {
    const name = body.newName.trim();
    member = {
      id: nanoid(10),
      name,
      role: "student",
      createdAt: new Date().toISOString(),
    };
    const created = member;
    await mutate<RosterFile>(
      FILES.roster,
      {
        members: [],
        instructorPasscodeHash: null,
        instructorPasscodeSalt: null,
      },
      (current) => ({
        ...current,
        members: [...current.members, created],
      }),
    );
  } else {
    res.status(400).json({ error: "rosterId or newName required" });
    return;
  }

  const sid = await createSession(member.id);
  setSessionCookie(res, sid);
  res.json({
    id: member.id,
    name: member.name,
    role: member.role,
    signedIn: true,
  });
});

router.post("/auth/instructor-login", async (req, res) => {
  const body = req.body as { passcode?: string };
  if (!body.passcode) {
    res.status(400).json({ error: "Passcode required" });
    return;
  }
  const roster = await readJson<RosterFile>(FILES.roster, {
    members: [],
    instructorPasscodeHash: null,
    instructorPasscodeSalt: null,
  });
  if (!roster.instructorPasscodeHash || !roster.instructorPasscodeSalt) {
    res.status(401).json({ error: "Instructor login not configured" });
    return;
  }
  const ok = verifyPasscode(
    body.passcode,
    roster.instructorPasscodeHash,
    roster.instructorPasscodeSalt,
  );
  if (!ok) {
    res.status(401).json({ error: "Invalid passcode" });
    return;
  }
  const instructor = roster.members.find((m) => m.role === "instructor");
  if (!instructor) {
    res.status(401).json({ error: "No instructor in roster" });
    return;
  }
  const sid = await createSession(instructor.id);
  setSessionCookie(res, sid);
  res.json({
    id: instructor.id,
    name: instructor.name,
    role: instructor.role,
    signedIn: true,
  });
});

router.post("/auth/logout", async (req, res) => {
  const sid = getSidFromReq(req);
  if (sid) await destroySession(sid);
  clearSessionCookie(res);
  res.status(204).end();
});

export default router;
