import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { initializePaymentSchema } from "./payment.validator";
import * as paymentService from "./payment.service";

export const initialize = asyncHandler(async (req: Request, res: Response) => {
  const input = initializePaymentSchema.parse(req.body);
  const result = await paymentService.initializePaymentForOrder(
    req.user!.id,
    input.orderId,
    input.provider
  );
  res.status(201).json(result);
});