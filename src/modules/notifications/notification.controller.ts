import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as notificationService from "./notification.service";

const getParamValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return value[0];
  }
  return "";
};

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await notificationService.listNotificationsForUser(req.user!.id, false);
  res.status(200).json({ notifications });
});

export const listAdmin = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await notificationService.listNotificationsForUser(req.user!.id, true);
  res.status(200).json({ notifications });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const notificationId = getParamValue(req.params.id);
  const notification = await notificationService.markAsRead(req.user!.id, notificationId);
  res.status(200).json({ notification });
});