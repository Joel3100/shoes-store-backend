import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { checkoutSchema } from "./order.validator";
import * as orderService from "./order.service";

const getParamValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return value[0];
  }
  return "";
};

export const checkout = asyncHandler(async (req: Request, res: Response) => {
  const input = checkoutSchema.parse(req.body);
  const order = await orderService.createOrderFromCart(req.user!.id, input);
  res.status(201).json({ order });
});

export const listMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await orderService.listOrdersForUser(req.user!.id);
  res.status(200).json({ orders });
});

export const getMyOrder = asyncHandler(async (req: Request, res: Response) => {
  const orderId = getParamValue(req.params.id);
  const order = await orderService.getOrderById(req.user!.id, orderId);
  res.status(200).json({ order });
});