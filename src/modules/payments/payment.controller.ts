import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { initializePaymentSchema } from "./payment.validator";
import * as paymentService from "./payment.service";
import { verifyChapaSignature } from "./providers/chapa.provider";

export const initialize = asyncHandler(async (req: Request, res: Response) => {
  const input = initializePaymentSchema.parse(req.body);
  const result = await paymentService.initializePaymentForOrder(
    req.user!.id,
    input.orderId,
    input.provider
  );
  res.status(201).json(result);
});

export const chapaWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers["x-chapa-signature"] as string | undefined;

  if (!verifyChapaSignature(req.body, signature)) {
    throw new AppError("Invalid webhook signature", 401);
  }

  await paymentService.completePaymentFromProvider("CHAPA", req.body);

  res.status(200).json({ received: true });
});