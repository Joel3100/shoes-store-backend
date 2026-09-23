import { Router } from "express";
import * as inventoryController from "./inventory.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireAdmin } from "../../middleware/requireAdmin";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/low-stock", inventoryController.lowStock);
router.post("/variants/:variantId/restock", inventoryController.restock);
router.get("/variants/:variantId/movements", inventoryController.movementHistory);

export default router;