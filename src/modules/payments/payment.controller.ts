import { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/client";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { initializePaymentSchema } from "./payment.validator";
import * as paymentService from "./payment.service";
import { verifyChapaSignature } from "./providers/chapa.provider";
import { submitManualProofSchema } from "./payment.validator";
import { createNotification } from "../notifications/notification.service";

const prisma = new PrismaClient();

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

export const submitProof = asyncHandler(async (req: Request, res: Response) => {
  const input = submitManualProofSchema.parse(req.body);
  const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;

  const payment = await paymentService.submitManualPaymentProof(
    req.user!.id,
    orderId,
    input.manualReference,
    req.file
  );
  res.status(200).json({ payment });
});

export const listPendingManual = asyncHandler(async (req: Request, res: Response) => {
  const payments = await paymentService.listPendingManualPayments();
  res.status(200).json({ payments });
});

export const verifyManual = asyncHandler(async (req: Request, res: Response) => {
  const paymentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payment = await paymentService.verifyManualPayment(paymentId, req.user!.id);
  const order = await prisma.order.findUnique({ where: { id: payment.orderId } });

  await createNotification({
    userId: order!.userId,
    isForAdmin: false,
    type: "PAYMENT_SUCCESS",
    message: `Your bank transfer was verified. Order #${order!.id.slice(0, 8)} is now being processed.`,
    relatedOrderId: order!.id,
  });

  res.status(200).json({ payment });
});

export const rejectManual = asyncHandler(async (req: Request, res: Response) => {
  const paymentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const payment = await paymentService.rejectManualPayment(paymentId, req.user!.id);
  const order = await prisma.order.findUnique({ where: { id: payment.orderId } });

  await createNotification({
    userId: order!.userId,
    isForAdmin: false,
    type: "PAYMENT_FAILED",
    message: `Your payment reference for order #${order!.id.slice(0, 8)} could not be verified. Please check your reference number and resubmit.`,
    relatedOrderId: order!.id,
  });

  res.status(200).json({ payment });
});