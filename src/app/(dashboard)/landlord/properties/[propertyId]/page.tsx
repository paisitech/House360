import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BuildingVisual } from "@/components/properties/building-visual";
import { createUnit, updateUnit, toggleUnitListing } from "./units/actions";
import { createLease } from "@/app/(dashboard)/landlord/tenants/actions";
import { ArrowLeft, Plus, Edit, DoorOpen, MapPin } from "lucide-react";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single();

  if (!property) notFound();

  const { data: units } = await supabase
    .from("units")
    .select("*")
    .eq("property_id", propertyId)
    .order("floor")
    .order("unit_number");

  // Fetch active leases with tenant info
  const unitIds = (units ?? []).map((u) => u.id);
  const { data: leases } = unitIds.length > 0
    ? await supabase
        .from("leases")
        .select("id, unit_id, monthly_rent, start_date, end_date, rent_due_day, status, tenants(id, full_name, phone, email)")
        .eq("status", "active")
        .in("unit_id", unitIds)
    : { data: [] };

  // Build lease map
  const leaseMap: Record<string, { tenantName: string; tenantPhone: string; tenantEmail: string | null; tenantId: string; leaseId: string; rent: number; startDate: string; endDate: string | null; rentDueDay: number }> = {};
  for (const lease of leases ?? []) {
    const tenant = lease.tenants as unknown as { id: string; full_name: string; phone: string; email: string | null } | null;
    if (tenant) {
      leaseMap[lease.unit_id] = {
        tenantName: tenant.full_name,
        tenantPhone: tenant.phone,
        tenantEmail: tenant.email,
        tenantId: tenant.id,
        leaseId: lease.id,
        rent: Number(lease.monthly_rent),
        startDate: lease.start_date,
        endDate: lease.end_date,
        rentDueDay: lease.rent_due_day,
      };
    }
  }

  // Fetch all active tenants for assignment
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, full_name, phone")
    .eq("is_active", true)
    .order("full_name");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/landlord/properties">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4 text-gray-400" />
            <p className="text-sm text-gray-500">
              {property.address}, {property.area ? `${property.area}, ` : ""}
              {property.city}
            </p>
          </div>
        </div>
        <Link href={`/landlord/properties/${propertyId}/edit`}>
          <Button variant="outline" size="sm">
            <Edit className="mr-1 h-4 w-4" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Units Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Units ({units?.length || 0})
        </h2>
      </div>

      {units && units.length > 0 ? (
        <BuildingVisual
          units={units}
          propertyId={propertyId}
          leaseMap={leaseMap}
          tenants={tenants ?? []}
          updateUnitAction={updateUnit}
          createUnitAction={createUnit}
          createLeaseAction={createLease}
          toggleListingAction={toggleUnitListing}
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DoorOpen className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No units yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Add units to this property.
            </p>
            <Link
              href={`/landlord/properties/${propertyId}/units/new`}
              className="mt-4"
            >
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Unit
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
