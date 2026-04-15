"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { unitSchema } from "@/lib/validators/unit";
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

export async function createUnit(
  propertyId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { supabase, landlordId } = await getLandlordId();
    const raw = Object.fromEntries(formData);
    const parsed = unitSchema.safeParse(raw);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { error } = await supabase.from("units").insert({
      ...parsed.data,
      property_id: propertyId,
      landlord_id: landlordId,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath(`/landlord/properties/${propertyId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong" };
  }
}

export async function updateUnit(
  propertyId: string,
  unitId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { supabase } = await getLandlordId();
    const raw = Object.fromEntries(formData);
    const parsed = unitSchema.safeParse(raw);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { error } = await supabase
      .from("units")
      .update(parsed.data)
      .eq("id", unitId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/landlord/properties/${propertyId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong" };
  }
}

export async function toggleUnitListing(
  propertyId: string,
  unitId: string,
  isListed: boolean
): Promise<ActionResult> {
  try {
    const { supabase } = await getLandlordId();

    const { error } = await supabase
      .from("units")
      .update({ is_listed: isListed })
      .eq("id", unitId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/landlord/properties/${propertyId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong" };
  }
}

export async function deleteUnit(
  propertyId: string,
  unitId: string
): Promise<ActionResult> {
  try {
    const { supabase } = await getLandlordId();

    const { error } = await supabase.from("units").delete().eq("id", unitId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/landlord/properties/${propertyId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong" };
  }
}
