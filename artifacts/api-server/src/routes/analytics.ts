import { Router, type IRouter } from "express";
import { attachSession, requireInstructor } from "../lib/auth";
import { listEvents } from "../lib/events";
import { FILES, readJson } from "../lib/store";
import type { CourseConfig, RosterFile, RosterMember } from "../lib/seed";
import {
  PESTLE_CATEGORIES,
} from "../lib/seed";
import type {
  CollectionsFile,
  CommentsFile,
  ScenariosFile,
  SignalsFile,
  TrendsFile,
} from "../lib/types";

const router: IRouter = Router();
router.use(attachSession);

const EMPTY_SIGNALS: SignalsFile = { signals: [] };
const EMPTY_TRENDS: TrendsFile = { trends: [] };
const EMPTY_COLLS: CollectionsFile = { collections: [] };
const EMPTY_SCENS: ScenariosFile = { scenarios: [] };
const EMPTY_COMMENTS: CommentsFile = { comments: [] };

async function loadAll() {
  const [signals, trends, collections, scenarios, comments, roster, config, events] =
    await Promise.all([
      readJson<SignalsFile>(FILES.signals, EMPTY_SIGNALS),
      readJson<TrendsFile>(FILES.trends, EMPTY_TRENDS),
      readJson<CollectionsFile>(FILES.collections, EMPTY_COLLS),
      readJson<ScenariosFile>(FILES.scenarios, EMPTY_SCENS),
      readJson<CommentsFile>(FILES.comments, EMPTY_COMMENTS),
      readJson<RosterFile>(FILES.roster, {
        members: [],
        instructorPasscodeHash: null,
        instructorPasscodeSalt: null,
      }),
      readJson<CourseConfig>(FILES.config, {
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
      }),
      listEvents(),
    ]);
  return { signals, trends, collections, scenarios, comments, roster, config, events };
}

function studentParticipation(
  student: RosterMember,
  data: Awaited<ReturnType<typeof loadAll>>,
) {
  const sig = data.signals.signals.filter((s) => s.authorId === student.id);
  const trends = data.trends.trends.filter((t) => t.authorId === student.id);
  const colls = data.collections.collections.filter(
    (c) => c.ownerId === student.id,
  );
  const scens = data.scenarios.scenarios.filter(
    (s) => s.authorId === student.id,
  );
  const comments = data.comments.comments.filter(
    (c) => c.authorId === student.id,
  );
  const events = data.events.filter((e) => e.actorId === student.id);
  const lastActiveAt = events.length
    ? events.reduce(
        (max, e) => (e.createdAt > max ? e.createdAt : max),
        events[0]!.createdAt,
      )
    : null;
  const submittedSig = sig.filter((s) => s.status === "submitted").length;
  const draftSig = sig.filter((s) => s.status === "draft").length;
  const target = data.config.signalTargetPerStudent;
  const atRisk = submittedSig < Math.ceil(target * 0.5);
  return {
    studentId: student.id,
    studentName: student.name,
    signalsTotal: sig.length,
    signalsSubmitted: submittedSig,
    signalsDraft: draftSig,
    trendsCount: trends.length,
    collectionsCount: colls.length,
    scenariosCount: scens.length,
    scenariosSubmitted: scens.filter((s) => s.status === "submitted").length,
    commentsCount: comments.length,
    lastActiveAt,
    atRisk,
  };
}

router.get("/analytics/participation", requireInstructor, async (_req, res) => {
  const data = await loadAll();
  const students = data.roster.members.filter((m) => m.role === "student");
  res.json(students.map((s) => studentParticipation(s, data)));
});

router.get("/analytics/category-coverage", requireInstructor, async (_req, res) => {
  const data = await loadAll();
  const students = data.roster.members.filter((m) => m.role === "student");
  const categories = data.config.categories;
  const result = students.map((s) => {
    const sigs = data.signals.signals.filter((x) => x.authorId === s.id);
    const counts: Record<string, number> = {};
    for (const c of categories) counts[c] = 0;
    for (const sig of sigs) {
      counts[sig.category] = (counts[sig.category] ?? 0) + 1;
    }
    return {
      studentId: s.id,
      studentName: s.name,
      counts,
      total: sigs.length,
    };
  });
  res.json(result);
});

router.get("/analytics/dashboard-summary", requireInstructor, async (_req, res) => {
  const data = await loadAll();
  const students = data.roster.members.filter((m) => m.role === "student");
  const submittedSignals = data.signals.signals.filter(
    (s) => s.status === "submitted",
  ).length;
  const submittedScenarios = data.scenarios.scenarios.filter(
    (s) => s.status === "submitted",
  ).length;
  const participations = students.map((s) => studentParticipation(s, data));
  const activeStudents = participations.filter(
    (p) => p.signalsTotal > 0,
  ).length;
  const atRiskStudents = participations.filter((p) => p.atRisk).length;
  const averageSignalsPerStudent = students.length
    ? data.signals.signals.length / students.length
    : 0;
  const categoryDistribution: Record<string, number> = {};
  for (const c of data.config.categories) categoryDistribution[c] = 0;
  for (const s of data.signals.signals) {
    categoryDistribution[s.category] =
      (categoryDistribution[s.category] ?? 0) + 1;
  }
  res.json({
    totalSignals: data.signals.signals.length,
    submittedSignals,
    totalTrends: data.trends.trends.length,
    totalCollections: data.collections.collections.length,
    totalScenarios: data.scenarios.scenarios.length,
    submittedScenarios,
    activeStudents,
    atRiskStudents,
    averageSignalsPerStudent: Math.round(averageSignalsPerStudent * 10) / 10,
    categoryDistribution,
  });
});

router.get("/analytics/student/:id", requireInstructor, async (req, res) => {
  const data = await loadAll();
  const student = data.roster.members.find((m) => m.id === req.params.id);
  if (!student) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const signals = data.signals.signals.filter(
    (s) => s.authorId === student.id,
  );
  const trends = data.trends.trends.filter((t) => t.authorId === student.id);
  const collections = data.collections.collections.filter(
    (c) => c.ownerId === student.id,
  );
  const scenarios = data.scenarios.scenarios.filter(
    (s) => s.authorId === student.id,
  );
  const timeline = data.events
    .filter((e) => e.actorId === student.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 100);
  res.json({
    student,
    participation: studentParticipation(student, data),
    signals,
    trends,
    collections,
    scenarios,
    timeline,
  });
});

router.get("/analytics/recent-activity", requireInstructor, async (req, res) => {
  const limitRaw = req.query.limit as string | undefined;
  const limit = Math.min(
    Math.max(parseInt(limitRaw ?? "30", 10) || 30, 1),
    200,
  );
  const events = await listEvents();
  const sorted = [...events]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);
  res.json(sorted);
});

export default router;
