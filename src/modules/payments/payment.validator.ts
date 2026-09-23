import { z } from "zod";

export const initializePaymentSchema = z.object({
  orderId: z.string().uuid(),
  provider: z.enum(["CHAPA", "MANUAL_BANK"]),
});

export type InitializePaymentInput = z.infer<typeof initializePaymentSchema>;