import { Router, type IRouter } from "express";
import { format } from "@fast-csv/format";
import { attachSession, requireInstructor } from "../lib/auth";
import { listEvents } from "../lib/events";
import { FILES, readJson } from "../lib/store";
import type { CourseConfig, RosterFile, RosterMember } from "../lib/seed";
import { PESTLE_CATEGORIES } from "../lib/seed";
import type { ScenariosFile, SignalsFile, TrendsFile, CollectionsFile, CommentsFile } from "../lib/types";

const router: IRouter = Router();
router.use(attachSession);

router.get("/export/signals.csv", requireInstructor, async (_req, res) => {
  const f = await readJson<SignalsFile>(FILES.signals, { signals: [] });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="signals.csv"',
  );
  const csv = format({ headers: true });
  csv.pipe(res);
  for (const s of f.signals) {
    csv.write({
      id: s.id,
      title: s.title,
      summary: s.summary,
      category: s.category,
      novelty: s.novelty,
      timeHorizon: s.timeHorizon,
      keywords: s.keywords.join("; "),
      implications: s.implications,
      impactRating: s.impactRating,
      uncertaintyRating: s.uncertaintyRating,
      plausibilityRating: s.plausibilityRating,
      status: s.status,
      sourceCount: s.sources.length,
      sourceUrls: s.sources.map((src) => src.url).join(" | "),
      authorName: s.authorName,
      createdAt: s.createdAt,
      submittedAt: s.submittedAt ?? "",
    });
  }
  csv.end();
});

router.get("/export/signals.json", requireInstructor, async (_req, res) => {
  const f = await readJson<SignalsFile>(FILES.signals, { signals: [] });
  res.json(f.signals);
});

router.get("/export/participation.csv", requireInstructor, async (_req, res) => {
  const [signalsF, trendsF, collsF, scensF, commentsF, roster, config, events] =
    await Promise.all([
      readJson<SignalsFile>(FILES.signals, { signals: [] }),
      readJson<TrendsFile>(FILES.trends, { trends: [] }),
      readJson<CollectionsFile>(FILES.collections, { collections: [] }),
      readJson<ScenariosFile>(FILES.scenarios, { scenarios: [] }),
      readJson<CommentsFile>(FILES.comments, { comments: [] }),
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

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="participation.csv"',
  );
  const csv = format({ headers: true });
  csv.pipe(res);
  const students = roster.members.filter(
    (m: RosterMember) => m.role === "student",
  );
  for (const s of students) {
    const sig = signalsF.signals.filter((x) => x.authorId === s.id);
    const submitted = sig.filter((x) => x.status === "submitted").length;
    const trends = trendsF.trends.filter((x) => x.authorId === s.id).length;
    const colls = collsF.collections.filter((x) => x.ownerId === s.id).length;
    const scens = scensF.scenarios.filter((x) => x.authorId === s.id);
    const comments = commentsF.comments.filter(
      (x) => x.authorId === s.id,
    ).length;
    const studentEvents = events.filter((e) => e.actorId === s.id);
    const lastActive = studentEvents.length
      ? studentEvents.reduce(
          (max, e) => (e.createdAt > max ? e.createdAt : max),
          studentEvents[0]!.createdAt,
        )
      : "";
    csv.write({
      studentId: s.id,
      studentName: s.name,
      signalsTotal: sig.length,
      signalsSubmitted: submitted,
      signalsDraft: sig.length - submitted,
      target: config.signalTargetPerStudent,
      trends,
      collections: colls,
      scenarios: scens.length,
      scenariosSubmitted: scens.filter((x) => x.status === "submitted").length,
      comments,
      lastActiveAt: lastActive,
      atRisk: submitted < Math.ceil(config.signalTargetPerStudent * 0.5),
    });
  }
  csv.end();
});

export default router;
