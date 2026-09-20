import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { createVariantSchema, updateVariantSchema } from "./variant.validator";
import * as variantService from "./variant.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const input = createVariantSchema.parse(req.body);
  const variant = await variantService.createVariant(productId, input);
  res.status(201).json({ variant });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const variants = await variantService.listVariantsForProduct(productId);
  res.status(200).json({ variants });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const variantId = Array.isArray(req.params.variantId) ? req.params.variantId[0] : req.params.variantId;
  const variant = await variantService.getVariantById(productId, variantId);
  res.status(200).json({ variant });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const variantId = Array.isArray(req.params.variantId) ? req.params.variantId[0] : req.params.variantId;
  const input = updateVariantSchema.parse(req.body);
  const variant = await variantService.updateVariant(productId, variantId, input);
  res.status(200).json({ variant });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const variantId = Array.isArray(req.params.variantId) ? req.params.variantId[0] : req.params.variantId;
  await variantService.deleteVariant(productId, variantId);
  res.status(204).send();
});