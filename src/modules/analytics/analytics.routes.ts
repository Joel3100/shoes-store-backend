import { Router } from "express";
import * as analyticsController from "./analytics.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireAdmin } from "../../middleware/requireAdmin";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/dashboard", analyticsController.dashboard);

export default router;