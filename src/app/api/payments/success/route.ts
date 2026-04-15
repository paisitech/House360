import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // SSLCommerz sends a POST with form data on success
  // This is a user-facing redirect only - IPN is the source of truth
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.redirect(
    `${appUrl}/tenant/payment-history?status=success`,
    303
  );
}
