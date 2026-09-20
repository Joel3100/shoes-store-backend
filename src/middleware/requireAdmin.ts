import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    throw new AppError("Admin access required", 403);
  }
  next();
}