import { z } from "zod";

export const restockSchema = z.object({
  quantity: z.coerce.number().int().positive(),
});

export type RestockInput = z.infer<typeof restockSchema>;