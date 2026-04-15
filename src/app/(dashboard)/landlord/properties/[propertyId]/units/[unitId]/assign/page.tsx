import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeaseForm } from "@/components/tenants/lease-form";
import { createLease } from "@/app/(dashboard)/landlord/tenants/actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AssignTenantPage({
  params,
}: {
  params: Promise<{ propertyId: string; unitId: string }>;
}) {
  const { propertyId, unitId } = await params;
  const supabase = await createClient();

  // Fetch unit with property name
  const { data: unit } = await supabase
    .from("units")
    .select("id, unit_number, monthly_rent, status, properties(name)")
    .eq("id", unitId)
    .single();

  if (!unit) notFound();

  // Redirect if unit is not vacant
  if (unit.status !== "vacant") {
    redirect(`/landlord/properties/${propertyId}/units/${unitId}`);
  }

  // Fetch all tenants for this landlord
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, full_name, phone")
    .eq("is_active", true)
    .order("full_name");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/landlord/properties/${propertyId}/units/${unitId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Unit
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assign Tenant</h1>
        <p className="text-sm text-gray-500">
          Assign a tenant to{" "}
          <span className="font-medium">
            Unit {unit.unit_number}
          </span>{" "}
          at {(unit.properties as { name: string })?.name}
        </p>
      </div>

      {!tenants || tenants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium text-gray-900">
              No tenants available
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Add a tenant first before assigning them to a unit.
            </p>
            <Link href="/landlord/tenants/new" className="mt-4">
              <Button>Add Tenant</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6">
            <LeaseForm
              unitId={unitId}
              tenants={tenants}
              defaultRent={Number(unit.monthly_rent)}
              action={createLease}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
