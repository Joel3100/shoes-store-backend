import { PrismaClient, Prisma } from "../../generated/prisma/client";
import { AppError } from "../../utils/AppError";
import { decreaseStock } from "../inventory/inventory.service";
import { CheckoutInput } from "./order.validator";

const prisma = new PrismaClient();

const DELIVERY_FEE = new Prisma.Decimal(150);

const orderInclude = {
  items: true,
  payment: true,
};

export async function createOrderFromCart(userId: string, input: CheckoutInput) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: { include: { variant: { include: { product: true } } } },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new AppError("Your cart is empty", 400);
  }

  return prisma.$transaction(async (tx) => {
    let subtotal = new Prisma.Decimal(0);
    const orderItemsData = [];

    for (const item of cart.items) {
      const { variant } = item;
      const { product } = variant;

      if (!variant.isActive || !product.isActive) {
        throw new AppError(
          `${product.name} (${variant.color}, ${variant.size}) is no longer available`,
          409
        );
      }

      const unitPrice = variant.priceOverride ?? product.basePrice;
      const lineTotal = new Prisma.Decimal(unitPrice).mul(item.quantity);
      subtotal = subtotal.add(lineTotal);

      orderItemsData.push({
        variantId: variant.id,
        productNameSnap: product.name,
        skuSnap: variant.sku,
        colorSnap: variant.color,
        sizeSnap: variant.size,
        unitPriceSnap: unitPrice,
        quantity: item.quantity,
        lineTotal,
      });
    }

    const discountAmount = new Prisma.Decimal(0);
    const totalAmount = subtotal.add(DELIVERY_FEE).sub(discountAmount);

    const order = await tx.order.create({
      data: {
        userId,
        subtotal,
        deliveryFee: DELIVERY_FEE,
        discountAmount,
        totalAmount,
        recipientName: input.recipientName,
        recipientPhone: input.recipientPhone,
        shippingCity: input.shippingCity,
        shippingSubCity: input.shippingSubCity,
        shippingStreet: input.shippingStreet,
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    for (const item of cart.items) {
      await decreaseStock(tx, item.variantId, item.quantity, "ORDER_PLACED", order.id);
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return order;
  });
}

export async function listOrdersForUser(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderById(userId: string, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });

  if (!order || order.userId !== userId) {
    throw new AppError("Order not found", 404);
  }

  return order;
}