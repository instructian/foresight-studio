import { Router, type IRouter } from "express";
import { nanoid } from "nanoid";
import { attachSession, requireAuth } from "../lib/auth";
import { logEvent } from "../lib/events";
import { FILES, mutate, readJson } from "../lib/store";
import type { CourseConfig } from "../lib/seed";
import { PESTLE_CATEGORIES } from "../lib/seed";
import type { Scenario, ScenariosFile } from "../lib/types";

const DEFAULT_CONFIG: CourseConfig = {
  courseTitle: "",
  assignmentTitle: "",
  assignmentDescription: "",
  dueDate: null,
  mode: "PESTLE",
  categories: PESTLE_CATEGORIES,
  archetypes: [],
  timeHorizons: [],
  novelties: [],
  signalTargetPerStudent: 12,
  scenarioMinSignals: 5,
  trendMinSignals: 3,
};

const router: IRouter = Router();
router.use(attachSession);

const EMPTY: ScenariosFile = { scenarios: [] };

router.get("/scenarios", async (_req, res) => {
  const f = await readJson<ScenariosFile>(FILES.scenarios, EMPTY);
  const sorted = [...f.scenarios].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  res.json(sorted);
});

router.get("/scenarios/:id", async (req, res) => {
  const f = await readJson<ScenariosFile>(FILES.scenarios, EMPTY);
  const s = f.scenarios.find((x) => x.id === req.params.id);
  if (!s) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(s);
});

router.post("/scenarios", requireAuth, async (req, res) => {
  const body = req.body as Partial<Scenario>;
  const session = req.session!;
  const now = new Date().toISOString();
  const scenario: Scenario = {
    id: nanoid(10),
    title: body.title ?? "Untitled scenario",
    timeHorizon: "5-10y",
    archetype: "Continuation",
    environmentDescription: "",
    vignette: "",
    signalIds: [],
    signalAnnotations: [],
    problemStatements: [],
    personas: [],
    journeys: [],
    currentStep: 0,
    status: "draft",
    collectionId: body.collectionId ?? null,
    authorId: session.member.id,
    authorName: session.member.name,
    createdAt: now,
    updatedAt: now,
    submittedAt: null,
  };
  await mutate<ScenariosFile>(FILES.scenarios, EMPTY, (cur) => ({
    scenarios: [scenario, ...cur.scenarios],
  }));
  await logEvent({
    actorId: session.member.id,
    actorName: session.member.name,
    type: "scenario.created",
    entityKind: "scenario",
    entityId: scenario.id,
    entityTitle: scenario.title,
  });
  res.status(201).json(scenario);
});

router.patch("/scenarios/:id", requireAuth, async (req, res) => {
  const body = req.body as Partial<Scenario>;
  const session = req.session!;
  const cfg = await readJson<CourseConfig>(FILES.config, DEFAULT_CONFIG);
  const scenarioMin = Math.max(1, cfg.scenarioMinSignals ?? 5);
  let updated: Scenario | null = null;
  let blocked: string | null = null;
  await mutate<ScenariosFile>(FILES.scenarios, EMPTY, (cur) => ({
    scenarios: cur.scenarios.map((s) => {
      if (s.id !== req.params.id) return s;
      if (
        s.authorId !== session.member.id &&
        session.member.role !== "instructor"
      )
        return s;
      const nextSignalIds = body.signalIds ?? s.signalIds;
      const willBeSubmitted =
        body.status === "submitted" ||
        (body.status === undefined && s.status === "submitted");
      if (willBeSubmitted && nextSignalIds.length < scenarioMin) {
        blocked = `A submitted scenario needs at least ${scenarioMin} signals.`;
        return s;
      }
      const wasSubmitted = s.status === "submitted";
      const next: Scenario = {
        ...s,
        ...body,
        id: s.id,
        authorId: s.authorId,
        authorName: s.authorName,
        createdAt: s.createdAt,
        updatedAt: new Date().toISOString(),
        submittedAt:
          body.status === "submitted" && !wasSubmitted
            ? new Date().toISOString()
            : s.submittedAt,
      };
      updated = next;
      return next;
    }),
  }));
  if (blocked) {
    res.status(400).json({ error: blocked });
    return;
  }
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (body.status === "submitted") {
    await logEvent({
      actorId: session.member.id,
      actorName: session.member.name,
      type: "scenario.submitted",
      entityKind: "scenario",
      entityId: String(req.params.id),
      entityTitle: (updated as Scenario).title,
    });
  }
  res.json(updated);
});

export default router;
