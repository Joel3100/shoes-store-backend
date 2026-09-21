import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { restockSchema } from "./inventory.validator";
import * as inventoryService from "./inventory.service";

const getParamValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return value[0];
  }
  return "";
};

export const restock = asyncHandler(async (req: Request, res: Response) => {
  const variantId = getParamValue(req.params.variantId);
  const input = restockSchema.parse(req.body);
  const variant = await inventoryService.restockVariant(
    variantId,
    input.quantity,
    req.user!.id
  );
  res.status(200).json({ variant });
});

export const lowStock = asyncHandler(async (req: Request, res: Response) => {
  const variants = await inventoryService.listLowStockVariants();
  res.status(200).json({ variants });
});

export const movementHistory = asyncHandler(async (req: Request, res: Response) => {
  const variantId = getParamValue(req.params.variantId);
  const movements = await inventoryService.listMovementsForVariant(variantId);
  res.status(200).json({ movements });
});