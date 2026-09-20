import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { createCategorySchema, updateCategorySchema } from "./category.validator";
import * as categoryService from "./category.service"

export const create = asyncHandler(async (req: Request, res: Response) => {
  const input = createCategorySchema.parse(req.body);
  const category = await categoryService.createCategory(input);
  res.status(201).json({ category });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const categories = await categoryService.listCategories();
  res.status(200).json({ categories });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const categoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const category = await categoryService.getCategoryById(categoryId);
  res.status(200).json({ category });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const categoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const input = updateCategorySchema.parse(req.body);
  const category = await categoryService.updateCategory(categoryId, input);
  res.status(200).json({ category });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const categoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await categoryService.deleteCategory(categoryId);
  res.status(204).send();
});