import { Router, type IRouter } from "express";
import { attachSession, requireInstructor } from "../lib/auth";
import { FILES, mutate, readJson } from "../lib/store";
import {
  type CourseConfig,
  hashPasscode,
  PESTLE_CATEGORIES,
  type RosterFile,
  STEEP_CATEGORIES,
} from "../lib/seed";

const router: IRouter = Router();
router.use(attachSession);

const FALLBACK_CONFIG: CourseConfig = {
  courseTitle: "Foresight Studio",
  assignmentTitle: "Signals → Scenarios",
  assignmentDescription: "",
  dueDate: null,
  mode: "PESTLE",
  categories: PESTLE_CATEGORIES,
  archetypes: ["Continuation", "New Equilibrium", "Collapse", "Transformation"],
  timeHorizons: ["0-2y", "2-5y", "5-10y", "10-25y"],
  novelties: ["weak", "emerging", "accelerating", "plateauing", "declining"],
  signalTargetPerStudent: 12,
  scenarioMinSignals: 5,
  trendMinSignals: 3,
};

router.get("/config", async (_req, res) => {
  const config = await readJson<CourseConfig>(FILES.config, FALLBACK_CONFIG);
  res.json(config);
});

router.patch("/config", requireInstructor, async (req, res) => {
  const body = req.body as Partial<CourseConfig> & {
    instructorPasscode?: string;
  };
  const updated = await mutate<CourseConfig>(
    FILES.config,
    FALLBACK_CONFIG,
    (current) => {
      const next: CourseConfig = { ...current };
      if (body.courseTitle !== undefined) next.courseTitle = body.courseTitle;
      if (body.assignmentTitle !== undefined)
        next.assignmentTitle = body.assignmentTitle;
      if (body.assignmentDescription !== undefined)
        next.assignmentDescription = body.assignmentDescription;
      if (body.dueDate !== undefined) next.dueDate = body.dueDate;
      if (body.mode !== undefined) {
        next.mode = body.mode;
        next.categories =
          body.mode === "PESTLE" ? PESTLE_CATEGORIES : STEEP_CATEGORIES;
      }
      if (body.signalTargetPerStudent !== undefined)
        next.signalTargetPerStudent = body.signalTargetPerStudent;
      if (body.scenarioMinSignals !== undefined)
        next.scenarioMinSignals = body.scenarioMinSignals;
      if (body.trendMinSignals !== undefined)
        next.trendMinSignals = body.trendMinSignals;
      return next;
    },
  );

  if (body.instructorPasscode && body.instructorPasscode.length >= 4) {
    const { hash, salt } = hashPasscode(body.instructorPasscode);
    await mutate<RosterFile>(
      FILES.roster,
      {
        members: [],
        instructorPasscodeHash: null,
        instructorPasscodeSalt: null,
      },
      (cur) => ({
        ...cur,
        instructorPasscodeHash: hash,
        instructorPasscodeSalt: salt,
      }),
    );
  }

  res.json(updated);
});

export default router;
