/*import { NextResponse } from "next/server";
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

   
    if (status !== "VALID") {
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed" })
        .eq("tran_id", tranId);

      return NextResponse.json({ message: "Payment not valid" });
    }

 
    const sslcz = createSSLCommerzClient();
    const validationResponse = await sslcz.validate({
      val_id: valId,
    });

    const isValid =
      validationResponse.status === "VALID" ||
      validationResponse.status === "VALIDATED";

    if (isValid) {
      const bodyData = Object.fromEntries(body);

     
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


      const { data: payment } = await supabaseAdmin
        .from("payments")
        .select("rent_cycle_id, amount")
        .eq("tran_id", tranId)
        .single();

      if (payment) {
  
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
*/

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

    // ❌ If not VALID → mark failed
    if (status !== "VALID") {
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed" })
        .eq("tran_id", tranId);

      return NextResponse.json({ message: "Payment not valid" });
    }

    // 🔍 Get payment from DB
    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("tran_id", tranId)
      .single();

    if (error || !payment) {
      return NextResponse.json(
        { message: "Payment not found" },
        { status: 404 }
      );
    }

    // 🔐 SSLCommerz sandbox validation
    const validationRes = await fetch(
      "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          val_id: valId,
          store_id: process.env.SSLCOMMERZ_STORE_ID!,
          store_passwd: process.env.SSLCOMMERZ_STORE_PASSWD!,
          format: "json",
        }),
      }
    );

    const validationResponse = await validationRes.json();

    const isValid =
      validationResponse.status === "VALID" ||
      validationResponse.status === "VALIDATED";

    if (!isValid) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed" })
        .eq("tran_id", tranId);

      return NextResponse.json({
        message: "Validation failed",
      });
    }

    // 🔒 Extra security checks
    if (
      validationResponse.tran_id !== tranId ||
      Number(validationResponse.amount) !== Number(payment.amount) ||
      validationResponse.currency !== "BDT"
    ) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed" })
        .eq("tran_id", tranId);

      return NextResponse.json({
        message: "Data mismatch",
      });
    }

    // 🧠 Prevent duplicate processing
    if (payment.status === "success") {
      return NextResponse.json({
        message: "Already processed",
      });
    }

    const bodyData = Object.fromEntries(body);

    // ✅ Update payment
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
        gateway_response: validationResponse, // better than raw body
        paid_at: new Date().toISOString(),
      })
      .eq("tran_id", tranId);

    // 🏠 Update rent cycle
    if (payment.rent_cycle_id) {
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

    return NextResponse.json({
      message: "Payment validated and recorded (sandbox)",
    });
  } catch (error) {
    console.error("IPN error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}