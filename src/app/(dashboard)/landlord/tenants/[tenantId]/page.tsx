import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LEASE_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { ArrowLeft, Edit, Users, Phone, Mail, Plus } from "lucide-react";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single();

  if (!tenant) notFound();

  const { data: leases } = await supabase
    .from("leases")
    .select("*, units(unit_number, properties(name))")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  const { data: recentCycles } = await supabase
    .from("rent_cycles")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("period_start", { ascending: false })
    .limit(6);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/landlord/tenants">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
            <Users className="h-7 w-7 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {tenant.full_name}
            </h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {tenant.phone}
              </span>
              {tenant.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {tenant.email}
                </span>
              )}
            </div>
          </div>
        </div>
        <Link href={`/landlord/tenants/${tenantId}/edit`}>
          <Button variant="outline" size="sm">
            <Edit className="mr-1 h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Leases */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Leases</h2>
          <Link href={`/landlord/tenants/${tenantId}/lease/new`}>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Create Lease
            </Button>
          </Link>
        </div>
        <CardContent>
          {leases && leases.length > 0 ? (
            <div className="space-y-3">
              {leases.map((lease) => {
                const statusInfo =
                  LEASE_STATUSES[
                    lease.status as keyof typeof LEASE_STATUSES
                  ];
                return (
                  <div
                    key={lease.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Unit {(lease.units as any)?.unit_number} at{" "}
                        {(lease.units as any)?.properties?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(lease.start_date)} -{" "}
                        {lease.end_date
                          ? formatDate(lease.end_date)
                          : "Ongoing"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(Number(lease.monthly_rent))}
                        <span className="text-xs font-normal text-gray-400">
                          /mo
                        </span>
                      </p>
                      <Badge className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">
              No leases found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Rent Cycles */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Rent Cycles
          </h2>
        </div>
        <CardContent>
          {recentCycles && recentCycles.length > 0 ? (
            <div className="space-y-3">
              {recentCycles.map((cycle) => {
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
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(Number(cycle.amount_paid))} /{" "}
                        {formatCurrency(Number(cycle.amount_due))}
                      </p>
                      <Badge className={statusInfo?.color}>
                        {statusInfo?.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">
              No rent cycles yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
