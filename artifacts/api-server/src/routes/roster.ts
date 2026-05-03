import { Router, type IRouter } from "express";
import { nanoid } from "nanoid";
import { attachSession, requireInstructor } from "../lib/auth";
import { FILES, mutate, readJson } from "../lib/store";
import { type RosterFile, type RosterMember } from "../lib/seed";

const router: IRouter = Router();
router.use(attachSession);

router.get("/roster", async (_req, res) => {
  const roster = await readJson<RosterFile>(FILES.roster, {
    members: [],
    instructorPasscodeHash: null,
    instructorPasscodeSalt: null,
  });
  res.json(roster.members);
});

router.post("/roster", requireInstructor, async (req, res) => {
  const body = req.body as { name: string; role: "student" | "instructor" };
  if (!body.name || !body.role) {
    res.status(400).json({ error: "name and role required" });
    return;
  }
  const member: RosterMember = {
    id: nanoid(10),
    name: body.name.trim(),
    role: body.role,
    createdAt: new Date().toISOString(),
  };
  await mutate<RosterFile>(
    FILES.roster,
    { members: [], instructorPasscodeHash: null, instructorPasscodeSalt: null },
    (cur) => ({ ...cur, members: [...cur.members, member] }),
  );
  res.status(201).json(member);
});

router.delete("/roster/:id", requireInstructor, async (req, res) => {
  await mutate<RosterFile>(
    FILES.roster,
    { members: [], instructorPasscodeHash: null, instructorPasscodeSalt: null },
    (cur) => ({
      ...cur,
      members: cur.members.filter((m) => m.id !== req.params.id),
    }),
  );
  res.status(204).end();
});

export default router;
