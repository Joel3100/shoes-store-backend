import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { addProductImage, getProductImage, deleteProductImage } from "./image.service";

export const upload = asyncHandler(async (req: Request, res: Response) => {
  const productId = Array.isArray(req.params.productId)
    ? req.params.productId[0]
    : req.params.productId;

  if (!req.file) {
    throw new AppError("Image file is required", 400);
  }

  const image = await addProductImage(productId, {
    buffer: req.file.buffer,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });

  res.status(201).json({ image });
});

export const getImage = asyncHandler(async (req: Request, res: Response) => {
  const productId = Array.isArray(req.params.productId)
    ? req.params.productId[0]
    : req.params.productId;
  const imageId = Array.isArray(req.params.imageId)
    ? req.params.imageId[0]
    : req.params.imageId;

  const image = await getProductImage(productId, imageId);

  res.set("Content-Type", image.mimeType);
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  res.send(image.data);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const productId = Array.isArray(req.params.productId)
    ? req.params.productId[0]
    : req.params.productId;
  const imageId = Array.isArray(req.params.imageId)
    ? req.params.imageId[0]
    : req.params.imageId;

  await deleteProductImage(productId, imageId);
  res.status(204).send();
});