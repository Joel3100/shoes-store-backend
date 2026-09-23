import { PrismaClient } from "../../generated/prisma/client";
import { AppError } from "../../utils/AppError";
import { PaymentProvider } from "./payment.types";
import { ManualBankProvider } from "./providers/manualBank.provider";
import { ChapaProvider } from "./providers/chapa.provider";

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