import { Router, type IRouter } from "express";
import { nanoid } from "nanoid";
import { attachSession, requireAuth } from "../lib/auth";
import { logEvent } from "../lib/events";
import { FILES, mutate, readJson } from "../lib/store";
import type { Signal, SignalsFile, Source } from "../lib/types";

const router: IRouter = Router();
router.use(attachSession);

const EMPTY: SignalsFile = { signals: [] };

function makeSource(input: Partial<Source>): Source {
  return {
    id: nanoid(10),
    title: input.title ?? "",
    url: input.url ?? "",
    publication: input.publication ?? null,
    author: input.author ?? null,
    publishedDate: input.publishedDate ?? null,
    type: input.type ?? "other",
    credibilityNote: input.credibilityNote ?? null,
    createdAt: new Date().toISOString(),
  };
}

router.get("/signals", async (req, res) => {
  const file = await readJson<SignalsFile>(FILES.signals, EMPTY);
  const {
    q,
    category,
    novelty,
    timeHorizon,
    status,
    authorId,
    tag,
  } = req.query as Record<string, string | undefined>;
  let result = file.signals;
  if (category) result = result.filter((s) => s.category === category);
  if (novelty) result = result.filter((s) => s.novelty === novelty);
  if (timeHorizon) result = result.filter((s) => s.timeHorizon === timeHorizon);
  if (status) result = result.filter((s) => s.status === status);
  if (authorId) result = result.filter((s) => s.authorId === authorId);
  if (tag) result = result.filter((s) => s.keywords.includes(tag));
  if (q) {
    const needle = q.toLowerCase();
    result = result.filter(
      (s) =>
        s.title.toLowerCase().includes(needle) ||
        s.summary.toLowerCase().includes(needle) ||
        s.implications.toLowerCase().includes(needle) ||
        s.keywords.some((k) => k.toLowerCase().includes(needle)),
    );
  }
  result = [...result].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  res.json(result);
});

router.get("/signals/:id", async (req, res) => {
  const file = await readJson<SignalsFile>(FILES.signals, EMPTY);
  const signal = file.signals.find((s) => s.id === req.params.id);
  if (!signal) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(signal);
});

router.get("/signals/:id/related", async (req, res) => {
  const file = await readJson<SignalsFile>(FILES.signals, EMPTY);
  const signal = file.signals.find((s) => s.id === req.params.id);
  if (!signal) {
    res.json([]);
    return;
  }
  const tagSet = new Set(signal.keywords.map((k) => k.toLowerCase()));
  const scored = file.signals
    .filter((s) => s.id !== signal.id && s.status !== "archived")
    .map((s) => {
      let score = 0;
      if (s.category === signal.category) score += 2;
      if (s.timeHorizon === signal.timeHorizon) score += 1;
      const overlap = s.keywords.filter((k) =>
        tagSet.has(k.toLowerCase()),
      ).length;
      score += overlap * 2;
      return { signal: s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.signal);
  res.json(scored);
});

router.post("/signals", requireAuth, async (req, res) => {
  const body = req.body as Partial<Signal> & {
    sources?: Array<Partial<Source>>;
  };
  const now = new Date().toISOString();
  const session = req.session!;
  const wantsSubmit = body.status === "submitted";
  const sourceCount = (body.sources ?? []).filter(
    (s) => s && (s.url ?? "").trim().length > 0,
  ).length;
  if (wantsSubmit && sourceCount < 1) {
    res
      .status(400)
      .json({ error: "A submitted signal needs at least one source." });
    return;
  }
  const status = wantsSubmit ? "submitted" : "draft";
  const signal: Signal = {
    id: nanoid(10),
    title: body.title ?? "Untitled signal",
    summary: body.summary ?? "",
    category: body.category ?? "Social",
    novelty: body.novelty ?? "emerging",
    timeHorizon: body.timeHorizon ?? "2-5y",
    keywords: body.keywords ?? [],
    implications: body.implications ?? "",
    context: body.context ?? "",
    assumptions: body.assumptions ?? "",
    unknowns: body.unknowns ?? "",
    ethicsEquity: body.ethicsEquity ?? "",
    leadingIndicators: body.leadingIndicators ?? "",
    strategicResponse: body.strategicResponse ?? "",
    impactRating: body.impactRating ?? 3,
    uncertaintyRating: body.uncertaintyRating ?? 3,
    plausibilityRating: body.plausibilityRating ?? 3,
    status,
    sources: (body.sources ?? []).map(makeSource),
    authorId: session.member.id,
    authorName: session.member.name,
    createdAt: now,
    updatedAt: now,
    submittedAt: status === "submitted" ? now : null,
  };
  await mutate<SignalsFile>(FILES.signals, EMPTY, (cur) => ({
    signals: [signal, ...cur.signals],
  }));
  await logEvent({
    actorId: session.member.id,
    actorName: session.member.name,
    type: status === "submitted" ? "signal.submitted" : "signal.created",
    entityKind: "signal",
    entityId: signal.id,
    entityTitle: signal.title,
  });
  res.status(201).json(signal);
});

router.patch("/signals/:id", requireAuth, async (req, res) => {
  const body = req.body as Partial<Signal>;
  const session = req.session!;
  let updated: Signal | null = null;
  let blocked: string | null = null;
  await mutate<SignalsFile>(FILES.signals, EMPTY, (cur) => ({
    signals: cur.signals.map((s) => {
      if (s.id !== req.params.id) return s;
      if (
        s.authorId !== session.member.id &&
        session.member.role !== "instructor"
      ) {
        return s;
      }
      if (body.status === "submitted" && s.sources.length < 1) {
        blocked = "A submitted signal needs at least one source.";
        return s;
      }
      const wasSubmitted = s.status === "submitted";
      const next: Signal = {
        ...s,
        ...body,
        sources: s.sources,
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
  if (body.status && body.status !== "draft") {
    await logEvent({
      actorId: session.member.id,
      actorName: session.member.name,
      type: `signal.${body.status}`,
      entityKind: "signal",
      entityId: String(req.params.id),
      entityTitle: (updated as Signal).title,
    });
  }
  res.json(updated);
});

router.delete("/signals/:id", requireAuth, async (req, res) => {
  const session = req.session!;
  await mutate<SignalsFile>(FILES.signals, EMPTY, (cur) => ({
    signals: cur.signals.filter(
      (s) =>
        !(
          s.id === req.params.id &&
          (s.authorId === session.member.id ||
            session.member.role === "instructor")
        ),
    ),
  }));
  res.status(204).end();
});

router.post("/signals/:id/sources", requireAuth, async (req, res) => {
  const body = req.body as Partial<Source>;
  const session = req.session!;
  const newSource = makeSource(body);
  let outcome: "ok" | "not_found" | "forbidden" = "not_found";
  await mutate<SignalsFile>(FILES.signals, EMPTY, (cur) => ({
    signals: cur.signals.map((s) => {
      if (s.id !== req.params.id) return s;
      if (
        s.authorId !== session.member.id &&
        session.member.role !== "instructor"
      ) {
        outcome = "forbidden";
        return s;
      }
      outcome = "ok";
      return {
        ...s,
        sources: [...s.sources, newSource],
        updatedAt: new Date().toISOString(),
      };
    }),
  }));
  if (outcome === "not_found") {
    res.status(404).json({ error: "Signal not found" });
    return;
  }
  if (outcome === "forbidden") {
    res.status(403).json({ error: "Not your signal" });
    return;
  }
  res.status(201).json(newSource);
});

router.patch(
  "/signals/:id/sources/:sourceId",
  requireAuth,
  async (req, res) => {
    const body = req.body as Partial<Source>;
    const session = req.session!;
    let updated: Source | null = null;
    await mutate<SignalsFile>(FILES.signals, EMPTY, (cur) => ({
      signals: cur.signals.map((s) => {
        if (s.id !== req.params.id) return s;
        if (
          s.authorId !== session.member.id &&
          session.member.role !== "instructor"
        )
          return s;
        return {
          ...s,
          sources: s.sources.map((src) => {
            if (src.id !== req.params.sourceId) return src;
            const next = { ...src, ...body, id: src.id };
            updated = next;
            return next;
          }),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(updated);
  },
);

router.delete(
  "/signals/:id/sources/:sourceId",
  requireAuth,
  async (req, res) => {
    const session = req.session!;
    let blocked: string | null = null;
    await mutate<SignalsFile>(FILES.signals, EMPTY, (cur) => ({
      signals: cur.signals.map((s) => {
        if (s.id !== req.params.id) return s;
        if (
          s.authorId !== session.member.id &&
          session.member.role !== "instructor"
        )
          return s;
        const remaining = s.sources.filter(
          (src) => src.id !== req.params.sourceId,
        );
        if (s.status === "submitted" && remaining.length < 1) {
          blocked = "Cannot remove the last source from a submitted signal.";
          return s;
        }
        return {
          ...s,
          sources: remaining,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    if (blocked) {
      res.status(400).json({ error: blocked });
      return;
    }
    res.status(204).end();
  },
);

export default router;
