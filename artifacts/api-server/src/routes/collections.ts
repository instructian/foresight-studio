import { Router, type IRouter } from "express";
import { nanoid } from "nanoid";
import { attachSession, requireAuth } from "../lib/auth";
import { logEvent } from "../lib/events";
import { FILES, mutate, readJson } from "../lib/store";
import type { Collection, CollectionItem, CollectionsFile } from "../lib/types";

const router: IRouter = Router();
router.use(attachSession);

const EMPTY: CollectionsFile = { collections: [] };

router.get("/collections", async (req, res) => {
  const f = await readJson<CollectionsFile>(FILES.collections, EMPTY);
  const userId = req.session?.member.id;
  const visible = f.collections.filter(
    (c) => c.visibility === "class" || c.ownerId === userId,
  );
  const sorted = [...visible].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  res.json(sorted);
});

router.get("/collections/:id", async (req, res) => {
  const f = await readJson<CollectionsFile>(FILES.collections, EMPTY);
  const c = f.collections.find((x) => x.id === req.params.id);
  if (!c) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const userId = req.session?.member.id;
  const role = req.session?.member.role;
  if (c.visibility === "private" && c.ownerId !== userId && role !== "instructor") {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(c);
});

router.post("/collections", requireAuth, async (req, res) => {
  const body = req.body as Partial<Collection>;
  const session = req.session!;
  const now = new Date().toISOString();
  const collection: Collection = {
    id: nanoid(10),
    title: body.title ?? "Untitled collection",
    description: body.description ?? "",
    visibility: body.visibility ?? "private",
    items: [],
    ownerId: session.member.id,
    ownerName: session.member.name,
    createdAt: now,
    updatedAt: now,
  };
  await mutate<CollectionsFile>(FILES.collections, EMPTY, (cur) => ({
    collections: [collection, ...cur.collections],
  }));
  await logEvent({
    actorId: session.member.id,
    actorName: session.member.name,
    type: "collection.created",
    entityKind: "collection",
    entityId: collection.id,
    entityTitle: collection.title,
  });
  res.status(201).json(collection);
});

router.patch("/collections/:id", requireAuth, async (req, res) => {
  const body = req.body as Partial<Collection>;
  const session = req.session!;
  let updated: Collection | null = null;
  await mutate<CollectionsFile>(FILES.collections, EMPTY, (cur) => ({
    collections: cur.collections.map((c) => {
      if (c.id !== req.params.id) return c;
      if (
        c.ownerId !== session.member.id &&
        session.member.role !== "instructor"
      )
        return c;
      const next: Collection = {
        ...c,
        ...body,
        id: c.id,
        items: c.items,
        ownerId: c.ownerId,
        ownerName: c.ownerName,
        createdAt: c.createdAt,
        updatedAt: new Date().toISOString(),
      };
      updated = next;
      return next;
    }),
  }));
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(updated);
});

router.post("/collections/:id/items", requireAuth, async (req, res) => {
  const body = req.body as Partial<CollectionItem>;
  const session = req.session!;
  const item: CollectionItem = {
    id: nanoid(10),
    kind: body.kind === "trend" ? "trend" : "signal",
    refId: body.refId ?? "",
    note: body.note ?? "",
    addedBy: session.member.id,
    addedByName: session.member.name,
    addedAt: new Date().toISOString(),
  };
  let updated: Collection | null = null;
  await mutate<CollectionsFile>(FILES.collections, EMPTY, (cur) => ({
    collections: cur.collections.map((c) => {
      if (c.id !== req.params.id) return c;
      if (
        c.visibility === "private" &&
        c.ownerId !== session.member.id &&
        session.member.role !== "instructor"
      )
        return c;
      const next: Collection = {
        ...c,
        items: [...c.items, item],
        updatedAt: new Date().toISOString(),
      };
      updated = next;
      return next;
    }),
  }));
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(201).json(updated);
});

router.delete(
  "/collections/:id/items/:itemId",
  requireAuth,
  async (req, res) => {
    const session = req.session!;
    await mutate<CollectionsFile>(FILES.collections, EMPTY, (cur) => ({
      collections: cur.collections.map((c) => {
        if (c.id !== req.params.id) return c;
        if (
          c.ownerId !== session.member.id &&
          session.member.role !== "instructor"
        )
          return c;
        return {
          ...c,
          items: c.items.filter((i) => i.id !== req.params.itemId),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    res.status(204).end();
  },
);

export default router;
