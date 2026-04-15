import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSSLCommerzClient } from "@/lib/sslcommerz/client";

function mapCardTypeToMethod(
  cardType: string | null
): "bkash" | "nagad" | "rocket" | "card" | "bank_transfer" {
  if (!cardType) return "card";
  const ct = cardType.toUpperCase();
  if (ct.includes("BKASH")) return "bkash";
  if (ct.includes("NAGAD")) return "nagad";
  if (ct.includes("ROCKET")) return "rocket";
  return "card";
}

export async function POST(request: Request) {
  try {
    const body = await request.formData();
    const tranId = body.get("tran_id") as string;
    const valId = body.get("val_id") as string;
    const status = body.get("status") as string;

    if (!tranId) {
      return NextResponse.json(
        { message: "Missing tran_id" },
        { status: 400 }
      );
    }

    // If payment is not valid, mark as failed
    if (status !== "VALID") {
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed" })
        .eq("tran_id", tranId);

      return NextResponse.json({ message: "Payment not valid" });
    }

    // Validate with SSLCommerz server (server-to-server verification)
    const sslcz = createSSLCommerzClient();
    const validationResponse = await sslcz.validate({
      val_id: valId,
    });

    const isValid =
      validationResponse.status === "VALID" ||
      validationResponse.status === "VALIDATED";

    if (isValid) {
      const bodyData = Object.fromEntries(body);

      // Update payment record
      await supabaseAdmin
        .from("payments")
        .update({
          status: "success",
          val_id: valId,
          bank_tran_id: (body.get("bank_tran_id") as string) || null,
          card_type: (body.get("card_type") as string) || null,
          card_brand: (body.get("card_brand") as string) || null,
          payment_method: mapCardTypeToMethod(
            body.get("card_type") as string
          ),
          gateway_response: bodyData,
          paid_at: new Date().toISOString(),
        })
        .eq("tran_id", tranId);

      // Get the payment to update rent cycle
      const { data: payment } = await supabaseAdmin
        .from("payments")
        .select("rent_cycle_id, amount")
        .eq("tran_id", tranId)
        .single();

      if (payment) {
        // Get current rent cycle
        const { data: cycle } = await supabaseAdmin
          .from("rent_cycles")
          .select("amount_paid")
          .eq("id", payment.rent_cycle_id)
          .single();

        const newAmountPaid =
          Number(cycle?.amount_paid || 0) + Number(payment.amount);

        await supabaseAdmin
          .from("rent_cycles")
          .update({
            amount_paid: newAmountPaid,
            status: "paid",
            paid_at: new Date().toISOString(),
          })
          .eq("id", payment.rent_cycle_id);
      }

      return NextResponse.json({ message: "Payment validated and recorded" });
    }

    // Validation failed
    await supabaseAdmin
      .from("payments")
      .update({ status: "failed" })
      .eq("tran_id", tranId);

    return NextResponse.json({ message: "Payment validation failed" });
  } catch (error) {
    console.error("IPN error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
