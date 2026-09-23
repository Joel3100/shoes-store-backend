import { z } from "zod";

export const checkoutSchema = z.object({
  recipientName: z.string().min(1),
  recipientPhone: z.string().min(1),
  shippingCity: z.string().min(1),
  shippingSubCity: z.string().optional(),
  shippingStreet: z.string().min(1),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;