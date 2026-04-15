import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeaseForm } from "@/components/tenants/lease-form";
import { createLease } from "../../../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewLeasePage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const supabase = await createClient();

  // Fetch tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, full_name")
    .eq("id", tenantId)
    .single();

  if (!tenant) notFound();

  // Fetch vacant units for this landlord (with property names)
  const { data: vacantUnits } = await supabase
    .from("units")
    .select("id, unit_number, monthly_rent, properties(name)")
    .eq("status", "vacant")
    .order("unit_number");

  const formattedUnits = (vacantUnits ?? []).map((u) => ({
    id: u.id,
    unit_number: u.unit_number,
    monthly_rent: Number(u.monthly_rent),
    property_name: (u.properties as { name: string })?.name ?? "Unknown",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/landlord/tenants/${tenantId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Tenant
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Lease</h1>
        <p className="text-sm text-gray-500">
          Assign <span className="font-medium">{tenant.full_name}</span> to a
          vacant unit
        </p>
      </div>

      {formattedUnits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium text-gray-900">
              No vacant units available
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              All units are currently occupied. Add a new unit or free up an
              existing one first.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6">
            <LeaseForm
              tenantId={tenantId}
              vacantUnits={formattedUnits}
              action={createLease}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
