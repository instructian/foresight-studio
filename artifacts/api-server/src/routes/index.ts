import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import rosterRouter from "./roster";
import configRouter from "./config";
import signalsRouter from "./signals";
import trendsRouter from "./trends";
import collectionsRouter from "./collections";
import scenariosRouter from "./scenarios";
import commentsRouter from "./comments";
import analyticsRouter from "./analytics";
import exportRouter from "./export";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(rosterRouter);
router.use(configRouter);
router.use(signalsRouter);
router.use(trendsRouter);
router.use(collectionsRouter);
router.use(scenariosRouter);
router.use(commentsRouter);
router.use(analyticsRouter);
router.use(exportRouter);

export default router;
