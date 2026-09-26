import { PrismaClient } from "../../generated/prisma/client";
import { AppError } from "../../utils/AppError";
import { PaymentProvider } from "./payment.types";
import { ManualBankProvider } from "./providers/manualBank.provider";
import { ChapaProvider } from "./providers/chapa.provider";
import { increaseStock } from "../inventory/inventory.service";
import { createNotification, notifyAllAdmins } from "../notifications/notification.service";

const prisma = new PrismaClient();

const providers: Record<string, PaymentProvider> = {
  MANUAL_BANK: new ManualBankProvider(),
  CHAPA: new ChapaProvider(),
};

function getProvider(providerName: string): PaymentProvider {
  const provider = providers[providerName];

  if (!provider) {
    throw new AppError(`Unsupported payment provider: ${providerName}`, 400);
  }

  return provider;
}

export async function initializePaymentForOrder(
  userId: string,
  orderId: string,
  providerName: string
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, payment: true },
  });

  if (!order || order.userId !== userId) {
    throw new AppError("Order not found", 404);
  }

  if (order.status !== "PENDING_PAYMENT") {
    throw new AppError("This order is not awaiting payment", 409);
  }

  if (order.payment) {
    throw new AppError("A payment has already been initialized for this order", 409);
  }

  const provider = getProvider(providerName);

  const result = await provider.initializePayment({
    orderId: order.id,
    amount: order.totalAmount.toNumber(),
    currency: "ETB",
    customerEmail: order.user.email,
  });

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: providerName as any,
      status: providerName === "MANUAL_BANK" ? "PENDING" : "PENDING",
      amount: order.totalAmount,
      currency: "ETB",
      providerRef: result.providerRef,
    },
  });

  return { payment, ...result };
}

export async function completePaymentFromProvider(providerName: string, rawPayload: unknown) {
  const provider = getProvider(providerName);
  const result = await provider.verifyPayment(rawPayload);

  const payment = await prisma.payment.findUnique({
    where: { providerRef: result.providerRef },
    include: { order: { include: { items: true } } },
  });

  if (!payment) {
    throw new AppError(`No payment found for reference ${result.providerRef}`, 404);
  }

  if (payment.status === "SUCCESS" || payment.status === "FAILED") {
    return { alreadyProcessed: true, payment };
  }

  const result2 = await prisma.$transaction(async (tx) => {
    await tx.paymentEvent.create({
      data: {
        paymentId: payment.id,
        eventType: result.success ? "charge.success" : "charge.failed",
        payload: result.rawPayload as any,
      },
    });

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: { status: result.success ? "SUCCESS" : "FAILED" },
    });

    if (result.success) {
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: "PAID" },
      });
    } else {
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: "PAYMENT_FAILED" },
      });

      for (const item of payment.order.items) {
        await increaseStock(tx, item.variantId, item.quantity, "ORDER_CANCELLED", payment.orderId);
      }
    }

    return { alreadyProcessed: false, payment: updatedPayment };
  });

  if (!result2.alreadyProcessed) {
    const order = await prisma.order.findUnique({ where: { id: payment.orderId } });

    if (result2.payment.status === "SUCCESS") {
      await createNotification({
        userId: order!.userId,
        isForAdmin: false,
        type: "PAYMENT_SUCCESS",
        message: `Payment received for order #${order!.id.slice(0, 8)}. Your order is being processed.`,
        relatedOrderId: order!.id,
      });
      await notifyAllAdmins({
        type: "PAYMENT_RECEIVED",
        message: `Payment confirmed for order #${order!.id.slice(0, 8)}.`,
        relatedOrderId: order!.id,
      });
    } else {
      await createNotification({
        userId: order!.userId,
        isForAdmin: false,
        type: "PAYMENT_FAILED",
        message: `Payment for order #${order!.id.slice(0, 8)} failed. Please try again.`,
        relatedOrderId: order!.id,
      });
    }
  }

  return result2;
}

export async function submitManualPaymentProof(
  userId: string,
  orderId: string,
  manualReference: string,
  receiptFile?: Express.Multer.File
) {
  const payment = await prisma.payment.findUnique({
    where: { orderId },
    include: { order: true },
  });

  if (!payment || payment.order.userId !== userId) {
    throw new AppError("Payment not found", 404);
  }

  if (payment.provider !== "MANUAL_BANK") {
    throw new AppError("This order was not set up for manual bank payment", 400);
  }

  if (payment.status !== "PENDING" && payment.status !== "REJECTED") {
    throw new AppError(
      `Cannot submit proof for a payment in ${payment.status} status`,
      409
    );
  }

  const receiptData = receiptFile ? new Uint8Array(receiptFile.buffer) : undefined;

  return prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "PENDING_VERIFICATION",
      manualReference,
      receiptData,
      receiptMimeType: receiptFile?.mimetype,
    },
  });
}

export async function listPendingManualPayments() {
  return prisma.payment.findMany({
    where: { provider: "MANUAL_BANK", status: "PENDING_VERIFICATION" },
    include: {
      order: { include: { user: { select: { id: true, fullName: true, email: true } } } },
    },
    orderBy: { updatedAt: "asc" },
  });
}

export async function verifyManualPayment(paymentId: string, adminId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

  if (!payment) throw new AppError("Payment not found", 404);
  if (payment.status !== "PENDING_VERIFICATION") {
    throw new AppError(`Cannot verify a payment in ${payment.status} status`, 409);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: { status: "VERIFIED", verifiedById: adminId, verifiedAt: new Date() },
    });

    await tx.order.update({
      where: { id: payment.orderId },
      data: { status: "PROCESSING" },
    });

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "PAYMENT_VERIFIED",
        targetType: "Payment",
        targetId: paymentId,
      },
    });

    return updated;
  });
}

export async function rejectManualPayment(paymentId: string, adminId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

  if (!payment) throw new AppError("Payment not found", 404);
  if (payment.status !== "PENDING_VERIFICATION") {
    throw new AppError(`Cannot reject a payment in ${payment.status} status`, 409);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: { status: "REJECTED", verifiedById: adminId, verifiedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "PAYMENT_REJECTED",
        targetType: "Payment",
        targetId: paymentId,
      },
    });

    return updated;
  });
}