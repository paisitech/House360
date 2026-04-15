import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
//import { createSSLCommerzClient } from "@/lib/sslcommerz/client";
import { generateTranId } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rent_cycle_id } = await request.json();

    if (!rent_cycle_id) {
      return NextResponse.json(
        { error: "rent_cycle_id is required" },
        { status: 400 }
      );
    }

    // Get tenant record
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, landlord_id, full_name, email, phone")
      .eq("user_id", user.id)
      .single();

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant profile not found" },
        { status: 404 }
      );
    }

    // Get rent cycle and verify it belongs to this tenant
    const { data: rentCycle } = await supabase
      .from("rent_cycles")
      .select("*, units(unit_number, properties(name))")
      .eq("id", rent_cycle_id)
      .eq("tenant_id", tenant.id)
      .single();

    if (!rentCycle) {
      return NextResponse.json(
        { error: "Rent cycle not found" },
        { status: 404 }
      );
    }

    if (rentCycle.status === "paid") {
      return NextResponse.json(
        { error: "This rent is already paid" },
        { status: 400 }
      );
    }

    const amount = Number(rentCycle.amount_due) - Number(rentCycle.amount_paid);
    const tranId = generateTranId();

    // Create payment record using admin client (bypasses RLS for insert)
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        rent_cycle_id,
        tenant_id: tenant.id,
        landlord_id: tenant.landlord_id,
        amount,
        payment_method: "card", // Will be updated by IPN with actual method
        status: "initiated",
        tran_id: tranId,
      })
      .select()
      .single();

    if (paymentError) {
      return NextResponse.json(
        { error: paymentError.message },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const unitInfo = rentCycle.units as any;

    // Initialize SSLCommerz
    // const sslcz = createSSLCommerzClient();
    // const response = await sslcz.init({
    //   total_amount: amount,
    //   currency: "BDT",
    //   tran_id: tranId,
    //   success_url: `${appUrl}/api/payments/success`,
    //   fail_url: `${appUrl}/api/payments/fail`,
    //   cancel_url: `${appUrl}/api/payments/cancel`,
    //   ipn_url: `${appUrl}/api/payments/ipn`,
    //   product_name: `Rent - ${unitInfo?.properties?.name || "Property"} Unit ${unitInfo?.unit_number || ""}`,
    //   product_category: "Rent",
    //   product_profile: "non-physical-goods",
    //   cus_name: tenant.full_name,
    //   cus_email: tenant.email || "tenant@house360.com",
    //   cus_phone: tenant.phone,
    //   cus_add1: "Bangladesh",
    //   cus_city: "Dhaka",
    //   cus_country: "Bangladesh",
    //   shipping_method: "NO",
    //   num_of_item: 1,
    //   value_a: payment.id, // Pass payment ID for reference
    //   value_b: rent_cycle_id,
    // });

    // if (response?.GatewayPageURL) {
    //   return NextResponse.json({ url: response.GatewayPageURL });
    // }
    // Initialize SSLCommerz (using fetch instead of sdk)
const response = await fetch(
  "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      store_id: process.env.SSLCOMMERZ_STORE_ID!,
      store_passwd: process.env.SSLCOMMERZ_STORE_PASSWD!,
      total_amount: amount.toString(),
      currency: "BDT",
      tran_id: tranId,
      success_url: `${appUrl}/api/payments/success`,
      fail_url: `${appUrl}/api/payments/fail`,
      cancel_url: `${appUrl}/api/payments/cancel`,
      ipn_url: `${appUrl}/api/payments/ipn`,
      product_name: `Rent - ${unitInfo?.properties?.name || "Property"} Unit ${unitInfo?.unit_number || ""}`,
      product_category: "Rent",
      product_profile: "non-physical-goods",
      cus_name: tenant.full_name,
      cus_email: tenant.email || "tenant@house360.com",
      cus_phone: tenant.phone,
      cus_add1: "Bangladesh",
      cus_city: "Dhaka",
      cus_country: "Bangladesh",
      shipping_method: "NO",
      num_of_item: "1",
      value_a: payment.id,
      value_b: rent_cycle_id,
    }),
  }
);

const data = await response.json();

    if (data?.GatewayPageURL) {
  return NextResponse.json({ url: data.GatewayPageURL });
}

    return NextResponse.json(
      { error: "Failed to initialize payment gateway" },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Payment create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
