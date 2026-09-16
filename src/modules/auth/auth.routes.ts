import { Router } from "express";
import { register, login, me, logout } from "./auth.controller";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);

export default router;