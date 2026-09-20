import { z } from "zod";

export const createVariantSchema = z.object({
  color: z.string().min(1),
  size: z.string().min(1),
  sku: z.string().min(1),
  stock: z.coerce.number().int().min(0).default(0),
  priceOverride: z.coerce.number().positive().optional(),
});

export const updateVariantSchema = createVariantSchema.partial();

export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;