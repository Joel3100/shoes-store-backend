import { PrismaClient, Prisma } from "../../generated/prisma/client";
import { AppError } from "../../utils/AppError";
import { AddCartItemInput } from "./cart.validator";

const prisma = new PrismaClient();

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            select: { id: true, name: true, brand: true, basePrice: true, slug: true },
          },
        },
      },
    },
  },
};

function computeCartTotals(cart: any) {
  let subtotal = new Prisma.Decimal(0);

  const items = cart.items.map((item: any) => {
    const unitPrice = item.variant.priceOverride ?? item.variant.product.basePrice;
    const lineTotal = new Prisma.Decimal(unitPrice).mul(item.quantity);
    subtotal = subtotal.add(lineTotal);
    return { ...item, unitPrice, lineTotal };
  });

  return { ...cart, items, subtotal };
}

export async function getOrCreateCart(userId: string) {
  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: cartInclude,
  });

  return computeCartTotals(cart);
}

export async function addItemToCart(userId: string, input: AddCartItemInput) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: input.variantId },
    include: { product: true },
  });

  if (!variant || !variant.isActive || !variant.product.isActive) {
    throw new AppError("This item is not available", 404);
  }

  if (variant.stock < input.quantity) {
    throw new AppError(
      `Only ${variant.stock} in stock for this size/color`,
      409
    );
  }

  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId: input.variantId } },
  });

  if (existingItem) {
    return computeCartTotals(
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: {
            update: {
              where: { id: existingItem.id },
              data: { quantity: existingItem.quantity + input.quantity },
            },
          },
        },
        include: cartInclude,
      })
    );
  }

  return computeCartTotals(
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: {
          create: { variantId: input.variantId, quantity: input.quantity },
        },
      },
      include: cartInclude,
    })
  );
}

async function getOwnedCartItem(userId: string, itemId: string) {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });

  if (!item || item.cart.userId !== userId) {
    throw new AppError("Cart item not found", 404);
  }

  return item;
}

export async function updateCartItemQuantity(
  userId: string,
  itemId: string,
  quantity: number
) {
  const item = await getOwnedCartItem(userId, itemId);

  const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });

  if (!variant || variant.stock < quantity) {
    throw new AppError(`Only ${variant?.stock ?? 0} in stock for this size/color`, 409);
  }

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });

  const cart = await prisma.cart.findUnique({ where: { id: item.cartId }, include: cartInclude });
  return computeCartTotals(cart);
}

export async function removeCartItem(userId: string, itemId: string) {
  const item = await getOwnedCartItem(userId, itemId);

  await prisma.cartItem.delete({ where: { id: itemId } });

  const cart = await prisma.cart.findUnique({ where: { id: item.cartId }, include: cartInclude });
  return computeCartTotals(cart);
}