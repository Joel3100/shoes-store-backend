import { Router } from "express";
import * as categoryController from "./category.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireAdmin } from "../../middleware/requireAdmin";

const router = Router();

router.get("/", categoryController.list);
router.get("/:id", categoryController.getOne);

router.post("/", requireAuth, requireAdmin, categoryController.create);
router.patch("/:id", requireAuth, requireAdmin, categoryController.update);
router.delete("/:id", requireAuth, requireAdmin, categoryController.remove);

export default router;