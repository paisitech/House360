import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Generate for next month (this runs on 25th of each month)
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);

    const { data: cyclesCreated, error } = await supabaseAdmin.rpc(
      "generate_rent_cycles",
      {
        target_month: nextMonth.toISOString().split("T")[0],
      }
    );

    // Also mark overdue cycles
    const { data: overdueMarked } = await supabaseAdmin.rpc(
      "mark_overdue_cycles"
    );

    return NextResponse.json({
      cycles_created: cyclesCreated,
      overdue_marked: overdueMarked,
      error: error?.message || null,
    });
  } catch (error: any) {
    console.error("Cron generate-rent-cycles error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
