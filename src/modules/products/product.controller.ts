import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { createProductSchema, updateProductSchema } from "./product.validator";
import * as productService from "./product.service";

const getQueryValue = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return value[0];
  }
  return undefined;
};

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = createProductSchema.parse(req.body);
  const product = await productService.createProduct(input);
  res.status(201).json({ product });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const categoryId = getQueryValue(req.query.categoryId);
  const brand = getQueryValue(req.query.brand);
  const search = getQueryValue(req.query.search);

  const products = await productService.listProducts({
    categoryId,
    brand,
    search,
  });
  res.status(200).json({ products });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const product = await productService.getProductById(productId);
  res.status(200).json({ product });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const input = updateProductSchema.parse(req.body);
  const product = await productService.updateProduct(productId, input);
  res.status(200).json({ product });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const productId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await productService.deleteProduct(productId);
  res.status(204).send();
});