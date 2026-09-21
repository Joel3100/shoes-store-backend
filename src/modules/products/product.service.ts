import { PrismaClient } from "../../generated/prisma/client";
import { AppError } from "../../utils/AppError";
import { CreateProductInput, UpdateProductInput } from "./product.validator";

const prisma = new PrismaClient();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const productInclude = {
  category: true,
  variants: { where: { isActive: true } },
  images: {
    orderBy: { sortOrder: "asc" as const },
    select: { id: true, productId: true, mimeType: true, sortOrder: true, createdAt: true },
  },
};

export async function createProduct(input: CreateProductInput) {
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const slug = slugify(input.name);

  return prisma.product.create({
    data: {
      ...input,
      slug,
      basePrice: input.basePrice,
      discount: input.discount,
    },
    include: productInclude,
  });
}

export async function listProducts(filters: {
  categoryId?: string;
  brand?: string;
  search?: string;
}) {
  return prisma.product.findMany({
    where: {
      isActive: true,
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.brand && { brand: { equals: filters.brand, mode: "insensitive" } }),
      ...(filters.search && {
        name: { contains: filters.search, mode: "insensitive" },
      }),
    },
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  await getProductById(id);

  const data: any = { ...input };
  if (input.name) data.slug = slugify(input.name);
  if (input.basePrice !== undefined) data.basePrice = input.basePrice;
  if (input.discount !== undefined) data.discount = input.discount;

  return prisma.product.update({ where: { id }, data, include: productInclude });
}

export async function deleteProduct(id: string) {
  await getProductById(id);
  return prisma.product.update({ where: { id }, data: { isActive: false } });
}