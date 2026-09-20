import { Router } from "express";
import * as variantController from "./variant.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireAdmin } from "../../middleware/requireAdmin";

const router = Router({ mergeParams: true });

router.get("/", variantController.list);
router.get("/:variantId", variantController.getOne);

router.post("/", requireAuth, requireAdmin, variantController.create);
router.patch("/:variantId", requireAuth, requireAdmin, variantController.update);
router.delete("/:variantId", requireAuth, requireAdmin, variantController.remove);

export default router;