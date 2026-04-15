import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.redirect(
    `${appUrl}/tenant/rent-due?status=failed`,
    303
  );
}
