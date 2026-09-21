import { PrismaClient } from "../../generated/prisma/client";
import { AppError } from "../../utils/AppError";

const prisma = new PrismaClient();

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

type UploadedFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

export async function addProductImage(
  productId: string,
  file: UploadedFile
) {
    console.log("Uploaded file:", {
    mimetype: file.mimetype,
    size: file.size,
    bufferLength: file.buffer.length,
  });

  // 1. Validate file exists
  if (!file?.buffer || file.buffer.length === 0) {
    throw new AppError("Image file is required", 400);
  }

  // 2. Validate MIME type exists
  if (!file.mimetype) {
    throw new AppError("Image MIME type is required", 400);
  }

  // 3. Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new AppError("Image size must be less than 5MB", 400);
  }

  // 4. Validate image type
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new AppError(
      "Only JPEG, PNG, and WebP images are allowed",
      400
    );
  }

  // 5. Make sure product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // 6. Determine image order
  const imageCount = await prisma.productImage.count({
    where: { productId },
  });

  // 7. Store image
  return prisma.productImage.create({
    data: {
      productId,
      data: new Uint8Array(file.buffer),
      mimeType: file.mimetype,
      sortOrder: imageCount,
    },
    select: {
      id: true,
      productId: true,
      mimeType: true,
      sortOrder: true,
      createdAt: true,
    },
  });
}

export async function getProductImage(productId: string, imageId: string) {
  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId },
  });

  if (!image) {
    throw new AppError("Image not found", 404);
  }

  return image;
}

export async function deleteProductImage(productId: string, imageId: string) {
  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId },
  });

  if (!image) {
    throw new AppError("Image not found", 404);
  }

  return prisma.productImage.delete({ where: { id: imageId } });
}