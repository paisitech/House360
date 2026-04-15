import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Building2,
  DoorOpen,
  Users,
  CreditCard,
  AlertTriangle,
  Clock,
} from "lucide-react";

export default async function LandlordDashboard() {
  const supabase = await createClient();

  const { data: landlord } = await supabase
    .from("landlords")
    .select("id")
    .single();

  if (!landlord) {
    return <div>Loading...</div>;
  }

  // Fetch stats in parallel
  const [
    { count: propertyCount },
    { data: units },
    { count: tenantCount },
    { data: currentCycles },
    { count: pendingVerifications },
    { data: recentPayments },
  ] = await Promise.all([
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true }),
    supabase.from("units").select("status"),
    supabase
      .from("tenants")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("rent_cycles")
      .select("amount_due, amount_paid, status")
      .gte("period_start", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .lt("period_start", new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()),
    supabase
      .from("manual_payments")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "pending"),
    supabase
      .from("payments")
      .select("*, tenants(full_name), rent_cycles(period_start, period_end)")
      .eq("status", "success")
      .order("paid_at", { ascending: false })
      .limit(5),
  ]);

  const totalUnits = units?.length || 0;
  const occupiedUnits = units?.filter((u) => u.status === "occupied").length || 0;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  const totalDue = currentCycles?.reduce((s, c) => s + Number(c.amount_due), 0) || 0;
  const totalCollected = currentCycles?.reduce((s, c) => s + Number(c.amount_paid), 0) || 0;
  const overdueCount = currentCycles?.filter((c) => c.status === "late").length || 0;

  const stats = [
    {
      label: "Properties",
      value: propertyCount || 0,
      icon: Building2,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Total Units",
      value: `${occupiedUnits}/${totalUnits}`,
      icon: DoorOpen,
      color: "text-green-600 bg-green-50",
      sub: `${occupancyRate}% occupied`,
    },
    {
      label: "Active Tenants",
      value: tenantCount || 0,
      icon: Users,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "This Month Collection",
      value: formatCurrency(totalCollected),
      icon: CreditCard,
      color: "text-emerald-600 bg-emerald-50",
      sub: `of ${formatCurrency(totalDue)} due`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your rental portfolio</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-start gap-4">
              <div className={`rounded-lg p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                {stat.sub && (
                  <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts Row */}
      <div className="grid gap-4 sm:grid-cols-2">
        {overdueCount > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  {overdueCount} overdue rent{overdueCount > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-red-600">Requires attention</p>
              </div>
            </CardContent>
          </Card>
        )}
        {(pendingVerifications || 0) > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  {pendingVerifications} payment{(pendingVerifications || 0) > 1 ? "s" : ""} pending verification
                </p>
                <p className="text-xs text-yellow-600">Review uploaded screenshots</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Payments */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Payments
          </h2>
        </div>
        <CardContent>
          {recentPayments && recentPayments.length > 0 ? (
            <div className="space-y-3">
              {recentPayments.map((payment: Record<string, unknown>) => (
                <div
                  key={payment.id as string}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {(payment.tenants as Record<string, unknown>)?.full_name as string}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.payment_method as string} &bull;{" "}
                      {payment.paid_at ? formatDate(payment.paid_at as string) : "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">
                      {formatCurrency(Number(payment.amount))}
                    </p>
                    <Badge variant="success">Paid</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">
              No recent payments
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
