import { z } from "zod";

export const unitSchema = z.object({
  unit_number: z.string().min(1, "Unit number is required"),
  floor: z.coerce.number().int().optional(),
  bedrooms: z.coerce.number().int().min(0).default(1),
  bathrooms: z.coerce.number().int().min(0).default(1),
  area_sqft: z.coerce.number().positive().optional(),
  monthly_rent: z.coerce.number().positive("Rent must be positive"),
  description: z.string().optional(),
});

export type UnitFormData = z.infer<typeof unitSchema>;
