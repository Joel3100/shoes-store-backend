import { Router } from "express";
import multer from "multer";
import * as imageController from "./image.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireAdmin } from "../../middleware/requireAdmin";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router({ mergeParams: true });

router.get("/:imageId", imageController.getImage);

router.post(
  "/",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  imageController.upload
);
router.delete(
  "/:imageId",
  requireAuth,
  requireAdmin,
  imageController.remove
);

export default router;