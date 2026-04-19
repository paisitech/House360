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

  return { supabase, landlordId: landlord.id, userId: user.id };
}

export async function generateRentCycles(): Promise<ActionResult<string>> {
  try {
    const { supabase, landlordId } = await getLandlordId();

    // Get all active leases for this landlord
    const { data: leases } = await supabase
      .from("leases")
      .select("id, tenant_id, unit_id, monthly_rent, rent_due_day, start_date, end_date")
      .eq("landlord_id", landlordId)
      .eq("status", "active");

    if (!leases || leases.length === 0) {
      return { success: false, error: "No active leases found" };
    }

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    let created = 0;

    for (const lease of leases) {
      const leaseStart = new Date(lease.start_date);
      const leaseEnd = lease.end_date ? new Date(lease.end_date) : null;

      // Skip if lease hasn't started yet or already ended
      if (leaseStart > periodEnd) continue;
      if (leaseEnd && leaseEnd < periodStart) continue;

      const dueDay = Math.min(lease.rent_due_day, periodEnd.getDate());
      const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);

      const { error } = await supabase.from("rent_cycles").upsert(
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

      if (!error) created++;
    }

    revalidatePath("/landlord/payments");
    return { success: true, data: `${created} rent cycle(s) generated` };
  } catch {
    return { success: false, error: "Something went wrong" };
  }
}

export async function verifyManualPayment(
  paymentId: string,
  action: "approve" | "reject",
  rejectionReason?: string
): Promise<ActionResult> {
  try {
    const { supabase, userId } = await getLandlordId();

    if (action === "approve") {
      // Update manual_payment status
      const { error: mpError } = await supabase
        .from("manual_payments")
        .update({
          verification_status: "approved",
          verified_by: userId,
          verified_at: new Date().toISOString(),
        })
        .eq("payment_id", paymentId);

      if (mpError) return { success: false, error: mpError.message };

      // Update payment status
      const { error: pError } = await supabase
        .from("payments")
        .update({
          status: "success",
          paid_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      if (pError) return { success: false, error: pError.message };

      // Get the rent_cycle_id and update rent cycle
      const { data: payment } = await supabase
        .from("payments")
        .select("rent_cycle_id, amount")
        .eq("id", paymentId)
        .single();

      if (payment) {
        await supabase
          .from("rent_cycles")
          .update({
            status: "paid",
            amount_paid: payment.amount,
            paid_at: new Date().toISOString(),
          })
          .eq("id", payment.rent_cycle_id);
      }
    } else {
      // Reject
      const { error: mpError } = await supabase
        .from("manual_payments")
        .update({
          verification_status: "rejected",
          verified_by: userId,
          verified_at: new Date().toISOString(),
          rejection_reason: rejectionReason || null,
        })
        .eq("payment_id", paymentId);

      if (mpError) return { success: false, error: mpError.message };

      // Update payment status
      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("id", paymentId);

      // Revert rent cycle status
      const { data: payment } = await supabase
        .from("payments")
        .select("rent_cycle_id")
        .eq("id", paymentId)
        .single();

      if (payment) {
        const { data: cycle } = await supabase
          .from("rent_cycles")
          .select("due_date")
          .eq("id", payment.rent_cycle_id)
          .single();

        const isOverdue =
          cycle && new Date(cycle.due_date) < new Date();

        await supabase
          .from("rent_cycles")
          .update({
            status: isOverdue ? "late" : "due",
          })
          .eq("id", payment.rent_cycle_id);
      }
    }

    revalidatePath("/landlord/payments");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong" };
  }
}


