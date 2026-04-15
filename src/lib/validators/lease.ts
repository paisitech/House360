import { z } from "zod";

export const leaseSchema = z.object({
  tenant_id: z.string().uuid("Select a tenant"),
  unit_id: z.string().uuid("Select a unit"),
  monthly_rent: z.coerce.number().positive("Rent must be positive"),
  security_deposit: z.coerce.number().min(0).default(0),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  rent_due_day: z.coerce.number().int().min(1).max(28).default(1),
  advance_months: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional(),
});

export type LeaseFormData = z.infer<typeof leaseSchema>;
