"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

export async function approveApplication(
  applicationId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { supabase, landlordId } = await getLandlordId();

    // 1. Fetch the application
    const { data: app } = await supabase
      .from("rental_applications")
      .select("*, units(id, monthly_rent, property_id)")
      .eq("id", applicationId)
      .single();

    if (!app) return { success: false, error: "Application not found" };
    if (app.status !== "pending")
      return { success: false, error: "Application is no longer pending" };

    // 2. Verify unit is still vacant
    const { data: unit } = await supabase
      .from("units")
      .select("id, status, monthly_rent")
      .eq("id", app.unit_id)
      .single();

    if (!unit || unit.status !== "vacant") {
      return { success: false, error: "Unit is no longer vacant" };
    }

    // 3. Check if applicant already has a user account
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", app.email)
      .single();

    // 4. Create tenant record (linked if user exists)
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        full_name: app.full_name,
        email: app.email,
        phone: app.phone,
        landlord_id: landlordId,
        user_id: existingUser?.id || null,
      })
      .select("id")
      .single();

    if (tenantError) return { success: false, error: tenantError.message };

    // 4. Parse lease form data
    const raw = Object.fromEntries(formData);
    const monthlyRent = Number(raw.monthly_rent) || unit.monthly_rent;
    const startDate = (raw.start_date as string) || new Date().toISOString().split("T")[0];
    const endDate = (raw.end_date as string) || null;
    const rentDueDay = Number(raw.rent_due_day) || 1;
    const securityDeposit = Number(raw.security_deposit) || 0;

    // 5. Create lease
    const { error: leaseError } = await supabase.from("leases").insert({
      tenant_id: tenant.id,
      unit_id: app.unit_id,
      landlord_id: landlordId,
      monthly_rent: monthlyRent,
      security_deposit: securityDeposit,
      start_date: startDate,
      end_date: endDate,
      rent_due_day: rentDueDay,
      advance_months: 0,
    });

    if (leaseError) return { success: false, error: leaseError.message };

    // 6. Update unit: occupied + delisted
    await supabase
      .from("units")
      .update({ status: "occupied", is_listed: false })
      .eq("id", app.unit_id);

    // 7. Generate rent cycle for current month
    const { data: lease } = await supabase
      .from("leases")
      .select("id, tenant_id, unit_id, monthly_rent, rent_due_day, start_date")
      .eq("unit_id", app.unit_id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (lease) {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const dueDay = Math.min(lease.rent_due_day, periodEnd.getDate());
      const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);

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

    // 8. Mark application approved
    await supabase
      .from("rental_applications")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", applicationId);

    // 9. Auto-reject other pending applications for this unit
    await supabase
      .from("rental_applications")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("unit_id", app.unit_id)
      .eq("status", "pending")
      .neq("id", applicationId);

    revalidatePath("/landlord/applications");
    revalidatePath("/landlord/properties");
    revalidatePath("/landlord/tenants");
    revalidatePath("/landlord/payments");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong" };
  }
}

export async function rejectApplication(
  applicationId: string
): Promise<ActionResult> {
  try {
    const { supabase } = await getLandlordId();

    const { error } = await supabase
      .from("rental_applications")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", applicationId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/landlord/applications");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong" };
  }
}
