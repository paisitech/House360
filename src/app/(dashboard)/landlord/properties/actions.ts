"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { propertySchema, propertyUpdateSchema } from "@/lib/validators/property";
import type { ActionResult } from "@/types";

async function getLandlordId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: landlord } = await supabase
    .from("landlords")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!landlord) throw new Error("Landlord profile not found");

  return { supabase, landlordId: landlord.id };
}

export async function createProperty(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, landlordId } = await getLandlordId();
    const raw = Object.fromEntries(formData);
    const parsed = propertySchema.safeParse(raw);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { total_floors, units_per_floor, default_rent, ...propertyData } = parsed.data;
    const total_units = total_floors * units_per_floor;

    // Create property
    const { data: property, error } = await supabase
      .from("properties")
      .insert({
        ...propertyData,
        total_units,
        landlord_id: landlordId,
      })
      .select("id")
      .single();

    if (error || !property) return { success: false, error: error?.message || "Failed to create property" };

    // Auto-generate units
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const units = [];
    for (let floor = 1; floor <= total_floors; floor++) {
      for (let u = 0; u < units_per_floor; u++) {
        const unitLetter = units_per_floor <= 26 ? letters[u] : String(u + 1);
        units.push({
          property_id: property.id,
          landlord_id: landlordId,
          unit_number: `${floor}${unitLetter}`,
          floor,
          monthly_rent: default_rent,
          bedrooms: 1,
          bathrooms: 1,
          status: "vacant" as const,
        });
      }
    }

    const { error: unitsError } = await supabase.from("units").insert(units);
    if (unitsError) return { success: false, error: unitsError.message };

    revalidatePath("/landlord/properties");
    return { success: true };
  } catch (err) {
    return { success: false, error: "Something went wrong" };
  }
}

export async function updateProperty(
  propertyId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { supabase } = await getLandlordId();
    const raw = Object.fromEntries(formData);
    const parsed = propertyUpdateSchema.safeParse(raw);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { error } = await supabase
      .from("properties")
      .update(parsed.data)
      .eq("id", propertyId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/landlord/properties");
    revalidatePath(`/landlord/properties/${propertyId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: "Something went wrong" };
  }
}

export async function deleteProperty(propertyId: string): Promise<ActionResult> {
  try {
    const { supabase } = await getLandlordId();

    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", propertyId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/landlord/properties");
    return { success: true };
  } catch (err) {
    return { success: false, error: "Something went wrong" };
  }
}
