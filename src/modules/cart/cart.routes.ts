import { Router } from "express";
import * as cartController from "./cart.controller";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

router.use(requireAuth);

router.get("/", cartController.getCart);
router.post("/items", cartController.addItem);
router.patch("/items/:itemId", cartController.updateItem);
router.delete("/items/:itemId", cartController.removeItem);

export default router;