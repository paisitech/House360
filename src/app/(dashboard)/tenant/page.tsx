import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_STATUSES } from "@/lib/constants";
import { Home, CreditCard, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function TenantDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get tenant record
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Home className="h-12 w-12 text-gray-300" />
        <h2 className="mt-4 text-lg font-medium text-gray-900">
          Not yet linked
        </h2>
        <p className="mt-1 text-sm text-gray-500 text-center max-w-md">
          Your account has not been linked to a property yet. Please ask your
          landlord to add you as a tenant using your email address.
        </p>
      </div>
    );
  }

  // Get active lease
  const { data: activeLease } = await supabase
    .from("leases")
    .select("*, units(unit_number, monthly_rent, properties(name, address))")
    .eq("tenant_id", tenant.id)
    .eq("status", "active")
    .single();

  // Get current/upcoming rent cycles
  const { data: currentCycles } = await supabase
    .from("rent_cycles")
    .select("*")
    .eq("tenant_id", tenant.id)
    .in("status", ["due", "late", "pending_verification"])
    .order("due_date");

  // Recent payments
  const { data: recentPayments } = await supabase
    .from("payments")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("status", "success")
    .order("paid_at", { ascending: false })
    .limit(3);

  const overdueCycles = currentCycles?.filter((c) => c.status === "late") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Your rental overview</p>
      </div>

      {/* Active Lease Info */}
      {activeLease && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-100 p-2.5">
              <Home className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">
                {(activeLease.units as any)?.properties?.name}
              </p>
              <p className="text-lg font-bold text-blue-900">
                Unit {(activeLease.units as any)?.unit_number}
              </p>
              <p className="text-sm text-blue-700">
                Rent: {formatCurrency(Number(activeLease.monthly_rent))} / month
                &bull; Due on day {activeLease.rent_due_day}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue Alert */}
      {overdueCycles.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">
                You have {overdueCycles.length} overdue payment
                {overdueCycles.length > 1 ? "s" : ""}
              </p>
              <Link
                href="/tenant/rent-due"
                className="text-xs text-red-600 hover:underline"
              >
                Pay now &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Pending Payments</p>
              <p className="text-xl font-bold text-gray-900">
                {currentCycles?.length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-xl font-bold text-gray-900">
                {overdueCycles.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Last Payment</p>
              <p className="text-sm font-medium text-gray-900">
                {recentPayments?.[0]
                  ? formatDate(recentPayments[0].paid_at!)
                  : "None"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Due */}
      {currentCycles && currentCycles.length > 0 && (
        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Current Dues
            </h2>
          </div>
          <CardContent>
            <div className="space-y-3">
              {currentCycles.map((cycle) => {
                const statusInfo =
                  PAYMENT_STATUSES[
                    cycle.status as keyof typeof PAYMENT_STATUSES
                  ];
                return (
                  <div
                    key={cycle.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(cycle.period_start)} -{" "}
                        {formatDate(cycle.period_end)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Due: {formatDate(cycle.due_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency(
                            Number(cycle.amount_due) -
                              Number(cycle.amount_paid)
                          )}
                        </p>
                        <Badge className={statusInfo?.color}>
                          {statusInfo?.label}
                        </Badge>
                      </div>
                      {cycle.status !== "pending_verification" && (
                        <Link
                          href={`/tenant/rent-due`}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                        >
                          Pay
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
