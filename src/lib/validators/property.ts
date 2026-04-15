import { z } from "zod";

export const propertySchema = z.object({
  name: z.string().min(1, "Property name is required").max(100),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  area: z.string().optional(),
  property_type: z.enum(["residential", "commercial", "mixed"]),
  total_floors: z.coerce.number().int().min(1, "At least 1 floor required"),
  units_per_floor: z.coerce.number().int().min(1, "At least 1 unit per floor"),
  default_rent: z.coerce.number().positive("Rent must be positive"),
  description: z.string().optional(),
});

// Schema for editing (no floor/unit generation fields)
export const propertyUpdateSchema = z.object({
  name: z.string().min(1, "Property name is required").max(100),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  area: z.string().optional(),
  property_type: z.enum(["residential", "commercial", "mixed"]),
  description: z.string().optional(),
});

export type PropertyFormData = z.infer<typeof propertySchema>;
export type PropertyUpdateFormData = z.infer<typeof propertyUpdateSchema>;
