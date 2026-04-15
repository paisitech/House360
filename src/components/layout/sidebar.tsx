"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  LayoutDashboard,
  Home,
  Users,
  CreditCard,
  BarChart3,
  Receipt,
  Upload,
  Clock,
  FileText,
  Menu,
  X,
} from "lucide-react";

const landlordLinks = [
  { href: "/landlord", label: "Dashboard", icon: LayoutDashboard },
  { href: "/landlord/properties", label: "Properties", icon: Home },
  { href: "/landlord/tenants", label: "Tenants", icon: Users },
  { href: "/landlord/payments", label: "Payments", icon: CreditCard },
  { href: "/landlord/applications", label: "Applications", icon: FileText },
  { href: "/landlord/reports", label: "Reports", icon: BarChart3 },
];

const tenantLinks = [
  { href: "/tenant", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tenant/rent-due", label: "Rent Due", icon: Receipt },
  { href: "/tenant/payment-history", label: "Payment History", icon: Clock },
  { href: "/tenant/upload-screenshot", label: "Upload Screenshot", icon: Upload },
];

interface SidebarProps {
  role: "landlord" | "tenant";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = role === "landlord" ? landlordLinks : tenantLinks;

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on escape key
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const navContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-7 w-7 text-blue-600" />
          <span className="text-lg font-bold text-gray-900">House360</span>
        </div>
        {/* Close button — mobile only */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => {
          const isActive =
            link.href === `/${role}`
              ? pathname === link.href
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-40 rounded-lg border border-gray-200 bg-white p-2 shadow-sm lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </button>

      {/* Desktop sidebar — always visible */}
      <aside className="hidden lg:flex h-full w-64 flex-col border-r bg-white shrink-0">
        {navContent}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile sidebar — slides in */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl transition-transform duration-200 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
