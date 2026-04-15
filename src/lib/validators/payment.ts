import { z } from "zod";

export const manualPaymentSchema = z.object({
  rent_cycle_id: z.string().uuid("Select a rent cycle"),
  transaction_reference: z.string().optional(),
  sender_number: z.string().optional(),
  payment_method: z.enum(["bkash", "nagad", "rocket", "bank_transfer"]),
});

export type ManualPaymentFormData = z.infer<typeof manualPaymentSchema>;

export const verifyPaymentSchema = z.object({
  payment_id: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  rejection_reason: z.string().optional(),
});

export type VerifyPaymentFormData = z.infer<typeof verifyPaymentSchema>;
