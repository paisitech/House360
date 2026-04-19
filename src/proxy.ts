import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // Protect dashboard routes - redirect to login if not authenticated
  if (
    !user &&
    (pathname.startsWith("/landlord") || pathname.startsWith("/tenant"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If logged in, redirect from login/signup to appropriate dashboard
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const dest = profile?.role === "landlord" ? "/landlord" : "/tenant";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Role-based route protection
  if (user && pathname.startsWith("/landlord")) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "landlord") {
      return NextResponse.redirect(new URL("/tenant", request.url));
    }
  }

  if (user && pathname.startsWith("/tenant")) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "tenant") {
      return NextResponse.redirect(new URL("/landlord", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/landlord/:path*", "/tenant/:path*", "/login", "/signup"],
};
