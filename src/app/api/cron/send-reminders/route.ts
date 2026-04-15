import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let remindersSent = 0;

    // Find cycles due in 3 days (upcoming reminder)
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const threeDaysStr = threeDaysLater.toISOString().split("T")[0];

    const { data: upcomingCycles } = await supabaseAdmin
      .from("rent_cycles")
      .select("*")
      .eq("status", "due")
      .eq("due_date", threeDaysStr);

    // Find overdue cycles (daily overdue reminder)
    const { data: overdueCycles } = await supabaseAdmin
      .from("rent_cycles")
      .select("*")
      .eq("status", "late");

    const allCycles = [
      ...(upcomingCycles || []).map((c) => ({
        ...c,
        isOverdue: false,
      })),
      ...(overdueCycles || []).map((c) => ({
        ...c,
        isOverdue: true,
      })),
    ];

    for (const cycle of allCycles) {
      // Check if reminder already sent today for this cycle
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabaseAdmin
        .from("reminders")
        .select("id")
        .eq("rent_cycle_id", cycle.id)
        .gte("created_at", `${today}T00:00:00`)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const amount = formatCurrency(
        Number(cycle.amount_due) - Number(cycle.amount_paid)
      );

      await supabaseAdmin.from("reminders").insert({
        rent_cycle_id: cycle.id,
        tenant_id: cycle.tenant_id,
        landlord_id: cycle.landlord_id,
        reminder_type: cycle.isOverdue ? "overdue" : "upcoming_due",
        message: cycle.isOverdue
          ? `Your rent of ${amount} for ${cycle.period_start} is overdue. Please pay immediately.`
          : `Your rent of ${amount} is due on ${cycle.due_date}. Please arrange payment.`,
        sent_at: new Date().toISOString(),
      });

      remindersSent++;
    }

    // Also mark overdue cycles
    await supabaseAdmin.rpc("mark_overdue_cycles");

    return NextResponse.json({ reminders_sent: remindersSent });
  } catch (error: any) {
    console.error("Cron send-reminders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
