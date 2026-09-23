import { Router } from "express";
import * as orderController from "./order.controller";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

router.use(requireAuth);

router.post("/", orderController.checkout);
router.get("/", orderController.listMyOrders);
router.get("/:id", orderController.getMyOrder);

export default router;