import { z } from "zod";

export const tenantSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone number is required"),
  nid_number: z.string().optional(),
  emergency_contact: z.string().optional(),
});

export type TenantFormData = z.infer<typeof tenantSchema>;
