"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ActionResult } from "@/types";

export async function uploadManualPayment(
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    // Get tenant record
    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("id, landlord_id")
      .eq("user_id", user.id)
      .single();
    if (!tenant) return { success: false, error: "Tenant profile not found" };

    const rentCycleId = formData.get("rent_cycle_id") as string;
    const paymentMethod = formData.get("payment_method") as string;
    const transactionRef = (formData.get("transaction_reference") as string) || null;
    const senderNumber = (formData.get("sender_number") as string) || null;
    const file = formData.get("screenshot") as File;

    if (!rentCycleId || !paymentMethod || !file) {
      return { success: false, error: "Missing required fields" };
    }

    // Verify rent cycle belongs to this tenant and is unpaid
    const { data: cycle } = await supabaseAdmin
      .from("rent_cycles")
      .select("id, amount_due, amount_paid, status")
      .eq("id", rentCycleId)
      .eq("tenant_id", tenant.id)
      .single();

    if (!cycle) return { success: false, error: "Rent cycle not found" };
    if (cycle.status === "paid") return { success: false, error: "Already paid" };

    const amount = Number(cycle.amount_due) - Number(cycle.amount_paid);

    // Upload screenshot using admin client
    const fileName = `${user.id}/${rentCycleId}/${Date.now()}_${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("payment-screenshots")
      .upload(fileName, Buffer.from(arrayBuffer), {
        contentType: file.type,
      });

    if (uploadError) return { success: false, error: uploadError.message };

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage
      .from("payment-screenshots")
      .getPublicUrl(uploadData.path);

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        rent_cycle_id: rentCycleId,
        tenant_id: tenant.id,
        landlord_id: tenant.landlord_id,
        amount,
        payment_method: paymentMethod,
        status: "initiated",
      })
      .select("id")
      .single();

    if (paymentError) return { success: false, error: paymentError.message };

    // Create manual payment record
    const { error: mpError } = await supabaseAdmin
      .from("manual_payments")
      .insert({
        payment_id: payment.id,
        screenshot_url: publicUrl,
        transaction_reference: transactionRef,
        sender_number: senderNumber,
      });

    if (mpError) return { success: false, error: mpError.message };

    // Update rent cycle status
    await supabaseAdmin
      .from("rent_cycles")
      .update({ status: "pending_verification" })
      .eq("id", rentCycleId);

    revalidatePath("/tenant/rent-due");
    revalidatePath("/tenant/upload-screenshot");
    revalidatePath("/landlord/payments");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong" };
  }
}

export async function getTenantCycles(): Promise<
  ActionResult<
    { id: string; period_start: string; period_end: string; amount_due: number; amount_paid: number }[]
  >
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!tenant) return { success: false, error: "Tenant not found" };

    const { data } = await supabaseAdmin
      .from("rent_cycles")
      .select("id, period_start, period_end, amount_due, amount_paid")
      .eq("tenant_id", tenant.id)
      .in("status", ["due", "late"])
      .order("due_date");

    return { success: true, data: data || [] };
  } catch {
    return { success: false, error: "Something went wrong" };
  }
}
