"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tenantSchema } from "@/lib/validators/tenant";
import { leaseSchema } from "@/lib/validators/lease";
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

  return { supabase, landlordId: landlord.id, userId: user.id };
}

export async function createTenant(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, landlordId } = await getLandlordId();
    const raw = Object.fromEntries(formData);
    const parsed = tenantSchema.safeParse(raw);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { error } = await supabase.from("tenants").insert({
      ...parsed.data,
      email: parsed.data.email || null,
      landlord_id: landlordId,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath("/landlord/tenants");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong" };
  }
}

export async function updateTenant(
  tenantId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { supabase } = await getLandlordId();
    const raw = Object.fromEntries(formData);
    const parsed = tenantSchema.safeParse(raw);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { error } = await supabase
      .from("tenants")
      .update({ ...parsed.data, email: parsed.data.email || null })
      .eq("id", tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/landlord/tenants");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong" };
  }
}

export async function createLease(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, landlordId } = await getLandlordId();
    const raw = Object.fromEntries(formData);
    const parsed = leaseSchema.safeParse(raw);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    // Create the lease
    const { error: leaseError } = await supabase.from("leases").insert({
      ...parsed.data,
      end_date: parsed.data.end_date || null,
      notes: parsed.data.notes || null,
      landlord_id: landlordId,
    });

    if (leaseError) return { success: false, error: leaseError.message };

    // Update unit status to occupied
    await supabase
      .from("units")
      .update({ status: "occupied" })
      .eq("id", parsed.data.unit_id);

    // Get the newly created lease
    const { data: lease } = await supabase
      .from("leases")
      .select("id, tenant_id, unit_id, monthly_rent, rent_due_day, start_date")
      .eq("unit_id", parsed.data.unit_id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Generate rent cycle for current month immediately
    if (lease) {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const dueDay = Math.min(lease.rent_due_day, periodEnd.getDate());
      const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);

      // Only generate if lease start_date is within or before this month
      const leaseStart = new Date(lease.start_date);
      if (leaseStart <= periodEnd) {
        await supabase.from("rent_cycles").upsert(
          {
            lease_id: lease.id,
            tenant_id: lease.tenant_id,
            landlord_id: landlordId,
            unit_id: lease.unit_id,
            period_start: periodStart.toISOString().split("T")[0],
            period_end: periodEnd.toISOString().split("T")[0],
            due_date: dueDate.toISOString().split("T")[0],
            amount_due: lease.monthly_rent,
            status: dueDate < now ? "late" : "due",
          },
          { onConflict: "lease_id,period_start" }
        );
      }
    }

    revalidatePath("/landlord/tenants");
    revalidatePath("/landlord/properties");
    revalidatePath("/landlord/payments");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong" };
  }
}

export async function terminateLease(leaseId: string, unitId: string): Promise<ActionResult> {
  try {
    const { supabase } = await getLandlordId();

    const { error } = await supabase
      .from("leases")
      .update({ status: "terminated" })
      .eq("id", leaseId);

    if (error) return { success: false, error: error.message };

    // Set unit back to vacant
    await supabase
      .from("units")
      .update({ status: "vacant" })
      .eq("id", unitId);

    revalidatePath("/landlord/tenants");
    revalidatePath("/landlord/properties");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong" };
  }
}
