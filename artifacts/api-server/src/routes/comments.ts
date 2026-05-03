import { Router, type IRouter } from "express";
import { nanoid } from "nanoid";
import { attachSession, requireAuth } from "../lib/auth";
import { logEvent } from "../lib/events";
import { FILES, mutate, readJson } from "../lib/store";
import type { Comment, CommentsFile } from "../lib/types";

const router: IRouter = Router();
router.use(attachSession);

const EMPTY: CommentsFile = { comments: [] };

router.get("/comments/:entityId", async (req, res) => {
  const f = await readJson<CommentsFile>(FILES.comments, EMPTY);
  const list = f.comments
    .filter((c) => c.entityId === req.params.entityId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  res.json(list);
});

router.post("/comments/:entityId", requireAuth, async (req, res) => {
  const body = req.body as { body: string };
  if (!body.body || body.body.trim().length === 0) {
    res.status(400).json({ error: "body required" });
    return;
  }
  const session = req.session!;
  const comment: Comment = {
    id: nanoid(10),
    entityId: String(req.params.entityId),
    body: body.body.trim(),
    authorId: session.member.id,
    authorName: session.member.name,
    authorRole: session.member.role,
    createdAt: new Date().toISOString(),
  };
  await mutate<CommentsFile>(FILES.comments, EMPTY, (cur) => ({
    comments: [...cur.comments, comment],
  }));
  await logEvent({
    actorId: session.member.id,
    actorName: session.member.name,
    type: "comment.added",
    entityKind: "comment",
    entityId: String(req.params.entityId),
    entityTitle: null,
  });
  res.status(201).json(comment);
});

router.delete(
  "/comments/:entityId/:commentId",
  requireAuth,
  async (req, res) => {
    const session = req.session!;
    await mutate<CommentsFile>(FILES.comments, EMPTY, (cur) => ({
      comments: cur.comments.filter(
        (c) =>
          !(
            c.id === req.params.commentId &&
            (c.authorId === session.member.id ||
              session.member.role === "instructor")
          ),
      ),
    }));
    res.status(204).end();
  },
);

export default router;
