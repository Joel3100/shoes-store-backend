import { Router } from "express";
import * as orderController from "./order.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireAdmin } from "../../middleware/requireAdmin";

const router = Router();

router.use(requireAuth);

router.post("/", orderController.checkout);
router.get("/", orderController.listMyOrders);
router.get("/:id", orderController.getMyOrder);

router.get("/admin/all", requireAdmin, orderController.listAll);
router.get("/admin/:id", requireAdmin, orderController.getOneAdmin);
router.patch("/admin/:id/status", requireAdmin, orderController.updateStatus);

export default router;