import { PrismaClient, Prisma, MovementReason } from "../../generated/prisma/client";
import { AppError } from "../../utils/AppError";

const prisma = new PrismaClient();

export async function decreaseStock(
  tx: Prisma.TransactionClient,
  variantId: string,
  quantity: number,
  reason: MovementReason,
  orderId?: string
) {
  const result = await tx.productVariant.updateMany({
    where: { id: variantId, stock: { gte: quantity } },
    data: { stock: { decrement: quantity } },
  });

  if (result.count === 0) {
    throw new AppError("Insufficient stock for this item", 409);
  }

  await tx.inventoryMovement.create({
    data: { variantId, quantity: -quantity, reason, orderId },
  });
}

export async function increaseStock(
  tx: Prisma.TransactionClient,
  variantId: string,
  quantity: number,
  reason: MovementReason,
  orderId?: string,
  performedById?: string
) {
  await tx.productVariant.update({
    where: { id: variantId },
    data: { stock: { increment: quantity } },
  });

  await tx.inventoryMovement.create({
    data: { variantId, quantity, reason, orderId, performedById },
  });
}

export async function restockVariant(
  variantId: string, 
  quantity: number, 
  performedById: string
) {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });

  if (!variant) {
    throw new AppError("Variant not found", 404);
  }

  await prisma.$transaction((tx) =>
    increaseStock(tx, variantId, quantity, "ADMIN_RESTOCK", undefined, performedById)
  );

  return prisma.productVariant.findUnique({ where: { id: variantId } });
}

const LOW_STOCK_THRESHOLD = 5;

export async function listLowStockVariants(threshold: number = LOW_STOCK_THRESHOLD) {
  return prisma.productVariant.findMany({
    where: {
      isActive: true,
      stock: { lte: threshold },
    },
    include: {
      product: { select: { id: true, name: true, brand: true } },
    },
    orderBy: { stock: "asc" },
  });
}

export async function listMovementsForVariant(variantId: string) {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });

  if (!variant) {
    throw new AppError("Variant not found", 404);
  }

  return prisma.inventoryMovement.findMany({
    where: { variantId },
    include: {
      performedBy: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
} 