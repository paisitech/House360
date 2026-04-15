import Link from "next/link";
import { Building2 } from "lucide-react";

export function PublicNavbar() {
  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">House360</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/listings"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Listings
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
