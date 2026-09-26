import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as analyticsService from "./analytics.service";

export const dashboard = asyncHandler(async (req: Request, res: Response) => {
  const summary = await analyticsService.getDashboardSummary();
  res.status(200).json(summary);
});