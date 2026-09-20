import { PrismaClient } from "../../generated/prisma/client";
import { AppError } from "../../utils/AppError";
import { CreateCategoryInput, UpdateCategoryInput } from "./category.validator";

const prisma = new PrismaClient();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createCategory(input: CreateCategoryInput) {
  const slug = slugify(input.name);

  const existing = await prisma.category.findFirst({
    where: { OR: [{ name: input.name }, { slug }] },
  });

  if (existing) {
    throw new AppError("A category with this name already exists", 409);
  }

  return prisma.category.create({
    data: { ...input, slug },
  });
}

export async function listCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getCategoryById(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return category;
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  await getCategoryById(id);

  const data: any = { ...input };
  if (input.name) {
    data.slug = slugify(input.name);
  }

  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
  await getCategoryById(id);
  return prisma.category.update({ where: { id }, data: { isActive: false } });
}