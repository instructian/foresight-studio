import { Router, type IRouter } from "express";
import { nanoid } from "nanoid";
import { attachSession, requireAuth } from "../lib/auth";
import { logEvent } from "../lib/events";
import { FILES, mutate, readJson } from "../lib/store";
import type { CourseConfig } from "../lib/seed";
import { PESTLE_CATEGORIES } from "../lib/seed";
import type { Trend, TrendsFile } from "../lib/types";

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

async function getTrendMin(): Promise<number> {
  const cfg = await readJson<CourseConfig>(FILES.config, DEFAULT_CONFIG);
  return Math.max(2, cfg.trendMinSignals ?? 2);
}

const router: IRouter = Router();
router.use(attachSession);

const EMPTY: TrendsFile = { trends: [] };

router.get("/trends", async (_req, res) => {
  const f = await readJson<TrendsFile>(FILES.trends, EMPTY);
  const sorted = [...f.trends].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  res.json(sorted);
});

router.get("/trends/:id", async (req, res) => {
  const f = await readJson<TrendsFile>(FILES.trends, EMPTY);
  const t = f.trends.find((x) => x.id === req.params.id);
  if (!t) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(t);
});

router.post("/trends", requireAuth, async (req, res) => {
  const body = req.body as Partial<Trend>;
  const session = req.session!;
  const trendMin = await getTrendMin();
  const supporting = body.supportingSignalIds ?? [];
  if (supporting.length < trendMin) {
    res.status(400).json({
      error: `A trend must be supported by at least ${trendMin} signals.`,
    });
    return;
  }
  const now = new Date().toISOString();
  const trend: Trend = {
    id: nanoid(10),
    title: body.title ?? "Untitled trend",
    claim: body.claim ?? "",
    rationale: body.rationale ?? "",
    category: body.category ?? "Social",
    timeHorizon: body.timeHorizon ?? "2-5y",
    confidenceRating: body.confidenceRating ?? 3,
    impactRating: body.impactRating ?? 3,
    status: "preliminary",
    supportingSignalIds: body.supportingSignalIds ?? [],
    contradictingSignalIds: body.contradictingSignalIds ?? [],
    authorId: session.member.id,
    authorName: session.member.name,
    createdAt: now,
    updatedAt: now,
  };
  await mutate<TrendsFile>(FILES.trends, EMPTY, (cur) => ({
    trends: [trend, ...cur.trends],
  }));
  await logEvent({
    actorId: session.member.id,
    actorName: session.member.name,
    type: "trend.created",
    entityKind: "trend",
    entityId: trend.id,
    entityTitle: trend.title,
  });
  res.status(201).json(trend);
});

router.patch("/trends/:id", requireAuth, async (req, res) => {
  const body = req.body as Partial<Trend>;
  const session = req.session!;
  const trendMin = await getTrendMin();
  let updated: Trend | null = null;
  let blocked: string | null = null;
  await mutate<TrendsFile>(FILES.trends, EMPTY, (cur) => ({
    trends: cur.trends.map((t) => {
      if (t.id !== req.params.id) return t;
      if (
        t.authorId !== session.member.id &&
        session.member.role !== "instructor"
      )
        return t;
      const nextSupporting =
        body.supportingSignalIds ?? t.supportingSignalIds;
      if (nextSupporting.length < trendMin) {
        blocked = `A trend must be supported by at least ${trendMin} signals.`;
        return t;
      }
      const next: Trend = {
        ...t,
        ...body,
        id: t.id,
        authorId: t.authorId,
        authorName: t.authorName,
        createdAt: t.createdAt,
        updatedAt: new Date().toISOString(),
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
  res.json(updated);
});

export default router;
