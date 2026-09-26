import { Router } from "express";
import * as paymentController from "./payment.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireAdmin } from "../../middleware/requireAdmin";
import multer from "multer";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/initialize", requireAuth, paymentController.initialize);
router.post("/webhook/chapa", paymentController.chapaWebhook);

router.post(
  "/orders/:orderId/manual-proof",
  requireAuth,
  upload.single("receipt"),
  paymentController.submitProof
);

router.get("/admin/manual-pending", requireAuth, requireAdmin, paymentController.listPendingManual);
router.patch("/admin/:id/verify", requireAuth, requireAdmin, paymentController.verifyManual);
router.patch("/admin/:id/reject", requireAuth, requireAdmin, paymentController.rejectManual);

export default router;