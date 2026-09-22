import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { addCartItemSchema, updateCartItemSchema } from "./cart.validator";
import * as cartService from "./cart.service";

const getParamValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return value[0];
  }
  return "";
};

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.getOrCreateCart(req.user!.id);
  res.status(200).json({ cart });
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const input = addCartItemSchema.parse(req.body);
  const cart = await cartService.addItemToCart(req.user!.id, input);
  res.status(200).json({ cart });
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const itemId = getParamValue(req.params.itemId);
  const input = updateCartItemSchema.parse(req.body);
  const cart = await cartService.updateCartItemQuantity(req.user!.id, itemId, input.quantity);
  res.status(200).json({ cart });
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const itemId = getParamValue(req.params.itemId);
  const cart = await cartService.removeCartItem(req.user!.id, itemId);
  res.status(200).json({ cart });
});
