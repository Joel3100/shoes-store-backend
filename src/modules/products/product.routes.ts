import { Router } from "express";
import * as productController from "./product.controller";
import { requireAuth } from "../../middleware/requireAuth";
import { requireAdmin } from "../../middleware/requireAdmin";
import variantRoutes from "../variants/variant.routes";
import imageRoutes from "../images/image.routes";

const router = Router();

router.get("/", productController.list);
router.get("/:id", productController.getOne);

router.post("/", requireAuth, requireAdmin, productController.create);
router.patch("/:id", requireAuth, requireAdmin, productController.update);
router.delete("/:id", requireAuth, requireAdmin, productController.remove);

router.use("/:productId/variants", variantRoutes);
router.use("/:productId/images", imageRoutes);

export default router;