import { z } from "zod";

export const initializePaymentSchema = z.object({
  orderId: z.string().uuid(),
  provider: z.enum(["CHAPA", "MANUAL_BANK"]),
});

export const submitManualProofSchema = z.object({
  manualReference: z.string().min(1),
})

export type SubmitManualProofInput = z.infer<typeof submitManualProofSchema>;
export type InitializePaymentInput = z.infer<typeof initializePaymentSchema>;