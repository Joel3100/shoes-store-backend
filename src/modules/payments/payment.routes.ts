import { Router } from "express";
import * as paymentController from "./payment.controller";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

router.post("/initialize", requireAuth, paymentController.initialize);

export default router;