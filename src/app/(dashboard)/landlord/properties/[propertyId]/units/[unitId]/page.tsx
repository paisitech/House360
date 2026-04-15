import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { UNIT_STATUSES } from "@/lib/constants";
import { ArrowLeft, Edit, DoorOpen, UserPlus } from "lucide-react";

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ propertyId: string; unitId: string }>;
}) {
  const { propertyId, unitId } = await params;
  const supabase = await createClient();

  const { data: unit } = await supabase
    .from("units")
    .select("*, properties(name)")
    .eq("id", unitId)
    .single();

  if (!unit) notFound();

  const statusInfo = UNIT_STATUSES[unit.status as keyof typeof UNIT_STATUSES];

  const { data: activeLeases } = await supabase
    .from("leases")
    .select("*, tenants(full_name, phone)")
    .eq("unit_id", unitId)
    .eq("status", "active");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/landlord/properties/${propertyId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Property
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <DoorOpen className="h-6 w-6 text-gray-400" />
            <h1 className="text-2xl font-bold text-gray-900">
              Unit {unit.unit_number}
            </h1>
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {(unit.properties as { name: string })?.name}
          </p>
        </div>
        <div className="flex gap-2">
          {unit.status === "vacant" && (
            <Link href={`/landlord/properties/${propertyId}/units/${unitId}/assign`}>
              <Button size="sm">
                <UserPlus className="mr-1 h-4 w-4" />
                Assign Tenant
              </Button>
            </Link>
          )}
          <Link href={`/landlord/properties/${propertyId}/units/${unitId}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-1 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent>
            <h3 className="text-sm font-medium text-gray-500">Monthly Rent</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(Number(unit.monthly_rent))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h3 className="text-sm font-medium text-gray-500">Details</h3>
            <p className="text-sm text-gray-700 mt-1">
              {unit.bedrooms} bed &bull; {unit.bathrooms} bath
              {unit.floor ? ` &bull; Floor ${unit.floor}` : ""}
              {unit.area_sqft ? ` &bull; ${unit.area_sqft} sqft` : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {activeLeases && activeLeases.length > 0 && (
        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Current Tenant
            </h2>
          </div>
          <CardContent>
            {activeLeases.map((lease) => (
              <div key={lease.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {(lease.tenants as { full_name: string; phone: string })?.full_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(lease.tenants as { full_name: string; phone: string })?.phone}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>Lease: {lease.start_date} - {lease.end_date || "Ongoing"}</p>
                  <p>Rent: {formatCurrency(Number(lease.monthly_rent))}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
