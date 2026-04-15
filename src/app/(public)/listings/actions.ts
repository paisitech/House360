"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { rentalApplicationSchema } from "@/lib/validators/application";
import type { ActionResult } from "@/types";

export async function submitApplication(
  unitId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const raw = Object.fromEntries(formData);
    const parsed = rentalApplicationSchema.safeParse(raw);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    // Verify unit is still listed and vacant
    const { data: unit } = await supabaseAdmin
      .from("units")
      .select("landlord_id, is_listed, status")
      .eq("id", unitId)
      .single();

    if (!unit || !unit.is_listed || unit.status !== "vacant") {
      return { success: false, error: "This unit is no longer available" };
    }

    const { error } = await supabaseAdmin.from("rental_applications").insert({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: parsed.data.message || null,
      unit_id: unitId,
      landlord_id: unit.landlord_id,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong" };
  }
}
