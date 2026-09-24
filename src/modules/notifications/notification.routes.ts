import { Router } from "express";
import * as notificationController from "./notification.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireAdmin } from "../../middleware/requireAdmin";

const router = Router();

router.use(requireAuth);

router.get("/", notificationController.listMine);
router.patch("/:id/read", notificationController.markRead);

router.get("/admin", requireAdmin, notificationController.listAdmin);

export default router;