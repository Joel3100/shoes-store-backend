import { PrismaClient, Prisma } from "../../generated/prisma/client";
import { AppError } from "../../utils/AppError";
import { CreateVariantInput, UpdateVariantInput } from "./variant.validator";

const prisma = new PrismaClient();

export async function createVariant(productId: string, input: CreateVariantInput) {
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const duplicate = await prisma.productVariant.findFirst({
    where: { productId, color: input.color, size: input.size },
  });

  if (duplicate) {
    throw new AppError("This color/size combination already exists for this product", 409);
  }

  const skuTaken = await prisma.productVariant.findUnique({ where: { sku: input.sku } });

  if (skuTaken) {
    throw new AppError("This SKU is already in use", 409);
  }

  return prisma.productVariant.create({
    data: {
      productId,
      color: input.color,
      size: input.size,
      sku: input.sku,
      stock: input.stock,
      priceOverride:
        input.priceOverride !== undefined ? new Prisma.Decimal(input.priceOverride) : undefined,
    },
  });
}

export async function listVariantsForProduct(productId: string) {
  return prisma.productVariant.findMany({
    where: { productId, isActive: true },
    orderBy: [{ color: "asc" }, { size: "asc" }],
  });
}

export async function getVariantById(productId: string, variantId: string) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
  });

  if (!variant) {
    throw new AppError("Variant not found", 404);
  }

  return variant;
}

export async function updateVariant(
  productId: string,
  variantId: string,
  input: UpdateVariantInput
) {
  await getVariantById(productId, variantId);

  const data: any = { ...input };
  if (input.priceOverride !== undefined) {
    data.priceOverride = new Prisma.Decimal(input.priceOverride);
  }

  return prisma.productVariant.update({ where: { id: variantId }, data });
}

export async function deleteVariant(productId: string, variantId: string) {
  await getVariantById(productId, variantId);
  return prisma.productVariant.update({ where: { id: variantId }, data: { isActive: false } });
}